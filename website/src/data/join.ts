import type { Lang } from './nav';

interface JoinPageCopy {
  title: string;
  path: string;
  heading: string;
  introLead: string;
  introClosing: string;
  photoAltPrefix: string;
}

export const joinCopy: Record<Lang, JoinPageCopy> = {
  en: {
    title: 'Join us | Tiny Temptation Tubs',
    path: '/en/team/join/',
    heading: 'Join Us',
    introLead:
      'Perhaps you are more than just a guest… If you carry music in your heart, wish to bring joy to others, or want to become part of something greater',
    introClosing: 'Then we invite you to become part of our story.',
    photoAltPrefix: 'Team photo',
  },
  de: {
    title: 'Mitwirken | Tiny Temptation Tubs',
    path: '/de/team/mitwirken/',
    heading: 'Mitwirken',
    introLead:
      'Vielleicht bist du mehr als nur ein Gast… Wenn du Musik in deinem Herzen trägst, anderen Freude schenken willst oder Teil von etwas Größerem werden möchtest',
    introClosing: 'Dann laden wir dich ein, Teil unserer Geschichte zu werden.',
    photoAltPrefix: 'Team-Foto',
  },
};
