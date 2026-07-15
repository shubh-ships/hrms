import crypto from 'crypto';
import fetch from 'node-fetch';
import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';

export function hashURL(url) {
  return crypto.createHash('sha256').update(url).digest('hex');
}

export async function getFileSize(input) {
  if (Buffer.isBuffer(input)) {
    return input.length;
  }

  if (typeof input === 'string') {
    if (input.startsWith('http://') || input.startsWith('https://')) {
      const res = await fetch(input);
      const buffer = await res.arrayBuffer();
      return buffer.byteLength;
    }

    const stats = await fs.stat(input);
    return stats.size;
  }

  throw new Error('Unsupported file input type');
}

export async function isImageBlank(input) {
  let buffer;

  if (Buffer.isBuffer(input)) {
    buffer = input;
  } else if (typeof input === 'string' && input.startsWith('http')) {
    const res = await fetch(input);
    buffer = await res.buffer();
  } else if (typeof input === 'string') {
    buffer = await fs.readFile(input);
  } else {
    throw new Error('Unsupported input for blank image check');
  }

  const { data, info } = await sharp(buffer).raw().toBuffer({ resolveWithObject: true });

  let total = 0;
  let allSame = true;
  const channels = info.channels;

  for (let i = 0; i < data.length; i += channels) {
    const pixelSum = data.slice(i, i + channels).reduce((a, b) => a + b, 0);
    total += pixelSum;
    if (i > 0 && pixelSum !== data[i - channels]) {
      allSame = false;
      break;
    }
  }

  return allSame;
}
