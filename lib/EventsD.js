"use strict";

const SandGrain = require('sand-grain');
const Transport = require('./Transport');
const _ = require('lodash');
const nano = require('nano-time');

class EventsD extends SandGrain {
  constructor() {
    super();
    this.name = this.configName = 'eventsd';
    this.defaultConfig = require('./defaultConfig');
    this.version = require('../package').version;
  }

  init(config, done) {
    super.init(config);

    if (!this.config.appName) {
      this.config.appName = sand.config.appName || 'Unknown App';
    }

    if (!this.config.environment) {
      this.config.environment = sand.env || 'development';
    }

    this.transport = new Transport(this.config);

    if (this.config.autoAddLogging) {
      this.addLogger();
    }

    done();
  }

  addLogger() {
    global.SandLogger.addTransport(this.transport, null, true);
  }

  send(event, msg, routingKeyExtras, callback) {
    return runWithCallbackOrPromise(function(cb) {
      this.transport.eventsD.send(event, msg, routingKeyExtras, cb);
    }.bind(this), callback);
  }

  /**
   * Send a metric event to eventsD
   *
   * @param {String|Object} name - name of the event, if an object, then entire eventsD object is required.
   * @param {Number} value - value for event
   * @param {Object|null} [meta={}] Extra meta data to attach to event
   * @param {String} [time=Current Time] the ISO 8601 time of event, defaults to current time
   * @param {Object} [extra] Extra data to append to eventsD message
   */
  sendMetric(name, value, meta, time, extra) {
    return runWithCallbackOrPromise(function(cb) {
      let msg = {};

      if (_.isPlainObject(name)) {
        msg = name;
      } else {
        msg = _.merge({
          name: name,
          value: value,
          meta: meta || {},
          time: time || (new Date()).toISOString(),
          nanoseconds: nano()
        }, extra || {});
      }

      this.transport.eventsD.send('metric', msg, {}, cb);
    }.bind(this));
  }
}

module.exports = EventsD;

function runWithCallbackOrPromise(fn, callback) {
  if ('function' === typeof callback) {
    return fn(callback);
  }

  return new Promise(function(resolve, reject) {
    fn(function(err, result) {
      if (err) {
        return reject(err);
      }

      return resolve(result);
    })
  });
}