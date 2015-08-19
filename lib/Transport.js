"use strict";

const winston = require('winston');
const EventsD = require('sz-eventsd');
const os = require('os');

class Transport extends winston.Transport {
  constructor(options) {
    super(options);

    this.name = 'EventsD';
    this.config = options;
    this.localhost = this.config.localhost || os.hostname();
    this.pid = options.pid || process.pid;
    this.eventsD = new EventsD(this.config);
  }

  log(level, msg, meta, callback) {
    let message = winston.clone(meta || {});
    callback  = callback || function() {};

    if (this.silent) {
      return callback(null, true);
    }

    let req = Transport.getRequest();

    message.hostName = this.config.appName;
    message.primaryHostName = this.config.appName;
    message.serverName = this.localhost;
    message.requestUri = req ? req.url : '';
    message.scriptFilename = process.argv[1] || '';
    message.httpReferer = req && req.headers['referer'] ? req.headers['referer'] : '';
    message.userAgent = req && req.headers['user-agent'] ? req.headers['user-agent'] : '';
    message.remoteIPAddress = Transport.getRemoteIp(req) || '';
    message.errorType = level;
    message.errorMsg = msg;
    message.trace = new Error().stack;
    message.pid = this.pid;
    message.requestHeaders = req ? req.headers : [];
    message.framework = 'Sand ' + sand.version;

    let errorRegex = /\[31m.*\[39m$/i;
    let warnRegex = /\[33m.*\[39m$/i;

    if (errorRegex.test(msg)) {
      message.levelType = 'error';
    } else if (warnRegex.test(msg)) {
      message.levelType = 'warn';
    } else {
      message.levelType = 'info';
    }

    this.eventsD.send('error', message, callback);
  }

  static getRequest() {
    if (sand.ctx) {
      return sand.ctx.req;
    } else if (process.domain) {
      return process.domain.req;
    }

    return null;
  }

  static getRemoteIp(req) {
    if (!req) {
      return null;
    }

    if (req.headers['x-forwarded-for']) {
      return req.headers['x-forwarded-for'].replace(/,.*$/g, '');
    }

    return req.connection.remoteAddress;
  }
}

module.exports = Transport;