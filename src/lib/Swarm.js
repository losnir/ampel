import Request from './Request';
import { getRemoteAddress } from '../utils/';

export default class Swarm {
  constructor (backends, req, res) {
    this.backends = backends;
    this.req = req;
    this.res = res;
    this.responded = false;
  }

  dispatch () {
    const _options = Object.assign({}, {
      protocol: 'http:',
      method: this.req.method,
      headers: Object.assign({}, this.req.headers, {
        'X-Forwarded-For': getRemoteAddress(this.req), // TODO Augemnt XFF if it exists
      })
    });
    // TODO Move to for loop
    const requests = this.backends.map(server => {
      const upstream = new Request(server, _options, this._handleResponse.bind(this));
      upstream.pipe(this.req);
      return upstream;
    });
  }

  _handleResponse (res) {
    const ok = res.statusCode >= 200 && res.statusCode < 300;
    if (this.responded || !ok) {
      // Consume the response object to free up memory and eventually close the connection.
      res.resume();
      return;
    }
    this.res.setHeader('X-Served-By', getRemoteAddress(res));
    res.pipe(this.res);
    this.responded = true;
  }
}