/*! © 2026 Sabri Temel — tüm hakları saklıdır. Kullanım koşulları: kosullar.html */
import*as u from"./session.js";import*as h from"./schedule.js";import{dayKey as F}from"./store.js";import{mmss as _}from"./timer.js";import*as f from"./ilerleme.js";import*as H from"./rekorlar.js";import{GRUPLAR as I,EKIPMAN as y,SET_TURU as ea}from"./program.js";import{HAZIR as U,SORULAR as ia,oner as ta,hazirBul as O}from"./data/hazir.js";import{AD as Y,SURUM as na}from"./marka.js";import*as g from"./avatar.js";import{KURULUM_TARIFI as ra,bantGoster as la}from"./kurulum.js";import*as w from"./hazirlik.js";export const fmt=(a,s=2,e=0)=>a==null||!Number.isFinite(+a)?"—":(+a).toLocaleString("tr-TR",{minimumFractionDigits:e,maximumFractionDigits:s}),esc=a=>String(a).replace(/[&<>"']/g,s=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[s]);const l=a=>`<svg class="i" aria-hidden="true"><use href="#i-${a}"/></svg>`;export const adi=a=>esc(a.ad??a.tr??a.en??"");const da=a=>a.en&&a.en!==(a.ad??a.tr)?`<span lang="en">${esc(a.en)}</span>`:"";export const cizimsiz=a=>!!(a.ozel||a.bilinmeyen),setLabel=a=>a.type==="time"?`${fmt(a.seconds)} sn`:a.type==="cardio"?`${fmt(a.minutes)} dk`:a.weight==null?`${fmt(a.reps)} tekrar`:`${fmt(a.weight)} × ${fmt(a.reps)}`;const C=(a,s)=>a.type==="time"?`${fmt(a.seconds)} sn`:a.type==="cardio"?`${fmt(a.minutes)} dk`:a.weight==null?`${fmt(a.reps)} tekrar`:`${fmt(a.weight)} ${s}`;export function lastTime(a,s,e,i=!1){const t=s[a.id];if(!t)return i?"Bu hareketi ilk kez yapıyorsun.":"Bu hareketin ilk kaydı.";const n=t.sets.map(setLabel),o=n.every(p=>p===n[0])?`<b>${n[0]}</b> · ${n.length} set`:`<b>${n.join(" · ")}</b>`,d=t.sets.at(-1)?.rir;return`Geçen sefer · ${h.relativeLabel(new Date(t.at))} · ${o}${d!=null?` · son set RIR ${d}`:""}`}export function hazirlikGoster(a){const{session:s,settings:e}=a;return a.hazirlik?!0:e.hazirlikSor!==!1&&e.hazirlikGunu?.d!==F()&&!u.hasAnySet(s)&&!s.warmupDone&&!s.hazirlik}function oa(a){const s=a.session.hazirlik?.azalan;if(s?.length&&!a.hazirlik)return`<div class="not hafif-not">${l("nabiz")}<span>Bugün ${s.length} harekette birer set az
      (toparlanma kontrolü). <button class="bag" data-act="hz-geri">Programdaki gibi yap</button></span></div>`;if(!hazirlikGoster(a))return"";const e=a.hazirlik?.cevap??{},i=w.degerlendir(e),t=w.SORULAR.map(r=>`<div class="hz-soru"><p>${esc(r.soru)}</p>
      <div class="segment" role="group" aria-label="${esc(r.soru)}">${r.secenekler.map(([o,d])=>`<button data-hz="${r.id}:${o}" aria-pressed="${e[r.id]===o}">${d}</button>`).join("")}</div></div>`).join(""),n=i?`<div class="hz-sonuc ${i.duzey}" role="status"><b>${i.baslik}</b><p>${i.metin}</p>
      ${i.duzey==="hafif"?`<div class="cift dikey"><button class="btn p" data-act="hz-hafif">Hareketlerde birer set az yap</button>
             <button class="btn s" data-act="hz-tamam">Programdaki gibi devam et</button></div>`:`<button class="btn ${i.duzey==="uy"?"p":"s"}" data-act="hz-tamam">Tamam</button>`}</div>`:"";return`<div class="grup hazirlik"><h2 class="etiket">Bugün nasılsın?</h2><div class="ic">
      ${t}${n}
      ${i?"":'<button class="bag hz-gec" data-act="hz-gec">Bugün sorma</button>'}
      <p class="kucuk-yazi">${esc(w.KART_NOTU)}</p>
    </div></div>`}const ca=a=>a?`
  <div class="grup carry"><div class="ic">
    <p class="baslik-satir">${u.gunEtiketiSeans(a.session).kisa} yarım kaldı</p>
    <p class="alt-satir">${h.relativeLabel(new Date(a.session.finishedAt??a.session.startedAt))}
      · ${a.yapilan}/${a.toplam} hareket</p>
    <p>${a.kalan.map(adi).join(" · ")}</p>
    <div class="cift dikey">
      <button class="btn s" data-act="carry-skip">Sıradakine geç</button>
      <button class="btn p" data-act="carry-go">Bu güne devam et</button>
    </div>
  </div></div>`:"",ua=a=>{const{session:s,dayIndex:e,onerilen:i,gunSecici:t}=a;if(!t)return"";const n=u.canSwitchDay(s),r=u.gunEtiketi(e).kisa;return n.ok?`<div class="grup picker"><h2 class="etiket">Bugün ne yapıyorsun?</h2><div class="ic">
    <div class="picks">${u.allDays().map(d=>{const{kisa:p,kaslar:$}=u.gunEtiketi(d.dayIndex);return`<button class="pick" data-gun-sec="${d.dayIndex}" aria-pressed="${d.dayIndex===e}">
      <span class="pick-ad">${p}</span><span class="pick-kas">${esc($)}</span>
      ${d.dayIndex===i?'<span class="pick-not">program önerisi</span>':""}
    </button>`}).join("")}</div>
    <p>${r}'ü telefonsuz yaptıysan işaretle: kayda geçer, sıra sonraki güne atlar.
      Ağırlıklar bilinmediği için hacme ve "geçen sefer"e karışmaz.</p>
    <button class="btn s" data-act="gun-yapildi">${r}'ü yapıldı işaretle</button>
  </div></div>`:`<div class="grup picker"><div class="ic">
    <p>Bugün set girdin; günü değiştirmek bu setleri yanlış güne bağlardı. Önce <b>Seansı bitir</b>
      ya da Ayarlar'dan <b>Bugünü sıfırla</b>.</p></div></div>`};function pa(a,s,e,i){const t=s.sets.filter(r=>!r.warmup).at(-1);if(t)return`<b>${C(t,i.unit)}</b>${s.calisma}/${s.hedef}`;const n=e?.sets?.at(-1);return n?`<b>${C(n,i.unit)}</b>geçen`:`<b>${u.repsLabel(a,i)}</b>hedef`}const $a=a=>a.tamam?`<span class="durum tamam">${l("tik")}</span>`:a.calisma>0?`<span class="durum kismi" style="--p:${Math.round(a.calisma/a.hedef*100)}"></span>`:'<span class="durum bos"></span>';function ma(a,s,e){if(s.tur==="isinma")return`<button class="btn p" data-act="warmup">Isınmaya başla${l("ileri")}</button>`;if(s.tur==="bitir")return'<button class="btn p" data-act="finish">Seansı bitir</button>';const i=u.hasAnySet(a.session),t=e[s.idx],n=s.basladi?"Devam et":i?"Sıradaki":"Başla",r=`<button class="btn p iki" data-go="${s.idx}" aria-label="${n}: ${adi(t)}">
      <span><small>${n}</small><b>${adi(t)}</b></span></button>`;return i?`<div class="cift"><button class="btn s" data-act="finish" aria-label="Seansı bitir">Bitir</button>${r}</div>`:r}export function listHTML(a){const{session:s,dayIndex:e,settings:i,status:t,yarim:n,oncekiYapilan:r,gunSecici:o,lastPerf:d={}}=a,p=u.exercisesFor(e),$=u.progress(s,e,i),m=u.summaryVolume(s),b=Math.max(0,Math.round((Date.now()-s.startedAt)/6e4)),{kisa:k,kaslar:c}=u.gunEtiketi(e),v=u.siradakiEylem(s,e,i),z=v.tur==="hareket"?v.idx:-1,j=p.map((T,K)=>{const M=u.exerciseProgress(s,T,i),P=r?.has(T.id),N=[M.tamam&&"bitti",K===z&&"simdi",P&&!M.calisma&&"onceki"].filter(Boolean).join(" ");return`<button class="satir${N?" "+N:""}" data-go="${K}">
      ${$a(M)}
      <span class="ad"><b>${adi(T)}</b>${P&&!M.calisma?"<span>geçen sefer yapıldı</span>":da(T)}</span>
      <span class="sag">${pa(T,M,d[T.id],i)}</span>
    </button>`}).join(""),B=`<button class="satir${s.warmupDone?" bitti":""}" data-act="warmup">
    <span class="durum ${s.warmupDone?"tamam":"ikon"}">${l(s.warmupDone?"tik":"alev")}</span>
    <span class="ad"><b>Isınma</b><span>${u.warmupFor(e).length+1} adım · ${u.isinmaSuresi(e)}</span></span>
    <span class="sag">${s.warmupDone?"yapıldı":"başla"}</span>
  </button>`,S=u.finisherFor(e),[R,aa]=S?S.h.split(" — "):[],sa=S?`<div class="satir">
    <span class="durum ikon">${l("nabiz")}</span>
    <span class="ad"><b>${R}</b><span>${S.p}</span></span>
    <span class="sag"><b>${aa??""}</b>bitişte</span>
  </div>`:"";return`
    <div class="ust liste-ust">
      <span class="tarih">${t.label}</span>
      <span class="tarih">${esc(u.aktifProgram().ad)}</span>
    </div>
    <button class="cip gun-cip" data-act="gun-ac" aria-expanded="${!!o}" aria-label="Günü değiştir: ${k}">
      ${k}${l(o?"yukari":"asagi")}</button>
    <div class="gun-baslik"><h1>${esc(c)}</h1></div>
    ${kurulumBantHTML(a)}
    ${oa(a)}
    ${t.isTrainingDay?"":`<div class="not">${l("takvim")}<span>Program günü değil; yine de kaydedebilirsin.
      Sıradaki antrenman <b>${t.next?h.fmtShort(t.next):"—"}</b>.</span></div>`}
    ${ua(a)}
    <div class="ozet">
      <div><b>${$.done}<small>/${$.total}</small></b><span>Set</span></div>
      <div><b>${fmt(m.kg,0)}<small>${i.unit}</small></b><span>Hacim</span></div>
      <div><b>${b}<small>dk</small></b><span>Süre</span></div>
    </div>
    ${ca(n)}
    ${p.length?`<div class="liste">${B}${j}${sa}</div>
    <div class="alt alt-sekmeli">${ma(a,v,p)}</div>`:`<div class="grup"><div class="ic"><p>Bu günde henüz hareket yok.</p>
        <button class="btn s" data-program-ac="${esc(u.aktifProgram().id)}">Programı düzenle</button></div></div>`}
    ${sekmelerHTML("bugun")}`}function ba(a,s,e=""){if(cizimsiz(a))return`<div class="fig"><div class="sahne3d cizimsiz" role="img" aria-label="${adi(a)}: çizim yok">
      ${l("figur")}<span>${a.ozel?"Özel hareket · çizimi yok":"Bu hareketin tanımı bulunamadı"}</span></div></div>`;if(a.hold){const i=Math.max(0,a.variants.findIndex(t=>t.ok));return s.calisma>=1?`<div class="fig">
        <div class="sahne3d" data-varyant="${i}" role="img" aria-label="${adi(a)}: doğru duruş"></div>
        <p class="fig-not">${l("tik")}${a.variants[i].note} · hatalar ? panelinde</p>${e}
      </div>`:`<div class="variants">${a.variants.map((t,n)=>`<figure class="${t.ok?"ok":""}">
        <div class="sahne3d" data-varyant="${n}" aria-hidden="true"></div>
        <figcaption><b>${l(t.ok?"tik":"carpi")}${esc(t.label)}</b><span>${esc(t.note)}</span></figcaption>
      </figure>`).join("")}</div>`}return`<div class="fig${a.setType==="weight_reps"?" zemin":""}">
    <div class="sahne3d" id="fig3d" role="img" aria-label="${adi(a)} hareket çizimi; sürükleyerek döndürülür"></div>${e}
  </div>`}const ka={agir:"en ağır set",bir:"tahmini 1RM",hacim:"set hacmi",tekrar:"en çok tekrar",sure:"en uzun süre"};function va(a,s){const e=a.rozet;if(!e||e.exId!==s.id||Date.now()>e.bitis)return"";const i=e.tur==="tekrar"?fmt(e.simdi):rekorDeger(e.tur,e.simdi,a.settings.unit);return`<div class="rekor-rozet" role="status">${l("yildiz")}<span>Yeni rekor · <em>${ka[e.tur]} ${i}</em></span></div>`}function ga(a,s){const e=a.rirSor;if(!e||e.exId!==s.id||Date.now()>e.bitis)return"";const i=u.effective(s,a.settings).rir;return`<div class="rir-sor" role="group" aria-label="Bu sette kaç tekrar daha yapabilirdin?">
      <span>Kaç tekrar daha yapabilirdin?</span>
      <div class="rir-cipler">${q.map(t=>`<button class="cip${t===i?" hedef":""}" data-rir="${t}" aria-label="RIR ${t}${t===4?" ya da daha çok":""}${t===i?" (hedef)":""}">${t===4?"4+":t}</button>`).join("")}
        <button class="rir-kapat" data-rir="x" aria-label="Sorma, kapat">${l("carpi")}</button></div>
    </div>`}function ha(a,s){const e=s.session?.entries.find(t=>t.exerciseId===a.id)?.note??"",i=s.lastPerf?.[a.id]?.not;return`<div class="not-alani">
      <label class="etiket" for="ex-not">Notun</label>
      <textarea id="ex-not" data-not="${esc(a.id)}" maxlength="${u.NOT_SINIR}" rows="2"
        placeholder="${i?esc(i):"Ör. koltuk 4. delik · sol omuz biraz gergin"}">${esc(e)}</textarea>
      ${i?'<p class="kucuk-yazi">Gri yazı son notun; bugüne kaydedilmez. Bugün için yeni not yazabilirsin.</p>':""}
    </div>`}function ya(a,s){const e=u.effective(a,s.settings);return`<section class="sheet" id="sheet" aria-hidden="true" inert aria-label="Hedef ve anlatım">
      <button class="grab" data-act="sheet-close" aria-label="Kapat"></button>
      <div class="sheet-in">
        <h2>${adi(a)}</h2>
        ${a.en?`<p class="alt-baslik" lang="en">${esc(a.en)}</p>`:""}
        ${ha(a,s)}
        ${wa(a,s)}
        ${oneriHTML(a,s)}
        <div class="goal">
          <div class="goal-hd">
            <span class="etiket">Hedef · ${esc(u.aktifProgram().ad)}</span>
            ${e.edited?'<button class="cip" data-act="goal-reset">Programa dön</button>':""}
          </div>
          ${Ra(a,s)}
          <button class="btn p" data-act="goal-save">Hedefi kaydet</button>
          <p class="goal-note">Hedef <b>${esc(u.aktifProgram().ad)}</b> içindeki bu hareketin hedefidir; kaydedince program
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
    </section>`}const fa=a=>{const s=u.exercisesFor(a.dayIndex)[a.idx];return s?u.dinlenmeSuresi(s,a.settings):a.settings.restSeconds};export function gezinmeHTML(a,s=null,e=0){if(s===null){const i=u.exercisesFor(a.dayIndex).length-1;return`<div class="gezinme" id="gezinme">
      <button data-act="prev" ${a.idx===0?"disabled":""} aria-label="Önceki hareket">${l("geri")}Önceki</button>
      <button class="dinlenme" data-act="rest">${l("saat")}Dinlenme ${fa(a)} sn</button>
      <button data-act="next" ${a.idx===i?"disabled":""} aria-label="Sonraki hareket">Sonraki${l("ileri")}</button>
    </div>`}return`<div class="gezinme run" id="gezinme">
    <button data-act="rest-plus" aria-label="Dinlenmeye 30 saniye ekle">+30</button>
    <div class="dinlenme" role="timer" aria-label="Kalan dinlenme">
      <b id="rest-time">${_(s)}</b>
      <span class="bar"><i id="rest-bar" style="transform:scaleX(${e?(s/e).toFixed(3):0})"></i></span>
    </div>
    <button data-act="rest-skip">Geç</button>
  </div>`}const za={dumbbell:"tek dambıl",barbell:"bar dahil",machine:"makinede seçili"};export const BAR_KG=20;const Sa=[25,20,15,10,5,2.5,1.25];export function plakaYazi(a,s,e){if(a.equipment==="bodyweight")return+s>0?"ek ağırlık":"ek ağırlık · 0 = yalnız vücut";if(a.equipment!=="barbell")return za[a.equipment]??"";const i=+s;if(e!=="kg"||s==null||s===""||!Number.isFinite(i))return"bar dahil";if(i<BAR_KG)return`boş bar ${BAR_KG} kg`;let t=(i-BAR_KG)/2;const n=[];for(const r of Sa)for(;t>=r-1e-9;)n.push(r),t-=r;return t>1e-9?"bar dahil":n.length?`her yana ${n.map(r=>fmt(r)).join(" + ")}`:"yalnız bar"}export const tekrarAlt=(a,s)=>{const e=u.effective(a,s.settings);return`Hedef <b>${e.repsMin?`${e.repsMin}-`:""}${fmt(e.reps)}</b>`};const Ta=a=>`Hedef <b>${a}</b>`;export function kaydetEtiketi(a,s,e){return a.setType==="time"?"Süreyi kaydet":e.draft.warmup?"Isınma setini kaydet":"Seti kaydet"}export function setEtiketi(a,s){if(a.tamam)return"Bütün setler tamam";if(s.draft.warmup)return"<b>Isınma</b> seti · sete sayılmaz";const e=a.sets.filter(i=>i.warmup).length;return`<b>${a.calisma+1}.</b> set · ${a.hedef} setten${e?` · ısınma ×${e}`:""}`}function Aa(a,s,e){const i=Math.max(a.hedef,a.calisma),t=s.rekorTaban?.[e?.id],n=a.sets.filter(d=>!d.warmup),r=d=>!!t&&!!H.setRekoru(n[d],[...t,...n.slice(0,d)]),o=Array.from({length:i},(d,p)=>p<a.calisma?r(p)?`<i class="bitti rekor">${l("yildiz")}</i>`:`<i class="bitti">${l("tik")}</i>`:`<i class="${p===a.calisma?"simdi":""}">${p+1}</i>`).join("");return`<div class="set-ilerleme"><span id="set-etiket">${setEtiketi(a,s)}</span><span class="cubuk" aria-hidden="true">${o}</span></div>`}const E=({ad:a,deger:s,alt:e,artir:i,azalt:t,etiket:n,sinif:r="",azaltPasif:o=!1})=>`
  <div class="sutun ${r}">
    <button class="ok" ${i} aria-label="${n} artır">${l("yukari")}</button>
    <span class="etk">${a}</span>
    ${s}
    <span class="s-alt">${e}</span>
    <button class="ok" ${t} aria-label="${n} azalt"${o?" disabled":""}>${l("asagi")}</button>
  </div>`;function Ma(a,s,e){const{settings:i}=e,t=u.effective(a,i),n=f.agirlikAdimi(a,i)??f.GIRIS_ADIMI_YEDEK,r=e.draft.weight,o=i.unit,d=r==null?"":String(r);return`<div class="sutunlar">
    ${E({ad:"SET",etiket:"Bugünkü set sayısını",deger:`<b class="n">${s.hedef}</b>`,alt:Ta(t.sets),artir:'data-act="set-arti"',azalt:'data-act="set-eksi"',azaltPasif:s.hedef<=s.calisma+1})}
    ${E({ad:"TEKRAR",etiket:"Tekrarı",deger:`<input class="n" type="number" inputmode="numeric" step="1" min="1" id="f-reps" value="${e.draft.reps??t.reps??""}" aria-label="Bu setin tekrarı">`,alt:`<span id="tk-alt">${tekrarAlt(a,e)}</span>`,artir:'data-step="reps:1"',azalt:'data-step="reps:-1"'})}
    ${E({ad:"AĞIRLIK",etiket:"Ağırlığı",sinif:"genis",deger:`<span class="n-kap"><input class="n${d.length>=5?" uzun":""}" type="number" inputmode="decimal" step="${n}" min="0"
               id="f-weight" value="${d}" placeholder="0" aria-label="Ağırlık (${o})"><small>${o}</small></span>`,alt:`<span id="plaka-yazi">${plakaYazi(a,r,o)}</span>`,artir:`data-step="weight:${n}"`,azalt:`data-step="weight:${-n}"`})}
  </div>`}const V=(a,s)=>`<p class="gecen">${l("gecmis")}<span>${lastTime(a,s.lastPerf,s.settings.unit,u.exerciseProgress(s.session,a,s.settings).sets.length>0)}</span></p>`;function Ha(a,s,e){const i=u.effective(a,e.settings),t=a.setType==="time"?`${s.hedef} × ${fmt(i.seconds)} sn`:a.setType==="cardio"?`${fmt(i.minutes)} dk`:`${s.hedef} × ${i.repsMin?`${i.repsMin}-`:""}${fmt(i.reps)}${i.rir!=null?` · RIR ${i.rir}`:""}`,n=e.lastPerf[a.id]?.sets?.filter(o=>!o.warmup)??[],r=n.length?n.reduce((o,d)=>(d.weight??d.seconds??d.minutes??0)>(o.weight??o.seconds??o.minutes??0)?d:o):null;return`Hedef ${t}${r?` · geçen ${setLabel(r)}`:""}`}const Ia=(a,s,e,i,t,n="")=>`
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
  </div>`;function La(a,s,e){const i=u.effective(a,e.settings);if(a.setType==="time"){const t=e.draft.seconds??i.seconds;return`<div class="clock" id="clock">
      <span class="etiket">Hedef süre</span>
      <div class="crow">
        <button class="cadj" data-act="clock-minus" aria-label="5 saniye azalt">−5</button>
        <span class="time" id="clock-time" role="timer">${_(t)}</span>
        <button class="cadj" data-act="clock-plus" aria-label="5 saniye ekle">+5</button>
      </div>
    </div>`}return a.setType==="cardio"?Ia("minutes",e.draft.minutes??i.minutes,5,"Süre","dk",V(a,e)):Ma(a,s,e)}export const SEMALAR=[[3,8],[3,10],[3,12],[4,8],[4,6],[5,5]];const ja=[15,20,30,45,60,90];export const noktalarHTML=(a,s,e="")=>`<div class="noktalar-set" role="radiogroup" aria-label="Set sayısı">${Array.from({length:10},(i,t)=>`<button role="radio" aria-checked="${t+1===s}" class="${t<s?"on":""}" data-${a}="${e}${t+1}" aria-label="${t+1} set"><i></i></button>`).join("")}</div>`,tekrarSeridiHTML=(a,s,e="")=>`<div class="serit-t" role="radiogroup" aria-label="Tekrar">${Array.from({length:Math.max(30,s??0)},(i,t)=>t+1).map(i=>`<button role="radio" aria-checked="${i===s}" data-${a}="${e}${i}">${i}</button>`).join("")}</div>`,semalarHTML=(a,s,e,i="")=>`<div class="semalar" role="group" aria-label="Hazır şema">${SEMALAR.map(([t,n])=>`<button class="cip" aria-pressed="${t===s&&n===e}" data-${a}="${i}${t}:${n}">${t} × ${n}</button>`).join("")}</div>`;const q=[0,1,2,3,4],Ba=[60,90,120,180,240];export function yontemHTML(a,s,e="",i=60,{tekrarli:t=!0}={}){const n=(d,p,$,m,b=$)=>`<button class="cip" aria-pressed="${m}" data-${a}="${e}${d}:${p}" aria-label="${esc(b)}">${$}</button>`,r=(d,p,$)=>`<div class="g-alan"><div class="g-etk"><span>${d}</span><b>${p}</b></div>
      <div class="semalar" role="group" aria-label="${d}">${$}</div></div>`;let o="";if(t&&s.reps>1){const d=[...new Set([s.reps-4,s.reps-3,s.reps-2,...s.repsMin?[s.repsMin]:[]])].filter(p=>p>=1&&p<s.reps).sort((p,$)=>p-$);o+=r("Tekrar aralığı",s.repsMin?`${s.repsMin}-${s.reps}`:"tek sayı",n("repsMin","x","Tek sayı",!s.repsMin)+d.map(p=>n("repsMin",p,`${p}-${s.reps}`,s.repsMin===p,`${p} ile ${s.reps} arası`)).join("")),o+=r("Hedef RIR",s.rir!=null?`${s.rir}`:"yok",n("rir","x","Yok",s.rir==null,"Hedef RIR yok")+q.map(p=>n("rir",p,p===4?"4+":`${p}`,s.rir===p,`RIR ${p}`)).join(""))+'<p class="g-not">RIR: setin sonunda kaç temiz tekrar daha yapabilirdin. 2 = iki tekrar daha çıkardı.</p>'}return o+=r("Dinlenme",`${s.dinlenme??i} sn`,n("dinlenme","x",`Genel (${i} sn)`,s.dinlenme==null,"Genel ayar")+Ba.map(d=>n("dinlenme",d,`${d} sn`,s.dinlenme===d)).join("")),o}function Ra(a,s){const{settings:e}=s,i=u.effective(a,e),t=f.agirlikAdimi(a,e)??f.GIRIS_ADIMI_YEDEK,n=(d,p,$,m)=>`<div class="gf">
      <span class="etiket">${m}</span>
      <div class="gbox">
        <button data-gstep="${d}:${-$}" aria-label="${m} azalt">${l("eksi")}</button>
        <input type="number" inputmode="decimal" step="${$}" min="0" id="g-${d}" value="${p??""}" placeholder="—" aria-label="${m}">
        <button data-gstep="${d}:${$}" aria-label="${m} artır">${l("arti")}</button>
      </div>
    </div>`,r=`<div class="g-alan"><div class="g-etk"><span>Set sayısı</span><b id="g-sets-yaz">${i.sets}</b></div>
      ${noktalarHTML("gset",i.sets)}<input type="hidden" id="g-sets" value="${i.sets}"></div>`,o=(d={})=>`<div id="g-yontem">${yontemHTML("g-yontem",i,"",e.restSeconds,d)}</div>`;return a.setType==="time"?`${r}
    <div class="g-alan"><div class="g-etk"><span>Süre</span><b id="g-seconds-yaz">${fmt(i.seconds)} sn</b></div>
      <div class="semalar" role="group" aria-label="Süre">${[...new Set([...ja,i.seconds])].sort((d,p)=>d-p).map(d=>`<button class="cip" aria-pressed="${d===i.seconds}" data-gsn="${d}">${d} sn</button>`).join("")}</div>
      <input type="hidden" id="g-seconds" value="${i.seconds}"></div>${o({tekrarli:!1})}`:a.setType==="cardio"?`${r}<div class="goal-grid">${n("minutes",i.minutes,5,"Süre (dk)")}</div>`:`<div class="g-alan"><div class="g-etk"><span>Hazır şema</span></div>${semalarHTML("gsema",i.sets,i.reps)}</div>
    ${r}
    <div class="g-alan"><div class="g-etk"><span>Tekrar</span><b id="g-reps-yaz">${i.reps}</b></div>
      ${tekrarSeridiHTML("greps",i.reps)}<input type="hidden" id="g-reps" value="${i.reps}"></div>
    ${o()}
    <div class="goal-grid">${n("weight",i.weight,t,`Planlanan ağırlık (${e.unit})`)}</div>`}function wa(a,s){return a.setType==="cardio"?"":`<div class="set-satir">
      <span class="etiket"><span id="warm-ad">Isınma seti</span><small id="warm-not">Bu set hacme ve "geçen sefer"e karışmaz</small></span>
      <button class="cip" id="warm" data-act="warm" role="switch" aria-checked="${!!s.draft.warmup}"
              aria-labelledby="warm-ad" aria-describedby="warm-not">${s.draft.warmup?"Açık":"Kapalı"}</button>
    </div>`}export function warmupHTML(a){const{dayIndex:s}=a,e=u.warmupFor(s),{kaslar:i}=u.gunEtiketi(s),t=e.map(n=>`<div class="satir yalin" data-warm="${n.id}">
      <span class="ad"><b>${esc(n.ad)}</b><span>${esc(n.not)}</span></span>
      <span class="sag"><b>${esc(n.miktar)}</b></span>
      <div class="mini sahne3d" data-anim="${n.id}" aria-hidden="true"></div>
    </div>`).join("");return`
    <div class="ust"><button class="ib" data-act="to-list" aria-label="Listeye dön">${l("geri")}</button><span class="ib-yer"></span></div>
    <div class="sayfa-baslik"><h1>Isınma</h1><p>${esc(i)} · ${u.isinmaSuresi(s)} · sete sayılmaz</p></div>
    <div class="liste dagit">
      <div class="satir">
        <span class="durum ikon">${l("nabiz")}</span>
        <span class="ad"><b>${u.KARDIYO.ad}</b><span>${u.KARDIYO.not}</span></span>
        <span class="sag"><b>${u.KARDIYO.miktar}</b></span>
      </div>
      ${t}
    </div>
    <div class="alt"><button class="btn p" data-act="warmup-done">Isınma tamam, 1. harekete geç${l("ileri")}</button></div>`}export function oneriHTML(a,s){const e=s.oneri?.[a.id],i=s.session.entries.find(n=>n.exerciseId===a.id)?.sets;if(!f.oneriGecerliMi(e,i))return"";const t=s.settings.unit;return e.tur==="kal"?`<div class="oneri">${l("yildiz")}<span>Geçen sefer son sete RIR 0 ile vardın: <b>${fmt(e.agirlik)} ${t}</b> ile kal,
      tekrarları temiz tamamla</span></div>`:e.tur==="agirlik"?`<div class="oneri">${l("yildiz")}
      <span>İki seanstır ${e.setler} × ${e.tekrar} tamam${e.rir!=null?` (RIR ${e.rir}+)`:""}: <b>${fmt(e.agirlik)} ${t}</b> dene</span>
      ${s.draft.weight===e.agirlik?"":'<button class="cip" data-act="oneri-uygula">Uygula</button>'}
    </div>`:`<div class="oneri">${l("yildiz")}<span>İki seanstır ${fmt(e.agirlik)} ${t} ile hedef tamam. Sonraki
      ağırlık adımı büyük (%${Math.round(e.adimOrani*100)}); önce <b>${e.hedefTekrar} tekrara</b> çık.</span></div>`}function Ea(a){const s=u.aktifProgram(),e=s?.gunler[a.dayIndex];return e?`<div class="ust-yazi"><b>${esc(s.ad)}</b> · ${esc(e.ad?.trim()||u.gunEtiketi(a.dayIndex).kisa)}</div>`:""}export function focusHTML(a){const{session:s,dayIndex:e,idx:i,settings:t}=a,n=u.exercisesFor(e),r=n[i],o=u.exerciseProgress(s,r,t),d=n.map(($,m)=>`<i class="${u.exerciseProgress(s,$,t).tamam?"f":m===i?"c":""}"></i>`).join(""),p=i===n.length-1;return`
    <div class="ust uclu">
      <button class="ib" data-act="to-list" aria-label="Listeye dön">${l("geri")}</button>
      <div class="orta"><b>${i+1} / ${n.length}</b><span class="seritler" aria-hidden="true">${d}</span></div>
      <span class="sag-grup">
        ${o.sets.length?`<button class="ib" data-act="undo" aria-label="Son seti geri al">${l("geri-al")}</button>`:""}
        <button class="ib" data-act="sheet-open" aria-label="Nasıl yapılır, hedef ve ısınma seti">${l("soru")}</button>
      </span>
    </div>
    <div class="baslik">
      ${Ea(a)}
      <h1>${adi(r)}${r.grup?`<span class="kas-cip">${esc(r.grup.toLocaleUpperCase("tr"))}</span>`:""}</h1>
      <p>${Ha(r,o,a)}</p>
    </div>
    ${ba(r,o,ga(a,r)+va(a,r))}
    ${r.setType==="cardio"?"":Aa(o,a,r)}
    ${o.tamam?"":La(r,o,a)}
    ${r.setType==="time"&&!o.tamam?`<div class="gecen-bant">${V(r,a)}</div>`:""}
    <div class="foot">
      ${o.tamam?`<div class="cift">
             <button class="btn s" data-act="set-arti">${l("arti")}Bir set daha</button>
             ${p?'<button class="btn p" data-act="to-list">Listeye dön</button>':`<button class="btn p" data-act="next">Sonraki hareket${l("ileri")}</button>`}
           </div>`:r.setType==="time"?`<div class="cift">
               <button class="btn s" data-act="save">Kaydet</button>
               <button class="btn p" data-act="clock-start" id="clock-btn">Başlat</button>
             </div>`:`<button class="btn p" data-act="save" id="kaydet-btn">${kaydetEtiketi(r,o,a)}</button>`}
    </div>
    ${gezinmeHTML(a)}
    <div class="sheet-bg" data-act="sheet-close" hidden></div>
    ${ya(r,a)}`}const Da={agir:"en ağır set",bir:"tahmini 1 tekrar maksimumu",hacim:"en iyi set hacmi",tekrar:"en çok tekrar",sure:"en uzun süre"};export const rekorDeger=(a,s,e)=>a==="tekrar"?`${fmt(s)} tekrar`:a==="sure"?`${fmt(s)} sn`:a==="bir"?`${fmt(s,0)} ${e}`:a==="hacim"?`${fmt(s,0)} ${e}`:`${fmt(s)} ${e}`;const Ga=(a,s)=>a==="bir"||a==="hacim"?fmt(s,0):fmt(s);function Ka(a,s){if(!a)return"";const e=a.oncekiHacim>0?(a.hacim-a.oncekiHacim)/a.oncekiHacim:null,i=e==null?"":` · önceki döneme göre ${Math.abs(e)<5e-4?"aynı":`${e>0?"+":"−"}%${fmt(Math.abs(e*100),0)}`}`;return`<div class="oz-donem">
    <span class="ust-satir">${l("takvim")}DÖNEM TAMAM</span>
    <h2>${a.antrenman} antrenman, ${a.gun} günde</h2>
    <span class="alt-satir">${esc(a.program)}: programın bütün günlerini bitirdin.${a.rekorSayisi?` Bu dönemde ${a.rekorSayisi} rekor kırdın.`:""}</span>
    <div class="iki"><div><b>${fmt(a.hacim,0)} ${s}</b><span>Toplam hacim${i}</span></div>
      <div><b>${a.calismaSet}</b><span>Çalışma seti</span></div></div>
    ${a.hareketler.length?`<div>${a.hareketler.map(t=>`<div class="hareket"><span>${adi(t.ex)}</span><b>${fmt(t.once,0)} → ${fmt(t.simdi,0)} ${s}</b></div>`).join("")}
      <p class="oz-kural">Tahmini 1 tekrar maksimumu, önceki dönem → bu dönem.</p></div>`:""}
  </div>`}const Pa={rekor:"yildiz",gelisim:"grafik",istikrar:"takvim",zor:"alev"};function Na(a,s,e){return a.ovgu?{ikon:Pa[a.ovgu.tur]??"yildiz",baslik:a.ovgu.baslik,yazi:esc(a.ovgu.kanit)}:a.hacimFarki!=null&&a.hacimFarki>.005?{ikon:"grafik",baslik:`Hacim %${fmt(a.hacimFarki*100,0)} arttı`,yazi:`Geçen ${s}e göre aynı hareketlerde daha çok iş yaptın.`}:a.artislar.length?{ikon:"yukari",baslik:"Geçen seferden ağır",yazi:a.artislar.slice(0,2).map(t=>`${adi(t.ex)} ${fmt(t.once)} → ${fmt(t.simdi)} ${e}`).join(" · ")}:{ikon:"tik",notr:!0,baslik:"Antrenman tamam",yazi:`${[`${a.calismaSet} çalışma seti`,a.sure&&`${a.sure} dk`,a.kg&&`${fmt(a.kg,0)} ${e}`].filter(Boolean).join(" · ")}.`}}function Fa(a){if(!a)return"";const s=a.serit.length,e=Math.max(0,a.hedef-a.buHafta),i=(e?`Bu hafta ${e} antrenman daha kaldı.`:"Bu haftanın hedefi tamam.")+(s>=3&&a.tutulan?` Son ${s} haftada ${a.tutulan} kez hedefini tuttun.`:"");return`<div class="grup"><h2 class="etiket">Bu hafta</h2><div class="ic">
    <div class="oz-hafta"><b>${a.buHafta} / ${a.hedef} antrenman</b><span class="kucuk-yazi">hedefin haftada ${a.hedef}</span></div>
    <div class="oz-serit" aria-label="Son ${s} hafta">${a.serit.map((t,n)=>`<i class="${t}${n===s-1?" bu":""}"></i>`).join("")}</div>
    <div class="oz-serit-alt">${s>1?`<span>${s-1} hafta önce</span>`:"<span></span>"}<span>bu hafta</span></div>
    <p class="oz-kural">${i}</p></div></div>`}export function summaryHTML(a){const s=a.ozet;if(!s)return"";const e=a.settings.unit,{kisa:i,kaslar:t}=s.gun??u.gunEtiketi(s.dayIndex),n=Na(s,i,e),r=s.rekor?.kirilan??[],o=new Set(r.map(c=>c.exId)),d=s.hacimFarki==null?"":(()=>{const c=Math.abs(s.hacimFarki*100);return c<.05?"aynı":`${s.hacimFarki>0?"+":"−"}%${fmt(c,0)}`})(),p=s.onceki?s.calismaSet===s.onceki.calismaSet?"aynı":`${s.calismaSet>s.onceki.calismaSet?"+":"−"}${Math.abs(s.calismaSet-s.onceki.calismaSet)}`:"",$=!r.length&&!s.gunHacmi&&!s.rekor?.ilkler?.length?"":`<div class="grup"><h2 class="etiket">${r.length||s.gunHacmi?"Rekorlar":"İlk kayıt"}</h2><div class="ic">
    ${r.map(c=>`<div class="oz-kayit">${l("yildiz")}<b>${adi(u.byId[c.exId]??{ad:c.exId})}</b>
      <span class="oz-deger"><s>${Ga(c.ana.tur,c.ana.once)} →</s> <em>${rekorDeger(c.ana.tur,c.ana.simdi,e)}</em></span>
      <span class="oz-alt">${H.TUR_AD[c.ana.tur]}${c.turler.length>1?` · ayrıca ${c.turler.slice(1).map(v=>Da[v.tur]).join(", ")}`:""}</span></div>`).join("")}
    ${s.gunHacmi?`<div class="oz-kayit">${l("yildiz")}<b>Günün toplam hacmi</b>
      <span class="oz-deger"><s>${fmt(s.gunHacmi.once,0)} →</s> <em>${fmt(s.gunHacmi.simdi,0)} ${e}</em></span>
      <span class="oz-alt">${esc(i)} için en yüksek</span></div>`:""}
    ${s.rekor?.ilkler?.length?`<p class="oz-kural">İlk kayıt: ${s.rekor.ilkler.map(c=>adi(u.byId[c]??{ad:c})).join(", ")}. Bugünkü değerlerin taban oldu; sonraki seferlerde rekorlar sayılır.</p>`:""}
  </div></div>`,m=s.artislar.filter(c=>!o.has(c.ex.id)),b=m.length?`<div class="grup"><h2 class="etiket">Geçen seferden ağır</h2><div class="ic">${m.map(c=>`<div class="oz-kayit">${l("yukari")}<b>${adi(c.ex)}</b><span class="oz-deger"><s>${fmt(c.once)} →</s> <em>${fmt(c.simdi)} ${e}</em></span>
      <span class="oz-alt">En ağır çalışma seti</span></div>`).join("")}</div></div>`:"",k=s.gelecek?.length?`<div class="grup"><h2 class="etiket">Gelecek sefer</h2><div class="ic">${s.gelecek.map(c=>`<div class="oz-kayit">${c.tur==="artir"?l("yukari"):l("ileri").replace('class="i"','class="i notr"')}<b>${adi(c.ex)}</b><span class="oz-deger">${esc(c.deger)}</span>
      <span class="oz-alt neden">${esc(c.neden)}</span></div>`).join("")}
    <p class="oz-kural">Kural: aynı ağırlıkta iki seans üst üste hedef tekrarların hepsini yaparsan ağırlığı küçük bir adımla artır (ACSM). Öneridir; kutu yine geçen seferle dolar.</p></div></div>`:"";return`
    <div class="ust">
      <button class="cip" data-act="ozet-geri-al" aria-label="Bitirmeyi geri al, seansa dön">${l("geri-al")}Geri al</button>
      <span class="ib-yer"></span>
    </div>
    ${Ka(s.donem,e)}
    <div class="oz-haber">
      <span class="rozet${n.notr?" notr":""}">${l(n.ikon)}</span>
      <h1>${n.baslik}</h1><p>${n.yazi}</p>
      <span class="tarih">${esc(i)} · ${esc(t)} · ${h.fmtDate(new Date(s.bitis))}</span>
    </div>
    <div class="oz-uc">
      <div><b>${s.sure??"—"}<small>dk</small></b><span>Süre</span>${s.onceki?.sure?`<em>geçen sefer ${s.onceki.sure}</em>`:""}</div>
      <div><b>${s.calismaSet}<small>set</small></b><span>Set</span>${p?`<em>${p}</em>`:""}</div>
      ${s.kg?`<div><b>${fmt(s.kg,0)}<small>${e}</small></b><span>Hacim</span>${d?`<em class="${s.hacimFarki>5e-4?"art":""}">${d}</em>`:""}</div>`:`<div><b>${fmt(s.seconds??0)}<small>sn</small></b><span>Süre hareketi</span></div>`}
    </div>
    ${s.onceki?`<p class="oz-not">${s.hacimKismi?`Hacim farkı yalnız bugün de yapılan hareketlerde, geçen ${esc(i)}e göre.`:`Farklar geçen ${esc(i)}e göre.`}</p>`:""}
    ${$}${b}${k}${Fa(s.duzen)}
    ${s.yedekZamani?`<div class="not">${l("uyari")}<span>Veri yalnız bu telefonda. <b>Yedek almanın zamanı.</b></span></div>`:""}
    ${s.sonraki?`<p class="kucuk-yazi">Sıradaki antrenman: <b>${s.sonraki}</b></p>`:""}
    <div class="alt"><div class="cift">
      <button class="btn s" data-act="backup">Yedek al</button>
      <button class="btn p" data-act="ozet-tamam">Tamam</button>
    </div></div>`}function Z(a,{w:s=280,h:e=72,alan:i=!0}={}){if(a.length<2)return"";const t=Math.min(...a),n=Math.max(...a),r=(n-t)*.18||Math.max(1,n*.02),o=t-r,d=n+r,p=4,$=v=>p+v/(a.length-1)*(s-2*p),m=v=>p+(e-2*p)-(v-o)/(d-o)*(e-2*p),b=a.map((v,z)=>`${z?"L":"M"}${$(z).toFixed(1)} ${m(v).toFixed(1)}`).join(" "),k=$(a.length-1).toFixed(1),c=m(a.at(-1)).toFixed(1);return`<svg class="spark" viewBox="0 0 ${s} ${e}" preserveAspectRatio="none" role="img"
      aria-label="${a.length} ölçüm: ${fmt(a[0])} → ${fmt(a.at(-1))}">
    ${i?`<path class="alan-dolgu" d="${b} L${k} ${e} L${$(0).toFixed(1)} ${e} Z"/>`:""}
    <path class="cizgi" d="${b}"/>
    <path class="uc" d="M${k} ${c} h0"/>
  </svg>`}const _a=a=>{if(a.length<2)return"";const s=a.at(-1).kg-a[0].kg,e=Math.round((a.at(-1).ts-a[0].ts)/864e5),i=e>=14?`${Math.round(e/7)} hafta`:`${e} gün`;return Math.abs(s)<.05?`<span class="fark">değişmedi · ${i}</span>`:`<span class="fark">${s>0?"+":"−"}${fmt(Math.abs(s),1,1)} kg · ${i}</span>`};export function historyHTML(a){const{kilolar:s=[],gecmis:e=[],ilerleme:i=[],settings:t}=a,n=s.at(-1),r=`
    <div class="grup"><h2 class="etiket">Kilo</h2><div class="ic">
      ${n?`<div class="kilo"><b>${fmt(n.kg,1,1)}</b><em>kg</em>${_a(s)}</div>
               ${Z(s.map(c=>c.kg))}
               <p>${s.length} ölçüm · son giriş ${h.relativeLabel(new Date(n.ts))}</p>`:"<p>Henüz kilo kaydı yok. Aşağıya yazınca burada takip edilir.</p>"}
      <div class="alan kilo-gir">
        <label for="h-weight">Bugün</label>
        <label class="kutucuk"><input type="number" id="h-weight" inputmode="decimal" step="0.1" min="20" max="400"
               value="${n&&n.d===F()?n.kg:""}" placeholder="—" aria-label="Bugünkü kilo"><small>kg</small></label>
        <button class="cip" data-act="weight-save">Kaydet</button>
      </div>
    </div></div>`,o=`
    <div class="grup"><h2 class="etiket">Son seanslar</h2>
      ${e.length?`<div class="ic sira">${e.map(c=>`
        <button class="seans" data-seans="${esc(c.id)}" aria-label="${h.fmtShort(new Date(c.at))} seansını düzenle">
          <span class="s-baslik">${c.gun}</span>
          <span class="s-hacim">${c.kayitsiz?"—":`${fmt(c.hacim.kg,0)} ${t.unit}`}</span>
          <span class="s-ikinci">${h.fmtShort(new Date(c.at))}${c.programAdi?` · ${esc(c.programAdi)}`:""}${c.kayitsiz?'<span class="etk kyt">kayıtsız</span>':c.yarim?'<span class="etk">yarım</span>':""}</span>
          <span class="s-oran">${c.kayitsiz?"":`${c.yapilan}/${c.toplam} hareket`}</span>
        </button>`).join("")}</div>`:'<div class="ic"><p>Henüz tamamlanmış seans yok.</p></div>'}
    </div>`,d=`
    <div class="grup"><h2 class="etiket">Hareket ilerlemesi · en ağır set</h2>
      ${i.length?`<div class="ic sira">${i.map(c=>`
        <div class="ilerleme">
          <b>${adi(c.ex)}</b>
          <span>${fmt(c.seri[0].v)} → <em>${fmt(c.seri.at(-1).v)} ${c.birim}</em></span>
          ${Z(c.seri.map(v=>v.v),{w:280,h:18,alan:!1})}
        </div>`).join("")}</div>
        <p class="kucuk-yazi grup-alti">${i.length} hareket · çizgi en fazla son ${Math.max(...i.map(c=>c.seri.length))} seansı gösterir.</p>`:'<div class="ic"><p>İlerleme çizgisi için bir hareketin en az iki seansta kaydı gerekiyor.</p></div>'}
    </div>`,p=a.rekorOlaylari??[],$=new Date;$.setDate(1),$.setHours(0,0,0,0);const m=p.filter(c=>c.at>=$.getTime()).length,b=c=>`<button class="oz-kayit satir-dugme" data-hareket="${esc(c.exId)}">${l("yildiz")}<b>${adi(u.byId[c.exId]??{ad:c.exId})}</b>
      <span class="oz-deger"><em>${rekorDeger(c.tur,c.simdi,t.unit)}</em></span>
      <span class="oz-alt">${H.TUR_AD[c.tur]} · ${h.fmtShort(new Date(c.at))}</span></button>`;return`
    <div class="sayfa-baslik ust-bosluk"><h1>İlerleme</h1></div>
    ${`
    <div class="grup"><h2 class="etiket">Rekorlar · son kırılanlar</h2><div class="ic">${p.length?`${p.slice(0,6).map(b).join("")}
         <p class="oz-kural">${m?`Bu ay ${m} rekor · `:""}Bir harekete dokun: bütün rekorları ve geçmişi.</p>`:"<p>Rekorlar bir hareketi ikinci kez yaptığında sayılmaya başlar: ilk kayıt taban olur.</p>"}</div></div>`}${r}${o}${d}
    ${sekmelerHTML("ilerleme")}`}export function sessionEditHTML(a){const{duzenlenen:s,settings:e}=a;if(!s)return`<div class="ust"><button class="ib" data-act="to-history" aria-label="Geçmişe dön">${l("geri")}</button></div>
    <div class="sayfa-baslik"><h1>Seans bulunamadı</h1></div>`;const i=u.gunEtiketiSeans(s).kisa,t=u.exercisesOfSession(s),n=s.entries.filter(d=>!t.some(p=>p.id===d.exerciseId)).map(d=>u.byId[d.exerciseId]??u.bilinmeyenHareket(d.exerciseId)),r=[...t,...n].map(d=>{const p=s.entries.find(k=>k.exerciseId===d.id);if(!p?.sets.length)return"";const $=f.agirlikAdimi(d,e)??f.GIRIS_ADIMI_YEDEK;let m=0;const b=p.sets.map((k,c)=>{const v=k.type==="time"?[["seconds",k.seconds,"sn",5]]:k.type==="cardio"?[["minutes",k.minutes,"dk",5]]:[["weight",k.weight,e.unit,$],["reps",k.reps,"tekrar",1]],z=k.warmup?"ısınma":`${++m}.`;return`<div class="eset">
        <span class="eno">${k.warmup?"ıs":m}</span>
        ${v.map(([j,B,S,R])=>`
          <label class="efield">
            <input type="number" inputmode="decimal" step="${R}" min="0"
                   value="${B??""}" placeholder="—"
                   data-eset="${d.id}:${c}:${j}" aria-label="${adi(d)} ${z} set ${S}">
            <span class="eunit">${S}</span>
          </label>`).join("")}
        <button class="esil" data-eset-sil="${d.id}:${c}" aria-label="${z} seti sil">${l("sil")}</button>
      </div>`}).join("");return`<div class="grup"><h2 class="etiket">${adi(d)}</h2><div class="ic sira">${b}${p.note?`<p class="seans-notu">${l("liste")}<span>${esc(p.note)}</span></p>`:""}</div></div>`}).join(""),o=u.summaryVolume(s);return`
    <div class="ust"><button class="ib" data-act="to-history" aria-label="Geçmişe dön">${l("geri")}</button><span class="ib-yer"></span></div>
    <div class="sayfa-baslik">
      <h1>${i}</h1>
      <p>${h.fmtShort(new Date(s.finishedAt??s.startedAt))} · ${o.sets} set · ${fmt(o.kg,0)} ${e.unit}</p>
    </div>
    <p class="aciklama">Bir değeri düzeltmek için üstüne yaz; alandan çıkınca kaydedilir. Hacim, "geçen sefer"
      ve ilerleme çizgisi kendiliğinden yeniden hesaplanır.</p>
    ${r}
    <div class="grup"><div class="ic">
      <button class="btn s" data-act="seans-sil">Bu seansı sil</button>
      <p>Silinen seans geçmişten kalkar, sıra yeniden hesaplanır. Geri getirebilirsin.</p>
    </div></div>`}const Ua=[1,2,3,4,5,6,0],Oa=[30,45,60,90,120];function Ya(a={}){const s=ra[a.tur];return`<div class="grup" id="kurulum"><h2 class="etiket">Telefona yükle</h2><div class="ic">${a.kurulu?"<p>Telefona yüklü: ana ekrandaki simgesiyle, adres çubuğu olmadan açılıyor.</p>":a.istem?`<button class="btn p" data-act="kur">Telefona yükle</button>
         <p>Ana ekrana kendi simgesiyle eklenir; adres çubuğu olmadan açılır, internetsiz çalışır.
           Kayıtların aynen kalır. Mağaza gerekmez.</p>`:s?`<p class="kurulum-tarayici">${esc(s.tarayici)} için:</p>
           <ol class="kurulum-adim">${s.adimlar.map(i=>`<li>${i}</li>`).join("")}</ol>
           ${s.not?`<p class="kucuk-not">${esc(s.not)}</p>`:""}
           <p class="kucuk-not">Zaten yüklüyse ana ekrandaki FSet simgesinden aç.</p>`:"<p>Tarayıcı menüsünden <b>Uygulamayı yükle</b> ya da <b>Ana ekrana ekle</b>'yi seç.</p>"}</div></div>`}export function kurulumBantHTML(a){const s=a.kurulum??{};return la(s.tur,a.settings)?`<div class="kurulum-bant"><span class="yazi"><b>FSet'i telefona yükle</b><span>Ana ekranda kendi simgesiyle, internetsiz açılır.</span></span>
    <button class="btn p kucuk" data-act="${s.istem?"kur":"kurulum-nasil"}">${s.istem?"Yükle":"Nasıl?"}</button>
    <button class="kapat" data-act="kurulum-kapat" aria-label="Bandı kapat">${l("carpi")}</button></div>`:""}export function settingsHTML(a){const{settings:s}=a,e=s.trainingDays??[],i=Ua.map($=>`
    <button class="cip" data-gun="${$}" aria-pressed="${e.includes($)}" aria-label="${h.GUN[$]}">${h.GUN_KISA[$]}</button>`).join(""),t=h.upcoming(new Date,e,3),n=t.length?`<b>${t.map($=>h.fmtShort($)).join(" · ")}</b>`:"Hiç gün seçili değil; takvim çalışmaz.",r=Oa.map($=>`
    <button data-rest="${$}" aria-pressed="${s.restSeconds===$}" aria-label="${$} saniye">${$}</button>`).join(""),o=!!s.basitGorunum,d=[["tam","Tam",!1],["basit","Basit",!0]].map(([$,m,b])=>`
    <button data-gorunum="${$}" aria-pressed="${o===b}">${m}</button>`).join(""),p=f.DAMBIL_ADIMLARI.map($=>`
    <button data-dambil="${$}" aria-pressed="${s.dambilAdimi===$}">${fmt($)} kg</button>`).join("");return`
    <div class="sayfa-baslik ust-bosluk"><h1>Ayarlar</h1></div>

    <div class="grup"><h2 class="etiket">Profil ve avatar</h2><div class="ic">
      <button class="pm-satir" data-act="to-profil">
        <span class="avatar-k" data-avatar-k aria-hidden="true"></span>
        <span class="yazi"><b>${esc(s.profil?.ad?.trim()||"Profil oluştur")}</b></span>${l("ileri")}
      </button>
    </div></div>

    <div class="grup"><h2 class="etiket">Antrenman günleri</h2><div class="ic">
      <div class="cipler">${i}</div>
      <p>Sıradaki: ${n}</p>
    </div></div>

    <div class="grup"><h2 class="etiket">Setler arası dinlenme</h2><div class="ic">
      <div class="segment" role="group" aria-label="Dinlenme süresi">${r}</div>
      <p>Saniye. Odak ekranındaki sayaç bu süreyle başlar.</p>
    </div></div>

    <div class="grup"><h2 class="etiket">Setten sonra zorluk (RIR)</h2><div class="ic">
      <div class="segment" role="group" aria-label="RIR sorusu">${[["kapali","Sorma",!1],["acik","Sor",!0]].map(([$,m,b])=>`<button data-rirsor="${$}" aria-pressed="${!!s.rirSor===b}">${m}</button>`).join("")}</div>
      <p>Ağırlıklı her setten sonra "kaç tekrar daha yapabilirdin?" sorulur; cevap ağırlık önerisini daha doğru yapar.
        Programda hedef RIR verdiğin harekette her zaman sorulur.</p>
    </div></div>

    <div class="grup"><h2 class="etiket">Seans başında kontrol</h2><div class="ic">
      <div class="segment" role="group" aria-label="Toparlanma kontrolü">${[["kapali","Sorma",!1],["acik","Sor",!0]].map(([$,m,b])=>`<button data-hzsor="${$}" aria-pressed="${s.hazirlikSor!==!1===b}">${m}</button>`).join("")}</div>
      <p>Seansa başlamadan uyku, uzun süren kas tutulması ve ağrı sorulur; cevaba göre "plana uy", "biraz hafiflet" ya da
        "dinlen" önerilir. Günde bir kez sorulur, atlanabilir.</p>
    </div></div>

    <div class="grup"><h2 class="etiket">Dambıl adımı</h2><div class="ic">
      <div class="segment" role="group" aria-label="Dambıl adımı">${p}</div>
      <p>Salondaki dambıl setinde bir sonraki ağırlık. Bar 2,5 kg, makine ve kablo 5 kg adımla ilerler.</p>
    </div></div>

    <div class="grup"><h2 class="etiket">Hareket çizimi</h2><div class="ic">
      <div class="segment" role="group" aria-label="Hareket çizimi">${d}</div>
      <p>${o&&s.basitOto?"Bu telefonda ayrıntılı manken yavaş çizildiği için basit görünüm kendiliğinden açıldı. ":!o&&a.cAcilamadi?"Ayrıntılı manken bu telefonda açılamadı; yerine basit manken çiziliyor. ":""}Basit görünüm daha hafif bir manken çizer, pili korur.</p>
    </div></div>

    <div class="grup"><h2 class="etiket">Vücut</h2><div class="ic">
      <div class="alan">
        <label for="s-height">Boy</label>
        <label class="kutucuk"><input type="number" id="s-height" inputmode="numeric" min="100" max="250" step="1"
               value="${s.heightCm??""}" placeholder="—" aria-label="Boy (cm)"><small>cm</small></label>
      </div>
      <p>Kilo takibi İlerleme ekranında.</p>
    </div></div>

    ${Ya(a.kurulum)}

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
        <div class="hk-ad"><b class="hk-kelime"><span class="k1">${esc(Y.on)}</span><span class="k2">${esc(Y.son)}</span></b>
          <small>Sürüm ${esc(na)}</small></div></div>
      <p>Verilerin yalnızca bu telefonda durur; hesap yok, hiçbir sunucuya bir şey gönderilmez.</p>
      <a class="hk-bag" href="gizlilik.html">Gizlilik politikası${l("ileri")}</a>
      <a class="hk-bag" href="kosullar.html">Kullanım koşulları${l("ileri")}</a>
    </div></div>

    <p class="kucuk-yazi">Ağrı hissettiğin bir harekette dur; bu uygulama tıbbi tavsiye vermez.
      Hareket çizimleri <a href="js/vendor/three-LICENSE.txt" target="_blank" rel="noopener">three.js</a> ile yapılır (MIT lisansı);
      manken MakeHuman ile üretildi (CC0); yazı tipi Archivo (<a href="fonts/OFL.txt" target="_blank" rel="noopener">SIL OFL 1.1</a>).
      © 2026 Sabri Temel, tüm hakları saklıdır.</p>
    ${sekmelerHTML("ayarlar")}`}const L=(a,s,e)=>a.map(([i,t,n])=>`<button class="renk" data-${e}="${i}" aria-pressed="${s===i}" aria-label="${esc(t)}" style="--renk:${n}"></button>`).join("");export function profilHTML(a){const s=a.settings??{},e=s.avatar??{},i=s.profil??{},t=g.cozumle(e,i),n=g.govdeBul(t.govde),r=a.avatarOneri,o=a.avatarSekme??"avatar",d=a.kiyafetParca??"ust",p=(b,k)=>`<p class="renk-ad">${esc(b.find(c=>c[0]===k)?.[1]??"")}</p>`,$={avatar:()=>`<div class="govdeler">${g.GOVDELER.map(b=>`<button class="cip" data-avatar-govde="${b.id}" aria-pressed="${t.govde===b.id}">${esc(b.ad)}</button>`).join("")}</div>
      <p class="av-not">Yaşını Profil'de yazarsan avatar önerilir; seçimin hep senin.</p>`,ten:()=>`<div class="renkler">${L(g.TEN,t.ten,"avatar-ten")}</div>${p(g.TEN,t.ten)}
      <p class="av-not">Ten ve saç rengi telefonunun bölge ayarına göre önerildi; internete bağlanılmaz.</p>`,sac:()=>(n.kadin?"":`<div class="segment" role="group" aria-label="Saç">
        <button data-avatar-sacvar="1" aria-pressed="${t.sacli}">Saçlı</button><button data-avatar-sacvar="0" aria-pressed="${!t.sacli}">Saçsız</button></div>`)+(t.sacli?`<div class="renkler">${L(g.SAC,t.sacRenk,"avatar-sac")}</div>${p(g.SAC,t.sacRenk)}`:""),kiyafet:()=>`<div class="segment" role="group" aria-label="Kıyafet">
        <button data-kiyafet-parca="ust" aria-pressed="${d==="ust"}">Üst</button><button data-kiyafet-parca="alt" aria-pressed="${d==="alt"}">Alt</button></div>`+(d==="ust"?`<div class="renkler">${L(g.UST,t.ust,"avatar-ust")}</div>${p(g.UST,t.ust)}`:`<div class="renkler">${L(g.ALT,t.alt,"avatar-alt")}</div>${p(g.ALT,t.alt)}`),profil:()=>`<div class="av-iki">
        <div class="profil-alan"><label for="p-adin">Adın</label><input class="metin" id="p-adin" maxlength="24" autocomplete="off" placeholder="Örneğin Deniz" value="${esc(i.ad??"")}"></div>
        <div class="profil-alan av-yas"><label for="p-yas">Yaşın</label><input class="metin" id="p-yas" inputmode="numeric" maxlength="3" autocomplete="off" placeholder="—" value="${i.yas??""}"></div></div>
      <div class="segment" role="group" aria-label="Cinsiyet">${g.CINSIYET.map(([b,k])=>`<button data-profil-cins="${b}" aria-pressed="${i.cinsiyet===b}">${k}</button>`).join("")}</div>
      <p class="av-not">İsteğe bağlı; yalnız bu telefonda saklanır. Yaş ve cinsiyet avatarını önerir.</p>`},m=[["avatar","Avatar"],["ten","Ten"],["sac","Saç"],["kiyafet","Kıyafet"],["profil","Profil"]];return`
    <div class="ust av-baslik"><button class="ib" data-act="to-settings" aria-label="Ayarlara dön">${l("geri")}</button><h1>Profil ve avatar</h1><span class="ib-yer"></span></div>
    <div class="av-sahne">
      <div class="avatar-onizleme" id="avatar3d" aria-label="Avatarın — döndürmek için sürükle"></div>
      ${r?"":'<img class="damga" src="icons/isaret.svg" alt="" width="30" height="17">'}
      ${r?`<div class="avatar-oneri"><span>Avatarın ${r.yas?"yaşına":"seçimine"} göre ${esc(g.govdeBul(r.yeni).ad)} oldu.</span>
        <button data-act="avatar-geri-al">Geri al</button></div>`:'<p class="avatar-ipucu">Döndürmek için sürükle</p>'}
    </div>
    <div class="av-sekmeler" role="tablist" aria-label="Avatar ayarları">${m.map(([b,k])=>`<button role="tab" data-avatar-sekme="${b}" aria-selected="${o===b}">${k}</button>`).join("")}</div>
    <div class="av-panel" role="tabpanel">${$[o]()}</div>`}const Ca=[["bugun","Bugün","bugun","to-list"],["ilerleme","İlerleme","grafik","to-history"],["hareketler","Hareketler","figur","to-hareketler"],["programlar","Programlar","liste","to-programs"],["ayarlar","Ayarlar","ayar","to-settings"]];export function sekmelerHTML(a){return`<nav class="sekmeler" aria-label="Ana gezinme">${Ca.map(([s,e,i,t])=>`<button data-act="${t}"${s===a?' aria-current="page"':""}>${l(i)}<span>${e}</span></button>`).join("")}</nav>`}const D=a=>cizimsiz(a)?`<span class="kucuk yer" aria-hidden="true">${l("figur")}</span>`:`<span class="kucuk" data-kucuk="${esc(a.id)}" aria-hidden="true"></span>`,Va=a=>a.gunler.reduce((s,e)=>s+e.hareketler.length,0);export function programsHTML(){const a=u.aktifProgram();return`
    <div class="sayfa-baslik ust-bosluk"><h1>Programlar</h1>
      <p>Bugün ekranı <b>kullanılan</b> programın sıradaki gününü gösterir.</p></div>
    <div class="liste">${u.programListesi().map(e=>`
    <button class="satir yalin" data-program-ac="${esc(e.id)}">
      <span class="ad"><b>${esc(e.ad)}</b><span>${e.gunler.length} gün · ${Va(e)} hareket</span></span>
      <span class="sag">${e===a?'<span class="rozet">Kullanılıyor</span>':""}</span>${l("ileri")}
    </button>`).join("")}</div>
    <div class="grup"><button class="btn s" data-act="program-yeni">${l("arti")}Yeni program</button></div>
    <div class="grup"><h2 class="etiket">Hazır programlar</h2><div class="hazir-liste">${U.map(X("data-hazir")).join("")}</div>
      <p class="kucuk-yazi grup-alti">Dokun: günlerini gör, kopyasını programlarına ekle. Eklenen kopya senindir; düzenleyebilirsin.</p></div>
    ${sekmelerHTML("programlar")}`}const qa=a=>a.gunler.length===2?"A / B":`${a.gunler.length} farklı gün`,X=a=>s=>`<button class="hazir" ${a}="${esc(s.id)}"><span class="ad"><b>${esc(s.ad)}</b><span>${esc(s.kime)}</span></span>
  <span class="rozet">${qa(s)}</span></button>`;function J(a,s){const e=i=>i.seconds!=null?`${i.sets}×${i.seconds} sn`:`${i.sets}×${i.reps}`;return`<div class="oneri-kart">${s?`<small>${s}</small>`:""}<h2>${esc(a.ad)}</h2><p>${esc(a.kime)}</p>
    <div class="gun-ozet">${a.gunler.map(([i,t],n)=>`<div><b>${esc(i||`${n+1}. Gün`)}</b><span>${t.map(r=>`${esc(u.byId[r.exId]?.ad??r.exId)} ${e(r)}`).join(" · ")}</span></div>`).join("")}</div></div>`}export function hazirHTML(a){const s=O(a.hazirId);return s?`
    <div class="ust"><button class="ib" data-act="to-programs" aria-label="Programlara dön">${l("geri")}</button>
      <span class="tarih">Hazır program</span><span class="ib-yer"></span></div>
    ${J(s)}
    <div class="grup"><button class="btn p" data-act="hazir-ekle">${l("arti")}Programlarıma ekle</button></div>
    <p class="kucuk-yazi grup-alti">Kopyası eklenir; günlerini ve hedeflerini düzenleyebilirsin. Kullanmak için programda "Bu programı kullan".</p>`:`<div class="ust"><button class="ib" data-act="to-programs" aria-label="Programlara dön">${l("geri")}</button></div>`}export function ilkAcilisHTML(a){const s=a.ia,e=`<div class="ilerleme-cizgi" aria-hidden="true">${[1,2,3,4,5].map(n=>`<i class="${n<=s.adim?"dolu":""}"></i>`).join("")}</div>`;if(s.adim===0)return`
    <div class="karsilama"><img class="logo" src="icons/fset-192.png" alt="">
      <h1>Antrenman defterin hazır.</h1>
      <p>Dört kısa soru; sana uygun programı önerelim. Bir dakika sürer.</p>
      <ul><li>Her hareketin 3B anlatımı</li><li>Set, tekrar ve ağırlık kaydı</li><li>Hesap yok; verilerin telefonunda kalır</li></ul>
      <p class="kucuk-yazi">FSet bir egzersiz yardımcısıdır, tıbbi tavsiye vermez. Bir sağlık sorunun varsa başlamadan önce hekimine danış.
        Devam ederek <a href="kosullar.html">Kullanım koşullarını</a> kabul etmiş olursun; verilerinin nasıl tutulduğu
        <a href="gizlilik.html">Gizlilik politikasında</a>.</p></div>
    <div class="alt-bar dikey"><button class="btn p" data-ia="ileri">Başlayalım</button>
      <button class="btn s" data-ia="kendim">Kendim kuracağım</button></div>`;if(s.adim<=4){const n=ia[s.adim-1];return`${e}
    <div class="soru"><h1>${n.soru}</h1>${n.alt?`<p>${n.alt}</p>`:""}</div>
    <div class="secenekler" role="group" aria-label="${n.soru}">${n.secenek.map(([r,o,d])=>`<button class="secenek" aria-pressed="${s.c[n.anahtar]===r}" data-ia-cevap="${n.anahtar}:${r}"><span class="ad"><b>${o}</b>${d?`<span>${d}</span>`:""}</span></button>`).join("")}</div>
    <div class="alt-bar"><button class="btn s" data-ia="geri">${l("geri")}Geri</button><span class="kucuk-yazi">${s.adim} / 4</span></div>`}if(s.adim===5){const n=g.cozumle({},{yas:s.profil.yas,cinsiyet:null}).govde,r=s.profil.govde??n;return`${e}
    <div class="soru"><h1>Seni tanıyalım</h1><p>İsteğe bağlı: avatarını seç. Bilgiler yalnız bu telefonda kalır.</p></div>
    <div class="profil-alan">
      <div class="form-alan"><label for="ia-ad">Adın</label><input id="ia-ad" class="metin" maxlength="24" autocomplete="off" placeholder="İsteğe bağlı" value="${esc(s.profil.ad??"")}"></div>
      <div class="form-alan"><label for="ia-yas">Yaşın</label><input id="ia-yas" class="metin" inputmode="numeric" maxlength="3" placeholder="İsteğe bağlı" value="${s.profil.yas??""}"></div>
      <div class="form-alan"><span class="etiket">Avatar</span><div class="cip-izgara">${g.GOVDELER.map(o=>`<button class="cip" aria-pressed="${o.id===r}" data-ia-govde="${o.id}">${esc(o.ad)}</button>`).join("")}</div></div></div>
    <div class="alt-bar"><button class="btn s" data-ia="atla">Atla</button><button class="btn p" data-ia="ileri">Devam</button></div>`}const i=s.secili??ta(s.c),t=O(i);return`
    <div class="soru"><h1>Senin için önerimiz</h1><p>Hedefine ve haftana göre seçildi; istediğin zaman değiştirebilirsin.</p></div>
    ${J(t,s.secili?"SEÇTİĞİN":"ÖNERİLEN")}
    <div class="alt-bar dikey"><button class="btn p" data-ia="basla">Bu programla başla</button></div>
    <div class="grup"><h2 class="etiket">Diğer programlar</h2><div class="hazir-liste">${U.filter(n=>n.id!==i).map(X("data-ia-sec")).join("")}</div></div>
    <div class="grup"><button class="btn s" data-ia="kendim">Kendim kuracağım</button></div>`}const Za=(a,s,e,i)=>`<span class="hedef">
    <button class="adim" data-kalem="${a}:${s}:-1" aria-label="${i} azalt">${l("eksi")}</button>
    <b>${e}</b>
    <button class="adim" data-kalem="${a}:${s}:1" aria-label="${i} artır">${l("arti")}</button></span>`,Q=a=>a.minutes!=null?`${a.minutes} dk`:a.seconds!=null?`${a.sets} × ${a.seconds} sn`:`${a.sets} × ${a.repsMin&&a.repsMin<a.reps?`${a.repsMin}-`:""}${a.reps}`;function Xa(a,s,e,i=60){const t=u.byId[a.exId]??u.bilinmeyenHareket(a.exId),n=[t.grup,y[t.equipment]].filter(Boolean).join(" · "),r=`${s}:`;let o="";if(e){const d=a.minutes!=null?"":`<div class="g-alan"><div class="g-etk"><span>Set</span><b>${a.sets}</b></div>${noktalarHTML("dz-set",a.sets,r)}</div>`,p=a.minutes!=null?`<div class="g-alan"><div class="g-etk"><span>Süre</span></div>${Za(s,"minutes",`${a.minutes} dk`,"Süre")}</div>`:a.seconds!=null?`<div class="g-alan"><div class="g-etk"><span>Süre</span><b>${a.seconds} sn</b></div>
            <div class="semalar" role="group" aria-label="Süre">${[...new Set([15,20,30,45,60,90,a.seconds])].sort((m,b)=>m-b).map(m=>`<button class="cip" aria-pressed="${m===a.seconds}" data-dz-sn="${r}${m}">${m} sn</button>`).join("")}</div></div>`:`<div class="g-alan"><div class="g-etk"><span>Tekrar</span><b>${a.reps}</b></div>${tekrarSeridiHTML("dz-tekrar",a.reps,r)}</div>
           ${semalarHTML("dz-sema",a.sets,a.reps,r)}`,$=a.minutes!=null?"":yontemHTML("dz-yontem",a,r,i,{tekrarli:a.reps!=null&&t.setType!=="time"});o=`<div class="acilir">${d}${p}${$}
      <div class="alt-eylem"><button class="btn s" data-cikar="${s}">${l("sil")}Bu günden çıkar</button></div></div>`}return`<div class="satir-d${e?" acik":""}" data-dz-i="${s}">
    <div class="kafa">${D(t)}
      <button class="ad" data-dz-ac="${s}" aria-expanded="${e}"><b>${adi(t)}</b>${n?`<small>${esc(n)}</small>`:""}</button>
      <button class="hap" data-dz-ac="${s}" aria-label="${adi(t)}: hedef ${Q(a)}">${Q(a)}</button>
      <button class="tutac" data-dz-tutac="${s}" aria-label="${adi(t)}: sırayı değiştir — sürükle ya da yukarı/aşağı ok tuşu">${l("tutac")}</button>
    </div>${o}</div>`}const W=a=>JSON.stringify({...a,guncellendi:0});export const programDegisti=(a,s)=>!!(a&&s&&W(a)!==W(s));export function programHTML(a){const s=u.programGetir(a.duzen?.id);if(!s)return`<div class="ust"><button class="ib" data-act="to-programs" aria-label="Programlara dön">${l("geri")}</button></div>
    <div class="sayfa-baslik"><h1>Program bulunamadı</h1></div>`;const e=Math.min(a.duzen.gun??0,s.gunler.length-1),i=s.gunler[e],t=s===u.aktifProgram(),n=i.hareketler.map((r,o)=>Xa(r,o,a.duzen.acik===o,a.settings?.restSeconds??60)).join("");return`
    <div class="ust"><button class="ib" data-act="to-programs" aria-label="Programlara dön">${l("geri")}</button>
      ${programDegisti(s,a.duzen.kopya)?`<button class="geri-don" data-act="program-geri-don">${l("geri-al")}Açtığın hâle dön</button>`:""}
      ${t?'<span class="rozet">Kullanılıyor</span>':'<button class="cip" data-act="program-aktif">Bu programı kullan</button>'}</div>
    <div class="form-alan"><label for="p-ad">Programın adı</label>
      <input id="p-ad" class="metin" value="${esc(s.ad)}" maxlength="60" autocomplete="off"></div>
    <div class="kaydir" role="group" aria-label="Günler">${s.gunler.map((r,o)=>`<button class="cip" aria-pressed="${o===e}" data-pgun="${o}">${o+1}. Gün</button>`).join("")}
      ${s.gunler.length<7?`<button class="cip" data-act="gun-ekle" aria-label="Gün ekle">${l("arti")}Gün</button>`:""}</div>
    <div class="form-alan"><label for="g-ad">${e+1}. günün adı</label>
      <input id="g-ad" class="metin" value="${esc(i.ad??"")}" maxlength="60" autocomplete="off"
             placeholder="${esc(u.gunEtiketi(e,s).kaslar)}"></div>
    <div class="grup"><h2 class="etiket">Hareketler · ${i.hareketler.length}</h2>
      ${i.hareketler.length?`<div class="liste-d" id="dz-liste">${n}</div>`:'<div class="ic"><p>Bu gün boş. Aşağıdan hareket ekle.</p></div>'}
    </div>
    <div class="grup eylemler"><button class="btn s" data-act="secici-ac">${l("arti")}Hareket ekle</button>
      ${s.gunler.length>1?`<button class="btn s" data-act="gun-sil">${e+1}. günü sil</button>`:""}
      ${!t&&s.id!=="benim"?'<button class="btn s" data-act="program-sil">Programı sil</button>':""}
    </div>
    <p class="kucuk-yazi">Satıra dokun: set ve tekrar. ⋮⋮ tutup sürükle: sıra. Değişiklikler hemen kaydedilir; geçmişteki seanslar etkilenmez.</p>`}const A=a=>String(a??"").toLocaleLowerCase("tr");export function seciciSonuc(a){const s=A(a.ara).trim();return u.kutuphaneListesi().filter(e=>(!a.grup||e.grup===a.grup)&&(!a.eq||e.equipment===a.eq)&&(!s||A(e.ad).includes(s)||A(e.en).includes(s)||A(e.mus).includes(s))).sort((e,i)=>A(e.ad).localeCompare(A(i.ad),"tr"))}export function seciciListeHTML(a){const s=seciciSonuc(a.secici),e=u.programGetir(a.duzen?.id)?.gunler[a.duzen.gun],i=new Set(e?.hareketler.map(n=>n.exId)??[]);if(!s.length)return'<div class="grup"><div class="ic"><p>Bulunamadı. Aşağıdan özel hareket olarak ekleyebilirsin.</p></div></div>';const t=n=>`
    <button class="satir" data-ekle="${esc(n.id)}">
      ${D(n)}
      <span class="ad"><b>${adi(n)}</b><span>${[i.has(n.id)&&"bu günde var",n.en&&`<span lang="en">${esc(n.en)}</span>`,y[n.equipment],n.ozel&&"özel"].filter(Boolean).join(" · ")}</span></span>
      <span class="durum ikon">${l("arti")}</span>
    </button>`;return`<p class="sayac">${s.length} hareket</p><div class="liste">${s.map(n=>n.ozel?`<div class="satir-ozel">${t(n)}<button class="ozel-sil" data-ozel-sil="${esc(n.id)}" aria-label="${adi(n)}: kütüphaneden sil">${l("sil")}</button></div>`:t(n)).join("")}</div>`}export function seciciHTML(a){const s=a.secici;return`
    <div class="ust"><button class="ib" data-act="secici-kapat" aria-label="Kapat">${l("carpi")}</button>
      <span class="tarih">Hareket ekle · ${a.duzen.gun+1}. Gün</span><span class="ib-yer"></span></div>
    <label class="arama">${l("ara")}<input id="ara" type="search" value="${esc(s.ara)}" placeholder="Ara: squat, göğüs, curl…"
      autocomplete="off" aria-label="Hareket ara"></label>
    <div class="kaydir" role="group" aria-label="Kas grubu">${["",...I].map(e=>`<button class="cip" aria-pressed="${s.grup===e}" data-sgrup="${e}">${e||"Tüm kaslar"}</button>`).join("")}</div>
    <div class="kaydir" role="group" aria-label="Ekipman">${["",...Object.keys(y)].map(e=>`<button class="cip" aria-pressed="${s.eq===e}" data-seq="${e}">${e?y[e]:"Tüm ekipman"}</button>`).join("")}</div>
    <div id="secici-liste">${seciciListeHTML(a)}</div>
    <div class="grup"><button class="btn s" data-act="ozel-ac">Listede yok mu? Özel hareket ekle</button></div>`}export function kutuphaneListeHTML(a){const s=seciciSonuc(a.kutuphane),e=(a.kutuphane.grup?[a.kutuphane.grup]:I).map(i=>[i,s.filter(t=>t.grup===i)]).filter(([,i])=>i.length);return e.length?e.map(([i,t])=>`
    <div class="bolum-baslik"><h2>${esc(i)}</h2><span>${t.length}</span></div>
    <div class="liste">${t.map(n=>`
      <button class="satir" data-hareket="${esc(n.id)}">
        ${D(n)}
        <span class="ad"><b>${adi(n)}</b><span>${[n.mus,y[n.equipment],n.ozel&&"özel"].filter(Boolean).map(esc).join(" · ")}</span></span>
        <span class="durum ok">${l("ileri")}</span>
      </button>`).join("")}</div>`).join(""):'<div class="grup"><div class="ic"><p>Bulunamadı. Aşağıdan özel hareket olarak ekleyebilirsin.</p></div></div>'}export function kutuphaneHTML(a){const s=a.kutuphane;return`
    <div class="sayfa-baslik ust-bosluk"><h1>Hareketler</h1><p>${seciciSonuc(s).length} hareket · dokun: nasıl yapılır, kaslar, geçmişin</p></div>
    <label class="arama">${l("ara")}<input id="k-ara" type="search" value="${esc(s.ara)}" placeholder="Ara: squat, göğüs, curl…"
      autocomplete="off" aria-label="Hareket ara"></label>
    <div class="kaydir" role="group" aria-label="Kas grubu">${["",...I].map(i=>`<button class="cip" aria-pressed="${s.grup===i}" data-kgrup="${i}">${i||"Tüm kaslar"}</button>`).join("")}</div>
    <div class="kaydir" role="group" aria-label="Ekipman">${["",...Object.keys(y)].map(i=>`<button class="cip" aria-pressed="${s.eq===i}" data-keq="${i}">${i?y[i]:"Tüm ekipman"}</button>`).join("")}</div>
    <div id="kutuphane-liste">${kutuphaneListeHTML(a)}</div>
    <div class="grup"><button class="btn s" data-act="ozel-ac-kutuphane">${l("arti")}Özel hareket ekle</button></div>
    ${sekmelerHTML("hareketler")}`}function Ja(a,s,e,i){if(!a||!s||s.sayi<2)return"";const t=H.TURLER.filter(n=>a[n]);return t.length?`<div class="grup"><h2 class="etiket">Rekorların</h2><div class="ic"><div class="rekor-tablo">${t.map(n=>`<span>${H.TUR_AD[n]}<small>${i(a[n].at)} · ${G(a[n].set,e)}</small></span><span><b>${rekorDeger(n,a[n].deger,e)}</b></span>`).join("")}</div>
    ${a.tekrarlar.length>1?`<p class="rekor-ara">Ağırlık başına en çok tekrar</p><div class="tekrar-cipleri">${a.tekrarlar.map(n=>`<span><b>${fmt(n.agirlik)} ${e}</b> × ${n.tekrar}</span>`).join("")}</div>`:""}
    ${a.bir?'<p class="oz-kural">Tahmini 1 tekrar maksimumu en fazla 10 tekrarlı setlerden hesaplanır (Brzycki); ısınma setleri sayılmaz.</p>':""}</div></div>`:""}export const GUVENLIK_NOTU="Ağrı, baş dönmesi, göğüs ağrısı ya da olağandışı nefes darlığı olursa hemen dur. Bir sağlık sorunun varsa, gebeysen ya da uzun süredir hareketsizsen başlamadan önce hekimine danış. FSet tıbbi tavsiye vermez.",ilkAgirlikNotu=a=>a?.setType!=="weight_reps"||a.equipment==="bodyweight"?"":`İlk seansta hedef tekrarı temiz teknikle bitirip 2–3 tekrar daha yapabileceğin ağırlığı seç.${a.equipment==="barbell"?" Önce boş barla tekniği öğren.":""}`;const G=(a,s)=>a.type==="time"?`${fmt(a.seconds)} sn`:a.type==="cardio"?`${fmt(a.minutes)} dk`:a.weight?`${fmt(a.weight)} ${s} × ${a.reps??"—"}`:`${a.reps??"—"} tekrar`,x=a=>a.target?.minutes!=null?`${a.target.minutes} dk`:a.target?.seconds!=null?`${a.sets} × ${a.target.seconds} sn`:`${a.sets} × ${a.target?.reps??"—"}`;export function hareketHTML(a){const s=u.byId[a.hareketId];if(!s)return`<div class="ust"><button class="ib" data-act="to-hareketler" aria-label="Hareketlere dön">${l("geri")}</button></div>
    <div class="sayfa-baslik"><h1>Hareket bulunamadı</h1></div>`;const e=String(s.mus??"").split("·").map(r=>r.trim()).filter(Boolean),i=a.hareketGecmisi,t=a.settings?.unit??"kg",n=r=>h.fmtShort(new Date(r));return`
    <div class="ust"><button class="ib" data-act="to-hareketler" aria-label="Hareketlere dön">${l("geri")}</button>
      <span class="tarih">${esc(s.grup??"")}</span><span class="ib-yer"></span></div>
    <div class="sayfa-baslik"><h1>${adi(s)}</h1>${s.en?`<p lang="en">${esc(s.en)}</p>`:""}</div>
    ${cizimsiz(s)?'<div class="grup"><div class="ic"><p>Özel hareket · çizimi yok.</p></div></div>':`<div class="buyuk3b"><div class="sahne3d" id="hareket3d" role="img" aria-label="${adi(s)} hareket çizimi; sürükleyerek döndürülür"></div>
         <img class="damga" src="icons/isaret.svg" alt="" width="30" height="17"><span class="ipucu">Sürükle: döndür · dokun: yeniden oynat</span></div>`}
    <p class="kunye">${[y[s.equipment],`Önerilen ${x(s)}`].filter(Boolean).map(esc).join(" · ")}</p>
    ${e.length?`<div class="grup"><h2 class="etiket">Çalışan kaslar</h2><div class="ic"><div class="kaslar">${e.map((r,o)=>`<span class="kas${o<2?" ana":""}">${esc(r)}</span>`).join("")}</div></div></div>`:""}
    ${s.fayda?`<div class="grup"><h2 class="etiket">Faydası</h2><div class="ic"><p>${esc(s.fayda)}</p></div></div>`:""}
    <div class="grup"><h2 class="etiket">Geçmişin</h2><div class="ic">${i?`
      <div class="ozet-iki">
        <div><small>Son · ${n(i.son.at)}</small><b>${G(i.son.set,t)}</b></div>
        <div><small>En iyi · ${n(i.enIyi.at)}</small><b>${G(i.enIyi.set,t)}</b></div></div>
      <p class="kucuk-yazi">${i.sayi} seansta yapıldı</p>
      ${i.not?`<p class="seans-notu">${l("liste")}<span>${esc(i.not.metin)} <small>· ${n(i.not.at)}</small></span></p>`:""}`:"<p>Bu hareketi henüz kaydetmedin.</p>"}</div></div>
    ${Ja(a.hareketRekor,i,t,n)}
    ${s.steps?.length?`<div class="grup"><h2 class="etiket">Nasıl yapılır</h2><div class="ic"><ol class="adimlar">${s.steps.map(r=>`<li>${esc(r)}</li>`).join("")}</ol></div></div>`:""}
    ${s.tip?`<div class="grup"><h2 class="etiket">Dikkat</h2><div class="ipucu-kutu">${esc(s.tip)}</div></div>`:""}
    ${ilkAgirlikNotu(s)?`<p class="kucuk-yazi grup-alti">${ilkAgirlikNotu(s)}</p>`:""}
    <p class="kucuk-yazi grup-alti">${GUVENLIK_NOTU}</p>
    <div class="grup eylemler"><button class="btn p" data-act="hareket-ekle-ac">${l("arti")}Programa ekle</button>
      ${s.ozel?`<button class="btn s" data-ozel-sil="${esc(s.id)}">${l("sil")}Hareketi sil</button>`:""}</div>
    ${sekmelerHTML("hareketler")}`}export function hareketEkleHTML(a){const s=u.byId[a.hareketId],e=u.programGetir(a.hareketEkle?.programId)??u.aktifProgram();return s?`
    <div class="ust"><button class="ib" data-act="hareket-ekle-kapat" aria-label="Kapat">${l("carpi")}</button>
      <span class="tarih">Programa ekle</span><span class="ib-yer"></span></div>
    <div class="sayfa-baslik"><h1>${adi(s)}</h1><p>Hangi programın hangi gününe?</p></div>
    <div class="grup"><h2 class="etiket">Program</h2><div class="kaydir" role="group" aria-label="Program">${u.programListesi().map(i=>`<button class="cip" aria-pressed="${i.id===e.id}" data-he-prg="${esc(i.id)}">${esc(i.ad)}</button>`).join("")}</div></div>
    <div class="grup"><h2 class="etiket">Gün</h2><div class="gun-secim">${e.gunler.map((i,t)=>`
      <button class="satir" data-he-gun="${t}">
        <span class="ad"><b>${u.gunEtiketi(t,e).kisa}</b><span>${[u.gunEtiketi(t,e).kaslar,`${i.hareketler.length} hareket`,i.hareketler.some(n=>n.exId===s.id)&&"bu günde var"].filter(Boolean).map(esc).join(" · ")}</span></span>
        <span class="durum ikon">${l("arti")}</span>
      </button>`).join("")}</div></div>
    <p class="kucuk-yazi grup-alti">${esc(x(s))} hedefiyle eklenir; programda değiştirebilirsin.</p>`:""}export function ozelHTML(a){const s=a.ozelForm,e=(i,t,n)=>Object.entries(t).map(([r,o])=>`<button class="cip" aria-pressed="${n===r}" data-${i}="${r}">${o}</button>`).join("");return`
    <div class="ust"><button class="ib" data-act="ozel-kapat" aria-label="Hareket seçiciye dön">${l("geri")}</button>
      <span class="tarih">Özel hareket</span><span class="ib-yer"></span></div>
    <div class="sayfa-baslik"><h1>Özel hareket</h1>
      <p>Listede olmayan hareketi kendin ekle. Çizimi olmaz; kaydı ve geçmişi diğerleri gibi tutulur.</p></div>
    <div class="form-alan"><label for="o-ad">Adı</label>
      <input id="o-ad" class="metin" value="${esc(s.ad)}" maxlength="60" autocomplete="off" placeholder="ör. Smith makinesinde squat"></div>
    <div class="form-alan"><span class="etiket">Nasıl kaydedilsin?</span>
      <div class="cip-izgara">${e("otur",ea,s.setType)}</div></div>
    <div class="form-alan"><span class="etiket">Ekipman</span>
      <div class="cip-izgara">${e("oeq",y,s.equipment)}</div></div>
    <div class="form-alan"><span class="etiket">Çalışan kas</span>
      <div class="cip-izgara">${e("ogrup",Object.fromEntries(I.map(i=>[i,i])),s.grup)}</div></div>
    <div class="alt"><button class="btn p" data-act="ozel-kaydet">Ekle ve güne koy</button></div>`}
