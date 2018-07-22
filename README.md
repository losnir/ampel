# 🚦 Ampel

<img src="https://losnir.github.io/ampel/ampel.svg" align="right"
     title="Size Limit logo by Anton Lovchikov" width="111" height="120">

Ampel is a lightweight, dependency free* load balancer that is tailored to one specific use case. Enjoy. :sparkles:

\* Well, almost dependency free. It requires only `appmetrics` for production in order to easily expose internal Node.js metrics.

## Architecture

The design is simple, the process creates a vanilla Node.js HTTP server, and for each incoming request (`GET`/`POST`) it opens a connection to the upstream backends using `http.request`. The request payload and response are elegantly `.pipe()`'d to each other for simplicity.

## Features

:heavy_check_mark: All `GET` requests are served using a round robin method.\
:heavy_check_mark: All `POST` requests are sent to all upstream backends, with the first responder eventually serving the incoming request.\
:heavy_check_mark: Exponential back-off retry interval.\
:heavy_check_mark: Exposes Graphite protocol metrics (currently only supports `InfluxDB` API).

:warning: No support for HTTPS as of now.

## Getting Started

### Setup
1. Clone the repository
```
$ git clone https://github.com/losnir/ampel.git
$ cd ampel
```
2. Install dependencies
```
$ npm install
```
```
$ yarn
```

### Configuration

Configuration is a simple `config.json` file under the root of the project.
The structure is as follows:

```
{
  "backends": [
    { "host": "127.0.0.1", "port": "6000" },
    { "host": "127.0.0.1", "port": "6001" },
    { "host": "127.0.0.1", "port": "6002" },
    // etc...
    // port is optional, if left empty then '80' will be used by default.
  ],
  "metrics": {
    "enabled": true,     // Enable metrics reporting?
    "host": "127.0..1"   // InfluxDB host
    "port": "8086",      // InfluxDB port
    "database": "ampel"  // InfluxDB database name
  }
}
```

### Running a Development Build

Ampel is using Babel. There is a special npm script to spin-up a development build with `nodemon`.

```
$ npm run start:dev
```

You can also run with debugging enabled (uses `node --inspect` on port `5858`):

```
$ npm run start:inspect
```

### Running a Production Build

Run the `build` npm script to, this will create all build artifacts under `/dist`.

```
$ npm run build
```

And then to run:

```
$ npm start
```

You can deploy the application however you like, using `forever`, `pm2`, `now.sh` etc.

Tip: You can use the environment variable `PORT` to control the port the http server exposes on (by default it is `80`):

```
$ PORT=8080 npm start
```

## Testing :cat2:

```
npm test
```