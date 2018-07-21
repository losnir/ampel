import Request from '../lib/Request';

import request from 'request';
import RoundRobin from '../lib/roundRobin';
import { getRemoteAddress } from '../utils/';

export default function AmplerHandlerGET (backends) {
  if (!backends || backends.constructor !== Array || backends.length < 1) {
    throw new Error('Please provide a non-empty array of upstream backends.');
  }
  const robin = RoundRobin(backends.length);
  return function GET (req, res) {
    const server = backends[robin()];
  
    // let url = node;
    // if (req.url !== '/') {
    //   url += req.url;
    // }
      // const upstream = request({ url });

    const _options = Object.assign({}, {
      protocol: 'http:',
      method: req.method,
      headers: Object.assign({}, req.headers, {
        'X-Forwarded-For': getRemoteAddress(req), // TODO Augemnt XFF if it exists
      })
    });
    const upstream = new Request(server, _options, upstreamRes => {
      res.setHeader('X-Served-By', getRemoteAddress(upstreamRes));
      upstreamRes.pipe(res);
    });
    upstream.pipe(req);
  }
}
