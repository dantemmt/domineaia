#!/usr/bin/env node
// Gera um vídeo "1 corte vs N cortes" (ASMR, sem fala).
// Uso: node render.mjs --theme abacate [--stages 1,10,100,1000] [--lang pt|en] [--seed 1]
//                      [--out out/abacate.mp4] [--fps 30] [--stills 1,5,9] [--no-music] [--outro "texto"]
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const ROOT = path.dirname(fileURLToPath(import.meta.url));

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const flag = k => args.includes('--' + k);

const theme = opt('theme', 'abacate');
const stages = opt('stages', '1,10,100,1000').split(',').map(Number);
const lang = opt('lang', 'pt');
const seed = Number(opt('seed', '1'));
const fps = Number(opt('fps', '30'));
const out = path.resolve(opt('out', path.join(ROOT, 'out', `${theme}-${stages.join('-')}${lang === 'pt' ? '' : '-' + lang}.mp4`)));
const stills = opt('stills', null);
const outro = opt('outro', undefined);
const target = opt('target', undefined);
const music = !flag('no-music');

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.woff2': 'font/woff2', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const port = server.address().port;

const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') console.log('[page]', m.text()); });
page.on('pageerror', e => console.log('[pageerror]', e.message));
await page.goto(`http://127.0.0.1:${port}/web/index.html`);
await page.waitForFunction(() => window.__ready === true);
const info = await page.evaluate(o => window.setupVideo(o), { theme, stages, lang, seed, outro, target });
console.log(`tema=${theme} etapas=${stages.join(',')} duração=${info.duration.toFixed(2)}s cues=${info.cues.length}`);

fs.mkdirSync(path.dirname(out), { recursive: true });

if (stills) {
  for (const t of stills.split(',').map(Number)) {
    await page.evaluate(t => window.renderAt(t), t);
    const f = out.replace(/\.mp4$/, `-t${t}.jpg`);
    await page.screenshot({ path: f, type: 'jpeg', quality: 90 });
    console.log('still', f);
  }
  await browser.close(); server.close(); process.exit(0);
}

// áudio
const tmpDir = fs.mkdtempSync(path.join(path.dirname(out), '.tmp-'));
const cuesFile = path.join(tmpDir, 'cues.json'), wav = path.join(tmpDir, 'audio.wav');
fs.writeFileSync(cuesFile, JSON.stringify({ duration: info.duration, cues: info.cues, music, seed }));
const py = spawnSync('python3', [path.join(ROOT, 'sfx.py'), cuesFile, wav], { stdio: 'inherit' });
if (py.status !== 0) throw new Error('sfx.py falhou');

// vídeo
const nFrames = Math.ceil(info.duration * fps);
const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-',
  '-i', wav, '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', String(fps),
  '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
const t0 = Date.now();
for (let f = 0; f < nFrames; f++) {
  await page.evaluate(t => window.renderAt(t), f / fps);
  const buf = await page.screenshot({ type: 'jpeg', quality: 94 });
  if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
  if (f % 30 === 0) process.stdout.write(`\rframe ${f}/${nFrames}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
}
ff.stdin.end();
await new Promise(r => ff.on('close', r));
console.log(`\npronto: ${out}`);
fs.rmSync(tmpDir, { recursive: true, force: true });
await browser.close(); server.close();
