import fs from 'fs';
const L={torso:60,head:13,ua:31,fa:29,th:39,sh:37}, rd=d=>d*Math.PI/180;
const yon=([y,p])=>[Math.cos(rd(p))*Math.cos(rd(y)),Math.sin(rd(p)),-Math.cos(rd(p))*Math.sin(rd(y))];
const ilerle=(P,a,l)=>{const d=yon(a);return [P[0]+d[0]*l,P[1]+d[1]*l,P[2]+d[2]*l];};
const ekle=(p,v,k)=>[p[0]+v[0]*k,p[1]+v[1]*k,p[2]+v[2]*k];

let ACI=30, C,S;
const ayarla=a=>{ACI=a;C=Math.cos(rd(a));S=Math.sin(rd(a));}; ayarla(30);
const izd=([x,y,z])=>[(x-z)*C,-y+(x+z)*S];
const cz=(...ps)=>`<polyline points="${ps.map(q=>{const r=izd(q);return r[0].toFixed(1)+','+r[1].toFixed(1);}).join(' ')}"/>`;

function iskelet(p){
  const P=[0,0,0], boyun=ilerle(P,[0,90],L.torso), kafa=ilerle(boyun,[0,90],L.head);
  const yan=yon([p.bakis-90,0]), ileri=yon([p.bakis,0]);
  const omA=ekle(boyun,yan,13), omB=ekle(boyun,yan,-13);
  const kaA=ekle(P,yan,9), kaB=ekle(P,yan,-9);
  const dA=ilerle(omA,p.uaA,L.ua), eA=ilerle(dA,p.faA,L.fa);
  const dB=ilerle(omB,p.uaB,L.ua), eB=ilerle(dB,p.faB,L.fa);
  const zA=ilerle(kaA,p.thA,L.th), aA=ilerle(zA,p.shA,L.sh);
  const zB=ilerle(kaB,p.thB,L.th), aB=ilerle(zB,p.shB,L.sh);
  return {P,boyun,kafa,omA,omB,dA,eA,dB,eB,kaA,kaB,zA,aA,zB,aB,yan,ileri};
}
function figur(s){
  const kA=cz(s.omA,s.dA,s.eA),kB=cz(s.omB,s.dB,s.eB);
  const bA=cz(s.kaA,s.zA,s.aA),bB=cz(s.kaB,s.zB,s.aB);
  const k=izd(s.kafa);
  return `${s.eA[2]>=s.eB[2]?`<g class="far">${kB}</g>${kA}`:`<g class="far">${kA}</g>${kB}`}
   ${s.aA[2]>=s.aB[2]?`<g class="far">${bB}</g>${bA}`:`<g class="far">${bA}</g>${bB}`}
   ${cz(s.omA,s.omB)}${cz(s.kaA,s.kaB)}${cz(s.P,s.boyun)}
   <circle cx="${k[0].toFixed(1)}" cy="${k[1].toFixed(1)}" r="11" fill="#0A0B0D"/>`;
}
/* Temiz izometrik ekipman: koltuk KUTUSU + sırtlık + göğüs pedi levhası */
function ekip(s){
  const {yan,ileri,P}=s;
  const n=(m,i,h)=>ekle(ekle(ekle(P,yan,m),ileri,i),[0,1,0],h);
  const kutu=(m,i,h,dh)=>cz(n(-m,-i,h),n(m,-i,h),n(m,i,h),n(-m,i,h),n(-m,-i,h))
    + cz(n(-m,-i,h),n(-m,-i,h-dh)) + cz(n(m,-i,h),n(m,-i,h-dh))
    + cz(n(m,i,h),n(m,i,h-dh)) + cz(n(-m,-i,h-dh),n(m,-i,h-dh),n(m,i,h-dh));
  const koltuk = kutu(17,15,-6,16);
  const sirtlik = cz(n(-11,-17,-4),n(11,-17,-4),n(11,-17,48),n(-11,-17,48),n(-11,-17,-4));
  const ped = cz(n(-15,27,26),n(15,27,26),n(15,27,62),n(-15,27,62),n(-15,27,26));
  return koltuk+sirtlik+ped;
}
const poz=(bakis,kolYaw,pitch)=>({ bakis,
  uaA:[bakis-kolYaw,pitch], faA:[bakis-kolYaw-6,pitch-3],
  uaB:[bakis+kolYaw,pitch], faB:[bakis+kolYaw+6,pitch-3],
  thA:[bakis-14,-10], shA:[bakis-8,-88], thB:[bakis+14,-10], shB:[bakis+8,-88] });
const ara=(A,B,t)=>{const o={};for(const k in A)o[k]=Array.isArray(A[k])
  ?[A[k][0]+(B[k][0]-A[k][0])*t,A[k][1]+(B[k][1]-A[k][1])*t]
  :A[k]+((B[k]??A[k])-A[k])*t;return o;};
const kare=(bakis,t,e,aci)=>{ ayarla(aci); const s=iskelet(ara(poz(bakis,8,-6),poz(bakis,90,2),t));
  return `<svg viewBox="-108 -118 216 208"><g class="art" stroke="currentColor" stroke-width="3.4"
   fill="none" stroke-linecap="round" stroke-linejoin="round">${e?ekip(s):''}${figur(s)}</g></svg>`; };
const satir=(ad,bakis,e,aci)=>`<div class="c"><div class="hd"><b>${ad}</b></div>
  <div class="p">${[0,0.5,1].map(t=>kare(bakis,t,e,aci)).join('')}</div></div>`;

fs.writeFileSync('mockup-izometrik.html',
`<body style="background:#0A0B0D;color:#BFC4CC;font:13px sans-serif;margin:0;padding:20px">
<style>.far{opacity:.4}svg{width:200px;height:auto}
.c{border:1px solid #ffffff14;border-radius:10px;padding:11px;margin-bottom:10px}
.hd b{font-size:13.5px;color:#CDD1D7}.p{display:flex;gap:3px;margin-top:6px}
.g{display:grid;grid-template-columns:1fr 1fr;gap:12px}</style>
<h3 style="color:#CDD1D7;margin:0 0 12px">İzometrik — temiz ekipman + açı denemesi</h3>
<div class="g">
 ${satir('30° · ekipmanlı', 120, true, 30)}
 ${satir('20° · ekipmanlı (daha yandan)', 120, true, 20)}
 ${satir('30° · ekipmansız', 120, false, 30)}
 ${satir('20° · ekipmansız', 120, false, 20)}
</div></body>`);
console.log('iso3 yazildi');
