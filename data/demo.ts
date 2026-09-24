export type MemoryStatus = "known" | "inferred" | "unknown" | "disputed";
export type Privacy = "available" | "private" | "excluded";
export type Memory = {
  id: string;
  subjectId: string;
  category: "People" | "Preferences" | "Routines" | "Plans" | "Wellbeing";
  label: string;
  value: string;
  status: MemoryStatus;
  confidence: number | null;
  source: string;
  sourceType: "user" | "email" | "calendar" | "contacts" | "inference" | "demo";
  observedAt: string;
  lastVerified: string | null;
  evidence: string;
  privacy: Privacy;
};

export type Person = {
  id: string;
  name: string;
  relation: string;
  importance: "Inner circle" | "Close" | "Regular";
  initials: string;
  color: string;
  lastContact: string;
  nextMoment?: string;
  details: string;
};

export type Insight = {
  id: string;
  kind: "check-in" | "opportunity" | "relationship" | "commitment";
  eyebrow: string;
  title: string;
  body: string;
  evidence: string[];
  confidence: string;
  action: string;
  secondary: string;
  personId?: string;
};

export type Event = {
  id: string;
  date: string;
  title: string;
  detail: string;
  source: string;
  personId?: string;
};

export type Connector = {
  id: string;
  name: string;
  category: string;
  description: string;
  status: "demo" | "available" | "exploring";
  data: string;
};

export const people: Person[] = [
  { id: "morgan", name: "Morgan", relation: "Wife", importance: "Inner circle", initials: "MG", color: "peach", lastContact: "Today", nextMoment: "Anniversary · Oct 17", details: "Loves the coast, live music, and unhurried weekends." },
  { id: "mike", name: "Mike Thompson", relation: "Close friend", importance: "Close", initials: "MT", color: "blue", lastContact: "Aug 19", nextMoment: "Birthday · Oct 2", details: "Recently changed jobs. Likes golf and the Buffalo Bills." },
  { id: "sarah", name: "Sarah Thompson", relation: "Mike’s wife · Friend", importance: "Close", initials: "ST", color: "lilac", lastContact: "Sep 12", details: "Started a new role at Northstar Health. Emma is her daughter." },
  { id: "chris", name: "Chris Reed", relation: "Friend", importance: "Close", initials: "CR", color: "mint", lastContact: "Jul 4", details: "You usually catch up every two to three weeks." },
  { id: "mom", name: "Mom", relation: "Mother", importance: "Inner circle", initials: "MO", color: "rose", lastContact: "Yesterday", nextMoment: "Appointment · Thursday", details: "Enjoys gardening. Her anniversary is still unknown." },
  { id: "dad", name: "Dad", relation: "Father", importance: "Inner circle", initials: "DA", color: "sand", lastContact: "Sep 18", nextMoment: "Birthday · Jun 14", details: "Enjoys Sunday dinners and old jazz records." },
  { id: "steve", name: "Steve Johnson", relation: "Friend", importance: "Regular", initials: "SJ", color: "slate", lastContact: "Sep 10", details: "You offered to send him a contractor’s number." },
];

