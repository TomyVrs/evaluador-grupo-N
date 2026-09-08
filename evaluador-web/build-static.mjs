import { cp, copyFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
const out = join(root, 'dist');

await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
await cp(join(root, 'public'), out, { recursive: true });

for (const file of ['engine.mjs', 'engine_v2.mjs', 'engine_v3.mjs', 'engine_v4.mjs']) {
  await copyFile(join(root, file), join(out, file));
}

const appPath = join(out, 'app.js');
const app = await readFile(appPath, 'utf8');
await writeFile(appPath, app.replace("from '/engine_v3.mjs'", "from '/engine_v4.mjs'"), 'utf8');

console.log('Build estático listo en evaluador-web/dist');
