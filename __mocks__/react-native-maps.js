import React from 'react';
import { View } from 'react-native';

export const PROVIDER_GOOGLE = 'google';

let animateToRegionMock = jest.fn();

export function __getAnimateMock() {
  return animateToRegionMock;
}

export default class MapView extends React.Component {
  constructor(props) {
    super(props);
    // instance method proxies to module-level mock so tests can assert
    this.animateToRegion = (...args) => animateToRegionMock(...args);
  }
  render() {
    return React.createElement(View, { testID: 'MapView', children: this.props.children });
  }
}

export function Marker(props) {
  return React.createElement(View, { testID: `Marker-${props.coordinate?.latitude}-${props.coordinate?.longitude}` });
}
