export default {
  // configurable mock: tests can enable/disable success
  _allowSuccess: true,
  getCurrentPosition: jest.fn((success, error) => {
    // async simulate
    setImmediate(() => {
      if (module.exports._allowSuccess) {
        success({ coords: { latitude: 37.77, longitude: -122.42 } });
      } else {
        if (typeof error === 'function') error({ code: 1, message: 'Permission denied' });
      }
    });
  }),
  __setMockSuccess: (v) => { module.exports._allowSuccess = !!v; },
  __resetMocks: () => {
    module.exports.getCurrentPosition.mockClear();
    module.exports._allowSuccess = true;
  },
};
