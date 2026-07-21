import type { Lang } from './nav';
import { resolveImage } from './images';

interface BandLogoConfig {
  path: string;
  alt: Record<Lang, string>;
  imageClass?: string;
}

const BAND_LOGO_PATHS: BandLogoConfig[] = [
  {
    path: 'gallery/bands/29745391.png',
    alt: {
      en: 'The Badger Trinity logo',
      de: 'The Badger Trinity Logo',
    },
    imageClass: 'scale-125',
  },
  {
    path: 'gallery/bands/TheSundering-White.png',
    alt: {
      en: 'The Sundering logo',
      de: 'The Sundering Logo',
    },
  },
];

interface PartnerCopy {
  title: string;
  path: string;
  heading: string;
  introParagraphs: readonly string[];
  introClosing: string;
  mobathLogoAlt: string;
  mobathHeading: string;
  mobathBody: readonly string[];
  mobathWorlds: string;
  discordLabel: string;
  bandsHeading: string;
}

export const partnerCopy: Record<Lang, PartnerCopy> = {
  en: {
    title: 'Partner | Tiny Temptation Tubs',
    path: '/en/team/partner/',
    heading: 'Partner',
    introParagraphs: [
      'Beyond our walls, there are places that are connected to us.',
      'Friends, houses, and communities with whom we share stories.',
    ],
    introClosing: 'Together, we create a greater world.',
    mobathLogoAlt: "MO'BATH Loft logo",
    mobathHeading: "MO'BATH LOFT",
    mobathBody: [
      "MO'BATH LOFT is a relaxing bathhouse venue welcoming guests of all races and genders. Enjoy hot baths, friendly conversations, mini-games, and scenic views in a cozy and inclusive atmosphere.",
      'The bathhouse is open Friday and Sunday, but you always can visit outside of working hours and hang out there.',
    ],
    mobathWorlds: 'Chaos, Cerberus, Goblet, W28, P4',
    discordLabel: 'Partner Discord',
    bandsHeading: '♫ Music bands ♫',
  },
  de: {
    title: 'Partner | Tiny Temptation Tubs',
    path: '/de/team/partner/',
    heading: 'Partner',
    introParagraphs: [
      'Auch außerhalb unserer Mauern gibt es Orte, die uns verbunden sind.',
      'Freunde, Häuser und Gemeinschaften, mit denen wir Geschichten teilen.',
    ],
    introClosing: 'Gemeinsam erschaffen wir eine größere Welt.',
    mobathLogoAlt: "MO'BATH Loft Logo",
    mobathHeading: "MO'BATH LOFT",
    mobathBody: [
      "MO'BATH LOFT - Das Badehaus ist ein entspannter Ort, der Gäste aller Herkunft, Geschlechter und Identitäten willkommen heißt. Genieße heiße Bäder, freundliche Gespräche, kleine Spiele und eine schöne Aussicht in einer gemütlichen und inklusiven Atmosphäre.",
      'Das Badehaus ist freitags und sonntags geöffnet. Du kannst jedoch auch außerhalb der offiziellen Öffnungszeiten vorbeikommen und dort Zeit verbringen.',
    ],
    mobathWorlds: 'Chaos, Cerberus, Goblet, W28, P4',
    discordLabel: 'Partner-Discord',
    bandsHeading: '♫ Musikbands ♫',
  },
};

export function partnerBandLogos(lang: Lang) {
  return BAND_LOGO_PATHS.map(({ path, alt, imageClass }) => ({
    src: resolveImage(path),
    alt: alt[lang],
    imageClass,
  }));
}
