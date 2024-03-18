/* eslint-disable no-bitwise */

import * as crypto from 'crypto';

const algorithm = 'aes-256-cbc';

const k: crypto.CipherKey = Uint8Array.from(
  [0, 0, 0, 0, 0, 0, 0, 0].map(number => number % (1 << 8)),
);

const v: crypto.BinaryLike = Uint8Array.from(
  [1, 1, 1, 1, 1, 1, 1, 1].map(number => number % (1 << 8)),
);

export function encrypt(plaintext: string) {
  const cipher = crypto.createCipheriv(algorithm, k, v);

  const encryptedData = cipher.update(plaintext, 'utf-8', 'hex') + cipher.final('hex');

  return encryptedData;
}
