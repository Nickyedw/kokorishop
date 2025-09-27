// scripts/copy404.mjs
import { copyFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';

const outDir = 'docs';
const from = `${outDir}/index.html`;
const to = `${outDir}/404.html`;

if (!existsSync(outDir)) {
  await mkdir(outDir, { recursive: true });
}

if (!existsSync(from)) {
  console.error(`❌ No se encontró ${from}. Corre primero: npm run build`);
  process.exit(1);
}

await copyFile(from, to);
console.log('✅ 404.html creado en /docs a partir de index.html');
