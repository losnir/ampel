import crypto from 'crypto';
export default function () {
  return crypto.randomBytes(12).toString('base64');
}