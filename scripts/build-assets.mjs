// Erzeugt Scroll-Frames und Bildvarianten aus ../media-src (nicht im Repo).
// Voraussetzung: ffmpeg im PATH. Ausgabe: public/media + src/lib/media.generated.json
import { execFileSync } from 'node:child_process';
import { mkdirSync, readdirSync, rmSync, writeFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

const SRC = '../media-src';
const OUT = 'public/media';
const ONLY = process.argv[2];

const variants = [
  // step 3: jedes dritte Bild aus 24 fps (8 Bilder pro Filmsekunde). Harte Schnitte zwischen
  // den drei Clips (film-cut-*), keine Überblendung – der Player zeigt immer genau ein Bild.
  { dir: 'film/d1920', file: 'film-cut-16x9.mp4', vf: 'crop=1920:1080:0:4', q: '56', step: 3 },
  { dir: 'film/d1280', file: 'film-cut-16x9.mp4', vf: 'crop=1920:1080:0:4,scale=1280:720:flags=lanczos', q: '60', step: 3 },
  { dir: 'film/p640', file: 'film-cut-9x16.mp4', vf: 'crop=1080:1920:4:0,scale=640:1138:flags=lanczos', q: '56', step: 3 },
];

import { existsSync, readFileSync } from 'node:fs';
const MANIFEST = 'src/lib/media.generated.json';
const manifest = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, 'utf8')) : { film: {} };
const VARIANT = process.argv[3];
if (!ONLY || ONLY === 'film') {
  for (const v of variants.filter((x) => !VARIANT || x.dir.endsWith(VARIANT))) {
    const dir = join(OUT, v.dir);
    rmSync(dir, { recursive: true, force: true });
    mkdirSync(dir, { recursive: true });
    execFileSync('ffmpeg', [
      '-loglevel', 'error', '-i', join(SRC, 'video', v.file),
      '-vf', `select='not(mod(n\\,${v.step}))',${v.vf}`,
      '-vsync', 'vfr', '-c:v', 'libwebp', '-quality', v.q, '-compression_level', '5',
      join(dir, '%03d.webp'),
    ]);
    const files = readdirSync(dir).filter((f) => f.endsWith('.webp'));
    const bytes = files.reduce((s, f) => s + statSync(join(dir, f)).size, 0);
    // Poster (LCP) als AVIF
    await sharp(join(dir, '001.webp')).avif({ quality: 58, effort: 7 }).toFile(join(dir, 'poster.avif'));
    manifest.film[v.dir.split('/')[1]] = files.length;
    console.log(v.dir, files.length, 'Frames', (bytes / 1e6).toFixed(1), 'MB');
  }
  delete manifest.film.p720;
  writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
}

// Standbilder: Pizzen (quadratisch) und Raum (16:9)
if (!ONLY || ONLY === 'stills') {
  mkdirSync(join(OUT, 'img'), { recursive: true });
  const stills = readdirSync(join(SRC, 'stills')).filter((f) => f.endsWith('.jpg'));
  for (const f of stills) {
    const name = f.replace('.jpg', '');
    const widths = name === 'room' ? [960, 1280] : [480, 960];
    for (const w of widths) {
      const img = sharp(join(SRC, 'stills', f)).resize({ width: w });
      await img.clone().avif({ quality: 52, effort: 6 }).toFile(join(OUT, 'img', `${name}-${w}.avif`));
      await img.clone().webp({ quality: 76 }).toFile(join(OUT, 'img', `${name}-${w}.webp`));
    }
  }
  console.log('Standbilder:', stills.length);
}
