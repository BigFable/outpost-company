/**
 * Placeholder item icons, drawn in code (docs/design/inventory-revamp.md §2).
 * Pure string building, no DOM: `iconSvg` returns one 48×48 SVG. Each item has
 * one icon key (its id); an entry in ICON_ART replaces the generated icon with
 * drawn art later, one item at a time. These are game-screen placeholders, not
 * store-page art.
 */
export type IconGlyph = 'spar' | 'log' | 'disc' | 'pile' | 'board' | 'bundle' | 'beam' | 'burl' | 'drop' | 'marker'
  | 'deadeye' | 'lens' | 'axehead' | 'knotstone' | 'barkstrip' | 'spikes' | 'fish' | 'float' | 'chart' | 'pearl' | 'ambergris' | 'parcel';
export type IconTint = 'pine' | 'spruce' | 'hemlock' | 'maple' | 'oak' | 'redwood' | 'amber' | 'brass' | 'bronze' | 'fog' | 'iron'
  | 'stone' | 'paper' | 'silver' | 'seaglass' | 'pearl' | 'wax' | 'bark';
export interface IconSpec {
  readonly glyph: IconGlyph; readonly tint: IconTint;
  /** `prime`: the grader's P stamp, decoration only (the diamonds show the tier). */
  readonly badge?: 'prime';
  readonly pattern?: 'plates' | 'scales' | 'furrows' | 'smooth' | 'blocky' | 'fibrous';
  readonly figure?: 'clear' | 'knot1' | 'knots' | 'quarter' | 'spalt' | 'birdseye';
  readonly knots?: number; readonly straps?: boolean;
}
interface Tint { readonly b: string; readonly l: string; readonly d: string; readonly bark?: string }

const INK = '#2B241C';
const O = `stroke="${INK}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"`;
const T = `stroke="${INK}" stroke-width="1.2" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity=".7"`;
export const ICON_TINTS: Readonly<Record<IconTint, Tint>> = {
  pine: {b:'#D2A86A', l:'#EBCF9A', d:'#8E6438', bark:'#8A5A34'},
  spruce: {b:'#E2D2A8', l:'#F4EBCF', d:'#A08A5C', bark:'#7C6A55'},
  hemlock: {b:'#B9845E', l:'#D9AC88', d:'#7A4D30', bark:'#5E3826'},
  maple: {b:'#E7CFA0', l:'#F7EBCB', d:'#B0915E', bark:'#8E8B80'},
  oak: {b:'#C29A63', l:'#DEC08F', d:'#87643C', bark:'#5E5246'},
  redwood: {b:'#B9563A', l:'#E0957A', d:'#7E2C1C', bark:'#8E3A26'},
  brass: {b:'#C9A143', l:'#ECD38A', d:'#8C6B22'},
  bronze: {b:'#5E9B88', l:'#9CCAB8', d:'#3C6B5C'},
  amber: {b:'#E0921F', l:'#F6C86C', d:'#A55E0E'},
  fog: {b:'#9DB5BC', l:'#DCE7E8', d:'#4F666E'},
  iron: {b:'#767A76', l:'#A9ACA7', d:'#454845'},
  stone: {b:'#A79C88', l:'#D2C9B5', d:'#6F6655'},
  paper: {b:'#E4D6B2', l:'#F6EEDA', d:'#B9A77E'},
  silver: {b:'#9FB1B4', l:'#D4DFDF', d:'#5A6E74'},
  seaglass: {b:'#7FB7A4', l:'#C3E4D7', d:'#3F7766'},
  pearl: {b:'#EDE5D4', l:'#FFFFFF', d:'#B8AD98'},
  wax: {b:'#CEC5AC', l:'#ECE6D3', d:'#8B826A'},
  bark: {b:'#9A6440', l:'#C48E62', d:'#5E3826'},
};
const TN = ICON_TINTS;
const STAMP = '#D9541A', ROPE = '#B48A4E', TWINE = '#8E3A26';
const knot = (x: number, y: number): string => `<ellipse cx="${x}" cy="${y}" rx="2.2" ry="1.6" fill="${INK}" opacity=".75"/>`;
const BARK: Readonly<Record<string, string>> = {
  plates: 'M12 21 h7 M22 21 h6 M14 26 h8 M25 26 h5 M12 31 h6 M21 31 h7',
  scales: 'M13 21 q2 -2 4 0 M20 21 q2 -2 4 0 M27 21 q2 -2 4 0 M16 26 q2 -2 4 0 M23 26 q2 -2 4 0 M13 31 q2 -2 4 0 M20 31 q2 -2 4 0 M27 31 q2 -2 4 0',
  furrows: 'M11 20 Q19 23 29 19 M11 25 Q20 28 29 24 M11 30 Q19 33 29 29',
  smooth: 'M12 22 H29 M12 30 H27',
  blocky: 'M12 20 h5 v5 M20 20 h6 v5 M13 27 h6 v5 M22 27 h6 v5',
  fibrous: 'M11 19 H30 M11 22 H30 M11 25 H30 M11 28 H30 M11 31 H30',
};
const barkLines = (p?: string): string => { const L = p ? BARK[p] : undefined;
  return L ? `<path d="${L}" stroke="${INK}" stroke-width="1.3" fill="none" stroke-linecap="round" opacity=".6"/>` : ''; };

