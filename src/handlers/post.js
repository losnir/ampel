import Swarm from '../lib/Swarm';

export default function AmplerHandlerPOST (backends) {
  if (!backends || backends.constructor !== Array || backends.length < 1) {
    throw new Error('Please provide a non-empty array of upstream backends.');
  }
  return function POST (req, res) {
    const swarm = new Swarm(backends, req, res);
    swarm.dispatch();
  }
}
