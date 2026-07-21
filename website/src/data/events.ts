import type { Lang } from './nav';

export const FEATURED_EVENT_IMAGE = 'events/Event_18.07.26.png' as const;

interface EventsPageCopy {
  title: string;
  path: string;
  heading: string;
  featuredAlt: string;
  archiveHeading: string;
  photoAltPrefix: string;
}

export const eventsCopy: Record<Lang, EventsPageCopy> = {
  en: {
    title: 'Events | Tiny Temptation Tubs',
    path: '/en/pics/events/',
    heading: 'Events',
    featuredAlt: 'Next event: Saturday at 18:00 server time',
    archiveHeading: '★ Archive ★',
    photoAltPrefix: 'Event photo',
  },
  de: {
    title: 'Events | Tiny Temptation Tubs',
    path: '/de/bilder/events/',
    heading: 'Events',
    featuredAlt: 'Nächstes Event: Samstag um 18:00 Uhr Serverzeit',
    archiveHeading: '★ Archiv ★',
    photoAltPrefix: 'Event-Foto',
  },
};