export const memories: Memory[] = [
  { id: "m-morgan-coast", subjectId: "morgan", category: "Preferences", label: "Enjoys coastal weekends", value: "Morgan mentioned the coast as a place she wants to revisit.", status: "known", confidence: 0.95, source: "Conversation note · demo", sourceType: "demo", observedAt: "2026-06-12", lastVerified: "2026-06-12", evidence: "Fictional note: “Morgan keeps talking about the little inn on the coast.”", privacy: "available" },
  { id: "m-morgan-gift", subjectId: "morgan", category: "Preferences", label: "Gift idea", value: "A weekend at the coast", status: "known", confidence: 1, source: "Demo note", sourceType: "demo", observedAt: "2026-08-04", lastVerified: "2026-08-04", evidence: "Fictional gift idea saved for this demo.", privacy: "available" },
  { id: "m-anniversary", subjectId: "morgan", category: "People", label: "Wedding anniversary", value: "October 17", status: "known", confidence: 1, source: "You", sourceType: "user", observedAt: "2026-01-08", lastVerified: "2026-01-08", evidence: "You entered your anniversary during setup.", privacy: "available" },
  { id: "m-mike-birthday", subjectId: "mike", category: "People", label: "Birthday", value: "October 2", status: "known", confidence: 0.98, source: "Contacts import · demo", sourceType: "contacts", observedAt: "2026-07-14", lastVerified: "2026-07-14", evidence: "Birthday field in the imported contact card.", privacy: "available" },
  { id: "m-mike-golf", subjectId: "mike", category: "Preferences", label: "Possibly likes golf", value: "Golf", status: "inferred", confidence: 0.76, source: "Demo conversation history", sourceType: "inference", observedAt: "2026-08-19", lastVerified: null, evidence: "Golf came up in three sample conversations. Mike has not confirmed it as a lasting interest.", privacy: "available" },
  { id: "m-sarah-role", subjectId: "sarah", category: "People", label: "New role", value: "Director of Operations at Northstar Health", status: "inferred", confidence: 0.84, source: "Demo update", sourceType: "demo", observedAt: "2026-09-18", lastVerified: null, evidence: "Illustrative social update in the demo. No LinkedIn account is connected.", privacy: "available" },
  { id: "m-chris-rhythm", subjectId: "chris", category: "People", label: "Contact rhythm", value: "Usually every two to three weeks; last sample contact July 4", status: "inferred", confidence: 0.78, source: "Demo interaction history", sourceType: "inference", observedAt: "2026-09-22", lastVerified: null, evidence: "Illustrative interaction dates over fourteen months. This is a pattern, not a relationship score.", privacy: "available" },
  { id: "m-steve-loop", subjectId: "steve", category: "Plans", label: "Possible open loop", value: "Send Steve the contractor's number", status: "inferred", confidence: 0.81, source: "Sample email", sourceType: "inference", observedAt: "2026-09-10", lastVerified: null, evidence: "Fictional email said: “I'll send you the number.” No follow-up is present in the sample history.", privacy: "available" },
  { id: "m-mom-anniversary", subjectId: "mom", category: "People", label: "Anniversary", value: "Unknown", status: "unknown", confidence: null, source: "None", sourceType: "user", observedAt: "2026-09-20", lastVerified: null, evidence: "YOU has not received a date from you or a permitted source.", privacy: "available" },
  { id: "m-work", subjectId: "self", category: "Routines", label: "A busy work stretch", value: "Several late evenings this week", status: "inferred", confidence: 0.7, source: "Demo calendar pattern", sourceType: "inference", observedAt: "2026-09-22", lastVerified: null, evidence: "Illustrative calendar has four evening work blocks. This is a pattern, not a judgment about wellbeing.", privacy: "private" },
  { id: "m-live-music", subjectId: "self", category: "Preferences", label: "Enjoys live music", value: "Small outdoor concerts", status: "known", confidence: 1, source: "You", sourceType: "user", observedAt: "2026-08-29", lastVerified: "2026-08-29", evidence: "You saved live music as an interest.", privacy: "available" },
  { id: "m-screentime", subjectId: "self", category: "Routines", label: "Screen Time trend", value: "Unknown · no device data connected", status: "unknown", confidence: null, source: "No connector", sourceType: "demo", observedAt: "2026-09-22", lastVerified: null, evidence: "YOU cannot see app use or TikTok activity in this prototype.", privacy: "excluded" },
  { id: "m-boundary", subjectId: "self", category: "Wellbeing", label: "Check-in style", value: "Ask gently; never assume how I feel", status: "known", confidence: 1, source: "You", sourceType: "user", observedAt: "2026-09-22", lastVerified: "2026-09-22", evidence: "Preference set in this demo.", privacy: "available" },
];

