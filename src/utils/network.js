export function getRemoteAddress (req) {
  return req.connection.remoteAddress || req.socket.remoteAddress;
}

export function getXFF (req) {
  const XFF = req.headers['X-Forwarded-For'] || req.headers['x-forwarded-for'];
  const remote = getRemoteAddress(req);
  if (XFF) {
    const list = XFF.split(',');
    list.push(remote);
    return list.join(',');
  }
  return remote;
}