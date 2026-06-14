import React from 'react';

/**
 * Web shim for react-native-vector-icons/MaterialCommunityIcons.
 *
 * On web, icons are rendered via @mdi/font CSS glyphs (see MdiIcon.tsx),
 * so the native vector-icons library is never actually used. This shim
 * provides a stub component to prevent Rolldown from parsing the native
 * package (which contains JSX in .js files that Rolldown cannot handle).
 */
function MaterialCommunityIcons({ name: _name, size: _size = 20, color: _color = '#000', ..._rest }) {
  return null;
}

MaterialCommunityIcons.displayName = 'MaterialCommunityIcons';

export default MaterialCommunityIcons;
