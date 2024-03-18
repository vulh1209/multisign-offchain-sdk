/* eslint-disable no-bitwise */

import * as crypto from 'crypto';

const algorithm = 'aes-256-cbc';

const k: crypto.CipherKey = Uint8Array.from(
  [0, 0, 0, 0, 0, 0, 0, 0].map(number => number % (1 << 8)),
);

const v: crypto.BinaryLike = Uint8Array.from(
  [1, 1, 1, 1, 1, 1, 1, 1].map(number => number % (1 << 8)),
);

export function decrypt(encrypted: string) {
  const decipher = crypto.createDecipheriv(algorithm, k, v);

  const decryptedData = decipher.update(encrypted, 'hex', 'utf-8') + decipher.final('utf8');

  return decryptedData;
}
