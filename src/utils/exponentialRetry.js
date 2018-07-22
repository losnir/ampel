const DEFAULT_OPTIONS = {
  MAXIMUM_WAIT_TIME_IN_MS: 1000 * 60 * 5,
  INITIAL_WAIT_IN_MS: 2500,
  EXPONENTIAL_FACTOR: retryCount => retryCount * 1
};

export default class ExponentialRetry {
  constructor (_options) {
    this.options = Object.assign({}, DEFAULT_OPTIONS, _options);
    this.retries = 0;
    this.start = new Date();
    this.reachedMaximum = false;
  }

  hasReachedMaximumWait () {
    if (this.reachedMaximum) {
      return true;
    }
    const reachedMaximum = (new Date() - this.start) >= this.options.MAXIMUM_WAIT_TIME_IN_MS;
    if (reachedMaximum) {
      this.reachedMaximum = true;
    }
    return reachedMaximum;
  }

  getInitialWait () {
    return this.options.INITIAL_WAIT_IN_MS;
  }

  getRetryWait () {
    if (this.hasReachedMaximumWait()) {
      return false;
    }
    const exponent = this.options.EXPONENTIAL_FACTOR(this.retries);
    const wait = Math.pow(2, exponent) * this.options.INITIAL_WAIT_IN_MS;
    this.retries++;
    return wait;
  }
}