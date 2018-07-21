import Request from '../lib/Request';

import RoundRobin from '../lib/roundRobin';
import { getRemoteAddress } from '../utils';

export default function AmplerHandlerGET (backends) {
  if (!backends || backends.constructor !== Array || backends.length < 1) {
    throw new Error('Please provide a non-empty array of upstream backends.');
  }
  const robin = RoundRobin(backends.length);
  return function GET (req, res) {
    const server = backends[robin()];
    const _options = Object.assign({}, {
      protocol: 'http:',
      method: req.method,
      headers: Object.assign({}, req.headers, {
        'X-Forwarded-For': getRemoteAddress(req), // TODO Augemnt XFF if it exists
      })
    });
    const onResponse = function (upstreamReq, upstreamRes) {
      res.setHeader('X-Served-By', getRemoteAddress(upstreamRes));
      upstreamRes.pipe(res);
    }
    const upstream = new Request(server, _options, onResponse);
    upstream.pipe(req);
  }
}
