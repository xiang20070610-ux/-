/**
 * 生成 TabBar 占位图标
 * 生成简单的 81x81 PNG 文件
 *
 * 运行: node scripts/generate-icons.js
 *
 * 注意：生成的图标是纯色占位图。
 * 正式发布前请替换为设计师提供的图标。
 */

const fs = require('fs');
const path = require('path');

const ICONS_DIR = path.join(__dirname, '..', 'miniprogram', 'images');

// 最小化 PNG 生成（1x1 透明像素作为占位）
// 微信开发者工具在找不到图标时会回退，这里生成占位文件确保配置不报错
function generateMinimalPNG(width, height, r, g, b) {
  // 使用 Node.js Buffer 手动构建最小 PNG
  // PNG 结构: Signature + IHDR + IDAT + IEND

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);   // width
  ihdrData.writeUInt32BE(height, 4);  // height
  ihdrData.writeUInt8(8, 8);          // bit depth
  ihdrData.writeUInt8(2, 9);          // color type (RGB)
  ihdrData.writeUInt8(0, 10);         // compression
  ihdrData.writeUInt8(0, 11);         // filter
  ihdrData.writeUInt8(0, 12);         // interlace

  const ihdr = createChunk('IHDR', ihdrData);

  // Raw pixel data (each row: filter byte + RGB * width)
  const rawData = Buffer.alloc(height * (1 + width * 3));
  for (let y = 0; y < height; y++) {
    const rowOffset = y * (1 + width * 3);
    rawData.writeUInt8(0, rowOffset); // filter: none
    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 3;
      rawData.writeUInt8(r, pixelOffset);
      rawData.writeUInt8(g, pixelOffset + 1);
      rawData.writeUInt8(b, pixelOffset + 2);
    }
  }

  // Compress with zlib (deflate)
  const zlib = require('zlib');
  const compressed = zlib.deflateSync(rawData);
  const idat = createChunk('IDAT', compressed);

  // IEND
  const iend = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

function createChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);

  const typeBuffer = Buffer.from(type, 'ascii');
  const crc = crc32(Buffer.concat([typeBuffer, data]));

  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crc, 0);

  return Buffer.concat([length, typeBuffer, data, crcBuffer]);
}

// CRC32 for PNG
function crc32(buf) {
  let crc = 0xFFFFFFFF;
  const table = makeCRCTable();

  for (let i = 0; i < buf.length; i++) {
    crc = table[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  }

  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function makeCRCTable() {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  return table;
}

// 图标定义
const icons = [
  { name: 'tab-home', active: false, color: [153, 153, 153] },
  { name: 'tab-home-active', active: true, color: [51, 51, 51] },
  { name: 'tab-inspire', active: false, color: [153, 153, 153] },
  { name: 'tab-inspire-active', active: true, color: [51, 51, 51] },
  { name: 'tab-lottery', active: false, color: [153, 153, 153] },
  { name: 'tab-lottery-active', active: true, color: [51, 51, 51] },
  { name: 'tab-mine', active: false, color: [153, 153, 153] },
  { name: 'tab-mine-active', active: true, color: [51, 51, 51] },
];

// 创建目录
if (!fs.existsSync(ICONS_DIR)) {
  fs.mkdirSync(ICONS_DIR, { recursive: true });
}

// 生成图标
console.log('🎨 生成占位图标...\n');
for (const icon of icons) {
  const filePath = path.join(ICONS_DIR, `${icon.name}.png`);
  const [r, g, b] = icon.color;
  const png = generateMinimalPNG(81, 81, r, g, b);
  fs.writeFileSync(filePath, png);
  console.log(`  ✅ ${icon.name}.png (${icon.active ? '选中' : '默认'}色)`);
}

console.log(`\n📁 图标已生成到: ${ICONS_DIR}`);
console.log('⚠️  注意：这些是纯色占位图标，请替换为正式设计图标！');
