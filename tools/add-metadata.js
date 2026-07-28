/**
 * METADATA EKLEYİCİ — tek seferlik, EKLEMELİ (hiçbir mevcut alanı değiştirmez).
 *
 * Neden: prototipte egzersizin kimliği DİZİ SIRASIYDI (`state["0-8"]`). Araya bir
 * egzersiz eklendiğinde tüm geçmiş yanlış egzersize kayardı. Ayrıca "ağırlık ×
 * tekrar" örtük varsayımı Plank (süre) ve kardiyo (dakika) ile ilk seansta
 * çarpışıyordu.
 *
 * Eklenen alanlar:
 *   id         DEĞİŞMEZ kimlik — geçmiş kayıtları buna bağlanır, ada/sıraya değil
 *   setType    "weight_reps" | "time" | "cardio"
 *   target     {reps} | {seconds} | {minutes}
 *   equipment  ağırlık girişinin ne anlama geldiğini belirler:
 *              barbell → bar DAHİL toplam · dumbbell → TEK dambıl (hacimde ×2)
 *   setsMin    set sayısı aralıklıysa alt sınır (örn. "2-3 × 12")
 *
 * ⚠️ id'ler DEĞİŞMEZ. Bir egzersizin adını değiştirebilirsin, id'sini ASLA —
 *    değiştirirsen o egzersizin tüm geçmişi kopar.
 *
 *   node tools/add-metadata.js
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const FILE = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'js', 'data', 'exercises.js');

//                                  id                      ekipman       hedef          setsMin
const META = {
  'Barbell Bench Press':            ['bb_bench_press',        'barbell',    { reps: 12 }],
  'Dumbbell Bench Fly':             ['db_bench_fly',          'dumbbell',   { reps: 12 }],
  'Incline Chest Press Machine':    ['machine_incline_press', 'machine',    { reps: 12 }],
  'Dumbbell Shoulder Press':        ['db_shoulder_press',     'dumbbell',   { reps: 12 }],
  'Cable Front Raise':              ['cable_front_raise',     'cable',      { reps: 12 }],
  'Reverse Pec Fly':                ['machine_reverse_fly',   'machine',    { reps: 12 }],
  'V-Bar Push Down':                ['cable_vbar_pushdown',   'cable',      { reps: 12 }, 2],
  'One Arm Overhead Dumbbell Ext.': ['db_overhead_ext',       'dumbbell',   { reps: 12 }, 2],
  'Plank':                          ['plank',                 'bodyweight', { seconds: 15 }],
  'Close Grip Pull Down':           ['cable_close_pulldown',  'cable',      { reps: 12 }],
  'Two Arm Dumbbell Row':           ['db_two_arm_row',        'dumbbell',   { reps: 12 }],
  'Seated Cable Row':               ['cable_seated_row',      'cable',      { reps: 12 }],
  'Cable Curl':                     ['cable_curl',            'cable',      { reps: 12 }],
  'Dumbbell Hammer Curl':           ['db_hammer_curl',        'dumbbell',   { reps: 12 }],
  'Leg Press':                      ['machine_leg_press',     'machine',    { reps: 12 }],
  'Lunge':                          ['lunge',                 'bodyweight', { reps: 12 }],
  'Calf Raise':                     ['calf_raise',            'bodyweight', { reps: 12 }],
};

let src = fs.readFileSync(FILE, 'utf8');
if (src.includes(' id:"')) { console.log('⚠ metadata zaten eklenmiş — çıkılıyor (betik tek seferliktir)'); process.exit(0); }

let n = 0;
src = src.replace(/^ en:"([^"]+)", tr:"([^"]+)", sets:(\d+), reps:"([^"]+)",$/gm,
  (line, en, tr, sets, reps) => {
    const m = META[en];
    if (!m) throw new Error(`META tablosunda yok: ${en}`);
    const [id, equipment, target, setsMin] = m;
    const setType = target.seconds !== undefined ? 'time' : target.minutes !== undefined ? 'cardio' : 'weight_reps';
    n++;
    return ` id:"${id}", setType:"${setType}", equipment:"${equipment}", target:${JSON.stringify(target)},`
      + (setsMin ? ` setsMin:${setsMin},` : '')
      + `\n${line}`;
  });

// Kardiyo bitirici: programda VAR ama veri modelinde yeri yoktu
src = src.replace(/^ \{h:"Antrenman sonrası koşu bandı — 20 dk"/m,
  ' {id:"cardio", setType:"cardio", target:{minutes:20}, h:"Antrenman sonrası koşu bandı — 20 dk"');
src = src.replace(/^ \{h:"Antrenman sonrası koşu bandı veya bisiklet — 20 dk"/m,
  ' {id:"cardio", setType:"cardio", target:{minutes:20}, modes:["koşu bandı","bisiklet"], h:"Antrenman sonrası koşu bandı veya bisiklet — 20 dk"');

fs.writeFileSync(FILE, src, 'utf8');
console.log(`✓ ${n} egzersize metadata eklendi + 2 kardiyo bitiricisi tiplendi`);
