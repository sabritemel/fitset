/*! © 2026 Sabri Temel — tüm hakları saklıdır. Kullanım koşulları: kosullar.html */
import*as c from"./session.js";import*as h from"./schedule.js";import{dayKey as U}from"./store.js";import{mmss as w}from"./timer.js";import*as z from"./ilerleme.js";import*as I from"./rekorlar.js";import{GRUPLAR as A,EKIPMAN as f,SET_TURU as ta}from"./program.js";import{HAZIR as O,SORULAR as na,oner as ra,hazirBul as Y}from"./data/hazir.js";import{AD as C,SURUM as la}from"./marka.js";import*as g from"./avatar.js";import{KURULUM_TARIFI as da,bantGoster as oa}from"./kurulum.js";import*as R from"./hazirlik.js";export const fmt=(a,s=2,e=0)=>a==null||!Number.isFinite(+a)?"—":(+a).toLocaleString("tr-TR",{minimumFractionDigits:e,maximumFractionDigits:s}),esc=a=>String(a).replace(/[&<>"']/g,s=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[s]);const l=a=>`<svg class="i" aria-hidden="true"><use href="#i-${a}"/></svg>`;export const adi=a=>esc(a.ad??a.tr??a.en??"");const ca=a=>a.en&&a.en!==(a.ad??a.tr)?`<span lang="en">${esc(a.en)}</span>`:"";export const cizimsiz=a=>!!(a.ozel||a.bilinmeyen),setLabel=a=>a.type==="time"?`${fmt(a.seconds)} sn`:a.type==="cardio"?`${fmt(a.minutes)} dk`:a.weight==null?`${fmt(a.reps)} tekrar`:`${fmt(a.weight)} × ${fmt(a.reps)}`;const q=(a,s)=>a.type==="time"?`${fmt(a.seconds)} sn`:a.type==="cardio"?`${fmt(a.minutes)} dk`:a.weight==null?`${fmt(a.reps)} tekrar`:`${fmt(a.weight)} ${s}`;export function lastTime(a,s,e,i=!1){const n=s[a.id];if(!n)return i?"Bu hareketi ilk kez yapıyorsun.":"Bu hareketin ilk kaydı.";const t=n.sets.map(setLabel),d=t.every(p=>p===t[0])?`<b>${t[0]}</b> · ${t.length} set`:`<b>${t.join(" · ")}</b>`,o=n.sets.at(-1)?.rir;return`Geçen sefer · ${h.relativeLabel(new Date(n.at))} · ${d}${o!=null?` · son set RIR ${o}`:""}`}export function hazirlikGoster(a){const{session:s,settings:e}=a;return a.hazirlik?!0:e.hazirlikSor!==!1&&e.hazirlikGunu?.d!==U()&&!c.hasAnySet(s)&&!s.warmupDone&&!s.hazirlik}function ua(a){const s=a.session.hazirlik?.azalan;if(s?.length&&!a.hazirlik)return`<div class="not hafif-not">${l("nabiz")}<span>Bugün ${s.length} harekette birer set az
      (toparlanma kontrolü). <button class="bag" data-act="hz-geri">Programdaki gibi yap</button></span></div>`;if(!hazirlikGoster(a))return"";const e=a.hazirlik?.cevap??{},i=R.degerlendir(e),n=R.SORULAR.map(r=>`<div class="hz-soru"><p>${esc(r.soru)}</p>
      <div class="segment" role="group" aria-label="${esc(r.soru)}">${r.secenekler.map(([d,o])=>`<button data-hz="${r.id}:${d}" aria-pressed="${e[r.id]===d}">${o}</button>`).join("")}</div></div>`).join(""),t=i?`<div class="hz-sonuc ${i.duzey}" role="status"><b>${i.baslik}</b><p>${i.metin}</p>
      ${i.duzey==="hafif"?`<div class="cift dikey"><button class="btn p" data-act="hz-hafif">Hareketlerde birer set az yap</button>
             <button class="btn s" data-act="hz-tamam">Programdaki gibi devam et</button></div>`:`<button class="btn ${i.duzey==="uy"?"p":"s"}" data-act="hz-tamam">Tamam</button>`}</div>`:"";return`<div class="grup hazirlik"><h2 class="etiket">Bugün nasılsın?</h2><div class="ic">
      ${n}${t}
      ${i?"":'<button class="bag hz-gec" data-act="hz-gec">Bugün sorma</button>'}
      <p class="kucuk-yazi">${esc(R.KART_NOTU)}</p>
    </div></div>`}const pa=a=>a?`
  <div class="grup carry"><div class="ic">
    <p class="baslik-satir">${c.gunEtiketiSeans(a.session).kisa} yarım kaldı</p>
    <p class="alt-satir">${h.relativeLabel(new Date(a.session.finishedAt??a.session.startedAt))}
      · ${a.yapilan}/${a.toplam} hareket</p>
    <p>${a.kalan.map(adi).join(" · ")}</p>
    <div class="cift dikey">
      <button class="btn s" data-act="carry-skip">Sıradakine geç</button>
      <button class="btn p" data-act="carry-go">Bu güne devam et</button>
    </div>
  </div></div>`:"",ma=a=>{const{session:s,dayIndex:e,onerilen:i,gunSecici:n}=a;if(!n)return"";const t=c.canSwitchDay(s),r=c.gunEtiketi(e).kisa;return t.ok?`<div class="grup picker"><h2 class="etiket">Bugün ne yapıyorsun?</h2><div class="ic">
    <div class="picks">${c.allDays().map(o=>{const{kisa:p,kaslar:m}=c.gunEtiketi(o.dayIndex);return`<button class="pick" data-gun-sec="${o.dayIndex}" aria-pressed="${o.dayIndex===e}">
      <span class="pick-ad">${p}</span><span class="pick-kas">${esc(m)}</span>
      ${o.dayIndex===i?'<span class="pick-not">program önerisi</span>':""}
    </button>`}).join("")}</div>
    <p>${r}'ü telefonsuz yaptıysan işaretle: kayda geçer, sıra sonraki güne atlar.
      Ağırlıklar bilinmediği için hacme ve "geçen sefer"e karışmaz.</p>
    <button class="btn s" data-act="gun-yapildi">${r}'ü yapıldı işaretle</button>
  </div></div>`:`<div class="grup picker"><div class="ic">
    <p>Bugün set girdin; günü değiştirmek bu setleri yanlış güne bağlardı. Önce <b>Seansı bitir</b>
      ya da Ayarlar'dan <b>Bugünü sıfırla</b>.</p></div></div>`};function $a(a,s,e,i){const n=s.sets.filter(r=>!r.warmup).at(-1);if(n)return`<b>${q(n,i.unit)}</b>${s.calisma}/${s.hedef}`;const t=e?.sets?.at(-1);return t?`<b>${q(t,i.unit)}</b>geçen`:`<b>${c.repsLabel(a,i)}</b>hedef`}const ba=a=>a.tamam?`<span class="durum tamam">${l("tik")}</span>`:a.calisma>0?`<span class="durum kismi" style="--p:${Math.round(a.calisma/a.hedef*100)}"></span>`:'<span class="durum bos"></span>';function ka(a,s,e){if(s.tur==="isinma")return`<button class="btn p" data-act="warmup">Isınmaya başla${l("ileri")}</button>`;if(s.tur==="bitir")return'<button class="btn p" data-act="finish">Seansı bitir</button>';if(s.tur==="soguma")return`<div class="cift"><button class="btn s" data-act="finish" aria-label="Seansı bitir">Bitir</button>
    <button class="btn p" data-act="cooldown">Soğumaya başla${l("ileri")}</button></div>`;const i=c.hasAnySet(a.session),n=e[s.idx],t=s.basladi?"Devam et":i?"Sıradaki":"Başla",r=`<button class="btn p iki" data-go="${s.idx}" aria-label="${t}: ${adi(n)}">
      <span><small>${t}</small><b>${adi(n)}</b></span></button>`;return i?`<div class="cift"><button class="btn s" data-act="finish" aria-label="Seansı bitir">Bitir</button>${r}</div>`:r}export function listHTML(a){const{session:s,dayIndex:e,settings:i,status:n,yarim:t,oncekiYapilan:r,gunSecici:d,lastPerf:o={}}=a,p=c.exercisesFor(e),m=c.progress(s,e,i),$=c.summaryVolume(s),b=Math.max(0,Math.round((Date.now()-s.startedAt)/6e4)),{kisa:k,kaslar:u}=c.gunEtiketi(e),v=c.siradakiEylem(s,e,i),S=v.tur==="hareket"?v.idx:-1,j=p.map((M,F)=>{const H=c.exerciseProgress(s,M,i),N=r?.has(M.id),_=[H.tamam&&"bitti",F===S&&"simdi",N&&!H.calisma&&"onceki"].filter(Boolean).join(" ");return`<button class="satir${_?" "+_:""}" data-go="${F}">
      ${ba(H)}
      <span class="ad"><b>${adi(M)}</b>${N&&!H.calisma?"<span>geçen sefer yapıldı</span>":ca(M)}</span>
      <span class="sag">${$a(M,H,o[M.id],i)}</span>
    </button>`}).join(""),B=`<button class="satir${s.warmupDone?" bitti":""}" data-act="warmup">
    <span class="durum ${s.warmupDone?"tamam":"ikon"}">${l(s.warmupDone?"tik":"alev")}</span>
    <span class="ad"><b>Isınma</b><span>${c.warmupFor(e).length+1} adım · ${c.isinmaSuresi(e)}</span></span>
    <span class="sag">${s.warmupDone?"yapıldı":"başla"}</span>
  </button>`,T=c.finisherFor(e),[E,ea]=T?T.h.split(" — "):[],ia=T?`<div class="satir">
    <span class="durum ikon">${l("nabiz")}</span>
    <span class="ad"><b>${E}</b><span>${T.p}</span></span>
    <span class="sag"><b>${ea??""}</b>bitişte</span>
  </div>`:"";return`
    <div class="ust liste-ust">
      <span class="tarih">${n.label}</span>
      <span class="tarih">${esc(c.aktifProgram().ad)}</span>
    </div>
    <button class="cip gun-cip" data-act="gun-ac" aria-expanded="${!!d}" aria-label="Günü değiştir: ${k}">
      ${k}${l(d?"yukari":"asagi")}</button>
    <div class="gun-baslik"><h1>${esc(u)}</h1></div>
    ${kurulumBantHTML(a)}
    ${ua(a)}
    ${n.isTrainingDay?"":`<div class="not">${l("takvim")}<span>Program günü değil; yine de kaydedebilirsin.
      Sıradaki antrenman <b>${n.next?h.fmtShort(n.next):"—"}</b>.</span></div>`}
    ${ma(a)}
    <div class="ozet">
      <div><b>${m.done}<small>/${m.total}</small></b><span>Set</span></div>
      <div><b>${fmt($.kg,0)}<small>${i.unit}</small></b><span>Hacim</span></div>
      <div><b>${b}<small>dk</small></b><span>Süre</span></div>
    </div>
    ${pa(t)}
    ${p.length?`<div class="liste">${B}${j}${ia}${Ka(s,c.cooldownFor(e,i?.profil))}</div>
    <div class="alt alt-sekmeli">${ka(a,v,p)}</div>`:`<div class="grup"><div class="ic"><p>Bu günde henüz hareket yok.</p>
        <button class="btn s" data-program-ac="${esc(c.aktifProgram().id)}">Programı düzenle</button></div></div>`}
    ${sekmelerHTML("bugun")}`}function va(a,s,e=""){if(cizimsiz(a))return`<div class="fig"><div class="sahne3d cizimsiz" role="img" aria-label="${adi(a)}: çizim yok">
      ${l("figur")}<span>${a.ozel?"Özel hareket · çizimi yok":"Bu hareketin tanımı bulunamadı"}</span></div></div>`;if(a.hold){const i=Math.max(0,a.variants.findIndex(n=>n.ok));return s.calisma>=1?`<div class="fig">
        <div class="sahne3d" data-varyant="${i}" role="img" aria-label="${adi(a)}: doğru duruş"></div>
        <p class="fig-not">${l("tik")}${a.variants[i].note} · hatalar ? panelinde</p>${e}
      </div>`:`<div class="variants">${a.variants.map((n,t)=>`<figure class="${n.ok?"ok":""}">
        <div class="sahne3d" data-varyant="${t}" aria-hidden="true"></div>
        <figcaption><b>${l(n.ok?"tik":"carpi")}${esc(n.label)}</b><span>${esc(n.note)}</span></figcaption>
      </figure>`).join("")}</div>`}return`<div class="fig${a.setType==="weight_reps"?" zemin":""}">
    <div class="sahne3d" id="fig3d" role="img" aria-label="${adi(a)} hareket çizimi; sürükleyerek döndürülür"></div>${e}
  </div>`}const ga={agir:"en ağır set",bir:"tahmini 1RM",hacim:"set hacmi",tekrar:"en çok tekrar",sure:"en uzun süre"};function ha(a,s){const e=a.rozet;if(!e||e.exId!==s.id||Date.now()>e.bitis)return"";const i=e.tur==="tekrar"?fmt(e.simdi):rekorDeger(e.tur,e.simdi,a.settings.unit);return`<div class="rekor-rozet" role="status">${l("yildiz")}<span>Yeni rekor · <em>${ga[e.tur]} ${i}</em></span></div>`}function ya(a,s){const e=a.rirSor;if(!e||e.exId!==s.id||Date.now()>e.bitis)return"";const i=c.effective(s,a.settings).rir;return`<div class="rir-sor" role="group" aria-label="Bu sette kaç tekrar daha yapabilirdin?">
      <span>Kaç tekrar daha yapabilirdin?</span>
      <div class="rir-cipler">${Z.map(n=>`<button class="cip${n===i?" hedef":""}" data-rir="${n}" aria-label="RIR ${n}${n===4?" ya da daha çok":""}${n===i?" (hedef)":""}">${n===4?"4+":n}</button>`).join("")}
        <button class="rir-kapat" data-rir="x" aria-label="Sorma, kapat">${l("carpi")}</button></div>
    </div>`}function fa(a,s){const e=s.session?.entries.find(n=>n.exerciseId===a.id)?.note??"",i=s.lastPerf?.[a.id]?.not;return`<div class="not-alani">
      <label class="etiket" for="ex-not">Notun</label>
      <textarea id="ex-not" data-not="${esc(a.id)}" maxlength="${c.NOT_SINIR}" rows="2"
        placeholder="${i?esc(i):"Ör. koltuk 4. delik · sol omuz biraz gergin"}">${esc(e)}</textarea>
      ${i?'<p class="kucuk-yazi">Gri yazı son notun; bugüne kaydedilmez. Bugün için yeni not yazabilirsin.</p>':""}
    </div>`}function za(a,s){const e=c.effective(a,s.settings);return`<section class="sheet" id="sheet" aria-hidden="true" inert aria-label="Hedef ve anlatım">
      <button class="grab" data-act="sheet-close" aria-label="Kapat"></button>
      <div class="sheet-in">
        <h2>${adi(a)}</h2>
        ${a.en?`<p class="alt-baslik" lang="en">${esc(a.en)}</p>`:""}
        ${fa(a,s)}
        ${Da(a,s)}
        ${oneriHTML(a,s)}
        <div class="goal">
          <div class="goal-hd">
            <span class="etiket">Hedef · ${esc(c.aktifProgram().ad)}</span>
            ${e.edited?'<button class="cip" data-act="goal-reset">Programa dön</button>':""}
          </div>
          ${Ra(a,s)}
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
        ${a.tip?`<h3 class="tip-bas">${l("uyari")}Dikkat</h3>
        <p>${esc(a.tip)}</p>`:""}
        ${ilkAgirlikNotu(a)?`<p class="kucuk-yazi">${ilkAgirlikNotu(a)}</p>`:""}
        <p class="kucuk-yazi">${GUVENLIK_NOTU}</p>
      </div>
    </section>`}const Sa=a=>{const s=c.exercisesFor(a.dayIndex)[a.idx];return s?c.dinlenmeSuresi(s,a.settings):a.settings.restSeconds};export function gezinmeHTML(a,s=null,e=0){if(s===null){const i=c.exercisesFor(a.dayIndex).length-1;return`<div class="gezinme" id="gezinme">
      <button data-act="prev" ${a.idx===0?"disabled":""} aria-label="Önceki hareket">${l("geri")}Önceki</button>
      <button class="dinlenme" data-act="rest">${l("saat")}Dinlenme ${Sa(a)} sn</button>
      <button data-act="next" ${a.idx===i?"disabled":""} aria-label="Sonraki hareket">Sonraki${l("ileri")}</button>
    </div>`}return`<div class="gezinme run" id="gezinme">
    <button data-act="rest-plus" aria-label="Dinlenmeye 30 saniye ekle">+30</button>
    <div class="dinlenme" role="timer" aria-label="Kalan dinlenme">
      <b id="rest-time">${w(s)}</b>
      <span class="bar"><i id="rest-bar" style="transform:scaleX(${e?(s/e).toFixed(3):0})"></i></span>
    </div>
    <button data-act="rest-skip">Geç</button>
  </div>`}const Ta={dumbbell:"tek dambıl",barbell:"bar dahil",machine:"makinede seçili"};export const BAR_KG=20;const Ma=[25,20,15,10,5,2.5,1.25];export function plakaYazi(a,s,e){if(a.equipment==="bodyweight")return+s>0?"ek ağırlık":"ek ağırlık · 0 = yalnız vücut";if(a.equipment!=="barbell")return Ta[a.equipment]??"";const i=+s;if(e!=="kg"||s==null||s===""||!Number.isFinite(i))return"bar dahil";if(i<BAR_KG)return`boş bar ${BAR_KG} kg`;let n=(i-BAR_KG)/2;const t=[];for(const r of Ma)for(;n>=r-1e-9;)t.push(r),n-=r;return n>1e-9?"bar dahil":t.length?`her yana ${t.map(r=>fmt(r)).join(" + ")}`:"yalnız bar"}export const tekrarAlt=(a,s)=>{const e=c.effective(a,s.settings);return`Hedef <b>${e.repsMin?`${e.repsMin}-`:""}${fmt(e.reps)}</b>`};const Ha=a=>`Hedef <b>${a}</b>`;export function kaydetEtiketi(a,s,e){return a.setType==="time"?"Süreyi kaydet":e.draft.warmup?"Isınma setini kaydet":"Seti kaydet"}export function setEtiketi(a,s){if(a.tamam)return"Bütün setler tamam";if(s.draft.warmup)return"<b>Isınma</b> seti · sete sayılmaz";const e=a.sets.filter(i=>i.warmup).length;return`<b>${a.calisma+1}.</b> set · ${a.hedef} setten${e?` · ısınma ×${e}`:""}`}function Ia(a,s,e){const i=Math.max(a.hedef,a.calisma),n=s.rekorTaban?.[e?.id],t=a.sets.filter(o=>!o.warmup),r=o=>!!n&&!!I.setRekoru(t[o],[...n,...t.slice(0,o)]),d=Array.from({length:i},(o,p)=>p<a.calisma?r(p)?`<i class="bitti rekor">${l("yildiz")}</i>`:`<i class="bitti">${l("tik")}</i>`:`<i class="${p===a.calisma?"simdi":""}">${p+1}</i>`).join("");return`<div class="set-ilerleme"><span id="set-etiket">${setEtiketi(a,s)}</span><span class="cubuk" aria-hidden="true">${d}</span></div>`}const D=({ad:a,deger:s,alt:e,artir:i,azalt:n,etiket:t,sinif:r="",azaltPasif:d=!1})=>`
  <div class="sutun ${r}">
    <button class="ok" ${i} aria-label="${t} artır">${l("yukari")}</button>
    <span class="etk">${a}</span>
    ${s}
    <span class="s-alt">${e}</span>
    <button class="ok" ${n} aria-label="${t} azalt"${d?" disabled":""}>${l("asagi")}</button>
  </div>`;function Aa(a,s,e){const{settings:i}=e,n=c.effective(a,i),t=z.agirlikAdimi(a,i)??z.GIRIS_ADIMI_YEDEK,r=e.draft.weight,d=i.unit,o=r==null?"":String(r);return`<div class="sutunlar">
    ${D({ad:"SET",etiket:"Bugünkü set sayısını",deger:`<b class="n">${s.hedef}</b>`,alt:Ha(n.sets),artir:'data-act="set-arti"',azalt:'data-act="set-eksi"',azaltPasif:s.hedef<=s.calisma+1})}
    ${D({ad:"TEKRAR",etiket:"Tekrarı",deger:`<input class="n" type="number" inputmode="numeric" step="1" min="1" id="f-reps" value="${e.draft.reps??n.reps??""}" aria-label="Bu setin tekrarı">`,alt:`<span id="tk-alt">${tekrarAlt(a,e)}</span>`,artir:'data-step="reps:1"',azalt:'data-step="reps:-1"'})}
    ${D({ad:"AĞIRLIK",etiket:"Ağırlığı",sinif:"genis",deger:`<span class="n-kap"><input class="n${o.length>=5?" uzun":""}" type="number" inputmode="decimal" step="${t}" min="0"
               id="f-weight" value="${o}" placeholder="0" aria-label="Ağırlık (${d})"><small>${d}</small></span>`,alt:`<span id="plaka-yazi">${plakaYazi(a,r,d)}</span>`,artir:`data-step="weight:${t}"`,azalt:`data-step="weight:${-t}"`})}
  </div>`}const V=(a,s)=>`<p class="gecen">${l("gecmis")}<span>${lastTime(a,s.lastPerf,s.settings.unit,c.exerciseProgress(s.session,a,s.settings).sets.length>0)}</span></p>`;function La(a,s,e){const i=c.effective(a,e.settings),n=a.setType==="time"?`${s.hedef} × ${fmt(i.seconds)} sn`:a.setType==="cardio"?`${fmt(i.minutes)} dk`:`${s.hedef} × ${i.repsMin?`${i.repsMin}-`:""}${fmt(i.reps)}${i.rir!=null?` · RIR ${i.rir}`:""}`,t=e.lastPerf[a.id]?.sets?.filter(d=>!d.warmup)??[],r=t.length?t.reduce((d,o)=>(o.weight??o.seconds??o.minutes??0)>(d.weight??d.seconds??d.minutes??0)?o:d):null;return`Hedef ${n}${r?` · geçen ${setLabel(r)}`:""}`}const ja=(a,s,e,i,n,t="")=>`
  <div class="giris">
    <div class="deger">
      <span class="etiket">${i}</span>
      <div><input type="number" inputmode="decimal" step="${e}" min="0"
             id="f-${a}" value="${s??""}" placeholder="0" aria-label="${i} (${n})"><em>${n}</em></div>
      ${t}
    </div>
    <div class="stp">
      <button data-step="${a}:${e}" aria-label="${fmt(e)} ${n} artır">+${fmt(e)}</button>
      <button data-step="${a}:${-e}" aria-label="${fmt(e)} ${n} azalt">−${fmt(e)}</button>
    </div>
  </div>`;function Ba(a,s,e){const i=c.effective(a,e.settings);if(a.setType==="time"){const n=e.draft.seconds??i.seconds;return`<div class="clock" id="clock">
      <span class="etiket">Hedef süre</span>
      <div class="crow">
        <button class="cadj" data-act="clock-minus" aria-label="5 saniye azalt">−5</button>
        <span class="time" id="clock-time" role="timer">${w(n)}</span>
        <button class="cadj" data-act="clock-plus" aria-label="5 saniye ekle">+5</button>
      </div>
    </div>`}return a.setType==="cardio"?ja("minutes",e.draft.minutes??i.minutes,5,"Süre","dk",V(a,e)):Aa(a,s,e)}export const SEMALAR=[[3,8],[3,10],[3,12],[4,8],[4,6],[5,5]];const Ea=[15,20,30,45,60,90];export const noktalarHTML=(a,s,e="")=>`<div class="noktalar-set" role="radiogroup" aria-label="Set sayısı">${Array.from({length:10},(i,n)=>`<button role="radio" aria-checked="${n+1===s}" class="${n<s?"on":""}" data-${a}="${e}${n+1}" aria-label="${n+1} set"><i></i></button>`).join("")}</div>`,tekrarSeridiHTML=(a,s,e="")=>`<div class="serit-t" role="radiogroup" aria-label="Tekrar">${Array.from({length:Math.max(30,s??0)},(i,n)=>n+1).map(i=>`<button role="radio" aria-checked="${i===s}" data-${a}="${e}${i}">${i}</button>`).join("")}</div>`,semalarHTML=(a,s,e,i="")=>`<div class="semalar" role="group" aria-label="Hazır şema">${SEMALAR.map(([n,t])=>`<button class="cip" aria-pressed="${n===s&&t===e}" data-${a}="${i}${n}:${t}">${n} × ${t}</button>`).join("")}</div>`;const Z=[0,1,2,3,4],wa=[60,90,120,180,240];export function yontemHTML(a,s,e="",i=60,{tekrarli:n=!0}={}){const t=(o,p,m,$,b=m)=>`<button class="cip" aria-pressed="${$}" data-${a}="${e}${o}:${p}" aria-label="${esc(b)}">${m}</button>`,r=(o,p,m)=>`<div class="g-alan"><div class="g-etk"><span>${o}</span><b>${p}</b></div>
      <div class="semalar" role="group" aria-label="${o}">${m}</div></div>`;let d="";if(n&&s.reps>1){const o=[...new Set([s.reps-4,s.reps-3,s.reps-2,...s.repsMin?[s.repsMin]:[]])].filter(p=>p>=1&&p<s.reps).sort((p,m)=>p-m);d+=r("Tekrar aralığı",s.repsMin?`${s.repsMin}-${s.reps}`:"tek sayı",t("repsMin","x","Tek sayı",!s.repsMin)+o.map(p=>t("repsMin",p,`${p}-${s.reps}`,s.repsMin===p,`${p} ile ${s.reps} arası`)).join("")),d+=r("Hedef RIR",s.rir!=null?`${s.rir}`:"yok",t("rir","x","Yok",s.rir==null,"Hedef RIR yok")+Z.map(p=>t("rir",p,p===4?"4+":`${p}`,s.rir===p,`RIR ${p}`)).join(""))+'<p class="g-not">RIR: setin sonunda kaç temiz tekrar daha yapabilirdin. 2 = iki tekrar daha çıkardı.</p>'}return d+=r("Dinlenme",`${s.dinlenme??i} sn`,t("dinlenme","x",`Genel (${i} sn)`,s.dinlenme==null,"Genel ayar")+wa.map(o=>t("dinlenme",o,`${o} sn`,s.dinlenme===o)).join("")),d}function Ra(a,s){const{settings:e}=s,i=c.effective(a,e),n=z.agirlikAdimi(a,e)??z.GIRIS_ADIMI_YEDEK,t=(o,p,m,$)=>`<div class="gf">
      <span class="etiket">${$}</span>
      <div class="gbox">
        <button data-gstep="${o}:${-m}" aria-label="${$} azalt">${l("eksi")}</button>
        <input type="number" inputmode="decimal" step="${m}" min="0" id="g-${o}" value="${p??""}" placeholder="—" aria-label="${$}">
        <button data-gstep="${o}:${m}" aria-label="${$} artır">${l("arti")}</button>
      </div>
    </div>`,r=`<div class="g-alan"><div class="g-etk"><span>Set sayısı</span><b id="g-sets-yaz">${i.sets}</b></div>
      ${noktalarHTML("gset",i.sets)}<input type="hidden" id="g-sets" value="${i.sets}"></div>`,d=(o={})=>`<div id="g-yontem">${yontemHTML("g-yontem",i,"",e.restSeconds,o)}</div>`;return a.setType==="time"?`${r}
    <div class="g-alan"><div class="g-etk"><span>Süre</span><b id="g-seconds-yaz">${fmt(i.seconds)} sn</b></div>
      <div class="semalar" role="group" aria-label="Süre">${[...new Set([...Ea,i.seconds])].sort((o,p)=>o-p).map(o=>`<button class="cip" aria-pressed="${o===i.seconds}" data-gsn="${o}">${o} sn</button>`).join("")}</div>
      <input type="hidden" id="g-seconds" value="${i.seconds}"></div>${d({tekrarli:!1})}`:a.setType==="cardio"?`${r}<div class="goal-grid">${t("minutes",i.minutes,5,"Süre (dk)")}</div>`:`<div class="g-alan"><div class="g-etk"><span>Hazır şema</span></div>${semalarHTML("gsema",i.sets,i.reps)}</div>
    ${r}
    <div class="g-alan"><div class="g-etk"><span>Tekrar</span><b id="g-reps-yaz">${i.reps}</b></div>
      ${tekrarSeridiHTML("greps",i.reps)}<input type="hidden" id="g-reps" value="${i.reps}"></div>
    ${d()}
    <div class="goal-grid">${t("weight",i.weight,n,`Planlanan ağırlık (${e.unit})`)}</div>`}function Da(a,s){return a.setType==="cardio"?"":`<div class="set-satir">
      <span class="etiket"><span id="warm-ad">Isınma seti</span><small id="warm-not">Bu set hacme ve "geçen sefer"e karışmaz</small></span>
      <button class="cip" id="warm" data-act="warm" role="switch" aria-checked="${!!s.draft.warmup}"
              aria-labelledby="warm-ad" aria-describedby="warm-not">${s.draft.warmup?"Açık":"Kapalı"}</button>
    </div>`}export function warmupHTML(a){const{dayIndex:s}=a,e=c.warmupFor(s),{kaslar:i}=c.gunEtiketi(s),n=e.map(t=>`<div class="satir yalin" data-warm="${t.id}">
      <span class="ad"><b>${esc(t.ad)}</b><span>${esc(t.not)}</span></span>
      <span class="sag"><b>${esc(t.miktar)}</b></span>
      <div class="mini sahne3d" data-anim="${t.id}" aria-hidden="true"></div>
    </div>`).join("");return`
    <div class="ust"><button class="ib" data-act="to-list" aria-label="Listeye dön">${l("geri")}</button><span class="ib-yer"></span></div>
    <div class="sayfa-baslik"><h1>Isınma</h1><p>${esc(i)} · ${c.isinmaSuresi(s)} · sete sayılmaz</p></div>
    <div class="liste dagit">
      <div class="satir">
        <span class="durum ikon">${l("nabiz")}</span>
        <span class="ad"><b>${c.KARDIYO.ad}</b><span>${c.KARDIYO.not}</span></span>
        <span class="sag"><b>${c.KARDIYO.miktar}</b></span>
      </div>
      ${n}
    </div>
    <div class="alt"><button class="btn p" data-act="warmup-done">Isınma tamam, 1. harekete geç${l("ileri")}</button></div>`}const X=a=>a.tek?`${a.sn} + ${a.sn} sn`:`${a.sn} sn`;export const esDakika=a=>`~${Math.max(1,Math.round(a/60))} dk`;const G={ayakta:"ayakta",minder:"minderde"},Ga={poz:"Pozu al",tut:"Tut",taraf:"Taraf değiştir"};function Ka(a,s){if(!s.length)return"";const e=!!a.cooldownDone;return`<button class="satir${e?" bitti":""}" data-act="cooldown">
    <span class="durum ${e?"tamam":"ikon"}">${l(e?"tik":"figur")}</span>
    <span class="ad"><b>Soğuma</b><span>${s.length} esneme · ${esDakika(c.sogumaSuresi(s))}</span></span>
    <span class="sag">${e?"yapıldı":"başla"}</span>
  </button>`}export function sogumaHTML(a){if(a.esneme)return Pa(a);const s=c.cooldownFor(a.dayIndex,a.settings?.profil),{kaslar:e}=c.gunEtiketi(a.dayIndex),i=!!a.session?.cooldownDone,n=s.map(t=>`<div class="satir yalin">
      <span class="ad"><b>${esc(t.ad)}</b><span>${esc(t.kas)} · ${G[t.yer]}</span></span>
      <span class="sag"><b>${X(t)}</b></span>
      <div class="mini sahne3d" data-anim="${t.id}" aria-hidden="true"></div>
    </div>`).join("");return`
    <div class="ust"><button class="ib" data-act="to-list" aria-label="Listeye dön">${l("geri")}</button><span class="ib-yer"></span></div>
    <div class="sayfa-baslik"><h1>Soğuma</h1><p>${esc(e)} · ${esDakika(c.sogumaSuresi(s))} · sete sayılmaz</p></div>
    ${s.length?`<div class="liste dagit">${n}</div>
    <p class="kucuk-yazi grup-alti">Önce ayakta, sonra yerde yapılır. Gerginlik hissedince dur; ağrıya kadar zorlama, yaylanma, nefesini tutma.</p>
    <div class="alt"><button class="btn p" data-act="esneme-basla">${i?"Yeniden başla":"Başla"}${l("ileri")}</button></div>`:'<div class="grup"><div class="ic"><p>Bu günde hareket yok; soğuma günün kaslarından kurulur.</p></div></div>'}`}function Pa(a){const s=a.esneme,e=s.liste.length,i=s.liste.map((d,o)=>`<i class="${o<s.i||s.bitti?"bitti":o===s.i?"simdi":""}"></i>`).join("");if(s.bitti)return`
    <div class="ust"><button class="ib" data-act="to-list" aria-label="Listeye dön">${l("geri")}</button><span class="tarih">Soğuma</span><span class="ib-yer"></span></div>
    <div class="es-serit" aria-hidden="true">${i}</div>
    <div class="sayfa-baslik ust-bosluk"><h1>Soğuma tamam</h1><p>${e} esneme · ${esDakika(c.sogumaSuresi(s.liste))}. Bugünkü listede “yapıldı” olarak görünür.</p></div>
    <div class="alt"><div class="cift"><button class="btn s" data-act="esneme-basla">Baştan</button><button class="btn p" data-act="to-list">Listeye dön</button></div></div>`;const n=s.liste[s.i],t=s.liste[s.i+1],r=n.tek?`<span class="es-taraf">${s.faz==="taraf"?"Sol tarafa geç":s.taraf==="sol"?"Sol taraf":"Sağ taraf"}</span>`:"";return`
    <div class="ust"><button class="ib" data-act="esneme-kapat" aria-label="Oynatıcıyı kapat">${l("carpi")}</button>
      <span class="tarih">Soğuma · ${s.i+1}/${e}</span><span class="ib-yer"></span></div>
    <div class="es-serit" aria-hidden="true">${i}</div>
    <div class="es-ad"><h1>${esc(n.ad)}</h1><p>${esc(n.kas)} · ${X(n)}</p>${r}</div>
    <div class="fig"><div class="sahne3d" id="es3d" role="img" aria-label="${esc(n.ad)} esneme çizimi"></div></div>
    <div class="clock${s.kosuyor&&s.faz==="tut"?" run":""}">
      <p class="es-faz" id="es-faz">${Ga[s.faz]}</p>
      <div class="crow">
        <button class="cadj" data-act="esneme-geri" aria-label="Önceki esneme"${s.i?"":" disabled"}>${l("geri")}</button>
        <span class="time" id="es-zaman" role="timer" aria-live="off">${w(s.kalan??s.fazSn)}</span>
        <button class="cadj" data-act="esneme-atla" aria-label="Sonraki esneme">${l("ileri")}</button>
      </div>
    </div>
    <p class="es-ipucu">${esc(n.ipucu)}</p>
    <p class="es-sira">${t?`Sıradaki: <b>${esc(t.ad)}</b>`:"Son esneme"}</p>
    <div class="alt"><button class="btn ${s.kosuyor?"s":"p"}" data-act="esneme-oynat">${s.kosuyor?"Duraklat":"Devam et"}</button></div>`}function Fa(a,s){const e=a.kas.split("·").map(i=>i.trim()).filter(Boolean);return`
    <div class="ust"><button class="ib" data-act="to-hareketler" aria-label="Hareketlere dön">${l("geri")}</button>
      <span class="tarih">Esneme</span><span class="ib-yer"></span></div>
    <div class="sayfa-baslik"><h1>${esc(a.ad)}</h1><p lang="en">${esc(a.en)}</p></div>
    <div class="buyuk3b"><div class="sahne3d" id="hareket3d" role="img" aria-label="${esc(a.ad)} esneme çizimi; sürükleyerek döndürülür"></div>
      <img class="damga" src="icons/isaret.svg" alt="" width="30" height="17"><span class="ipucu">Sürükle: döndür · dokun: yeniden oynat</span></div>
    <p class="kunye">${[G[a.yer].replace(/^./,i=>i.toLocaleUpperCase("tr")),`${a.tek?"her taraf ":""}${s} sn tut`].map(esc).join(" · ")}</p>
    <div class="grup"><h2 class="etiket">Esnettiği kaslar</h2><div class="ic"><div class="kaslar">${e.map((i,n)=>`<span class="kas${n<2?" ana":""}">${esc(i)}</span>`).join("")}</div></div></div>
    <div class="grup"><h2 class="etiket">Faydası</h2><div class="ic"><p>${esc(a.fayda)}</p></div></div>
    <div class="grup"><h2 class="etiket">Nasıl yapılır</h2><div class="ic"><ol class="adimlar">${a.steps.map(i=>`<li>${esc(i)}</li>`).join("")}</ol></div></div>
    <div class="grup"><h2 class="etiket">Dikkat</h2><div class="ipucu-kutu">${esc(a.tip)}</div></div>
    <p class="kucuk-yazi grup-alti">Gerginlik hissedince dur; ağrıya kadar zorlama, yaylanma, nefesini tutma. Programa set olarak eklenmez; soğumada
      günün kaslarına göre kendiliğinden gelir. Statik esneme ısınmanın yerine geçmez: antrenman sonunda, vücut ısınmışken yap.</p>
    ${sekmelerHTML("hareketler")}`}export function oneriHTML(a,s){const e=s.oneri?.[a.id],i=s.session.entries.find(t=>t.exerciseId===a.id)?.sets;if(!z.oneriGecerliMi(e,i))return"";const n=s.settings.unit;return e.tur==="kal"?`<div class="oneri">${l("yildiz")}<span>Geçen sefer son sete RIR 0 ile vardın: <b>${fmt(e.agirlik)} ${n}</b> ile kal,
      tekrarları temiz tamamla</span></div>`:e.tur==="agirlik"?`<div class="oneri">${l("yildiz")}
      <span>İki seanstır ${e.setler} × ${e.tekrar} tamam${e.rir!=null?` (RIR ${e.rir}+)`:""}: <b>${fmt(e.agirlik)} ${n}</b> dene</span>
      ${s.draft.weight===e.agirlik?"":'<button class="cip" data-act="oneri-uygula">Uygula</button>'}
    </div>`:`<div class="oneri">${l("yildiz")}<span>İki seanstır ${fmt(e.agirlik)} ${n} ile hedef tamam. Sonraki
      ağırlık adımı büyük (%${Math.round(e.adimOrani*100)}); önce <b>${e.hedefTekrar} tekrara</b> çık.</span></div>`}function Na(a){const s=c.aktifProgram(),e=s?.gunler[a.dayIndex];return e?`<div class="ust-yazi"><b>${esc(s.ad)}</b> · ${esc(e.ad?.trim()||c.gunEtiketi(a.dayIndex).kisa)}</div>`:""}export function focusHTML(a){const{session:s,dayIndex:e,idx:i,settings:n}=a,t=c.exercisesFor(e),r=t[i],d=c.exerciseProgress(s,r,n),o=t.map((m,$)=>`<i class="${c.exerciseProgress(s,m,n).tamam?"f":$===i?"c":""}"></i>`).join(""),p=i===t.length-1;return`
    <div class="ust uclu">
      <button class="ib" data-act="to-list" aria-label="Listeye dön">${l("geri")}</button>
      <div class="orta"><b>${i+1} / ${t.length}</b><span class="seritler" aria-hidden="true">${o}</span></div>
      <span class="sag-grup">
        ${d.sets.length?`<button class="ib" data-act="undo" aria-label="Son seti geri al">${l("geri-al")}</button>`:""}
        <button class="ib" data-act="sheet-open" aria-label="Nasıl yapılır, hedef ve ısınma seti">${l("soru")}</button>
      </span>
    </div>
    <div class="baslik">
      ${Na(a)}
      <h1>${adi(r)}${r.grup?`<span class="kas-cip">${esc(r.grup.toLocaleUpperCase("tr"))}</span>`:""}</h1>
      <p>${La(r,d,a)}</p>
    </div>
    ${va(r,d,ya(a,r)+ha(a,r))}
    ${r.setType==="cardio"?"":Ia(d,a,r)}
    ${d.tamam?"":Ba(r,d,a)}
    ${r.setType==="time"&&!d.tamam?`<div class="gecen-bant">${V(r,a)}</div>`:""}
    <div class="foot">
      ${d.tamam?`<div class="cift">
             <button class="btn s" data-act="set-arti">${l("arti")}Bir set daha</button>
             ${p?'<button class="btn p" data-act="to-list">Listeye dön</button>':`<button class="btn p" data-act="next">Sonraki hareket${l("ileri")}</button>`}
           </div>`:r.setType==="time"?`<div class="cift">
               <button class="btn s" data-act="save">Kaydet</button>
               <button class="btn p" data-act="clock-start" id="clock-btn">Başlat</button>
             </div>`:`<button class="btn p" data-act="save" id="kaydet-btn">${kaydetEtiketi(r,d,a)}</button>`}
    </div>
    ${gezinmeHTML(a)}
    <div class="sheet-bg" data-act="sheet-close" hidden></div>
    ${za(r,a)}`}const _a={agir:"en ağır set",bir:"tahmini 1 tekrar maksimumu",hacim:"en iyi set hacmi",tekrar:"en çok tekrar",sure:"en uzun süre"};export const rekorDeger=(a,s,e)=>a==="tekrar"?`${fmt(s)} tekrar`:a==="sure"?`${fmt(s)} sn`:a==="bir"?`${fmt(s,0)} ${e}`:a==="hacim"?`${fmt(s,0)} ${e}`:`${fmt(s)} ${e}`;const Ua=(a,s)=>a==="bir"||a==="hacim"?fmt(s,0):fmt(s);function Oa(a,s){if(!a)return"";const e=a.oncekiHacim>0?(a.hacim-a.oncekiHacim)/a.oncekiHacim:null,i=e==null?"":` · önceki döneme göre ${Math.abs(e)<5e-4?"aynı":`${e>0?"+":"−"}%${fmt(Math.abs(e*100),0)}`}`;return`<div class="oz-donem">
    <span class="ust-satir">${l("takvim")}DÖNEM TAMAM</span>
    <h2>${a.antrenman} antrenman, ${a.gun} günde</h2>
    <span class="alt-satir">${esc(a.program)}: programın bütün günlerini bitirdin.${a.rekorSayisi?` Bu dönemde ${a.rekorSayisi} rekor kırdın.`:""}</span>
    <div class="iki"><div><b>${fmt(a.hacim,0)} ${s}</b><span>Toplam hacim${i}</span></div>
      <div><b>${a.calismaSet}</b><span>Çalışma seti</span></div></div>
    ${a.hareketler.length?`<div>${a.hareketler.map(n=>`<div class="hareket"><span>${adi(n.ex)}</span><b>${fmt(n.once,0)} → ${fmt(n.simdi,0)} ${s}</b></div>`).join("")}
      <p class="oz-kural">Tahmini 1 tekrar maksimumu, önceki dönem → bu dönem.</p></div>`:""}
  </div>`}const Ya={rekor:"yildiz",gelisim:"grafik",istikrar:"takvim",zor:"alev"};function Ca(a,s,e){return a.ovgu?{ikon:Ya[a.ovgu.tur]??"yildiz",baslik:a.ovgu.baslik,yazi:esc(a.ovgu.kanit)}:a.hacimFarki!=null&&a.hacimFarki>.005?{ikon:"grafik",baslik:`Hacim %${fmt(a.hacimFarki*100,0)} arttı`,yazi:`Geçen ${s}e göre aynı hareketlerde daha çok iş yaptın.`}:a.artislar.length?{ikon:"yukari",baslik:"Geçen seferden ağır",yazi:a.artislar.slice(0,2).map(n=>`${adi(n.ex)} ${fmt(n.once)} → ${fmt(n.simdi)} ${e}`).join(" · ")}:{ikon:"tik",notr:!0,baslik:"Antrenman tamam",yazi:`${[`${a.calismaSet} çalışma seti`,a.sure&&`${a.sure} dk`,a.kg&&`${fmt(a.kg,0)} ${e}`].filter(Boolean).join(" · ")}.`}}function qa(a){if(!a)return"";const s=a.serit.length,e=Math.max(0,a.hedef-a.buHafta),i=(e?`Bu hafta ${e} antrenman daha kaldı.`:"Bu haftanın hedefi tamam.")+(s>=3&&a.tutulan?` Son ${s} haftada ${a.tutulan} kez hedefini tuttun.`:"");return`<div class="grup"><h2 class="etiket">Bu hafta</h2><div class="ic">
    <div class="oz-hafta"><b>${a.buHafta} / ${a.hedef} antrenman</b><span class="kucuk-yazi">hedefin haftada ${a.hedef}</span></div>
    <div class="oz-serit" aria-label="Son ${s} hafta">${a.serit.map((n,t)=>`<i class="${n}${t===s-1?" bu":""}"></i>`).join("")}</div>
    <div class="oz-serit-alt">${s>1?`<span>${s-1} hafta önce</span>`:"<span></span>"}<span>bu hafta</span></div>
    <p class="oz-kural">${i}</p></div></div>`}export function summaryHTML(a){const s=a.ozet;if(!s)return"";const e=a.settings.unit,{kisa:i,kaslar:n}=s.gun??c.gunEtiketi(s.dayIndex),t=Ca(s,i,e),r=s.rekor?.kirilan??[],d=new Set(r.map(u=>u.exId)),o=s.hacimFarki==null?"":(()=>{const u=Math.abs(s.hacimFarki*100);return u<.05?"aynı":`${s.hacimFarki>0?"+":"−"}%${fmt(u,0)}`})(),p=s.onceki?s.calismaSet===s.onceki.calismaSet?"aynı":`${s.calismaSet>s.onceki.calismaSet?"+":"−"}${Math.abs(s.calismaSet-s.onceki.calismaSet)}`:"",m=!r.length&&!s.gunHacmi&&!s.rekor?.ilkler?.length?"":`<div class="grup"><h2 class="etiket">${r.length||s.gunHacmi?"Rekorlar":"İlk kayıt"}</h2><div class="ic">
    ${r.map(u=>`<div class="oz-kayit">${l("yildiz")}<b>${adi(c.byId[u.exId]??{ad:u.exId})}</b>
      <span class="oz-deger"><s>${Ua(u.ana.tur,u.ana.once)} →</s> <em>${rekorDeger(u.ana.tur,u.ana.simdi,e)}</em></span>
      <span class="oz-alt">${I.TUR_AD[u.ana.tur]}${u.turler.length>1?` · ayrıca ${u.turler.slice(1).map(v=>_a[v.tur]).join(", ")}`:""}</span></div>`).join("")}
    ${s.gunHacmi?`<div class="oz-kayit">${l("yildiz")}<b>Günün toplam hacmi</b>
      <span class="oz-deger"><s>${fmt(s.gunHacmi.once,0)} →</s> <em>${fmt(s.gunHacmi.simdi,0)} ${e}</em></span>
      <span class="oz-alt">${esc(i)} için en yüksek</span></div>`:""}
    ${s.rekor?.ilkler?.length?`<p class="oz-kural">İlk kayıt: ${s.rekor.ilkler.map(u=>adi(c.byId[u]??{ad:u})).join(", ")}. Bugünkü değerlerin taban oldu; sonraki seferlerde rekorlar sayılır.</p>`:""}
  </div></div>`,$=s.artislar.filter(u=>!d.has(u.ex.id)),b=$.length?`<div class="grup"><h2 class="etiket">Geçen seferden ağır</h2><div class="ic">${$.map(u=>`<div class="oz-kayit">${l("yukari")}<b>${adi(u.ex)}</b><span class="oz-deger"><s>${fmt(u.once)} →</s> <em>${fmt(u.simdi)} ${e}</em></span>
      <span class="oz-alt">En ağır çalışma seti</span></div>`).join("")}</div></div>`:"",k=s.gelecek?.length?`<div class="grup"><h2 class="etiket">Gelecek sefer</h2><div class="ic">${s.gelecek.map(u=>`<div class="oz-kayit">${u.tur==="artir"?l("yukari"):l("ileri").replace('class="i"','class="i notr"')}<b>${adi(u.ex)}</b><span class="oz-deger">${esc(u.deger)}</span>
      <span class="oz-alt neden">${esc(u.neden)}</span></div>`).join("")}
    <p class="oz-kural">Kural: aynı ağırlıkta iki seans üst üste hedef tekrarların hepsini yaparsan ağırlığı küçük bir adımla artır (ACSM). Öneridir; kutu yine geçen seferle dolar.</p></div></div>`:"";return`
    <div class="ust">
      <button class="cip" data-act="ozet-geri-al" aria-label="Bitirmeyi geri al, seansa dön">${l("geri-al")}Geri al</button>
      <span class="ib-yer"></span>
    </div>
    ${Oa(s.donem,e)}
    <div class="oz-haber">
      <span class="rozet${t.notr?" notr":""}">${l(t.ikon)}</span>
      <h1>${t.baslik}</h1><p>${t.yazi}</p>
      <span class="tarih">${esc(i)} · ${esc(n)} · ${h.fmtDate(new Date(s.bitis))}</span>
    </div>
    <div class="oz-uc">
      <div><b>${s.sure??"—"}<small>dk</small></b><span>Süre</span>${s.onceki?.sure?`<em>geçen sefer ${s.onceki.sure}</em>`:""}</div>
      <div><b>${s.calismaSet}<small>set</small></b><span>Set</span>${p?`<em>${p}</em>`:""}</div>
      ${s.kg?`<div><b>${fmt(s.kg,0)}<small>${e}</small></b><span>Hacim</span>${o?`<em class="${s.hacimFarki>5e-4?"art":""}">${o}</em>`:""}</div>`:`<div><b>${fmt(s.seconds??0)}<small>sn</small></b><span>Süre hareketi</span></div>`}
    </div>
    ${s.onceki?`<p class="oz-not">${s.hacimKismi?`Hacim farkı yalnız bugün de yapılan hareketlerde, geçen ${esc(i)}e göre.`:`Farklar geçen ${esc(i)}e göre.`}</p>`:""}
    ${m}${b}${k}${qa(s.duzen)}
    ${s.yedekZamani?`<div class="not">${l("uyari")}<span>Veri yalnız bu telefonda. <b>Yedek almanın zamanı.</b></span></div>`:""}
    ${s.sonraki?`<p class="kucuk-yazi">Sıradaki antrenman: <b>${s.sonraki}</b></p>`:""}
    <div class="alt"><div class="cift">
      <button class="btn s" data-act="backup">Yedek al</button>
      <button class="btn p" data-act="ozet-tamam">Tamam</button>
    </div></div>`}function J(a,{w:s=280,h:e=72,alan:i=!0}={}){if(a.length<2)return"";const n=Math.min(...a),t=Math.max(...a),r=(t-n)*.18||Math.max(1,t*.02),d=n-r,o=t+r,p=4,m=v=>p+v/(a.length-1)*(s-2*p),$=v=>p+(e-2*p)-(v-d)/(o-d)*(e-2*p),b=a.map((v,S)=>`${S?"L":"M"}${m(S).toFixed(1)} ${$(v).toFixed(1)}`).join(" "),k=m(a.length-1).toFixed(1),u=$(a.at(-1)).toFixed(1);return`<svg class="spark" viewBox="0 0 ${s} ${e}" preserveAspectRatio="none" role="img"
      aria-label="${a.length} ölçüm: ${fmt(a[0])} → ${fmt(a.at(-1))}">
    ${i?`<path class="alan-dolgu" d="${b} L${k} ${e} L${m(0).toFixed(1)} ${e} Z"/>`:""}
    <path class="cizgi" d="${b}"/>
    <path class="uc" d="M${k} ${u} h0"/>
  </svg>`}const Va=a=>{if(a.length<2)return"";const s=a.at(-1).kg-a[0].kg,e=Math.round((a.at(-1).ts-a[0].ts)/864e5),i=e>=14?`${Math.round(e/7)} hafta`:`${e} gün`;return Math.abs(s)<.05?`<span class="fark">değişmedi · ${i}</span>`:`<span class="fark">${s>0?"+":"−"}${fmt(Math.abs(s),1,1)} kg · ${i}</span>`};export function historyHTML(a){const{kilolar:s=[],gecmis:e=[],ilerleme:i=[],settings:n}=a,t=s.at(-1),r=`
    <div class="grup"><h2 class="etiket">Kilo</h2><div class="ic">
      ${t?`<div class="kilo"><b>${fmt(t.kg,1,1)}</b><em>kg</em>${Va(s)}</div>
               ${J(s.map(u=>u.kg))}
               <p>${s.length} ölçüm · son giriş ${h.relativeLabel(new Date(t.ts))}</p>`:"<p>Henüz kilo kaydı yok. Aşağıya yazınca burada takip edilir.</p>"}
      <div class="alan kilo-gir">
        <label for="h-weight">Bugün</label>
        <label class="kutucuk"><input type="number" id="h-weight" inputmode="decimal" step="0.1" min="20" max="400"
               value="${t&&t.d===U()?t.kg:""}" placeholder="—" aria-label="Bugünkü kilo"><small>kg</small></label>
        <button class="cip" data-act="weight-save">Kaydet</button>
      </div>
    </div></div>`,d=`
    <div class="grup"><h2 class="etiket">Son seanslar</h2>
      ${e.length?`<div class="ic sira">${e.map(u=>`
        <button class="seans" data-seans="${esc(u.id)}" aria-label="${h.fmtShort(new Date(u.at))} seansını düzenle">
          <span class="s-baslik">${u.gun}</span>
          <span class="s-hacim">${u.kayitsiz?"—":`${fmt(u.hacim.kg,0)} ${n.unit}`}</span>
          <span class="s-ikinci">${h.fmtShort(new Date(u.at))}${u.programAdi?` · ${esc(u.programAdi)}`:""}${u.kayitsiz?'<span class="etk kyt">kayıtsız</span>':u.yarim?'<span class="etk">yarım</span>':""}</span>
          <span class="s-oran">${u.kayitsiz?"":`${u.yapilan}/${u.toplam} hareket`}</span>
        </button>`).join("")}</div>`:'<div class="ic"><p>Henüz tamamlanmış seans yok.</p></div>'}
    </div>`,o=`
    <div class="grup"><h2 class="etiket">Hareket ilerlemesi · en ağır set</h2>
      ${i.length?`<div class="ic sira">${i.map(u=>`
        <div class="ilerleme">
          <b>${adi(u.ex)}</b>
          <span>${fmt(u.seri[0].v)} → <em>${fmt(u.seri.at(-1).v)} ${u.birim}</em></span>
          ${J(u.seri.map(v=>v.v),{w:280,h:18,alan:!1})}
        </div>`).join("")}</div>
        <p class="kucuk-yazi grup-alti">${i.length} hareket · çizgi en fazla son ${Math.max(...i.map(u=>u.seri.length))} seansı gösterir.</p>`:'<div class="ic"><p>İlerleme çizgisi için bir hareketin en az iki seansta kaydı gerekiyor.</p></div>'}
    </div>`,p=a.rekorOlaylari??[],m=new Date;m.setDate(1),m.setHours(0,0,0,0);const $=p.filter(u=>u.at>=m.getTime()).length,b=u=>`<button class="oz-kayit satir-dugme" data-hareket="${esc(u.exId)}">${l("yildiz")}<b>${adi(c.byId[u.exId]??{ad:u.exId})}</b>
      <span class="oz-deger"><em>${rekorDeger(u.tur,u.simdi,n.unit)}</em></span>
      <span class="oz-alt">${I.TUR_AD[u.tur]} · ${h.fmtShort(new Date(u.at))}</span></button>`;return`
    <div class="sayfa-baslik ust-bosluk"><h1>İlerleme</h1></div>
    ${`
    <div class="grup"><h2 class="etiket">Rekorlar · son kırılanlar</h2><div class="ic">${p.length?`${p.slice(0,6).map(b).join("")}
         <p class="oz-kural">${$?`Bu ay ${$} rekor · `:""}Bir harekete dokun: bütün rekorları ve geçmişi.</p>`:"<p>Rekorlar bir hareketi ikinci kez yaptığında sayılmaya başlar: ilk kayıt taban olur.</p>"}</div></div>`}${r}${d}${o}
    ${sekmelerHTML("ilerleme")}`}export function sessionEditHTML(a){const{duzenlenen:s,settings:e}=a;if(!s)return`<div class="ust"><button class="ib" data-act="to-history" aria-label="Geçmişe dön">${l("geri")}</button></div>
    <div class="sayfa-baslik"><h1>Seans bulunamadı</h1></div>`;const i=c.gunEtiketiSeans(s).kisa,n=c.exercisesOfSession(s),t=s.entries.filter(o=>!n.some(p=>p.id===o.exerciseId)).map(o=>c.byId[o.exerciseId]??c.bilinmeyenHareket(o.exerciseId)),r=[...n,...t].map(o=>{const p=s.entries.find(k=>k.exerciseId===o.id);if(!p?.sets.length)return"";const m=z.agirlikAdimi(o,e)??z.GIRIS_ADIMI_YEDEK;let $=0;const b=p.sets.map((k,u)=>{const v=k.type==="time"?[["seconds",k.seconds,"sn",5]]:k.type==="cardio"?[["minutes",k.minutes,"dk",5]]:[["weight",k.weight,e.unit,m],["reps",k.reps,"tekrar",1]],S=k.warmup?"ısınma":`${++$}.`;return`<div class="eset">
        <span class="eno">${k.warmup?"ıs":$}</span>
        ${v.map(([j,B,T,E])=>`
          <label class="efield">
            <input type="number" inputmode="decimal" step="${E}" min="0"
                   value="${B??""}" placeholder="—"
                   data-eset="${o.id}:${u}:${j}" aria-label="${adi(o)} ${S} set ${T}">
            <span class="eunit">${T}</span>
          </label>`).join("")}
        <button class="esil" data-eset-sil="${o.id}:${u}" aria-label="${S} seti sil">${l("sil")}</button>
      </div>`}).join("");return`<div class="grup"><h2 class="etiket">${adi(o)}</h2><div class="ic sira">${b}${p.note?`<p class="seans-notu">${l("liste")}<span>${esc(p.note)}</span></p>`:""}</div></div>`}).join(""),d=c.summaryVolume(s);return`
    <div class="ust"><button class="ib" data-act="to-history" aria-label="Geçmişe dön">${l("geri")}</button><span class="ib-yer"></span></div>
    <div class="sayfa-baslik">
      <h1>${i}</h1>
      <p>${h.fmtShort(new Date(s.finishedAt??s.startedAt))} · ${d.sets} set · ${fmt(d.kg,0)} ${e.unit}</p>
    </div>
    <p class="aciklama">Bir değeri düzeltmek için üstüne yaz; alandan çıkınca kaydedilir. Hacim, "geçen sefer"
      ve ilerleme çizgisi kendiliğinden yeniden hesaplanır.</p>
    ${r}
    <div class="grup"><div class="ic">
      <button class="btn s" data-act="seans-sil">Bu seansı sil</button>
      <p>Silinen seans geçmişten kalkar, sıra yeniden hesaplanır. Geri getirebilirsin.</p>
    </div></div>`}const Za=[1,2,3,4,5,6,0],Xa=[30,45,60,90,120];function Ja(a={}){const s=da[a.tur];return`<div class="grup" id="kurulum"><h2 class="etiket">Telefona yükle</h2><div class="ic">${a.kurulu?"<p>Telefona yüklü: ana ekrandaki simgesiyle, adres çubuğu olmadan açılıyor.</p>":a.istem?`<button class="btn p" data-act="kur">Telefona yükle</button>
         <p>Ana ekrana kendi simgesiyle eklenir; adres çubuğu olmadan açılır, internetsiz çalışır.
           Kayıtların aynen kalır. Mağaza gerekmez.</p>`:s?`<p class="kurulum-tarayici">${esc(s.tarayici)} için:</p>
           <ol class="kurulum-adim">${s.adimlar.map(i=>`<li>${i}</li>`).join("")}</ol>
           ${s.not?`<p class="kucuk-not">${esc(s.not)}</p>`:""}
           <p class="kucuk-not">Zaten yüklüyse ana ekrandaki FSet simgesinden aç.</p>`:"<p>Tarayıcı menüsünden <b>Uygulamayı yükle</b> ya da <b>Ana ekrana ekle</b>'yi seç.</p>"}</div></div>`}export function kurulumBantHTML(a){const s=a.kurulum??{};return oa(s.tur,a.settings)?`<div class="kurulum-bant"><span class="yazi"><b>FSet'i telefona yükle</b><span>Ana ekranda kendi simgesiyle, internetsiz açılır.</span></span>
    <button class="btn p kucuk" data-act="${s.istem?"kur":"kurulum-nasil"}">${s.istem?"Yükle":"Nasıl?"}</button>
    <button class="kapat" data-act="kurulum-kapat" aria-label="Bandı kapat">${l("carpi")}</button></div>`:""}export function settingsHTML(a){const{settings:s}=a,e=s.trainingDays??[],i=Za.map(m=>`
    <button class="cip" data-gun="${m}" aria-pressed="${e.includes(m)}" aria-label="${h.GUN[m]}">${h.GUN_KISA[m]}</button>`).join(""),n=h.upcoming(new Date,e,3),t=n.length?`<b>${n.map(m=>h.fmtShort(m)).join(" · ")}</b>`:"Hiç gün seçili değil; takvim çalışmaz.",r=Xa.map(m=>`
    <button data-rest="${m}" aria-pressed="${s.restSeconds===m}" aria-label="${m} saniye">${m}</button>`).join(""),d=!!s.basitGorunum,o=[["tam","Tam",!1],["basit","Basit",!0]].map(([m,$,b])=>`
    <button data-gorunum="${m}" aria-pressed="${d===b}">${$}</button>`).join(""),p=z.DAMBIL_ADIMLARI.map(m=>`
    <button data-dambil="${m}" aria-pressed="${s.dambilAdimi===m}">${fmt(m)} kg</button>`).join("");return`
    <div class="sayfa-baslik ust-bosluk"><h1>Ayarlar</h1></div>

    <div class="grup"><h2 class="etiket">Profil ve avatar</h2><div class="ic">
      <button class="pm-satir" data-act="to-profil">
        <span class="avatar-k" data-avatar-k aria-hidden="true"></span>
        <span class="yazi"><b>${esc(s.profil?.ad?.trim()||"Profil oluştur")}</b></span>${l("ileri")}
      </button>
    </div></div>

    <div class="grup"><h2 class="etiket">Antrenman günleri</h2><div class="ic">
      <div class="cipler">${i}</div>
      <p>Sıradaki: ${t}</p>
    </div></div>

    <div class="grup"><h2 class="etiket">Setler arası dinlenme</h2><div class="ic">
      <div class="segment" role="group" aria-label="Dinlenme süresi">${r}</div>
      <p>Saniye. Odak ekranındaki sayaç bu süreyle başlar.</p>
    </div></div>

    <div class="grup"><h2 class="etiket">Setten sonra zorluk (RIR)</h2><div class="ic">
      <div class="segment" role="group" aria-label="RIR sorusu">${[["kapali","Sorma",!1],["acik","Sor",!0]].map(([m,$,b])=>`<button data-rirsor="${m}" aria-pressed="${!!s.rirSor===b}">${$}</button>`).join("")}</div>
      <p>Ağırlıklı her setten sonra "kaç tekrar daha yapabilirdin?" sorulur; cevap ağırlık önerisini daha doğru yapar.
        Programda hedef RIR verdiğin harekette her zaman sorulur.</p>
    </div></div>

    <div class="grup"><h2 class="etiket">Seans başında kontrol</h2><div class="ic">
      <div class="segment" role="group" aria-label="Toparlanma kontrolü">${[["kapali","Sorma",!1],["acik","Sor",!0]].map(([m,$,b])=>`<button data-hzsor="${m}" aria-pressed="${s.hazirlikSor!==!1===b}">${$}</button>`).join("")}</div>
      <p>Seansa başlamadan uyku, uzun süren kas tutulması ve ağrı sorulur; cevaba göre "plana uy", "biraz hafiflet" ya da
        "dinlen" önerilir. Günde bir kez sorulur, atlanabilir.</p>
    </div></div>

    <div class="grup"><h2 class="etiket">Dambıl adımı</h2><div class="ic">
      <div class="segment" role="group" aria-label="Dambıl adımı">${p}</div>
      <p>Salondaki dambıl setinde bir sonraki ağırlık. Bar 2,5 kg, makine ve kablo 5 kg adımla ilerler.</p>
    </div></div>

    <div class="grup"><h2 class="etiket">Hareket çizimi</h2><div class="ic">
      <div class="segment" role="group" aria-label="Hareket çizimi">${o}</div>
      <p>${d&&s.basitOto?"Bu telefonda ayrıntılı manken yavaş çizildiği için basit görünüm kendiliğinden açıldı. ":!d&&a.cAcilamadi?"Ayrıntılı manken bu telefonda açılamadı; yerine basit manken çiziliyor. ":""}Basit görünüm daha hafif bir manken çizer, pili korur.</p>
    </div></div>

    <div class="grup"><h2 class="etiket">Vücut</h2><div class="ic">
      <div class="alan">
        <label for="s-height">Boy</label>
        <label class="kutucuk"><input type="number" id="s-height" inputmode="numeric" min="100" max="250" step="1"
               value="${s.heightCm??""}" placeholder="—" aria-label="Boy (cm)"><small>cm</small></label>
      </div>
      <p>Kilo takibi İlerleme ekranında.</p>
    </div></div>

    ${Ja(a.kurulum)}

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
        <div class="hk-ad"><b class="hk-kelime"><span class="k1">${esc(C.on)}</span><span class="k2">${esc(C.son)}</span></b>
          <small>Sürüm ${esc(la)}</small></div></div>
      <p>Verilerin yalnızca bu telefonda durur; hesap yok, hiçbir sunucuya bir şey gönderilmez.</p>
      <a class="hk-bag" href="gizlilik.html">Gizlilik politikası${l("ileri")}</a>
      <a class="hk-bag" href="kosullar.html">Kullanım koşulları${l("ileri")}</a>
    </div></div>

    <p class="kucuk-yazi">Ağrı hissettiğin bir harekette dur; bu uygulama tıbbi tavsiye vermez.
      Hareket çizimleri <a href="js/vendor/three-LICENSE.txt" target="_blank" rel="noopener">three.js</a> ile yapılır (MIT lisansı);
      manken MakeHuman ile üretildi (CC0); yazı tipi Archivo (<a href="fonts/OFL.txt" target="_blank" rel="noopener">SIL OFL 1.1</a>).
      © 2026 Sabri Temel, tüm hakları saklıdır.</p>
    ${sekmelerHTML("ayarlar")}`}const L=(a,s,e)=>a.map(([i,n,t])=>`<button class="renk" data-${e}="${i}" aria-pressed="${s===i}" aria-label="${esc(n)}" style="--renk:${t}"></button>`).join("");export function profilHTML(a){const s=a.settings??{},e=s.avatar??{},i=s.profil??{},n=g.cozumle(e,i),t=g.govdeBul(n.govde),r=a.avatarOneri,d=a.avatarSekme??"avatar",o=a.kiyafetParca??"ust",p=(b,k)=>`<p class="renk-ad">${esc(b.find(u=>u[0]===k)?.[1]??"")}</p>`,m={avatar:()=>`<div class="govdeler">${g.GOVDELER.map(b=>`<button class="cip" data-avatar-govde="${b.id}" aria-pressed="${n.govde===b.id}">${esc(b.ad)}</button>`).join("")}</div>
      <p class="av-not">Yaşını Profil'de yazarsan avatar önerilir; seçimin hep senin.</p>`,ten:()=>`<div class="renkler">${L(g.TEN,n.ten,"avatar-ten")}</div>${p(g.TEN,n.ten)}
      <p class="av-not">Ten ve saç rengi telefonunun bölge ayarına göre önerildi; internete bağlanılmaz.</p>`,sac:()=>(t.kadin?"":`<div class="segment" role="group" aria-label="Saç">
        <button data-avatar-sacvar="1" aria-pressed="${n.sacli}">Saçlı</button><button data-avatar-sacvar="0" aria-pressed="${!n.sacli}">Saçsız</button></div>`)+(n.sacli?`<div class="renkler">${L(g.SAC,n.sacRenk,"avatar-sac")}</div>${p(g.SAC,n.sacRenk)}`:""),kiyafet:()=>`<div class="segment" role="group" aria-label="Kıyafet">
        <button data-kiyafet-parca="ust" aria-pressed="${o==="ust"}">Üst</button><button data-kiyafet-parca="alt" aria-pressed="${o==="alt"}">Alt</button></div>`+(o==="ust"?`<div class="renkler">${L(g.UST,n.ust,"avatar-ust")}</div>${p(g.UST,n.ust)}`:`<div class="renkler">${L(g.ALT,n.alt,"avatar-alt")}</div>${p(g.ALT,n.alt)}`),profil:()=>`<div class="av-iki">
        <div class="profil-alan"><label for="p-adin">Adın</label><input class="metin" id="p-adin" maxlength="24" autocomplete="off" placeholder="Örneğin Deniz" value="${esc(i.ad??"")}"></div>
        <div class="profil-alan av-yas"><label for="p-yas">Yaşın</label><input class="metin" id="p-yas" inputmode="numeric" maxlength="3" autocomplete="off" placeholder="—" value="${i.yas??""}"></div></div>
      <div class="segment" role="group" aria-label="Cinsiyet">${g.CINSIYET.map(([b,k])=>`<button data-profil-cins="${b}" aria-pressed="${i.cinsiyet===b}">${k}</button>`).join("")}</div>
      <p class="av-not">İsteğe bağlı; yalnız bu telefonda saklanır. Yaş ve cinsiyet avatarını önerir.</p>`},$=[["avatar","Avatar"],["ten","Ten"],["sac","Saç"],["kiyafet","Kıyafet"],["profil","Profil"]];return`
    <div class="ust av-baslik"><button class="ib" data-act="to-settings" aria-label="Ayarlara dön">${l("geri")}</button><h1>Profil ve avatar</h1><span class="ib-yer"></span></div>
    <div class="av-sahne">
      <div class="avatar-onizleme" id="avatar3d" aria-label="Avatarın — döndürmek için sürükle"></div>
      ${r?"":'<img class="damga" src="icons/isaret.svg" alt="" width="30" height="17">'}
      ${r?`<div class="avatar-oneri"><span>Avatarın ${r.yas?"yaşına":"seçimine"} göre ${esc(g.govdeBul(r.yeni).ad)} oldu.</span>
        <button data-act="avatar-geri-al">Geri al</button></div>`:'<p class="avatar-ipucu">Döndürmek için sürükle</p>'}
    </div>
    <div class="av-sekmeler" role="tablist" aria-label="Avatar ayarları">${$.map(([b,k])=>`<button role="tab" data-avatar-sekme="${b}" aria-selected="${d===b}">${k}</button>`).join("")}</div>
    <div class="av-panel" role="tabpanel">${m[d]()}</div>`}const Qa=[["bugun","Bugün","bugun","to-list"],["ilerleme","İlerleme","grafik","to-history"],["hareketler","Hareketler","figur","to-hareketler"],["programlar","Programlar","liste","to-programs"],["ayarlar","Ayarlar","ayar","to-settings"]];export function sekmelerHTML(a){return`<nav class="sekmeler" aria-label="Ana gezinme">${Qa.map(([s,e,i,n])=>`<button data-act="${n}"${s===a?' aria-current="page"':""}>${l(i)}<span>${e}</span></button>`).join("")}</nav>`}const K=a=>cizimsiz(a)?`<span class="kucuk yer" aria-hidden="true">${l("figur")}</span>`:`<span class="kucuk" data-kucuk="${esc(a.id)}" aria-hidden="true"></span>`,Wa=a=>a.gunler.reduce((s,e)=>s+e.hareketler.length,0);export function programsHTML(){const a=c.aktifProgram();return`
    <div class="sayfa-baslik ust-bosluk"><h1>Programlar</h1>
      <p>Bugün ekranı <b>kullanılan</b> programın sıradaki gününü gösterir.</p></div>
    <div class="liste">${c.programListesi().map(e=>`
    <button class="satir yalin" data-program-ac="${esc(e.id)}">
      <span class="ad"><b>${esc(e.ad)}</b><span>${e.gunler.length} gün · ${Wa(e)} hareket</span></span>
      <span class="sag">${e===a?'<span class="rozet">Kullanılıyor</span>':""}</span>${l("ileri")}
    </button>`).join("")}</div>
    <div class="grup"><button class="btn s" data-act="program-yeni">${l("arti")}Yeni program</button></div>
    <div class="grup"><h2 class="etiket">Hazır programlar</h2><div class="hazir-liste">${O.map(Q("data-hazir")).join("")}</div>
      <p class="kucuk-yazi grup-alti">Dokun: günlerini gör, kopyasını programlarına ekle. Eklenen kopya senindir; düzenleyebilirsin.</p></div>
    ${sekmelerHTML("programlar")}`}const xa=a=>a.gunler.length===2?"A / B":`${a.gunler.length} farklı gün`,Q=a=>s=>`<button class="hazir" ${a}="${esc(s.id)}"><span class="ad"><b>${esc(s.ad)}</b><span>${esc(s.kime)}</span></span>
  <span class="rozet">${xa(s)}</span></button>`;function W(a,s){const e=i=>i.seconds!=null?`${i.sets}×${i.seconds} sn`:`${i.sets}×${i.reps}`;return`<div class="oneri-kart">${s?`<small>${s}</small>`:""}<h2>${esc(a.ad)}</h2><p>${esc(a.kime)}</p>
    <div class="gun-ozet">${a.gunler.map(([i,n],t)=>`<div><b>${esc(i||`${t+1}. Gün`)}</b><span>${n.map(r=>`${esc(c.byId[r.exId]?.ad??r.exId)} ${e(r)}`).join(" · ")}</span></div>`).join("")}</div></div>`}export function hazirHTML(a){const s=Y(a.hazirId);return s?`
    <div class="ust"><button class="ib" data-act="to-programs" aria-label="Programlara dön">${l("geri")}</button>
      <span class="tarih">Hazır program</span><span class="ib-yer"></span></div>
    ${W(s)}
    <div class="grup"><button class="btn p" data-act="hazir-ekle">${l("arti")}Programlarıma ekle</button></div>
    <p class="kucuk-yazi grup-alti">Kopyası eklenir; günlerini ve hedeflerini düzenleyebilirsin. Kullanmak için programda "Bu programı kullan".</p>`:`<div class="ust"><button class="ib" data-act="to-programs" aria-label="Programlara dön">${l("geri")}</button></div>`}export function ilkAcilisHTML(a){const s=a.ia,e=`<div class="ilerleme-cizgi" aria-hidden="true">${[1,2,3,4,5].map(t=>`<i class="${t<=s.adim?"dolu":""}"></i>`).join("")}</div>`;if(s.adim===0)return`
    <div class="karsilama"><img class="logo" src="icons/fset-192.png" alt="">
      <h1>Antrenman defterin hazır.</h1>
      <p>Dört kısa soru; sana uygun programı önerelim. Bir dakika sürer.</p>
      <ul><li>Her hareketin 3B anlatımı</li><li>Set, tekrar ve ağırlık kaydı</li><li>Hesap yok; verilerin telefonunda kalır</li></ul>
      <p class="kucuk-yazi">FSet bir egzersiz yardımcısıdır, tıbbi tavsiye vermez. Bir sağlık sorunun varsa başlamadan önce hekimine danış.
        Devam ederek <a href="kosullar.html">Kullanım koşullarını</a> kabul etmiş olursun; verilerinin nasıl tutulduğu
        <a href="gizlilik.html">Gizlilik politikasında</a>.</p></div>
    <div class="alt-bar dikey"><button class="btn p" data-ia="ileri">Başlayalım</button>
      <button class="btn s" data-ia="kendim">Kendim kuracağım</button></div>`;if(s.adim<=4){const t=na[s.adim-1];return`${e}
    <div class="soru"><h1>${t.soru}</h1>${t.alt?`<p>${t.alt}</p>`:""}</div>
    <div class="secenekler" role="group" aria-label="${t.soru}">${t.secenek.map(([r,d,o])=>`<button class="secenek" aria-pressed="${s.c[t.anahtar]===r}" data-ia-cevap="${t.anahtar}:${r}"><span class="ad"><b>${d}</b>${o?`<span>${o}</span>`:""}</span></button>`).join("")}</div>
    <div class="alt-bar"><button class="btn s" data-ia="geri">${l("geri")}Geri</button><span class="kucuk-yazi">${s.adim} / 4</span></div>`}if(s.adim===5){const t=g.cozumle({},{yas:s.profil.yas,cinsiyet:null}).govde,r=s.profil.govde??t;return`${e}
    <div class="soru"><h1>Seni tanıyalım</h1><p>İsteğe bağlı: avatarını seç. Bilgiler yalnız bu telefonda kalır.</p></div>
    <div class="profil-alan">
      <div class="form-alan"><label for="ia-ad">Adın</label><input id="ia-ad" class="metin" maxlength="24" autocomplete="off" placeholder="İsteğe bağlı" value="${esc(s.profil.ad??"")}"></div>
      <div class="form-alan"><label for="ia-yas">Yaşın</label><input id="ia-yas" class="metin" inputmode="numeric" maxlength="3" placeholder="İsteğe bağlı" value="${s.profil.yas??""}"></div>
      <div class="form-alan"><span class="etiket">Avatar</span><div class="cip-izgara">${g.GOVDELER.map(d=>`<button class="cip" aria-pressed="${d.id===r}" data-ia-govde="${d.id}">${esc(d.ad)}</button>`).join("")}</div></div></div>
    <div class="alt-bar"><button class="btn s" data-ia="atla">Atla</button><button class="btn p" data-ia="ileri">Devam</button></div>`}const i=s.secili??ra(s.c),n=Y(i);return`
    <div class="soru"><h1>Senin için önerimiz</h1><p>Hedefine ve haftana göre seçildi; istediğin zaman değiştirebilirsin.</p></div>
    ${W(n,s.secili?"SEÇTİĞİN":"ÖNERİLEN")}
    <div class="alt-bar dikey"><button class="btn p" data-ia="basla">Bu programla başla</button></div>
    <div class="grup"><h2 class="etiket">Diğer programlar</h2><div class="hazir-liste">${O.filter(t=>t.id!==i).map(Q("data-ia-sec")).join("")}</div></div>
    <div class="grup"><button class="btn s" data-ia="kendim">Kendim kuracağım</button></div>`}const as=(a,s,e,i)=>`<span class="hedef">
    <button class="adim" data-kalem="${a}:${s}:-1" aria-label="${i} azalt">${l("eksi")}</button>
    <b>${e}</b>
    <button class="adim" data-kalem="${a}:${s}:1" aria-label="${i} artır">${l("arti")}</button></span>`,x=a=>a.minutes!=null?`${a.minutes} dk`:a.seconds!=null?`${a.sets} × ${a.seconds} sn`:`${a.sets} × ${a.repsMin&&a.repsMin<a.reps?`${a.repsMin}-`:""}${a.reps}`;function ss(a,s,e,i=60){const n=c.byId[a.exId]??c.bilinmeyenHareket(a.exId),t=[n.grup,f[n.equipment]].filter(Boolean).join(" · "),r=`${s}:`;let d="";if(e){const o=a.minutes!=null?"":`<div class="g-alan"><div class="g-etk"><span>Set</span><b>${a.sets}</b></div>${noktalarHTML("dz-set",a.sets,r)}</div>`,p=a.minutes!=null?`<div class="g-alan"><div class="g-etk"><span>Süre</span></div>${as(s,"minutes",`${a.minutes} dk`,"Süre")}</div>`:a.seconds!=null?`<div class="g-alan"><div class="g-etk"><span>Süre</span><b>${a.seconds} sn</b></div>
            <div class="semalar" role="group" aria-label="Süre">${[...new Set([15,20,30,45,60,90,a.seconds])].sort(($,b)=>$-b).map($=>`<button class="cip" aria-pressed="${$===a.seconds}" data-dz-sn="${r}${$}">${$} sn</button>`).join("")}</div></div>`:`<div class="g-alan"><div class="g-etk"><span>Tekrar</span><b>${a.reps}</b></div>${tekrarSeridiHTML("dz-tekrar",a.reps,r)}</div>
           ${semalarHTML("dz-sema",a.sets,a.reps,r)}`,m=a.minutes!=null?"":yontemHTML("dz-yontem",a,r,i,{tekrarli:a.reps!=null&&n.setType!=="time"});d=`<div class="acilir">${o}${p}${m}
      <div class="alt-eylem"><button class="btn s" data-cikar="${s}">${l("sil")}Bu günden çıkar</button></div></div>`}return`<div class="satir-d${e?" acik":""}" data-dz-i="${s}">
    <div class="kafa">${K(n)}
      <button class="ad" data-dz-ac="${s}" aria-expanded="${e}"><b>${adi(n)}</b>${t?`<small>${esc(t)}</small>`:""}</button>
      <button class="hap" data-dz-ac="${s}" aria-label="${adi(n)}: hedef ${x(a)}">${x(a)}</button>
      <button class="tutac" data-dz-tutac="${s}" aria-label="${adi(n)}: sırayı değiştir — sürükle ya da yukarı/aşağı ok tuşu">${l("tutac")}</button>
    </div>${d}</div>`}const aa=a=>JSON.stringify({...a,guncellendi:0});export const programDegisti=(a,s)=>!!(a&&s&&aa(a)!==aa(s));export function programHTML(a){const s=c.programGetir(a.duzen?.id);if(!s)return`<div class="ust"><button class="ib" data-act="to-programs" aria-label="Programlara dön">${l("geri")}</button></div>
    <div class="sayfa-baslik"><h1>Program bulunamadı</h1></div>`;const e=Math.min(a.duzen.gun??0,s.gunler.length-1),i=s.gunler[e],n=s===c.aktifProgram(),t=i.hareketler.map((r,d)=>ss(r,d,a.duzen.acik===d,a.settings?.restSeconds??60)).join("");return`
    <div class="ust"><button class="ib" data-act="to-programs" aria-label="Programlara dön">${l("geri")}</button>
      ${programDegisti(s,a.duzen.kopya)?`<button class="geri-don" data-act="program-geri-don">${l("geri-al")}Açtığın hâle dön</button>`:""}
      ${n?'<span class="rozet">Kullanılıyor</span>':'<button class="cip" data-act="program-aktif">Bu programı kullan</button>'}</div>
    <div class="form-alan"><label for="p-ad">Programın adı</label>
      <input id="p-ad" class="metin" value="${esc(s.ad)}" maxlength="60" autocomplete="off"></div>
    <div class="kaydir" role="group" aria-label="Günler">${s.gunler.map((r,d)=>`<button class="cip" aria-pressed="${d===e}" data-pgun="${d}">${d+1}. Gün</button>`).join("")}
      ${s.gunler.length<7?`<button class="cip" data-act="gun-ekle" aria-label="Gün ekle">${l("arti")}Gün</button>`:""}</div>
    <div class="form-alan"><label for="g-ad">${e+1}. günün adı</label>
      <input id="g-ad" class="metin" value="${esc(i.ad??"")}" maxlength="60" autocomplete="off"
             placeholder="${esc(c.gunEtiketi(e,s).kaslar)}"></div>
    <div class="grup"><h2 class="etiket">Hareketler · ${i.hareketler.length}</h2>
      ${i.hareketler.length?`<div class="liste-d" id="dz-liste">${t}</div>`:'<div class="ic"><p>Bu gün boş. Aşağıdan hareket ekle.</p></div>'}
    </div>
    <div class="grup eylemler"><button class="btn s" data-act="secici-ac">${l("arti")}Hareket ekle</button>
      ${s.gunler.length>1?`<button class="btn s" data-act="gun-sil">${e+1}. günü sil</button>`:""}
      ${!n&&s.id!=="benim"?'<button class="btn s" data-act="program-sil">Programı sil</button>':""}
    </div>
    <p class="kucuk-yazi">Satıra dokun: set ve tekrar. ⋮⋮ tutup sürükle: sıra. Değişiklikler hemen kaydedilir; geçmişteki seanslar etkilenmez.</p>`}const y=a=>String(a??"").toLocaleLowerCase("tr");export function seciciSonuc(a){const s=y(a.ara).trim();return c.kutuphaneListesi().filter(e=>(!a.grup||e.grup===a.grup)&&(!a.eq||e.equipment===a.eq)&&(!s||y(e.ad).includes(s)||y(e.en).includes(s)||y(e.mus).includes(s))).sort((e,i)=>y(e.ad).localeCompare(y(i.ad),"tr"))}export function seciciListeHTML(a){const s=seciciSonuc(a.secici),e=c.programGetir(a.duzen?.id)?.gunler[a.duzen.gun],i=new Set(e?.hareketler.map(t=>t.exId)??[]);if(!s.length)return'<div class="grup"><div class="ic"><p>Bulunamadı. Aşağıdan özel hareket olarak ekleyebilirsin.</p></div></div>';const n=t=>`
    <button class="satir" data-ekle="${esc(t.id)}">
      ${K(t)}
      <span class="ad"><b>${adi(t)}</b><span>${[i.has(t.id)&&"bu günde var",t.en&&`<span lang="en">${esc(t.en)}</span>`,f[t.equipment],t.ozel&&"özel"].filter(Boolean).join(" · ")}</span></span>
      <span class="durum ikon">${l("arti")}</span>
    </button>`;return`<p class="sayac">${s.length} hareket</p><div class="liste">${s.map(t=>t.ozel?`<div class="satir-ozel">${n(t)}<button class="ozel-sil" data-ozel-sil="${esc(t.id)}" aria-label="${adi(t)}: kütüphaneden sil">${l("sil")}</button></div>`:n(t)).join("")}</div>`}export function seciciHTML(a){const s=a.secici;return`
    <div class="ust"><button class="ib" data-act="secici-kapat" aria-label="Kapat">${l("carpi")}</button>
      <span class="tarih">Hareket ekle · ${a.duzen.gun+1}. Gün</span><span class="ib-yer"></span></div>
    <label class="arama">${l("ara")}<input id="ara" type="search" value="${esc(s.ara)}" placeholder="Ara: squat, göğüs, curl…"
      autocomplete="off" aria-label="Hareket ara"></label>
    <div class="kaydir" role="group" aria-label="Kas grubu">${["",...A].map(e=>`<button class="cip" aria-pressed="${s.grup===e}" data-sgrup="${e}">${e||"Tüm kaslar"}</button>`).join("")}</div>
    <div class="kaydir" role="group" aria-label="Ekipman">${["",...Object.keys(f)].map(e=>`<button class="cip" aria-pressed="${s.eq===e}" data-seq="${e}">${e?f[e]:"Tüm ekipman"}</button>`).join("")}</div>
    <div id="secici-liste">${seciciListeHTML(a)}</div>
    <div class="grup"><button class="btn s" data-act="ozel-ac">Listede yok mu? Özel hareket ekle</button></div>`}export function esnemeSonuc(a){if(a.eq||a.grup&&a.grup!=="Esneme")return[];const s=y(a.ara).trim();return c.ESNEME.filter(e=>!s||y(e.ad).includes(s)||y(e.en).includes(s)||y(e.kas).includes(s))}export function kutuphaneListeHTML(a){const s=a.kutuphane.grup==="Esneme"?[]:seciciSonuc(a.kutuphane),e=esnemeSonuc(a.kutuphane),i=(a.kutuphane.grup?[a.kutuphane.grup]:A).map(t=>[t,s.filter(r=>r.grup===t)]).filter(([,t])=>t.length);if(!i.length&&!e.length)return'<div class="grup"><div class="ic"><p>Bulunamadı. Aşağıdan özel hareket olarak ekleyebilirsin.</p></div></div>';const n=e.length?`
    <div class="bolum-baslik"><h2>Esneme</h2><span>${e.length}</span></div>
    <div class="liste">${e.map(t=>`
      <button class="satir" data-hareket="${t.id}">
        <span class="kucuk" data-kucuk="${t.id}" aria-hidden="true"></span>
        <span class="ad"><b>${esc(t.ad)}</b><span>${esc(t.kas)} · ${G[t.yer]}</span></span>
        <span class="durum ok">${l("ileri")}</span>
      </button>`).join("")}</div>`:"";return i.map(([t,r])=>`
    <div class="bolum-baslik"><h2>${esc(t)}</h2><span>${r.length}</span></div>
    <div class="liste">${r.map(d=>`
      <button class="satir" data-hareket="${esc(d.id)}">
        ${K(d)}
        <span class="ad"><b>${adi(d)}</b><span>${[d.mus,f[d.equipment],d.ozel&&"özel"].filter(Boolean).map(esc).join(" · ")}</span></span>
        <span class="durum ok">${l("ileri")}</span>
      </button>`).join("")}</div>`).join("")+n}export function kutuphaneHTML(a){const s=a.kutuphane,e=(s.grup==="Esneme"?0:seciciSonuc(s).length)+esnemeSonuc(s).length;return`
    <div class="sayfa-baslik ust-bosluk"><h1>Hareketler</h1><p>${s.grup==="Esneme"?`${e} esneme · dokun: nasıl yapılır, esnettiği kaslar`:`${e} hareket · dokun: nasıl yapılır, kaslar, geçmişin`}</p></div>
    <label class="arama">${l("ara")}<input id="k-ara" type="search" value="${esc(s.ara)}" placeholder="Ara: squat, göğüs, curl…"
      autocomplete="off" aria-label="Hareket ara"></label>
    <div class="kaydir" role="group" aria-label="Kas grubu">${["",...A,"Esneme"].map(i=>`<button class="cip" aria-pressed="${s.grup===i}" data-kgrup="${i}">${i||"Tüm kaslar"}</button>`).join("")}</div>
    <div class="kaydir" role="group" aria-label="Ekipman">${["",...Object.keys(f)].map(i=>`<button class="cip" aria-pressed="${s.eq===i}" data-keq="${i}">${i?f[i]:"Tüm ekipman"}</button>`).join("")}</div>
    <div id="kutuphane-liste">${kutuphaneListeHTML(a)}</div>
    <div class="grup"><button class="btn s" data-act="ozel-ac-kutuphane">${l("arti")}Özel hareket ekle</button></div>
    ${sekmelerHTML("hareketler")}`}function es(a,s,e,i){if(!a||!s||s.sayi<2)return"";const n=I.TURLER.filter(t=>a[t]);return n.length?`<div class="grup"><h2 class="etiket">Rekorların</h2><div class="ic"><div class="rekor-tablo">${n.map(t=>`<span>${I.TUR_AD[t]}<small>${i(a[t].at)} · ${P(a[t].set,e)}</small></span><span><b>${rekorDeger(t,a[t].deger,e)}</b></span>`).join("")}</div>
    ${a.tekrarlar.length>1?`<p class="rekor-ara">Ağırlık başına en çok tekrar</p><div class="tekrar-cipleri">${a.tekrarlar.map(t=>`<span><b>${fmt(t.agirlik)} ${e}</b> × ${t.tekrar}</span>`).join("")}</div>`:""}
    ${a.bir?'<p class="oz-kural">Tahmini 1 tekrar maksimumu en fazla 10 tekrarlı setlerden hesaplanır (Brzycki); ısınma setleri sayılmaz.</p>':""}</div></div>`:""}export const GUVENLIK_NOTU="Ağrı, baş dönmesi, göğüs ağrısı ya da olağandışı nefes darlığı olursa hemen dur. Bir sağlık sorunun varsa, gebeysen ya da uzun süredir hareketsizsen başlamadan önce hekimine danış. FSet tıbbi tavsiye vermez.",ilkAgirlikNotu=a=>a?.setType!=="weight_reps"||a.equipment==="bodyweight"?"":`İlk seansta hedef tekrarı temiz teknikle bitirip 2–3 tekrar daha yapabileceğin ağırlığı seç.${a.equipment==="barbell"?" Önce boş barla tekniği öğren.":""}`;const P=(a,s)=>a.type==="time"?`${fmt(a.seconds)} sn`:a.type==="cardio"?`${fmt(a.minutes)} dk`:a.weight?`${fmt(a.weight)} ${s} × ${a.reps??"—"}`:`${a.reps??"—"} tekrar`,sa=a=>a.target?.minutes!=null?`${a.target.minutes} dk`:a.target?.seconds!=null?`${a.sets} × ${a.target.seconds} sn`:`${a.sets} × ${a.target?.reps??"—"}`;export function hareketHTML(a){if(c.esnemeById[a.hareketId])return Fa(c.esnemeById[a.hareketId],c.tutusSn(a.settings?.profil));const s=c.byId[a.hareketId];if(!s)return`<div class="ust"><button class="ib" data-act="to-hareketler" aria-label="Hareketlere dön">${l("geri")}</button></div>
    <div class="sayfa-baslik"><h1>Hareket bulunamadı</h1></div>`;const e=String(s.mus??"").split("·").map(r=>r.trim()).filter(Boolean),i=a.hareketGecmisi,n=a.settings?.unit??"kg",t=r=>h.fmtShort(new Date(r));return`
    <div class="ust"><button class="ib" data-act="to-hareketler" aria-label="Hareketlere dön">${l("geri")}</button>
      <span class="tarih">${esc(s.grup??"")}</span><span class="ib-yer"></span></div>
    <div class="sayfa-baslik"><h1>${adi(s)}</h1>${s.en?`<p lang="en">${esc(s.en)}</p>`:""}</div>
    ${cizimsiz(s)?'<div class="grup"><div class="ic"><p>Özel hareket · çizimi yok.</p></div></div>':`<div class="buyuk3b"><div class="sahne3d" id="hareket3d" role="img" aria-label="${adi(s)} hareket çizimi; sürükleyerek döndürülür"></div>
         <img class="damga" src="icons/isaret.svg" alt="" width="30" height="17"><span class="ipucu">Sürükle: döndür · dokun: yeniden oynat</span></div>`}
    <p class="kunye">${[f[s.equipment],`Önerilen ${sa(s)}`].filter(Boolean).map(esc).join(" · ")}</p>
    ${e.length?`<div class="grup"><h2 class="etiket">Çalışan kaslar</h2><div class="ic"><div class="kaslar">${e.map((r,d)=>`<span class="kas${d<2?" ana":""}">${esc(r)}</span>`).join("")}</div></div></div>`:""}
    ${s.fayda?`<div class="grup"><h2 class="etiket">Faydası</h2><div class="ic"><p>${esc(s.fayda)}</p></div></div>`:""}
    <div class="grup"><h2 class="etiket">Geçmişin</h2><div class="ic">${i?`
      <div class="ozet-iki">
        <div><small>Son · ${t(i.son.at)}</small><b>${P(i.son.set,n)}</b></div>
        <div><small>En iyi · ${t(i.enIyi.at)}</small><b>${P(i.enIyi.set,n)}</b></div></div>
      <p class="kucuk-yazi">${i.sayi} seansta yapıldı</p>
      ${i.not?`<p class="seans-notu">${l("liste")}<span>${esc(i.not.metin)} <small>· ${t(i.not.at)}</small></span></p>`:""}`:"<p>Bu hareketi henüz kaydetmedin.</p>"}</div></div>
    ${es(a.hareketRekor,i,n,t)}
    ${s.steps?.length?`<div class="grup"><h2 class="etiket">Nasıl yapılır</h2><div class="ic"><ol class="adimlar">${s.steps.map(r=>`<li>${esc(r)}</li>`).join("")}</ol></div></div>`:""}
    ${s.tip?`<div class="grup"><h2 class="etiket">Dikkat</h2><div class="ipucu-kutu">${esc(s.tip)}</div></div>`:""}
    ${ilkAgirlikNotu(s)?`<p class="kucuk-yazi grup-alti">${ilkAgirlikNotu(s)}</p>`:""}
    <p class="kucuk-yazi grup-alti">${GUVENLIK_NOTU}</p>
    <div class="grup eylemler"><button class="btn p" data-act="hareket-ekle-ac">${l("arti")}Programa ekle</button>
      ${s.ozel?`<button class="btn s" data-ozel-sil="${esc(s.id)}">${l("sil")}Hareketi sil</button>`:""}</div>
    ${sekmelerHTML("hareketler")}`}export function hareketEkleHTML(a){const s=c.byId[a.hareketId],e=c.programGetir(a.hareketEkle?.programId)??c.aktifProgram();return s?`
    <div class="ust"><button class="ib" data-act="hareket-ekle-kapat" aria-label="Kapat">${l("carpi")}</button>
      <span class="tarih">Programa ekle</span><span class="ib-yer"></span></div>
    <div class="sayfa-baslik"><h1>${adi(s)}</h1><p>Hangi programın hangi gününe?</p></div>
    <div class="grup"><h2 class="etiket">Program</h2><div class="kaydir" role="group" aria-label="Program">${c.programListesi().map(i=>`<button class="cip" aria-pressed="${i.id===e.id}" data-he-prg="${esc(i.id)}">${esc(i.ad)}</button>`).join("")}</div></div>
    <div class="grup"><h2 class="etiket">Gün</h2><div class="gun-secim">${e.gunler.map((i,n)=>`
      <button class="satir" data-he-gun="${n}">
        <span class="ad"><b>${c.gunEtiketi(n,e).kisa}</b><span>${[c.gunEtiketi(n,e).kaslar,`${i.hareketler.length} hareket`,i.hareketler.some(t=>t.exId===s.id)&&"bu günde var"].filter(Boolean).map(esc).join(" · ")}</span></span>
        <span class="durum ikon">${l("arti")}</span>
      </button>`).join("")}</div></div>
    <p class="kucuk-yazi grup-alti">${esc(sa(s))} hedefiyle eklenir; programda değiştirebilirsin.</p>`:""}export function ozelHTML(a){const s=a.ozelForm,e=(i,n,t)=>Object.entries(n).map(([r,d])=>`<button class="cip" aria-pressed="${t===r}" data-${i}="${r}">${d}</button>`).join("");return`
    <div class="ust"><button class="ib" data-act="ozel-kapat" aria-label="Hareket seçiciye dön">${l("geri")}</button>
      <span class="tarih">Özel hareket</span><span class="ib-yer"></span></div>
    <div class="sayfa-baslik"><h1>Özel hareket</h1>
      <p>Listede olmayan hareketi kendin ekle. Çizimi olmaz; kaydı ve geçmişi diğerleri gibi tutulur.</p></div>
    <div class="form-alan"><label for="o-ad">Adı</label>
      <input id="o-ad" class="metin" value="${esc(s.ad)}" maxlength="60" autocomplete="off" placeholder="ör. Smith makinesinde squat"></div>
    <div class="form-alan"><span class="etiket">Nasıl kaydedilsin?</span>
      <div class="cip-izgara">${e("otur",ta,s.setType)}</div></div>
    <div class="form-alan"><span class="etiket">Ekipman</span>
      <div class="cip-izgara">${e("oeq",f,s.equipment)}</div></div>
    <div class="form-alan"><span class="etiket">Çalışan kas</span>
      <div class="cip-izgara">${e("ogrup",Object.fromEntries(A.map(i=>[i,i])),s.grup)}</div></div>
    <div class="alt"><button class="btn p" data-act="ozel-kaydet">Ekle ve güne koy</button></div>`}
