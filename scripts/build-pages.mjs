import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, '.pages-site');
const demo = path.join(root, 'demo');
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

for (const [source, target, entry] of [
  ['bytezwork.html', 'index.html', 'bytezwork-avatar.js'],
  ['index.html', 'robot.html', 'agent-robot-avatar.js'],
]) {
  const html = await readFile(path.join(demo, source), 'utf8');
  const pagesHtml = html.replace('../' + entry, './' + entry);
  if (pagesHtml === html) throw new Error('Demo entry import not found: ' + source);
  await writeFile(path.join(output, target), pagesHtml);
}
for (const entry of ['agent-robot-avatar.js', 'bytezwork-avatar.js']) {
  await cp(path.join(root, entry), path.join(output, entry));
}
await cp(path.join(root, 'src'), path.join(output, 'src'), { recursive: true });
for (const entry of await readdir(demo, { withFileTypes: true })) {
  if (entry.isFile() && entry.name.endsWith('.js')) {
    await cp(path.join(demo, entry.name), path.join(output, entry.name));
  }
}
console.log('GitHub Pages demo built at ' + output);
