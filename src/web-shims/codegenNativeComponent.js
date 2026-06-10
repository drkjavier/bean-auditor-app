import React from 'react';
import { View } from 'react-native';

// Minimal shim for react-native codegenNativeComponent used by some libs when
// running on web. Returns a functional component that renders a react-native
// View so react-native-web handles style props correctly instead of a raw div.
export default function codegenNativeComponent(name, _opts) {
  const Comp = (props) => React.createElement(View, props, props.children);
  try { Comp.displayName = typeof name === 'string' ? name : 'NativeComponent'; } catch (_) {}
  return Comp;
}
