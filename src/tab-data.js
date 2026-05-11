/* Mock saved tabs — used in dev when chrome.storage is unavailable */

const now = Date.now();
const h = (n) => now - n * 60 * 60 * 1000;
const d = (n) => now - n * 24 * 60 * 60 * 1000;

const TAB_DATA = [
  { id: 't01', title: 'How to write a great PRD — a few rules I keep returning to', domain: 'medium.com',             url: 'https://medium.com', savedAt: 2,  unit: 'hours', savedTimestamp: h(2) },
  { id: 't02', title: 'Pull request #3421 · feat(api): add background jobs',          domain: 'github.com',             url: 'https://github.com', savedAt: 6,  unit: 'hours', savedTimestamp: h(6) },
  { id: 't03', title: 'Tailwind CSS v4 release notes',                                domain: 'tailwindcss.com',        url: 'https://tailwindcss.com', savedAt: 9,  unit: 'hours', savedTimestamp: h(9) },
  { id: 't04', title: 'Apartment for rent · 2BR Brooklyn · Cobble Hill',              domain: 'streeteasy.com',         url: 'https://streeteasy.com', savedAt: 11, unit: 'hours', savedTimestamp: h(11) },
  { id: 't05', title: 'Q3 planning doc — draft v3',                                   domain: 'notion.so',              url: 'https://notion.so', savedAt: 1,  unit: 'days', savedTimestamp: d(1) },
  { id: 't06', title: 'Figma · Tab Saver — popup explorations',                       domain: 'figma.com',              url: 'https://figma.com', savedAt: 1,  unit: 'days', savedTimestamp: d(1) },
  { id: 't07', title: 'Order #A4-9912 confirmation',                                  domain: 'amazon.com',             url: 'https://amazon.com', savedAt: 1,  unit: 'days', savedTimestamp: d(1) },
  { id: 't08', title: 'Why your CSS feels so hard — Smashing Magazine',               domain: 'smashingmagazine.com',   url: 'https://smashingmagazine.com', savedAt: 1,  unit: 'days', savedTimestamp: d(1) },
  { id: 't09', title: 'Pull request #3380 · refactor(auth): rotate session keys',     domain: 'github.com',             url: 'https://github.com', savedAt: 1,  unit: 'days', savedTimestamp: d(1) },
  { id: 't10', title: 'Designing for calm software — Mark Weiser revisited',          domain: 'calmtech.com',           url: 'https://calmtech.com', savedAt: 3,  unit: 'days', savedTimestamp: d(3) },
  { id: 't11', title: 'JavaScript Date is broken — Temporal proposal',                domain: 'tc39.es',                url: 'https://tc39.es', savedAt: 3,  unit: 'days', savedTimestamp: d(3) },
  { id: 't12', title: 'Best coffee grinder under $200 (2025)',                        domain: 'nytimes.com',            url: 'https://nytimes.com', savedAt: 3,  unit: 'days', savedTimestamp: d(3) },
  { id: 't13', title: 'Slow-roasted tomato pasta recipe',                             domain: 'nytimes.com',            url: 'https://nytimes.com', savedAt: 3,  unit: 'days', savedTimestamp: d(3) },
  { id: 't14', title: 'CSS subgrid not behaving in Safari 17',                        domain: 'stackoverflow.com',      url: 'https://stackoverflow.com', savedAt: 3,  unit: 'days', savedTimestamp: d(3) },
  { id: 't15', title: 'How do plants count? — Quanta Magazine',                       domain: 'quantamagazine.org',     url: 'https://quantamagazine.org', savedAt: 4,  unit: 'days', savedTimestamp: d(4) },
  { id: 't16', title: 'Linear changelog · Cycles redesign',                           domain: 'linear.app',             url: 'https://linear.app', savedAt: 5,  unit: 'days', savedTimestamp: d(5) },
  { id: 't17', title: 'Ask HN: best obscure CLI tools?',                              domain: 'news.ycombinator.com',   url: 'https://news.ycombinator.com', savedAt: 6,  unit: 'days', savedTimestamp: d(6) },
  { id: 't18', title: 'The Anatomy of a Good Status Page',                            domain: 'vercel.com',             url: 'https://vercel.com', savedAt: 6,  unit: 'days', savedTimestamp: d(6) },
  { id: 't19', title: 'Pricing — Cursor',                                             domain: 'cursor.com',             url: 'https://cursor.com', savedAt: 7,  unit: 'days', savedTimestamp: d(7) },
  { id: 't20', title: 'Anthropic | Claude · A new model card',                        domain: 'anthropic.com',          url: 'https://anthropic.com', savedAt: 7,  unit: 'days', savedTimestamp: d(7) },
  { id: 't21', title: '1Password 8 release notes',                                    domain: '1password.com',          url: 'https://1password.com', savedAt: 8,  unit: 'days', savedTimestamp: d(8) },
  { id: 't22', title: 'GitHub · anthropics/anthropic-cookbook',                       domain: 'github.com',             url: 'https://github.com', savedAt: 8,  unit: 'days', savedTimestamp: d(8) },
  { id: 't23', title: 'Sleep aid — Yogi Bedtime Tea reviews',                         domain: 'reddit.com',             url: 'https://reddit.com', savedAt: 9,  unit: 'days', savedTimestamp: d(9) },
  { id: 't24', title: 'Vercel · Edge Functions pricing FAQ',                          domain: 'vercel.com',             url: 'https://vercel.com', savedAt: 9,  unit: 'days', savedTimestamp: d(9) },
  { id: 't25', title: 'Wikipedia — Calm technology',                                  domain: 'wikipedia.org',          url: 'https://wikipedia.org', savedAt: 10, unit: 'days', savedTimestamp: d(10) },
  { id: 't26', title: 'Stripe Docs · Webhook signatures',                             domain: 'stripe.com',             url: 'https://stripe.com', savedAt: 11, unit: 'days', savedTimestamp: d(11) },
  { id: 't27', title: 'Mapping Brooklyn\'s coffee desert',                            domain: 'nytimes.com',            url: 'https://nytimes.com', savedAt: 12, unit: 'days', savedTimestamp: d(12) },
  { id: 't28', title: 'Figma plugin · Color Palettes',                                domain: 'figma.com',              url: 'https://figma.com', savedAt: 12, unit: 'days', savedTimestamp: d(12) },
  { id: 't29', title: 'Hacker News · Show HN: I made a tiny tab manager',             domain: 'news.ycombinator.com',   url: 'https://news.ycombinator.com', savedAt: 13, unit: 'days', savedTimestamp: d(13) },
  { id: 't30', title: 'MDN — CSS subgrid',                                            domain: 'developer.mozilla.org',  url: 'https://developer.mozilla.org', savedAt: 14, unit: 'days', savedTimestamp: d(14) },
  { id: 't31', title: 'The case for fewer features — Basecamp',                       domain: 'basecamp.com',           url: 'https://basecamp.com', savedAt: 14, unit: 'days', savedTimestamp: d(14) },
  { id: 't32', title: 'Twitter / X · A thread on writing technical specs',            domain: 'x.com',                  url: 'https://x.com', savedAt: 15, unit: 'days', savedTimestamp: d(15) },
  { id: 't33', title: 'YouTube · How tab discarding actually works in Chrome',        domain: 'youtube.com',            url: 'https://youtube.com', savedAt: 16, unit: 'days', savedTimestamp: d(16) },
  { id: 't34', title: 'Reddit · r/productivity weekly thread',                        domain: 'reddit.com',             url: 'https://reddit.com', savedAt: 17, unit: 'days', savedTimestamp: d(17) },
  { id: 't35', title: 'Notion · Reading list',                                        domain: 'notion.so',              url: 'https://notion.so', savedAt: 18, unit: 'days', savedTimestamp: d(18) },
];

export default TAB_DATA;
