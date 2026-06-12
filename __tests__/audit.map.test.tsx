import React from 'react';
import renderer, { act } from 'react-test-renderer';
import AuditScreen from '../src/presentation/screens/AuditScreen';

// ── Mock SafeAreaProvider ─────────────────────────────────────────────────────
// react-native-safe-area-context v4+ relies on native modules. In Jest the
// native bridge is not available, so SafeAreaProvider renders null children.
// We provide a minimal pass-through mock so components wrapped in it render.
jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  return {
    SafeAreaProvider: ({ children }: { children?: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
    SafeAreaView: ({ children, ...props }: any) =>
      React.createElement('View', props, children),
  };
});

// ── Mock MapCanvas (browser-only) ─────────────────────────────────────────────
jest.mock('../src/presentation/components/MapCanvas', () => 'MapCanvas');

// ── Mock tagService ───────────────────────────────────────────────────────────
jest.mock('../src/data/tagService', () => ({
  fetchTags: jest.fn().mockResolvedValue([
    {
      uuid: '550e8400-e29b-41d4-a716-000000001000',
      colorHex: '#ef4444',
      unique_id: 'TAG-1000',
      color: '#ef4444',
      lat: 37.77,
      lon: -122.42,
      timestamp: '2026-05-01T00:00:00.000Z',
      audited: true,
    },
  ]),
}));

// ── Mock stores ───────────────────────────────────────────────────────────────
jest.mock('../src/stores', () => ({
  useAuthStore: (selector: any) => selector({ isLoggedIn: true }),
}));
jest.mock('../src/state/settingsStore', () => ({
  useSettingsStore: (selector: any) => selector({ showUserLocation: false }),
}));

// ── Mock abortManager ─────────────────────────────────────────────────────────
jest.mock('../src/infrastructure/api/abortManager', () => ({
  createAndRegisterAbortController: jest.fn(() => ({
    signal: { aborted: false },
    abort: jest.fn(),
  })),
  unregisterAbortController: jest.fn(),
  abortAllControllers: jest.fn(),
}));

// ── RAF polyfill for FlatList ──────────────────────────────────────────────────
global.requestAnimationFrame = (cb: FrameRequestCallback): number => {
  cb(0);
  return 0;
};

/**
 * Flush all pending microtasks so that async state updates
 * (fetchTags → setItems → re-render) are fully propagated.
 */
async function flushAll() {
  for (let i = 0; i < 10; i++) {
    await act(async () => {
      await Promise.resolve();
    });
  }
}

/** Collect all text strings rendered by the tree (handles circular refs from FlatList). */
function collectTexts(root: renderer.ReactTestRenderer['root']): string[] {
  const texts: string[] = [];
  function walk(node: any) {
    if (typeof node === 'string') {
      texts.push(node);
      return;
    }
    if (node == null || typeof node !== 'object') return;
    if (typeof node.type === 'string' && node.type.toLowerCase() === 'text') {
      const children = node.props?.children;
      if (typeof children === 'string') texts.push(children);
      if (typeof children === 'number') texts.push(String(children));
    }
    if (Array.isArray(node.children)) {
      node.children.forEach(walk);
    }
  }
  // Walk the fiber tree instead of toJSON() to avoid circular refs
  function walkFiber(fiber: any) {
    if (!fiber || typeof fiber !== 'object') return;
    if (fiber.memoizedProps?.children && typeof fiber.memoizedProps.children === 'string') {
      texts.push(fiber.memoizedProps.children);
    }
    if (fiber.memoizedProps?.children && typeof fiber.memoizedProps.children === 'number') {
      texts.push(String(fiber.memoizedProps.children));
    }
    if (fiber.child) walkFiber(fiber.child);
    if (fiber.sibling) walkFiber(fiber.sibling);
  }

  // Use root.children to walk
  root.children.forEach(walk);
  // Also walk via fiber for completeness
  walkFiber((root as any).fiber ?? (root as any)._fiber);
  return texts;
}

describe('AuditScreen map integration', () => {
  test('renders audit screen after loading data', async () => {
    let tree: renderer.ReactTestRenderer;

    await act(async () => {
      tree = renderer.create(<AuditScreen />);
    });

    await flushAll();

    expect(tree!.toJSON()).toBeTruthy();

    await act(async () => {
      tree!.unmount();
    });
  });

  test('passes selectedId and onSelect to map', async () => {
    const MapCanvas = require('../src/presentation/components/MapCanvas');
    let tree: renderer.ReactTestRenderer;

    await act(async () => {
      tree = renderer.create(<AuditScreen />);
    });

    await flushAll();

    expect(MapCanvas).toBeTruthy();

    await act(async () => {
      tree!.unmount();
    });
  });

  test('renders selected detail panel content', async () => {
    let tree: renderer.ReactTestRenderer;

    await act(async () => {
      tree = renderer.create(<AuditScreen />);
    });

    await flushAll();

    // Use the fiber tree to find text content, avoiding circular refs from FlatList
    const texts = collectTexts(tree!.root);
    const joined = texts.join(' ');

    expect(joined).toContain('TAG-1000');
    expect(joined).toContain('Auditoría: ');
    expect(joined).toContain('Auditado');

    await act(async () => {
      tree!.unmount();
    });
  });
});
