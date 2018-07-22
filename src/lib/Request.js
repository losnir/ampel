import http from 'http';
import Monitoring from '../monitoring';
import ExponentialRetry from '../utils/exponentialRetry';
import uniqueId from '../utils/uniqueId';

const DEFAULT_TIMEOUT_IN_MS = 5000;

export default class Request {
  constructor (server, _options) {
    this.id = uniqueId();
    this.server = server;
    this.retryHelper = new ExponentialRetry();
    this.options = Object.assign({}, _options, {
      host: this.server.hostname,
      hostname: this.server.hostname,
      port: this.server.port || 80,
      timeout: DEFAULT_TIMEOUT_IN_MS
    });
    this.options.headers.host = this.options.host + ':' + this.options.port;
  }

  dispatch() {
    console.log(this._log(`Dispatching request to backend server ${this.server.formatted}.`));
    Monitoring.report('outbound', `upstream=${this.server.formatted},method={${this.options.method}},path=${this.options.path}`);
    try {
      this.req = http.request(this.options, this._handleResponse.bind(this));
      this.req.on('timeout', this._handleTimeoutReached.bind(this))
      this.req.on('end', this._handleEnd.bind(this));
      this.req.on('error', this._handleError.bind(this));
    } catch (e) {
      this._handleError(e);
    } 
  }

  retry () {
    if (this.aborted) {
      return;
    }
    this._free();
    const wait = this.retryHelper.getRetryWait();
    if (wait === false) {
      return;
    }
    console.log(this._log(`Retrying connection in ${wait} ms.`));
    this.retryId = setTimeout(() => this.dispatch(), wait);
  }

  pipe (downstream) {
    if (this.req) {
      downstream.pipe(this.req);
    }
  }

  abort () {
    this.aborted = true;
    if (this.req) {
      this.req.abort();
    }
    this._destroy();
  }

  setOnResponse (callback) {
    this.onResponse = callback;
  }

  setOnTimeout (callback) {
    this.onTimeout = callback;
  }

  _handleResponse (res) {
    this.res = res;
    res.setEncoding('utf8');
    if (this.onResponse) {
      this.onResponse(this, res);
    }
  }

  _handleEnd () {
    this._destroy();
  }

  _handleTimeoutReached () {
    console.error(this._log(`Connection timed out after ${DEFAULT_TIMEOUT_IN_MS} ms.`));
    this.req.abort();
  }

  _handleTimeout () {
    console.log(this._log('Connection reset.'));
    if (this.onTimeout) {
      if (!this.onTimeout(this)) {
        this._destroy();
        return;
      }
    }
    if (this.aborted) {
      return;
    }
    if (this.retryHelper.hasReachedMaximumWait()) {
      console.error(this._log('Reached maximum wait time. Abandoning.'));
      this._destroy();
      return;
    }
    this.retry();
  }

  _handleError (e) {
    if (e.code === 'ECONNRESET') {
      if (this.aborted) {
        return;
      }
      this._handleTimeout();
      return;
    }
    console.error(this._log('Connection error'), e);
    this.retry();
  }

  _free () {
    // Consume the response object to free up memory and eventually close the connection.
    if (this.res) {
      this.res.consume();
      this.res.end();
    }
    if (this.req) {
      this.req.end();
    }
    if (this.retryId) {
      clearTimeout(this.retryId);
      this.retryId = null;
    }
    this.req = null;
    this.res = null;
  }

  _destroy () {
    this._free();
    this.id = null;
    this.server = null;
    this.retryHelper = null;
    this.retryId = null;
    this.options = null;
    this.onResponse = null;
    this.onTimeout = null;
  }

  _log (message) {
    const now = new Date();
    return `[${now} Id: ${this.id}] ` + message;
  }
}