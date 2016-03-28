"use strict";

const SandGrain = require('sand-grain');
const Transport = require('./Transport');

class EventsD extends SandGrain {
  constructor() {
    super();
    this.name = this.configName = 'eventsd';
    this.defaultConfig = SandGrain.getConfig(require('./defaultConfig'));
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
    global.SandLogger.addTransport(this.transport, null, true);

    done();
  }

  send(event, msg, routingKeyExtras, callback) {
    this.transport.eventsD.send(event, msg, routingKeyExtras, callback);
  }

}

module.exports = EventsD;