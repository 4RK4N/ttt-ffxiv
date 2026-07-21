import { describe, expect, it } from 'vitest';
import {
  footerLinks,
  homePath,
  isNavPathActive,
  pathMap,
  siteMenu,
  siteName,
} from '../src/data/nav';

function collectMenuPaths(lang: 'de' | 'en'): string[] {
  const menu = siteMenu[lang];
  return [
    ...menu.primaryLead.map((item) => item.path),
    ...menu.pics.items.map((item) => item.path),
    ...menu.primaryTrail.map((item) => item.path),
    ...menu.team.items.map((item) => item.path),
  ];
}

describe('nav', () => {
  it('exports the venue site name', () => {
    expect(siteName).toBe('Tiny Temptation Tubs');
  });

  it('builds DE and EN menus with expected structure and labels', () => {
    expect(siteMenu.de.primaryLead.map((item) => item.path)).toEqual([
      '/de/uber-uns/',
      '/de/regeln/',
      '/de/karte/',
    ]);
    expect(siteMenu.de.pics.label).toBe('Bilder');
    expect(siteMenu.de.pics.items.map((item) => item.path)).toEqual([
      '/de/bilder/haus/',
      '/de/bilder/events/',
    ]);
    expect(siteMenu.de.team.label).toBe('Team');
    expect(siteMenu.de.team.items.map((item) => item.label)).toEqual([
      'Staff',
      'Partner',
      'Mitwirken',
    ]);
    expect(siteMenu.de.primaryTrail).toEqual([{ label: 'Gästebuch', path: '/de/gaestebuch/' }]);

    expect(siteMenu.en.primaryLead.map((item) => item.path)).toEqual([
      '/en/about/',
      '/en/rules/',
      '/en/menu/',
    ]);
    expect(siteMenu.en.pics.label).toBe('Pics');
    expect(siteMenu.en.pics.items.map((item) => item.path)).toEqual([
      '/en/pics/venue/',
      '/en/pics/events/',
    ]);
    expect(siteMenu.en.team.items.map((item) => item.label)).toEqual([
      'Staff',
      'Partner',
      'Join us',
    ]);
    expect(siteMenu.en.primaryTrail).toEqual([{ label: 'Guestbook', path: '/en/guestbook/' }]);
  });

  it('keeps homepage brand paths per language', () => {
    expect(homePath.de).toBe('/de.html');
    expect(homePath.en).toBe('/');
  });

  it('matches nav path activity exactly', () => {
    expect(isNavPathActive('/en/about/', '/en/about/')).toBe(true);
    expect(isNavPathActive('/en/about/', '/en/rules/')).toBe(false);
  });

  it('maps every pathMap entry to both languages', () => {
    for (const [path, langs] of Object.entries(pathMap)) {
      expect(langs.de, `missing de for ${path}`).toBeTruthy();
      expect(langs.en, `missing en for ${path}`).toBeTruthy();
      expect(pathMap[langs.de]?.de).toBe(langs.de);
      expect(pathMap[langs.en]?.en).toBe(langs.en);
    }
  });

  it('includes every menu and footer path in pathMap', () => {
    for (const lang of ['de', 'en'] as const) {
      for (const path of collectMenuPaths(lang)) {
        expect(pathMap[path], `menu path missing from pathMap: ${path}`).toBeTruthy();
        expect(pathMap[path][lang]).toBe(path);
      }
      for (const { path, label } of footerLinks[lang]) {
        expect(pathMap[path], `footer path missing from pathMap: ${path}`).toBeTruthy();
        expect(pathMap[path][lang]).toBe(path);
        expect(label.length).toBeGreaterThan(0);
      }
    }
  });
});
