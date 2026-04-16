import { PrismaClient } from '@prisma/client';
import {
  LABEL_COLORS,
  BOARD_BG_PRESETS,
  POSITION_STEP,
} from '@trello-clone/shared';

const prisma = new PrismaClient();

// ─── helpers ────────────────────────────────────────────────────────────────
const days = (n: number) => new Date(Date.now() + n * 86_400_000);

async function main() {
  // ── Users ──────────────────────────────────────────────────────────────────
  const taylor = await prisma.user.upsert({
    where: { id: 'user_default' },
    update: {},
    create: {
      id: 'user_default',
      displayName: 'Taylor',
      initials: 'TA',
      color: '#0079BF',
      isDefault: true,
    },
  });

  const alex = await prisma.user.upsert({
    where: { id: 'user_alex' },
    update: {},
    create: {
      id: 'user_alex',
      displayName: 'Alex Kim',
      initials: 'AK',
      color: '#EB5A46',
    },
  });

  const priya = await prisma.user.upsert({
    where: { id: 'user_priya' },
    update: {},
    create: {
      id: 'user_priya',
      displayName: 'Priya Sharma',
      initials: 'PS',
      color: '#C377E0',
    },
  });

  const marco = await prisma.user.upsert({
    where: { id: 'user_marco' },
    update: {},
    create: {
      id: 'user_marco',
      displayName: 'Marco Rossi',
      initials: 'MR',
      color: '#61BD4F',
    },
  });

  const users = [taylor, alex, priya, marco];

  // ── Wipe existing boards owned by default user ─────────────────────────────
  await prisma.board.deleteMany({ where: { ownerId: taylor.id } });

  // ══════════════════════════════════════════════════════════════════════════
  // BOARD 1 — Product Launch
  // ══════════════════════════════════════════════════════════════════════════
  {
    const board = await prisma.board.create({
      data: {
        title: 'Product Launch',
        ownerId: taylor.id,
        backgroundType: 'color',
        backgroundValue: BOARD_BG_PRESETS[0], // #0079BF
        starred: true,
        members: {
          create: users.map((u, i) => ({
            userId: u.id,
            role: i === 0 ? 'owner' : 'member',
          })),
        },
      },
    });

    await prisma.activity.create({
      data: {
        boardId: board.id,
        actorId: taylor.id,
        type: 'board.created',
        payload: { title: board.title },
      },
    });

    const labelDefs = [
      { color: LABEL_COLORS[3], name: 'Urgent' },        // red
      { color: LABEL_COLORS[1], name: 'Bug' },            // yellow
      { color: LABEL_COLORS[0], name: 'Feature' },        // green
      { color: LABEL_COLORS[4], name: 'Design' },         // purple
      { color: LABEL_COLORS[5], name: 'Docs' },           // blue
      { color: LABEL_COLORS[2], name: 'Marketing' },      // orange
      { color: LABEL_COLORS[6], name: 'Research' },       // sky
      { color: LABEL_COLORS[7], name: 'DevOps' },         // lime
      { color: LABEL_COLORS[8], name: 'Legal' },          // pink
      { color: LABEL_COLORS[9], name: 'Analytics' },      // black
    ];
    const labels = await Promise.all(
      labelDefs.map((l) =>
        prisma.label.create({ data: { boardId: board.id, ...l } }),
      ),
    );

    const listTitles = ['Backlog', 'In Progress', 'Review', 'Done'];
    const lists = await Promise.all(
      listTitles.map((title, idx) =>
        prisma.list.create({
          data: { boardId: board.id, title, position: (idx + 1) * POSITION_STEP },
        }),
      ),
    );

    type CardDef = {
      list: number;
      title: string;
      desc?: string;
      labelIdxs?: number[];
      memberIds?: string[];
      due?: Date;
      dueComplete?: boolean;
      coverColor?: string;
      checklists?: { title: string; items: { text: string; done: boolean }[] }[];
      comments?: { authorId: string; body: string }[];
    };

    const cards: CardDef[] = [
      // Backlog
      {
        list: 0,
        title: 'Define success metrics for v2',
        desc: 'Align with stakeholders on KPIs: DAU, activation rate, NPS. Set baseline from v1 analytics.',
        labelIdxs: [2, 9],
        memberIds: [taylor.id, priya.id],
        due: days(14),
        comments: [
          { authorId: priya.id, body: 'We should also track time-to-value for new signups.' },
          { authorId: taylor.id, body: 'Good call — adding it to the metrics doc.' },
        ],
      },
      {
        list: 0,
        title: 'Write API documentation',
        desc: 'Cover all public endpoints with request/response examples. Use OpenAPI 3.1.',
        labelIdxs: [4],
        memberIds: [marco.id],
        due: days(10),
      },
      {
        list: 0,
        title: 'Conduct competitor analysis',
        desc: 'Benchmark against top 5 competitors on pricing, features, UX. Output: comparison matrix.',
        labelIdxs: [6],
        memberIds: [priya.id],
      },
      {
        list: 0,
        title: 'Localization: Spanish & French',
        desc: 'Export strings, send to translators, set up i18n pipeline.',
        labelIdxs: [2, 5],
        memberIds: [alex.id],
        due: days(21),
      },
      // In Progress
      {
        list: 1,
        title: 'Build onboarding flow v2',
        desc: 'Replace the modal wizard with inline coach-marks. A/B test against control.',
        labelIdxs: [2, 3],
        memberIds: [alex.id, taylor.id],
        due: days(-1),
        coverColor: '#0079BF',
        checklists: [
          {
            title: 'Design tasks',
            items: [
              { text: 'Wireframes approved', done: true },
              { text: 'High-fi mockups in Figma', done: true },
              { text: 'Micro-copy reviewed', done: false },
            ],
          },
          {
            title: 'Engineering tasks',
            items: [
              { text: 'Coach-mark component built', done: true },
              { text: 'Step state persisted to localStorage', done: false },
              { text: 'A/B flag wired', done: false },
            ],
          },
        ],
        comments: [
          { authorId: alex.id, body: 'Wireframes are approved. Moving to high-fi.' },
          { authorId: taylor.id, body: 'Make sure the skip button is always visible.' },
          { authorId: priya.id, body: 'Research shows step 3 has 40% drop-off — simplify it.' },
        ],
      },
      {
        list: 1,
        title: 'Optimize database query performance',
        desc: 'Profile slow queries (> 200 ms) on boards endpoint. Add missing indexes.',
        labelIdxs: [0, 7],
        memberIds: [marco.id],
        due: days(3),
        checklists: [
          {
            title: 'Query audit',
            items: [
              { text: 'Profile /api/boards with EXPLAIN ANALYZE', done: true },
              { text: 'Add composite index on Card(listId, position)', done: true },
              { text: 'Test query time improvement', done: false },
            ],
          },
        ],
        comments: [
          { authorId: marco.id, body: 'Found 3 N+1 queries in the lists route. Fixing now.' },
        ],
      },
      {
        list: 1,
        title: 'Launch referral program UI',
        desc: 'Shareable link, reward tiers, progress bar. Designs in Figma > Referral v2.',
        labelIdxs: [2, 5],
        memberIds: [priya.id, alex.id],
        due: days(5),
        coverColor: '#89609E',
      },
      {
        list: 1,
        title: 'Fix email notification delays',
        desc: 'Transactional emails are arriving 10–15 min late. Investigate queue backlog.',
        labelIdxs: [0, 1],
        memberIds: [marco.id],
        due: days(1),
      },
      // Review
      {
        list: 2,
        title: 'Review new pricing page design',
        desc: 'Check contrast ratios, copy hierarchy, and CTA placement against brand guidelines.',
        labelIdxs: [3],
        memberIds: [priya.id, taylor.id],
        comments: [
          { authorId: taylor.id, body: 'The annual/monthly toggle needs more visual weight.' },
          { authorId: priya.id, body: 'Agreed. I\'ll push an update before EOD.' },
        ],
      },
      {
        list: 2,
        title: 'Security audit — auth endpoints',
        desc: 'Penetration test login, reset, and OAuth flows. Fix any findings before launch.',
        labelIdxs: [0, 8],
        memberIds: [marco.id, taylor.id],
        due: days(2),
      },
      {
        list: 2,
        title: 'QA: mobile responsive pass',
        desc: 'Test on iPhone 13, Pixel 7, Samsung S23. Check 375 px breakpoint.',
        labelIdxs: [3],
        memberIds: [alex.id],
        due: days(0),
        checklists: [
          {
            title: 'Devices',
            items: [
              { text: 'iPhone 13 (375px)', done: true },
              { text: 'Pixel 7 (412px)', done: true },
              { text: 'Samsung S23 (360px)', done: false },
              { text: 'iPad Mini (768px)', done: false },
            ],
          },
        ],
      },
      // Done
      {
        list: 3,
        title: 'Publish v1.4 changelog',
        desc: 'Released on product blog and in-app notification.',
        labelIdxs: [4],
        memberIds: [taylor.id],
        due: days(-3),
        dueComplete: true,
      },
      {
        list: 3,
        title: 'Set up error monitoring (Sentry)',
        labelIdxs: [7],
        memberIds: [marco.id],
        dueComplete: true,
        comments: [
          { authorId: marco.id, body: 'Sentry DSN configured for both API and web. Alerts routed to #eng-alerts.' },
        ],
      },
      {
        list: 3,
        title: 'Integrate Stripe billing',
        desc: 'Subscription plans wired. Webhooks handle upgrades, downgrades, and cancellations.',
        labelIdxs: [2, 0],
        memberIds: [marco.id, taylor.id],
        due: days(-7),
        dueComplete: true,
        coverColor: '#519839',
        checklists: [
          {
            title: 'Stripe tasks',
            items: [
              { text: 'Create products & prices in Stripe dashboard', done: true },
              { text: 'Implement checkout session', done: true },
              { text: 'Handle webhook events', done: true },
              { text: 'Test upgrade / downgrade flows', done: true },
            ],
          },
        ],
      },
      {
        list: 3,
        title: 'User research: 10 interviews',
        desc: 'Ran discovery interviews with 10 power users. Insights summarized in Notion.',
        labelIdxs: [6],
        memberIds: [priya.id],
        dueComplete: true,
      },
    ];

    let cardPos = 0;
    for (const cfg of cards) {
      cardPos++;
      const card = await prisma.card.create({
        data: {
          boardId: board.id,
          listId: lists[cfg.list].id,
          title: cfg.title,
          description: cfg.desc ?? '',
          position: cardPos * POSITION_STEP,
          dueAt: cfg.due ?? null,
          dueComplete: cfg.dueComplete ?? (cfg.list === 3),
          coverType: cfg.coverColor ? 'color' : null,
          coverValue: cfg.coverColor ?? null,
          labels: cfg.labelIdxs
            ? { create: cfg.labelIdxs.map((i) => ({ labelId: labels[i].id })) }
            : undefined,
          members: cfg.memberIds
            ? { create: cfg.memberIds.map((uid) => ({ userId: uid })) }
            : undefined,
        },
      });

      await prisma.activity.create({
        data: {
          boardId: board.id,
          cardId: card.id,
          actorId: taylor.id,
          type: 'card.created',
          payload: { title: card.title },
        },
      });

      if (cfg.checklists) {
        for (let ci = 0; ci < cfg.checklists.length; ci++) {
          const cl = cfg.checklists[ci];
          const checklist = await prisma.checklist.create({
            data: {
              cardId: card.id,
              title: cl.title,
              position: (ci + 1) * POSITION_STEP,
            },
          });
          await Promise.all(
            cl.items.map((it, ii) =>
              prisma.checklistItem.create({
                data: {
                  checklistId: checklist.id,
                  text: it.text,
                  done: it.done,
                  position: (ii + 1) * POSITION_STEP,
                },
              }),
            ),
          );
        }
      }

      if (cfg.comments) {
        for (const cm of cfg.comments) {
          await prisma.comment.create({
            data: { cardId: card.id, authorId: cm.authorId, body: cm.body },
          });
        }
      }
    }

    console.log('✅ Board 1 — Product Launch seeded');
  }

  // ══════════════════════════════════════════════════════════════════════════
  // BOARD 2 — Engineering Sprint
  // ══════════════════════════════════════════════════════════════════════════
  {
    const board = await prisma.board.create({
      data: {
        title: 'Engineering Sprint 24',
        ownerId: taylor.id,
        backgroundType: 'color',
        backgroundValue: BOARD_BG_PRESETS[4], // purple
        members: {
          create: [
            { userId: taylor.id, role: 'owner' },
            { userId: alex.id, role: 'member' },
            { userId: marco.id, role: 'member' },
          ],
        },
      },
    });

    const labelDefs = [
      { color: LABEL_COLORS[3], name: 'P0 — Critical' },
      { color: LABEL_COLORS[2], name: 'P1 — High' },
      { color: LABEL_COLORS[1], name: 'P2 — Medium' },
      { color: LABEL_COLORS[9], name: 'P3 — Low' },
      { color: LABEL_COLORS[1], name: 'Bug' },
      { color: LABEL_COLORS[0], name: 'Feature' },
      { color: LABEL_COLORS[6], name: 'Tech Debt' },
      { color: LABEL_COLORS[7], name: 'Infrastructure' },
    ];
    const labels = await Promise.all(
      labelDefs.map((l) =>
        prisma.label.create({ data: { boardId: board.id, ...l } }),
      ),
    );

    const lists = await Promise.all(
      ['Sprint Backlog', 'In Progress', 'Code Review', 'QA', 'Done'].map((title, idx) =>
        prisma.list.create({
          data: { boardId: board.id, title, position: (idx + 1) * POSITION_STEP },
        }),
      ),
    );

    const cards = [
      // Sprint Backlog
      { list: 0, title: 'Migrate sessions to Redis', desc: 'Replace in-memory session store. Enables horizontal scaling.', labelIdxs: [1, 7], memberIds: [marco.id], due: days(6) },
      { list: 0, title: 'Add rate limiting middleware', desc: 'Protect /api/auth and /api/search with per-IP rate limits.', labelIdxs: [0, 7], memberIds: [marco.id], due: days(4) },
      { list: 0, title: 'Refactor useBoard hook — reduce re-renders', desc: 'Memoize selectors so only affected components re-render on card move.', labelIdxs: [2, 6], memberIds: [alex.id] },
      { list: 0, title: 'Add Vitest unit tests for position helpers', labelIdxs: [2, 6], memberIds: [taylor.id] },
      // In Progress
      {
        list: 1, title: 'WebSocket real-time sync', desc: 'Broadcast card.moved, card.created, comment.created to board room members via socket.io.',
        labelIdxs: [1, 5], memberIds: [marco.id, alex.id], due: days(3),
        coverColor: '#89609E',
        checklists: [{
          title: 'Implementation checklist',
          items: [
            { text: 'socket.io server setup', done: true },
            { text: 'Join/leave board room on navigation', done: true },
            { text: 'Broadcast card mutations', done: false },
            { text: 'Invalidate TanStack Query on event', done: false },
            { text: 'Handle reconnect gracefully', done: false },
          ],
        }],
        comments: [
          { authorId: marco.id, body: 'Server-side room management is done. Working on client now.' },
          { authorId: alex.id, body: 'Should we throttle broadcast events to avoid flooding?' },
        ],
      },
      {
        list: 1, title: 'Implement full-text search with pg_trgm', desc: 'Replace ILIKE with Postgres trigram index for faster, fuzzier search.',
        labelIdxs: [1, 7], memberIds: [marco.id], due: days(2),
        checklists: [{
          title: 'Steps',
          items: [
            { text: 'Enable pg_trgm extension', done: true },
            { text: 'Add GIN index on Card.title', done: false },
            { text: 'Update search route query', done: false },
          ],
        }],
      },
      { list: 1, title: 'Dark mode: CSS variable pass', desc: 'Introduce --color-surface, --color-text tokens; implement dark theme.', labelIdxs: [2, 6], memberIds: [alex.id], due: days(5) },
      // Code Review
      { list: 2, title: 'PR #84 — Fractional position rebalance', labelIdxs: [1], memberIds: [taylor.id, marco.id], comments: [{ authorId: taylor.id, body: 'Logic looks good. One nit: the recursion depth isn\'t bounded — add a guard.' }] },
      { list: 2, title: 'PR #86 — Archived items drawer', labelIdxs: [2, 5], memberIds: [alex.id] },
      // QA
      { list: 3, title: 'Test drag-and-drop across 3+ lists', labelIdxs: [4], memberIds: [alex.id], due: days(1), checklists: [{ title: 'Scenarios', items: [{ text: 'Move card from list 1 to list 3', done: true }, { text: 'Move card to top of list', done: true }, { text: 'Move card to bottom of list', done: false }, { text: 'Rapid successive moves persist', done: false }] }] },
      { list: 3, title: 'Verify Neon connection pooling under load', labelIdxs: [7], memberIds: [marco.id] },
      // Done
      { list: 4, title: 'Docker multi-stage build optimization', desc: 'Image size reduced from 1.2 GB to 380 MB using multi-stage + .dockerignore.', labelIdxs: [7], memberIds: [marco.id], dueComplete: true },
      { list: 4, title: 'Upgrade to Prisma 5', labelIdxs: [6], memberIds: [marco.id], dueComplete: true },
      { list: 4, title: 'Set up GitHub Actions CI', desc: 'typecheck + build on every PR. Postgres service container for migration tests.', labelIdxs: [7], memberIds: [taylor.id], dueComplete: true },
    ];

    let cardPos = 0;
    for (const cfg of cards) {
      cardPos++;
      const card = await prisma.card.create({
        data: {
          boardId: board.id,
          listId: lists[cfg.list].id,
          title: cfg.title,
          description: (cfg as any).desc ?? '',
          position: cardPos * POSITION_STEP,
          dueAt: (cfg as any).due ?? null,
          dueComplete: (cfg as any).dueComplete ?? (cfg.list === 4),
          coverType: (cfg as any).coverColor ? 'color' : null,
          coverValue: (cfg as any).coverColor ?? null,
          labels: { create: (cfg.labelIdxs ?? []).map((i) => ({ labelId: labels[i].id })) },
          members: { create: (cfg.memberIds ?? []).map((uid) => ({ userId: uid })) },
        },
      });
      if ((cfg as any).checklists) {
        for (let ci = 0; ci < (cfg as any).checklists.length; ci++) {
          const cl = (cfg as any).checklists[ci];
          const checklist = await prisma.checklist.create({ data: { cardId: card.id, title: cl.title, position: (ci + 1) * POSITION_STEP } });
          await Promise.all(cl.items.map((it: any, ii: number) => prisma.checklistItem.create({ data: { checklistId: checklist.id, text: it.text, done: it.done, position: (ii + 1) * POSITION_STEP } })));
        }
      }
      if ((cfg as any).comments) {
        for (const cm of (cfg as any).comments) {
          await prisma.comment.create({ data: { cardId: card.id, authorId: cm.authorId, body: cm.body } });
        }
      }
    }

    console.log('✅ Board 2 — Engineering Sprint seeded');
  }

  // ══════════════════════════════════════════════════════════════════════════
  // BOARD 3 — Marketing Campaign
  // ══════════════════════════════════════════════════════════════════════════
  {
    const board = await prisma.board.create({
      data: {
        title: 'Q2 Marketing Campaign',
        ownerId: taylor.id,
        backgroundType: 'color',
        backgroundValue: BOARD_BG_PRESETS[5], // pink/magenta
        members: {
          create: [
            { userId: taylor.id, role: 'owner' },
            { userId: priya.id, role: 'member' },
            { userId: alex.id, role: 'member' },
          ],
        },
      },
    });

    const labelDefs = [
      { color: LABEL_COLORS[3], name: 'Deadline' },
      { color: LABEL_COLORS[0], name: 'Content' },
      { color: LABEL_COLORS[4], name: 'Social' },
      { color: LABEL_COLORS[2], name: 'Paid Ads' },
      { color: LABEL_COLORS[5], name: 'Email' },
      { color: LABEL_COLORS[6], name: 'SEO' },
      { color: LABEL_COLORS[7], name: 'Analytics' },
      { color: LABEL_COLORS[8], name: 'Brand' },
    ];
    const labels = await Promise.all(labelDefs.map((l) => prisma.label.create({ data: { boardId: board.id, ...l } })));

    const lists = await Promise.all(
      ['Ideas', 'Planned', 'In Progress', 'Scheduled', 'Published'].map((title, idx) =>
        prisma.list.create({ data: { boardId: board.id, title, position: (idx + 1) * POSITION_STEP } }),
      ),
    );

    const cards = [
      { list: 0, title: 'TikTok short-form video series', desc: 'Explore 3-part "how it works" series targeting 18–24 segment.', labelIdxs: [2], memberIds: [priya.id] },
      { list: 0, title: 'Podcast sponsorship — Tech for Humans', labelIdxs: [3], memberIds: [alex.id] },
      { list: 0, title: 'Community referral contest', desc: 'Invite friends, win a year free. Co-ordinate with product team.', labelIdxs: [2, 7], memberIds: [priya.id] },
      { list: 1, title: 'Blog post: "10 ways to run a better sprint"', labelIdxs: [1, 5], memberIds: [taylor.id], due: days(7) },
      { list: 1, title: 'Google Ads — Q2 retargeting campaign', labelIdxs: [3, 0], memberIds: [alex.id], due: days(5) },
      { list: 1, title: 'Email drip series — trial users (5 emails)', desc: 'Day 0, 3, 7, 14, 21. Goal: convert to paid.', labelIdxs: [4, 0], memberIds: [priya.id, taylor.id], due: days(10),
        checklists: [{ title: 'Emails', items: [{ text: 'Email 1 — Welcome', done: true }, { text: 'Email 2 — First value moment', done: true }, { text: 'Email 3 — Feature spotlight', done: false }, { text: 'Email 4 — Social proof', done: false }, { text: 'Email 5 — Upgrade nudge', done: false }] }],
        comments: [{ authorId: priya.id, body: 'Subject lines for emails 1 & 2 are approved. Sending to legal for email 5.' }],
      },
      { list: 2, title: 'Design Q2 social media kit', desc: 'Templates for LinkedIn, Twitter/X, Instagram. 3 formats each.', labelIdxs: [2, 7], memberIds: [priya.id], due: days(3), coverColor: '#CD5A91' },
      { list: 2, title: 'Write case study — Acme Corp', desc: '500-word customer success story. Include ROI numbers from customer call.', labelIdxs: [1], memberIds: [taylor.id], due: days(4) },
      { list: 2, title: 'LinkedIn Thought Leadership — 4 posts', labelIdxs: [2, 1], memberIds: [alex.id], due: days(6) },
      { list: 3, title: 'Product Hunt launch post', due: days(2), labelIdxs: [0, 7], memberIds: [taylor.id, priya.id], comments: [{ authorId: alex.id, body: 'Hunters lined up: @desigirl, @makerontheroad, @hackernewsish.' }] },
      { list: 3, title: 'April newsletter', labelIdxs: [4], memberIds: [priya.id], due: days(1) },
      { list: 4, title: 'Q1 wrap-up blog post', labelIdxs: [1, 6], memberIds: [taylor.id], dueComplete: true },
      { list: 4, title: 'Press release — Series A announcement', labelIdxs: [7, 0], memberIds: [taylor.id], dueComplete: true, comments: [{ authorId: taylor.id, body: 'TechCrunch coverage went live at 9 am EST. 2.3k shares in 24 hours.' }] },
    ];

    let cardPos = 0;
    for (const cfg of cards) {
      cardPos++;
      const card = await prisma.card.create({
        data: {
          boardId: board.id,
          listId: lists[cfg.list].id,
          title: cfg.title,
          description: (cfg as any).desc ?? '',
          position: cardPos * POSITION_STEP,
          dueAt: (cfg as any).due ?? null,
          dueComplete: (cfg as any).dueComplete ?? (cfg.list === 4),
          coverType: (cfg as any).coverColor ? 'color' : null,
          coverValue: (cfg as any).coverColor ?? null,
          labels: { create: (cfg.labelIdxs ?? []).map((i) => ({ labelId: labels[i].id })) },
          members: { create: (cfg.memberIds ?? []).map((uid) => ({ userId: uid })) },
        },
      });
      if ((cfg as any).checklists) {
        for (let ci = 0; ci < (cfg as any).checklists.length; ci++) {
          const cl = (cfg as any).checklists[ci];
          const checklist = await prisma.checklist.create({ data: { cardId: card.id, title: cl.title, position: (ci + 1) * POSITION_STEP } });
          await Promise.all(cl.items.map((it: any, ii: number) => prisma.checklistItem.create({ data: { checklistId: checklist.id, text: it.text, done: it.done, position: (ii + 1) * POSITION_STEP } })));
        }
      }
      if ((cfg as any).comments) {
        for (const cm of (cfg as any).comments) {
          await prisma.comment.create({ data: { cardId: card.id, authorId: cm.authorId, body: cm.body } });
        }
      }
    }

    console.log('✅ Board 3 — Q2 Marketing Campaign seeded');
  }

  // ══════════════════════════════════════════════════════════════════════════
  // BOARD 4 — Design System
  // ══════════════════════════════════════════════════════════════════════════
  {
    const board = await prisma.board.create({
      data: {
        title: 'Design System',
        ownerId: taylor.id,
        backgroundType: 'color',
        backgroundValue: BOARD_BG_PRESETS[1], // gold
        members: {
          create: [
            { userId: taylor.id, role: 'owner' },
            { userId: priya.id, role: 'member' },
            { userId: alex.id, role: 'member' },
          ],
        },
      },
    });

    const labelDefs = [
      { color: LABEL_COLORS[0], name: 'Component' },
      { color: LABEL_COLORS[3], name: 'Breaking Change' },
      { color: LABEL_COLORS[6], name: 'Token' },
      { color: LABEL_COLORS[4], name: 'Pattern' },
      { color: LABEL_COLORS[5], name: 'Documentation' },
      { color: LABEL_COLORS[2], name: 'Accessibility' },
    ];
    const labels = await Promise.all(labelDefs.map((l) => prisma.label.create({ data: { boardId: board.id, ...l } })));

    const lists = await Promise.all(
      ['Proposed', 'In Design', 'In Development', 'In Review', 'Shipped'].map((title, idx) =>
        prisma.list.create({ data: { boardId: board.id, title, position: (idx + 1) * POSITION_STEP } }),
      ),
    );

    const cards = [
      { list: 0, title: 'Data table component', desc: 'Sortable, filterable, paginated. Support row selection.', labelIdxs: [0], memberIds: [priya.id] },
      { list: 0, title: 'Skeleton loader pattern', labelIdxs: [3, 4], memberIds: [alex.id] },
      { list: 0, title: 'Toast / notification system', desc: 'Replace current alert() calls with a global toast queue.', labelIdxs: [0, 3], memberIds: [priya.id] },
      { list: 1, title: 'Color token audit', desc: 'Map every hardcoded hex in codebase to a design token.', labelIdxs: [2, 1], memberIds: [priya.id], due: days(8), coverColor: '#D29034',
        checklists: [{ title: 'Token categories', items: [{ text: 'Brand colors', done: true }, { text: 'Semantic colors (success, error, warning)', done: true }, { text: 'Surface & background tokens', done: false }, { text: 'Text & icon tokens', done: false }, { text: 'Border tokens', done: false }] }],
      },
      { list: 1, title: 'Typography scale', desc: 'Define type ramp: 10 steps, line heights, letter spacing.', labelIdxs: [2, 4], memberIds: [priya.id, alex.id], due: days(5) },
      { list: 2, title: 'Button variants (primary, ghost, danger)', desc: 'Size sm/md/lg. Hover, focus, disabled states. forwardRef support.', labelIdxs: [0, 5], memberIds: [alex.id], due: days(2) },
      { list: 2, title: 'Badge / label chip', labelIdxs: [0], memberIds: [alex.id] },
      { list: 2, title: 'Modal / dialog primitive', desc: 'Built on Radix Dialog. Focus trap, scroll lock, animation.', labelIdxs: [0, 5], memberIds: [alex.id], due: days(4),
        comments: [{ authorId: priya.id, body: 'Remember to support nested modals — design approved that pattern.' }],
      },
      { list: 3, title: 'Icon system — Material Symbols migration', labelIdxs: [0, 4], memberIds: [priya.id, taylor.id],
        comments: [{ authorId: taylor.id, body: 'Replace all svg icons with Material Symbols Outlined. 200+ instances.' }, { authorId: alex.id, body: 'I\'ll write a codemod for the straightforward ones.' }],
      },
      { list: 4, title: 'Spacing scale (4 px base grid)', labelIdxs: [2], memberIds: [priya.id], dueComplete: true },
      { list: 4, title: 'Avatar component', labelIdxs: [0, 5], memberIds: [alex.id], dueComplete: true },
      { list: 4, title: 'LabelChip component', labelIdxs: [0], memberIds: [alex.id], dueComplete: true },
    ];

    let cardPos = 0;
    for (const cfg of cards) {
      cardPos++;
      const card = await prisma.card.create({
        data: {
          boardId: board.id,
          listId: lists[cfg.list].id,
          title: cfg.title,
          description: (cfg as any).desc ?? '',
          position: cardPos * POSITION_STEP,
          dueAt: (cfg as any).due ?? null,
          dueComplete: (cfg as any).dueComplete ?? (cfg.list === 4),
          coverType: (cfg as any).coverColor ? 'color' : null,
          coverValue: (cfg as any).coverColor ?? null,
          labels: { create: (cfg.labelIdxs ?? []).map((i) => ({ labelId: labels[i].id })) },
          members: { create: (cfg.memberIds ?? []).map((uid) => ({ userId: uid })) },
        },
      });
      if ((cfg as any).checklists) {
        for (let ci = 0; ci < (cfg as any).checklists.length; ci++) {
          const cl = (cfg as any).checklists[ci];
          const checklist = await prisma.checklist.create({ data: { cardId: card.id, title: cl.title, position: (ci + 1) * POSITION_STEP } });
          await Promise.all(cl.items.map((it: any, ii: number) => prisma.checklistItem.create({ data: { checklistId: checklist.id, text: it.text, done: it.done, position: (ii + 1) * POSITION_STEP } })));
        }
      }
      if ((cfg as any).comments) {
        for (const cm of (cfg as any).comments) {
          await prisma.comment.create({ data: { cardId: card.id, authorId: cm.authorId, body: cm.body } });
        }
      }
    }

    console.log('✅ Board 4 — Design System seeded');
  }

  // ══════════════════════════════════════════════════════════════════════════
  // BOARD 5 — Company OKRs
  // ══════════════════════════════════════════════════════════════════════════
  {
    const board = await prisma.board.create({
      data: {
        title: 'Company OKRs — Q2',
        ownerId: taylor.id,
        backgroundType: 'color',
        backgroundValue: BOARD_BG_PRESETS[2], // green
        members: {
          create: users.map((u, i) => ({ userId: u.id, role: i === 0 ? 'owner' : 'member' })),
        },
      },
    });

    const labelDefs = [
      { color: LABEL_COLORS[0], name: 'Growth' },
      { color: LABEL_COLORS[5], name: 'Product' },
      { color: LABEL_COLORS[4], name: 'Engineering' },
      { color: LABEL_COLORS[8], name: 'People' },
      { color: LABEL_COLORS[3], name: 'At Risk' },
      { color: LABEL_COLORS[1], name: 'On Track' },
    ];
    const labels = await Promise.all(labelDefs.map((l) => prisma.label.create({ data: { boardId: board.id, ...l } })));

    const lists = await Promise.all(
      ['Objectives', 'Key Results', 'Initiatives', 'Blocked', 'Achieved'].map((title, idx) =>
        prisma.list.create({ data: { boardId: board.id, title, position: (idx + 1) * POSITION_STEP } }),
      ),
    );

    const cards = [
      { list: 0, title: 'O1: Grow MAU to 50k', desc: 'Current baseline: 22k MAU. Target 50k by end of Q2.', labelIdxs: [0], memberIds: [taylor.id], coverColor: '#519839' },
      { list: 0, title: 'O2: Ship a 10/10 onboarding', desc: 'Activation rate (hit aha-moment in session 1) from 31% to 60%.', labelIdxs: [1], memberIds: [taylor.id, alex.id] },
      { list: 0, title: 'O3: Zero Sev-1 incidents in prod', desc: 'Establish on-call, runbooks, and < 15 min MTTR.', labelIdxs: [2], memberIds: [marco.id] },
      { list: 1, title: 'KR: Referral signups = 30% of new users', labelIdxs: [0, 5], memberIds: [priya.id], due: days(45) },
      { list: 1, title: 'KR: Activation rate ≥ 60%', labelIdxs: [1, 5], memberIds: [alex.id], due: days(45) },
      { list: 1, title: 'KR: P99 API latency < 300 ms', labelIdxs: [2, 5], memberIds: [marco.id], due: days(45) },
      { list: 1, title: 'KR: NPS ≥ 45', labelIdxs: [0, 5], memberIds: [priya.id], due: days(45) },
      { list: 2, title: 'Launch referral program', labelIdxs: [0], memberIds: [priya.id, alex.id], due: days(14) },
      { list: 2, title: 'Redesign onboarding wizard', labelIdxs: [1], memberIds: [alex.id, taylor.id], due: days(10) },
      { list: 2, title: 'Implement APM with Datadog', labelIdxs: [2], memberIds: [marco.id], due: days(7),
        checklists: [{ title: 'APM setup', items: [{ text: 'Install dd-trace', done: true }, { text: 'Add custom spans for DB queries', done: false }, { text: 'Create latency dashboard', done: false }, { text: 'Set up P99 alert', done: false }] }],
      },
      { list: 3, title: 'GDPR compliance review — waiting on legal', desc: 'Legal team needs 3 weeks. Blocking data residency initiative.', labelIdxs: [4, 3], memberIds: [taylor.id],
        comments: [{ authorId: taylor.id, body: 'Escalated to CPO. Legal review expected by April 28.' }],
      },
      { list: 4, title: 'Hire 2 senior engineers', labelIdxs: [3], memberIds: [taylor.id], dueComplete: true },
      { list: 4, title: 'SOC 2 Type I certification', labelIdxs: [2], memberIds: [marco.id], dueComplete: true },
    ];

    let cardPos = 0;
    for (const cfg of cards) {
      cardPos++;
      const card = await prisma.card.create({
        data: {
          boardId: board.id,
          listId: lists[cfg.list].id,
          title: cfg.title,
          description: (cfg as any).desc ?? '',
          position: cardPos * POSITION_STEP,
          dueAt: (cfg as any).due ?? null,
          dueComplete: (cfg as any).dueComplete ?? (cfg.list === 4),
          coverType: (cfg as any).coverColor ? 'color' : null,
          coverValue: (cfg as any).coverColor ?? null,
          labels: { create: (cfg.labelIdxs ?? []).map((i) => ({ labelId: labels[i].id })) },
          members: { create: (cfg.memberIds ?? []).map((uid) => ({ userId: uid })) },
        },
      });
      if ((cfg as any).checklists) {
        for (let ci = 0; ci < (cfg as any).checklists.length; ci++) {
          const cl = (cfg as any).checklists[ci];
          const checklist = await prisma.checklist.create({ data: { cardId: card.id, title: cl.title, position: (ci + 1) * POSITION_STEP } });
          await Promise.all(cl.items.map((it: any, ii: number) => prisma.checklistItem.create({ data: { checklistId: checklist.id, text: it.text, done: it.done, position: (ii + 1) * POSITION_STEP } })));
        }
      }
      if ((cfg as any).comments) {
        for (const cm of (cfg as any).comments) {
          await prisma.comment.create({ data: { cardId: card.id, authorId: cm.authorId, body: cm.body } });
        }
      }
    }

    console.log('✅ Board 5 — Company OKRs seeded');
  }

  console.log('\n🎉 All boards seeded successfully!');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