/** Each glyph draws inside 0..48 and leaves the top-left 16×16 free for the badge where it can. */
const GLYPHS: Readonly<Record<IconGlyph, (c: Tint, o: IconSpec) => string>> = {
  pile(c){ const end = (x: number, y: number) => `<circle cx="${x}" cy="${y}" r="9.5" fill="${c.bark ?? c.d}" ${O}/><circle cx="${x}" cy="${y}" r="6.8" fill="${c.l}"/><circle cx="${x}" cy="${y}" r="3.8" ${T}/><circle cx="${x}" cy="${y}" r="1.3" fill="${c.d}"/>`;
    return end(15, 34) + end(33, 34) + end(24, 18); },
  spar(c){ return `<path d="M6 36 L34 8 L41 15 L13 43 Z" fill="${c.b}" ${O}/><path d="M11 37 L35 13 M15 40 L38 17" ${T}/>` +
    `<ellipse cx="37.5" cy="11.5" rx="5" ry="3.2" transform="rotate(-45 37.5 11.5)" fill="${c.l}" ${O}/><circle cx="37.5" cy="11.5" r="1.1" fill="${c.d}"/>`; },
  log(c, o){ return `<path d="M9 17 H35 V35 H9 Q5 26 9 17 Z" fill="${c.bark ?? c.d}" ${O}/>` + barkLines(o.pattern) +
    `<ellipse cx="35" cy="26" rx="7.5" ry="9" fill="${c.l}" ${O}/><ellipse cx="35" cy="26" rx="4.5" ry="5.6" ${T}/><ellipse cx="35" cy="26" rx="1.7" ry="2.1" fill="${c.d}"/>`; },
  disc(c){ const bk = c.bark ?? c.d; return `<ellipse cx="25" cy="30" rx="18" ry="13" fill="${bk}" ${O}/><ellipse cx="25" cy="26" rx="18" ry="13" fill="${bk}" ${O}/>` +
    `<ellipse cx="25" cy="26" rx="15" ry="10.5" fill="${c.l}"/><ellipse cx="25" cy="26" rx="11" ry="7.6" ${T}/><ellipse cx="25" cy="26" rx="7.5" ry="5.2" fill="${c.b}" ${O}/><ellipse cx="25" cy="26" rx="3.5" ry="2.4" fill="${c.d}"/>`; },
  board(c, o){ const f = o.figure ?? 'clear';
    let fig = '';
    if (f === 'knot1') fig = knot(22, 25);
    if (f === 'knots') fig = knot(17, 27) + knot(27, 21) + knot(33, 23);
    if (f === 'quarter') fig = `<path d="M15 27 l4 -1 M21 22 l5 -1 M26 25 l4 -1 M30 19 l5 -1 M19 30 l3 -1 M33 22 l3 -1" stroke="${c.d}" stroke-width="2.2" stroke-linecap="round"/>`;
    if (f === 'spalt') fig = `<path d="M12 29 q4 -5 8 -2 t9 -6 t8 -2 M17 33 q5 -3 9 -6 t7 -4" stroke="${INK}" stroke-width="1.4" fill="none" stroke-linecap="round"/>`;
    if (f === 'birdseye') fig = [[16, 28], [21, 24], [26, 27], [30, 21], [34, 24], [24, 31], [19, 32]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.4" fill="none" stroke="${c.d}" stroke-width="1.2"/>`).join('');
    return `<path d="M18 38 L42 18 V22 L18 42 Z" fill="${c.d}" ${O}/><path d="M6 31 L18 38 V42 L6 35 Z" fill="${c.b}" ${O}/>` +
      `<path d="M6 31 L30 11 L42 18 L18 38 Z" fill="${c.l}" ${O}/><path d="M11 32 L33 14 M15 35 L37 17" ${T}/>` + fig; },
  bundle(c, o){ const plank = (y: number) => `<rect x="5" y="${y}" width="34" height="8" fill="${c.b}" ${O}/><rect x="39" y="${y}" width="5" height="8" fill="${c.l}" ${O}/><path d="M9 ${y + 4} H34" ${T}/>`;
    const k = o.knots ?? 0, kn = [knot(12, 33), knot(28, 25), knot(20, 17), knot(31, 33)].slice(0, k).join('');
    const straps = o.straps === false ? '' : `<path d="M14 11 V41 M30 11 V41" stroke="${ROPE}" stroke-width="3.2"/><path d="M14 11 V41 M30 11 V41" stroke="${INK}" stroke-width="1" opacity=".55" stroke-dasharray="2 2"/>`;
    return plank(13) + plank(21) + plank(29) + kn + straps; },
  beam(c){ return `<path d="M6 22 L30 7 L42 13 L18 28 Z" fill="${c.l}" ${O}/><path d="M18 28 L42 13 V24 L18 39 Z" fill="${c.b}" ${O}/><path d="M6 22 L18 28 V39 L6 33 Z" fill="${c.l}" ${O}/>` +
    `<path d="M9 26 l6 3 v6 l-6 -3 z" ${T}/><path d="M22 31 L39 20 M22 35 L39 24" ${T}/>`; },
  burl(c){ return `<path d="M11 31 C5 23 11 10 22 12 C28 5 41 11 39 21 C45 29 37 41 26 38 C18 43 9 39 11 31 Z" fill="${c.b}" ${O}/>` +
    `<path d="M19 24 c2 -4 8 -3 7 1 c-1 3 -5 2 -4 0 M29 30 c3 -2 6 1 3 3 c-2 1 -3 -1 -2 -2 M30 18 c2 -1 4 1 2 2" ${T}/>` +
    [[16, 30], [23, 32], [34, 24], [25, 18], [19, 18]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.4" fill="${c.d}"/>`).join(''); },
  drop(c){ return `<path d="M25 6 C31 16 39 22 39 31 A14 13 0 0 1 11 31 C11 22 19 16 25 6 Z" fill="${c.b}" ${O}/>` +
    `<path d="M16 30 C16 25 19 21 22 18" stroke="${c.l}" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="30" cy="33" r="2" fill="${c.d}"/><circle cx="25" cy="37" r="1.2" fill="${c.d}"/>`; },
  marker(c){ return `<path d="M21 27 H29 V44 H21 Z" fill="${TN.stone.b}" ${O}/><circle cx="25" cy="19" r="13" fill="${c.b}" ${O}/><circle cx="25" cy="19" r="9.5" ${T}/>` +
    `<path d="M25 12 V26 M18 19 H32" stroke="${c.d}" stroke-width="1.6"/><path d="M25 9.5 L22.5 13.5 H27.5 Z" fill="${c.d}"/><circle cx="25" cy="19" r="1.6" fill="${c.d}"/>`; },
  deadeye(c){ return `<circle cx="25" cy="25" r="16" fill="${c.b}" ${O}/><circle cx="25" cy="25" r="13" ${T}/>` +
    `<circle cx="25" cy="17.5" r="3.2" fill="${c.d}" ${O}/><circle cx="18.5" cy="29" r="3.2" fill="${c.d}" ${O}/><circle cx="31.5" cy="29" r="3.2" fill="${c.d}" ${O}/>` +
    `<path d="M14 15 a14 14 0 0 1 7 -5" stroke="${c.l}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`; },
  lens(c){ return `<circle cx="25" cy="25" r="16" fill="${c.d}" ${O}/><circle cx="25" cy="25" r="12" fill="${c.b}"/>` +
    `<path d="M14 27 q5 -4 10 0 t11 0 M16 32 q4 -3 9 0 t8 0" stroke="${c.l}" stroke-width="2" fill="none" stroke-linecap="round"/>` +
    `<path d="M17 18 a10 10 0 0 1 7 -4" stroke="#FFFFFF" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".8"/>`; },
  axehead(c){ return `<path d="M7 19 H19 L33 11 Q43 25 33 39 L19 31 H7 Z" fill="${c.b}" ${O}/><rect x="10" y="22" width="6" height="6" fill="${c.d}" ${O}/>` +
    `<path d="M31 14 Q38 25 31 36" stroke="${c.l}" stroke-width="2.2" fill="none" stroke-linecap="round"/><circle cx="24" cy="24" r="1.6" fill="${TN.amber.d}"/><circle cx="27" cy="30" r="1.2" fill="${TN.amber.d}"/>`; },
  knotstone(c){ return `<path d="M9 29 C7 17 19 8 30 11 C41 14 43 29 36 36 C30 42 13 41 9 29 Z" fill="${c.b}" ${O}/>` +
    `<ellipse cx="25" cy="25" rx="8.5" ry="7" fill="${c.l}" ${O}/><ellipse cx="25" cy="25" rx="5" ry="4" ${T}/><ellipse cx="25" cy="25" rx="1.8" ry="1.5" fill="${c.d}"/><path d="M33 17 L37 13 M13 33 L17 31 L15 36" ${T}/>`; },
  barkstrip(c){ const s = (dy: number) => `<path d="M7 ${36 + dy} C13 ${22 + dy} 25 ${13 + dy} 41 ${12 + dy} L42 ${18 + dy} C28 ${19 + dy} 18 ${27 + dy} 13 ${39 + dy} Z" fill="${c.b}" ${O}/><path d="M14 ${33 + dy} C19 ${25 + dy} 27 ${19 + dy} 37 ${17 + dy}" ${T}/>`;
    return s(-4) + s(5); },
  spikes(c){ return `<path d="M9 13 L13 9 L16 12 L38 34 L40 40 L34 38 L12 16 Z" fill="${c.b}" ${O}/><path d="M7 11 L11 7 L17 13 L13 17 Z" fill="${c.d}" ${O}/>` +
    `<path d="M33 9 L38 12 L31 26 Q28 31 22 33 L13 40 L10 37 L19 30 Q24 27 27 22 Z" fill="${c.l}" ${O}/>`; },
  fish(c){ return `<path d="M5 26 C13 13 30 13 37 23 L44 16 L43 34 L37 28 C30 38 13 38 5 26 Z" fill="${c.b}" ${O}/>` +
    `<path d="M9 28 C16 33 28 33 35 27" stroke="${c.l}" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M18 18 L23 11 L28 17" fill="${c.d}" ${O}/>` +
    `<circle cx="12" cy="23" r="1.8" fill="${INK}"/><path d="M17 20 Q15 25 17 30" ${T}/>`; },
  float(c){ return `<circle cx="25" cy="27" r="15" fill="${c.b}" ${O}/><path d="M13 19 L37 35 M13 35 L37 19 M10 27 H40 M25 12 V42" stroke="${ROPE}" stroke-width="1.6" fill="none"/>` +
    `<path d="M22 10 q3 -5 6 0" stroke="${ROPE}" stroke-width="2.2" fill="none"/><path d="M16 21 a11 11 0 0 1 6 -5" stroke="#FFFFFF" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".75"/>`; },
  chart(c){ return `<path d="M8 13 H40 V37 H8 Z" fill="${c.l}" ${O}/><rect x="6" y="9" width="36" height="5" rx="2.5" fill="${c.b}" ${O}/><rect x="6" y="36" width="36" height="5" rx="2.5" fill="${c.b}" ${O}/>` +
    `<path d="M12 31 C15 26 19 29 21 24 C23 19 28 22 30 18 C32 15 35 17 37 16" ${T}/><path d="M28 27 l4 4 M32 27 l-4 4" stroke="${TWINE}" stroke-width="1.8" stroke-linecap="round"/>` +
    `<ellipse cx="16" cy="20" rx="4" ry="2.5" fill="${c.d}" opacity=".35"/>`; },
  pearl(c){ return `<path d="M5 30 Q25 46 45 30 Q42 24 25 26 Q8 24 5 30 Z" fill="${TN.stone.l}" ${O}/><path d="M10 30 Q25 40 40 30" ${T}/>` +
    `<circle cx="25" cy="23" r="8" fill="${c.b}" ${O}/><circle cx="22" cy="20" r="2.4" fill="${c.l}"/>`; },
  ambergris(c){ return `<path d="M8 30 C6 21 15 14 22 16 C27 10 38 13 40 21 C45 28 39 38 29 37 C21 41 10 38 8 30 Z" fill="${c.b}" ${O}/>` +
    `<path d="M14 27 c4 -2 8 2 12 0 s7 -4 10 -2 M17 33 c3 1 7 -1 10 1" stroke="${c.d}" stroke-width="1.5" fill="none" stroke-linecap="round"/><path d="M17 20 a7 7 0 0 1 5 -2" stroke="${c.l}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`; },
  parcel(c){ return `<path d="M7 20 L25 12 L42 19 L24 27 Z" fill="${c.l}" ${O}/><path d="M7 20 L24 27 V41 L7 33 Z" fill="${c.b}" ${O}/><path d="M24 27 L42 19 V33 L24 41 Z" fill="${c.d}" ${O}/>` +
    `<path d="M16 16 L33 23 V37 M15 23.5 V37" stroke="${TWINE}" stroke-width="2" fill="none"/><path d="M33 23 q4 -6 7 -2 q-3 3 -7 2" fill="none" stroke="${TWINE}" stroke-width="1.6"/>`; },
};
export const ICON_GLYPHS: readonly IconGlyph[] = Object.keys(GLYPHS) as IconGlyph[];
const PRIME_BADGE = `<circle cx="9.5" cy="9.5" r="7.5" fill="${STAMP}" stroke="${INK}" stroke-width="1.6"/><text x="9.5" y="13.3" text-anchor="middle" font-family="Georgia,serif" font-weight="700" font-size="11" fill="#FFF7EC">P</text>`;

/** Drawn-art overrides by icon key (an item id): a full SVG string. Empty until an artist replaces a placeholder. */
export const ICON_ART: Record<string, string> = {};

const esc = (s: string): string => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
/** One placeholder icon as an SVG string (viewBox 0 0 48 48), labelled; ICON_ART[key] wins when set. */
export function iconSvg(key: string, spec: IconSpec, label?: string): string {
  const art = ICON_ART[key];
  if (art) return art;
  const c = ICON_TINTS[spec.tint] ?? ICON_TINTS.paper, g = GLYPHS[spec.glyph];
  const body = g ? g(c, spec) : `<rect x="8" y="8" width="32" height="32" rx="4" fill="${c.b}" ${O}/>`;
  const badge = spec.badge === 'prime' ? PRIME_BADGE : '';
  return `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(label ?? key)}">${body}${badge}</svg>`;
}
