import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { Text } from 'react-native';
import SettingsScreen from '../src/presentation/screens/SettingsScreen';
import { useSettingsStore } from '../src/state/settingsStore';

describe('SettingsScreen toggle', () => {
  beforeEach(() => {
    // reset store
    useSettingsStore.setState({ showUserLocation: false });
  });

  test('toggles showUserLocation', async () => {
    let tree: any;
    await act(async () => {
      tree = renderer.create(<SettingsScreen />);
    });

    // find the Text node that shows the toggle label
    const texts = tree.root.findAllByType(Text);
    const toggleText = texts.find((t: any) => t.props.children === 'Visible' || t.props.children === 'Oculto');
    expect(toggleText).toBeTruthy();

    // walk up the tree from that text node until we find an ancestor with an onPress handler
    let node: any = toggleText;
    while (node && typeof node.props?.onPress !== 'function') {
      node = node.parent;
    }

    expect(node).toBeTruthy();
    expect(typeof node.props.onPress).toBe('function');

    // initial state false
    expect(useSettingsStore.getState().showUserLocation).toBe(false);

    await act(async () => {
      node.props.onPress();
    });

    expect(useSettingsStore.getState().showUserLocation).toBe(true);
  });
});
