import Request from '../lib/Request';
import Monitoring from '../monitoring';
import RoundRobin from '../lib/roundRobin';
import { getRemoteAddress, getXFF } from '../utils';

export default function AmplerHandlerGET (backends) {
  if (!backends || backends.constructor !== Array || backends.length < 1) {
    throw new Error('Please provide a non-empty array of upstream backends.');
  }
  const robin = RoundRobin(backends.length);
  return function GET (req, res) {
    Monitoring.report('inbound', `method={${req.method}},path=${req.url}`);
    const server = backends[robin()];
    const _options = Object.assign({}, {
      protocol: 'http:',
      method: req.method,
      headers: Object.assign({}, req.headers, {
        'X-Forwarded-For': getXFF(req),
      }),
      path: req.url
    });
    const upstream = new Request(server, _options);
    upstream.setOnResponse(function (upstreamReq) {
      res.setHeader('X-Served-By', getRemoteAddress(upstreamReq.res));
      res.writeHead(upstreamReq.res.statusCode, upstreamReq.res.headers);
      upstreamReq.res.pipe(res);
    });
    upstream.setOnError(function (upstreamReq) {
      res.writeHead(502);
      res.end('502 Bad Gateway');
      upstreamReq.abort();
      return false;
    });
    upstream.dispatch();
    upstream.pipe(req);
  }
}
