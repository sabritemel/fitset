import * as E from '../js/anim/engine.js';
import { EX } from '../js/data/exercises.js';
import fs from 'fs';

const kare = (ex, t) => {
  const p = E.poseAt(ex.a, ex.b, t), s = E.skeleton(p, ex.view);
  return `<svg viewBox="0 20 260 180"><g class="art" stroke="currentColor" stroke-width="3.6"
     fill="none" stroke-linecap="round" stroke-linejoin="round">
     ${ex.nofoot ? '' : '<line x1="10" y1="186" x2="250" y2="186" stroke-width="1.2" opacity=".3"/>'}
     ${ex.eq ? ex.eq(s) : ''}${E.figure(s, ex)}</g></svg>`;
};

const hucreler = [];
for (const [d, g] of EX.entries())
  for (const ex of g) {
    if (ex.hold) continue;
    const etiket = `${ex.view}${ex.top ? ' · ÜSTTEN' : ''}${ex.face === -1 ? ' ←' : ex.view === 'side' ? ' →' : ''}`;
    hucreler.push(`<div class="c">
      <div class="hd"><b lang="en">${ex.en}</b><span>${d + 1}. Gün · ${etiket}</span></div>
      <div class="p">${kare(ex, 0)}${kare(ex, 1)}</div></div>`);
  }

fs.writeFileSync('mockup-cizimler.html',
`<body style="background:#0A0B0D;color:#BFC4CC;font:13px sans-serif;margin:0;padding:16px">
<style>
.g{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.c{border:1px solid #ffffff14;border-radius:10px;padding:9px}
.hd b{display:block;font-size:13px;color:#CDD1D7}
.hd span{font-size:10.5px;color:#777E88;letter-spacing:.04em;text-transform:uppercase}
.p{display:flex;gap:4px;margin-top:4px}
svg{width:50%;height:auto}
</style>
<div class="g">${hucreler.join('')}</div></body>`);
console.log('tabaka yazildi ·', hucreler.length, 'hareket');
