import URL from 'url';
export default class Backend {
  constructor (options) {
    if (!options || options.constructor!== Object) {
      throw new Error('Backend options must be an object.'); 
    }
    if (!options.host) {
      throw new Error('Please specify host');
    }
    this.hostname = options.host;
    this.port = options.port || '80';
  }

  get formatted () {
    return this.hostname + ':' + this.port;
  }
}
