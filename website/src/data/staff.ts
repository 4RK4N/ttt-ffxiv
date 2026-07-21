import type { Lang } from './nav';
import { resolveImages } from './images';

/** Full-time staff cards in display order (3-column grid). */
const STAFF_MAIN_PATHS = [
  'staff/Reiji-Staff.png',
  'staff/Soldea-Staff.png',
  'staff/Domi-Staff.png',
  'staff/Elphine-Staff.png',
  'staff/Ralvus-Staff.png',
  'staff/Domino-Staff.png',
] as const;

/** Part-time staff — shown below the main grid. */
const STAFF_PART_TIME_PATHS = ['staff/alice.png'] as const;

export const staffMain = resolveImages(STAFF_MAIN_PATHS);
export const staffPartTime = resolveImages(STAFF_PART_TIME_PATHS);

interface StaffPageCopy {
  title: string;
  path: string;
  heading: string;
  partTimeHeading: string;
  altPrefix: string;
  paragraphs: readonly string[];
}

export const staffCopy: Record<Lang, StaffPageCopy> = {
  en: {
    title: 'Staff | Tiny Temptation Tubs',
    path: '/en/team/staff/',
    heading: 'Staff',
    partTimeHeading: 'Part Time',
    altPrefix: 'Staff portrait',
    paragraphs: [
      'Behind every warm welcome stand those who care for the house.',
      'Our hosts, helpers, and guardians ensure every moment remains pleasant.',
      'They keep the balance so everyone feels safe and welcome.',
    ],
  },
  de: {
    title: 'Staff | Tiny Temptation Tubs',
    path: '/de/team/staff/',
    heading: 'Staff',
    partTimeHeading: 'Teilzeit',
    altPrefix: 'Staff portrait',
    paragraphs: [
      'Hinter jedem warmen Empfang stehen jene, die sich um das Haus kümmern.',
      'Unsere Gastgeber, Helfer und Wächter sorgen dafür, dass jeder Moment angenehm bleibt.',
      'Sie halten das Gleichgewicht, damit sich jeder sicher und willkommen fühlt.',
    ],
  },
};
