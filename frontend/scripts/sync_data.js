import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');
const frontendPublic = path.resolve(__dirname, '../public');

console.log('[sync_data] Project root:', projectRoot);
console.log('[sync_data] Frontend public:', frontendPublic);

const targets = [
  { src: path.join(projectRoot, 'data/processed'), dest: path.join(frontendPublic, 'data/processed') },
  { src: path.join(projectRoot, 'data/raw'), dest: path.join(frontendPublic, 'data/raw') },
  { src: path.join(projectRoot, 'outputs/phase4'), dest: path.join(frontendPublic, 'outputs/phase4') },
  { src: path.join(projectRoot, 'outputs/phase5'), dest: path.join(frontendPublic, 'outputs/phase5') },
  { src: path.join(projectRoot, 'outputs/phase6'), dest: path.join(frontendPublic, 'outputs/phase6') },
  { src: path.join(projectRoot, 'outputs/phase7'), dest: path.join(frontendPublic, 'outputs/phase7') },
  { src: path.join(projectRoot, 'outputs/phase8'), dest: path.join(frontendPublic, 'outputs/phase8') },
  { src: path.join(projectRoot, 'outputs/phase9'), dest: path.join(frontendPublic, 'outputs/phase9') },
  { src: path.join(projectRoot, 'outputs/phase10'), dest: path.join(frontendPublic, 'outputs/phase10') },
];

for (const target of targets) {
  if (fs.existsSync(target.src)) {
    fs.mkdirSync(target.dest, { recursive: true });
    const files = fs.readdirSync(target.src);
    for (const file of files) {
      const srcFile = path.join(target.src, file);
      const destFile = path.join(target.dest, file);
      if (fs.statSync(srcFile).isFile()) {
        fs.copyFileSync(srcFile, destFile);
      }
    }
    console.log(`[sync_data] Synced ${target.src} -> ${target.dest}`);
  } else {
    console.warn(`[sync_data] Source directory not found: ${target.src}`);
  }
}

console.log('[sync_data] Data sync complete.');
