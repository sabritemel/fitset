/*! © 2026 Sabri Temel — tüm hakları saklıdır. Kullanım koşulları: kosullar.html */
import*as c from"./session.js";import*as h from"./schedule.js";import{dayKey as w}from"./store.js";import{mmss as K}from"./timer.js";import*as M from"./ilerleme.js";import*as B from"./rekorlar.js";import{GRUPLAR as G,EKIPMAN as S,SET_TURU as ga}from"./program.js";import{HAZIR as J,SORULAR as va,oner as ha,hazirBul as W}from"./data/hazir.js";import{AD as Q,SURUM as ya}from"./marka.js";import*as y from"./avatar.js";import{KURULUM_TARIFI as fa,bantGoster as za}from"./kurulum.js";import*as N from"./hazirlik.js";import{anaAd as T,turkceAd as z}from"./adlar.js";export const fmt=(a,s=2,e=0)=>a==null||!Number.isFinite(+a)?"—":(+a).toLocaleString("tr-TR",{minimumFractionDigits:e,maximumFractionDigits:s}),esc=a=>String(a).replace(/[&<>"']/g,s=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[s]);const d=a=>`<svg class="i" aria-hidden="true"><use href="#i-${a}"/></svg>`;export const adi=a=>esc(T(a));const Sa=a=>{const s=z(a);return s?`<span>${esc(s)}</span>`:""},P=(a,...s)=>[z(a),...s].filter(Boolean).map(esc).join(" · ");export const cizimsiz=a=>!!(a.ozel||a.bilinmeyen),setLabel=a=>a.type==="time"?`${fmt(a.seconds)} sn`:a.type==="cardio"?`${fmt(a.minutes)} dk`:a.weight==null?`${fmt(a.reps)} tekrar`:`${fmt(a.weight)} × ${fmt(a.reps)}`;const x=(a,s)=>a.type==="time"?`${fmt(a.seconds)} sn`:a.type==="cardio"?`${fmt(a.minutes)} dk`:a.weight==null?`${fmt(a.reps)} tekrar`:`${fmt(a.weight)} ${s}`;export function lastTime(a,s,e,i=!1){const t=s[a.id];if(!t)return i?"Bu hareketi ilk kez yapıyorsun.":"Bu hareketin ilk kaydı.";const n=t.sets.map(setLabel),l=n.every(u=>u===n[0])?`<b>${n[0]}</b> · ${n.length} set`:`<b>${n.join(" · ")}</b>`,o=t.sets.at(-1)?.rir;return`Geçen sefer · ${h.relativeLabel(new Date(t.at))} · ${l}${o!=null?` · son set RIR ${o}`:""}`}export function hazirlikGoster(a){const{session:s,settings:e}=a;return a.hazirlik?!0:e.hazirlikSor!==!1&&e.hazirlikGunu?.d!==w()&&!c.hasAnySet(s)&&!s.warmupDone&&!s.hazirlik}function Ta(a){const s=a.session.hazirlik?.azalan;if(s?.length&&!a.hazirlik)return`<div class="not hafif-not">${d("nabiz")}<span>Bugün ${s.length} harekette birer set az
      (toparlanma kontrolü). <button class="bag" data-act="hz-geri">Programdaki gibi yap</button></span></div>`;if(!hazirlikGoster(a))return"";const e=a.hazirlik?.cevap??{},i=N.degerlendir(e),t=N.SORULAR.map(r=>`<div class="hz-soru"><p>${esc(r.soru)}</p>
      <div class="segment" role="group" aria-label="${esc(r.soru)}">${r.secenekler.map(([l,o])=>`<button data-hz="${r.id}:${l}" aria-pressed="${e[r.id]===l}">${o}</button>`).join("")}</div></div>`).join(""),n=i?`<div class="hz-sonuc ${i.duzey}" role="status"><b>${i.baslik}</b><p>${i.metin}</p>
      ${i.duzey==="hafif"?`<div class="cift dikey"><button class="btn p" data-act="hz-hafif">Hareketlerde birer set az yap</button>
             <button class="btn s" data-act="hz-tamam">Programdaki gibi devam et</button></div>`:`<button class="btn ${i.duzey==="uy"?"p":"s"}" data-act="hz-tamam">Tamam</button>`}</div>`:"";return`<div class="grup hazirlik"><h2 class="etiket">Bugün nasılsın?</h2><div class="ic">
      ${t}${n}
      ${i?"":'<button class="bag hz-gec" data-act="hz-gec">Bugün sorma</button>'}
      <p class="kucuk-yazi">${esc(N.KART_NOTU)}</p>
    </div></div>`}const Ma=a=>a?`
  <div class="grup carry"><div class="ic">
    <p class="baslik-satir">${c.gunEtiketiSeans(a.session).kisa} yarım kaldı</p>
    <p class="alt-satir">${h.relativeLabel(new Date(a.session.finishedAt??a.session.startedAt))}
      · ${a.yapilan}/${a.toplam} hareket</p>
    <p>${a.kalan.map(adi).join(" · ")}</p>
    <div class="cift dikey">
      <button class="btn s" data-act="carry-skip">Sıradakine geç</button>
      <button class="btn p" data-act="carry-go">Bu güne devam et</button>
    </div>
  </div></div>`:"",Ia=a=>{const{session:s,dayIndex:e,onerilen:i,gunSecici:t}=a;if(!t)return"";const n=c.canSwitchDay(s),r=c.gunEtiketi(e).kisa;return n.ok?`<div class="grup picker"><h2 class="etiket">Bugün ne yapıyorsun?</h2><div class="ic">
    <div class="picks">${c.allDays().map(o=>{const{kisa:u,kaslar:p}=c.gunEtiketi(o.dayIndex);return`<button class="pick" data-gun-sec="${o.dayIndex}" aria-pressed="${o.dayIndex===e}">
      <span class="pick-ad">${u}</span><span class="pick-kas">${esc(p)}</span>
      ${o.dayIndex===i?'<span class="pick-not">program önerisi</span>':""}
    </button>`}).join("")}</div>
    <p>${r}'ü telefonsuz yaptıysan işaretle: kayda geçer, sıra sonraki güne atlar.
      Ağırlıklar bilinmediği için hacme ve "geçen sefer"e karışmaz.</p>
    <button class="btn s" data-act="gun-yapildi">${r}'ü yapıldı işaretle</button>
  </div></div>`:`<div class="grup picker"><div class="ic">
    <p>Bugün set girdin; günü değiştirmek bu setleri yanlış güne bağlardı. Önce <b>Seansı bitir</b>
      ya da Ayarlar'dan <b>Bugünü sıfırla</b>.</p></div></div>`};function Aa(a,s,e,i){const t=s.sets.filter(r=>!r.warmup).at(-1);if(t)return`<b>${x(t,i.unit)}</b>${s.calisma}/${s.hedef}`;const n=e?.sets?.at(-1);return n?`<b>${x(n,i.unit)}</b>geçen`:`<b>${c.repsLabel(a,i)}</b>hedef`}const Ha=a=>a.tamam?`<span class="durum tamam">${d("tik")}</span>`:a.calisma>0?`<span class="durum kismi" style="--p:${Math.round(a.calisma/a.hedef*100)}"></span>`:'<span class="durum bos"></span>';function Ea(a,s,e){if(s.tur==="isinma")return`<button class="btn p" data-act="warmup">Isınmaya başla${d("ileri")}</button>`;if(s.tur==="bitir")return'<button class="btn p" data-act="finish">Seansı bitir</button>';if(s.tur==="soguma")return`<div class="cift"><button class="btn s" data-act="finish" aria-label="Seansı bitir">Bitir</button>
    <button class="btn p" data-act="cooldown">Soğumaya başla${d("ileri")}</button></div>`;const i=c.hasAnySet(a.session),t=e[s.idx],n=s.basladi?"Devam et":i?"Sıradaki":"Başla",r=`<button class="btn p iki" data-go="${s.idx}" aria-label="${n}: ${adi(t)}">
      <span><small>${n}</small><b>${adi(t)}</b></span></button>`;return i?`<div class="cift"><button class="btn s" data-act="finish" aria-label="Seansı bitir">Bitir</button>${r}</div>`:r}export function listHTML(a){const{session:s,dayIndex:e,settings:i,status:t,yarim:n,oncekiYapilan:r,gunSecici:l,lastPerf:o={}}=a,u=c.exercisesFor(e),p=c.progress(s,e,i),$=c.summaryVolume(s),g=Math.max(0,Math.round((Date.now()-s.startedAt)/6e4)),{kisa:k,kaslar:b}=c.gunEtiketi(e),v=c.siradakiEylem(s,e,i),m=v.tur==="hareket"?v.idx:-1,I=u.map((H,V)=>{const L=c.exerciseProgress(s,H,i),Z=r?.has(H.id),X=[L.tamam&&"bitti",V===m&&"simdi",Z&&!L.calisma&&"onceki"].filter(Boolean).join(" ");return`<button class="satir${X?" "+X:""}" data-go="${V}">
      ${Ha(L)}
      <span class="ad"><b>${adi(H)}</b>${Z&&!L.calisma?"<span>geçen sefer yapıldı</span>":Sa(H)}</span>
      <span class="sag">${Aa(H,L,o[H.id],i)}</span>
    </button>`}).join(""),D=`<button class="satir${s.warmupDone?" bitti":""}" data-act="warmup">
    <span class="durum ${s.warmupDone?"tamam":"ikon"}">${d(s.warmupDone?"tik":"alev")}</span>
    <span class="ad"><b>Isınma</b><span>${c.warmupFor(e).length+1} adım · ${c.isinmaSuresi(e)}</span></span>
    <span class="sag">${s.warmupDone?"yapıldı":"başla"}</span>
  </button>`,A=c.finisherFor(e),[R,ma]=A?A.h.split(" — "):[],$a=A?`<div class="satir">
    <span class="durum ikon">${d("nabiz")}</span>
    <span class="ad"><b>${R}</b><span>${A.p}</span></span>
    <span class="sag"><b>${ma??""}</b>bitişte</span>
  </div>`:"";return`
    <div class="ust liste-ust">
      <span class="tarih">${t.label}</span>
      <span class="tarih">${esc(c.aktifProgram().ad)}</span>
    </div>
    <button class="cip gun-cip" data-act="gun-ac" aria-expanded="${!!l}" aria-label="Günü değiştir: ${k}">
      ${k}${d(l?"yukari":"asagi")}</button>
    <div class="gun-baslik"><h1>${esc(b)}</h1></div>
    ${a.eskiAdres?tasimaBantHTML():kurulumBantHTML(a)}
    ${Ta(a)}
    ${t.isTrainingDay?"":`<div class="not">${d("takvim")}<span>Program günü değil; yine de kaydedebilirsin.
      Sıradaki antrenman <b>${t.next?h.fmtShort(t.next):"—"}</b>.</span></div>`}
    ${Ia(a)}
    <div class="ozet">
      <div><b>${p.done}<small>/${p.total}</small></b><span>Set</span></div>
      <div><b>${fmt($.kg,0)}<small>${i.unit}</small></b><span>Hacim</span></div>
      <div><b>${g}<small>dk</small></b><span>Süre</span></div>
    </div>
    ${Ma(n)}
    ${u.length?`<div class="liste">${D}${I}${$a}${xa(s,c.cooldownFor(e,i?.profil))}</div>
    <div class="alt alt-sekmeli">${Ea(a,v,u)}</div>`:`<div class="grup"><div class="ic"><p>Bu günde henüz hareket yok.</p>
        <button class="btn s" data-program-ac="${esc(c.aktifProgram().id)}">Programı düzenle</button></div></div>`}
    ${sekmelerHTML("bugun")}`}function La(a,s,e=""){if(cizimsiz(a))return`<div class="fig"><div class="sahne3d cizimsiz" role="img" aria-label="${adi(a)}: çizim yok">
      ${d("figur")}<span>${a.ozel?"Özel hareket · çizimi yok":"Bu hareketin tanımı bulunamadı"}</span></div></div>`;if(a.hold){const i=Math.max(0,a.variants.findIndex(t=>t.ok));return s.calisma>=1?`<div class="fig">
        <div class="sahne3d" data-varyant="${i}" role="img" aria-label="${adi(a)}: doğru duruş"></div>
        <p class="fig-not">${d("tik")}${a.variants[i].note} · hatalar ? panelinde</p>${e}
      </div>`:`<div class="variants">${a.variants.map((t,n)=>`<figure class="${t.ok?"ok":""}">
        <div class="sahne3d" data-varyant="${n}" aria-hidden="true"></div>
        <figcaption><b>${d(t.ok?"tik":"carpi")}${esc(t.label)}</b><span>${esc(t.note)}</span></figcaption>
      </figure>`).join("")}</div>`}return`<div class="fig${a.setType==="weight_reps"?" zemin":""}">
    <div class="sahne3d" id="fig3d" role="img" aria-label="${adi(a)} hareket çizimi; sürükleyerek döndürülür"></div>
    <button class="kure-top" id="kure-top" aria-pressed="true" aria-label="Görüntüyü döndür: sürükle · dokun: kendi ekseninde dönmeyi durdur ya da başlat"></button>${e}
  </div>`}const Ba={agir:"en ağır set",bir:"tahmini 1RM",hacim:"set hacmi",tekrar:"en çok tekrar",sure:"en uzun süre"};function ja(a,s){const e=a.rozet;if(!e||e.exId!==s.id||Date.now()>e.bitis)return"";const i=e.tur==="tekrar"?fmt(e.simdi):rekorDeger(e.tur,e.simdi,a.settings.unit);return`<div class="rekor-rozet" role="status">${d("yildiz")}<span>Yeni rekor · <em>${Ba[e.tur]} ${i}</em></span></div>`}function Da(a,s){const e=a.rirSor;if(!e||e.exId!==s.id||Date.now()>e.bitis)return"";const i=c.effective(s,a.settings).rir;return`<div class="rir-sor" role="group" aria-label="Bu sette kaç tekrar daha yapabilirdin?">
      <span>Kaç tekrar daha yapabilirdin?</span>
      <div class="rir-cipler">${sa.map(t=>`<button class="cip${t===i?" hedef":""}" data-rir="${t}" aria-label="RIR ${t}${t===4?" ya da daha çok":""}${t===i?" (hedef)":""}">${t===4?"4+":t}</button>`).join("")}
        <button class="rir-kapat" data-rir="x" aria-label="Sorma, kapat">${d("carpi")}</button></div>
    </div>`}function Ra(a,s){const e=s.session?.entries.find(t=>t.exerciseId===a.id)?.note??"",i=s.lastPerf?.[a.id]?.not;return`<div class="not-alani">
      <label class="etiket" for="ex-not">Notun</label>
      <textarea id="ex-not" data-not="${esc(a.id)}" maxlength="${c.NOT_SINIR}" rows="2"
        placeholder="${i?esc(i):"Ör. koltuk 4. delik · sol omuz biraz gergin"}">${esc(e)}</textarea>
      ${i?'<p class="kucuk-yazi">Gri yazı son notun; bugüne kaydedilmez. Bugün için yeni not yazabilirsin.</p>':""}
    </div>`}function wa(a,s){const e=c.effective(a,s.settings);return`<section class="sheet" id="sheet" aria-hidden="true" inert aria-label="Hedef ve anlatım">
      <button class="grab" data-act="sheet-close" aria-label="Kapat"></button>
      <div class="sheet-in">
        <h2>${adi(a)}</h2>
        ${z(a)?`<p class="alt-baslik">${esc(z(a))}</p>`:""}
        ${Ra(a,s)}
        ${Xa(a,s)}
        ${oneriHTML(a,s)}
        <div class="goal">
          <div class="goal-hd">
            <span class="etiket">Hedef · ${esc(c.aktifProgram().ad)}</span>
            ${e.edited?'<button class="cip" data-act="goal-reset">Programa dön</button>':""}
          </div>
          ${Za(a,s)}
          <button class="btn p" data-act="goal-save">Hedefi kaydet</button>
          <p class="goal-note">Hedef <b>${esc(c.aktifProgram().ad)}</b> içindeki bu hareketin hedefidir; kaydedince program
            da değişir. Ağırlık boş kalırsa kutu geçen seferki değerle dolar.</p>
        </div>
        <h3>Çalışan kaslar</h3>
        <p class="mus">${esc(a.mus||a.grup||"—")}</p>
        ${a.steps?.length?`<h3>Nasıl yapılır</h3>
        <ol class="steps">${a.steps.map(i=>`<li>${esc(i)}</li>`).join("")}</ol>`:""}
        ${a.hold?`<h3>Doğru duruş ve yaygın hatalar</h3>
          <ul class="hatalar">${a.variants.map(i=>`<li><b>${esc(i.label)}</b><span>${esc(i.note)}</span></li>`).join("")}</ul>`:""}
        ${a.tip?`<h3 class="tip-bas">${d("uyari")}Dikkat</h3>
        <p>${esc(a.tip)}</p>`:""}
        ${ilkAgirlikNotu(a)?`<p class="kucuk-yazi">${ilkAgirlikNotu(a)}</p>`:""}
        <p class="kucuk-yazi">${GUVENLIK_NOTU}</p>
      </div>
    </section>`}const Ka=a=>{const s=c.exercisesFor(a.dayIndex)[a.idx];return s?c.dinlenmeSuresi(s,a.settings):a.settings.restSeconds};export function gezinmeHTML(a,s=null,e=0){if(s===null){const i=c.exercisesFor(a.dayIndex).length-1;return`<div class="gezinme" id="gezinme">
      <button data-act="prev" ${a.idx===0?"disabled":""} aria-label="Önceki hareket">${d("geri")}Önceki</button>
      <button class="dinlenme" data-act="rest">${d("saat")}Dinlenme ${Ka(a)} sn</button>
      <button data-act="next" ${a.idx===i?"disabled":""} aria-label="Sonraki hareket">Sonraki${d("ileri")}</button>
    </div>`}return`<div class="gezinme run" id="gezinme">
    <button data-act="rest-plus" aria-label="Dinlenmeye 30 saniye ekle">+30</button>
    <div class="dinlenme" role="timer" aria-label="Kalan dinlenme">
      <b id="rest-time">${K(s)}</b>
      <span class="bar"><i id="rest-bar" style="transform:scaleX(${e?(s/e).toFixed(3):0})"></i></span>
    </div>
    <button data-act="rest-skip">Geç</button>
  </div>`}const Ga={dumbbell:"tek dambıl",kettlebell:"kettlebell",barbell:"bar dahil",machine:"makinede seçili"};export const BAR_KG=20;const Na=[25,20,15,10,5,2.5,1.25];export function plakaYazi(a,s,e){if(a.equipment==="bodyweight")return+s>0?"ek ağırlık":"ek ağırlık · 0 = yalnız vücut";if(a.equipment!=="barbell")return Ga[a.equipment]??"";const i=+s;if(e!=="kg"||s==null||s===""||!Number.isFinite(i))return"bar dahil";if(i<BAR_KG)return`boş bar ${BAR_KG} kg`;let t=(i-BAR_KG)/2;const n=[];for(const r of Na)for(;t>=r-1e-9;)n.push(r),t-=r;return t>1e-9?"bar dahil":n.length?`her yana ${n.map(r=>fmt(r)).join(" + ")}`:"yalnız bar"}export const tekrarAlt=(a,s)=>{const e=c.effective(a,s.settings);return`Hedef <b>${e.repsMin?`${e.repsMin}-`:""}${fmt(e.reps)}</b>`};const Pa=a=>`Hedef <b>${a}</b>`;export function kaydetEtiketi(a,s,e){return a.setType==="time"?"Süreyi kaydet":e.draft.warmup?"Isınma setini kaydet":"Seti kaydet"}export function setEtiketi(a,s){if(a.tamam)return"Bütün setler tamam";if(s.draft.warmup)return"<b>Isınma</b> seti · sete sayılmaz";const e=a.sets.filter(i=>i.warmup).length;return`<b>${a.calisma+1}.</b> set · ${a.hedef} setten${e?` · ısınma ×${e}`:""}`}function _a(a,s,e){const i=Math.max(a.hedef,a.calisma),t=s.rekorTaban?.[e?.id],n=a.sets.filter(o=>!o.warmup),r=o=>!!t&&!!B.setRekoru(n[o],[...t,...n.slice(0,o)]),l=Array.from({length:i},(o,u)=>u<a.calisma?r(u)?`<i class="bitti rekor">${d("yildiz")}</i>`:`<i class="bitti">${d("tik")}</i>`:`<i class="${u===a.calisma?"simdi":""}">${u+1}</i>`).join("");return`<div class="set-ilerleme"><span id="set-etiket">${setEtiketi(a,s)}</span><span class="cubuk" aria-hidden="true">${l}</span></div>`}const _=({ad:a,anahtar:s,aktif:e,deger:i,alt:t,artir:n,azalt:r,etiket:l,sinif:o="",azaltPasif:u=!1})=>`
  <div class="sutun ${o}${e?" aktif":""}" data-sutun="${s}">
    <button class="ok" ${n} aria-label="${l} artır"${e?"":" disabled"}>${d("yukari")}</button>
    <span class="etk">${a}</span>
    <div class="deger-dugme" role="button" tabindex="0" data-sutun-ac="${s}" aria-pressed="${!!e}" aria-label="${l} değiştir: ${e?"okları kapat":"okları aç"}">${i}</div>
    <span class="s-alt">${t}</span>
    <button class="ok" ${r} aria-label="${l} azalt"${!e||u?" disabled":""}>${d("asagi")}</button>
  </div>`;function Ya(a,s,e){const{settings:i}=e,t=c.effective(a,i),n=M.agirlikAdimi(a,i)??M.GIRIS_ADIMI_YEDEK,r=e.draft.weight,l=i.unit,o=r==null?"":String(r),u=e.draft.aktif;return`<div class="sutunlar">
    ${_({ad:"SET",anahtar:"set",aktif:u==="set",etiket:"Bugünkü set sayısını",deger:`<b class="n">${s.hedef}</b>`,alt:Pa(t.sets),artir:'data-act="set-arti"',azalt:'data-act="set-eksi"',azaltPasif:s.hedef<=s.calisma+1})}
    ${_({ad:"TEKRAR",anahtar:"reps",aktif:u==="reps",etiket:"Tekrarı",deger:`<input class="n" type="number" readonly tabindex="-1" step="1" min="1" id="f-reps" value="${e.draft.reps??t.reps??""}" aria-label="Bu setin tekrarı">`,alt:`<span id="tk-alt">${tekrarAlt(a,e)}</span>`,artir:'data-step="reps:1"',azalt:'data-step="reps:-1"'})}
    ${_({ad:"AĞIRLIK",anahtar:"weight",aktif:u==="weight",etiket:"Ağırlığı",sinif:"genis",deger:`<span class="n-kap"><input class="n${o.length>=5?" uzun":""}" type="number" readonly tabindex="-1" step="${n}" min="0"
               id="f-weight" value="${o}" placeholder="0" aria-label="Ağırlık (${l})"><small>${l}</small></span>`,alt:`<span id="plaka-yazi">${plakaYazi(a,r,l)}</span>`,artir:`data-step="weight:${n}"`,azalt:`data-step="weight:${-n}"`})}
  </div>`}const aa=(a,s)=>`<p class="gecen">${d("gecmis")}<span>${lastTime(a,s.lastPerf,s.settings.unit,c.exerciseProgress(s.session,a,s.settings).sets.length>0)}</span></p>`,Fa=22;function Oa(a,s,e){const i=c.effective(a,e.settings),t=a.setType==="time"?`${s.hedef} × ${fmt(i.seconds)} sn`:a.setType==="cardio"?`${fmt(i.minutes)} dk`:`${s.hedef} × ${i.repsMin?`${i.repsMin}-`:""}${fmt(i.reps)}${i.rir!=null?` · RIR ${i.rir}`:""}`,n=e.lastPerf[a.id]?.sets?.filter(l=>!l.warmup)??[],r=n.length?n.reduce((l,o)=>(o.weight??o.seconds??o.minutes??0)>(l.weight??l.seconds??l.minutes??0)?o:l):null;return`Hedef ${t}${r?` · geçen ${setLabel(r)}`:""}`}const Ua=(a,s,e,i,t,n="")=>`
  <div class="giris">
    <div class="deger">
      <span class="etiket">${i}</span>
      <div><input type="number" readonly tabindex="-1" step="${e}" min="0"
             id="f-${a}" value="${s??""}" placeholder="0" aria-label="${i} (${t})"><em>${t}</em></div>
      ${n}
    </div>
    <div class="stp">
      <button data-step="${a}:${e}" aria-label="${fmt(e)} ${t} artır">+${fmt(e)}</button>
      <button data-step="${a}:${-e}" aria-label="${fmt(e)} ${t} azalt">−${fmt(e)}</button>
    </div>
  </div>`;function Ca(a,s,e){const i=c.effective(a,e.settings);if(a.setType==="time"){const t=e.draft.seconds??i.seconds;return`<div class="clock" id="clock">
      <span class="etiket">Hedef süre</span>
      <div class="crow">
        <button class="cadj" data-act="clock-minus" aria-label="5 saniye azalt">−5</button>
        <span class="time" id="clock-time" role="timer">${K(t)}</span>
        <button class="cadj" data-act="clock-plus" aria-label="5 saniye ekle">+5</button>
      </div>
    </div>`}return a.setType==="cardio"?Ua("minutes",e.draft.minutes??i.minutes,5,"Süre","dk",aa(a,e)):Ya(a,s,e)}export const SEMALAR=[[3,8],[3,10],[3,12],[4,8],[4,6],[5,5]];const qa=[15,20,30,45,60,90];export const noktalarHTML=(a,s,e="")=>`<div class="noktalar-set" role="radiogroup" aria-label="Set sayısı">${Array.from({length:10},(i,t)=>`<button role="radio" aria-checked="${t+1===s}" class="${t<s?"on":""}" data-${a}="${e}${t+1}" aria-label="${t+1} set"><i></i></button>`).join("")}</div>`,tekrarSeridiHTML=(a,s,e="")=>`<div class="serit-t" role="radiogroup" aria-label="Tekrar">${Array.from({length:Math.max(30,s??0)},(i,t)=>t+1).map(i=>`<button role="radio" aria-checked="${i===s}" data-${a}="${e}${i}">${i}</button>`).join("")}</div>`,semalarHTML=(a,s,e,i="")=>`<div class="semalar" role="group" aria-label="Hazır şema">${SEMALAR.map(([t,n])=>`<button class="cip" aria-pressed="${t===s&&n===e}" data-${a}="${i}${t}:${n}">${t} × ${n}</button>`).join("")}</div>`;const sa=[0,1,2,3,4],Va=[60,90,120,180,240];export function yontemHTML(a,s,e="",i=60,{tekrarli:t=!0}={}){const n=(o,u,p,$,g=p)=>`<button class="cip" aria-pressed="${$}" data-${a}="${e}${o}:${u}" aria-label="${esc(g)}">${p}</button>`,r=(o,u,p)=>`<div class="g-alan"><div class="g-etk"><span>${o}</span><b>${u}</b></div>
      <div class="semalar" role="group" aria-label="${o}">${p}</div></div>`;let l="";if(t&&s.reps>1){const o=[...new Set([s.reps-4,s.reps-3,s.reps-2,...s.repsMin?[s.repsMin]:[]])].filter(u=>u>=1&&u<s.reps).sort((u,p)=>u-p);l+=r("Tekrar aralığı",s.repsMin?`${s.repsMin}-${s.reps}`:"tek sayı",n("repsMin","x","Tek sayı",!s.repsMin)+o.map(u=>n("repsMin",u,`${u}-${s.reps}`,s.repsMin===u,`${u} ile ${s.reps} arası`)).join("")),l+=r("Hedef RIR",s.rir!=null?`${s.rir}`:"yok",n("rir","x","Yok",s.rir==null,"Hedef RIR yok")+sa.map(u=>n("rir",u,u===4?"4+":`${u}`,s.rir===u,`RIR ${u}`)).join(""))+'<p class="g-not">RIR: setin sonunda kaç temiz tekrar daha yapabilirdin. 2 = iki tekrar daha çıkardı.</p>'}return l+=r("Dinlenme",`${s.dinlenme??i} sn`,n("dinlenme","x",`Genel (${i} sn)`,s.dinlenme==null,"Genel ayar")+Va.map(o=>n("dinlenme",o,`${o} sn`,s.dinlenme===o)).join("")),l}function Za(a,s){const{settings:e}=s,i=c.effective(a,e),t=M.agirlikAdimi(a,e)??M.GIRIS_ADIMI_YEDEK,n=(o,u,p,$)=>`<div class="gf">
      <span class="etiket">${$}</span>
      <div class="gbox">
        <button data-gstep="${o}:${-p}" aria-label="${$} azalt">${d("eksi")}</button>
        <input type="number" inputmode="decimal" step="${p}" min="0" id="g-${o}" value="${u??""}" placeholder="—" aria-label="${$}">
        <button data-gstep="${o}:${p}" aria-label="${$} artır">${d("arti")}</button>
      </div>
    </div>`,r=`<div class="g-alan"><div class="g-etk"><span>Set sayısı</span><b id="g-sets-yaz">${i.sets}</b></div>
      ${noktalarHTML("gset",i.sets)}<input type="hidden" id="g-sets" value="${i.sets}"></div>`,l=(o={})=>`<div id="g-yontem">${yontemHTML("g-yontem",i,"",e.restSeconds,o)}</div>`;return a.setType==="time"?`${r}
    <div class="g-alan"><div class="g-etk"><span>Süre</span><b id="g-seconds-yaz">${fmt(i.seconds)} sn</b></div>
      <div class="semalar" role="group" aria-label="Süre">${[...new Set([...qa,i.seconds])].sort((o,u)=>o-u).map(o=>`<button class="cip" aria-pressed="${o===i.seconds}" data-gsn="${o}">${o} sn</button>`).join("")}</div>
      <input type="hidden" id="g-seconds" value="${i.seconds}"></div>${l({tekrarli:!1})}`:a.setType==="cardio"?`${r}<div class="goal-grid">${n("minutes",i.minutes,5,"Süre (dk)")}</div>`:`<div class="g-alan"><div class="g-etk"><span>Hazır şema</span></div>${semalarHTML("gsema",i.sets,i.reps)}</div>
    ${r}
    <div class="g-alan"><div class="g-etk"><span>Tekrar</span><b id="g-reps-yaz">${i.reps}</b></div>
      ${tekrarSeridiHTML("greps",i.reps)}<input type="hidden" id="g-reps" value="${i.reps}"></div>
    ${l()}
    <div class="goal-grid">${n("weight",i.weight,t,`Planlanan ağırlık (${e.unit})`)}</div>`}function Xa(a,s){return a.setType==="cardio"?"":`<div class="set-satir">
      <span class="etiket"><span id="warm-ad">Isınma seti</span><small id="warm-not">Bu set hacme ve "geçen sefer"e karışmaz</small></span>
      <button class="cip" id="warm" data-act="warm" role="switch" aria-checked="${!!s.draft.warmup}"
              aria-labelledby="warm-ad" aria-describedby="warm-not">${s.draft.warmup?"Açık":"Kapalı"}</button>
    </div>`}export function warmupHTML(a){const{dayIndex:s}=a,e=c.warmupFor(s),{kaslar:i}=c.gunEtiketi(s),t=e.map(n=>`<div class="satir yalin" data-warm="${n.id}">
      <span class="ad"><b>${adi(n)}</b><span>${P(n,n.not)}</span></span>
      <span class="sag"><b>${esc(n.miktar)}</b></span>
      <div class="mini sahne3d" data-anim="${n.id}" aria-hidden="true"></div>
    </div>`).join("");return`
    <div class="ust"><button class="ib" data-act="to-list" aria-label="Listeye dön">${d("geri")}</button><span class="ib-yer"></span></div>
    <div class="sayfa-baslik"><h1>Isınma</h1><p>${esc(i)} · ${c.isinmaSuresi(s)} · sete sayılmaz</p></div>
    <div class="liste dagit">
      <div class="satir">
        <span class="durum ikon">${d("nabiz")}</span>
        <span class="ad"><b>${c.KARDIYO.ad}</b><span>${c.KARDIYO.not}</span></span>
        <span class="sag"><b>${c.KARDIYO.miktar}</b></span>
      </div>
      ${t}
    </div>
    <div class="alt"><button class="btn p" data-act="warmup-done">Isınma tamam, 1. harekete geç${d("ileri")}</button></div>`}const ea=a=>a.dinamik?`${a.tekrar} tekrar`:a.tek?`${a.sn} + ${a.sn} sn`:`${a.sn} sn`;export const esDakika=a=>`~${Math.max(1,Math.round(a/60))} dk`;const Y={ayakta:"ayakta",minder:"minderde",duvar:"duvarda"},Ja={poz:"Pozu al",tut:"Tut",taraf:"Taraf değiştir",son:"Bırak"},Wa=(a,s)=>s==="tut"&&a.dinamik?`Yavaşça tekrarla · ${a.tekrar} kez`:Ja[s];function Qa(a){const s=c.tumVucut(a.settings?.profil);return`<div class="rutin-kart"><b>Tüm vücut esneme</b><span>${s.length} esneme · ${esDakika(c.sogumaSuresi(s))} · dinlenme günü ya da antrenman sonrası</span>
    <button class="btn p" data-act="rutin-basla">Başla</button></div>`}function xa(a,s){if(!s.length)return"";const e=!!a.cooldownDone;return`<button class="satir${e?" bitti":""}" data-act="cooldown">
    <span class="durum ${e?"tamam":"ikon"}">${d(e?"tik":"figur")}</span>
    <span class="ad"><b>Soğuma</b><span>${s.length} esneme · ${esDakika(c.sogumaSuresi(s))}</span></span>
    <span class="sag">${e?"yapıldı":"başla"}</span>
  </button>`}export function sogumaHTML(a){if(a.esneme)return as(a);const s=c.cooldownFor(a.dayIndex,a.settings?.profil),{kaslar:e}=c.gunEtiketi(a.dayIndex),i=!!a.session?.cooldownDone,t=s.map(n=>`<div class="satir yalin">
      <span class="ad"><b>${adi(n)}</b><span>${P(n,n.kas,Y[n.yer])}</span></span>
      <span class="sag"><b>${ea(n)}</b></span>
      <div class="mini sahne3d" data-anim="${n.id}" aria-hidden="true"></div>
    </div>`).join("");return`
    <div class="ust"><button class="ib" data-act="to-list" aria-label="Listeye dön">${d("geri")}</button><span class="ib-yer"></span></div>
    <div class="sayfa-baslik"><h1>Soğuma</h1><p>${c.gunSogumasi(a.dayIndex)==="tum"?"Tüm vücut":esc(e)} · ${esDakika(c.sogumaSuresi(s))} · sete sayılmaz</p></div>
    ${s.length?`<div class="liste dagit">${t}</div>
    <p class="kucuk-yazi grup-alti">Önce ayakta, sonra yerde yapılır. Gerginlik hissedince dur; ağrıya kadar zorlama, yaylanma, nefesini tutma.</p>
    <div class="alt"><button class="btn p" data-act="esneme-basla">${i?"Yeniden başla":"Başla"}${d("ileri")}</button></div>`:`<div class="grup"><div class="ic"><p>${c.gunSogumasi(a.dayIndex)==="kapali"?"Bu günde soğuma kapalı; program düzenleyicide günün ayarından açabilirsin.":"Bu günde hareket yok; soğuma günün kaslarından kurulur."}</p></div></div>`}`}function as(a){const s=a.esneme,e=s.liste.length,i=s.kaynak==="rutin",t=i?"Tüm vücut esneme":"Soğuma",n=s.liste.map(($,g)=>`<i class="${g<s.i||s.bitti?"bitti":g===s.i?"simdi":""}"></i>`).join(""),r=i?"to-hareketler":"to-list",l=i?"Hareketlere dön":"Listeye dön";if(s.bitti)return`
    <div class="ust"><button class="ib" data-act="${r}" aria-label="${l}">${d("geri")}</button><span class="tarih">${t}</span><span class="ib-yer"></span></div>
    <div class="es-serit" aria-hidden="true">${n}</div>
    <div class="sayfa-baslik ust-bosluk"><h1>${t} tamam</h1><p>${e} esneme · ${esDakika(c.sogumaSuresi(s.liste))}.${i?"":" Bugünkü listede “yapıldı” olarak görünür."}</p></div>
    <div class="alt"><div class="cift"><button class="btn s" data-act="${i?"rutin-basla":"esneme-basla"}">Baştan</button><button class="btn p" data-act="${r}">${l}</button></div></div>`;const o=s.liste[s.i],u=s.liste[s.i+1],p=o.tek?`<span class="es-taraf">${s.faz==="taraf"?"Sol tarafa geç":s.taraf==="sol"?"Sol taraf":"Sağ taraf"}</span>`:"";return`
    <div class="ust"><button class="ib" data-act="esneme-kapat" aria-label="Oynatıcıyı kapat">${d("carpi")}</button>
      <span class="tarih">${t} · ${s.i+1}/${e}</span><span class="ib-yer"></span></div>
    <div class="es-serit" aria-hidden="true">${n}</div>
    <div class="es-ad"><h1>${adi(o)}</h1><p>${P(o,o.kas)} · ${ea(o)}</p>${p}</div>
    <div class="fig"><div class="sahne3d" id="es3d" role="img" aria-label="${adi(o)} esneme çizimi"></div></div>
    <div class="clock${s.kosuyor&&s.faz==="tut"?" run":""}">
      <p class="es-faz" id="es-faz">${Wa(o,s.faz)}</p>
      <div class="crow">
        <button class="cadj" data-act="esneme-geri" aria-label="Önceki esneme"${s.i?"":" disabled"}>${d("geri")}</button>
        <span class="time" id="es-zaman" role="timer" aria-live="off">${K(s.kalan??s.fazSn)}</span>
        <button class="cadj" data-act="esneme-atla" aria-label="Sonraki esneme">${d("ileri")}</button>
      </div>
    </div>
    <p class="es-ipucu">${esc(o.ipucu)}</p>
    <p class="es-sira">${u?`Sıradaki: <b>${adi(u)}</b>`:"Son esneme"}</p>
    <div class="alt"><button class="btn ${s.kosuyor?"s":"p"}" data-act="esneme-oynat">${s.kosuyor?"Duraklat":"Devam et"}</button></div>`}function ss(a,s){const e=a.kas.split("·").map(i=>i.trim()).filter(Boolean);return`
    <div class="ust"><button class="ib" data-act="to-hareketler" aria-label="Hareketlere dön">${d("geri")}</button>
      <span class="tarih">Esneme</span><span class="ib-yer"></span></div>
    <div class="sayfa-baslik"><h1>${adi(a)}</h1>${z(a)?`<p>${esc(z(a))}</p>`:""}</div>
    <div class="buyuk3b"><div class="sahne3d" id="hareket3d" role="img" aria-label="${adi(a)} esneme çizimi; sürükleyerek döndürülür"></div>
      <img class="damga" src="icons/isaret.svg" alt="" width="30" height="17"><span class="ipucu">Sürükle: döndür · dokun: yeniden oynat</span></div>
    <p class="kunye">${[Y[a.yer].replace(/^./,i=>i.toLocaleUpperCase("tr")),a.dinamik?`${a.tekrar} yavaş tekrar (~${a.sure} sn)`:`${a.tek?"her taraf ":""}${s} sn tut`].map(esc).join(" · ")}</p>
    <div class="grup"><h2 class="etiket">Esnettiği kaslar</h2><div class="ic"><div class="kaslar">${e.map((i,t)=>`<span class="kas${t<2?" ana":""}">${esc(i)}</span>`).join("")}</div></div></div>
    <div class="grup"><h2 class="etiket">Faydası</h2><div class="ic"><p>${esc(a.fayda)}</p></div></div>
    <div class="grup"><h2 class="etiket">Nasıl yapılır</h2><div class="ic"><ol class="adimlar">${a.steps.map(i=>`<li>${esc(i)}</li>`).join("")}</ol></div></div>
    <div class="grup"><h2 class="etiket">Dikkat</h2><div class="ipucu-kutu">${esc(a.tip)}</div></div>
    <p class="kucuk-yazi grup-alti">Gerginlik hissedince dur; ağrıya kadar zorlama, yaylanma, nefesini tutma. Programa set olarak eklenmez; soğumada
      günün kaslarına göre kendiliğinden gelir, Hareketler'deki “Tüm vücut esneme” rutininde de var. Statik esneme ısınmanın yerine geçmez: antrenman sonunda, vücut ısınmışken yap.</p>
    ${sekmelerHTML("hareketler")}`}function es(a){return`
    <div class="ust"><button class="ib" data-act="to-hareketler" aria-label="Hareketlere dön">${d("geri")}</button>
      <span class="tarih">Isınma</span><span class="ib-yer"></span></div>
    <div class="sayfa-baslik"><h1>${adi(a)}</h1>${z(a)?`<p>${esc(z(a))}</p>`:""}</div>
    <div class="buyuk3b"><div class="sahne3d" id="hareket3d" role="img" aria-label="${adi(a)} ısınma çizimi; sürükleyerek döndürülür"></div>
      <img class="damga" src="icons/isaret.svg" alt="" width="30" height="17"><span class="ipucu">Sürükle: döndür · dokun: yeniden oynat</span></div>
    <p class="kunye">Isınmada ${esc(a.miktar)}</p>
    <div class="grup"><h2 class="etiket">Nasıl yapılır</h2><div class="ic"><p>${esc(a.not)}</p></div></div>
    <p class="kucuk-yazi grup-alti">Isınma programa set olarak eklenmez ve kayda girmez; seansın başında günün kaslarına göre kendiliğinden gelir.
      Önce 5 dk hafif kardiyo, sonra bu hareketler, en sonda günün ilk ağır hareketinin hafif bir seti.</p>
    ${sekmelerHTML("hareketler")}`}export function oneriHTML(a,s){const e=s.oneri?.[a.id],i=s.session.entries.find(n=>n.exerciseId===a.id)?.sets;if(!M.oneriGecerliMi(e,i))return"";const t=s.settings.unit;return e.tur==="kal"?`<div class="oneri">${d("yildiz")}<span>Geçen sefer son sete RIR 0 ile vardın: <b>${fmt(e.agirlik)} ${t}</b> ile kal,
      tekrarları temiz tamamla</span></div>`:e.tur==="agirlik"?`<div class="oneri">${d("yildiz")}
      <span>İki seanstır ${e.setler} × ${e.tekrar} tamam${e.rir!=null?` (RIR ${e.rir}+)`:""}: <b>${fmt(e.agirlik)} ${t}</b> dene</span>
      ${s.draft.weight===e.agirlik?"":'<button class="cip" data-act="oneri-uygula">Uygula</button>'}
    </div>`:`<div class="oneri">${d("yildiz")}<span>İki seanstır ${fmt(e.agirlik)} ${t} ile hedef tamam. Sonraki
      ağırlık adımı büyük (%${Math.round(e.adimOrani*100)}); önce <b>${e.hedefTekrar} tekrara</b> çık.</span></div>`}function is(a){const s=c.aktifProgram(),e=s?.gunler[a.dayIndex];return e?`<div class="ust-yazi"><b>${esc(s.ad)}</b> · ${esc(e.ad?.trim()||c.gunEtiketi(a.dayIndex).kisa)}</div>`:""}export function focusHTML(a){const{session:s,dayIndex:e,idx:i,settings:t}=a,n=c.exercisesFor(e),r=n[i],l=c.exerciseProgress(s,r,t),o=n.map((p,$)=>`<i class="${c.exerciseProgress(s,p,t).tamam?"f":$===i?"c":""}"></i>`).join(""),u=i===n.length-1;return`
    <div class="ust uclu">
      <button class="ib" data-act="to-list" aria-label="Listeye dön">${d("geri")}</button>
      <div class="orta"><b>${i+1} / ${n.length}</b><span class="seritler" aria-hidden="true">${o}</span></div>
      <span class="sag-grup">
        ${l.sets.length?`<button class="ib" data-act="undo" aria-label="Son seti geri al">${d("geri-al")}</button>`:""}
        <button class="ib" data-act="sheet-open" aria-label="Nasıl yapılır, hedef ve ısınma seti">${d("soru")}</button>
      </span>
    </div>
    <div class="baslik">
      ${is(a)}
      <h1${T(r).length>Fa?' class="uzun"':""}>${adi(r)}</h1>
      <p>${r.grup?`<span class="kas-cip">${esc(r.grup.toLocaleUpperCase("tr"))}</span>`:""}${Oa(r,l,a)}</p>
    </div>
    ${La(r,l,Da(a,r)+ja(a,r))}
    ${r.setType==="cardio"?"":_a(l,a,r)}
    ${l.tamam?"":Ca(r,l,a)}
    ${r.setType==="time"&&!l.tamam?`<div class="gecen-bant">${aa(r,a)}</div>`:""}
    <div class="foot">
      ${l.tamam?`<div class="cift">
             <button class="btn s" data-act="set-arti">${d("arti")}Bir set daha</button>
             ${u?'<button class="btn p" data-act="to-list">Listeye dön</button>':`<button class="btn p" data-act="next">Sonraki hareket${d("ileri")}</button>`}
           </div>`:r.setType==="time"?`<div class="cift">
               <button class="btn s" data-act="save">Kaydet</button>
               <button class="btn p" data-act="clock-start" id="clock-btn">Başlat</button>
             </div>`:`<button class="btn p" data-act="save" id="kaydet-btn">${kaydetEtiketi(r,l,a)}</button>`}
    </div>
    ${gezinmeHTML(a)}
    <div class="sheet-bg" data-act="sheet-close" hidden></div>
    ${wa(r,a)}`}const ts={agir:"en ağır set",bir:"tahmini 1 tekrar maksimumu",hacim:"en iyi set hacmi",tekrar:"en çok tekrar",sure:"en uzun süre"};export const rekorDeger=(a,s,e)=>a==="tekrar"?`${fmt(s)} tekrar`:a==="sure"?`${fmt(s)} sn`:a==="bir"?`${fmt(s,0)} ${e}`:a==="hacim"?`${fmt(s,0)} ${e}`:`${fmt(s)} ${e}`;const ns=(a,s)=>a==="bir"||a==="hacim"?fmt(s,0):fmt(s);function rs(a,s){if(!a)return"";const e=a.oncekiHacim>0?(a.hacim-a.oncekiHacim)/a.oncekiHacim:null,i=e==null?"":` · önceki döneme göre ${Math.abs(e)<5e-4?"aynı":`${e>0?"+":"−"}%${fmt(Math.abs(e*100),0)}`}`;return`<div class="oz-donem">
    <span class="ust-satir">${d("takvim")}DÖNEM TAMAM</span>
    <h2>${a.antrenman} antrenman, ${a.gun} günde</h2>
    <span class="alt-satir">${esc(a.program)}: programın bütün günlerini bitirdin.${a.rekorSayisi?` Bu dönemde ${a.rekorSayisi} rekor kırdın.`:""}</span>
    <div class="iki"><div><b>${fmt(a.hacim,0)} ${s}</b><span>Toplam hacim${i}</span></div>
      <div><b>${a.calismaSet}</b><span>Çalışma seti</span></div></div>
    ${a.hareketler.length?`<div>${a.hareketler.map(t=>`<div class="hareket"><span>${adi(t.ex)}</span><b>${fmt(t.once,0)} → ${fmt(t.simdi,0)} ${s}</b></div>`).join("")}
      <p class="oz-kural">Tahmini 1 tekrar maksimumu, önceki dönem → bu dönem.</p></div>`:""}
  </div>`}const ls={rekor:"yildiz",gelisim:"grafik",istikrar:"takvim",zor:"alev"};function ds(a,s,e){return a.ovgu?{ikon:ls[a.ovgu.tur]??"yildiz",baslik:a.ovgu.baslik,yazi:esc(a.ovgu.kanit)}:a.hacimFarki!=null&&a.hacimFarki>.005?{ikon:"grafik",baslik:`Hacim %${fmt(a.hacimFarki*100,0)} arttı`,yazi:`Geçen ${s}e göre aynı hareketlerde daha çok iş yaptın.`}:a.artislar.length?{ikon:"yukari",baslik:"Geçen seferden ağır",yazi:a.artislar.slice(0,2).map(t=>`${adi(t.ex)} ${fmt(t.once)} → ${fmt(t.simdi)} ${e}`).join(" · ")}:{ikon:"tik",notr:!0,baslik:"Antrenman tamam",yazi:`${[`${a.calismaSet} çalışma seti`,a.sure&&`${a.sure} dk`,a.kg&&`${fmt(a.kg,0)} ${e}`].filter(Boolean).join(" · ")}.`}}function os(a){if(!a)return"";const s=a.serit.length,e=Math.max(0,a.hedef-a.buHafta),i=(e?`Bu hafta ${e} antrenman daha kaldı.`:"Bu haftanın hedefi tamam.")+(s>=3&&a.tutulan?` Son ${s} haftada ${a.tutulan} kez hedefini tuttun.`:"");return`<div class="grup"><h2 class="etiket">Bu hafta</h2><div class="ic">
    <div class="oz-hafta"><b>${a.buHafta} / ${a.hedef} antrenman</b><span class="kucuk-yazi">hedefin haftada ${a.hedef}</span></div>
    <div class="oz-serit" aria-label="Son ${s} hafta">${a.serit.map((t,n)=>`<i class="${t}${n===s-1?" bu":""}"></i>`).join("")}</div>
    <div class="oz-serit-alt">${s>1?`<span>${s-1} hafta önce</span>`:"<span></span>"}<span>bu hafta</span></div>
    <p class="oz-kural">${i}</p></div></div>`}export function summaryHTML(a){const s=a.ozet;if(!s)return"";const e=a.settings.unit,{kisa:i,kaslar:t}=s.gun??c.gunEtiketi(s.dayIndex),n=ds(s,i,e),r=s.rekor?.kirilan??[],l=new Set(r.map(b=>b.exId)),o=s.hacimFarki==null?"":(()=>{const b=Math.abs(s.hacimFarki*100);return b<.05?"aynı":`${s.hacimFarki>0?"+":"−"}%${fmt(b,0)}`})(),u=s.onceki?s.calismaSet===s.onceki.calismaSet?"aynı":`${s.calismaSet>s.onceki.calismaSet?"+":"−"}${Math.abs(s.calismaSet-s.onceki.calismaSet)}`:"",p=!r.length&&!s.gunHacmi&&!s.rekor?.ilkler?.length?"":`<div class="grup"><h2 class="etiket">${r.length||s.gunHacmi?"Rekorlar":"İlk kayıt"}</h2><div class="ic">
    ${r.map(b=>`<div class="oz-kayit">${d("yildiz")}<b>${adi(c.byId[b.exId]??{ad:b.exId})}</b>
      <span class="oz-deger"><s>${ns(b.ana.tur,b.ana.once)} →</s> <em>${rekorDeger(b.ana.tur,b.ana.simdi,e)}</em></span>
      <span class="oz-alt">${B.TUR_AD[b.ana.tur]}${b.turler.length>1?` · ayrıca ${b.turler.slice(1).map(v=>ts[v.tur]).join(", ")}`:""}</span></div>`).join("")}
    ${s.gunHacmi?`<div class="oz-kayit">${d("yildiz")}<b>Günün toplam hacmi</b>
      <span class="oz-deger"><s>${fmt(s.gunHacmi.once,0)} →</s> <em>${fmt(s.gunHacmi.simdi,0)} ${e}</em></span>
      <span class="oz-alt">${esc(i)} için en yüksek</span></div>`:""}
    ${s.rekor?.ilkler?.length?`<p class="oz-kural">İlk kayıt: ${s.rekor.ilkler.map(b=>adi(c.byId[b]??{ad:b})).join(", ")}. Bugünkü değerlerin taban oldu; sonraki seferlerde rekorlar sayılır.</p>`:""}
  </div></div>`,$=s.artislar.filter(b=>!l.has(b.ex.id)),g=$.length?`<div class="grup"><h2 class="etiket">Geçen seferden ağır</h2><div class="ic">${$.map(b=>`<div class="oz-kayit">${d("yukari")}<b>${adi(b.ex)}</b><span class="oz-deger"><s>${fmt(b.once)} →</s> <em>${fmt(b.simdi)} ${e}</em></span>
      <span class="oz-alt">En ağır çalışma seti</span></div>`).join("")}</div></div>`:"",k=s.gelecek?.length?`<div class="grup"><h2 class="etiket">Gelecek sefer</h2><div class="ic">${s.gelecek.map(b=>`<div class="oz-kayit">${b.tur==="artir"?d("yukari"):d("ileri").replace('class="i"','class="i notr"')}<b>${adi(b.ex)}</b><span class="oz-deger">${esc(b.deger)}</span>
      <span class="oz-alt neden">${esc(b.neden)}</span></div>`).join("")}
    <p class="oz-kural">Kural: aynı ağırlıkta iki seans üst üste hedef tekrarların hepsini yaparsan ağırlığı küçük bir adımla artır (ACSM). Öneridir; kutu yine geçen seferle dolar.</p></div></div>`:"";return`
    <div class="ust">
      <button class="cip" data-act="ozet-geri-al" aria-label="Bitirmeyi geri al, seansa dön">${d("geri-al")}Geri al</button>
      <span class="ib-yer"></span>
    </div>
    ${rs(s.donem,e)}
    <div class="oz-haber">
      <span class="rozet${n.notr?" notr":""}">${d(n.ikon)}</span>
      <h1>${n.baslik}</h1><p>${n.yazi}</p>
      <span class="tarih">${esc(i)} · ${esc(t)} · ${h.fmtDate(new Date(s.bitis))}</span>
    </div>
    <button class="btn s kart-ac" data-act="kart-ac">${d("paylas")}${r.length?"Rekoru paylaş":"Kartı paylaş"}</button>
    <div class="oz-uc">
      <div><b>${s.sure??"—"}<small>dk</small></b><span>Süre</span>${s.onceki?.sure?`<em>geçen sefer ${s.onceki.sure}</em>`:""}</div>
      <div><b>${s.calismaSet}<small>set</small></b><span>Set</span>${u?`<em>${u}</em>`:""}</div>
      ${s.kg?`<div><b>${fmt(s.kg,0)}<small>${e}</small></b><span>Hacim</span>${o?`<em class="${s.hacimFarki>5e-4?"art":""}">${o}</em>`:""}</div>`:`<div><b>${fmt(s.seconds??0)}<small>sn</small></b><span>Süre hareketi</span></div>`}
    </div>
    ${s.onceki?`<p class="oz-not">${s.hacimKismi?`Hacim farkı yalnız bugün de yapılan hareketlerde, geçen ${esc(i)}e göre.`:`Farklar geçen ${esc(i)}e göre.`}</p>`:""}
    ${p}${g}${k}${os(s.duzen)}
    ${s.yedekZamani?`<div class="not">${d("uyari")}<span>Veri yalnız bu telefonda. <b>Yedek almanın zamanı.</b></span></div>`:""}
    ${s.sonraki?`<p class="kucuk-yazi">Sıradaki antrenman: <b>${s.sonraki}</b></p>`:""}
    <div class="alt"><div class="cift">
      <button class="btn s" data-act="backup">Yedek al</button>
      <button class="btn p" data-act="ozet-tamam">Tamam</button>
    </div></div>`}export const KART_BILGI=[["sure","Süre"],["set","Set"],["hacim","Toplam ağırlık"],["kaslar","Kaslar"],["tarih","Tarih"],["ad","Adım"]],KART_SECENEK=[["gizle","Ağırlıkları gizle","Kartta hiçbir yerde kg yazmaz"],["karekod","Karekod","fsetapp.com'u açar"]],KART_BAYRAK=[...KART_BILGI,...KART_SECENEK];export function kartHTML(a){const s=a.kart;if(!s)return"";const e=s.secim,i=(a.settings.profil?.ad??"").trim(),t=(u,p,$)=>`<div class="kd-satir"><span class="kd-et">${p}</span>
      <div class="kd-seg" role="group" aria-label="${p}">${$.map(([g,k])=>`<button data-kart-${u}="${g}" aria-pressed="${e[u]===g}">${k}</button>`).join("")}</div></div>`,n=KART_BILGI.filter(([u])=>u!=="ad"||i).map(([u,p])=>`<button class="kd-cip" data-kart-bayrak="${u}" aria-pressed="${!!e[u]}">${d("tik")}${p}</button>`).join(""),r=KART_SECENEK.map(([u,p,$])=>`<button class="kd-satir kd-anahtar" data-kart-bayrak="${u}" role="switch" aria-checked="${!!e[u]}">
      <span class="kd-et">${p}<small>${$}</small></span><span class="kd-ray" aria-hidden="true"><i></i></span></button>`).join(""),l=e.gorsel!=="avatar",o=[s.fotoHata?esc(s.fotoHata):l?s.foto?"Fotoğrafın yalnız bu telefonda işlenir; hiçbir yere gönderilmez ve saklanmaz.":"Fotoğraf seçene kadar kartta avatarın durur.":"",s.roby?"Roby'de kas vurgusu henüz yok; kartta Roby çizilir.":""].filter(Boolean);return`
    <div class="ust"><button class="ib" data-act="kart-geri" aria-label="Geri">${d("geri")}</button><span class="ib-yer"></span></div>
    <div class="sayfa-baslik"><h1>${s.rekorMu?"Rekoru paylaş":"Kartı paylaş"}</h1></div>
    <div class="kart-onizleme${e.boy==="gonderi"?" gonderi":""}"><canvas id="kart-tuval" width="1080" height="${e.boy==="gonderi"?1350:1920}"
      role="img" aria-label="Paylaşım kartının önizlemesi"></canvas></div>
    <section class="kd">
      <h2 class="etiket">Kart</h2>
      <div class="kd-grup">
        ${t("gorsel","Görsel",[["avatar","Avatar"],["foto","Fotoğraf"],["ikisi","İkisi"]])}
        ${l?`<button class="kd-satir kd-git" data-act="kart-foto"><span class="kd-et">Fotoğraf</span>
          <span class="kd-deger">${s.foto?"Değiştir":"Seç ya da çek"}${d("ileri")}</span></button>`:""}
        ${t("boy","Boyut",[["hikaye","Hikâye 9:16"],["gonderi","Gönderi 4:5"]])}
        ${t("serit","Yazılar",[["alt","Altta"],["ust","Üstte"]])}
      </div>
      ${o.map(u=>`<p class="kd-not">${u}</p>`).join("")}
      <h2 class="etiket">Kartta yazsın</h2>
      <div class="kd-cipler" role="group" aria-label="Kartta görünecek bilgiler">${n}</div>
      <h2 class="etiket">Seçenekler</h2>
      <div class="kd-grup">${r}</div>
      <p class="kd-not">Logo ve fsetapp.com her kartta durur. Instagram hikâyesinde bağlantı için "Bağlantı" çıkartmasını ekleyebilirsin.</p>
    </section>
    <div class="alt"><button class="btn p" data-act="kart-paylas"${s.hazir?"":" disabled"}>${d("paylas")}Paylaş</button></div>`}function ia(a,{w:s=280,h:e=72,alan:i=!0}={}){if(a.length<2)return"";const t=Math.min(...a),n=Math.max(...a),r=(n-t)*.18||Math.max(1,n*.02),l=t-r,o=n+r,u=4,p=v=>u+v/(a.length-1)*(s-2*u),$=v=>u+(e-2*u)-(v-l)/(o-l)*(e-2*u),g=a.map((v,m)=>`${m?"L":"M"}${p(m).toFixed(1)} ${$(v).toFixed(1)}`).join(" "),k=p(a.length-1).toFixed(1),b=$(a.at(-1)).toFixed(1);return`<svg class="spark" viewBox="0 0 ${s} ${e}" preserveAspectRatio="none" role="img"
      aria-label="${a.length} ölçüm: ${fmt(a[0])} → ${fmt(a.at(-1))}">
    ${i?`<path class="alan-dolgu" d="${g} L${k} ${e} L${p(0).toFixed(1)} ${e} Z"/>`:""}
    <path class="cizgi" d="${g}"/>
    <path class="uc" d="M${k} ${b} h0"/>
  </svg>`}const cs=(a,s)=>{if(!s)return"";if(!a)return`<p>Hedef kilon <b>${fmt(s,1,1)} kg</b>.</p>`;const e=a.kg-s;return`<p>Hedef kilon <b>${fmt(s,1,1)} kg</b> · ${Math.abs(e)<.05?"hedeftesin":`${fmt(Math.abs(e),1,1)} kg ${e>0?"üstünde":"altında"}`}</p>`};export function historyHTML(a){const{kilolar:s=[],gecmis:e=[],ilerleme:i=[],settings:t}=a,n=s.at(-1),r=a.kiloGir,l=r?`
      <div class="kilo-panel" role="group" aria-label="Kilo gir">
        <div class="kilo-adim">
          <button class="ib" data-kilo-adim="-0.1" aria-label="0,1 kg azalt">${d("eksi")}</button>
          <label class="kilo-deger"><input type="number" id="h-weight" inputmode="decimal" step="0.1" min="20" max="400"
            value="${r.kg}" aria-label="Kilo (kg)"><em>kg</em></label>
          <button class="ib" data-kilo-adim="0.1" aria-label="0,1 kg artır">${d("arti")}</button></div>
        <div class="segment" role="group" aria-label="Hangi gün">${[["bugun","Bugün"],["dun","Dün"],["tarih","Tarih seç"]].map(([m,I])=>`<button data-kilo-gun="${m}" aria-pressed="${r.gun===m}">${I}</button>`).join("")}</div>
        ${r.gun==="tarih"?`<input type="date" class="metin" id="h-tarih" max="${w()}" value="${r.tarih??w()}" aria-label="Tarih">`:""}
        <div class="cift"><button class="btn s" data-act="kilo-vazgec">Vazgeç</button><button class="btn p" data-act="weight-save">Kaydet</button></div>
        ${r.var?`<button class="btn s" data-act="kilo-sil">${d("sil")}Bu günün kaydını sil</button>`:""}
      </div>`:`<button class="btn p" data-act="kilo-gir">${d("arti")}Kilo gir</button>`,o=`
    <div class="grup"><h2 class="etiket">Kilo${n?` · ${s.length} ölçüm`:""}</h2><div class="ic">
      ${kiloOzetHTML(s)}
      ${s.length>1?ia(s.map(m=>m.kg)):""}
      ${cs(n,t.profil?.hedefKilo)}
      ${l}
    </div></div>`,u=`
    <div class="grup"><h2 class="etiket">Son seanslar</h2>
      ${e.length?`<div class="ic sira">${e.map(m=>`
        <button class="seans" data-seans="${esc(m.id)}" aria-label="${h.fmtShort(new Date(m.at))} seansını düzenle">
          <span class="s-baslik">${m.gun}</span>
          <span class="s-hacim">${m.kayitsiz?"—":`${fmt(m.hacim.kg,0)} ${t.unit}`}</span>
          <span class="s-ikinci">${h.fmtShort(new Date(m.at))}${m.programAdi?` · ${esc(m.programAdi)}`:""}${m.kayitsiz?'<span class="etk kyt">kayıtsız</span>':m.yarim?'<span class="etk">yarım</span>':""}</span>
          <span class="s-oran">${m.kayitsiz?"":`${m.yapilan}/${m.toplam} hareket`}</span>
        </button>`).join("")}</div>`:'<div class="ic"><p>Henüz tamamlanmış seans yok.</p></div>'}
    </div>`,p=`
    <div class="grup"><h2 class="etiket">Hareket ilerlemesi · en ağır set</h2>
      ${i.length?`<div class="ic sira">${i.map(m=>`
        <div class="ilerleme">
          <b>${adi(m.ex)}</b>
          <span>${fmt(m.seri[0].v)} → <em>${fmt(m.seri.at(-1).v)} ${m.birim}</em></span>
          ${ia(m.seri.map(I=>I.v),{w:280,h:18,alan:!1})}
        </div>`).join("")}</div>
        <p class="kucuk-yazi grup-alti">${i.length} hareket · çizgi en fazla son ${Math.max(...i.map(m=>m.seri.length))} seansı gösterir.</p>`:'<div class="ic"><p>İlerleme çizgisi için bir hareketin en az iki seansta kaydı gerekiyor.</p></div>'}
    </div>`,$=a.rekorOlaylari??[],g=new Date;g.setDate(1),g.setHours(0,0,0,0);const k=$.filter(m=>m.at>=g.getTime()).length,b=m=>`<button class="oz-kayit satir-dugme" data-hareket="${esc(m.exId)}">${d("yildiz")}<b>${adi(c.byId[m.exId]??{ad:m.exId})}</b>
      <span class="oz-deger"><em>${rekorDeger(m.tur,m.simdi,t.unit)}</em></span>
      <span class="oz-alt">${B.TUR_AD[m.tur]} · ${h.fmtShort(new Date(m.at))}</span></button>`,v=`
    <div class="grup"><h2 class="etiket">Rekorlar · son kırılanlar</h2><div class="ic">${$.length?`${$.slice(0,6).map(b).join("")}
         <p class="oz-kural">${k?`Bu ay ${k} rekor · `:""}Bir harekete dokun: bütün rekorları ve geçmişi.</p>`:"<p>Rekorlar bir hareketi ikinci kez yaptığında sayılmaya başlar: ilk kayıt taban olur.</p>"}</div></div>`;return`
    <div class="sayfa-baslik ust-bosluk"><h1>İlerleme</h1></div>
    ${o}${v}${u}${p}
    ${sekmelerHTML("ilerleme")}`}export function sessionEditHTML(a){const{duzenlenen:s,settings:e}=a;if(!s)return`<div class="ust"><button class="ib" data-act="to-history" aria-label="Geçmişe dön">${d("geri")}</button></div>
    <div class="sayfa-baslik"><h1>Seans bulunamadı</h1></div>`;const i=c.gunEtiketiSeans(s).kisa,t=c.exercisesOfSession(s),n=s.entries.filter(o=>!t.some(u=>u.id===o.exerciseId)).map(o=>c.byId[o.exerciseId]??c.bilinmeyenHareket(o.exerciseId)),r=[...t,...n].map(o=>{const u=s.entries.find(k=>k.exerciseId===o.id);if(!u?.sets.length)return"";const p=M.agirlikAdimi(o,e)??M.GIRIS_ADIMI_YEDEK;let $=0;const g=u.sets.map((k,b)=>{const v=k.type==="time"?[["seconds",k.seconds,"sn",5]]:k.type==="cardio"?[["minutes",k.minutes,"dk",5]]:[["weight",k.weight,e.unit,p],["reps",k.reps,"tekrar",1]],m=k.warmup?"ısınma":`${++$}.`;return`<div class="eset">
        <span class="eno">${k.warmup?"ıs":$}</span>
        ${v.map(([I,D,A,R])=>`
          <label class="efield">
            <input type="number" inputmode="decimal" step="${R}" min="0"
                   value="${D??""}" placeholder="—"
                   data-eset="${o.id}:${b}:${I}" aria-label="${adi(o)} ${m} set ${A}">
            <span class="eunit">${A}</span>
          </label>`).join("")}
        <button class="esil" data-eset-sil="${o.id}:${b}" aria-label="${m} seti sil">${d("sil")}</button>
      </div>`}).join("");return`<div class="grup"><h2 class="etiket">${adi(o)}</h2><div class="ic sira">${g}${u.note?`<p class="seans-notu">${d("liste")}<span>${esc(u.note)}</span></p>`:""}</div></div>`}).join(""),l=c.summaryVolume(s);return`
    <div class="ust"><button class="ib" data-act="to-history" aria-label="Geçmişe dön">${d("geri")}</button><span class="ib-yer"></span>
      ${s.finishedAt&&c.hasAnySet(s)?`<button class="ib" data-act="kart-ac-seans" aria-label="Bu seansın kartını paylaş">${d("paylas")}</button>`:""}</div>
    <div class="sayfa-baslik">
      <h1>${i}</h1>
      <p>${h.fmtShort(new Date(s.finishedAt??s.startedAt))} · ${l.sets} set · ${fmt(l.kg,0)} ${e.unit}</p>
    </div>
    <p class="aciklama">Bir değeri düzeltmek için üstüne yaz; alandan çıkınca kaydedilir. Hacim, "geçen sefer"
      ve ilerleme çizgisi kendiliğinden yeniden hesaplanır.</p>
    ${r}
    <div class="grup"><div class="ic">
      <button class="btn s" data-act="seans-sil">Bu seansı sil</button>
      <p>Silinen seans geçmişten kalkar, sıra yeniden hesaplanır. Geri getirebilirsin.</p>
    </div></div>`}const us=[1,2,3,4,5,6,0],ps=[30,45,60,90,120];function ks(a={}){const s=fa[a.tur];return`<div class="grup" id="kurulum"><h2 class="etiket">Telefona yükle</h2><div class="ic">${a.kurulu?"<p>Telefona yüklü: ana ekrandaki simgesiyle, adres çubuğu olmadan açılıyor.</p>":a.istem?`<button class="btn p" data-act="kur">Telefona yükle</button>
         <p>Ana ekrana kendi simgesiyle eklenir; adres çubuğu olmadan açılır, internetsiz çalışır.
           Kayıtların aynen kalır. Mağaza gerekmez.</p>`:s?`<p class="kurulum-tarayici">${esc(s.tarayici)} için:</p>
           <ol class="kurulum-adim">${s.adimlar.map(i=>`<li>${i}</li>`).join("")}</ol>
           ${s.not?`<p class="kucuk-not">${esc(s.not)}</p>`:""}
           <p class="kucuk-not">Zaten yüklüyse ana ekrandaki FSet simgesinden aç.</p>`:"<p>Tarayıcı menüsünden <b>Uygulamayı yükle</b> ya da <b>Ana ekrana ekle</b>'yi seç.</p>"}</div></div>`}export function kurulumBantHTML(a){const s=a.kurulum??{};return za(s.tur,a.settings)?`<div class="kurulum-bant"><span class="yazi"><b>FSet'i telefona yükle</b><span>Ana ekranda kendi simgesiyle, internetsiz açılır.</span></span>
    <button class="btn p kucuk" data-act="${s.istem?"kur":"kurulum-nasil"}">${s.istem?"Yükle":"Nasıl?"}</button>
    <button class="kapat" data-act="kurulum-kapat" aria-label="Bandı kapat">${d("carpi")}</button></div>`:""}export const ESKI_ADRES="sabritemel.github.io",eskiAdresMi=a=>a===ESKI_ADRES,YENI_ADRES="https://app.fsetapp.com/";const F=a=>{const s=new Date(a);return`${s.getDate()} ${h.AY[s.getMonth()]}`},ta=a=>{const s=new Date(a);return`${String(s.getHours()).padStart(2,"0")}:${String(s.getMinutes()).padStart(2,"0")}`},bs=a=>`<div class="yp-sayilar">
    <div><b>${a.seans}</b><span>seans</span></div><div><b>${a.kilo}</b><span>kilo kaydı</span></div>
    <div><b>${a.program}</b><span>program</span></div></div>`,E=(a,s,e="",i=!1)=>`<li class="yp-adim${i?" bitti":""}"><span class="no">${i?d("tik"):a}</span><div class="yp-adim-ic"><span>${s}</span>${e}</div></li>`;export function geriYukleRehberHTML({veriVar:a=!1}={}){return`<h2 id="yp-baslik">Kayıtlarını getir</h2>
    <p>Daha önce aldığın yedek dosyasını seçeceksin. Dosya çoğunlukla telefonun <b>İndirilenler</b> klasöründedir.</p>
    <ol class="yp-adimlar">
      ${E(1,"Aşağıdaki <b>Dosya seç</b>'e dokun.")}
      ${E(2,"Açılan pencerede <b>İndirilenler</b>'e gir. Göremiyorsan sol üstteki <b>☰</b> menüsüne dokun.")}
      ${E(3,"Adı <b>fset-yedek-</b> ile başlayan dosyaya dokun. Birden fazla varsa en yeni tarihliyi seç.")}
    </ol>
    <p class="kalir">Yedeği Drive'a ya da WhatsApp'a gönderdiysen aynı pencerede oradan da seçebilirsin. Yanlış dosya seçersen hiçbir şey değişmez.
      ${a?"Telefondaki kayıtların silinmez; yedektekiler eklenir, aynı kaydın yenisi kalır.":""}</p>
    <div class="cift dikey"><button class="btn p" data-yp="sec">${d("dosya")}Dosya seç</button>
      <button class="btn s" data-yp="kapat" data-kapat>Vazgeç</button></div>`}export function geriYukleSonucHTML(a,s={}){return`<span class="yp-rozet">${d("tik")}</span>
    <h2 id="yp-baslik">Kayıtların geldi</h2>
    ${a.tarih?`<p>Yedek: ${F(a.tarih)} ${new Date(a.tarih).getFullYear()}, ${ta(a.tarih)}</p>`:""}
    ${bs(a)}
    ${a.sonAntrenman?`<p>Son antrenmanın <b>${F(a.sonAntrenman)}</b>. Programın, profilin ve ayarların da geldi.</p>`:""}
    ${s.geçersiz?`<p class="kalir">${s.geçersiz} bozuk kayıt atlandı; geri kalanı yüklendi.</p>`:""}
    <div class="cift dikey"><button class="btn p" data-yp="kapat" data-kapat>Devam</button></div>`}export function geriYukleHataHTML(a){return`<span class="yp-rozet uyari">${d("uyari")}</span>
    <h2 id="yp-baslik">${esc(String(a).replace(/\.$/,""))}</h2>
    <p>Telefonundaki hiçbir kayıt değişmedi. Adı <b>fset-yedek-</b> ile başlayan dosyayı seç.</p>
    <div class="cift dikey"><button class="btn p" data-yp="sec">${d("dosya")}Başka dosya seç</button>
      <button class="btn s" data-yp="kapat" data-kapat>Vazgeç</button></div>`}export function yedekAlindiHTML({dosya:a,bayt:s,oz:e,indirildi:i=!0}){return`<div class="yp-baslik-satir"><span class="yp-rozet kucuk">${d("tik")}</span><h2 id="yp-baslik">Yedek alındı</h2></div>
    <p>${e.seans} seans, ${e.kilo} kilo kaydı, ${e.program} program ve ayarların tek dosyada.</p>
    <div class="yp-dosya">${d("dosya")}<span><b>${esc(a)}</b><small>${i?"Telefonun İndirilenler klasöründe":"Seçtiğin yere gönderildi"} ·
      ${Math.max(1,Math.round(s/1024))} KB</small></span></div>
    <div class="not yp-not">${d("uyari")}<span>Telefonu değiştireceksen bu dosyayı <b>Drive'a ya da kendine e-postayla</b> gönder.
      Uygulamayı silmek bu dosyayı silmez.</span></div>
    <div class="cift dikey"><button class="btn p" data-yp="kapat" data-kapat>Tamam</button></div>`}export function tasimaBantHTML(){return`<div class="kurulum-bant tasima-bant"><span class="yazi"><b>FSet yeni adresine taşındı</b><span>Kayıtlarını 3 adımda taşı.</span></span>
    <button class="btn p kucuk" data-act="tasi">Taşı</button></div>`}export function tasimaHTML({yedekAlindi:a=null}={}){const s=!!a;return`<h2 id="yp-baslik">Yeni adrese taşı</h2>
    <p>Eski ve yeni uygulama kayıtlarını ayrı tutar; kayıtlar kendiliğinden geçmez. Taşıma birkaç dakika sürer.</p>
    <ol class="yp-adimlar">
      ${E(1,s?`<b>Yedek alındı.</b> İndirilenler'de: ${esc(a)}`:"<b>Yedek al.</b> Dosya telefonun İndirilenler klasörüne kaydedilir.",s?"":`<button class="btn p" data-yp="yedek">${d("ver")}Yedek al</button>`,s)}
      ${E(2,"<b>Yeni uygulamayı kur.</b> app.fsetapp.com açılır; e-posta adresinle girip Chrome menüsünden <b>Uygulamayı yükle</b>'ye dokun.",s?`<a class="btn p" href="${YENI_ADRES}" target="_blank" rel="noopener">Yeni adresi aç</a>`:'<button class="btn s" disabled>Yeni adresi aç</button>')}
      ${E(3,'<b>Yeni uygulamada</b> "Önceki kayıtlarımı getir"e dokun ve bu dosyayı seç.')}
    </ol>
    <div class="not yp-not">${d("uyari")}<span>Kayıtlarını yeni uygulamada görmeden <b>bu uygulamayı silme.</b></span></div>
    <div class="cift dikey"><button class="btn s" data-yp="kapat" data-kapat>Sonra</button></div>`}export function sonYedekYazisi(a,s=Date.now()){if(!a?.ts)return"Henüz yedek almadın";const e=Math.floor((new Date(s).setHours(0,0,0,0)-new Date(a.ts).setHours(0,0,0,0))/864e5);return`Son yedek: ${e<=0?`bugün ${ta(a.ts)}`:e===1?"dün":`${F(a.ts)} · ${e} gün önce`}`}export function profilOzeti(a,s=[]){const e=a.profil??{},i=s.at(-1),t=(a.trainingDays??[]).length;return[e.yas&&`${e.yas} yaş`,a.heightCm&&`${a.heightCm} cm`,i&&`${fmt(i.kg,1,1)} kg`,e.hedef&&profilEtiketi("hedef",e.hedef),t&&`haftada ${t} gün`].filter(Boolean).join(" · ")}export function settingsHTML(a){const{settings:s}=a,e=ps.map(t=>`
    <button data-rest="${t}" aria-pressed="${s.restSeconds===t}" aria-label="${t} saniye">${t}</button>`).join(""),i=M.DAMBIL_ADIMLARI.map(t=>`
    <button data-dambil="${t}" aria-pressed="${s.dambilAdimi===t}">${fmt(t)} kg</button>`).join("");return`
    <div class="sayfa-baslik ust-bosluk"><h1>Ayarlar</h1></div>

    <div class="grup"><h2 class="etiket">Profil ve avatar</h2><div class="ic">
      <button class="pm-satir" data-act="to-profil">
        <span class="avatar-k" data-avatar-k aria-hidden="true"></span>
        <span class="yazi"><b>${esc(s.profil?.ad?.trim()||"Profil oluştur")}</b><span>${esc(profilOzeti(s,a.kilolar))}</span></span>${d("ileri")}
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

    ${ks(a.kurulum)}

    <div class="grup"><h2 class="etiket">Yedek</h2><div class="ic">
      <p class="son-yedek">${sonYedekYazisi(s.sonYedek)}</p>
      <p>Kayıtların yalnız bu telefonda; sunucuya hiçbir şey gönderilmez. Telefonu değiştirmeden ya da uygulamayı silmeden önce yedek al.</p>
      <div class="cift esit">
        <button class="btn p" data-act="backup">${d("ver")}Yedek al</button>
        <button class="btn s" data-act="import">${d("getir")}Geri yükle</button>
      </div>
    </div></div>

    <div class="grup"><h2 class="etiket">Bugünkü seans</h2><div class="ic">
      <button class="btn s" data-act="reset-day">Bugünü sıfırla</button>
      <p>Bugün girilen setleri siler. Hemen ardından geri getirebilirsin.</p>
    </div></div>

    <div class="grup"><h2 class="etiket">Hakkında</h2><div class="ic">
      <div class="hk-ust"><img src="icons/isaret.svg" alt="" width="44" height="26">
        <div class="hk-ad"><b class="hk-kelime"><span class="k1">${esc(Q.on)}</span><span class="k2">${esc(Q.son)}</span></b>
          <small>Sürüm ${esc(ya)}</small></div></div>
      <p>Verilerin yalnızca bu telefonda durur; hesap yok, hiçbir sunucuya bir şey gönderilmez.</p>
      <a class="hk-bag" href="gizlilik.html">Gizlilik politikası${d("ileri")}</a>
      <a class="hk-bag" href="kosullar.html">Kullanım koşulları${d("ileri")}</a>
    </div></div>

    <p class="kucuk-yazi">Ağrı hissettiğin bir harekette dur; bu uygulama tıbbi tavsiye vermez.
      Hareket çizimleri <a href="js/vendor/three-LICENSE.txt" target="_blank" rel="noopener">three.js</a> ile yapılır (MIT lisansı);
      manken MakeHuman ile üretildi (CC0); yazı tipi Archivo (<a href="fonts/OFL.txt" target="_blank" rel="noopener">SIL OFL 1.1</a>);
      karekod <a href="js/vendor/qrcode-LICENSE.txt" target="_blank" rel="noopener">qrcode-generator</a> ile üretilir (MIT lisansı).
      © 2026 Sabri Temel, tüm hakları saklıdır.</p>
    ${sekmelerHTML("ayarlar")}`}const j=(a,s,e)=>a.map(([i,t,n])=>`<button class="renk" data-${e}="${i}" aria-pressed="${s===i}" aria-label="${esc(t)}" style="--renk:${n}"></button>`).join("");export function profilHTML(a){const s=a.settings??{},e=s.avatar??{},i=s.profil??{},t=y.cozumle(e,i),n=y.govdeBul(t.govde),r=a.avatarOneri,l=a.avatarSekme??"profil",o=a.kiyafetParca??"ust",u=(k,b)=>`<p class="renk-ad">${esc(k.find(v=>v[0]===b)?.[1]??"")}</p>`,p=`<p class="av-not">Roby'nin teni, saçı ve kıyafeti yok; bunlar Leo, Mia, Max ve Nora için.</p>`,$={avatar:()=>`<div class="govdeler">${y.GOVDELER.map(k=>`<button class="cip" data-avatar-govde="${k.id}" aria-pressed="${t.govde===k.id}">${esc(k.ad)}</button>`).join("")}</div>
      <p class="av-not">${t.robot?"Roby daha hafif bir manken; pili korur.":a.cAcilamadi?"Ayrıntılı manken bu telefonda açılamadı; şimdilik Roby çiziliyor.":"Yaşını Profil'de yazarsan avatar önerilir; seçimin hep senin."}</p>`,ten:()=>t.robot?p:`<div class="renkler">${j(y.TEN,t.ten,"avatar-ten")}</div>${u(y.TEN,t.ten)}
      <p class="av-not">Ten ve saç rengi telefonunun bölge ayarına göre önerildi; internete bağlanılmaz.</p>`,sac:()=>t.robot?p:(n.kadin?"":`<div class="segment" role="group" aria-label="Saç">
        <button data-avatar-sacvar="1" aria-pressed="${t.sacli}">Saçlı</button><button data-avatar-sacvar="0" aria-pressed="${!t.sacli}">Saçsız</button></div>`)+(t.sacli?`<div class="renkler">${j(y.SAC,t.sacRenk,"avatar-sac")}</div>${u(y.SAC,t.sacRenk)}`:""),kiyafet:()=>t.robot?p:`<div class="segment" role="group" aria-label="Kıyafet">
        <button data-kiyafet-parca="ust" aria-pressed="${o==="ust"}">Üst</button><button data-kiyafet-parca="alt" aria-pressed="${o==="alt"}">Alt</button></div>`+(o==="ust"?`<div class="renkler">${j(y.UST,t.ust,"avatar-ust")}</div>${u(y.UST,t.ust)}`:`<div class="renkler">${j(y.ALT,t.alt,"avatar-alt")}</div>${u(y.ALT,t.alt)}`)},g=[["profil","Profil"],["avatar","Avatar"],["ten","Ten"],["sac","Saç"],["kiyafet","Kıyafet"]];return`
    <div class="ust av-baslik"><button class="ib" data-act="to-settings" aria-label="Ayarlara dön">${d("geri")}</button><h1>Profil ve avatar</h1><span class="ib-yer"></span></div>
    <div class="av-sahne">
      <div class="avatar-onizleme" id="avatar3d" aria-label="Avatarın — döndürmek için sürükle"></div>
      ${r?"":'<img class="damga" src="icons/isaret.svg" alt="" width="30" height="17">'}
      ${r?`<div class="avatar-oneri"><span>Avatarın ${r.yas?"yaşına":"seçimine"} göre ${esc(y.govdeBul(r.yeni).ad)} oldu.</span>
        <button data-act="avatar-geri-al">Geri al</button></div>`:'<p class="avatar-ipucu">Döndürmek için sürükle</p>'}
    </div>
    <div class="av-sekmeler" role="tablist" aria-label="Profil ve avatar">${g.map(([k,b])=>`<button role="tab" data-avatar-sekme="${k}" aria-selected="${l===k}">${b}</button>`).join("")}</div>
    ${l==="profil"?`<div class="pf-sayfa" role="tabpanel">${ms(a)}</div>`:`<div class="av-panel" role="tabpanel">${$[l]()}</div>`}`}const na={hedef:[["kas","Kas"],["guc","Güç"],["form","Genel form"]],yer:[["salon","Salonda"],["ev","Evde"]],deneyim:[["yeni","Yeni"],["orta","Bir süredir"],["ileri","Deneyimli"]]};export const profilEtiketi=(a,s)=>na[a]?.find(e=>e[0]===s)?.[1]??"";const O=(a,s,e)=>`<div class="segment" role="group" aria-label="${e}">${na[a].map(([i,t])=>`<button data-profil-${a}="${i}" aria-pressed="${s===i}">${t}</button>`).join("")}</div>`;export function kiloOzetHTML(a=[]){if(!a.length)return'<p class="kilo-yok">Henüz kilo kaydı yok. "Kilo gir" ile ilk ölçümünü yaz; o senin başlangıcın olur.</p>';const s=a[0],e=a.at(-1),i=e.kg-s.kg,t=Math.round((e.ts-s.ts)/864e5),n=t>=14?`${Math.round(t/7)} hafta`:`${t} gün`,r=(l,o,u,p="")=>`<div class="${p}"><small>${l}</small><b>${o}</b><em>kg</em><span>${u}</span></div>`;return`<div class="kilo-uc">${r("Başlangıç",fmt(s.kg,1,1),h.fmtShort(new Date(s.ts)))}${r("Güncel",fmt(e.kg,1,1),h.relativeLabel(new Date(e.ts)))}${r("Değişim",a.length<2||Math.abs(i)<.05?"0":`${i>0?"+":"−"}${fmt(Math.abs(i),1,1)}`,a.length<2?"ilk ölçüm":n,"fark")}</div>`}function ms(a){const s=a.settings??{},e=s.profil??{},i=s.trainingDays??[],t=h.upcoming(new Date,i,3);return`
    <div class="grup"><h2 class="etiket">Sen</h2><div class="ic">
      <div class="av-iki">
        <div class="profil-alan"><label for="p-adin">Adın</label><input class="metin" id="p-adin" maxlength="24" autocomplete="off" placeholder="Örneğin Deniz" value="${esc(e.ad??"")}"></div>
        <div class="profil-alan av-yas"><label for="p-yas">Yaşın</label><input class="metin" id="p-yas" inputmode="numeric" maxlength="3" autocomplete="off" placeholder="—" value="${e.yas??""}"></div></div>
      <p class="pf-soru">Cinsiyet</p>
      <div class="segment" role="group" aria-label="Cinsiyet">${y.CINSIYET.map(([n,r])=>`<button data-profil-cins="${n}" aria-pressed="${e.cinsiyet===n}">${r}</button>`).join("")}</div>
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
      <div class="cift"><button class="btn s" data-act="kilo-gir">${d("arti")}Kilo gir</button><button class="btn s" data-act="to-history">${d("grafik")}Grafik</button></div>
    </div></div>

    <div class="grup"><h2 class="etiket">Antrenman</h2><div class="ic">
      <p class="pf-soru ilk">Hedefin</p>${O("hedef",e.hedef,"Hedefin")}
      <p class="pf-soru">Nerede</p>${O("yer",e.yer,"Nerede çalışıyorsun")}
      <p class="pf-soru">Deneyimin</p>${O("deneyim",e.deneyim,"Deneyimin")}
      <p class="pf-soru">Antrenman günlerin</p>
      <div class="cipler">${us.map(n=>`<button class="cip" data-gun="${n}" aria-pressed="${i.includes(n)}" aria-label="${h.GUN[n]}">${h.GUN_KISA[n]}</button>`).join("")}</div>
      <p>Sıradaki: ${t.length?`<b>${t.map(n=>h.fmtShort(n)).join(" · ")}</b>`:"Hiç gün seçili değil; takvim çalışmaz."}</p>
      <button class="btn s" data-act="profil-oner">Bu cevaplara göre program öner</button>
      <p>Cevapları değiştirmek programını değiştirmez; öneriyi görür, istersen eklersin.</p>
    </div></div>

    <div class="grup"><button class="btn s" data-act="profil-sil">${d("sil")}Profil bilgilerimi sil</button>
      <p class="kucuk-yazi grup-alti">Ad, yaş, cinsiyet, boy, hedef kilo ve cevaplar boşalır. Antrenman günlerin ve kilo geçmişin kalır; kilo kayıtları İlerleme'den silinir.</p></div>`}const $s=[["ilerleme","İlerleme","ilerleme","to-history"],["hareketler","Hareketler","hareket","to-hareketler"],["bugun","Antrenman","bugun","to-list"],["programlar","Programlar","program","to-programs"],["ayarlar","Ayarlar","ayar","to-settings"]],ra=a=>`<svg class="si" aria-hidden="true"><use href="#s-${a}"/></svg>`;export function sekmelerHTML(a){return`<nav class="sekmeler" aria-label="Ana gezinme">${$s.map(([s,e,i,t])=>{const n=s===a?' aria-current="page"':"";return s==="bugun"?`<button class="orta" data-act="${t}" aria-label="${e}"${n}><span class="daire">${ra(i)}</span></button>`:`<button data-act="${t}"${n}>${ra(i)}<span>${e}</span></button>`}).join("")}</nav>`}const la=a=>cizimsiz(a)?`<span class="kucuk yer" aria-hidden="true">${d("figur")}</span>`:`<span class="kucuk" data-kucuk="${esc(a.id)}" aria-hidden="true"></span>`,gs=a=>a.gunler.reduce((s,e)=>s+e.hareketler.length,0);export function programsHTML(){const a=c.aktifProgram();return`
    <div class="sayfa-baslik ust-bosluk"><h1>Programlar</h1>
      <p>Bugün ekranı <b>kullanılan</b> programın sıradaki gününü gösterir.</p></div>
    <div class="liste">${c.programListesi().map(e=>`
    <button class="satir yalin" data-program-ac="${esc(e.id)}">
      <span class="ad"><b>${esc(e.ad)}</b><span>${e.gunler.length} gün · ${gs(e)} hareket</span></span>
      <span class="sag">${e===a?'<span class="rozet">Kullanılıyor</span>':""}</span>${d("ileri")}
    </button>`).join("")}</div>
    <div class="grup"><button class="btn s" data-act="program-yeni">${d("arti")}Yeni program</button></div>
    <div class="grup"><h2 class="etiket">Hazır programlar</h2><div class="hazir-liste">${J.map(da("data-hazir")).join("")}</div>
      <p class="kucuk-yazi grup-alti">Dokun: günlerini gör, kopyasını programlarına ekle. Eklenen kopya senindir; düzenleyebilirsin.</p></div>
    ${sekmelerHTML("programlar")}`}const vs=a=>a.gunler.length===2?"A / B":`${a.gunler.length} farklı gün`,da=a=>s=>`<button class="hazir" ${a}="${esc(s.id)}"><span class="ad"><b>${esc(s.ad)}</b><span>${esc(s.kime)}</span></span>
  <span class="rozet">${vs(s)}</span></button>`;function oa(a,s){const e=i=>i.seconds!=null?`${i.sets}×${i.seconds} sn`:`${i.sets}×${i.reps}`;return`<div class="oneri-kart">${s?`<small>${s}</small>`:""}<h2>${esc(a.ad)}</h2><p>${esc(a.kime)}</p>
    <div class="gun-ozet">${a.gunler.map(([i,t],n)=>`<div><b>${esc(i||`${n+1}. Gün`)}</b><span>${t.map(r=>`${esc(c.byId[r.exId]?.ad??r.exId)} ${e(r)}`).join(" · ")}</span></div>`).join("")}</div></div>`}export function hazirHTML(a){const s=W(a.hazirId),e=a.hazirGeri==="profil"?`<button class="ib" data-act="to-profil" aria-label="Profile dön">${d("geri")}</button>`:`<button class="ib" data-act="to-programs" aria-label="Programlara dön">${d("geri")}</button>`;return s?`
    <div class="ust">${e}
      <span class="tarih">Hazır program</span><span class="ib-yer"></span></div>
    ${oa(s,a.hazirGeri==="profil"?"PROFİLİNE GÖRE ÖNERİLEN":void 0)}
    <div class="grup"><button class="btn p" data-act="hazir-ekle">${d("arti")}Programlarıma ekle</button></div>
    <p class="kucuk-yazi grup-alti">Kopyası eklenir; günlerini ve hedeflerini düzenleyebilirsin. Kullanmak için programda "Bu programı kullan".</p>`:`<div class="ust">${e}</div>`}export function ilkAcilisHTML(a){const s=a.ia,e=`<div class="ilerleme-cizgi" aria-hidden="true">${[1,2,3,4,5].map(n=>`<i class="${n<=s.adim?"dolu":""}"></i>`).join("")}</div>`;if(s.adim===0)return`
    <div class="karsilama"><img class="logo" src="icons/fset-192.png" alt="">
      <h1>Antrenman defterin hazır.</h1>
      <p>Dört kısa soru; sana uygun programı önerelim. Bir dakika sürer.</p>
      <ul><li>Her hareketin 3B anlatımı</li><li>Set, tekrar ve ağırlık kaydı</li><li>Hesap yok; verilerin telefonunda kalır</li></ul>
      <p class="kucuk-yazi">FSet bir egzersiz yardımcısıdır, tıbbi tavsiye vermez. Bir sağlık sorunun varsa başlamadan önce hekimine danış.
        Devam ederek <a href="kosullar.html">Kullanım koşullarını</a> kabul etmiş olursun; verilerinin nasıl tutulduğu
        <a href="gizlilik.html">Gizlilik politikasında</a>.</p></div>
    <div class="alt-bar dikey"><button class="btn p" data-ia="ileri">Başlayalım</button>
      <button class="btn s" data-ia="kendim">Kendim kuracağım</button>
      <span class="ayrac-yazi">daha önce kullandıysan</span>
      <button class="btn s" data-act="import">${d("getir")}Önceki kayıtlarımı getir</button></div>`;if(s.adim<=4){const n=va[s.adim-1];return`${e}
    <div class="soru"><h1>${n.soru}</h1>${n.alt?`<p>${n.alt}</p>`:""}</div>
    <div class="secenekler" role="group" aria-label="${n.soru}">${n.secenek.map(([r,l,o])=>`<button class="secenek" aria-pressed="${s.c[n.anahtar]===r}" data-ia-cevap="${n.anahtar}:${r}"><span class="ad"><b>${l}</b>${o?`<span>${o}</span>`:""}</span></button>`).join("")}</div>
    <div class="alt-bar"><button class="btn s" data-ia="geri">${d("geri")}Geri</button><span class="kucuk-yazi">${s.adim} / 4</span></div>`}if(s.adim===5){const n=y.cozumle({},{yas:s.profil.yas,cinsiyet:s.profil.cinsiyet??null}).govde,r=s.profil.govde??n;return`${e}
    <div class="soru"><h1>Seni tanıyalım</h1><p>Hepsi isteğe bağlı ve Profil'e yazılır; istediğin zaman değiştirir ya da silersin. Yalnız bu telefonda kalır.</p></div>
    <div class="profil-alan">
      <div class="form-alan"><label for="ia-ad">Adın</label><input id="ia-ad" class="metin" maxlength="24" autocomplete="off" placeholder="İsteğe bağlı" value="${esc(s.profil.ad??"")}"></div>
      <div class="form-alan"><label for="ia-yas">Yaşın</label><input id="ia-yas" class="metin" inputmode="numeric" maxlength="3" placeholder="İsteğe bağlı" value="${s.profil.yas??""}"></div>
      <div class="form-alan"><span class="etiket">Cinsiyet</span><div class="segment" role="group" aria-label="Cinsiyet">${y.CINSIYET.map(([l,o])=>`<button data-ia-cins="${l}" aria-pressed="${s.profil.cinsiyet===l}">${o}</button>`).join("")}</div></div>
      <div class="av-iki">
        <div class="form-alan"><label for="ia-boy">Boy (cm)</label><input id="ia-boy" class="metin" inputmode="numeric" maxlength="3" placeholder="İsteğe bağlı" value="${s.profil.boy??""}"></div>
        <div class="form-alan"><label for="ia-kilo">Kilo (kg)</label><input id="ia-kilo" class="metin" inputmode="decimal" maxlength="5" placeholder="İsteğe bağlı" value="${s.profil.kilo??""}"></div></div>
      <p class="kucuk-yazi">Kilo, İlerleme'deki kilo takibinin ilk ölçümü olur.</p>
      <div class="form-alan"><span class="etiket">Avatar</span><div class="cip-izgara">${y.GOVDELER.map(l=>`<button class="cip" aria-pressed="${l.id===r}" data-ia-govde="${l.id}">${esc(l.ad)}</button>`).join("")}</div></div></div>
    <div class="alt-bar"><button class="btn s" data-ia="atla">Atla</button><button class="btn p" data-ia="ileri">Devam</button></div>`}const i=s.secili??ha(s.c),t=W(i);return`
    <div class="soru"><h1>Senin için önerimiz</h1><p>Hedefine ve haftana göre seçildi; istediğin zaman değiştirebilirsin.</p></div>
    ${oa(t,s.secili?"SEÇTİĞİN":"ÖNERİLEN")}
    <div class="alt-bar dikey"><button class="btn p" data-ia="basla">Bu programla başla</button></div>
    <div class="grup"><h2 class="etiket">Diğer programlar</h2><div class="hazir-liste">${J.filter(n=>n.id!==i).map(da("data-ia-sec")).join("")}</div></div>
    <div class="grup"><button class="btn s" data-ia="kendim">Kendim kuracağım</button></div>`}const hs=(a,s,e,i)=>`<span class="hedef">
    <button class="adim" data-kalem="${a}:${s}:-1" aria-label="${i} azalt">${d("eksi")}</button>
    <b>${e}</b>
    <button class="adim" data-kalem="${a}:${s}:1" aria-label="${i} artır">${d("arti")}</button></span>`,ca=a=>a.minutes!=null?`${a.minutes} dk`:a.seconds!=null?`${a.sets} × ${a.seconds} sn`:`${a.sets} × ${a.repsMin&&a.repsMin<a.reps?`${a.repsMin}-`:""}${a.reps}`;function ys(a,s,e,i=60){const t=c.byId[a.exId]??c.bilinmeyenHareket(a.exId),n=[t.grup,S[t.equipment]].filter(Boolean).join(" · "),r=`${s}:`;let l="";if(e){const o=a.minutes!=null?"":`<div class="g-alan"><div class="g-etk"><span>Set</span><b>${a.sets}</b></div>${noktalarHTML("dz-set",a.sets,r)}</div>`,u=a.minutes!=null?`<div class="g-alan"><div class="g-etk"><span>Süre</span></div>${hs(s,"minutes",`${a.minutes} dk`,"Süre")}</div>`:a.seconds!=null?`<div class="g-alan"><div class="g-etk"><span>Süre</span><b>${a.seconds} sn</b></div>
            <div class="semalar" role="group" aria-label="Süre">${[...new Set([15,20,30,45,60,90,a.seconds])].sort(($,g)=>$-g).map($=>`<button class="cip" aria-pressed="${$===a.seconds}" data-dz-sn="${r}${$}">${$} sn</button>`).join("")}</div></div>`:`<div class="g-alan"><div class="g-etk"><span>Tekrar</span><b>${a.reps}</b></div>${tekrarSeridiHTML("dz-tekrar",a.reps,r)}</div>
           ${semalarHTML("dz-sema",a.sets,a.reps,r)}`,p=a.minutes!=null?"":yontemHTML("dz-yontem",a,r,i,{tekrarli:a.reps!=null&&t.setType!=="time"});l=`<div class="acilir">${o}${u}${p}
      <div class="alt-eylem"><button class="btn s" data-cikar="${s}">${d("sil")}Bu günden çıkar</button></div></div>`}return`<div class="satir-d${e?" acik":""}" data-dz-i="${s}">
    <div class="kafa">${la(t)}
      <button class="ad" data-dz-ac="${s}" aria-expanded="${e}"><b>${adi(t)}</b>${n?`<small>${esc(n)}</small>`:""}</button>
      <button class="hap" data-dz-ac="${s}" aria-label="${adi(t)}: hedef ${ca(a)}">${ca(a)}</button>
      <button class="tutac" data-dz-tutac="${s}" aria-label="${adi(t)}: sırayı değiştir — sürükle ya da yukarı/aşağı ok tuşu">${d("tutac")}</button>
    </div>${l}</div>`}const ua=a=>JSON.stringify({...a,guncellendi:0});export const programDegisti=(a,s)=>!!(a&&s&&ua(a)!==ua(s));export function programHTML(a){const s=c.programGetir(a.duzen?.id);if(!s)return`<div class="ust"><button class="ib" data-act="to-programs" aria-label="Programlara dön">${d("geri")}</button></div>
    <div class="sayfa-baslik"><h1>Program bulunamadı</h1></div>`;const e=Math.min(a.duzen.gun??0,s.gunler.length-1),i=s.gunler[e],t=s===c.aktifProgram(),n=i.hareketler.map((r,l)=>ys(r,l,a.duzen.acik===l,a.settings?.restSeconds??60)).join("");return`
    <div class="ust"><button class="ib" data-act="to-programs" aria-label="Programlara dön">${d("geri")}</button>
      ${programDegisti(s,a.duzen.kopya)?`<button class="geri-don" data-act="program-geri-don">${d("geri-al")}Açtığın hâle dön</button>`:""}
      ${t?'<span class="rozet">Kullanılıyor</span>':'<button class="cip" data-act="program-aktif">Bu programı kullan</button>'}</div>
    <div class="form-alan"><label for="p-ad">Programın adı</label>
      <input id="p-ad" class="metin" value="${esc(s.ad)}" maxlength="60" autocomplete="off"></div>
    <div class="kaydir" role="group" aria-label="Günler">${s.gunler.map((r,l)=>`<button class="cip" aria-pressed="${l===e}" data-pgun="${l}">${l+1}. Gün</button>`).join("")}
      ${s.gunler.length<7?`<button class="cip" data-act="gun-ekle" aria-label="Gün ekle">${d("arti")}Gün</button>`:""}</div>
    <div class="form-alan"><label for="g-ad">${e+1}. günün adı</label>
      <input id="g-ad" class="metin" value="${esc(i.ad??"")}" maxlength="60" autocomplete="off"
             placeholder="${esc(c.gunEtiketi(e,s).kaslar)}"></div>
    <div class="grup"><h2 class="etiket">Hareketler · ${i.hareketler.length}</h2>
      ${i.hareketler.length?`<div class="liste-d" id="dz-liste">${n}</div>`:'<div class="ic"><p>Bu gün boş. Aşağıdan hareket ekle.</p></div>'}
    </div>
    <div class="grup"><h2 class="etiket">Soğuma</h2>
      <div class="segment" role="group" aria-label="${e+1}. günün soğuması">${Object.entries(c.SOGUMA_SECENEK).map(([r,l])=>`<button aria-pressed="${(i.soguma??"kas")===r}" data-psoguma="${r}">${l}</button>`).join("")}</div>
      <p class="kucuk-yazi gun-ayar-not">${{kas:"Günün kaslarından en fazla 5 esneme, ~5 dk.",tum:`Tüm vücut esneme: ${c.ESNEME.length} esneme, ${esDakika(c.sogumaSuresi(c.tumVucut(a.settings?.profil)))}.`,kapali:"Bu günün listesinde soğuma satırı görünmez."}[i.soguma??"kas"]}</p></div>
    <div class="grup eylemler"><button class="btn s" data-act="secici-ac">${d("arti")}Hareket ekle</button>
      ${s.gunler.length>1?`<button class="btn s" data-act="gun-sil">${e+1}. günü sil</button>`:""}
      ${!t&&s.id!=="benim"?'<button class="btn s" data-act="program-sil">Programı sil</button>':""}
    </div>
    <p class="kucuk-yazi">Satıra dokun: set ve tekrar. ⋮⋮ tutup sürükle: sıra. Değişiklikler hemen kaydedilir; geçmişteki seanslar etkilenmez.</p>`}const fs={Göğüs:"bb_bench_press",Sırt:"bw_pullup",Omuz:"db_lateral_raise",Kol:"db_biceps_curl",Bacak:"bb_squat",Karın:"plank",Kardiyo:"cardio_bike"},U={kutuphane:{durum:a=>a.kutuphane,grup:"kgrup",eq:"keq",ara:"k-ara",liste:"kutuphane-liste"},secici:{durum:a=>a.secici,grup:"sgrup",eq:"seq",ara:"ara",liste:"secici-liste"}};export const gozAtMi=a=>!a.grup&&!a.eq&&!String(a.ara??"").trim();export function vurgula(a,s){const e=String(a??"");if(!s)return esc(e);const i=f(e);if(i.length!==e.length)return esc(e);let t="",n=0,r;for(;(r=i.indexOf(s,n))>=0;)t+=`${esc(e.slice(n,r))}<mark>${esc(e.slice(r,r+s.length))}</mark>`,n=r+s.length;return t+esc(e.slice(n))}function zs(a,s,e,i){const t=z(a),n=!!a.kas&&!a.equipment,l=(!!c.isinmaById[a.id]?[a.miktar,"ısınmada"]:[s==="secici"&&i?.has(a.id)&&"bu günde var",n?a.kas:a.mus,n?Y[a.yer]:S[a.equipment],a.ozel&&"özel"]).filter(Boolean).map(esc).join(" · "),o=`${la(a)}<span class="ad"><b>${vurgula(T(a),e)}</b>${t?`<span>${vurgula(t,e)}</span>`:""}<span>${l}</span></span>`;if(s!=="secici")return`<button class="satir" data-hareket="${esc(a.id)}">${o}<span class="durum ok">${d("ileri")}</span></button>`;const u=`<button class="satir" data-ekle="${esc(a.id)}">${o}<span class="durum ikon">${d("arti")}</span></button>`;return a.ozel?`<div class="satir-ozel">${u}<button class="ozel-sil" data-ozel-sil="${esc(a.id)}" aria-label="${adi(a)}: kütüphaneden sil">${d("sil")}</button></div>`:u}const f=a=>String(a??"").toLocaleLowerCase("tr");export function seciciSonuc(a){const s=f(a.ara).trim();return c.kutuphaneListesi().filter(e=>(!a.grup||e.grup===a.grup)&&(!a.eq||e.equipment===a.eq)&&(!s||[e.ad,e.en,e.tr,e.mus].some(i=>f(i).includes(s)))).sort((e,i)=>f(T(e)).localeCompare(f(T(i)),"tr"))}export function esnemeSonuc(a){if(a.eq||a.grup&&a.grup!=="Esneme")return[];const s=f(a.ara).trim();return c.ESNEME.filter(e=>!s||[e.ad,e.en,e.kas].some(i=>f(i).includes(s))).sort((e,i)=>f(T(e)).localeCompare(f(T(i)),"tr"))}export function isinmaSonuc(a){if(a.eq||a.grup&&a.grup!=="Isınma")return[];const s=f(a.ara).trim();return c.ISINMA.filter(e=>!s||[e.ad,e.en,e.not].some(i=>f(i).includes(s))).sort((e,i)=>f(T(e)).localeCompare(f(T(i)),"tr"))}const pa=new Set(["Esneme","Isınma"]);function Ss(a,s){const e=U[s],i=c.kutuphaneListesi(),t=l=>i.filter(o=>o.grup===l).length,n=(a.sonYapilanlar??[]).map(l=>c.byId[l]).filter(l=>l&&!l.arsiv),r=l=>s==="secici"?`data-ekle="${esc(l.id)}"`:`data-hareket="${esc(l.id)}"`;return`${n.length?`
    <div class="bolum-baslik"><h2>Son yaptıkların</h2><span>${n.length}</span></div>
    <div class="gz-son">${n.map(l=>`<button ${r(l)}><span class="k3" ${cizimsiz(l)?"":`data-kucuk="${esc(l.id)}"`} aria-hidden="true"></span>
      <b>${adi(l)}</b><small>${esc(l.grup??"")}</small></button>`).join("")}</div>`:""}
    <div class="bolum-baslik"><h2>Kas grupları</h2><span>dokun: o grubun hareketleri</span></div>
    <div class="gz-izgara">${G.filter(l=>t(l)).map(l=>`<button class="gz-kart" data-${e.grup}="${l}">
      <span class="g3" data-kucuk="${fs[l]}" aria-hidden="true"></span><b>${l}</b><small>${t(l)} hareket</small></button>`).join("")}
      ${s==="kutuphane"?`<button class="gz-kart" data-kgrup="Isınma"><span class="g3" data-kucuk="w_kol_cevirme" aria-hidden="true"></span>
        <b>Isınma</b><small>${c.ISINMA.length} hareket</small></button>
        <button class="gz-kart genis" data-kgrup="Esneme"><span class="g3" data-kucuk="es_cocuk_pozu" aria-hidden="true"></span>
        <b>Esneme</b><small>${c.ESNEME.length} esneme · tüm vücut rutini</small></button>`:""}</div>
    <div class="bolum-baslik"><h2>Ekipmana göre</h2></div>
    <div class="kaydir" role="group" aria-label="Ekipman">${Object.keys(S).filter(l=>i.some(o=>o.equipment===l)).map(l=>`<button class="cip" data-${e.eq}="${l}">${S[l]}</button>`).join("")}</div>`}function C(a,s){const e=U[s].durum(a);if(gozAtMi(e))return Ss(a,s);const i=f(e.ara).trim(),t=s==="secici"?new Set(c.programGetir(a.duzen?.id)?.gunler[a.duzen.gun]?.hareketler.map(g=>g.exId)??[]):null,n=pa.has(e.grup)?[]:seciciSonuc(e),r=s==="secici"?[]:esnemeSonuc(e),l=s==="secici"?[]:isinmaSonuc(e),o=n.length+r.length+l.length;if(!o)return'<div class="grup"><div class="ic"><p>Bulunamadı. Aşağıdan özel hareket olarak ekleyebilirsin.</p></div></div>';const u=g=>`<div class="liste">${g.map(k=>zs(k,s,i,t)).join("")}</div>`,p=i?`<p class="sayac">${o} sonuç${e.grup?"":" · tüm gruplarda"}</p>`:"";if(e.grup)return p+u(e.grup==="Esneme"?r:e.grup==="Isınma"?l:n);const $=G.map(g=>[g,n.filter(k=>k.grup===g)]).filter(([,g])=>g.length);return l.length&&$.push(["Isınma",l]),r.length&&$.push(["Esneme",r]),p+$.map(([g,k])=>`<div class="bolum-baslik"><h2>${esc(g)}</h2><span>${k.length}</span></div>${u(k)}`).join("")}export const seciciListeHTML=a=>C(a,"secici"),kutuphaneListeHTML=a=>C(a,"kutuphane");function ka(a,s){const e=U[s],i=e.durum(a),t=gozAtMi(i),n=i.grup||(i.eq?S[i.eq]:""),r=c.kutuphaneListesi(),l=`<button class="ib" data-${e.grup}="" aria-label="Kas gruplarına dön">${d("geri")}</button>`,o=`<button class="ib" data-act="secici-kapat" aria-label="Kapat">${d("carpi")}</button>`,u=s==="secici"?`<div class="ust">${n?l:o}<span class="tarih">Hareket ekle · ${a.duzen.gun+1}. Gün</span>${n?o:'<span class="ib-yer"></span>'}</div>`:n?`<div class="ust">${l}<span class="tarih">Hareketler</span><span class="ib-yer"></span></div>`:"",p=i.grup==="Esneme"?c.ESNEME.length:i.grup==="Isınma"?c.ISINMA.length:r.filter(k=>(!i.grup||k.grup===i.grup)&&(!i.eq||k.equipment===i.eq)).length,$=n?`<div class="sayfa-baslik"><h1>${esc(n)}</h1><p>${p} ${i.grup==="Esneme"?"esneme":i.grup==="Isınma"?"ısınma hareketi · seans başında günün kaslarına göre gelir":"hareket"}</p></div>`:s==="kutuphane"?`<div class="sayfa-baslik ust-bosluk"><h1>Hareketler</h1><p>${r.length} hareket · ${c.ISINMA.length} ısınma · ${c.ESNEME.length} esneme</p></div>`:"",g=i.grup&&!pa.has(i.grup)?Object.keys(S).filter(k=>r.some(b=>b.grup===i.grup&&b.equipment===k)):[];return`${u}${$}
    ${s==="kutuphane"&&i.grup==="Esneme"&&!i.ara.trim()?Qa(a):""}
    <label class="arama">${d("ara")}<input id="${e.ara}" type="search" value="${esc(i.ara)}" placeholder="${n?`${esc(n)} içinde ara`:"Ara: squat, göğüs, curl…"}"
      autocomplete="off" aria-label="Hareket ara"></label>
    ${g.length>1?`<div class="kaydir" role="group" aria-label="Ekipman">${["",...g].map(k=>`<button class="cip" aria-pressed="${i.eq===k}" data-${e.eq}="${k}">${k?S[k]:"Tümü"}</button>`).join("")}</div>`:""}
    <div id="${e.liste}">${C(a,s)}</div>
    <div class="grup"><button class="btn s" data-act="${s==="secici"?"ozel-ac":"ozel-ac-kutuphane"}">${d("arti")}${s==="secici"?"Listede yok mu? Özel hareket ekle":"Özel hareket ekle"}</button></div>
    ${s==="kutuphane"?sekmelerHTML("hareketler"):""}`}export const seciciHTML=a=>ka(a,"secici"),kutuphaneHTML=a=>ka(a,"kutuphane");function Ts(a,s,e,i){if(!a||!s||s.sayi<2)return"";const t=B.TURLER.filter(n=>a[n]);return t.length?`<div class="grup"><h2 class="etiket">Rekorların</h2><div class="ic"><div class="rekor-tablo">${t.map(n=>`<span>${B.TUR_AD[n]}<small>${i(a[n].at)} · ${q(a[n].set,e)}</small></span><span><b>${rekorDeger(n,a[n].deger,e)}</b></span>`).join("")}</div>
    ${a.tekrarlar.length>1?`<p class="rekor-ara">Ağırlık başına en çok tekrar</p><div class="tekrar-cipleri">${a.tekrarlar.map(n=>`<span><b>${fmt(n.agirlik)} ${e}</b> × ${n.tekrar}</span>`).join("")}</div>`:""}
    ${a.bir?'<p class="oz-kural">Tahmini 1 tekrar maksimumu en fazla 10 tekrarlı setlerden hesaplanır (Brzycki); ısınma setleri sayılmaz.</p>':""}</div></div>`:""}export const GUVENLIK_NOTU="Ağrı, baş dönmesi, göğüs ağrısı ya da olağandışı nefes darlığı olursa hemen dur. Bir sağlık sorunun varsa, gebeysen ya da uzun süredir hareketsizsen başlamadan önce hekimine danış. FSet tıbbi tavsiye vermez.",ilkAgirlikNotu=a=>a?.setType!=="weight_reps"||a.equipment==="bodyweight"?"":`İlk seansta hedef tekrarı temiz teknikle bitirip 2–3 tekrar daha yapabileceğin ağırlığı seç.${a.equipment==="barbell"?" Önce boş barla tekniği öğren.":""}`;const q=(a,s)=>a.type==="time"?`${fmt(a.seconds)} sn`:a.type==="cardio"?`${fmt(a.minutes)} dk`:a.weight?`${fmt(a.weight)} ${s} × ${a.reps??"—"}`:`${a.reps??"—"} tekrar`,ba=a=>a.target?.minutes!=null?`${a.target.minutes} dk`:a.target?.seconds!=null?`${a.sets} × ${a.target.seconds} sn`:`${a.sets} × ${a.target?.reps??"—"}`;export function hareketHTML(a){if(c.isinmaById[a.hareketId])return es(c.isinmaById[a.hareketId]);if(c.esnemeById[a.hareketId])return ss(c.esnemeById[a.hareketId],c.tutusSn(a.settings?.profil));const s=c.byId[a.hareketId];if(!s)return`<div class="ust"><button class="ib" data-act="to-hareketler" aria-label="Hareketlere dön">${d("geri")}</button></div>
    <div class="sayfa-baslik"><h1>Hareket bulunamadı</h1></div>`;const e=String(s.mus??"").split("·").map(r=>r.trim()).filter(Boolean),i=a.hareketGecmisi,t=a.settings?.unit??"kg",n=r=>h.fmtShort(new Date(r));return`
    <div class="ust"><button class="ib" data-act="to-hareketler" aria-label="Hareketlere dön">${d("geri")}</button>
      <span class="tarih">${esc(s.grup??"")}</span><span class="ib-yer"></span></div>
    <div class="sayfa-baslik"><h1>${adi(s)}</h1>${z(s)?`<p>${esc(z(s))}</p>`:""}</div>
    ${cizimsiz(s)?'<div class="grup"><div class="ic"><p>Özel hareket · çizimi yok.</p></div></div>':`<div class="buyuk3b"><div class="sahne3d" id="hareket3d" role="img" aria-label="${adi(s)} hareket çizimi; sürükleyerek döndürülür"></div>
         <img class="damga" src="icons/isaret.svg" alt="" width="30" height="17"><span class="ipucu">Sürükle: döndür · dokun: yeniden oynat</span></div>`}
    <p class="kunye">${[S[s.equipment],`Önerilen ${ba(s)}`].filter(Boolean).map(esc).join(" · ")}</p>
    ${e.length?`<div class="grup"><h2 class="etiket">Çalışan kaslar</h2><div class="ic"><div class="kaslar">${e.map((r,l)=>`<span class="kas${l<2?" ana":""}">${esc(r)}</span>`).join("")}</div></div></div>`:""}
    ${s.fayda?`<div class="grup"><h2 class="etiket">Faydası</h2><div class="ic"><p>${esc(s.fayda)}</p></div></div>`:""}
    <div class="grup"><h2 class="etiket">Geçmişin</h2><div class="ic">${i?`
      <div class="ozet-iki">
        <div><small>Son · ${n(i.son.at)}</small><b>${q(i.son.set,t)}</b></div>
        <div><small>En iyi · ${n(i.enIyi.at)}</small><b>${q(i.enIyi.set,t)}</b></div></div>
      <p class="kucuk-yazi">${i.sayi} seansta yapıldı</p>
      ${i.not?`<p class="seans-notu">${d("liste")}<span>${esc(i.not.metin)} <small>· ${n(i.not.at)}</small></span></p>`:""}`:"<p>Bu hareketi henüz kaydetmedin.</p>"}</div></div>
    ${Ts(a.hareketRekor,i,t,n)}
    ${s.steps?.length?`<div class="grup"><h2 class="etiket">Nasıl yapılır</h2><div class="ic"><ol class="adimlar">${s.steps.map(r=>`<li>${esc(r)}</li>`).join("")}</ol></div></div>`:""}
    ${s.tip?`<div class="grup"><h2 class="etiket">Dikkat</h2><div class="ipucu-kutu">${esc(s.tip)}</div></div>`:""}
    ${ilkAgirlikNotu(s)?`<p class="kucuk-yazi grup-alti">${ilkAgirlikNotu(s)}</p>`:""}
    <p class="kucuk-yazi grup-alti">${GUVENLIK_NOTU}</p>
    <div class="grup eylemler"><button class="btn p" data-act="hareket-ekle-ac">${d("arti")}Programa ekle</button>
      ${s.ozel?`<button class="btn s" data-ozel-sil="${esc(s.id)}">${d("sil")}Hareketi sil</button>`:""}</div>
    ${sekmelerHTML("hareketler")}`}export function hareketEkleHTML(a){const s=c.byId[a.hareketId],e=c.programGetir(a.hareketEkle?.programId)??c.aktifProgram();return s?`
    <div class="ust"><button class="ib" data-act="hareket-ekle-kapat" aria-label="Kapat">${d("carpi")}</button>
      <span class="tarih">Programa ekle</span><span class="ib-yer"></span></div>
    <div class="sayfa-baslik"><h1>${adi(s)}</h1><p>Hangi programın hangi gününe?</p></div>
    <div class="grup"><h2 class="etiket">Program</h2><div class="kaydir" role="group" aria-label="Program">${c.programListesi().map(i=>`<button class="cip" aria-pressed="${i.id===e.id}" data-he-prg="${esc(i.id)}">${esc(i.ad)}</button>`).join("")}</div></div>
    <div class="grup"><h2 class="etiket">Gün</h2><div class="gun-secim">${e.gunler.map((i,t)=>`
      <button class="satir" data-he-gun="${t}">
        <span class="ad"><b>${c.gunEtiketi(t,e).kisa}</b><span>${[c.gunEtiketi(t,e).kaslar,`${i.hareketler.length} hareket`,i.hareketler.some(n=>n.exId===s.id)&&"bu günde var"].filter(Boolean).map(esc).join(" · ")}</span></span>
        <span class="durum ikon">${d("arti")}</span>
      </button>`).join("")}</div></div>
    <p class="kucuk-yazi grup-alti">${esc(ba(s))} hedefiyle eklenir; programda değiştirebilirsin.</p>`:""}export function ozelHTML(a){const s=a.ozelForm,e=(i,t,n)=>Object.entries(t).map(([r,l])=>`<button class="cip" aria-pressed="${n===r}" data-${i}="${r}">${l}</button>`).join("");return`
    <div class="ust"><button class="ib" data-act="ozel-kapat" aria-label="Hareket seçiciye dön">${d("geri")}</button>
      <span class="tarih">Özel hareket</span><span class="ib-yer"></span></div>
    <div class="sayfa-baslik"><h1>Özel hareket</h1>
      <p>Listede olmayan hareketi kendin ekle. Çizimi olmaz; kaydı ve geçmişi diğerleri gibi tutulur.</p></div>
    <div class="form-alan"><label for="o-ad">Adı</label>
      <input id="o-ad" class="metin" value="${esc(s.ad)}" maxlength="60" autocomplete="off" placeholder="ör. Smith makinesinde squat"></div>
    <div class="form-alan"><span class="etiket">Nasıl kaydedilsin?</span>
      <div class="cip-izgara">${e("otur",ga,s.setType)}</div></div>
    <div class="form-alan"><span class="etiket">Ekipman</span>
      <div class="cip-izgara">${e("oeq",S,s.equipment)}</div></div>
    <div class="form-alan"><span class="etiket">Çalışan kas</span>
      <div class="cip-izgara">${e("ogrup",Object.fromEntries(G.map(i=>[i,i])),s.grup)}</div></div>
    <div class="alt"><button class="btn p" data-act="ozel-kaydet">Ekle ve güne koy</button></div>`}
