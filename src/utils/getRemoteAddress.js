export default function getRemoteAddress (req) {
  const XFF = req.headers['X-Forwarded-For'] || req.headers['x-forwarded-for'];
  if (XFF) {
    const list = XFF.split(',');
    return list[list.length - 1].trim();
  }
  return req.connection.remoteAddress || req.socket.remoteAddress;
}
