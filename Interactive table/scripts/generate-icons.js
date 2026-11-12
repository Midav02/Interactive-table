import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

// Simple valid PNG builder without external binary dependencies
function createPNG(width, height, r, g, b) {
  // A simple RGBA buffer
  const rowLength = width * 4 + 1; // 1 filter byte per row
  const buffer = Buffer.alloc(rowLength * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowLength;
    buffer[rowOffset] = 0; // Filter: None

    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;

      // Draw emerald background (#059669) with subtle grid icon
      const isMargin = x < width * 0.1 || x > width * 0.9 || y < height * 0.1 || y > height * 0.9;
      const isGridLine = (x % Math.floor(width / 6) === 0) || (y % Math.floor(height / 6) === 0);
      const isHeader = y >= height * 0.2 && y <= height * 0.32 && x >= width * 0.2 && x <= width * 0.8;
      const isCell = x >= width * 0.2 && x <= width * 0.8 && y >= height * 0.35 && y <= height * 0.8;

      if (isHeader) {
        // White header bar
        buffer[pixelOffset] = 255;
        buffer[pixelOffset + 1] = 255;
        buffer[pixelOffset + 2] = 255;
        buffer[pixelOffset + 3] = 255;
      } else if (isCell && isGridLine) {
        // Table cell border
        buffer[pixelOffset] = 167; // emerald-200
        buffer[pixelOffset + 1] = 243;
        buffer[pixelOffset + 2] = 208;
        buffer[pixelOffset + 3] = 255;
      } else if (isCell) {
        // Cell white background
        buffer[pixelOffset] = 240;
        buffer[pixelOffset + 1] = 253;
        buffer[pixelOffset + 2] = 244;
        buffer[pixelOffset + 3] = 255;
      } else {
        // Emerald background (#059669)
        buffer[pixelOffset] = r;
        buffer[pixelOffset + 1] = g;
        buffer[pixelOffset + 2] = b;
        buffer[pixelOffset + 3] = 255;
      }
    }
  }

  const deflated = zlib.deflateSync(buffer);

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // color type RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdrChunk = createChunk('IHDR', ihdrData);

  // IDAT chunk
  const idatChunk = createChunk('IDAT', deflated);

  // IEND chunk
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const length = data.length;
  const chunk = Buffer.alloc(4 + 4 + length + 4);
  chunk.writeUInt32BE(length, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);

  const crc = crc32(chunk.subarray(4, 8 + length));
  chunk.writeUInt32BE(crc, 8 + length);
  return chunk;
}

// CRC32 table
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ 0xffffffff) >>> 0;
}

const outDir = path.resolve(process.cwd(), 'public');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// 1. 192x192
fs.writeFileSync(path.join(outDir, 'pwa-192x192.png'), createPNG(192, 192, 5, 150, 105));
// 2. 512x512
fs.writeFileSync(path.join(outDir, 'pwa-512x512.png'), createPNG(512, 512, 5, 150, 105));
// 3. Maskable 512x512
fs.writeFileSync(path.join(outDir, 'pwa-maskable-512x512.png'), createPNG(512, 512, 4, 120, 87));
// 4. Apple touch icon 180x180
fs.writeFileSync(path.join(outDir, 'apple-touch-icon.png'), createPNG(180, 180, 5, 150, 105));
// 5. Favicon
fs.writeFileSync(path.join(outDir, 'favicon.ico'), createPNG(64, 64, 5, 150, 105));

console.log('PWA icons successfully generated in public/');
