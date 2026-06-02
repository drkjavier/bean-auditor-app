import React from 'react';
import { View } from 'react-native';

export const PROVIDER_GOOGLE = 'google';

let animateToRegionMock = jest.fn();

export function __getAnimateMock() {
  return animateToRegionMock;
}

let lastRenderProps = null;
export function __getLastProps() {
  return lastRenderProps;
}

export default class MapView extends React.Component {
  constructor(props) {
    super(props);
    // instance method proxies to module-level mock so tests can assert
    this.animateToRegion = (...args) => animateToRegionMock(...args);
    this.setNativeProps = (..._args) => {};
  }
  render() {
    // capture the last render props so tests can assert on them
    lastRenderProps = this.props;
    return React.createElement(View, { testID: 'MapView', children: this.props.children });
  }
}

export function Marker(props) {
  return React.createElement(View, { testID: `Marker-${props.coordinate?.latitude}-${props.coordinate?.longitude}` });
}
