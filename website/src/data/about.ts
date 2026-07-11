import type { Lang } from "./nav";

interface AboutPageCopy {
  title: string;
  path: string;
  heading: string;
  whatIsHeading: string;
  whatIsBody: readonly [string, string];
  whoForHeading: string;
  whoForLead: string;
  whoForList: readonly [string, string, string];
  whoForBody: readonly [string, string];
}

export const aboutCopy: Record<Lang, AboutPageCopy> = {
  en: {
    title: "About our house | Tiny Temptation Tubs",
    path: "/en/about/",
    heading: "About our house",
    whatIsHeading: "What is <strong>Tiny Temptation Tubs</strong>?",
    whatIsBody: [
      "Tiny Temptation Tubs is an RP &amp; ERP bathhouse, a place for relaxation, connection, and closeness.",
      "We offer our guests a warm and stylish environment where roleplay, conversations, shared evenings, and special moments take center stage. Whether you seek quiet relaxation, deep conversations, or more sensual RP, you are free to express yourself here - as long as everything remains respectful and consensual.",
    ],
    whoForHeading: "Who is this place for?",
    whoForLead: "Our house is open to everyone who:",
    whoForList: [
      "enjoys RP and community",
      "is looking for a safe and respectful space",
      "wants to experience relaxed or more intimate interactions",
    ],
    whoForBody: [
      "All races are welcome, including Lalafell. We take great care to keep this place safe and comfortable for everyone.",
      "Tiny Temptation Tubs is more than just a place — it is a space for connection, stories, and shared experiences.",
    ],
  },
  de: {
    title: "Über unser Haus | Tiny Temptation Tubs",
    path: "/de/uber-uns/",
    heading: "Über unser Haus",
    whatIsHeading: "Was ist <strong>Tiny Temptation Tubs</strong>?",
    whatIsBody: [
      "Tiny Temptation Tubs ist ein RP- &amp; ERP-Badehaus, ein Ort der Entspannung, Begegnung und Nähe.",
      "Wir bieten unseren Gästen eine warme, stilvolle Umgebung, in der Roleplay, Gespräche, gemeinsame Abende und besondere Momente im Mittelpunkt stehen. Ob ruhige Zeit im Wasser, tiefgehende Gespräche oder sinnliches RP – bei uns darf sich jeder frei entfalten, solange alles respektvoll und einvernehmlich bleibt.",
    ],
    whoForHeading: "Für wen ist unser Haus?",
    whoForLead: "Unser Haus steht allen offen, die:",
    whoForList: [
      "Freude an RP und Gemeinschaft haben",
      "einen sicheren und respektvollen Raum suchen",
      "entspannte oder intensive Begegnungen erleben möchten",
    ],
    whoForBody: [
      "Alle Rassen sind bei uns willkommen, einschließlich Lalafell. Wir achten besonders darauf, dass unser Haus ein Ort bleibt, an dem sich jeder wohl und akzeptiert fühlen kann.",
      "Tiny Temptation Tubs ist mehr als ein Ort – es ist ein Raum für Begegnung, Geschichten und gemeinsame Erlebnisse.",
    ],
  },
};
