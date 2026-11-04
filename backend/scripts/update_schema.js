const fs = require('fs');
const path = require('path');

const zones = [
  { prefix: 'A', name: 'Lantai 1 - Sayap Kiri', count: 50 },
  { prefix: 'B', name: 'Lantai 1 - Sayap Kanan', count: 50 },
  { prefix: 'C', name: 'Lantai 2 - Ruang Baca & Referensi', count: 50 },
  { prefix: 'D', name: 'Lantai 2 - Ruang Digital & Tandon', count: 50 }
];

const lockerValues = [];
zones.forEach(z => {
  for (let i = 1; i <= z.count; i++) {
    const num = `${z.prefix}-${i < 10 ? '0' + i : i}`;
    let size = 'sedang';
    if (i <= 10) size = 'besar';
    else if (i > 40) size = 'kecil';
    
    let status = 'kosong';
    let catatan = 'Kondisi baik';
    if (num === 'B-50' || num === 'D-50') {
      status = 'rusak';
      catatan = 'Dalam perbaikan pemeliharaan';
    }
    lockerValues.push(`  ('${num}', '${z.name}', '${size}', '${status}', '${catatan}')`);
  }
});

const sqlPart = `-- Data 200 Loker Perpustakaan (4 Zona x 50 Loker)\nINSERT INTO lokers (nomor, lokasi, ukuran, status, catatan) VALUES\n${lockerValues.join(',\n')}\nON DUPLICATE KEY UPDATE lokasi = VALUES(lokasi), ukuran = VALUES(ukuran);`;

const schemaPath = path.join(__dirname, '../../database/schema.sql');
let schema = fs.readFileSync(schemaPath, 'utf8');
const regex = /-- Data Loker[\s\S]*?ON DUPLICATE KEY UPDATE lokasi = VALUES\(lokasi\);/;
schema = schema.replace(regex, sqlPart);
fs.writeFileSync(schemaPath, schema, 'utf8');
console.log('schema.sql updated with 200 lockers successfully.');

