import { mkdir, writeFile } from 'node:fs/promises';
import { deflateSync } from 'node:zlib';

const output = new URL('../public/icons/', import.meta.url);
await mkdir(output, { recursive: true });

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const name = Buffer.from(type);
  const length = Buffer.alloc(4); length.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4); checksum.writeUInt32BE(crc32(Buffer.concat([name, data])));
  return Buffer.concat([length, name, data, checksum]);
}

function insidePolygon(x, y, points) {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, yi] = points[i], [xj, yj] = points[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function makeIcon(size, maskable = false) {
  const scale = size / 512;
  const rgba = Buffer.alloc(size * size * 4);
  const bg = [49, 92, 70, 255], house = [247, 248, 245, 255], door = [49, 92, 70, 255];
  const roof = maskable ? [[142, 239], [256, 144], [370, 239]] : [[100, 258], [256, 128], [412, 258]];
  const body = maskable ? [171, 228, 341, 370] : [126, 245, 386, 404];
  const doorRect = maskable ? [230, 286, 282, 370] : [226, 312, 286, 404];
  for (let py = 0; py < size; py++) for (let px = 0; px < size; px++) {
    const x = (px + 0.5) / scale, y = (py + 0.5) / scale;
    let color = bg;
    if (insidePolygon(x, y, roof) || (x >= body[0] && x <= body[2] && y >= body[1] && y <= body[3])) color = house;
    if (x >= doorRect[0] && x <= doorRect[2] && y >= doorRect[1] && y <= doorRect[3]) color = door;
    const i = (py * size + px) * 4;
    rgba[i] = color[0]; rgba[i + 1] = color[1]; rgba[i + 2] = color[2]; rgba[i + 3] = color[3];
  }
  const rows = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) rgba.copy(rows, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0); header.writeUInt32BE(size, 4); header[8] = 8; header[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', header), chunk('IDAT', deflateSync(rows)), chunk('IEND', Buffer.alloc(0))]);
}

for (const [name, size, maskable] of [['icon-192.png', 192, false], ['icon-512.png', 512, false], ['icon-maskable-512.png', 512, true], ['apple-touch-icon.png', 180, false]]) {
  await writeFile(new URL(name, output), makeIcon(size, maskable));
}
