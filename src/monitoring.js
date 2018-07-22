import os from 'os';
import http from 'http';
import Config from '../config.json';
import appmetrics from 'appmetrics';

const monitor = appmetrics.monitor();
const env = process.env.NODE_ENV || 'development';
const commonTags = `host=${os.hostname()},env=${env},service=Ampel`;

let ERROR_COOLDOWN_IN_MS = 5 * 60 * 1000;
let lastErrorAt;

const requestOptions = {
  host: Config.metrics.host,
  port: Config.metrics.port,
  path: '/write?precision=ms&db=' + Config.metrics.database,
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
};

function start () {
  if (!Config.metrics.enabled) {
    return;
  }

  monitor.on('cpu', cpu => {
    reportMetric(`cpu_percentage,${commonTags} process=${cpu.process},system=${cpu.system} ${cpu.time}`);
  });

  monitor.on('memory', memory => {
    reportMetric(`memory,${commonTags} physical=${memory.physical},virtual=${memory.virtual},private=${memory.private} ${memory.time}`);
  });

  monitor.on('eventloop', eventloop => {
    reportMetric(`eventloop,${commonTags} latency_min=${eventloop.latency.min},latency_max=${eventloop.latency.max},latency_avg=${eventloop.latency.avg} ${eventloop.time}`);
  });

  monitor.on('loop', loop => {
    reportMetric(`loop,${commonTags} ticks=${loop.count},min=${loop.minimum},max=${loop.maximum},avg=${loop.average},cpu_user=${loop.cpu_user},cpu_system=${loop.cpu_system} ${new Date().getTime()}`);
  });

  monitor.on('gc', gc => {
    reportMetric(`gc,${commonTags},type="${gc.type}" used=${gc.used},size=${gc.size},duration=${gc.duration} ${gc.time}`);
  });

  monitor.on('http-outbound', data => {
    reportHttp('http', data);
  });

  monitor.on('https-outbound', (data) => {
    reportHttp('https', data);
  });
}

function isMonitoringRequest (url) {
  return url.startsWith('http://' + Config.metrics.host);
}


function reportHttp(type, data) {
  if (!isMonitoringRequest(data.url)) {
    reportMetric(`http,${commonTags},type=${type},url=${escape(data.url)},method=${data.method},status=${data.statusCode} duration=${data.duration} ${data.time}`);
  }
}

function report (name, data) {
  reportMetric(name + ',' + commonTags + ',' + data);
}

function reportMetric (data) {
  const req = http.request(requestOptions);
  req.on('error', (e) => {
    if (!isInErrorCooldownPeriod()) {
      lastErrorAt = +new Date();
      console.log('Failed to reportMetric metric.', e);
    }
  });
  req.write(data);
  req.end();
}

function isInErrorCooldownPeriod() {
  return lastErrorAt && lastErrorAt + ERROR_COOLDOWN_IN_MS > +new Date();
}

function escape (string) {
  return string.replace(/(=)/g, '\\$1').replace(/(,)/g, '\\$1').replace(/(\s)/g, '\\$1');
}

export default {
  start,
  report
}