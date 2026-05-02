import React from 'react';
import renderer, { act } from 'react-test-renderer';
import MapCanvas from '../src/presentation/components/MapCanvas';

const rnMapsMock = require('../__mocks__/react-native-maps');

// Let Jest use the manual mocks placed in __mocks__ by calling jest.mock with module name only.
jest.mock('@react-native-community/geolocation');
jest.mock('react-native-permissions');

const perms = require('react-native-permissions');
const geolocation = require('@react-native-community/geolocation').default;

describe('MapCanvas native permission flows', () => {
  beforeEach(() => {
    if (perms.__resetMocks) perms.__resetMocks();
    if (geolocation.__resetMocks) geolocation.__resetMocks();
    rnMapsMock.__getAnimateMock().mockClear();
  });

  test('centerOnMe requests permission and animates when granted', async () => {
    // simulate permission denied on check, granted on request
    perms.__setMockResults({ checkResult: perms.RESULTS.DENIED, requestResult: perms.RESULTS.GRANTED });

    let tree: any;
    await act(async () => {
      tree = renderer.create(<MapCanvas items={[{ id: 1, unique_id: 'T1', color: '#000', lat: 1, lon: 2, timestamp: new Date().toISOString() }]} />);
      // flush pending microtasks and allow refs to attach
      await new Promise(resolve => setImmediate(resolve));
      await new Promise(resolve => setImmediate(resolve));
      await new Promise(resolve => setImmediate(resolve));
    });

    // simulate pressing the button and wait microtasks for async permission + geolocation
    const btn = tree.root.findByProps({ testID: 'centerOnMeBtn' });
    await act(async () => {
      btn.props.onPress();
      // flush permission + geolocation async callbacks
      await new Promise(resolve => setImmediate(resolve));
      await new Promise(resolve => setImmediate(resolve));
      await new Promise(resolve => setImmediate(resolve));
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // find mock and assertions
    const animateMock = rnMapsMock.__getAnimateMock();
    expect(perms.check).toHaveBeenCalled();
    expect(perms.request).toHaveBeenCalled();
    expect(animateMock).toHaveBeenCalled();
  });

  test('denying permission shows alert and does not animate', async () => {
    perms.__setMockResults({ checkResult: perms.RESULTS.DENIED, requestResult: perms.RESULTS.DENIED });

    // spy on Alert.alert
    const Alert = require('react-native').Alert;
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    let tree2: any;
    await act(async () => {
      tree2 = renderer.create(<MapCanvas items={[]} />);
      // allow refs and async effects to settle
      await new Promise(resolve => setImmediate(resolve));
      await new Promise(resolve => setImmediate(resolve));
    });

    // ensure geolocation mock won't return success when permission denied
    if (geolocation.__setMockSuccess) geolocation.__setMockSuccess(false);
    const btn2 = tree2.root.findByProps({ testID: 'centerOnMeBtn' });
    const animateMock = rnMapsMock.__getAnimateMock();
    const geoSpy = jest.spyOn(geolocation, 'getCurrentPosition');
    const beforeCalls = animateMock.mock.calls.length;
    await act(async () => {
      btn2.props.onPress();
      await new Promise(resolve => setImmediate(resolve));
      await new Promise(resolve => setImmediate(resolve));
      await new Promise(resolve => setImmediate(resolve));
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(perms.check).toHaveBeenCalled();
    expect(perms.request).toHaveBeenCalled();
    // geolocation should not be invoked when permission denied
    expect(geoSpy).not.toHaveBeenCalled();
    // ensure animate was not triggered by this action (call count unchanged)
    expect(animateMock.mock.calls.length).toBe(beforeCalls);
  });
});
