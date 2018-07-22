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
    });
    this.options.headers.host = this.options.host + ':' + this.options.port;
  }

  dispatch() {
    this._free();
    console.log(this._log(`Dispatching request to backend server ${this.server.formatted}.`));
    Monitoring.report('outbound', `upstream=${this.server.formatted},method={${this.options.method}},path=${this.options.path}`);
    try {
      this.req = http.request(this.options, this._handleResponse.bind(this));
      this.req.setTimeout(DEFAULT_TIMEOUT_IN_MS);
      this.req.on('timeout', this._handleTimeoutReached.bind(this))
      this.req.on('end', this._handleEnd.bind(this));
      this.req.on('error', this._handleError.bind(this));
      this.pipe();
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
    if(downstream) {
      this.downstream = downstream;
    }
    if (this.req && this.downstream) {
      this.downstream.pipe(this.req);
    }
  }

  consume () {
    // Consume the response object to free up memory and eventually close the connection.
    if (this.res && this.res.consume) {
      this.res.consume();
      return;
    }
    if (this.res && this.res.read) {
      this.res.read();
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

  setOnError (callback) {
    this.onError = callback;
  }

  _handleResponse (res) {
    this.res = res;
    res.setEncoding('utf8');
    if (this.onResponse) {
      this.onResponse(this);
    }
  }

  _handleEnd () {
    this._destroy();
  }

  _handleTimeoutReached () {
    if (this.req){
      this.req.abort();
    }
  }

  _handleTimeout () {
    console.error(this._log(`Connection timed out after ${DEFAULT_TIMEOUT_IN_MS} ms.`));
    if (this.onError) {
      if (!this.onError(this)) {
        this.abort();
        return;
      }
    }
    if (this.aborted) {
      return;
    }
    if (this.retryHelper.hasReachedMaximumWait()) {
      console.error(this._log('Reached maximum wait time. Abandoning.'));
      this.abort();
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
    if (e.code === 'ECONNREFUSED') {
      if (this.onError) {
        this.onError(this);
      }
      this.abort();
      return;
    }
    console.error(this._log('Connection error'), e);
    this.retry();
  }

  _free () {
    this.consume();
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
    this.downstream = null;
    this.retryId = null;
    this.retryHelper = null;
    this.options = null;
    this.onResponse = null;
    this.onError = null;
  }

  _log (message) {
    const now = new Date();
    return `[${now} Id: ${this.id}] ` + message;
  }
}