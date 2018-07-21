import http from 'http';
import ExponentialRetry from '../utils/exponentialRetry';
import uniqueId from '../utils/uniqueId';

const DEFAULT_TIMEOUT_IN_MS = 5000;

export default class Request {
  constructor (server, _options, callback) {
    this.id = uniqueId();
    this.server = server;
    this.callback = callback;
    this.retryHelper = new ExponentialRetry();
    this.options = Object.assign({}, _options, {
      host: this.server.hostname,
      hostname: this.server.hostname,
      port: this.server.port || 80,
      path: this.server.pathname
    });
    this.options.headers.host = this.options.host + ':' + this.options.port;
    this.dispatch();
  }

  dispatch() {
    console.log(this._log(`Dispatching request to backend server ${this.server.formatted}.`));
    try {
      this.req = http.request(this.options, this._handleResponse.bind(this));
      this.req.setTimeout(DEFAULT_TIMEOUT_IN_MS);
      this.req.on('timeout', this._handleTimeoutReached.bind(this))
      this.req.on('end', this._handleEnd.bind(this));
      this.req.on('error', this._handleError.bind(this));
    } catch (e) {
      this._handleError(e);
    } 
  }

  retry () {
    const wait = this.retryHelper.getRetryWait();
    if (wait === false) {
      return;
    }
    console.log(this._log(`Retrying connection in ${wait} ms.`));
    setTimeout(() => this.dispatch(), wait);
  }

  pipe (downstream) {
    if (this.req) {
      downstream.pipe(this.req);
    }
  }

  _handleResponse (res) {
    res.setEncoding('utf8');
    if (this.callback) {
      this.callback(this, res);
    }
  }

  _handleEnd () {
    this._free();
  }

  _handleTimeoutReached () {
    console.error(this._log(`Connection timed out after ${DEFAULT_TIMEOUT_IN_MS} ms.`));
    this.req.abort();
  }

  _handleTimeout () {
    console.log(this._log('Connection reset.'));
    if (this.retryHelper.hasReachedMaximumWait()) {
      console.error(this._log('Reached maximum wait time. Abandoning.'));
      return;
    }
    this.retry();
  }

  _handleError (e) {
    if (e.code === 'ECONNRESET') {
      this._handleTimeout();
      return;
    }
    console.error(this._log('Connection error'), e);
    this.retry();
  }

  _free () {
    // Consume the response object to free up memory and eventually close the connection.
    this.res.consume();
    this.res.end();
    this.req.end();
    this.req = null;
    this.res = null;
    this.callback = null;
    this.server = null;
  }

  _log (message) {
    const now = new Date();
    return `[${now} Id: ${this.id}] ` + message;
  }
}