import { type Lang, siteName } from './nav';

interface HomeCopy {
  title: string;
  path: string;
  openingHeading: string;
  introLines: string[];
}

export const homeCopy: Record<Lang, HomeCopy> = {
  en: {
    title: siteName,
    path: '/',
    openingHeading: 'Next Opening',
    introLines: [
      'Welcome, traveler…',
      'You have found your way to a place where time slows down and the world grows quiet for a while.',
      'Behind warm lights, gentle steam, and soft voices lies a bathhouse that is more than just a place...',
      'a home for stories, encounters, and memories.',
      'Step inside, leave your worries behind…',
      'and find peace within the Tiny Temptation Tubs.',
    ],
  },
  de: {
    title: siteName,
    path: '/de.html',
    openingHeading: 'Nächste Öffnung',
    introLines: [
      'Willkommen, Reisender…',
      'Du hast den Weg zu einem Ort gefunden, an dem die Zeit langsamer vergeht und die Welt für einen Moment stillsteht.',
      'Hinter warmem Licht, sanftem Dampf und leisen Stimmen verbirgt sich ein Badehaus, das mehr ist als nur ein Ort...',
      'ein Zuhause für Geschichten, Begegnungen und Erinnerungen.',
      'Tritt ein, lege die Last des Alltags ab…',
      'und finde Ruhe bei uns in den Tiny Temptation Tubs.',
    ],
  },
};
