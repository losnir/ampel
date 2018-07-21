import Request from './Request';
import { getRemoteAddress } from '../utils';
import uniqueId from '../utils/uniqueId';

export default class Swarm {
  constructor (backends, req, res) {
    this.id = uniqueId();
    this.backends = backends;
    this.req = req;
    this.res = res;
    this.responded = false;
  }

  dispatch () {
    console.log(this._log('Dispatching a Swarm request...'));
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

  _handleResponse (req, res) {
    const code = res.statusCode;
    const id = req.id;
    if (code !== 201) {
      console.log(this._log(`Received status code ${code} from one of the upstream backends (Id: ${id}. Retrying...`));
      req.retry();
    }
    if (this.responded) {
      return;
    }
    this.res.setHeader('X-Served-By', getRemoteAddress(res));
    res.pipe(this.res);
    this.responded = true;
  }

  _log (message) {
    const now = new Date();
    return `[${now} Swarm Id: ${this.id}] ` + message;
  }
}