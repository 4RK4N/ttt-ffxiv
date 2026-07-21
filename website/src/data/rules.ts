import type { Lang } from './nav';

interface RuleCardCopy {
  title: string;
  body: string;
}

export interface RulesPageCopy {
  title: string;
  path: string;
  heading: string;
  introTitle: string;
  introBody: string;
  cards: RuleCardCopy[];
}

export const rulesCopy: Record<Lang, RulesPageCopy> = {
  en: {
    title: 'House rules | Tiny Temptation Tubs',
    path: '/en/rules/',
    heading: 'Rules',
    introTitle: 'Venue &amp; Server Rules',
    introBody:
      'To ensure a safe, relaxed, and enjoyable experience for everyone, the following house rules apply within our bathhouse. By entering the venue, you agree to read, understand, and follow these rules.',
    cards: [
      {
        title: 'General Conduct',
        body: 'Treat all guests with respect.<br /> No hate, harassment, bullying, discrimination, or drama. Hate speech results in an instant ban.<br /> NO means NO - always and without exception.',
      },
      {
        title: 'Chat &amp; Community Rules',
        body: 'No spam, flooding, or ping abuse.<br /> No mic spam or intentionally loud or disruptive noises.<br /> Stay on topic in the appropriate channels.<br /> No advertisements unless approved by staff.<br /> No illegal, harmful, or disruptive content.<br /> Respect privacy - no doxxing or sharing personal information.<br /> <strong class="text-bar-accent">The usage and advertisement of Loporrit Sync is strongly discouraged! As adult Lalafell you have nothing to worry on Lightless!</strong>',
      },
      {
        title: 'Age Requirement',
        body: 'This is an 18+ venue!<br /> Entry is only allowed if both real age and roleplay age are 18+.<br /> <strong class="text-bar-accent">The Kitten Body, any variation of it using C+, as well as any depiction of an underage character will be immediately banned and reported to Lightless!</strong>',
      },
      {
        title: 'Races &amp; Roleplay',
        body: '<strong>All</strong> races are welcome <strong>including</strong> Lalafell. The same rules apply to everyone.<br /> Nudity is allowed and encouraged.<br /> ERP is allowed as long as it is consensual and follows the general rules.<br /> Sexual animations are allowed, however:<br /> - Please keep ERP chat in private.<br /> - Do not involve others without their explicit consent.<br /> - Do not take sexual roleplay to extreme levels in public areas.',
      },
      {
        title: 'Emotes, Pets &amp; Items',
        body: 'Please deactivate emote logs.<br /> Only use weapons or pets if they fit your RP character.',
      },
      {
        title: 'Rooms &amp; Usage',
        body: 'Rooms may be used freely.<br /> If staff requires a room for massages or photos, please vacate it when asked.',
      },
      {
        title: 'Enforcement',
        body: 'Staff reserves the right to take appropriate action in case of rule violations.<br /> Repeated or severe violations may result in a permanent ban.<br /> The staff team always has the final say.<br /> Staff decisions must be respected and are not to be publicly argued or challenged.',
      },
      {
        title: 'NSFW',
        body: "NSFW content is only permitted in designated NSFW areas. These areas are open to all races, including Lalafell. Access to NSFW areas and the required role are granted exclusively by the Owner or Co-Owner. We try our best to make sure there won't come a reporting wave based on our server so you can post freely and without fear<br /> NSFW content outside these areas is not allowed.",
      },
    ],
  },
  de: {
    title: 'Hausregeln | Tiny Temptation Tubs',
    path: '/de/regeln/',
    heading: 'Regeln',
    introTitle: 'Venue- &amp; Serverregeln',
    introBody:
      'Um allen Gästen ein sicheres, entspanntes und angenehmes Erlebnis zu ermöglichen, gelten in unserem Badehaus die folgenden Hausregeln. Mit dem Betreten der Venue erklärst du dich damit einverstanden, diese Regeln zu lesen, zu verstehen und einzuhalten.',
    cards: [
      {
        title: 'Allgemeines Verhalten',
        body: 'Behandelt alle Gäste respektvoll.<br /> Kein Hass, keine Belästigung, kein Mobbing, keine Diskriminierung und kein Drama. Hassrede führt zu einem sofortigen Bann.<br /> NEIN heißt NEIN - immer und ohne Ausnahme.',
      },
      {
        title: 'Chat- &amp; Community-Regeln',
        body: 'Kein Spam, Flooding oder Ping-Missbrauch.<br /> Kein Mic-Spam oder absichtlich laute/störende Geräusche.<br /> Bleibt im jeweiligen Channel beim Thema.<br /> Keine Werbung ohne Genehmigung des Staffs.<br /> Keine illegalen, schädlichen oder störenden Inhalte.<br /> Respektiert die Privatsphäre - kein Doxxing oder Teilen persönlicher Informationen.<br /> <strong class="text-bar-accent">Von der Verwendung und Bewerbung der Loporrit Sync wird strengstens abgeraten! Als erwachsene(r) Lalafell hast du nichts zu befürchten bei Lightless!</strong>',
      },
      {
        title: 'Altersbeschränkung',
        body: 'Dies ist ein 18+ Venue!<br /> Zutritt ist nur gestattet, wenn sowohl reales Alter als auch RP-Alter 18+ sind.<br /> <strong class="text-bar-accent">Der Kitten Body, sowie alle Variationen davon per C+ und jegliches Darstellen von Minderjährigen ist verboten und führt zu sofortigem Bann sowie zum Lightless-Report!</strong>',
      },
      {
        title: 'Rassen &amp; Roleplay',
        body: '<strong>Alle</strong> Rassen sind willkommen <strong>inklusive</strong> Lalafell. Für alle Gäste gelten die gleichen Regeln.<br /> Nacktheit ist erlaubt und wir ermutigen dazu.<br /> ERP ist erlaubt, sofern es einvernehmlich ist und die allgemeinen Regeln eingehalten werden.<br /> Sexuelle Animationen sind erlaubt, jedoch:<br /> - ERP-Chats bitte privat halten.<br /> - Keine Einbeziehung anderer ohne deren ausdrückliche Zustimmung.<br /> - Keine extremen Inhalte im öffentlichen Bereich.',
      },
      {
        title: 'Emotes, Pets &amp; Items',
        body: 'Bitte deaktiviert Emote-Logs.<br /> Waffen und Pets nur verwenden, wenn sie zu eurem RP-Charakter passen.',
      },
      {
        title: 'Räume &amp; Nutzung',
        body: 'Räume dürfen frei genutzt werden.<br /> Wenn der Staff einen Raum für Massagen oder Fotos benötigt, bitte diesen auf Anfrage freigeben.',
      },
      {
        title: 'Durchsetzung',
        body: 'Das Team behält sich vor, bei Regelverstößen angemessen zu handeln.<br /> Wiederholte oder schwere Verstöße können zu einem dauerhaften Bann führen.<br /> Das Staff-Team hat jederzeit das letzte Wort.<br /> Entscheidungen des Staffs sind zu respektieren und nicht öffentlich zu diskutieren.',
      },
      {
        title: 'NSFW',
        body: 'NSFW-Inhalte sind ausschließlich in den dafür vorgesehenen NSFW-Bereichen erlaubt. Diese Bereiche sind für alle Rassen offen, einschließlich Lalafell. Der Zugang zu NSFW-Bereichen sowie die entsprechende Rolle werden ausschließlich vom Owner oder Co-Owner vergeben. Wir versuchen unser bestmögliches um eine Bann-Welle zu verhindern, sodass ihr frei und ohne Angst eure Kunstwerke teilen könnt<br /> NSFW-Inhalte außerhalb dieser Bereiche sind nicht gestattet.',
      },
    ],
  },
};
