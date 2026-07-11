import type { Lang } from "./nav";

interface GuestbookPageCopy {
  title: string;
  path: string;
  heading: string;
  introLead: string;
  introStrong: string;
  altPrefix: string;
}

export const guestbookCopy: Record<Lang, GuestbookPageCopy> = {
  en: {
    title: "Guestbook | Tiny Temptation Tubs",
    path: "/en/guestbook/",
    heading: "Guestbook",
    introLead:
      "Messages left by our guests in our XIV venue guestbook — shared here as screenshots.",
    introStrong:
      "They say words can remain… Leave a piece of yourself, a few thoughts or memories so your journey here never truly fades.",
    altPrefix: "Guestbook message",
  },
  de: {
    title: "Gästebuch | Tiny Temptation Tubs",
    path: "/de/gaestebuch/",
    heading: "Gästebuch",
    introLead:
      "Nachrichten unserer Gäste aus dem Gästebuch unserer XIV-Location — hier als Screenshots festgehalten.",
    introStrong:
      "Man sagt, Worte können bleiben… Hinterlasse ein Stück von dir, ein paar Gedanken oder Erinnerungen — damit deine Reise bei uns niemals ganz vergeht.",
    altPrefix: "Gästebuch-Nachricht",
  },
};
