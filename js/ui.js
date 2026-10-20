/*! © 2026 Sabri Temel — tüm hakları saklıdır. Kullanım koşulları: kosullar.html */
import*as o from"./session.js";import*as y from"./schedule.js";import{dayKey as w}from"./store.js";import{mmss as D}from"./timer.js";import*as T from"./ilerleme.js";import*as L from"./rekorlar.js";import{GRUPLAR as K,EKIPMAN as S,SET_TURU as $a}from"./program.js";import{HAZIR as Z,SORULAR as ka,oner as ba,hazirBul as X}from"./data/hazir.js";import{AD as J,SURUM as ga}from"./marka.js";import*as h from"./avatar.js";import{KURULUM_TARIFI as va,bantGoster as ha}from"./kurulum.js";import*as G from"./hazirlik.js";import{anaAd as I,turkceAd as z}from"./adlar.js";export const fmt=(a,s=2,e=0)=>a==null||!Number.isFinite(+a)?"—":(+a).toLocaleString("tr-TR",{minimumFractionDigits:e,maximumFractionDigits:s}),esc=a=>String(a).replace(/[&<>"']/g,s=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[s]);const c=a=>`<svg class="i" aria-hidden="true"><use href="#i-${a}"/></svg>`;export const adi=a=>esc(I(a));const ya=a=>{const s=z(a);return s?`<span>${esc(s)}</span>`:""},N=(a,...s)=>[z(a),...s].filter(Boolean).map(esc).join(" · ");export const cizimsiz=a=>!!(a.ozel||a.bilinmeyen),setLabel=a=>a.type==="time"?`${fmt(a.seconds)} sn`:a.type==="cardio"?`${fmt(a.minutes)} dk`:a.weight==null?`${fmt(a.reps)} tekrar`:`${fmt(a.weight)} × ${fmt(a.reps)}`;const Q=(a,s)=>a.type==="time"?`${fmt(a.seconds)} sn`:a.type==="cardio"?`${fmt(a.minutes)} dk`:a.weight==null?`${fmt(a.reps)} tekrar`:`${fmt(a.weight)} ${s}`;export function lastTime(a,s,e,i=!1){const t=s[a.id];if(!t)return i?"Bu hareketi ilk kez yapıyorsun.":"Bu hareketin ilk kaydı.";const n=t.sets.map(setLabel),l=n.every(u=>u===n[0])?`<b>${n[0]}</b> · ${n.length} set`:`<b>${n.join(" · ")}</b>`,d=t.sets.at(-1)?.rir;return`Geçen sefer · ${y.relativeLabel(new Date(t.at))} · ${l}${d!=null?` · son set RIR ${d}`:""}`}export function hazirlikGoster(a){const{session:s,settings:e}=a;return a.hazirlik?!0:e.hazirlikSor!==!1&&e.hazirlikGunu?.d!==w()&&!o.hasAnySet(s)&&!s.warmupDone&&!s.hazirlik}function fa(a){const s=a.session.hazirlik?.azalan;if(s?.length&&!a.hazirlik)return`<div class="not hafif-not">${c("nabiz")}<span>Bugün ${s.length} harekette birer set az
      (toparlanma kontrolü). <button class="bag" data-act="hz-geri">Programdaki gibi yap</button></span></div>`;if(!hazirlikGoster(a))return"";const e=a.hazirlik?.cevap??{},i=G.degerlendir(e),t=G.SORULAR.map(r=>`<div class="hz-soru"><p>${esc(r.soru)}</p>
      <div class="segment" role="group" aria-label="${esc(r.soru)}">${r.secenekler.map(([l,d])=>`<button data-hz="${r.id}:${l}" aria-pressed="${e[r.id]===l}">${d}</button>`).join("")}</div></div>`).join(""),n=i?`<div class="hz-sonuc ${i.duzey}" role="status"><b>${i.baslik}</b><p>${i.metin}</p>
      ${i.duzey==="hafif"?`<div class="cift dikey"><button class="btn p" data-act="hz-hafif">Hareketlerde birer set az yap</button>
             <button class="btn s" data-act="hz-tamam">Programdaki gibi devam et</button></div>`:`<button class="btn ${i.duzey==="uy"?"p":"s"}" data-act="hz-tamam">Tamam</button>`}</div>`:"";return`<div class="grup hazirlik"><h2 class="etiket">Bugün nasılsın?</h2><div class="ic">
      ${t}${n}
      ${i?"":'<button class="bag hz-gec" data-act="hz-gec">Bugün sorma</button>'}
      <p class="kucuk-yazi">${esc(G.KART_NOTU)}</p>
    </div></div>`}const za=a=>a?`
  <div class="grup carry"><div class="ic">
    <p class="baslik-satir">${o.gunEtiketiSeans(a.session).kisa} yarım kaldı</p>
    <p class="alt-satir">${y.relativeLabel(new Date(a.session.finishedAt??a.session.startedAt))}
      · ${a.yapilan}/${a.toplam} hareket</p>
    <p>${a.kalan.map(adi).join(" · ")}</p>
    <div class="cift dikey">
      <button class="btn s" data-act="carry-skip">Sıradakine geç</button>
      <button class="btn p" data-act="carry-go">Bu güne devam et</button>
    </div>
  </div></div>`:"",Sa=a=>{const{session:s,dayIndex:e,onerilen:i,gunSecici:t}=a;if(!t)return"";const n=o.canSwitchDay(s),r=o.gunEtiketi(e).kisa;return n.ok?`<div class="grup picker"><h2 class="etiket">Bugün ne yapıyorsun?</h2><div class="ic">
    <div class="picks">${o.allDays().map(d=>{const{kisa:u,kaslar:k}=o.gunEtiketi(d.dayIndex);return`<button class="pick" data-gun-sec="${d.dayIndex}" aria-pressed="${d.dayIndex===e}">
      <span class="pick-ad">${u}</span><span class="pick-kas">${esc(k)}</span>
      ${d.dayIndex===i?'<span class="pick-not">program önerisi</span>':""}
    </button>`}).join("")}</div>
    <p>${r}'ü telefonsuz yaptıysan işaretle: kayda geçer, sıra sonraki güne atlar.
      Ağırlıklar bilinmediği için hacme ve "geçen sefer"e karışmaz.</p>
    <button class="btn s" data-act="gun-yapildi">${r}'ü yapıldı işaretle</button>
  </div></div>`:`<div class="grup picker"><div class="ic">
    <p>Bugün set girdin; günü değiştirmek bu setleri yanlış güne bağlardı. Önce <b>Seansı bitir</b>
      ya da Ayarlar'dan <b>Bugünü sıfırla</b>.</p></div></div>`};function Ia(a,s,e,i){const t=s.sets.filter(r=>!r.warmup).at(-1);if(t)return`<b>${Q(t,i.unit)}</b>${s.calisma}/${s.hedef}`;const n=e?.sets?.at(-1);return n?`<b>${Q(n,i.unit)}</b>geçen`:`<b>${o.repsLabel(a,i)}</b>hedef`}const Ta=a=>a.tamam?`<span class="durum tamam">${c("tik")}</span>`:a.calisma>0?`<span class="durum kismi" style="--p:${Math.round(a.calisma/a.hedef*100)}"></span>`:'<span class="durum bos"></span>';function Ma(a,s,e){if(s.tur==="isinma")return`<button class="btn p" data-act="warmup">Isınmaya başla${c("ileri")}</button>`;if(s.tur==="bitir")return'<button class="btn p" data-act="finish">Seansı bitir</button>';if(s.tur==="soguma")return`<div class="cift"><button class="btn s" data-act="finish" aria-label="Seansı bitir">Bitir</button>
    <button class="btn p" data-act="cooldown">Soğumaya başla${c("ileri")}</button></div>`;const i=o.hasAnySet(a.session),t=e[s.idx],n=s.basladi?"Devam et":i?"Sıradaki":"Başla",r=`<button class="btn p iki" data-go="${s.idx}" aria-label="${n}: ${adi(t)}">
      <span><small>${n}</small><b>${adi(t)}</b></span></button>`;return i?`<div class="cift"><button class="btn s" data-act="finish" aria-label="Seansı bitir">Bitir</button>${r}</div>`:r}export function listHTML(a){const{session:s,dayIndex:e,settings:i,status:t,yarim:n,oncekiYapilan:r,gunSecici:l,lastPerf:d={}}=a,u=o.exercisesFor(e),k=o.progress(s,e,i),b=o.summaryVolume(s),g=Math.max(0,Math.round((Date.now()-s.startedAt)/6e4)),{kisa:p,kaslar:m}=o.gunEtiketi(e),v=o.siradakiEylem(s,e,i),$=v.tur==="hareket"?v.idx:-1,M=u.map((A,C)=>{const E=o.exerciseProgress(s,A,i),q=r?.has(A.id),V=[E.tamam&&"bitti",C===$&&"simdi",q&&!E.calisma&&"onceki"].filter(Boolean).join(" ");return`<button class="satir${V?" "+V:""}" data-go="${C}">
      ${Ta(E)}
      <span class="ad"><b>${adi(A)}</b>${q&&!E.calisma?"<span>geçen sefer yapıldı</span>":ya(A)}</span>
      <span class="sag">${Ia(A,E,d[A.id],i)}</span>
    </button>`}).join(""),B=`<button class="satir${s.warmupDone?" bitti":""}" data-act="warmup">
    <span class="durum ${s.warmupDone?"tamam":"ikon"}">${c(s.warmupDone?"tik":"alev")}</span>
    <span class="ad"><b>Isınma</b><span>${o.warmupFor(e).length+1} adım · ${o.isinmaSuresi(e)}</span></span>
    <span class="sag">${s.warmupDone?"yapıldı":"başla"}</span>
  </button>`,H=o.finisherFor(e),[R,pa]=H?H.h.split(" — "):[],ma=H?`<div class="satir">
    <span class="durum ikon">${c("nabiz")}</span>
    <span class="ad"><b>${R}</b><span>${H.p}</span></span>
    <span class="sag"><b>${pa??""}</b>bitişte</span>
  </div>`:"";return`
    <div class="ust liste-ust">
      <span class="tarih">${t.label}</span>
      <span class="tarih">${esc(o.aktifProgram().ad)}</span>
    </div>
    <button class="cip gun-cip" data-act="gun-ac" aria-expanded="${!!l}" aria-label="Günü değiştir: ${p}">
      ${p}${c(l?"yukari":"asagi")}</button>
    <div class="gun-baslik"><h1>${esc(m)}</h1></div>
    ${kurulumBantHTML(a)}
    ${fa(a)}
    ${t.isTrainingDay?"":`<div class="not">${c("takvim")}<span>Program günü değil; yine de kaydedebilirsin.
      Sıradaki antrenman <b>${t.next?y.fmtShort(t.next):"—"}</b>.</span></div>`}
    ${Sa(a)}
    <div class="ozet">
      <div><b>${k.done}<small>/${k.total}</small></b><span>Set</span></div>
      <div><b>${fmt(b.kg,0)}<small>${i.unit}</small></b><span>Hacim</span></div>
      <div><b>${g}<small>dk</small></b><span>Süre</span></div>
    </div>
    ${za(n)}
    ${u.length?`<div class="liste">${B}${M}${ma}${Ja(s,o.cooldownFor(e,i?.profil))}</div>
    <div class="alt alt-sekmeli">${Ma(a,v,u)}</div>`:`<div class="grup"><div class="ic"><p>Bu günde henüz hareket yok.</p>
        <button class="btn s" data-program-ac="${esc(o.aktifProgram().id)}">Programı düzenle</button></div></div>`}
    ${sekmelerHTML("bugun")}`}function Ha(a,s,e=""){if(cizimsiz(a))return`<div class="fig"><div class="sahne3d cizimsiz" role="img" aria-label="${adi(a)}: çizim yok">
      ${c("figur")}<span>${a.ozel?"Özel hareket · çizimi yok":"Bu hareketin tanımı bulunamadı"}</span></div></div>`;if(a.hold){const i=Math.max(0,a.variants.findIndex(t=>t.ok));return s.calisma>=1?`<div class="fig">
        <div class="sahne3d" data-varyant="${i}" role="img" aria-label="${adi(a)}: doğru duruş"></div>
        <p class="fig-not">${c("tik")}${a.variants[i].note} · hatalar ? panelinde</p>${e}
      </div>`:`<div class="variants">${a.variants.map((t,n)=>`<figure class="${t.ok?"ok":""}">
        <div class="sahne3d" data-varyant="${n}" aria-hidden="true"></div>
        <figcaption><b>${c(t.ok?"tik":"carpi")}${esc(t.label)}</b><span>${esc(t.note)}</span></figcaption>
      </figure>`).join("")}</div>`}return`<div class="fig${a.setType==="weight_reps"?" zemin":""}">
    <div class="sahne3d" id="fig3d" role="img" aria-label="${adi(a)} hareket çizimi; sürükleyerek döndürülür"></div>
    <button class="kure-top" id="kure-top" aria-pressed="true" aria-label="Görüntüyü döndür: sürükle · dokun: kendi ekseninde dönmeyi durdur ya da başlat"></button>${e}
  </div>`}const Aa={agir:"en ağır set",bir:"tahmini 1RM",hacim:"set hacmi",tekrar:"en çok tekrar",sure:"en uzun süre"};function Ea(a,s){const e=a.rozet;if(!e||e.exId!==s.id||Date.now()>e.bitis)return"";const i=e.tur==="tekrar"?fmt(e.simdi):rekorDeger(e.tur,e.simdi,a.settings.unit);return`<div class="rekor-rozet" role="status">${c("yildiz")}<span>Yeni rekor · <em>${Aa[e.tur]} ${i}</em></span></div>`}function La(a,s){const e=a.rirSor;if(!e||e.exId!==s.id||Date.now()>e.bitis)return"";const i=o.effective(s,a.settings).rir;return`<div class="rir-sor" role="group" aria-label="Bu sette kaç tekrar daha yapabilirdin?">
      <span>Kaç tekrar daha yapabilirdin?</span>
      <div class="rir-cipler">${x.map(t=>`<button class="cip${t===i?" hedef":""}" data-rir="${t}" aria-label="RIR ${t}${t===4?" ya da daha çok":""}${t===i?" (hedef)":""}">${t===4?"4+":t}</button>`).join("")}
        <button class="rir-kapat" data-rir="x" aria-label="Sorma, kapat">${c("carpi")}</button></div>
    </div>`}function ja(a,s){const e=s.session?.entries.find(t=>t.exerciseId===a.id)?.note??"",i=s.lastPerf?.[a.id]?.not;return`<div class="not-alani">
      <label class="etiket" for="ex-not">Notun</label>
      <textarea id="ex-not" data-not="${esc(a.id)}" maxlength="${o.NOT_SINIR}" rows="2"
        placeholder="${i?esc(i):"Ör. koltuk 4. delik · sol omuz biraz gergin"}">${esc(e)}</textarea>
      ${i?'<p class="kucuk-yazi">Gri yazı son notun; bugüne kaydedilmez. Bugün için yeni not yazabilirsin.</p>':""}
    </div>`}function Ba(a,s){const e=o.effective(a,s.settings);return`<section class="sheet" id="sheet" aria-hidden="true" inert aria-label="Hedef ve anlatım">
      <button class="grab" data-act="sheet-close" aria-label="Kapat"></button>
      <div class="sheet-in">
        <h2>${adi(a)}</h2>
        ${z(a)?`<p class="alt-baslik">${esc(z(a))}</p>`:""}
        ${ja(a,s)}
        ${qa(a,s)}
        ${oneriHTML(a,s)}
        <div class="goal">
          <div class="goal-hd">
            <span class="etiket">Hedef · ${esc(o.aktifProgram().ad)}</span>
            ${e.edited?'<button class="cip" data-act="goal-reset">Programa dön</button>':""}
          </div>
          ${Ca(a,s)}
          <button class="btn p" data-act="goal-save">Hedefi kaydet</button>
          <p class="goal-note">Hedef <b>${esc(o.aktifProgram().ad)}</b> içindeki bu hareketin hedefidir; kaydedince program
            da değişir. Ağırlık boş kalırsa kutu geçen seferki değerle dolar.</p>
        </div>
        <h3>Çalışan kaslar</h3>
        <p class="mus">${esc(a.mus||a.grup||"—")}</p>
        ${a.steps?.length?`<h3>Nasıl yapılır</h3>
        <ol class="steps">${a.steps.map(i=>`<li>${esc(i)}</li>`).join("")}</ol>`:""}
        ${a.hold?`<h3>Doğru duruş ve yaygın hatalar</h3>
          <ul class="hatalar">${a.variants.map(i=>`<li><b>${esc(i.label)}</b><span>${esc(i.note)}</span></li>`).join("")}</ul>`:""}
        ${a.tip?`<h3 class="tip-bas">${c("uyari")}Dikkat</h3>
        <p>${esc(a.tip)}</p>`:""}
        ${ilkAgirlikNotu(a)?`<p class="kucuk-yazi">${ilkAgirlikNotu(a)}</p>`:""}
        <p class="kucuk-yazi">${GUVENLIK_NOTU}</p>
      </div>
    </section>`}const Ra=a=>{const s=o.exercisesFor(a.dayIndex)[a.idx];return s?o.dinlenmeSuresi(s,a.settings):a.settings.restSeconds};export function gezinmeHTML(a,s=null,e=0){if(s===null){const i=o.exercisesFor(a.dayIndex).length-1;return`<div class="gezinme" id="gezinme">
      <button data-act="prev" ${a.idx===0?"disabled":""} aria-label="Önceki hareket">${c("geri")}Önceki</button>
      <button class="dinlenme" data-act="rest">${c("saat")}Dinlenme ${Ra(a)} sn</button>
      <button data-act="next" ${a.idx===i?"disabled":""} aria-label="Sonraki hareket">Sonraki${c("ileri")}</button>
    </div>`}return`<div class="gezinme run" id="gezinme">
    <button data-act="rest-plus" aria-label="Dinlenmeye 30 saniye ekle">+30</button>
    <div class="dinlenme" role="timer" aria-label="Kalan dinlenme">
      <b id="rest-time">${D(s)}</b>
      <span class="bar"><i id="rest-bar" style="transform:scaleX(${e?(s/e).toFixed(3):0})"></i></span>
    </div>
    <button data-act="rest-skip">Geç</button>
  </div>`}const wa={dumbbell:"tek dambıl",kettlebell:"kettlebell",barbell:"bar dahil",machine:"makinede seçili"};export const BAR_KG=20;const Da=[25,20,15,10,5,2.5,1.25];export function plakaYazi(a,s,e){if(a.equipment==="bodyweight")return+s>0?"ek ağırlık":"ek ağırlık · 0 = yalnız vücut";if(a.equipment!=="barbell")return wa[a.equipment]??"";const i=+s;if(e!=="kg"||s==null||s===""||!Number.isFinite(i))return"bar dahil";if(i<BAR_KG)return`boş bar ${BAR_KG} kg`;let t=(i-BAR_KG)/2;const n=[];for(const r of Da)for(;t>=r-1e-9;)n.push(r),t-=r;return t>1e-9?"bar dahil":n.length?`her yana ${n.map(r=>fmt(r)).join(" + ")}`:"yalnız bar"}export const tekrarAlt=(a,s)=>{const e=o.effective(a,s.settings);return`Hedef <b>${e.repsMin?`${e.repsMin}-`:""}${fmt(e.reps)}</b>`};const Ka=a=>`Hedef <b>${a}</b>`;export function kaydetEtiketi(a,s,e){return a.setType==="time"?"Süreyi kaydet":e.draft.warmup?"Isınma setini kaydet":"Seti kaydet"}export function setEtiketi(a,s){if(a.tamam)return"Bütün setler tamam";if(s.draft.warmup)return"<b>Isınma</b> seti · sete sayılmaz";const e=a.sets.filter(i=>i.warmup).length;return`<b>${a.calisma+1}.</b> set · ${a.hedef} setten${e?` · ısınma ×${e}`:""}`}function Ga(a,s,e){const i=Math.max(a.hedef,a.calisma),t=s.rekorTaban?.[e?.id],n=a.sets.filter(d=>!d.warmup),r=d=>!!t&&!!L.setRekoru(n[d],[...t,...n.slice(0,d)]),l=Array.from({length:i},(d,u)=>u<a.calisma?r(u)?`<i class="bitti rekor">${c("yildiz")}</i>`:`<i class="bitti">${c("tik")}</i>`:`<i class="${u===a.calisma?"simdi":""}">${u+1}</i>`).join("");return`<div class="set-ilerleme"><span id="set-etiket">${setEtiketi(a,s)}</span><span class="cubuk" aria-hidden="true">${l}</span></div>`}const P=({ad:a,deger:s,alt:e,artir:i,azalt:t,etiket:n,sinif:r="",azaltPasif:l=!1})=>`
  <div class="sutun ${r}">
    <button class="ok" ${i} aria-label="${n} artır">${c("yukari")}</button>
    <span class="etk">${a}</span>
    ${s}
    <span class="s-alt">${e}</span>
    <button class="ok" ${t} aria-label="${n} azalt"${l?" disabled":""}>${c("asagi")}</button>
  </div>`;function Na(a,s,e){const{settings:i}=e,t=o.effective(a,i),n=T.agirlikAdimi(a,i)??T.GIRIS_ADIMI_YEDEK,r=e.draft.weight,l=i.unit,d=r==null?"":String(r);return`<div class="sutunlar">
    ${P({ad:"SET",etiket:"Bugünkü set sayısını",deger:`<b class="n">${s.hedef}</b>`,alt:Ka(t.sets),artir:'data-act="set-arti"',azalt:'data-act="set-eksi"',azaltPasif:s.hedef<=s.calisma+1})}
    ${P({ad:"TEKRAR",etiket:"Tekrarı",deger:`<input class="n" type="number" inputmode="numeric" step="1" min="1" id="f-reps" value="${e.draft.reps??t.reps??""}" aria-label="Bu setin tekrarı">`,alt:`<span id="tk-alt">${tekrarAlt(a,e)}</span>`,artir:'data-step="reps:1"',azalt:'data-step="reps:-1"'})}
    ${P({ad:"AĞIRLIK",etiket:"Ağırlığı",sinif:"genis",deger:`<span class="n-kap"><input class="n${d.length>=5?" uzun":""}" type="number" inputmode="decimal" step="${n}" min="0"
               id="f-weight" value="${d}" placeholder="0" aria-label="Ağırlık (${l})"><small>${l}</small></span>`,alt:`<span id="plaka-yazi">${plakaYazi(a,r,l)}</span>`,artir:`data-step="weight:${n}"`,azalt:`data-step="weight:${-n}"`})}
  </div>`}const W=(a,s)=>`<p class="gecen">${c("gecmis")}<span>${lastTime(a,s.lastPerf,s.settings.unit,o.exerciseProgress(s.session,a,s.settings).sets.length>0)}</span></p>`,Pa=22;function _a(a,s,e){const i=o.effective(a,e.settings),t=a.setType==="time"?`${s.hedef} × ${fmt(i.seconds)} sn`:a.setType==="cardio"?`${fmt(i.minutes)} dk`:`${s.hedef} × ${i.repsMin?`${i.repsMin}-`:""}${fmt(i.reps)}${i.rir!=null?` · RIR ${i.rir}`:""}`,n=e.lastPerf[a.id]?.sets?.filter(l=>!l.warmup)??[],r=n.length?n.reduce((l,d)=>(d.weight??d.seconds??d.minutes??0)>(l.weight??l.seconds??l.minutes??0)?d:l):null;return`Hedef ${t}${r?` · geçen ${setLabel(r)}`:""}`}const Fa=(a,s,e,i,t,n="")=>`
  <div class="giris">
    <div class="deger">
      <span class="etiket">${i}</span>
      <div><input type="number" inputmode="decimal" step="${e}" min="0"
             id="f-${a}" value="${s??""}" placeholder="0" aria-label="${i} (${t})"><em>${t}</em></div>
      ${n}
    </div>
    <div class="stp">
      <button data-step="${a}:${e}" aria-label="${fmt(e)} ${t} artır">+${fmt(e)}</button>
      <button data-step="${a}:${-e}" aria-label="${fmt(e)} ${t} azalt">−${fmt(e)}</button>
    </div>
  </div>`;function Oa(a,s,e){const i=o.effective(a,e.settings);if(a.setType==="time"){const t=e.draft.seconds??i.seconds;return`<div class="clock" id="clock">
      <span class="etiket">Hedef süre</span>
      <div class="crow">
        <button class="cadj" data-act="clock-minus" aria-label="5 saniye azalt">−5</button>
        <span class="time" id="clock-time" role="timer">${D(t)}</span>
        <button class="cadj" data-act="clock-plus" aria-label="5 saniye ekle">+5</button>
      </div>
    </div>`}return a.setType==="cardio"?Fa("minutes",e.draft.minutes??i.minutes,5,"Süre","dk",W(a,e)):Na(a,s,e)}export const SEMALAR=[[3,8],[3,10],[3,12],[4,8],[4,6],[5,5]];const Ua=[15,20,30,45,60,90];export const noktalarHTML=(a,s,e="")=>`<div class="noktalar-set" role="radiogroup" aria-label="Set sayısı">${Array.from({length:10},(i,t)=>`<button role="radio" aria-checked="${t+1===s}" class="${t<s?"on":""}" data-${a}="${e}${t+1}" aria-label="${t+1} set"><i></i></button>`).join("")}</div>`,tekrarSeridiHTML=(a,s,e="")=>`<div class="serit-t" role="radiogroup" aria-label="Tekrar">${Array.from({length:Math.max(30,s??0)},(i,t)=>t+1).map(i=>`<button role="radio" aria-checked="${i===s}" data-${a}="${e}${i}">${i}</button>`).join("")}</div>`,semalarHTML=(a,s,e,i="")=>`<div class="semalar" role="group" aria-label="Hazır şema">${SEMALAR.map(([t,n])=>`<button class="cip" aria-pressed="${t===s&&n===e}" data-${a}="${i}${t}:${n}">${t} × ${n}</button>`).join("")}</div>`;const x=[0,1,2,3,4],Ya=[60,90,120,180,240];export function yontemHTML(a,s,e="",i=60,{tekrarli:t=!0}={}){const n=(d,u,k,b,g=k)=>`<button class="cip" aria-pressed="${b}" data-${a}="${e}${d}:${u}" aria-label="${esc(g)}">${k}</button>`,r=(d,u,k)=>`<div class="g-alan"><div class="g-etk"><span>${d}</span><b>${u}</b></div>
      <div class="semalar" role="group" aria-label="${d}">${k}</div></div>`;let l="";if(t&&s.reps>1){const d=[...new Set([s.reps-4,s.reps-3,s.reps-2,...s.repsMin?[s.repsMin]:[]])].filter(u=>u>=1&&u<s.reps).sort((u,k)=>u-k);l+=r("Tekrar aralığı",s.repsMin?`${s.repsMin}-${s.reps}`:"tek sayı",n("repsMin","x","Tek sayı",!s.repsMin)+d.map(u=>n("repsMin",u,`${u}-${s.reps}`,s.repsMin===u,`${u} ile ${s.reps} arası`)).join("")),l+=r("Hedef RIR",s.rir!=null?`${s.rir}`:"yok",n("rir","x","Yok",s.rir==null,"Hedef RIR yok")+x.map(u=>n("rir",u,u===4?"4+":`${u}`,s.rir===u,`RIR ${u}`)).join(""))+'<p class="g-not">RIR: setin sonunda kaç temiz tekrar daha yapabilirdin. 2 = iki tekrar daha çıkardı.</p>'}return l+=r("Dinlenme",`${s.dinlenme??i} sn`,n("dinlenme","x",`Genel (${i} sn)`,s.dinlenme==null,"Genel ayar")+Ya.map(d=>n("dinlenme",d,`${d} sn`,s.dinlenme===d)).join("")),l}function Ca(a,s){const{settings:e}=s,i=o.effective(a,e),t=T.agirlikAdimi(a,e)??T.GIRIS_ADIMI_YEDEK,n=(d,u,k,b)=>`<div class="gf">
      <span class="etiket">${b}</span>
      <div class="gbox">
        <button data-gstep="${d}:${-k}" aria-label="${b} azalt">${c("eksi")}</button>
        <input type="number" inputmode="decimal" step="${k}" min="0" id="g-${d}" value="${u??""}" placeholder="—" aria-label="${b}">
        <button data-gstep="${d}:${k}" aria-label="${b} artır">${c("arti")}</button>
      </div>
    </div>`,r=`<div class="g-alan"><div class="g-etk"><span>Set sayısı</span><b id="g-sets-yaz">${i.sets}</b></div>
      ${noktalarHTML("gset",i.sets)}<input type="hidden" id="g-sets" value="${i.sets}"></div>`,l=(d={})=>`<div id="g-yontem">${yontemHTML("g-yontem",i,"",e.restSeconds,d)}</div>`;return a.setType==="time"?`${r}
    <div class="g-alan"><div class="g-etk"><span>Süre</span><b id="g-seconds-yaz">${fmt(i.seconds)} sn</b></div>
      <div class="semalar" role="group" aria-label="Süre">${[...new Set([...Ua,i.seconds])].sort((d,u)=>d-u).map(d=>`<button class="cip" aria-pressed="${d===i.seconds}" data-gsn="${d}">${d} sn</button>`).join("")}</div>
      <input type="hidden" id="g-seconds" value="${i.seconds}"></div>${l({tekrarli:!1})}`:a.setType==="cardio"?`${r}<div class="goal-grid">${n("minutes",i.minutes,5,"Süre (dk)")}</div>`:`<div class="g-alan"><div class="g-etk"><span>Hazır şema</span></div>${semalarHTML("gsema",i.sets,i.reps)}</div>
    ${r}
    <div class="g-alan"><div class="g-etk"><span>Tekrar</span><b id="g-reps-yaz">${i.reps}</b></div>
      ${tekrarSeridiHTML("greps",i.reps)}<input type="hidden" id="g-reps" value="${i.reps}"></div>
    ${l()}
    <div class="goal-grid">${n("weight",i.weight,t,`Planlanan ağırlık (${e.unit})`)}</div>`}function qa(a,s){return a.setType==="cardio"?"":`<div class="set-satir">
      <span class="etiket"><span id="warm-ad">Isınma seti</span><small id="warm-not">Bu set hacme ve "geçen sefer"e karışmaz</small></span>
      <button class="cip" id="warm" data-act="warm" role="switch" aria-checked="${!!s.draft.warmup}"
              aria-labelledby="warm-ad" aria-describedby="warm-not">${s.draft.warmup?"Açık":"Kapalı"}</button>
    </div>`}export function warmupHTML(a){const{dayIndex:s}=a,e=o.warmupFor(s),{kaslar:i}=o.gunEtiketi(s),t=e.map(n=>`<div class="satir yalin" data-warm="${n.id}">
      <span class="ad"><b>${adi(n)}</b><span>${N(n,n.not)}</span></span>
      <span class="sag"><b>${esc(n.miktar)}</b></span>
      <div class="mini sahne3d" data-anim="${n.id}" aria-hidden="true"></div>
    </div>`).join("");return`
    <div class="ust"><button class="ib" data-act="to-list" aria-label="Listeye dön">${c("geri")}</button><span class="ib-yer"></span></div>
    <div class="sayfa-baslik"><h1>Isınma</h1><p>${esc(i)} · ${o.isinmaSuresi(s)} · sete sayılmaz</p></div>
    <div class="liste dagit">
      <div class="satir">
        <span class="durum ikon">${c("nabiz")}</span>
        <span class="ad"><b>${o.KARDIYO.ad}</b><span>${o.KARDIYO.not}</span></span>
        <span class="sag"><b>${o.KARDIYO.miktar}</b></span>
      </div>
      ${t}
    </div>
    <div class="alt"><button class="btn p" data-act="warmup-done">Isınma tamam, 1. harekete geç${c("ileri")}</button></div>`}const aa=a=>a.dinamik?`${a.tekrar} tekrar`:a.tek?`${a.sn} + ${a.sn} sn`:`${a.sn} sn`;export const esDakika=a=>`~${Math.max(1,Math.round(a/60))} dk`;const _={ayakta:"ayakta",minder:"minderde",duvar:"duvarda"},Va={poz:"Pozu al",tut:"Tut",taraf:"Taraf değiştir",son:"Bırak"},Za=(a,s)=>s==="tut"&&a.dinamik?`Yavaşça tekrarla · ${a.tekrar} kez`:Va[s];function Xa(a){const s=o.tumVucut(a.settings?.profil);return`<div class="rutin-kart"><b>Tüm vücut esneme</b><span>${s.length} esneme · ${esDakika(o.sogumaSuresi(s))} · dinlenme günü ya da antrenman sonrası</span>
    <button class="btn p" data-act="rutin-basla">Başla</button></div>`}function Ja(a,s){if(!s.length)return"";const e=!!a.cooldownDone;return`<button class="satir${e?" bitti":""}" data-act="cooldown">
    <span class="durum ${e?"tamam":"ikon"}">${c(e?"tik":"figur")}</span>
    <span class="ad"><b>Soğuma</b><span>${s.length} esneme · ${esDakika(o.sogumaSuresi(s))}</span></span>
    <span class="sag">${e?"yapıldı":"başla"}</span>
  </button>`}export function sogumaHTML(a){if(a.esneme)return Qa(a);const s=o.cooldownFor(a.dayIndex,a.settings?.profil),{kaslar:e}=o.gunEtiketi(a.dayIndex),i=!!a.session?.cooldownDone,t=s.map(n=>`<div class="satir yalin">
      <span class="ad"><b>${adi(n)}</b><span>${N(n,n.kas,_[n.yer])}</span></span>
      <span class="sag"><b>${aa(n)}</b></span>
      <div class="mini sahne3d" data-anim="${n.id}" aria-hidden="true"></div>
    </div>`).join("");return`
    <div class="ust"><button class="ib" data-act="to-list" aria-label="Listeye dön">${c("geri")}</button><span class="ib-yer"></span></div>
    <div class="sayfa-baslik"><h1>Soğuma</h1><p>${o.gunSogumasi(a.dayIndex)==="tum"?"Tüm vücut":esc(e)} · ${esDakika(o.sogumaSuresi(s))} · sete sayılmaz</p></div>
    ${s.length?`<div class="liste dagit">${t}</div>
    <p class="kucuk-yazi grup-alti">Önce ayakta, sonra yerde yapılır. Gerginlik hissedince dur; ağrıya kadar zorlama, yaylanma, nefesini tutma.</p>
    <div class="alt"><button class="btn p" data-act="esneme-basla">${i?"Yeniden başla":"Başla"}${c("ileri")}</button></div>`:`<div class="grup"><div class="ic"><p>${o.gunSogumasi(a.dayIndex)==="kapali"?"Bu günde soğuma kapalı; program düzenleyicide günün ayarından açabilirsin.":"Bu günde hareket yok; soğuma günün kaslarından kurulur."}</p></div></div>`}`}function Qa(a){const s=a.esneme,e=s.liste.length,i=s.kaynak==="rutin",t=i?"Tüm vücut esneme":"Soğuma",n=s.liste.map((b,g)=>`<i class="${g<s.i||s.bitti?"bitti":g===s.i?"simdi":""}"></i>`).join(""),r=i?"to-hareketler":"to-list",l=i?"Hareketlere dön":"Listeye dön";if(s.bitti)return`
    <div class="ust"><button class="ib" data-act="${r}" aria-label="${l}">${c("geri")}</button><span class="tarih">${t}</span><span class="ib-yer"></span></div>
    <div class="es-serit" aria-hidden="true">${n}</div>
    <div class="sayfa-baslik ust-bosluk"><h1>${t} tamam</h1><p>${e} esneme · ${esDakika(o.sogumaSuresi(s.liste))}.${i?"":" Bugünkü listede “yapıldı” olarak görünür."}</p></div>
    <div class="alt"><div class="cift"><button class="btn s" data-act="${i?"rutin-basla":"esneme-basla"}">Baştan</button><button class="btn p" data-act="${r}">${l}</button></div></div>`;const d=s.liste[s.i],u=s.liste[s.i+1],k=d.tek?`<span class="es-taraf">${s.faz==="taraf"?"Sol tarafa geç":s.taraf==="sol"?"Sol taraf":"Sağ taraf"}</span>`:"";return`
    <div class="ust"><button class="ib" data-act="esneme-kapat" aria-label="Oynatıcıyı kapat">${c("carpi")}</button>
      <span class="tarih">${t} · ${s.i+1}/${e}</span><span class="ib-yer"></span></div>
    <div class="es-serit" aria-hidden="true">${n}</div>
    <div class="es-ad"><h1>${adi(d)}</h1><p>${N(d,d.kas)} · ${aa(d)}</p>${k}</div>
    <div class="fig"><div class="sahne3d" id="es3d" role="img" aria-label="${adi(d)} esneme çizimi"></div></div>
    <div class="clock${s.kosuyor&&s.faz==="tut"?" run":""}">
      <p class="es-faz" id="es-faz">${Za(d,s.faz)}</p>
      <div class="crow">
        <button class="cadj" data-act="esneme-geri" aria-label="Önceki esneme"${s.i?"":" disabled"}>${c("geri")}</button>
        <span class="time" id="es-zaman" role="timer" aria-live="off">${D(s.kalan??s.fazSn)}</span>
        <button class="cadj" data-act="esneme-atla" aria-label="Sonraki esneme">${c("ileri")}</button>
      </div>
    </div>
    <p class="es-ipucu">${esc(d.ipucu)}</p>
    <p class="es-sira">${u?`Sıradaki: <b>${adi(u)}</b>`:"Son esneme"}</p>
    <div class="alt"><button class="btn ${s.kosuyor?"s":"p"}" data-act="esneme-oynat">${s.kosuyor?"Duraklat":"Devam et"}</button></div>`}function Wa(a,s){const e=a.kas.split("·").map(i=>i.trim()).filter(Boolean);return`
    <div class="ust"><button class="ib" data-act="to-hareketler" aria-label="Hareketlere dön">${c("geri")}</button>
      <span class="tarih">Esneme</span><span class="ib-yer"></span></div>
    <div class="sayfa-baslik"><h1>${adi(a)}</h1>${z(a)?`<p>${esc(z(a))}</p>`:""}</div>
    <div class="buyuk3b"><div class="sahne3d" id="hareket3d" role="img" aria-label="${adi(a)} esneme çizimi; sürükleyerek döndürülür"></div>
      <img class="damga" src="icons/isaret.svg" alt="" width="30" height="17"><span class="ipucu">Sürükle: döndür · dokun: yeniden oynat</span></div>
    <p class="kunye">${[_[a.yer].replace(/^./,i=>i.toLocaleUpperCase("tr")),a.dinamik?`${a.tekrar} yavaş tekrar (~${a.sure} sn)`:`${a.tek?"her taraf ":""}${s} sn tut`].map(esc).join(" · ")}</p>
    <div class="grup"><h2 class="etiket">Esnettiği kaslar</h2><div class="ic"><div class="kaslar">${e.map((i,t)=>`<span class="kas${t<2?" ana":""}">${esc(i)}</span>`).join("")}</div></div></div>
    <div class="grup"><h2 class="etiket">Faydası</h2><div class="ic"><p>${esc(a.fayda)}</p></div></div>
    <div class="grup"><h2 class="etiket">Nasıl yapılır</h2><div class="ic"><ol class="adimlar">${a.steps.map(i=>`<li>${esc(i)}</li>`).join("")}</ol></div></div>
    <div class="grup"><h2 class="etiket">Dikkat</h2><div class="ipucu-kutu">${esc(a.tip)}</div></div>
    <p class="kucuk-yazi grup-alti">Gerginlik hissedince dur; ağrıya kadar zorlama, yaylanma, nefesini tutma. Programa set olarak eklenmez; soğumada
      günün kaslarına göre kendiliğinden gelir, Hareketler'deki “Tüm vücut esneme” rutininde de var. Statik esneme ısınmanın yerine geçmez: antrenman sonunda, vücut ısınmışken yap.</p>
    ${sekmelerHTML("hareketler")}`}function xa(a){return`
    <div class="ust"><button class="ib" data-act="to-hareketler" aria-label="Hareketlere dön">${c("geri")}</button>
      <span class="tarih">Isınma</span><span class="ib-yer"></span></div>
    <div class="sayfa-baslik"><h1>${adi(a)}</h1>${z(a)?`<p>${esc(z(a))}</p>`:""}</div>
    <div class="buyuk3b"><div class="sahne3d" id="hareket3d" role="img" aria-label="${adi(a)} ısınma çizimi; sürükleyerek döndürülür"></div>
      <img class="damga" src="icons/isaret.svg" alt="" width="30" height="17"><span class="ipucu">Sürükle: döndür · dokun: yeniden oynat</span></div>
    <p class="kunye">Isınmada ${esc(a.miktar)}</p>
    <div class="grup"><h2 class="etiket">Nasıl yapılır</h2><div class="ic"><p>${esc(a.not)}</p></div></div>
    <p class="kucuk-yazi grup-alti">Isınma programa set olarak eklenmez ve kayda girmez; seansın başında günün kaslarına göre kendiliğinden gelir.
      Önce 5 dk hafif kardiyo, sonra bu hareketler, en sonda günün ilk ağır hareketinin hafif bir seti.</p>
    ${sekmelerHTML("hareketler")}`}export function oneriHTML(a,s){const e=s.oneri?.[a.id],i=s.session.entries.find(n=>n.exerciseId===a.id)?.sets;if(!T.oneriGecerliMi(e,i))return"";const t=s.settings.unit;return e.tur==="kal"?`<div class="oneri">${c("yildiz")}<span>Geçen sefer son sete RIR 0 ile vardın: <b>${fmt(e.agirlik)} ${t}</b> ile kal,
      tekrarları temiz tamamla</span></div>`:e.tur==="agirlik"?`<div class="oneri">${c("yildiz")}
      <span>İki seanstır ${e.setler} × ${e.tekrar} tamam${e.rir!=null?` (RIR ${e.rir}+)`:""}: <b>${fmt(e.agirlik)} ${t}</b> dene</span>
      ${s.draft.weight===e.agirlik?"":'<button class="cip" data-act="oneri-uygula">Uygula</button>'}
    </div>`:`<div class="oneri">${c("yildiz")}<span>İki seanstır ${fmt(e.agirlik)} ${t} ile hedef tamam. Sonraki
      ağırlık adımı büyük (%${Math.round(e.adimOrani*100)}); önce <b>${e.hedefTekrar} tekrara</b> çık.</span></div>`}function as(a){const s=o.aktifProgram(),e=s?.gunler[a.dayIndex];return e?`<div class="ust-yazi"><b>${esc(s.ad)}</b> · ${esc(e.ad?.trim()||o.gunEtiketi(a.dayIndex).kisa)}</div>`:""}export function focusHTML(a){const{session:s,dayIndex:e,idx:i,settings:t}=a,n=o.exercisesFor(e),r=n[i],l=o.exerciseProgress(s,r,t),d=n.map((k,b)=>`<i class="${o.exerciseProgress(s,k,t).tamam?"f":b===i?"c":""}"></i>`).join(""),u=i===n.length-1;return`
    <div class="ust uclu">
      <button class="ib" data-act="to-list" aria-label="Listeye dön">${c("geri")}</button>
      <div class="orta"><b>${i+1} / ${n.length}</b><span class="seritler" aria-hidden="true">${d}</span></div>
      <span class="sag-grup">
        ${l.sets.length?`<button class="ib" data-act="undo" aria-label="Son seti geri al">${c("geri-al")}</button>`:""}
        <button class="ib" data-act="sheet-open" aria-label="Nasıl yapılır, hedef ve ısınma seti">${c("soru")}</button>
      </span>
    </div>
    <div class="baslik">
      ${as(a)}
      <h1${I(r).length>Pa?' class="uzun"':""}>${adi(r)}</h1>
      <p>${r.grup?`<span class="kas-cip">${esc(r.grup.toLocaleUpperCase("tr"))}</span>`:""}${_a(r,l,a)}</p>
    </div>
    ${Ha(r,l,La(a,r)+Ea(a,r))}
    ${r.setType==="cardio"?"":Ga(l,a,r)}
    ${l.tamam?"":Oa(r,l,a)}
    ${r.setType==="time"&&!l.tamam?`<div class="gecen-bant">${W(r,a)}</div>`:""}
    <div class="foot">
      ${l.tamam?`<div class="cift">
             <button class="btn s" data-act="set-arti">${c("arti")}Bir set daha</button>
             ${u?'<button class="btn p" data-act="to-list">Listeye dön</button>':`<button class="btn p" data-act="next">Sonraki hareket${c("ileri")}</button>`}
           </div>`:r.setType==="time"?`<div class="cift">
               <button class="btn s" data-act="save">Kaydet</button>
               <button class="btn p" data-act="clock-start" id="clock-btn">Başlat</button>
             </div>`:`<button class="btn p" data-act="save" id="kaydet-btn">${kaydetEtiketi(r,l,a)}</button>`}
    </div>
    ${gezinmeHTML(a)}
    <div class="sheet-bg" data-act="sheet-close" hidden></div>
    ${Ba(r,a)}`}const ss={agir:"en ağır set",bir:"tahmini 1 tekrar maksimumu",hacim:"en iyi set hacmi",tekrar:"en çok tekrar",sure:"en uzun süre"};export const rekorDeger=(a,s,e)=>a==="tekrar"?`${fmt(s)} tekrar`:a==="sure"?`${fmt(s)} sn`:a==="bir"?`${fmt(s,0)} ${e}`:a==="hacim"?`${fmt(s,0)} ${e}`:`${fmt(s)} ${e}`;const es=(a,s)=>a==="bir"||a==="hacim"?fmt(s,0):fmt(s);function is(a,s){if(!a)return"";const e=a.oncekiHacim>0?(a.hacim-a.oncekiHacim)/a.oncekiHacim:null,i=e==null?"":` · önceki döneme göre ${Math.abs(e)<5e-4?"aynı":`${e>0?"+":"−"}%${fmt(Math.abs(e*100),0)}`}`;return`<div class="oz-donem">
    <span class="ust-satir">${c("takvim")}DÖNEM TAMAM</span>
    <h2>${a.antrenman} antrenman, ${a.gun} günde</h2>
    <span class="alt-satir">${esc(a.program)}: programın bütün günlerini bitirdin.${a.rekorSayisi?` Bu dönemde ${a.rekorSayisi} rekor kırdın.`:""}</span>
    <div class="iki"><div><b>${fmt(a.hacim,0)} ${s}</b><span>Toplam hacim${i}</span></div>
      <div><b>${a.calismaSet}</b><span>Çalışma seti</span></div></div>
    ${a.hareketler.length?`<div>${a.hareketler.map(t=>`<div class="hareket"><span>${adi(t.ex)}</span><b>${fmt(t.once,0)} → ${fmt(t.simdi,0)} ${s}</b></div>`).join("")}
      <p class="oz-kural">Tahmini 1 tekrar maksimumu, önceki dönem → bu dönem.</p></div>`:""}
  </div>`}const ts={rekor:"yildiz",gelisim:"grafik",istikrar:"takvim",zor:"alev"};function ns(a,s,e){return a.ovgu?{ikon:ts[a.ovgu.tur]??"yildiz",baslik:a.ovgu.baslik,yazi:esc(a.ovgu.kanit)}:a.hacimFarki!=null&&a.hacimFarki>.005?{ikon:"grafik",baslik:`Hacim %${fmt(a.hacimFarki*100,0)} arttı`,yazi:`Geçen ${s}e göre aynı hareketlerde daha çok iş yaptın.`}:a.artislar.length?{ikon:"yukari",baslik:"Geçen seferden ağır",yazi:a.artislar.slice(0,2).map(t=>`${adi(t.ex)} ${fmt(t.once)} → ${fmt(t.simdi)} ${e}`).join(" · ")}:{ikon:"tik",notr:!0,baslik:"Antrenman tamam",yazi:`${[`${a.calismaSet} çalışma seti`,a.sure&&`${a.sure} dk`,a.kg&&`${fmt(a.kg,0)} ${e}`].filter(Boolean).join(" · ")}.`}}function rs(a){if(!a)return"";const s=a.serit.length,e=Math.max(0,a.hedef-a.buHafta),i=(e?`Bu hafta ${e} antrenman daha kaldı.`:"Bu haftanın hedefi tamam.")+(s>=3&&a.tutulan?` Son ${s} haftada ${a.tutulan} kez hedefini tuttun.`:"");return`<div class="grup"><h2 class="etiket">Bu hafta</h2><div class="ic">
    <div class="oz-hafta"><b>${a.buHafta} / ${a.hedef} antrenman</b><span class="kucuk-yazi">hedefin haftada ${a.hedef}</span></div>
    <div class="oz-serit" aria-label="Son ${s} hafta">${a.serit.map((t,n)=>`<i class="${t}${n===s-1?" bu":""}"></i>`).join("")}</div>
    <div class="oz-serit-alt">${s>1?`<span>${s-1} hafta önce</span>`:"<span></span>"}<span>bu hafta</span></div>
    <p class="oz-kural">${i}</p></div></div>`}export function summaryHTML(a){const s=a.ozet;if(!s)return"";const e=a.settings.unit,{kisa:i,kaslar:t}=s.gun??o.gunEtiketi(s.dayIndex),n=ns(s,i,e),r=s.rekor?.kirilan??[],l=new Set(r.map(m=>m.exId)),d=s.hacimFarki==null?"":(()=>{const m=Math.abs(s.hacimFarki*100);return m<.05?"aynı":`${s.hacimFarki>0?"+":"−"}%${fmt(m,0)}`})(),u=s.onceki?s.calismaSet===s.onceki.calismaSet?"aynı":`${s.calismaSet>s.onceki.calismaSet?"+":"−"}${Math.abs(s.calismaSet-s.onceki.calismaSet)}`:"",k=!r.length&&!s.gunHacmi&&!s.rekor?.ilkler?.length?"":`<div class="grup"><h2 class="etiket">${r.length||s.gunHacmi?"Rekorlar":"İlk kayıt"}</h2><div class="ic">
    ${r.map(m=>`<div class="oz-kayit">${c("yildiz")}<b>${adi(o.byId[m.exId]??{ad:m.exId})}</b>
      <span class="oz-deger"><s>${es(m.ana.tur,m.ana.once)} →</s> <em>${rekorDeger(m.ana.tur,m.ana.simdi,e)}</em></span>
      <span class="oz-alt">${L.TUR_AD[m.ana.tur]}${m.turler.length>1?` · ayrıca ${m.turler.slice(1).map(v=>ss[v.tur]).join(", ")}`:""}</span></div>`).join("")}
    ${s.gunHacmi?`<div class="oz-kayit">${c("yildiz")}<b>Günün toplam hacmi</b>
      <span class="oz-deger"><s>${fmt(s.gunHacmi.once,0)} →</s> <em>${fmt(s.gunHacmi.simdi,0)} ${e}</em></span>
      <span class="oz-alt">${esc(i)} için en yüksek</span></div>`:""}
    ${s.rekor?.ilkler?.length?`<p class="oz-kural">İlk kayıt: ${s.rekor.ilkler.map(m=>adi(o.byId[m]??{ad:m})).join(", ")}. Bugünkü değerlerin taban oldu; sonraki seferlerde rekorlar sayılır.</p>`:""}
  </div></div>`,b=s.artislar.filter(m=>!l.has(m.ex.id)),g=b.length?`<div class="grup"><h2 class="etiket">Geçen seferden ağır</h2><div class="ic">${b.map(m=>`<div class="oz-kayit">${c("yukari")}<b>${adi(m.ex)}</b><span class="oz-deger"><s>${fmt(m.once)} →</s> <em>${fmt(m.simdi)} ${e}</em></span>
      <span class="oz-alt">En ağır çalışma seti</span></div>`).join("")}</div></div>`:"",p=s.gelecek?.length?`<div class="grup"><h2 class="etiket">Gelecek sefer</h2><div class="ic">${s.gelecek.map(m=>`<div class="oz-kayit">${m.tur==="artir"?c("yukari"):c("ileri").replace('class="i"','class="i notr"')}<b>${adi(m.ex)}</b><span class="oz-deger">${esc(m.deger)}</span>
      <span class="oz-alt neden">${esc(m.neden)}</span></div>`).join("")}
    <p class="oz-kural">Kural: aynı ağırlıkta iki seans üst üste hedef tekrarların hepsini yaparsan ağırlığı küçük bir adımla artır (ACSM). Öneridir; kutu yine geçen seferle dolar.</p></div></div>`:"";return`
    <div class="ust">
      <button class="cip" data-act="ozet-geri-al" aria-label="Bitirmeyi geri al, seansa dön">${c("geri-al")}Geri al</button>
      <span class="ib-yer"></span>
    </div>
    ${is(s.donem,e)}
    <div class="oz-haber">
      <span class="rozet${n.notr?" notr":""}">${c(n.ikon)}</span>
      <h1>${n.baslik}</h1><p>${n.yazi}</p>
      <span class="tarih">${esc(i)} · ${esc(t)} · ${y.fmtDate(new Date(s.bitis))}</span>
    </div>
    <div class="oz-uc">
      <div><b>${s.sure??"—"}<small>dk</small></b><span>Süre</span>${s.onceki?.sure?`<em>geçen sefer ${s.onceki.sure}</em>`:""}</div>
      <div><b>${s.calismaSet}<small>set</small></b><span>Set</span>${u?`<em>${u}</em>`:""}</div>
      ${s.kg?`<div><b>${fmt(s.kg,0)}<small>${e}</small></b><span>Hacim</span>${d?`<em class="${s.hacimFarki>5e-4?"art":""}">${d}</em>`:""}</div>`:`<div><b>${fmt(s.seconds??0)}<small>sn</small></b><span>Süre hareketi</span></div>`}
    </div>
    ${s.onceki?`<p class="oz-not">${s.hacimKismi?`Hacim farkı yalnız bugün de yapılan hareketlerde, geçen ${esc(i)}e göre.`:`Farklar geçen ${esc(i)}e göre.`}</p>`:""}
    ${k}${g}${p}${rs(s.duzen)}
    ${s.yedekZamani?`<div class="not">${c("uyari")}<span>Veri yalnız bu telefonda. <b>Yedek almanın zamanı.</b></span></div>`:""}
    ${s.sonraki?`<p class="kucuk-yazi">Sıradaki antrenman: <b>${s.sonraki}</b></p>`:""}
    <div class="alt"><div class="cift">
      <button class="btn s" data-act="backup">Yedek al</button>
      <button class="btn p" data-act="ozet-tamam">Tamam</button>
    </div></div>`}function sa(a,{w:s=280,h:e=72,alan:i=!0}={}){if(a.length<2)return"";const t=Math.min(...a),n=Math.max(...a),r=(n-t)*.18||Math.max(1,n*.02),l=t-r,d=n+r,u=4,k=v=>u+v/(a.length-1)*(s-2*u),b=v=>u+(e-2*u)-(v-l)/(d-l)*(e-2*u),g=a.map((v,$)=>`${$?"L":"M"}${k($).toFixed(1)} ${b(v).toFixed(1)}`).join(" "),p=k(a.length-1).toFixed(1),m=b(a.at(-1)).toFixed(1);return`<svg class="spark" viewBox="0 0 ${s} ${e}" preserveAspectRatio="none" role="img"
      aria-label="${a.length} ölçüm: ${fmt(a[0])} → ${fmt(a.at(-1))}">
    ${i?`<path class="alan-dolgu" d="${g} L${p} ${e} L${k(0).toFixed(1)} ${e} Z"/>`:""}
    <path class="cizgi" d="${g}"/>
    <path class="uc" d="M${p} ${m} h0"/>
  </svg>`}const ls=(a,s)=>{if(!s)return"";if(!a)return`<p>Hedef kilon <b>${fmt(s,1,1)} kg</b>.</p>`;const e=a.kg-s;return`<p>Hedef kilon <b>${fmt(s,1,1)} kg</b> · ${Math.abs(e)<.05?"hedeftesin":`${fmt(Math.abs(e),1,1)} kg ${e>0?"üstünde":"altında"}`}</p>`};export function historyHTML(a){const{kilolar:s=[],gecmis:e=[],ilerleme:i=[],settings:t}=a,n=s.at(-1),r=a.kiloGir,l=r?`
      <div class="kilo-panel" role="group" aria-label="Kilo gir">
        <div class="kilo-adim">
          <button class="ib" data-kilo-adim="-0.1" aria-label="0,1 kg azalt">${c("eksi")}</button>
          <label class="kilo-deger"><input type="number" id="h-weight" inputmode="decimal" step="0.1" min="20" max="400"
            value="${r.kg}" aria-label="Kilo (kg)"><em>kg</em></label>
          <button class="ib" data-kilo-adim="0.1" aria-label="0,1 kg artır">${c("arti")}</button></div>
        <div class="segment" role="group" aria-label="Hangi gün">${[["bugun","Bugün"],["dun","Dün"],["tarih","Tarih seç"]].map(([$,M])=>`<button data-kilo-gun="${$}" aria-pressed="${r.gun===$}">${M}</button>`).join("")}</div>
        ${r.gun==="tarih"?`<input type="date" class="metin" id="h-tarih" max="${w()}" value="${r.tarih??w()}" aria-label="Tarih">`:""}
        <div class="cift"><button class="btn s" data-act="kilo-vazgec">Vazgeç</button><button class="btn p" data-act="weight-save">Kaydet</button></div>
        ${r.var?`<button class="btn s" data-act="kilo-sil">${c("sil")}Bu günün kaydını sil</button>`:""}
      </div>`:`<button class="btn p" data-act="kilo-gir">${c("arti")}Kilo gir</button>`,d=`
    <div class="grup"><h2 class="etiket">Kilo${n?` · ${s.length} ölçüm`:""}</h2><div class="ic">
      ${kiloOzetHTML(s)}
      ${s.length>1?sa(s.map($=>$.kg)):""}
      ${ls(n,t.profil?.hedefKilo)}
      ${l}
    </div></div>`,u=`
    <div class="grup"><h2 class="etiket">Son seanslar</h2>
      ${e.length?`<div class="ic sira">${e.map($=>`
        <button class="seans" data-seans="${esc($.id)}" aria-label="${y.fmtShort(new Date($.at))} seansını düzenle">
          <span class="s-baslik">${$.gun}</span>
          <span class="s-hacim">${$.kayitsiz?"—":`${fmt($.hacim.kg,0)} ${t.unit}`}</span>
          <span class="s-ikinci">${y.fmtShort(new Date($.at))}${$.programAdi?` · ${esc($.programAdi)}`:""}${$.kayitsiz?'<span class="etk kyt">kayıtsız</span>':$.yarim?'<span class="etk">yarım</span>':""}</span>
          <span class="s-oran">${$.kayitsiz?"":`${$.yapilan}/${$.toplam} hareket`}</span>
        </button>`).join("")}</div>`:'<div class="ic"><p>Henüz tamamlanmış seans yok.</p></div>'}
    </div>`,k=`
    <div class="grup"><h2 class="etiket">Hareket ilerlemesi · en ağır set</h2>
      ${i.length?`<div class="ic sira">${i.map($=>`
        <div class="ilerleme">
          <b>${adi($.ex)}</b>
          <span>${fmt($.seri[0].v)} → <em>${fmt($.seri.at(-1).v)} ${$.birim}</em></span>
          ${sa($.seri.map(M=>M.v),{w:280,h:18,alan:!1})}
        </div>`).join("")}</div>
        <p class="kucuk-yazi grup-alti">${i.length} hareket · çizgi en fazla son ${Math.max(...i.map($=>$.seri.length))} seansı gösterir.</p>`:'<div class="ic"><p>İlerleme çizgisi için bir hareketin en az iki seansta kaydı gerekiyor.</p></div>'}
    </div>`,b=a.rekorOlaylari??[],g=new Date;g.setDate(1),g.setHours(0,0,0,0);const p=b.filter($=>$.at>=g.getTime()).length,m=$=>`<button class="oz-kayit satir-dugme" data-hareket="${esc($.exId)}">${c("yildiz")}<b>${adi(o.byId[$.exId]??{ad:$.exId})}</b>
      <span class="oz-deger"><em>${rekorDeger($.tur,$.simdi,t.unit)}</em></span>
      <span class="oz-alt">${L.TUR_AD[$.tur]} · ${y.fmtShort(new Date($.at))}</span></button>`,v=`
    <div class="grup"><h2 class="etiket">Rekorlar · son kırılanlar</h2><div class="ic">${b.length?`${b.slice(0,6).map(m).join("")}
         <p class="oz-kural">${p?`Bu ay ${p} rekor · `:""}Bir harekete dokun: bütün rekorları ve geçmişi.</p>`:"<p>Rekorlar bir hareketi ikinci kez yaptığında sayılmaya başlar: ilk kayıt taban olur.</p>"}</div></div>`;return`
    <div class="sayfa-baslik ust-bosluk"><h1>İlerleme</h1></div>
    ${d}${v}${u}${k}
    ${sekmelerHTML("ilerleme")}`}export function sessionEditHTML(a){const{duzenlenen:s,settings:e}=a;if(!s)return`<div class="ust"><button class="ib" data-act="to-history" aria-label="Geçmişe dön">${c("geri")}</button></div>
    <div class="sayfa-baslik"><h1>Seans bulunamadı</h1></div>`;const i=o.gunEtiketiSeans(s).kisa,t=o.exercisesOfSession(s),n=s.entries.filter(d=>!t.some(u=>u.id===d.exerciseId)).map(d=>o.byId[d.exerciseId]??o.bilinmeyenHareket(d.exerciseId)),r=[...t,...n].map(d=>{const u=s.entries.find(p=>p.exerciseId===d.id);if(!u?.sets.length)return"";const k=T.agirlikAdimi(d,e)??T.GIRIS_ADIMI_YEDEK;let b=0;const g=u.sets.map((p,m)=>{const v=p.type==="time"?[["seconds",p.seconds,"sn",5]]:p.type==="cardio"?[["minutes",p.minutes,"dk",5]]:[["weight",p.weight,e.unit,k],["reps",p.reps,"tekrar",1]],$=p.warmup?"ısınma":`${++b}.`;return`<div class="eset">
        <span class="eno">${p.warmup?"ıs":b}</span>
        ${v.map(([M,B,H,R])=>`
          <label class="efield">
            <input type="number" inputmode="decimal" step="${R}" min="0"
                   value="${B??""}" placeholder="—"
                   data-eset="${d.id}:${m}:${M}" aria-label="${adi(d)} ${$} set ${H}">
            <span class="eunit">${H}</span>
          </label>`).join("")}
        <button class="esil" data-eset-sil="${d.id}:${m}" aria-label="${$} seti sil">${c("sil")}</button>
      </div>`}).join("");return`<div class="grup"><h2 class="etiket">${adi(d)}</h2><div class="ic sira">${g}${u.note?`<p class="seans-notu">${c("liste")}<span>${esc(u.note)}</span></p>`:""}</div></div>`}).join(""),l=o.summaryVolume(s);return`
    <div class="ust"><button class="ib" data-act="to-history" aria-label="Geçmişe dön">${c("geri")}</button><span class="ib-yer"></span></div>
    <div class="sayfa-baslik">
      <h1>${i}</h1>
      <p>${y.fmtShort(new Date(s.finishedAt??s.startedAt))} · ${l.sets} set · ${fmt(l.kg,0)} ${e.unit}</p>
    </div>
    <p class="aciklama">Bir değeri düzeltmek için üstüne yaz; alandan çıkınca kaydedilir. Hacim, "geçen sefer"
      ve ilerleme çizgisi kendiliğinden yeniden hesaplanır.</p>
    ${r}
    <div class="grup"><div class="ic">
      <button class="btn s" data-act="seans-sil">Bu seansı sil</button>
      <p>Silinen seans geçmişten kalkar, sıra yeniden hesaplanır. Geri getirebilirsin.</p>
    </div></div>`}const ds=[1,2,3,4,5,6,0],os=[30,45,60,90,120];function cs(a={}){const s=va[a.tur];return`<div class="grup" id="kurulum"><h2 class="etiket">Telefona yükle</h2><div class="ic">${a.kurulu?"<p>Telefona yüklü: ana ekrandaki simgesiyle, adres çubuğu olmadan açılıyor.</p>":a.istem?`<button class="btn p" data-act="kur">Telefona yükle</button>
         <p>Ana ekrana kendi simgesiyle eklenir; adres çubuğu olmadan açılır, internetsiz çalışır.
           Kayıtların aynen kalır. Mağaza gerekmez.</p>`:s?`<p class="kurulum-tarayici">${esc(s.tarayici)} için:</p>
           <ol class="kurulum-adim">${s.adimlar.map(i=>`<li>${i}</li>`).join("")}</ol>
           ${s.not?`<p class="kucuk-not">${esc(s.not)}</p>`:""}
           <p class="kucuk-not">Zaten yüklüyse ana ekrandaki FSet simgesinden aç.</p>`:"<p>Tarayıcı menüsünden <b>Uygulamayı yükle</b> ya da <b>Ana ekrana ekle</b>'yi seç.</p>"}</div></div>`}export function kurulumBantHTML(a){const s=a.kurulum??{};return ha(s.tur,a.settings)?`<div class="kurulum-bant"><span class="yazi"><b>FSet'i telefona yükle</b><span>Ana ekranda kendi simgesiyle, internetsiz açılır.</span></span>
    <button class="btn p kucuk" data-act="${s.istem?"kur":"kurulum-nasil"}">${s.istem?"Yükle":"Nasıl?"}</button>
    <button class="kapat" data-act="kurulum-kapat" aria-label="Bandı kapat">${c("carpi")}</button></div>`:""}export function profilOzeti(a,s=[]){const e=a.profil??{},i=s.at(-1),t=(a.trainingDays??[]).length;return[e.yas&&`${e.yas} yaş`,a.heightCm&&`${a.heightCm} cm`,i&&`${fmt(i.kg,1,1)} kg`,e.hedef&&profilEtiketi("hedef",e.hedef),t&&`haftada ${t} gün`].filter(Boolean).join(" · ")}export function settingsHTML(a){const{settings:s}=a,e=os.map(t=>`
    <button data-rest="${t}" aria-pressed="${s.restSeconds===t}" aria-label="${t} saniye">${t}</button>`).join(""),i=T.DAMBIL_ADIMLARI.map(t=>`
    <button data-dambil="${t}" aria-pressed="${s.dambilAdimi===t}">${fmt(t)} kg</button>`).join("");return`
    <div class="sayfa-baslik ust-bosluk"><h1>Ayarlar</h1></div>

    <div class="grup"><h2 class="etiket">Profil ve avatar</h2><div class="ic">
      <button class="pm-satir" data-act="to-profil">
        <span class="avatar-k" data-avatar-k aria-hidden="true"></span>
        <span class="yazi"><b>${esc(s.profil?.ad?.trim()||"Profil oluştur")}</b><span>${esc(profilOzeti(s,a.kilolar))}</span></span>${c("ileri")}
      </button>
    </div></div>

    <div class="grup"><h2 class="etiket">Setler arası dinlenme</h2><div class="ic">
      <div class="segment" role="group" aria-label="Dinlenme süresi">${e}</div>
      <p>Saniye. Odak ekranındaki sayaç bu süreyle başlar.</p>
    </div></div>

    <div class="grup"><h2 class="etiket">Setten sonra zorluk (RIR)</h2><div class="ic">
      <div class="segment" role="group" aria-label="RIR sorusu">${[["kapali","Sorma",!1],["acik","Sor",!0]].map(([t,n,r])=>`<button data-rirsor="${t}" aria-pressed="${!!s.rirSor===r}">${n}</button>`).join("")}</div>
      <p>Ağırlıklı her setten sonra "kaç tekrar daha yapabilirdin?" sorulur; cevap ağırlık önerisini daha doğru yapar.
        Programda hedef RIR verdiğin harekette her zaman sorulur.</p>
    </div></div>

    <div class="grup"><h2 class="etiket">Seans başında kontrol</h2><div class="ic">
      <div class="segment" role="group" aria-label="Toparlanma kontrolü">${[["kapali","Sorma",!1],["acik","Sor",!0]].map(([t,n,r])=>`<button data-hzsor="${t}" aria-pressed="${s.hazirlikSor!==!1===r}">${n}</button>`).join("")}</div>
      <p>Seansa başlamadan uyku, uzun süren kas tutulması ve ağrı sorulur; cevaba göre "plana uy", "biraz hafiflet" ya da
        "dinlen" önerilir. Günde bir kez sorulur, atlanabilir.</p>
    </div></div>

    <div class="grup"><h2 class="etiket">Dambıl adımı</h2><div class="ic">
      <div class="segment" role="group" aria-label="Dambıl adımı">${i}</div>
      <p>Salondaki dambıl setinde bir sonraki ağırlık. Bar 2,5 kg, makine ve kablo 5 kg adımla ilerler.</p>
    </div></div>

    ${cs(a.kurulum)}

    <div class="grup"><h2 class="etiket">Yedek</h2><div class="ic">
      <p>Veri yalnız bu telefonda; sunucuya hiçbir şey gönderilmez. Telefonu değiştirirsen ya da tarayıcı
        verisini silersen <b>her şey gider</b>; arada bir yedek al.</p>
      <div class="cift">
        <button class="btn s" data-act="import">Geri yükle</button>
        <button class="btn s" data-act="backup">Yedek al</button>
      </div>
    </div></div>

    <div class="grup"><h2 class="etiket">Bugünkü seans</h2><div class="ic">
      <button class="btn s" data-act="reset-day">Bugünü sıfırla</button>
      <p>Bugün girilen setleri siler. Hemen ardından geri getirebilirsin.</p>
    </div></div>

    <div class="grup"><h2 class="etiket">Hakkında</h2><div class="ic">
      <div class="hk-ust"><img src="icons/isaret.svg" alt="" width="44" height="26">
        <div class="hk-ad"><b class="hk-kelime"><span class="k1">${esc(J.on)}</span><span class="k2">${esc(J.son)}</span></b>
          <small>Sürüm ${esc(ga)}</small></div></div>
      <p>Verilerin yalnızca bu telefonda durur; hesap yok, hiçbir sunucuya bir şey gönderilmez.</p>
      <a class="hk-bag" href="gizlilik.html">Gizlilik politikası${c("ileri")}</a>
      <a class="hk-bag" href="kosullar.html">Kullanım koşulları${c("ileri")}</a>
    </div></div>

    <p class="kucuk-yazi">Ağrı hissettiğin bir harekette dur; bu uygulama tıbbi tavsiye vermez.
      Hareket çizimleri <a href="js/vendor/three-LICENSE.txt" target="_blank" rel="noopener">three.js</a> ile yapılır (MIT lisansı);
      manken MakeHuman ile üretildi (CC0); yazı tipi Archivo (<a href="fonts/OFL.txt" target="_blank" rel="noopener">SIL OFL 1.1</a>).
      © 2026 Sabri Temel, tüm hakları saklıdır.</p>
    ${sekmelerHTML("ayarlar")}`}const j=(a,s,e)=>a.map(([i,t,n])=>`<button class="renk" data-${e}="${i}" aria-pressed="${s===i}" aria-label="${esc(t)}" style="--renk:${n}"></button>`).join("");export function profilHTML(a){const s=a.settings??{},e=s.avatar??{},i=s.profil??{},t=h.cozumle(e,i),n=h.govdeBul(t.govde),r=a.avatarOneri,l=a.avatarSekme??"profil",d=a.kiyafetParca??"ust",u=(p,m)=>`<p class="renk-ad">${esc(p.find(v=>v[0]===m)?.[1]??"")}</p>`,k=`<p class="av-not">Roby'nin teni, saçı ve kıyafeti yok; bunlar Leo, Mia, Max ve Nora için.</p>`,b={avatar:()=>`<div class="govdeler">${h.GOVDELER.map(p=>`<button class="cip" data-avatar-govde="${p.id}" aria-pressed="${t.govde===p.id}">${esc(p.ad)}</button>`).join("")}</div>
      <p class="av-not">${t.robot?"Roby daha hafif bir manken; pili korur.":a.cAcilamadi?"Ayrıntılı manken bu telefonda açılamadı; şimdilik Roby çiziliyor.":"Yaşını Profil'de yazarsan avatar önerilir; seçimin hep senin."}</p>`,ten:()=>t.robot?k:`<div class="renkler">${j(h.TEN,t.ten,"avatar-ten")}</div>${u(h.TEN,t.ten)}
      <p class="av-not">Ten ve saç rengi telefonunun bölge ayarına göre önerildi; internete bağlanılmaz.</p>`,sac:()=>t.robot?k:(n.kadin?"":`<div class="segment" role="group" aria-label="Saç">
        <button data-avatar-sacvar="1" aria-pressed="${t.sacli}">Saçlı</button><button data-avatar-sacvar="0" aria-pressed="${!t.sacli}">Saçsız</button></div>`)+(t.sacli?`<div class="renkler">${j(h.SAC,t.sacRenk,"avatar-sac")}</div>${u(h.SAC,t.sacRenk)}`:""),kiyafet:()=>t.robot?k:`<div class="segment" role="group" aria-label="Kıyafet">
        <button data-kiyafet-parca="ust" aria-pressed="${d==="ust"}">Üst</button><button data-kiyafet-parca="alt" aria-pressed="${d==="alt"}">Alt</button></div>`+(d==="ust"?`<div class="renkler">${j(h.UST,t.ust,"avatar-ust")}</div>${u(h.UST,t.ust)}`:`<div class="renkler">${j(h.ALT,t.alt,"avatar-alt")}</div>${u(h.ALT,t.alt)}`)},g=[["profil","Profil"],["avatar","Avatar"],["ten","Ten"],["sac","Saç"],["kiyafet","Kıyafet"]];return`
    <div class="ust av-baslik"><button class="ib" data-act="to-settings" aria-label="Ayarlara dön">${c("geri")}</button><h1>Profil ve avatar</h1><span class="ib-yer"></span></div>
    <div class="av-sahne">
      <div class="avatar-onizleme" id="avatar3d" aria-label="Avatarın — döndürmek için sürükle"></div>
      ${r?"":'<img class="damga" src="icons/isaret.svg" alt="" width="30" height="17">'}
      ${r?`<div class="avatar-oneri"><span>Avatarın ${r.yas?"yaşına":"seçimine"} göre ${esc(h.govdeBul(r.yeni).ad)} oldu.</span>
        <button data-act="avatar-geri-al">Geri al</button></div>`:'<p class="avatar-ipucu">Döndürmek için sürükle</p>'}
    </div>
    <div class="av-sekmeler" role="tablist" aria-label="Profil ve avatar">${g.map(([p,m])=>`<button role="tab" data-avatar-sekme="${p}" aria-selected="${l===p}">${m}</button>`).join("")}</div>
    ${l==="profil"?`<div class="pf-sayfa" role="tabpanel">${us(a)}</div>`:`<div class="av-panel" role="tabpanel">${b[l]()}</div>`}`}const ea={hedef:[["kas","Kas"],["guc","Güç"],["form","Genel form"]],yer:[["salon","Salonda"],["ev","Evde"]],deneyim:[["yeni","Yeni"],["orta","Bir süredir"],["ileri","Deneyimli"]]};export const profilEtiketi=(a,s)=>ea[a]?.find(e=>e[0]===s)?.[1]??"";const F=(a,s,e)=>`<div class="segment" role="group" aria-label="${e}">${ea[a].map(([i,t])=>`<button data-profil-${a}="${i}" aria-pressed="${s===i}">${t}</button>`).join("")}</div>`;export function kiloOzetHTML(a=[]){if(!a.length)return'<p class="kilo-yok">Henüz kilo kaydı yok. "Kilo gir" ile ilk ölçümünü yaz; o senin başlangıcın olur.</p>';const s=a[0],e=a.at(-1),i=e.kg-s.kg,t=Math.round((e.ts-s.ts)/864e5),n=t>=14?`${Math.round(t/7)} hafta`:`${t} gün`,r=(l,d,u,k="")=>`<div class="${k}"><small>${l}</small><b>${d}</b><em>kg</em><span>${u}</span></div>`;return`<div class="kilo-uc">${r("Başlangıç",fmt(s.kg,1,1),y.fmtShort(new Date(s.ts)))}${r("Güncel",fmt(e.kg,1,1),y.relativeLabel(new Date(e.ts)))}${r("Değişim",a.length<2||Math.abs(i)<.05?"0":`${i>0?"+":"−"}${fmt(Math.abs(i),1,1)}`,a.length<2?"ilk ölçüm":n,"fark")}</div>`}function us(a){const s=a.settings??{},e=s.profil??{},i=s.trainingDays??[],t=y.upcoming(new Date,i,3);return`
    <div class="grup"><h2 class="etiket">Sen</h2><div class="ic">
      <div class="av-iki">
        <div class="profil-alan"><label for="p-adin">Adın</label><input class="metin" id="p-adin" maxlength="24" autocomplete="off" placeholder="Örneğin Deniz" value="${esc(e.ad??"")}"></div>
        <div class="profil-alan av-yas"><label for="p-yas">Yaşın</label><input class="metin" id="p-yas" inputmode="numeric" maxlength="3" autocomplete="off" placeholder="—" value="${e.yas??""}"></div></div>
      <p class="pf-soru">Cinsiyet</p>
      <div class="segment" role="group" aria-label="Cinsiyet">${h.CINSIYET.map(([n,r])=>`<button data-profil-cins="${n}" aria-pressed="${e.cinsiyet===n}">${r}</button>`).join("")}</div>
      <p>İsteğe bağlı; yalnız bu telefonda saklanır. Yaş ve cinsiyet avatarını önerir.</p>
    </div></div>

    <div class="grup"><h2 class="etiket">Vücut</h2><div class="ic">
      <div class="alan"><label for="p-boy">Boy</label>
        <label class="kutucuk"><input type="number" id="p-boy" inputmode="numeric" min="100" max="250" step="1"
          value="${s.heightCm??""}" placeholder="—" aria-label="Boy (cm)"><small>cm</small></label></div>
      <div class="alan"><label for="p-hedefkilo">Hedef kilo</label>
        <label class="kutucuk"><input type="number" id="p-hedefkilo" inputmode="decimal" min="20" max="400" step="0.1"
          value="${e.hedefKilo??""}" placeholder="—" aria-label="Hedef kilo (kg)"><small>kg</small></label></div>
      <p>Boy ve hedef kilo isteğe bağlı.</p>
      <p class="pf-soru">Kilo</p>
      ${kiloOzetHTML(a.kilolar)}
      <div class="cift"><button class="btn s" data-act="kilo-gir">${c("arti")}Kilo gir</button><button class="btn s" data-act="to-history">${c("grafik")}Grafik</button></div>
    </div></div>

    <div class="grup"><h2 class="etiket">Antrenman</h2><div class="ic">
      <p class="pf-soru ilk">Hedefin</p>${F("hedef",e.hedef,"Hedefin")}
      <p class="pf-soru">Nerede</p>${F("yer",e.yer,"Nerede çalışıyorsun")}
      <p class="pf-soru">Deneyimin</p>${F("deneyim",e.deneyim,"Deneyimin")}
      <p class="pf-soru">Antrenman günlerin</p>
      <div class="cipler">${ds.map(n=>`<button class="cip" data-gun="${n}" aria-pressed="${i.includes(n)}" aria-label="${y.GUN[n]}">${y.GUN_KISA[n]}</button>`).join("")}</div>
      <p>Sıradaki: ${t.length?`<b>${t.map(n=>y.fmtShort(n)).join(" · ")}</b>`:"Hiç gün seçili değil; takvim çalışmaz."}</p>
      <button class="btn s" data-act="profil-oner">Bu cevaplara göre program öner</button>
      <p>Cevapları değiştirmek programını değiştirmez; öneriyi görür, istersen eklersin.</p>
    </div></div>

    <div class="grup"><button class="btn s" data-act="profil-sil">${c("sil")}Profil bilgilerimi sil</button>
      <p class="kucuk-yazi grup-alti">Ad, yaş, cinsiyet, boy, hedef kilo ve cevaplar boşalır. Antrenman günlerin ve kilo geçmişin kalır; kilo kayıtları İlerleme'den silinir.</p></div>`}const ps=[["ilerleme","İlerleme","ilerleme","to-history"],["hareketler","Hareketler","hareket","to-hareketler"],["bugun","Antrenman","bugun","to-list"],["programlar","Programlar","program","to-programs"],["ayarlar","Ayarlar","ayar","to-settings"]],ia=a=>`<svg class="si" aria-hidden="true"><use href="#s-${a}"/></svg>`;export function sekmelerHTML(a){return`<nav class="sekmeler" aria-label="Ana gezinme">${ps.map(([s,e,i,t])=>{const n=s===a?' aria-current="page"':"";return s==="bugun"?`<button class="orta" data-act="${t}" aria-label="${e}"${n}><span class="daire">${ia(i)}</span></button>`:`<button data-act="${t}"${n}>${ia(i)}<span>${e}</span></button>`}).join("")}</nav>`}const ta=a=>cizimsiz(a)?`<span class="kucuk yer" aria-hidden="true">${c("figur")}</span>`:`<span class="kucuk" data-kucuk="${esc(a.id)}" aria-hidden="true"></span>`,ms=a=>a.gunler.reduce((s,e)=>s+e.hareketler.length,0);export function programsHTML(){const a=o.aktifProgram();return`
    <div class="sayfa-baslik ust-bosluk"><h1>Programlar</h1>
      <p>Bugün ekranı <b>kullanılan</b> programın sıradaki gününü gösterir.</p></div>
    <div class="liste">${o.programListesi().map(e=>`
    <button class="satir yalin" data-program-ac="${esc(e.id)}">
      <span class="ad"><b>${esc(e.ad)}</b><span>${e.gunler.length} gün · ${ms(e)} hareket</span></span>
      <span class="sag">${e===a?'<span class="rozet">Kullanılıyor</span>':""}</span>${c("ileri")}
    </button>`).join("")}</div>
    <div class="grup"><button class="btn s" data-act="program-yeni">${c("arti")}Yeni program</button></div>
    <div class="grup"><h2 class="etiket">Hazır programlar</h2><div class="hazir-liste">${Z.map(na("data-hazir")).join("")}</div>
      <p class="kucuk-yazi grup-alti">Dokun: günlerini gör, kopyasını programlarına ekle. Eklenen kopya senindir; düzenleyebilirsin.</p></div>
    ${sekmelerHTML("programlar")}`}const $s=a=>a.gunler.length===2?"A / B":`${a.gunler.length} farklı gün`,na=a=>s=>`<button class="hazir" ${a}="${esc(s.id)}"><span class="ad"><b>${esc(s.ad)}</b><span>${esc(s.kime)}</span></span>
  <span class="rozet">${$s(s)}</span></button>`;function ra(a,s){const e=i=>i.seconds!=null?`${i.sets}×${i.seconds} sn`:`${i.sets}×${i.reps}`;return`<div class="oneri-kart">${s?`<small>${s}</small>`:""}<h2>${esc(a.ad)}</h2><p>${esc(a.kime)}</p>
    <div class="gun-ozet">${a.gunler.map(([i,t],n)=>`<div><b>${esc(i||`${n+1}. Gün`)}</b><span>${t.map(r=>`${esc(o.byId[r.exId]?.ad??r.exId)} ${e(r)}`).join(" · ")}</span></div>`).join("")}</div></div>`}export function hazirHTML(a){const s=X(a.hazirId),e=a.hazirGeri==="profil"?`<button class="ib" data-act="to-profil" aria-label="Profile dön">${c("geri")}</button>`:`<button class="ib" data-act="to-programs" aria-label="Programlara dön">${c("geri")}</button>`;return s?`
    <div class="ust">${e}
      <span class="tarih">Hazır program</span><span class="ib-yer"></span></div>
    ${ra(s,a.hazirGeri==="profil"?"PROFİLİNE GÖRE ÖNERİLEN":void 0)}
    <div class="grup"><button class="btn p" data-act="hazir-ekle">${c("arti")}Programlarıma ekle</button></div>
    <p class="kucuk-yazi grup-alti">Kopyası eklenir; günlerini ve hedeflerini düzenleyebilirsin. Kullanmak için programda "Bu programı kullan".</p>`:`<div class="ust">${e}</div>`}export function ilkAcilisHTML(a){const s=a.ia,e=`<div class="ilerleme-cizgi" aria-hidden="true">${[1,2,3,4,5].map(n=>`<i class="${n<=s.adim?"dolu":""}"></i>`).join("")}</div>`;if(s.adim===0)return`
    <div class="karsilama"><img class="logo" src="icons/fset-192.png" alt="">
      <h1>Antrenman defterin hazır.</h1>
      <p>Dört kısa soru; sana uygun programı önerelim. Bir dakika sürer.</p>
      <ul><li>Her hareketin 3B anlatımı</li><li>Set, tekrar ve ağırlık kaydı</li><li>Hesap yok; verilerin telefonunda kalır</li></ul>
      <p class="kucuk-yazi">FSet bir egzersiz yardımcısıdır, tıbbi tavsiye vermez. Bir sağlık sorunun varsa başlamadan önce hekimine danış.
        Devam ederek <a href="kosullar.html">Kullanım koşullarını</a> kabul etmiş olursun; verilerinin nasıl tutulduğu
        <a href="gizlilik.html">Gizlilik politikasında</a>.</p></div>
    <div class="alt-bar dikey"><button class="btn p" data-ia="ileri">Başlayalım</button>
      <button class="btn s" data-ia="kendim">Kendim kuracağım</button></div>`;if(s.adim<=4){const n=ka[s.adim-1];return`${e}
    <div class="soru"><h1>${n.soru}</h1>${n.alt?`<p>${n.alt}</p>`:""}</div>
    <div class="secenekler" role="group" aria-label="${n.soru}">${n.secenek.map(([r,l,d])=>`<button class="secenek" aria-pressed="${s.c[n.anahtar]===r}" data-ia-cevap="${n.anahtar}:${r}"><span class="ad"><b>${l}</b>${d?`<span>${d}</span>`:""}</span></button>`).join("")}</div>
    <div class="alt-bar"><button class="btn s" data-ia="geri">${c("geri")}Geri</button><span class="kucuk-yazi">${s.adim} / 4</span></div>`}if(s.adim===5){const n=h.cozumle({},{yas:s.profil.yas,cinsiyet:s.profil.cinsiyet??null}).govde,r=s.profil.govde??n;return`${e}
    <div class="soru"><h1>Seni tanıyalım</h1><p>Hepsi isteğe bağlı ve Profil'e yazılır; istediğin zaman değiştirir ya da silersin. Yalnız bu telefonda kalır.</p></div>
    <div class="profil-alan">
      <div class="form-alan"><label for="ia-ad">Adın</label><input id="ia-ad" class="metin" maxlength="24" autocomplete="off" placeholder="İsteğe bağlı" value="${esc(s.profil.ad??"")}"></div>
      <div class="form-alan"><label for="ia-yas">Yaşın</label><input id="ia-yas" class="metin" inputmode="numeric" maxlength="3" placeholder="İsteğe bağlı" value="${s.profil.yas??""}"></div>
      <div class="form-alan"><span class="etiket">Cinsiyet</span><div class="segment" role="group" aria-label="Cinsiyet">${h.CINSIYET.map(([l,d])=>`<button data-ia-cins="${l}" aria-pressed="${s.profil.cinsiyet===l}">${d}</button>`).join("")}</div></div>
      <div class="av-iki">
        <div class="form-alan"><label for="ia-boy">Boy (cm)</label><input id="ia-boy" class="metin" inputmode="numeric" maxlength="3" placeholder="İsteğe bağlı" value="${s.profil.boy??""}"></div>
        <div class="form-alan"><label for="ia-kilo">Kilo (kg)</label><input id="ia-kilo" class="metin" inputmode="decimal" maxlength="5" placeholder="İsteğe bağlı" value="${s.profil.kilo??""}"></div></div>
      <p class="kucuk-yazi">Kilo, İlerleme'deki kilo takibinin ilk ölçümü olur.</p>
      <div class="form-alan"><span class="etiket">Avatar</span><div class="cip-izgara">${h.GOVDELER.map(l=>`<button class="cip" aria-pressed="${l.id===r}" data-ia-govde="${l.id}">${esc(l.ad)}</button>`).join("")}</div></div></div>
    <div class="alt-bar"><button class="btn s" data-ia="atla">Atla</button><button class="btn p" data-ia="ileri">Devam</button></div>`}const i=s.secili??ba(s.c),t=X(i);return`
    <div class="soru"><h1>Senin için önerimiz</h1><p>Hedefine ve haftana göre seçildi; istediğin zaman değiştirebilirsin.</p></div>
    ${ra(t,s.secili?"SEÇTİĞİN":"ÖNERİLEN")}
    <div class="alt-bar dikey"><button class="btn p" data-ia="basla">Bu programla başla</button></div>
    <div class="grup"><h2 class="etiket">Diğer programlar</h2><div class="hazir-liste">${Z.filter(n=>n.id!==i).map(na("data-ia-sec")).join("")}</div></div>
    <div class="grup"><button class="btn s" data-ia="kendim">Kendim kuracağım</button></div>`}const ks=(a,s,e,i)=>`<span class="hedef">
    <button class="adim" data-kalem="${a}:${s}:-1" aria-label="${i} azalt">${c("eksi")}</button>
    <b>${e}</b>
    <button class="adim" data-kalem="${a}:${s}:1" aria-label="${i} artır">${c("arti")}</button></span>`,la=a=>a.minutes!=null?`${a.minutes} dk`:a.seconds!=null?`${a.sets} × ${a.seconds} sn`:`${a.sets} × ${a.repsMin&&a.repsMin<a.reps?`${a.repsMin}-`:""}${a.reps}`;function bs(a,s,e,i=60){const t=o.byId[a.exId]??o.bilinmeyenHareket(a.exId),n=[t.grup,S[t.equipment]].filter(Boolean).join(" · "),r=`${s}:`;let l="";if(e){const d=a.minutes!=null?"":`<div class="g-alan"><div class="g-etk"><span>Set</span><b>${a.sets}</b></div>${noktalarHTML("dz-set",a.sets,r)}</div>`,u=a.minutes!=null?`<div class="g-alan"><div class="g-etk"><span>Süre</span></div>${ks(s,"minutes",`${a.minutes} dk`,"Süre")}</div>`:a.seconds!=null?`<div class="g-alan"><div class="g-etk"><span>Süre</span><b>${a.seconds} sn</b></div>
            <div class="semalar" role="group" aria-label="Süre">${[...new Set([15,20,30,45,60,90,a.seconds])].sort((b,g)=>b-g).map(b=>`<button class="cip" aria-pressed="${b===a.seconds}" data-dz-sn="${r}${b}">${b} sn</button>`).join("")}</div></div>`:`<div class="g-alan"><div class="g-etk"><span>Tekrar</span><b>${a.reps}</b></div>${tekrarSeridiHTML("dz-tekrar",a.reps,r)}</div>
           ${semalarHTML("dz-sema",a.sets,a.reps,r)}`,k=a.minutes!=null?"":yontemHTML("dz-yontem",a,r,i,{tekrarli:a.reps!=null&&t.setType!=="time"});l=`<div class="acilir">${d}${u}${k}
      <div class="alt-eylem"><button class="btn s" data-cikar="${s}">${c("sil")}Bu günden çıkar</button></div></div>`}return`<div class="satir-d${e?" acik":""}" data-dz-i="${s}">
    <div class="kafa">${ta(t)}
      <button class="ad" data-dz-ac="${s}" aria-expanded="${e}"><b>${adi(t)}</b>${n?`<small>${esc(n)}</small>`:""}</button>
      <button class="hap" data-dz-ac="${s}" aria-label="${adi(t)}: hedef ${la(a)}">${la(a)}</button>
      <button class="tutac" data-dz-tutac="${s}" aria-label="${adi(t)}: sırayı değiştir — sürükle ya da yukarı/aşağı ok tuşu">${c("tutac")}</button>
    </div>${l}</div>`}const da=a=>JSON.stringify({...a,guncellendi:0});export const programDegisti=(a,s)=>!!(a&&s&&da(a)!==da(s));export function programHTML(a){const s=o.programGetir(a.duzen?.id);if(!s)return`<div class="ust"><button class="ib" data-act="to-programs" aria-label="Programlara dön">${c("geri")}</button></div>
    <div class="sayfa-baslik"><h1>Program bulunamadı</h1></div>`;const e=Math.min(a.duzen.gun??0,s.gunler.length-1),i=s.gunler[e],t=s===o.aktifProgram(),n=i.hareketler.map((r,l)=>bs(r,l,a.duzen.acik===l,a.settings?.restSeconds??60)).join("");return`
    <div class="ust"><button class="ib" data-act="to-programs" aria-label="Programlara dön">${c("geri")}</button>
      ${programDegisti(s,a.duzen.kopya)?`<button class="geri-don" data-act="program-geri-don">${c("geri-al")}Açtığın hâle dön</button>`:""}
      ${t?'<span class="rozet">Kullanılıyor</span>':'<button class="cip" data-act="program-aktif">Bu programı kullan</button>'}</div>
    <div class="form-alan"><label for="p-ad">Programın adı</label>
      <input id="p-ad" class="metin" value="${esc(s.ad)}" maxlength="60" autocomplete="off"></div>
    <div class="kaydir" role="group" aria-label="Günler">${s.gunler.map((r,l)=>`<button class="cip" aria-pressed="${l===e}" data-pgun="${l}">${l+1}. Gün</button>`).join("")}
      ${s.gunler.length<7?`<button class="cip" data-act="gun-ekle" aria-label="Gün ekle">${c("arti")}Gün</button>`:""}</div>
    <div class="form-alan"><label for="g-ad">${e+1}. günün adı</label>
      <input id="g-ad" class="metin" value="${esc(i.ad??"")}" maxlength="60" autocomplete="off"
             placeholder="${esc(o.gunEtiketi(e,s).kaslar)}"></div>
    <div class="grup"><h2 class="etiket">Hareketler · ${i.hareketler.length}</h2>
      ${i.hareketler.length?`<div class="liste-d" id="dz-liste">${n}</div>`:'<div class="ic"><p>Bu gün boş. Aşağıdan hareket ekle.</p></div>'}
    </div>
    <div class="grup"><h2 class="etiket">Soğuma</h2>
      <div class="segment" role="group" aria-label="${e+1}. günün soğuması">${Object.entries(o.SOGUMA_SECENEK).map(([r,l])=>`<button aria-pressed="${(i.soguma??"kas")===r}" data-psoguma="${r}">${l}</button>`).join("")}</div>
      <p class="kucuk-yazi gun-ayar-not">${{kas:"Günün kaslarından en fazla 5 esneme, ~5 dk.",tum:`Tüm vücut esneme: ${o.ESNEME.length} esneme, ${esDakika(o.sogumaSuresi(o.tumVucut(a.settings?.profil)))}.`,kapali:"Bu günün listesinde soğuma satırı görünmez."}[i.soguma??"kas"]}</p></div>
    <div class="grup eylemler"><button class="btn s" data-act="secici-ac">${c("arti")}Hareket ekle</button>
      ${s.gunler.length>1?`<button class="btn s" data-act="gun-sil">${e+1}. günü sil</button>`:""}
      ${!t&&s.id!=="benim"?'<button class="btn s" data-act="program-sil">Programı sil</button>':""}
    </div>
    <p class="kucuk-yazi">Satıra dokun: set ve tekrar. ⋮⋮ tutup sürükle: sıra. Değişiklikler hemen kaydedilir; geçmişteki seanslar etkilenmez.</p>`}const gs={Göğüs:"bb_bench_press",Sırt:"bw_pullup",Omuz:"db_lateral_raise",Kol:"db_biceps_curl",Bacak:"bb_squat",Karın:"plank",Kardiyo:"cardio_bike"},O={kutuphane:{durum:a=>a.kutuphane,grup:"kgrup",eq:"keq",ara:"k-ara",liste:"kutuphane-liste"},secici:{durum:a=>a.secici,grup:"sgrup",eq:"seq",ara:"ara",liste:"secici-liste"}};export const gozAtMi=a=>!a.grup&&!a.eq&&!String(a.ara??"").trim();export function vurgula(a,s){const e=String(a??"");if(!s)return esc(e);const i=f(e);if(i.length!==e.length)return esc(e);let t="",n=0,r;for(;(r=i.indexOf(s,n))>=0;)t+=`${esc(e.slice(n,r))}<mark>${esc(e.slice(r,r+s.length))}</mark>`,n=r+s.length;return t+esc(e.slice(n))}function vs(a,s,e,i){const t=z(a),n=!!a.kas&&!a.equipment,l=(!!o.isinmaById[a.id]?[a.miktar,"ısınmada"]:[s==="secici"&&i?.has(a.id)&&"bu günde var",n?a.kas:a.mus,n?_[a.yer]:S[a.equipment],a.ozel&&"özel"]).filter(Boolean).map(esc).join(" · "),d=`${ta(a)}<span class="ad"><b>${vurgula(I(a),e)}</b>${t?`<span>${vurgula(t,e)}</span>`:""}<span>${l}</span></span>`;if(s!=="secici")return`<button class="satir" data-hareket="${esc(a.id)}">${d}<span class="durum ok">${c("ileri")}</span></button>`;const u=`<button class="satir" data-ekle="${esc(a.id)}">${d}<span class="durum ikon">${c("arti")}</span></button>`;return a.ozel?`<div class="satir-ozel">${u}<button class="ozel-sil" data-ozel-sil="${esc(a.id)}" aria-label="${adi(a)}: kütüphaneden sil">${c("sil")}</button></div>`:u}const f=a=>String(a??"").toLocaleLowerCase("tr");export function seciciSonuc(a){const s=f(a.ara).trim();return o.kutuphaneListesi().filter(e=>(!a.grup||e.grup===a.grup)&&(!a.eq||e.equipment===a.eq)&&(!s||[e.ad,e.en,e.tr,e.mus].some(i=>f(i).includes(s)))).sort((e,i)=>f(I(e)).localeCompare(f(I(i)),"tr"))}export function esnemeSonuc(a){if(a.eq||a.grup&&a.grup!=="Esneme")return[];const s=f(a.ara).trim();return o.ESNEME.filter(e=>!s||[e.ad,e.en,e.kas].some(i=>f(i).includes(s))).sort((e,i)=>f(I(e)).localeCompare(f(I(i)),"tr"))}export function isinmaSonuc(a){if(a.eq||a.grup&&a.grup!=="Isınma")return[];const s=f(a.ara).trim();return o.ISINMA.filter(e=>!s||[e.ad,e.en,e.not].some(i=>f(i).includes(s))).sort((e,i)=>f(I(e)).localeCompare(f(I(i)),"tr"))}const oa=new Set(["Esneme","Isınma"]);function hs(a,s){const e=O[s],i=o.kutuphaneListesi(),t=l=>i.filter(d=>d.grup===l).length,n=(a.sonYapilanlar??[]).map(l=>o.byId[l]).filter(l=>l&&!l.arsiv),r=l=>s==="secici"?`data-ekle="${esc(l.id)}"`:`data-hareket="${esc(l.id)}"`;return`${n.length?`
    <div class="bolum-baslik"><h2>Son yaptıkların</h2><span>${n.length}</span></div>
    <div class="gz-son">${n.map(l=>`<button ${r(l)}><span class="k3" ${cizimsiz(l)?"":`data-kucuk="${esc(l.id)}"`} aria-hidden="true"></span>
      <b>${adi(l)}</b><small>${esc(l.grup??"")}</small></button>`).join("")}</div>`:""}
    <div class="bolum-baslik"><h2>Kas grupları</h2><span>dokun: o grubun hareketleri</span></div>
    <div class="gz-izgara">${K.filter(l=>t(l)).map(l=>`<button class="gz-kart" data-${e.grup}="${l}">
      <span class="g3" data-kucuk="${gs[l]}" aria-hidden="true"></span><b>${l}</b><small>${t(l)} hareket</small></button>`).join("")}
      ${s==="kutuphane"?`<button class="gz-kart" data-kgrup="Isınma"><span class="g3" data-kucuk="w_kol_cevirme" aria-hidden="true"></span>
        <b>Isınma</b><small>${o.ISINMA.length} hareket</small></button>
        <button class="gz-kart genis" data-kgrup="Esneme"><span class="g3" data-kucuk="es_cocuk_pozu" aria-hidden="true"></span>
        <b>Esneme</b><small>${o.ESNEME.length} esneme · tüm vücut rutini</small></button>`:""}</div>
    <div class="bolum-baslik"><h2>Ekipmana göre</h2></div>
    <div class="kaydir" role="group" aria-label="Ekipman">${Object.keys(S).filter(l=>i.some(d=>d.equipment===l)).map(l=>`<button class="cip" data-${e.eq}="${l}">${S[l]}</button>`).join("")}</div>`}function U(a,s){const e=O[s].durum(a);if(gozAtMi(e))return hs(a,s);const i=f(e.ara).trim(),t=s==="secici"?new Set(o.programGetir(a.duzen?.id)?.gunler[a.duzen.gun]?.hareketler.map(g=>g.exId)??[]):null,n=oa.has(e.grup)?[]:seciciSonuc(e),r=s==="secici"?[]:esnemeSonuc(e),l=s==="secici"?[]:isinmaSonuc(e),d=n.length+r.length+l.length;if(!d)return'<div class="grup"><div class="ic"><p>Bulunamadı. Aşağıdan özel hareket olarak ekleyebilirsin.</p></div></div>';const u=g=>`<div class="liste">${g.map(p=>vs(p,s,i,t)).join("")}</div>`,k=i?`<p class="sayac">${d} sonuç${e.grup?"":" · tüm gruplarda"}</p>`:"";if(e.grup)return k+u(e.grup==="Esneme"?r:e.grup==="Isınma"?l:n);const b=K.map(g=>[g,n.filter(p=>p.grup===g)]).filter(([,g])=>g.length);return l.length&&b.push(["Isınma",l]),r.length&&b.push(["Esneme",r]),k+b.map(([g,p])=>`<div class="bolum-baslik"><h2>${esc(g)}</h2><span>${p.length}</span></div>${u(p)}`).join("")}export const seciciListeHTML=a=>U(a,"secici"),kutuphaneListeHTML=a=>U(a,"kutuphane");function ca(a,s){const e=O[s],i=e.durum(a),t=gozAtMi(i),n=i.grup||(i.eq?S[i.eq]:""),r=o.kutuphaneListesi(),l=`<button class="ib" data-${e.grup}="" aria-label="Kas gruplarına dön">${c("geri")}</button>`,d=`<button class="ib" data-act="secici-kapat" aria-label="Kapat">${c("carpi")}</button>`,u=s==="secici"?`<div class="ust">${n?l:d}<span class="tarih">Hareket ekle · ${a.duzen.gun+1}. Gün</span>${n?d:'<span class="ib-yer"></span>'}</div>`:n?`<div class="ust">${l}<span class="tarih">Hareketler</span><span class="ib-yer"></span></div>`:"",k=i.grup==="Esneme"?o.ESNEME.length:i.grup==="Isınma"?o.ISINMA.length:r.filter(p=>(!i.grup||p.grup===i.grup)&&(!i.eq||p.equipment===i.eq)).length,b=n?`<div class="sayfa-baslik"><h1>${esc(n)}</h1><p>${k} ${i.grup==="Esneme"?"esneme":i.grup==="Isınma"?"ısınma hareketi · seans başında günün kaslarına göre gelir":"hareket"}</p></div>`:s==="kutuphane"?`<div class="sayfa-baslik ust-bosluk"><h1>Hareketler</h1><p>${r.length} hareket · ${o.ISINMA.length} ısınma · ${o.ESNEME.length} esneme</p></div>`:"",g=i.grup&&!oa.has(i.grup)?Object.keys(S).filter(p=>r.some(m=>m.grup===i.grup&&m.equipment===p)):[];return`${u}${b}
    ${s==="kutuphane"&&i.grup==="Esneme"&&!i.ara.trim()?Xa(a):""}
    <label class="arama">${c("ara")}<input id="${e.ara}" type="search" value="${esc(i.ara)}" placeholder="${n?`${esc(n)} içinde ara`:"Ara: squat, göğüs, curl…"}"
      autocomplete="off" aria-label="Hareket ara"></label>
    ${g.length>1?`<div class="kaydir" role="group" aria-label="Ekipman">${["",...g].map(p=>`<button class="cip" aria-pressed="${i.eq===p}" data-${e.eq}="${p}">${p?S[p]:"Tümü"}</button>`).join("")}</div>`:""}
    <div id="${e.liste}">${U(a,s)}</div>
    <div class="grup"><button class="btn s" data-act="${s==="secici"?"ozel-ac":"ozel-ac-kutuphane"}">${c("arti")}${s==="secici"?"Listede yok mu? Özel hareket ekle":"Özel hareket ekle"}</button></div>
    ${s==="kutuphane"?sekmelerHTML("hareketler"):""}`}export const seciciHTML=a=>ca(a,"secici"),kutuphaneHTML=a=>ca(a,"kutuphane");function ys(a,s,e,i){if(!a||!s||s.sayi<2)return"";const t=L.TURLER.filter(n=>a[n]);return t.length?`<div class="grup"><h2 class="etiket">Rekorların</h2><div class="ic"><div class="rekor-tablo">${t.map(n=>`<span>${L.TUR_AD[n]}<small>${i(a[n].at)} · ${Y(a[n].set,e)}</small></span><span><b>${rekorDeger(n,a[n].deger,e)}</b></span>`).join("")}</div>
    ${a.tekrarlar.length>1?`<p class="rekor-ara">Ağırlık başına en çok tekrar</p><div class="tekrar-cipleri">${a.tekrarlar.map(n=>`<span><b>${fmt(n.agirlik)} ${e}</b> × ${n.tekrar}</span>`).join("")}</div>`:""}
    ${a.bir?'<p class="oz-kural">Tahmini 1 tekrar maksimumu en fazla 10 tekrarlı setlerden hesaplanır (Brzycki); ısınma setleri sayılmaz.</p>':""}</div></div>`:""}export const GUVENLIK_NOTU="Ağrı, baş dönmesi, göğüs ağrısı ya da olağandışı nefes darlığı olursa hemen dur. Bir sağlık sorunun varsa, gebeysen ya da uzun süredir hareketsizsen başlamadan önce hekimine danış. FSet tıbbi tavsiye vermez.",ilkAgirlikNotu=a=>a?.setType!=="weight_reps"||a.equipment==="bodyweight"?"":`İlk seansta hedef tekrarı temiz teknikle bitirip 2–3 tekrar daha yapabileceğin ağırlığı seç.${a.equipment==="barbell"?" Önce boş barla tekniği öğren.":""}`;const Y=(a,s)=>a.type==="time"?`${fmt(a.seconds)} sn`:a.type==="cardio"?`${fmt(a.minutes)} dk`:a.weight?`${fmt(a.weight)} ${s} × ${a.reps??"—"}`:`${a.reps??"—"} tekrar`,ua=a=>a.target?.minutes!=null?`${a.target.minutes} dk`:a.target?.seconds!=null?`${a.sets} × ${a.target.seconds} sn`:`${a.sets} × ${a.target?.reps??"—"}`;export function hareketHTML(a){if(o.isinmaById[a.hareketId])return xa(o.isinmaById[a.hareketId]);if(o.esnemeById[a.hareketId])return Wa(o.esnemeById[a.hareketId],o.tutusSn(a.settings?.profil));const s=o.byId[a.hareketId];if(!s)return`<div class="ust"><button class="ib" data-act="to-hareketler" aria-label="Hareketlere dön">${c("geri")}</button></div>
    <div class="sayfa-baslik"><h1>Hareket bulunamadı</h1></div>`;const e=String(s.mus??"").split("·").map(r=>r.trim()).filter(Boolean),i=a.hareketGecmisi,t=a.settings?.unit??"kg",n=r=>y.fmtShort(new Date(r));return`
    <div class="ust"><button class="ib" data-act="to-hareketler" aria-label="Hareketlere dön">${c("geri")}</button>
      <span class="tarih">${esc(s.grup??"")}</span><span class="ib-yer"></span></div>
    <div class="sayfa-baslik"><h1>${adi(s)}</h1>${z(s)?`<p>${esc(z(s))}</p>`:""}</div>
    ${cizimsiz(s)?'<div class="grup"><div class="ic"><p>Özel hareket · çizimi yok.</p></div></div>':`<div class="buyuk3b"><div class="sahne3d" id="hareket3d" role="img" aria-label="${adi(s)} hareket çizimi; sürükleyerek döndürülür"></div>
         <img class="damga" src="icons/isaret.svg" alt="" width="30" height="17"><span class="ipucu">Sürükle: döndür · dokun: yeniden oynat</span></div>`}
    <p class="kunye">${[S[s.equipment],`Önerilen ${ua(s)}`].filter(Boolean).map(esc).join(" · ")}</p>
    ${e.length?`<div class="grup"><h2 class="etiket">Çalışan kaslar</h2><div class="ic"><div class="kaslar">${e.map((r,l)=>`<span class="kas${l<2?" ana":""}">${esc(r)}</span>`).join("")}</div></div></div>`:""}
    ${s.fayda?`<div class="grup"><h2 class="etiket">Faydası</h2><div class="ic"><p>${esc(s.fayda)}</p></div></div>`:""}
    <div class="grup"><h2 class="etiket">Geçmişin</h2><div class="ic">${i?`
      <div class="ozet-iki">
        <div><small>Son · ${n(i.son.at)}</small><b>${Y(i.son.set,t)}</b></div>
        <div><small>En iyi · ${n(i.enIyi.at)}</small><b>${Y(i.enIyi.set,t)}</b></div></div>
      <p class="kucuk-yazi">${i.sayi} seansta yapıldı</p>
      ${i.not?`<p class="seans-notu">${c("liste")}<span>${esc(i.not.metin)} <small>· ${n(i.not.at)}</small></span></p>`:""}`:"<p>Bu hareketi henüz kaydetmedin.</p>"}</div></div>
    ${ys(a.hareketRekor,i,t,n)}
    ${s.steps?.length?`<div class="grup"><h2 class="etiket">Nasıl yapılır</h2><div class="ic"><ol class="adimlar">${s.steps.map(r=>`<li>${esc(r)}</li>`).join("")}</ol></div></div>`:""}
    ${s.tip?`<div class="grup"><h2 class="etiket">Dikkat</h2><div class="ipucu-kutu">${esc(s.tip)}</div></div>`:""}
    ${ilkAgirlikNotu(s)?`<p class="kucuk-yazi grup-alti">${ilkAgirlikNotu(s)}</p>`:""}
    <p class="kucuk-yazi grup-alti">${GUVENLIK_NOTU}</p>
    <div class="grup eylemler"><button class="btn p" data-act="hareket-ekle-ac">${c("arti")}Programa ekle</button>
      ${s.ozel?`<button class="btn s" data-ozel-sil="${esc(s.id)}">${c("sil")}Hareketi sil</button>`:""}</div>
    ${sekmelerHTML("hareketler")}`}export function hareketEkleHTML(a){const s=o.byId[a.hareketId],e=o.programGetir(a.hareketEkle?.programId)??o.aktifProgram();return s?`
    <div class="ust"><button class="ib" data-act="hareket-ekle-kapat" aria-label="Kapat">${c("carpi")}</button>
      <span class="tarih">Programa ekle</span><span class="ib-yer"></span></div>
    <div class="sayfa-baslik"><h1>${adi(s)}</h1><p>Hangi programın hangi gününe?</p></div>
    <div class="grup"><h2 class="etiket">Program</h2><div class="kaydir" role="group" aria-label="Program">${o.programListesi().map(i=>`<button class="cip" aria-pressed="${i.id===e.id}" data-he-prg="${esc(i.id)}">${esc(i.ad)}</button>`).join("")}</div></div>
    <div class="grup"><h2 class="etiket">Gün</h2><div class="gun-secim">${e.gunler.map((i,t)=>`
      <button class="satir" data-he-gun="${t}">
        <span class="ad"><b>${o.gunEtiketi(t,e).kisa}</b><span>${[o.gunEtiketi(t,e).kaslar,`${i.hareketler.length} hareket`,i.hareketler.some(n=>n.exId===s.id)&&"bu günde var"].filter(Boolean).map(esc).join(" · ")}</span></span>
        <span class="durum ikon">${c("arti")}</span>
      </button>`).join("")}</div></div>
    <p class="kucuk-yazi grup-alti">${esc(ua(s))} hedefiyle eklenir; programda değiştirebilirsin.</p>`:""}export function ozelHTML(a){const s=a.ozelForm,e=(i,t,n)=>Object.entries(t).map(([r,l])=>`<button class="cip" aria-pressed="${n===r}" data-${i}="${r}">${l}</button>`).join("");return`
    <div class="ust"><button class="ib" data-act="ozel-kapat" aria-label="Hareket seçiciye dön">${c("geri")}</button>
      <span class="tarih">Özel hareket</span><span class="ib-yer"></span></div>
    <div class="sayfa-baslik"><h1>Özel hareket</h1>
      <p>Listede olmayan hareketi kendin ekle. Çizimi olmaz; kaydı ve geçmişi diğerleri gibi tutulur.</p></div>
    <div class="form-alan"><label for="o-ad">Adı</label>
      <input id="o-ad" class="metin" value="${esc(s.ad)}" maxlength="60" autocomplete="off" placeholder="ör. Smith makinesinde squat"></div>
    <div class="form-alan"><span class="etiket">Nasıl kaydedilsin?</span>
      <div class="cip-izgara">${e("otur",$a,s.setType)}</div></div>
    <div class="form-alan"><span class="etiket">Ekipman</span>
      <div class="cip-izgara">${e("oeq",S,s.equipment)}</div></div>
    <div class="form-alan"><span class="etiket">Çalışan kas</span>
      <div class="cip-izgara">${e("ogrup",Object.fromEntries(K.map(i=>[i,i])),s.grup)}</div></div>
    <div class="alt"><button class="btn p" data-act="ozel-kaydet">Ekle ve güne koy</button></div>`}
