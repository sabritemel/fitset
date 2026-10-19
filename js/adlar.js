/*! © 2026 Sabri Temel — tüm hakları saklıdır. Kullanım koşulları: kosullar.html */
const r=t=>(t??"").toLocaleLowerCase("tr");export const anaAd=t=>t?.en||t?.ad||t?.tr||"";export function turkceAd(t){if(!t?.en)return"";let e=(t.tr??t.ad??"").trim();const n=r(t.en);return r(e).startsWith(n)&&(e=e.slice(t.en.length).replace(/^[\s—–\-:·]+/,""),e=e&&e[0].toLocaleUpperCase("tr")+e.slice(1)),e}
