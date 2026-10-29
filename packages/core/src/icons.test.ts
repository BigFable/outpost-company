import { describe, expect, it } from 'vitest';
import { ICON_ART, ICON_GLYPHS, ICON_TINTS, iconSvg } from './icons';
import { must } from './test-rng';
import { BULK, ITEMS, TIER_DIAMONDS, TIERS } from './items';

describe('placeholder icons', () => {
  it('every item and bulk stock has an icon whose glyph and tint exist, and a tier on the ladder', () => {
    for (const x of [...ITEMS, ...BULK]) {
      expect(ICON_GLYPHS).toContain(x.icon.glyph);
      expect(ICON_TINTS[x.icon.tint]).toBeDefined();
      expect(TIERS).toContain(x.tier);
    }
  });
  it('the diamond ladder: Common 0, Good 1, Fine 2, Prime 3, Rare 4', () => {
    expect([TIER_DIAMONDS.common, TIER_DIAMONDS.good, TIER_DIAMONDS.fine, TIER_DIAMONDS.prime, TIER_DIAMONDS.rare]).toEqual([0, 1, 2, 3, 4]);
  });
  it('iconSvg returns one labelled 48×48 svg; drawn art replaces it by key', () => {
    const it0 = must(ITEMS[0]);
    const svg = iconSvg(it0.id, it0.icon, 'A "test" <label>');
    expect(svg.startsWith('<svg viewBox="0 0 48 48"')).toBe(true);
    expect(svg.match(/<svg/g)?.length).toBe(1);
    expect(svg).toContain('aria-label="A &quot;test&quot; &lt;label>"');
    ICON_ART['x.test'] = '<svg>drawn</svg>';
    expect(iconSvg('x.test', it0.icon)).toBe('<svg>drawn</svg>');
    delete ICON_ART['x.test'];
  });
});
