module.exports = {
  meta: {},
  port: 8150,
  host: '10.0.26.24',
  autoAddLogging: true,
  metrics: {
    extraMeta: function() {
      return {};
    }
  }
};