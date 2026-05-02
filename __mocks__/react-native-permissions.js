export const PERMISSIONS = {
  IOS: { LOCATION_WHEN_IN_USE: 'ios.permission.LOCATION_WHEN_IN_USE' },
  ANDROID: { ACCESS_FINE_LOCATION: 'android.permission.ACCESS_FINE_LOCATION' },
};
export const RESULTS = {
  GRANTED: 'granted',
  DENIED: 'denied',
  BLOCKED: 'blocked',
  UNAVAILABLE: 'unavailable',
  LIMITED: 'limited',
};

// internal mock state so tests can configure behavior deterministically
let _nextCheckResult = RESULTS.DENIED;
let _nextRequestResult = RESULTS.GRANTED;

export const check = jest.fn(async () => _nextCheckResult);
export const request = jest.fn(async () => _nextRequestResult);
export const openSettings = jest.fn(async () => {});

export function __setMockResults({ checkResult, requestResult } = {}) {
  if (typeof checkResult !== 'undefined') _nextCheckResult = checkResult;
  if (typeof requestResult !== 'undefined') _nextRequestResult = requestResult;
}

export function __resetMocks() {
  _nextCheckResult = RESULTS.DENIED;
  _nextRequestResult = RESULTS.GRANTED;
  check.mockClear();
  request.mockClear();
  openSettings.mockClear();
}

export default { PERMISSIONS, RESULTS, check, request, openSettings, __setMockResults, __resetMocks };
