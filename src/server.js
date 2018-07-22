import http from 'http';
import Monitoring from './monitoring';
Monitoring.start();

import Config from '../config.json';
import Backend from './lib/Backend';
import * as Handlers from './handlers';

const PORT = process.env.PORT || 80;
const UPSTREAM_BACKENDS = Config.backends.map(url => new Backend(url));

const GET = Handlers.GET(UPSTREAM_BACKENDS);
const POST = Handlers.POST(UPSTREAM_BACKENDS);

const ampel = http.createServer(function (req, res) {
  try {
    res.setHeader('X-Powered-By', 'Ampel');
    if (req.method === 'GET') {
      GET(req, res);
    } else if (req.method === 'POST') {
      POST(req, res);
    } else {
      res.writeHead(405);
      res.end('405 Method Not Allowed');
    }
  }
  catch (e) {
    console.error(e);
    res.writeHead(500);
    res.end('500 Internal Server Error');
  }
});

ampel.listen(PORT, () => {
  console.log(`Ampel is running at http://127.0.0.1:${PORT}/`);
});
