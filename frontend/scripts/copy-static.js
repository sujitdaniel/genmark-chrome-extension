import { resolve } from 'path';
import { cp } from 'fs/promises';

const __dirname = resolve();

await cp(
  resolve(__dirname, 'src/manifest.json'),
  resolve(__dirname, 'dist/manifest.json')
);

await cp(
  resolve(__dirname, 'src/assets'),
  resolve(__dirname, 'dist/assets'),
  { recursive: true }
);
