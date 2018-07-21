import { URL } from 'url';
export default class Backend {
  constructor (url) {
    const { hostname, port, pathname } = new URL(url);
    this.hostname = hostname;
    this.port = port;
    this.pathname = pathname;
  }

  get formatted () {
    let str = this.hostname + ':' + this.port;
    if (this.pathname !== '/') {
      str += this.pathname;
    }
    return str;
  }
}