export const insights: Insight[] = [
  { id: "work", kind: "check-in", eyebrow: "A GENTLE CHECK-IN", title: "It looks like a full week.", body: "There are several late work blocks in your sample calendar. Want to talk through what’s on your plate, or make a little space this evening?", evidence: ["Four evening work blocks in the demo calendar", "You asked for gentle check-ins"], confidence: "Tentative pattern", action: "Talk it through", secondary: "Not right now" },
  { id: "concert", kind: "opportunity", eyebrow: "AN IDEA FOR TONIGHT", title: "A little live music could be nice.", body: "You’ve saved outdoor concerts as an interest. A sample “Concert on the Green” is shown here to demonstrate how a local event suggestion would work.", evidence: ["Your saved interest: small outdoor concerts", "Event listing is illustrative, not verified"], confidence: "Demo suggestion", action: "Explore the idea", secondary: "Show fewer like this" },
  { id: "chris", kind: "relationship", eyebrow: "STAY CLOSE", title: "Chris has been on your mind?", body: "You usually catch up every two to three weeks. The sample history shows eleven weeks since you last spoke.", evidence: ["14 months of sample interactions", "Last contact: July 4"], confidence: "Supported by sample history", action: "Draft a note", secondary: "Remind me later", personId: "chris" },
  { id: "steve", kind: "commitment", eyebrow: "AN OPEN LOOP", title: "You offered Steve a contractor’s number.", body: "A sample email from September 10 suggests you meant to follow up. Is that still open?", evidence: ["Sample email: “I’ll send you the number”", "No follow-up appears in the demo"], confidence: "Possible commitment", action: "Mark handled", secondary: "Not a commitment", personId: "steve" },
];

export const events: Event[] = [
  { id: "e1", date: "Sep 20", title: "Mom mentioned an appointment", detail: "You saved a reminder for Thursday.", source: "Manual note · demo", personId: "mom" },
  { id: "e2", date: "Sep 18", title: "Sarah may have started a new role", detail: "This has not been confirmed with Sarah.", source: "Illustrative update", personId: "sarah" },
  { id: "e3", date: "Sep 10", title: "You offered Steve a contractor’s number", detail: "Potential commitment still open.", source: "Sample email", personId: "steve" },
  { id: "e4", date: "Aug 19", title: "Caught up with Mike", detail: "Golf and a possible Italy trip came up.", source: "Sample email", personId: "mike" },
  { id: "e5", date: "Jul 04", title: "Last catch-up with Chris", detail: "Your usual interval is two to three weeks.", source: "Sample interaction", personId: "chris" },
];

export const connectors: Connector[] = [
  { id: "contacts", name: "Contacts", category: "People", description: "Names, contact details, and important dates", status: "demo", data: "Contact cards" },
  { id: "gmail", name: "Gmail", category: "Communication", description: "Context and commitments from permitted email", status: "available", data: "Email metadata & selected messages" },
  { id: "calendar", name: "Calendar", category: "Time", description: "Events, plans, and interaction patterns", status: "available", data: "Events you authorize" },
  { id: "linkedin", name: "LinkedIn", category: "People", description: "Public career updates where access is permitted", status: "exploring", data: "User-approved profile candidates" },
  { id: "instagram", name: "Instagram", category: "Interests", description: "Permitted profile context and interest candidates", status: "exploring", data: "User-reviewed facts" },
  { id: "facebook", name: "Facebook", category: "People", description: "Permitted events, family dates, and updates", status: "exploring", data: "User-reviewed facts" },
  { id: "screentime", name: "Device activity", category: "Wellbeing", description: "Optional app usage trends, if a platform permits access", status: "exploring", data: "Aggregate trends only" },
  { id: "events", name: "Local events", category: "Discover", description: "Nearby activities and ticket links", status: "exploring", data: "Public event listings" },
  { id: "mcp", name: "MCP & API", category: "Agent access", description: "Let any authorized assistant query scoped memories", status: "available", data: "Read scopes & audit trail" },
];
