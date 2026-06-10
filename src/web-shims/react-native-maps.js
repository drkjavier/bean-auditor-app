import React from 'react';

// Very small mock of react-native-maps for web rendering in tests/dev.
const lastProps = { props: null };

export function __getLastProps() { return lastProps.props; }
export function __getAnimateMock() { return (fn) => fn; }

const MapView = (props) => {
  // record props for tests
  try { lastProps.props = props; } catch (_) {}
  return React.createElement('div', props, props.children);
};

const Marker = (props) => {
  try { lastProps.props = props; } catch (_) {}
  return React.createElement('div', props, props.children);
};

export default { __getLastProps, __getAnimateMock, MapView, Marker, PROVIDER_GOOGLE: 'google' };
