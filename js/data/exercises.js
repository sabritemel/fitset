/**
 * EGZERSİZ VERİSİ — prototipten MEKANİK olarak taşındı (elle yazılmadı).
 * Kaynak: antrenman-programi_1.html
 * Araç:   tools/extract-from-prototype.js
 *
 * ┌─ YENİ EGZERSİZ EKLEMEK ─────────────────────────────────────────────────┐
 * │ 1. Aşağıdaki diziye bir nesne ekle. Zorunlu alanlar:                    │
 * │      en, tr        İngilizce + Türkçe ad                                │
 * │      sets, reps    set sayısı (veri) + etiket (görsel)                  │
 * │      view          'side' | 'front'                                     │
 * │      mus           çalışan kaslar (tek satır)                           │
 * │      a, b          başlangıç ve bitiş pozu — DERECE cinsinden açılar    │
 * │      eq            ekipman çizimi: (skeleton) => SVG string             │
 * │      steps         4 adımlık anlatım                                    │
 * │      tip           kırmızı "dikkat" notu                                │
 * │ 2. İsteğe bağlı: face(-1|1), nofoot, legs2, track, top, vl, al          │
 * │ 3. ⚠️ ZORUNLU: node tools/verify-poses.js çalıştır.                     │
 * │    Betik uzuv uzunluğunu, eklem limitini ve ayak-yerde kuralını         │
 * │    sayısal olarak denetler. Kırmızı varsa poz anatomik olarak yanlıştır.│
 * └──────────────────────────────────────────────────────────────────────────┘
 *
 * Poz alanlarının anlamı için: js/anim/engine.js başlığı.
 */
import { plate, db, bar, cbl, rct, grd, grip } from '../anim/equipment.js';

