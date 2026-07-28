/**
 * Ekipman çizimleri — prototipten birebir taşındı (antrenman-programi_1.html:207-214).
 * Hepsi saf fonksiyon: nokta/koordinat alır, SVG parçası (string) döndürür.
 * DOM'a dokunmazlar; bu yüzden Node altında test edilebilirler.
 *
 * Koordinat sistemi: viewBox "0 0 260 200", y aşağı doğru artar, zemin y=186.
 */

/** Halter ağırlık plakası (yandan: iç içe iki daire) */
export const plate = p =>
  `<circle class="eq" fill="none" cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="13"/>` +
  `<circle class="eq" fill="none" cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="4"/>`;

/** Dambıl. v=true → dikey duruş, v=false → yatay duruş */
export const db = (p, v) => v
  ? `<rect class="eq" fill="none" x="${(p[0] - 5).toFixed(1)}" y="${(p[1] - 14).toFixed(1)}" width="10" height="28" rx="3"/>`
  : `<rect class="eq" fill="none" x="${(p[0] - 14).toFixed(1)}" y="${(p[1] - 5).toFixed(1)}" width="28" height="10" rx="3"/>`;

/** Düz çubuk/bar — iki nokta arası sert çizgi */
export const bar = (a, b) =>
  `<line class="eq" x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}"/>`;

/** Kablo — kesikli çizgi (makara sistemleri için) */
export const cbl = (a, b) =>
  `<line class="cbl" x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}"/>`;

/** Dikdörtgen — sedye, oturak, makine gövdesi */
export const rct = (x, y, w, h) =>
  `<rect class="eq" fill="none" x="${x}" y="${y}" width="${w}" height="${h}" rx="2"/>`;

/** Zemin çizgisi */
export const grd = (y = 186) => `<line class="gr" x1="8" y1="${y}" x2="252" y2="${y}"/>`;

/** Tutamak — tek daire */
export const grip = p =>
  `<circle class="eq" fill="none" cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="6"/>`;
