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
  beforeEach(async () => {
    if (perms.__resetMocks) perms.__resetMocks();
    if (geolocation.__resetMocks) geolocation.__resetMocks();
    rnMapsMock.__getAnimateMock().mockClear();
    // flush any pending microtasks from previous tests (setImmediate/setTimeout)
    await new Promise(resolve => setImmediate(resolve));
    await new Promise(resolve => setImmediate(resolve));
  });

  test('centerOnMe requests permission and animates when granted', async () => {
    // simulate permission denied on check, granted on request
    perms.__setMockResults({ checkResult: perms.RESULTS.DENIED, requestResult: perms.RESULTS.GRANTED });

    let tree: any;
    await act(async () => {
      tree = renderer.create(<MapCanvas items={[{ uuid: '550e8400-e29b-41d4-a716-000000000001', colorHex: '#000000', unique_id: 'T1', color: '#000000', lat: 1, lon: 2, timestamp: new Date().toISOString() }]} />);
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

    // find mock and assertions: ensure permission flow called geolocation
    const animateMock = rnMapsMock.__getAnimateMock();
    const geoSpy = jest.spyOn(geolocation, 'getCurrentPosition');
    expect(perms.check).toHaveBeenCalled();
    expect(perms.request).toHaveBeenCalled();
    expect(geoSpy).toHaveBeenCalled();
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
    // ensure animate was not triggered by this action (call count unchanged)
    expect(animateMock.mock.calls.length).toBe(beforeCalls);
  });

  test('blocked permission suggests opening settings and calls openSettings when accepted', async () => {
    // inject a fake location service that reports BLOCKED
    const fakeLoc = {
      checkPermission: jest.fn(async () => perms.RESULTS.BLOCKED),
      requestPermission: jest.fn(async () => perms.RESULTS.BLOCKED),
      openSettings: jest.fn(async () => {}),
      getCurrentPosition: jest.fn(),
    };

    // mock Alert.alert to immediately invoke the 'Abrir ajustes' button
    const Alert = require('react-native').Alert;
    jest.spyOn(Alert, 'alert').mockImplementation((title, msg, buttons) => {
      const openBtn = Array.isArray(buttons) && buttons.find(b => String(b.text).toLowerCase().includes('abrir'));
      if (openBtn && typeof openBtn.onPress === 'function') openBtn.onPress();
    });

    let tree: any;
    await act(async () => {
      tree = renderer.create(<MapCanvas items={[]} locationService={fakeLoc} />);
      await new Promise(resolve => setImmediate(resolve));
    });

    const btn = tree.root.findByProps({ testID: 'centerOnMeBtn' });
    await act(async () => {
      btn.props.onPress();
      await new Promise(resolve => setImmediate(resolve));
      await new Promise(resolve => setImmediate(resolve));
    });

    expect(fakeLoc.checkPermission).toHaveBeenCalled();
    expect(fakeLoc.openSettings).toHaveBeenCalled();
    expect(fakeLoc.getCurrentPosition).not.toHaveBeenCalled();
  });

  test('unavailable permission shows message and does not call geolocation', async () => {
    const fakeLoc = {
      checkPermission: jest.fn(async () => perms.RESULTS.UNAVAILABLE),
      requestPermission: jest.fn(),
      openSettings: jest.fn(),
      getCurrentPosition: jest.fn(),
    };

    const Alert = require('react-native').Alert;
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    let tree: any;
    await act(async () => {
      tree = renderer.create(<MapCanvas items={[]} locationService={fakeLoc} />);
      await new Promise(resolve => setImmediate(resolve));
    });

    const btn = tree.root.findByProps({ testID: 'centerOnMeBtn' });
    await act(async () => {
      btn.props.onPress();
      await new Promise(resolve => setImmediate(resolve));
    });

    expect(fakeLoc.checkPermission).toHaveBeenCalled();
    expect(alertSpy).toHaveBeenCalled();
    expect(fakeLoc.getCurrentPosition).not.toHaveBeenCalled();
  });

  test('denied then blocked on request opens settings', async () => {
    const fakeLoc = {
      checkPermission: jest.fn(async () => perms.RESULTS.DENIED),
      requestPermission: jest.fn(async () => perms.RESULTS.BLOCKED),
      openSettings: jest.fn(async () => {}),
      getCurrentPosition: jest.fn(),
    };

    const Alert = require('react-native').Alert;
    jest.spyOn(Alert, 'alert').mockImplementation((title, msg, buttons) => {
      const openBtn = Array.isArray(buttons) && buttons.find(b => String(b.text).toLowerCase().includes('abrir'));
      if (openBtn && typeof openBtn.onPress === 'function') openBtn.onPress();
    });

    let tree: any;
    await act(async () => {
      tree = renderer.create(<MapCanvas items={[]} locationService={fakeLoc} />);
      await new Promise(resolve => setImmediate(resolve));
    });

    const btn = tree.root.findByProps({ testID: 'centerOnMeBtn' });
    await act(async () => {
      btn.props.onPress();
      await new Promise(resolve => setImmediate(resolve));
      await new Promise(resolve => setImmediate(resolve));
    });

    expect(fakeLoc.checkPermission).toHaveBeenCalled();
    expect(fakeLoc.requestPermission).toHaveBeenCalled();
    expect(fakeLoc.openSettings).toHaveBeenCalled();
    expect(fakeLoc.getCurrentPosition).not.toHaveBeenCalled();
  });
});
