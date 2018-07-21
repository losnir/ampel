import http from 'http';
import URL from 'url';

import DNSCache from 'dnscache';
DNSCache({
  enable: true,
  ttl: 1800
});

import request from 'request';

import Config from '../config.json';
import * as Handlers from './handlers';


const PORT = 8080;
const UPSTREAM_HOSTNAMES = Config.backends.map(backend => {
  const { hostname, port, pathname } = new URL.URL(backend);
  return { hostname, port, pathname };
});

const GET = Handlers.GET(UPSTREAM_HOSTNAMES);
const POST = Handlers.POST(UPSTREAM_HOSTNAMES);


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
    res.end('Internal Server Error');
  }
});

ampel.listen(PORT, () => {
  console.log(`Ampel is running at http://127.0.0.1:${PORT}/`);
});