export const EX=[[
{
 id:"bb_bench_press", setType:"weight_reps", equipment:"barbell", target:{"reps":12},
 en:"Barbell Bench Press", tr:"Bar ile düz bench press", sets:3, reps:"3 × 12",
 view:"side", face:-1, mus:"Göğüs · Ön omuz · Triceps",
 a:{px:100,py:122,torso:0,ua:203,fa:63,th:-130,sh:-67},
 b:{px:100,py:122,torso:0,ua:90,fa:90,th:-130,sh:-67},
 eq:s=>grd()+bar([50,128],[178,128])+bar([60,128],[60,186])+bar([170,128],[170,186])+plate(s.haA),
 steps:["Sırtüstü uzan; gözlerin barın tam altında, ayakların yere basıyor, dizler bükülü.",
        "Kürek kemiklerini birbirine sıkıştırıp göğsünü hafif yukarı ver — sırtında küçük bir boşluk kalır.",
        "Barı göğsünün alt kısmına 2 saniyede indir, hafifçe değdir ve nefes vererek yukarı it.",
        "Bar aşağıda meme hizasında, yukarıda omuzların üzerindedir; yol hafif bir yay çizer."],
 tip:"Dirseklerin gövdenle 45° açı yapsın, tam yana açma. Kalçanı sedyeden kaldırma, ağır setlerde yanında biri dursun."
},
{
 id:"db_bench_fly", setType:"weight_reps", equipment:"dumbbell", target:{"reps":12},
 en:"Dumbbell Bench Fly", tr:"Dambıl ile göğüs açma (kelebek)", sets:3, reps:"3 × 12",
 view:"front", top:true, nofoot:true, vl:"yukarıdan görünüm · sırtüstü", mus:"Göğüs (dış ve orta)",
 a:{px:95,py:110,torso:0,ua:-90,fa:-90,ua2:90,fa2:90,th:180,sh:180,al:1},
 b:{px:95,py:110,torso:0,ua:-90,fa:-90,ua2:90,fa2:90,th:180,sh:180,al:0.3},
 eq:s=>rct(26,92,134,36)+db(s.haA,false)+db(s.haB,false),
 steps:["Sırtüstü uzan; dambıllar göğsünün üzerinde, avuç içleri birbirine bakar.",
        "Dirseklerini hafif bükülü sabitle — bu açı hareket boyunca hiç değişmez.",
        "Kolları yanlara doğru geniş bir yayla aç; göğsünde gerilme hissedince dur (dirsekler omuz hizasını fazla geçmesin).",
        "Aynı yaydan kucaklar gibi geri getir, yukarıda dambılları çarpıştırma."],
 tip:"Bu bir itme değil kucaklama hareketi; ağırlık presten belirgin küçük olmalı. Dirseği düz kilitlersen omuz eklemi zorlanır."
},
{
 id:"machine_incline_press", setType:"weight_reps", equipment:"machine", target:{"reps":12},
 en:"Incline Chest Press Machine", tr:"Eğik göğüs presi makinesi", sets:3, reps:"3 × 12",
 view:"side", face:1, mus:"Göğüs üstü · Ön omuz · Triceps",
 a:{px:112,py:149,torso:115,ua:-86,fa:26,th:0,sh:-90},
 b:{px:112,py:149,torso:115,ua:13,fa:41,th:0,sh:-90},
 eq:s=>grd()+rct(90,155,54,10)+bar([104,158],[79,102])+grip(s.haA),
 steps:["Oturağı, tutamaklar göğsünün üst kısmı hizasına gelecek şekilde ayarla; sırtın ve başın mindere yaslı.",
        "Tutamakları kavra; başlangıçta dirsekler gövdenin biraz gerisinde ve aşağıda kalır.",
        "Nefes vererek yukarı-ileri doğru it — sırtın 45°'ye yakın yatık olduğu için yol yukarı doğrudur.",
        "3 saniyede geri bırak; eller göğüs hizasına gelince dur, ağırlığı çarptırma."],
 tip:"Sırtın minderden kalkıyorsa ağırlık fazla. Omuzları kulaklara doğru kaldırma, aşağıda ve geride tut."
},
{
 id:"db_shoulder_press", setType:"weight_reps", equipment:"dumbbell", target:{"reps":12},
 en:"Dumbbell Shoulder Press", tr:"Dambıl ile omuz presi", sets:3, reps:"3 × 12",
 view:"front", mus:"Omuz (ön ve orta) · Triceps",
 a:{px:130,py:149,torso:90,ua:-35,fa:90,ua2:215,fa2:90,th:0,sh:-90,th2:0,sh2:-90},
 b:{px:130,py:149,torso:90,ua:80,fa:90,ua2:100,fa2:90,th:0,sh:-90,th2:0,sh2:-90},
 eq:s=>grd()+rct(100,155,60,10)+db(s.haA,false)+db(s.haB,false),
 steps:["Sırtın destekli otur; dambıllar omuz hizasında, ön kolların yere dik, avuç içleri öne bakar.",
        "Karnını hafif sık ve nefes vererek yukarı it; dambıllar tepede birbirine yaklaşır.",
        "Kollar tam kilitlenmeden dur, sonra kontrollü indir.",
        "Dirsekler kulak hizasının biraz altına inince yeni tekrara başla."],
 tip:"Beli boşluğa alıp geriye yaslanma — o zaman hareket göğüs presine döner. Omuzda sıkışma olursa avuçları birbirine baktır."
},
{
 id:"cable_front_raise", setType:"weight_reps", equipment:"cable", target:{"reps":12},
 en:"Cable Front Raise", tr:"Kabloyla öne omuz kaldırma", sets:3, reps:"3 × 12",
 view:"side", face:-1, mus:"Ön omuz",
 a:{px:130,py:110,torso:90,ua:-100,fa:-100,th:-90,sh:-90},
 b:{px:130,py:110,torso:90,ua:-176,fa:-176,th:-90,sh:-90},
 eq:s=>grd()+rct(206,148,14,38)+cbl([210,168],s.haA)+grip(s.haA),
 steps:["Alçak makaraya sırtın dönük dur; kablo bacaklarının arasından geçer, tutamak uyluğunun önündedir.",
        "Karnını sık, dizleri hafif bükük tut.",
        "Kolunu düz tutarak öne-yukarı kaldır; omuz hizasında, kol yere paralel olunca dur.",
        "Aynı yavaşlıkta indir; kablo seni geri çekmesin."],
 tip:"Gövdeni geriye yaslayarak sallama; omuz hizasını geçip yukarı fırlatma. Zorlanıyorsan ağırlığı düşür."
},
{
 id:"machine_reverse_fly", setType:"weight_reps", equipment:"machine", target:{"reps":12},
 en:"Reverse Pec Fly", tr:"Ters kelebek — arka omuz", sets:3, reps:"3 × 12",
 view:"front", top:true, nofoot:true, vl:"yukarıdan görünüm · göğüs pedde", mus:"Arka omuz · Üst sırt (kürek kasları)",
 a:{px:95,py:110,torso:0,ua:-90,fa:-90,ua2:90,fa2:90,th:180,sh:180,al:0.3},
 b:{px:95,py:110,torso:0,ua:-100,fa:-100,ua2:100,fa2:100,th:180,sh:180,al:1},
 // MAKİNE: sütun + iki pivotlu kol. Üstten görünümde makinenin kolları
 // ellerle birlikte süpürür; hareketin aletle yapıldığı artık belli.
 eq:s=>rct(50,92,106,36)+rct(170,88,12,44)+bar([176,122],s.haA)+bar([176,98],s.haB)+grip(s.haA)+grip(s.haB),
 steps:["Göğsün pede yaslanacak şekilde otur; ayaklar yere basar, göğüs pedden ayrılmaz.",
        "Tutamakları öne uzanmış, dirsekleri hafif bükülü kollarla omuz hizasında kavra.",
        "Önce kürek kemiklerini birbirine sık, sonra kolları geniş bir yayla arkaya-yanlara aç.",
        "En arkada 1 saniye bekle ve kontrollü şekilde öne bırak."],
 tip:"Kolları omuz hizasının üstüne kaldırma ve boynunu öne uzatma. Hareketi omuz değil sırt başlatır."
},
{
 id:"cable_vbar_pushdown", setType:"weight_reps", equipment:"cable", target:{"reps":12}, setsMin:2,
 en:"V-Bar Push Down", tr:"V bar ile triceps itme", sets:3, reps:"2-3 × 12",
 view:"side", face:1, mus:"Triceps",
 a:{px:130,py:110,torso:88,ua:-78,fa:30,th:-90,sh:-90},
 b:{px:130,py:110,torso:88,ua:-78,fa:-84,th:-90,sh:-90},
 eq:s=>grd()+rct(190,22,16,12)+cbl([198,34],s.haA)+bar([s.haA[0]-10,s.haA[1]-4],[s.haA[0]+10,s.haA[1]+4]),
 steps:["V barı omuz genişliğinde, avuç içleri aşağı bakacak şekilde tut; hafif öne eğil, dizler yumuşak.",
        "Dirsekleri gövdenin yanına kilitle — başlangıçta ön kolların yere yakın paralel, bar göğüs hizasında.",
        "Sadece ön kolları hareket ettirerek barı uyluklarına doğru it; aşağıda kolları tam uzat ve tricepsi 1 saniye sık.",
        "Ön kolları yavaşça yukarı bırak; dirsekler yerinden oynamasın."],
 tip:"Dirsekler yanlara açılıyor ya da gövdeni öne düşürüp bastırıyorsan ağırlık fazla. Omuzları kulaklardan uzak tut."
},
{
 id:"db_overhead_ext", setType:"weight_reps", equipment:"dumbbell", target:{"reps":12}, setsMin:2,
 en:"One Arm Overhead Dumbbell Ext.", tr:"Tek kol baş üstü triceps", sets:3, reps:"2-3 × 12",
 view:"side", face:1, mus:"Triceps (uzun baş)",
 a:{px:110,py:149,torso:90,ua:96,fa:210,th:0,sh:-90},
 b:{px:110,py:149,torso:90,ua:94,fa:92,th:0,sh:-90},
 eq:s=>grd()+rct(84,155,66,10)+db(s.haA,true),
 steps:["Dik otur, karnını sık; dambılı tek elle başının üzerine kaldır, üst kolun kulağının yanında dik durur.",
        "Sadece dirsekten bükerek dambılı ensenin arkasına indir — üst kol baştan sona sabit kalır.",
        "Ön kolda gerilme hissedince dur ve tricepsini sıkarak yukarı uzat.",
        "Bir kolu bitirip diğerine geç."],
 tip:"Dirsek dışa açılırsa yük tricepsten çıkar; boş elinle dirseği hafifçe sabitleyebilirsin. Omuz ağrısı olursa hareket açıklığını kısalt."
},
{
 id:"plank", setType:"time", equipment:"bodyweight", target:{"seconds":15},
 en:"Plank", tr:"Plank — karın duruşu", sets:3, reps:"3 × 15 sn",
 // hold:true → izometrik: oynatacak hareket yok, arayüz GERİ SAYIM gösterir.
 // Ama görsel yine ŞART — kimsenin hareketi bildiğini varsaymıyoruz. İzometrik
 // bir harekette öğretici olan tek kare değil, DOĞRU ile YANLIŞ arasındaki fark:
 // Plank'ta işin tamamı gövde çizgisini korumak. variants[] onu gösterir.
 //
 // Pozlar elle uydurulmadı, kısıtlardan ÇÖZÜLDÜ (ön kol ve ayak ucu zeminde):
 //   sin(torso) = (py − 148) / 60      omuzu 148'e sabitler (dirsek zeminde)
 //   sin(bacak) = (py − 179) / 76      ayağı zemine sabitler
 // Kalça yüksekliği (py) tek serbest değişken: 158 doğru · 170 çökük · 143 yüksek.
 view:"side", face:1, nofoot:true, track:"P", hold:true, mus:"Karın · Gövde stabilizasyonu",
 variants:[
   {ok:true, label:"Doğru", note:"Baştan topuğa tek düz çizgi",
    pose:{px:140,py:158,torso:9.6,ua:-90,fa:0,th:196,sh:196}},
   {label:"Kalça çökük", note:"Bel çukurlaşır, yük omurgaya geçer — süre dolmadan bitir",
    pose:{px:140,py:170,torso:21.5,ua:-90,fa:0,th:186.8,sh:186.8}},
   {label:"Kalça yüksek", note:"Kalça yukarı kaçar, karın devreden çıkar — hareket kolaylaşır",
    pose:{px:140,py:143,torso:-4.8,ua:-90,fa:0,th:208.3,sh:208.3}},
 ],
 a:{px:140,py:158,torso:10,ua:-75,fa:5,th:196,sh:196},
 b:{px:140,py:152,torso:12,ua:-75,fa:5,th:196,sh:196},
 eq:s=>grd(179)+bar(s.ftA,[s.ftA[0]+7,179]),
 steps:["Dirsekler omuzlarının tam altında, ön kolların yerde ve öne dönük; ayaklar kalça genişliğinde, parmak uçlarında.",
        "Gövden baştan topuğa tek bir düz çizgi olsun — kalçanı ne yukarı kaldır ne aşağı düşür.",
        "Karnını ve kalçanı sık, bakışın ellerinin biraz önüne olsun.",
        "Normal nefes alarak 15 saniye koru."],
 tip:"Belinde çukurlaşma başladıysa süre dolmadan bitir; kaliteli 10 saniye, çöken 20 saniyeden iyidir. Nefesini tutma."
}
],[
{
 id:"cable_close_pulldown", setType:"weight_reps", equipment:"cable", target:{"reps":12},
 en:"Close Grip Pull Down", tr:"Dar tutuş lat çekişi", sets:3, reps:"3 × 12",
 view:"side", face:-1, mus:"Sırt (latissimus) · Biceps",
 a:{px:130,py:149,torso:95,ua:119,fa:96,th:180,sh:-90},
 // DÜZELTME: ua −90° yerine 270° yazılı. Aynı YÖN (cos/sin özdeş), farklı YOL:
 // −90 yazılınca interpolasyon 119°→−90° arasını uzun yoldan (Δ=−209°) dolaşıp
 // kolu gövdenin ARKASINDAN geçiriyor ve t≈0.80'de dirseği 179°'ye katlıyordu.
 // 270 ile kısa yoldan (Δ=+151°) gidiyor: kol ÖNDEN iniyor, dirsek tepe 131°.
 b:{px:130,py:149,torso:95,ua:270,fa:139,th:180,sh:-90},
 eq:s=>rct(104,155,54,10)+bar([96,140],[124,140])+cbl([107,6],s.haA)+bar([s.haA[0],s.haA[1]-8],[s.haA[0],s.haA[1]+8]),
 steps:["Otur ve diz pedini uyluklarını sabitleyecek şekilde ayarla; barı omuz genişliğinden dar kavra.",
        "Göğsünü yukarı ver, gövdeni çok az geriye yasla ve bu açıyı koru.",
        "Barı göğsünün üst kısmına çek — dirsekler yanlardan aşağı ve geriye iner, bilekler düz kalır.",
        "Aşağıda kürekleri sıkıp 1 saniye bekle, sonra kolları kontrollü şekilde tam yukarı uzat."],
 tip:"Barı ense arkasına çekme ve gövdeni yatırarak sallanma. Hareketi kolla değil, dirseklerini arka cebine sokar gibi sırtla başlat."
},
{
 id:"db_two_arm_row", setType:"weight_reps", equipment:"dumbbell", target:{"reps":12},
 en:"Two Arm Dumbbell Row", tr:"Çift dambıl kürek çekişi", sets:3, reps:"3 × 12",
 view:"side", face:-1, mus:"Sırt (orta) · Arka omuz · Biceps",
 a:{px:140,py:110,torso:128,ua:-88,fa:-88,th:-84,sh:-99},
 // Hareket açıklığı dar çizilmişti (yol 0.42); dambıl karın hizasına kadar çekiliyor.
 b:{px:140,py:110,torso:128,ua:-18,fa:-140,th:-84,sh:-99},
 eq:s=>grd()+db(s.haA,false),
 steps:["Ayaklar kalça genişliğinde, dizler hafif bükük; kalçandan menteşe gibi öne eğil, gövden yere ~45°.",
        "Sırtın baştan sona düz kalsın, bakışın bir metre önüne; dambıllar kollar gergin şekilde aşağıda.",
        "Dambılları karnının yanına çek — dirsekler gövdeni sıyırarak yukarı ve geriye gider.",
        "Yukarıda kürekleri sık, sonra kolları kontrollü şekilde tam aşağı uzat."],
 tip:"Sırtın yuvarlanıyorsa gövdeni biraz dikleştir ve ağırlığı azalt. Dizlerini kilitleme, kalçanı geriye ver."
},
{
 id:"cable_seated_row", setType:"weight_reps", equipment:"cable", target:{"reps":12},
 en:"Seated Cable Row", tr:"Oturarak kablo kürek çekişi", sets:3, reps:"3 × 12",
 view:"side", face:1, mus:"Sırt (orta) · Kürek kasları · Biceps",
 // Baslangicta dirsek -16 ile hafif TERS bukuluydu ve hareket boyunca
 // isaret degistiriyordu. Kollar one uzanmis = dirsek hafif FLEKSIYONDA.
 a:{px:118,py:140,torso:76,ua:-1,fa:9,th:3,sh:-19},
 b:{px:118,py:140,torso:96,ua:-137,fa:-9,th:3,sh:-19},
 eq:s=>rct(84,146,54,10)+rct(194,120,12,42)+cbl([196,132],s.haA)+grip(s.haA),
 steps:["Otur, ayaklarını platforma bas, dizleri hafif bükük tut; tutamağı kolların uzanmış şekilde kavra.",
        "Başlangıçta gövden çok az öne eğik, sırtın yine de düz — belini yuvarlatma.",
        "Göğsünü açarak gövdeni dikleştir ve tutamağı karnının üstüne çek; dirsekler gövdenin yanından geriye gider.",
        "Kürekleri sıkıp 1 saniye bekle; kolları uzatırken gövdeni öne düşürme."],
 tip:"İleri-geri kürek çeker gibi sallanma, gövde neredeyse sabit kalsın. İşi kollar değil sırt yapar."
},
{
 id:"cable_curl", setType:"weight_reps", equipment:"cable", target:{"reps":12},
 en:"Cable Curl", tr:"Kabloyla biceps curl", sets:3, reps:"3 × 12",
 view:"front", mus:"Biceps",
 a:{px:130,py:111,torso:90,ua:-92,fa:-92,ua2:-88,fa2:-88,th:-80,sh:-90,th2:-100,sh2:-90},
 // DÜZELTME: fa 105→53, fa2 75→57. Dirsek fleksiyonu = fa−ua idi 197°/163°;
 // 197° insanda imkânsız (sınır ~145-150°) — ön kol üst kolun içinden geçiyordu.
 // Yeni değerler iki kolda da tam 145°: curl'ün gerçek tepe noktası.
 // Kollar arası görsel kayma ua/ua2 farkından (−92/−88) geliyor, fleksiyondan değil.
 b:{px:130,py:111,torso:90,ua:-92,fa:53,ua2:-88,fa2:57,th:-80,sh:-90,th2:-100,sh2:-90},
 eq:s=>grd()+bar([s.haA[0]+5,s.haA[1]],[s.haB[0]-5,s.haB[1]])+cbl([130,186],[(s.haA[0]+s.haB[0])/2,(s.haA[1]+s.haB[1])/2]),
 steps:["Alçak makaraya dönük, ayaklar kalça genişliğinde dur; barı avuç içleri yukarı bakacak şekilde omuz genişliğinde tut.",
        "Dirsekleri gövdenin yanına sabitle, omuzları geriye al.",
        "Sadece ön kolu bükerek barı göğsüne doğru kaldır, tepede bicepsi sık.",
        "3 saniyede indir ve aşağıda kolları tam uzat — gerginlik kaybolmasın."],
 tip:"Dirsekler öne kayarsa yük bicepsten çıkar. Beli geriye atarak ağırlığı fırlatma."
},
{
 id:"db_hammer_curl", setType:"weight_reps", equipment:"dumbbell", target:{"reps":12},
 en:"Dumbbell Hammer Curl", tr:"Çekiç curl (dambıl)", sets:3, reps:"3 × 12",
 view:"front", mus:"Biceps · Ön kol",
 a:{px:130,py:111,torso:90,ua:-92,fa:-92,ua2:-88,fa2:-88,th:-80,sh:-90,th2:-100,sh2:-90},
 // DÜZELTME: fa 100→53, fa2 80→57 (Cable Curl ile aynı gerekçe; fleksiyon 192°/168° idi).
 b:{px:130,py:111,torso:90,ua:-92,fa:53,ua2:-88,fa2:57,th:-80,sh:-90,th2:-100,sh2:-90},
 eq:s=>grd()+db(s.haA,true)+db(s.haB,true),
 steps:["Dik dur, dambılları yanlarında tut; avuç içleri birbirine bakar (çekiç tutuşu) ve hareket boyunca dönmez.",
        "Dirsekleri gövdenin yanına sabitle.",
        "Dambılları omuz hizasına kaldır, tepede 1 saniye sık.",
        "Kontrollü indir; istersen kolları sırayla çalıştır."],
 tip:"Bu tutuş bicepsin yan başını ve ön kolu çalıştırır. Omuzları öne yuvarlamadan dik dur, dirsek öne kaymasın."
},
{
 id:"machine_leg_press", setType:"weight_reps", equipment:"machine", target:{"reps":12},
 en:"Leg Press", tr:"Bacak presi makinesi", sets:3, reps:"3 × 12",
 view:"side", face:1, nofoot:true, track:"ftA", mus:"Uyluk ön (quadriceps) · Kalça",
 // OKUNURLUK: kollar bacaklarla örtüşüyordu (çakışma 1.00); koltuğun yanına indirildi.
 a:{px:96,py:130,torso:150,ua:-90,fa:-100,th:43,sh:16},
 b:{px:96,py:130,torso:150,ua:-90,fa:-100,th:80,sh:-23},
 eq:s=>{const dx=s.ftA[0]-s.P[0],dy=s.ftA[1]-s.P[1],m=Math.hypot(dx,dy)||1;
   const ux=dx/m,uy=dy/m,c=[s.ftA[0]+ux*7,s.ftA[1]+uy*7];
   return rct(74,136,44,10)+bar([96,141],[44,111])+bar([c[0]+uy*26,c[1]-ux*26],[c[0]-uy*26,c[1]+ux*26]);},
 steps:["Sırtın ve kalçan mindere tam yaslı otur; ayaklar platformun ortasında, omuz genişliğinde, parmak uçları hafif dışa dönük.",
        "Emniyeti aç. Ağırlığı kontrollü indir: dizler göğsüne doğru yukarı gelir, açı yaklaşık 90° olunca dur.",
        "Topuklarından güç alarak it; dizler ayak hizasında kalsın, içe düşmesin.",
        "Yukarıda dizleri sonuna kadar kilitleme, hafif bükülü bırak."],
 tip:"Kalçan minderden yuvarlanıp kalkıyorsa fazla aşağı iniyorsun — belini korumak için o noktadan önce dur."
},
{
 id:"lunge", setType:"weight_reps", equipment:"bodyweight", target:{"reps":12},
 en:"Lunge", tr:"Öne hamle (lunge)", sets:3, reps:"3 × 12",
 view:"side", face:1, track:"knB", legs2:true, mus:"Uyluk ön · Kalça · Arka bacak",
 // OKUNURLUK: kollar öndeki uylukla örtüşüyordu; hafif geriye alındı.
 // İzlenen nokta da kalçadan ARKA DİZE taşındı (track) — kalça 16px iniyor,
 // arka diz çok daha fazla yol alıyor; hareketi asıl anlatan o.
 // ARKA BACAK ters kinematikle cozuldu. Onceki hali a pozunda YANLIS IK
 // dalindaydi (diz2 +24 -> -76): bacak hareket ortasinda duz konumu gecip
 // ters tarafa kiviriliyordu. Kisit: arka ayak ucu (100,186) SABIT, kalca
 // iner, diz bukulme yonu degismez. Dogru dal arka dizi yere indiriyor
 // (y 156 -> 173); yanlis dal havada tutuyordu.
 a:{px:130,py:118,torso:90,ua:-106,fa:-93,th:-53,sh:-83,th2:-102.1,sh2:-126.2},
 b:{px:130,py:134,torso:90,ua:-106,fa:-93,th:-24,sh:-102,th2:-83.3,sh2:-159},
 eq:s=>grd(),
 steps:["Dik dur, karnını sık; bir ayağınla öne uzun bir adım at, arka topuk havada kalır.",
        "Gövden dik kalacak şekilde kalçanı düz aşağı indir — öne doğru eğilme.",
        "Arka dizin yere yaklaşınca dur; ön dizin ayak bileğinin üzerinde, parmak uçlarını fazla geçmesin.",
        "Ön topuğundan itip yukarı çık. Setin yarısını bir bacakla, yarısını diğeriyle yap."],
 tip:"Dengeni zor buluyorsan sabit bir bara tutunarak yap. Diz ağrısı olursa adımı biraz uzat ve daha az derine in."
},
{
 id:"calf_raise", setType:"weight_reps", equipment:"bodyweight", target:{"reps":12},
 en:"Calf Raise", tr:"Topuk kaldırma (baldır)", sets:3, reps:"3 × 12",
 view:"side", face:1, nofoot:true, track:"P", mus:"Baldır",
 // OKUNURLUK: kol eskiden bacakla TAM ÖRTÜŞÜYORDU (çakışma 1.00 — her karede).
 // Denge için tutunulan bara uzatıldı; hem ipucundaki tavsiyeyi gösteriyor
 // hem baldır hareketi artık serbest okunuyor.
 a:{px:130,py:110,torso:90,ua:-55,fa:-15,th:-90,sh:-90},
 b:{px:130,py:98,torso:90,ua:-55,fa:-15,th:-90,sh:-90},
 eq:s=>grd()+bar(s.ftA,[s.ftA[0]+20,186])+bar([186,44],[186,186])+grip(s.haA),
 steps:["Ayak parmak uçlarını yere ya da bir basamağın kenarına bas, gövden dik, dizler hafif bükülü değil düz.",
        "Basamak kullanıyorsan topukları yavaşça aşağı bırak ve baldırında gerilme hisset.",
        "Parmak uçlarına yükselerek olabildiğince yukarı çık ve tepede 1 saniye sık.",
        "Kontrollü in; her tekrarda tam yukarı-tam aşağı git."],
 tip:"Zıplayarak yapma, hız kası değil eklemi çalıştırır. Denge için parmak ucunla sabit bir yere hafifçe tutun."
},
{
 id:"plank", setType:"time", equipment:"bodyweight", target:{"seconds":15},
 en:"Plank", tr:"Plank — karın duruşu", sets:3, reps:"3 × 15 sn",
 // hold:true → izometrik: oynatacak hareket yok, arayüz GERİ SAYIM gösterir.
 // Ama görsel yine ŞART — kimsenin hareketi bildiğini varsaymıyoruz. İzometrik
 // bir harekette öğretici olan tek kare değil, DOĞRU ile YANLIŞ arasındaki fark:
 // Plank'ta işin tamamı gövde çizgisini korumak. variants[] onu gösterir.
 //
 // Pozlar elle uydurulmadı, kısıtlardan ÇÖZÜLDÜ (ön kol ve ayak ucu zeminde):
 //   sin(torso) = (py − 148) / 60      omuzu 148'e sabitler (dirsek zeminde)
 //   sin(bacak) = (py − 179) / 76      ayağı zemine sabitler
 // Kalça yüksekliği (py) tek serbest değişken: 158 doğru · 170 çökük · 143 yüksek.
 view:"side", face:1, nofoot:true, track:"P", hold:true, mus:"Karın · Gövde stabilizasyonu",
 variants:[
   {ok:true, label:"Doğru", note:"Baştan topuğa tek düz çizgi",
    pose:{px:140,py:158,torso:9.6,ua:-90,fa:0,th:196,sh:196}},
   {label:"Kalça çökük", note:"Bel çukurlaşır, yük omurgaya geçer — süre dolmadan bitir",
    pose:{px:140,py:170,torso:21.5,ua:-90,fa:0,th:186.8,sh:186.8}},
   {label:"Kalça yüksek", note:"Kalça yukarı kaçar, karın devreden çıkar — hareket kolaylaşır",
    pose:{px:140,py:143,torso:-4.8,ua:-90,fa:0,th:208.3,sh:208.3}},
 ],
 a:{px:140,py:158,torso:10,ua:-75,fa:5,th:196,sh:196},
 b:{px:140,py:152,torso:12,ua:-75,fa:5,th:196,sh:196},
 eq:s=>grd(179)+bar(s.ftA,[s.ftA[0]+7,179]),
 steps:["Dirsekler omuzlarının tam altında, ön kolların yerde ve öne dönük; ayaklar kalça genişliğinde, parmak uçlarında.",
        "Gövden baştan topuğa tek bir düz çizgi olsun — kalçanı ne yukarı kaldır ne aşağı düşür.",
        "Karnını ve kalçanı sık, bakışın ellerinin biraz önüne olsun.",
        "Normal nefes alarak 15 saniye koru."],
 tip:"Belinde çukurlaşma başladıysa süre dolmadan bitir; kaliteli 10 saniye, çöken 20 saniyeden iyidir. Nefesini tutma."
}
]];

export const FIN=[
 {id:"cardio", setType:"cardio", target:{minutes:20}, h:"Antrenman sonrası koşu bandı — 20 dk",p:"Tempolu yürüyüş yeter: konuşabildiğin ama şarkı söyleyemediğin bir hız iyi bir ölçü."},
 {id:"cardio", setType:"cardio", target:{minutes:20}, modes:["koşu bandı","bisiklet"], h:"Antrenman sonrası koşu bandı veya bisiklet — 20 dk",p:"Bacak günü olduğu için bisiklet dizlerine daha yumuşak gelir; tercih sende."}
];
