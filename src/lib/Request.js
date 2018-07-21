import http from 'http';

export default class Request {
  constructor (server, _options, callback) {
    this.server = server;
    this.callback = callback;
    const options = Object.assign({}, _options, {
      host: this.server.hostname,
      hostname: this.server.hostname,
      port: this.server.port || 80,
      path: this.server.pathname
    });
    options.headers.host = options.host + ':' + options.port;
    try {
      this.req = http.request(options, this._handleResponse.bind(this));
      this.req.on('end', this._handleEnd);
      this.req.on('error', this._handleError);
    } catch (e) {
      this._handleError(e);
    } 
  }

  pipe (downstream) {
    if (this.req) {
      downstream.pipe(this.req);
    }
  }

  _handleResponse (res) {
    // console.log(`STATUS: ${res.statusCode}`);
    // console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
    res.setEncoding('utf8');
    res.on('end', this._handleEnd);
    res.re
    if (res.statusCode !== 201) {
      // DO RETRY?
    }
    if (this.callback) {
      this.callback(res);
    }
  }

  _handleEnd () {
    // console.log('Connection Closed');
  }

  _handleError (e) {
    console.error('Connection Error', e);
  }
}