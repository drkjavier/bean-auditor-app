/**
 * DatabaseDebugPanel - Debug panel for viewing SQLite data.
 *
 * Uses sql.js for real SQLite queries.
 * Only visible in development mode.
 *
 * Usage:
 * ```tsx
 * <DatabaseDebugPanel />
 * ```
 */

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../themes/ThemeContext';
import MdiIcon from './MdiIcon';

type TableInfo = {
  name: string;
  rowCount: number;
};

type SqlJsDatabase = {
  exec: (sql: string) => Array<{ columns: string[]; values: unknown[][] }>;
  run: (sql: string) => void;
};

declare global {
  interface Window {
    __sqlDb?: SqlJsDatabase;
  }
}

function getDb(): SqlJsDatabase | null {
  if (typeof window !== 'undefined' && window.__sqlDb) {
    return window.__sqlDb;
  }
  return null;
}

export default function DatabaseDebugPanel() {
  const { colors, typography, radii } = useTheme();
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [expandedTable, setExpandedTable] = useState<string | null>(null);
  const [tableData, setTableData] = useState<Record<string, unknown[]>>({});
  const [refreshKey, setRefreshKey] = useState(0);

  // Load tables
  useEffect(() => {
    const db = getDb();
    if (!db) return;

    try {
      // Get all tables
      const result = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
      if (result.length > 0 && result[0].values) {
        const tableList: TableInfo[] = result[0].values.map((row: unknown[]) => ({
          name: row[0] as string,
          rowCount: 0,
        }));

        // Get row counts
        tableList.forEach(table => {
          const countResult = db.exec(`SELECT COUNT(*) FROM "${table.name}"`);
          if (countResult.length > 0) {
            table.rowCount = countResult[0].values[0][0] as number;
          }
        });

        setTables(tableList);
      }
    } catch (err) {
      console.error('Failed to load tables:', err);
    }
  }, [refreshKey]);

  // Load expanded table data
  useEffect(() => {
    if (!expandedTable) {
      setTableData({});
      return;
    }

    const db = getDb();
    if (!db) return;

    try {
      const result = db.exec(`SELECT * FROM "${expandedTable}" LIMIT 20`);
      if (result.length > 0) {
        const columns = result[0].columns;
        const rows = result[0].values.map((values: unknown[]) => {
          const obj: Record<string, unknown> = {};
          columns.forEach((col: string, i: number) => {
            obj[col] = values[i];
          });
          return obj;
        });
        setTableData({ [expandedTable]: rows });
      }
    } catch (err) {
      console.error('Failed to load table data:', err);
    }
  }, [expandedTable]);

  const handleRefresh = () => {
    setRefreshKey(k => k + 1);
    setExpandedTable(null);
  };

  const handleClear = () => {
    const db = getDb();
    if (!db) return;

    try {
      const result = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
      if (result.length > 0 && result[0].values) {
        result[0].values.forEach((row: unknown[]) => {
          db.run(`DELETE FROM "${row[0]}"`);
        });
      }
      setTables([]);
      setExpandedTable(null);
    } catch (err) {
      console.error('Clear failed:', err);
    }
  };

  // Don't render in production
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  const expandedData = expandedTable ? tableData[expandedTable] || [] : [];

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderRadius: radii.md }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MdiIcon name="database" size={18} color={colors.primary} />
          <Text style={[styles.title, { color: colors.textPrimary, ...typography.subtitle }]}>
            SQLite Database
          </Text>
        </View>
        <View style={styles.headerRight}>
          <Pressable
            style={[styles.headerBtn, { backgroundColor: colors.primary }]}
            onPress={handleRefresh}
            accessibilityLabel="Refrescar"
          >
            <MdiIcon name="refresh" size={16} color={colors.textButton} />
          </Pressable>
          <Pressable
            style={[styles.headerBtn, { backgroundColor: colors.error }]}
            onPress={handleClear}
            accessibilityLabel="Limpiar base de datos"
          >
            <MdiIcon name="delete" size={16} color={colors.textButton} />
          </Pressable>
        </View>
      </View>

      {/* Tables */}
      <ScrollView style={styles.tableList}>
        {tables.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.textCaption, ...typography.caption }]}>
            No hay tablas. La base de datos se crea al primer uso.
          </Text>
        ) : (
          tables.map(table => (
            <View key={table.name} style={styles.tableItem}>
              {/* Table Header */}
              <Pressable
                style={[
                  styles.tableHeader,
                  { borderBottomColor: colors.border },
                  expandedTable === table.name && { backgroundColor: colors.primaryTonal },
                ]}
                onPress={() => setExpandedTable(expandedTable === table.name ? null : table.name)}
              >
                <View style={styles.tableHeaderLeft}>
                  <MdiIcon
                    name={expandedTable === table.name ? 'chevron-down' : 'chevron-right'}
                    size={18}
                    color={colors.textSecondary}
                  />
                  <Text style={[styles.tableName, { color: colors.textPrimary, ...typography.body }]}>
                    {table.name}
                  </Text>
                </View>
                <View style={[styles.rowBadge, { backgroundColor: colors.primary }]}>
                  <Text style={[styles.rowBadgeText, { color: colors.textButton }]}>
                    {table.rowCount}
                  </Text>
                </View>
              </Pressable>

              {/* Table Rows */}
              {expandedTable === table.name && (
                <View style={styles.tableContent}>
                  {expandedData.length === 0 ? (
                    <Text style={[styles.emptyRows, { color: colors.textCaption, ...typography.caption }]}>
                      (vacía)
                    </Text>
                  ) : (
                    <ScrollView horizontal showsHorizontalScrollIndicator>
                      <View>
                        {/* Header Row */}
                        {expandedData.length > 0 && (
                          <View style={[styles.dataRow, styles.headerRow, { backgroundColor: colors.border }]}>
                            {Object.keys(expandedData[0] as Record<string, unknown>).map(col => (
                              <Text key={col} style={[styles.cell, styles.headerCell, { color: colors.textPrimary, ...typography.caption }]}>
                                {col}
                              </Text>
                            ))}
                          </View>
                        )}
                        {/* Data Rows */}
                        {expandedData.map((row, idx) => (
                          <View
                            key={idx}
                            style={[styles.dataRow, idx % 2 === 0 && { backgroundColor: colors.surface }]}
                          >
                            {Object.values(row as Record<string, unknown>).map((val, i) => (
                              <Text key={i} style={[styles.cell, { color: colors.textSecondary, ...typography.caption }]} numberOfLines={1}>
                                {val === null ? 'NULL' : String(val).substring(0, 30)}
                              </Text>
                            ))}
                          </View>
                        ))}
                      </View>
                    </ScrollView>
                  )}
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <Text style={[styles.footerText, { color: colors.textCaption, ...typography.caption }]}>
          {tables.reduce((acc, t) => acc + t.rowCount, 0)} registros totales
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  headerBtn: {
    padding: 6,
    borderRadius: 4,
  },
  title: {},
  tableList: {
    maxHeight: 400,
  },
  emptyText: {
    padding: 16,
    textAlign: 'center',
  },
  tableItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  tableHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tableName: {
    fontWeight: '600',
  },
  rowBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  rowBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  tableContent: {
    paddingBottom: 8,
  },
  emptyRows: {
    padding: 12,
    textAlign: 'center',
  },
  dataRow: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  headerRow: {
    borderBottomWidth: 1,
  },
  cell: {
    minWidth: 100,
    maxWidth: 150,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: '#e0e0e0',
  },
  headerCell: {
    fontWeight: '700',
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  footer: {
    padding: 8,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  footerText: {},
});
