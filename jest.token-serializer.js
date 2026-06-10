module.exports = {
  test(val) {
    return typeof val === 'string' && /Bearer\s+[A-Za-z0-9\-_.]+/.test(val);
  },
  print(val) {
    return val.replace(/Bearer\s+[A-Za-z0-9\-_.]+/, 'Bearer <REDACTED>');
  },
};
