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
        backgroundType: 'image',
        backgroundValue:
          'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1600&q=80&auto=format&fit=crop',
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
        backgroundType: 'image',
        backgroundValue:
          'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1600&q=80&auto=format&fit=crop',
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
        backgroundType: 'image',
        backgroundValue:
          'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1600&q=80&auto=format&fit=crop',
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

  // ══════════════════════════════════════════════════════════════════════════
  // TEMPLATES — reusable board blueprints
  // ══════════════════════════════════════════════════════════════════════════
  await prisma.template.deleteMany({});

  type TemplateCardDef = {
    list: number;
    title: string;
    desc?: string;
    labelIdxs?: number[];
    coverColor?: string;
    checklists?: { title: string; items: { text: string; done: boolean }[] }[];
  };

  async function seedTemplate(config: {
    title: string;
    description: string;
    category: 'business' | 'design' | 'education' | 'marketing' | 'engineering' | 'sales';
    coverImageUrl?: string;
    coverGradient?: string;
    isFeatured?: boolean;
    isMostPopular?: boolean;
    boardBackgroundType?: string;
    boardBackgroundValue?: string;
    labels: { name: string; color: string }[];
    lists: string[];
    cards: TemplateCardDef[];
  }) {
    const template = await prisma.template.create({
      data: {
        title: config.title,
        description: config.description,
        category: config.category,
        coverImageUrl: config.coverImageUrl ?? null,
        coverGradient: config.coverGradient ?? null,
        isFeatured: config.isFeatured ?? false,
        isMostPopular: config.isMostPopular ?? false,
        boardBackgroundType: config.boardBackgroundType ?? 'color',
        boardBackgroundValue: config.boardBackgroundValue ?? '#0079BF',
      },
    });

    const labels = await Promise.all(
      config.labels.map((l) =>
        prisma.templateLabel.create({
          data: { templateId: template.id, name: l.name, color: l.color },
        }),
      ),
    );

    const lists = await Promise.all(
      config.lists.map((title, idx) =>
        prisma.templateList.create({
          data: {
            templateId: template.id,
            title,
            position: (idx + 1) * POSITION_STEP,
          },
        }),
      ),
    );

    let cardPos = 0;
    for (const cfg of config.cards) {
      cardPos++;
      const card = await prisma.templateCard.create({
        data: {
          listId: lists[cfg.list].id,
          title: cfg.title,
          description: cfg.desc ?? '',
          position: cardPos * POSITION_STEP,
          coverType: cfg.coverColor ? 'color' : null,
          coverValue: cfg.coverColor ?? null,
          labels: cfg.labelIdxs
            ? { create: cfg.labelIdxs.map((i) => ({ labelId: labels[i].id })) }
            : undefined,
        },
      });

      if (cfg.checklists) {
        for (let ci = 0; ci < cfg.checklists.length; ci++) {
          const cl = cfg.checklists[ci];
          const checklist = await prisma.templateChecklist.create({
            data: {
              cardId: card.id,
              title: cl.title,
              position: (ci + 1) * POSITION_STEP,
            },
          });
          await Promise.all(
            cl.items.map((it, ii) =>
              prisma.templateChecklistItem.create({
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
    }

    console.log(`✅ Template — ${config.title} seeded`);
  }

  // ── Template 1: Agile Project Management (Engineering · Featured · Most Popular)
  await seedTemplate({
    title: 'Agile Project Management',
    description:
      'Streamline your software development lifecycle with pre-built sprints, backlogs, and bug tracking systems.',
    category: 'engineering',
    coverImageUrl:
      'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1200&q=80&auto=format&fit=crop',
    isFeatured: true,
    isMostPopular: true,
    boardBackgroundType: 'image',
    boardBackgroundValue:
      'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1600&q=80&auto=format&fit=crop',
    labels: [
      { name: 'High Priority', color: LABEL_COLORS[3] },  // red
      { name: 'Medium', color: LABEL_COLORS[2] },          // orange
      { name: 'Low', color: LABEL_COLORS[0] },             // green
      { name: 'Bug', color: LABEL_COLORS[1] },             // yellow
      { name: 'Feature', color: LABEL_COLORS[5] },         // blue
      { name: 'Tech Debt', color: LABEL_COLORS[9] },       // black
    ],
    lists: ['Backlog', 'Sprint', 'In Progress', 'Done'],
    cards: [
      {
        list: 0,
        title: 'Define project scope & architecture pillars',
        desc: 'Align on MVP boundaries, tech stack, and non-functional requirements before sprint zero.',
        labelIdxs: [0, 4],
      },
      {
        list: 0,
        title: 'Set up CI/CD pipeline',
        desc: 'Automate build, test, and deploy with GitHub Actions. Target sub-5-min feedback loops.',
        labelIdxs: [1, 4],
      },
      {
        list: 0,
        title: 'Draft API contract v1',
        desc: 'REST endpoints for the core entities with example requests and responses.',
        labelIdxs: [2, 4],
      },
      {
        list: 1,
        title: 'Design system tokenization',
        desc: 'Extract colors, spacing, and typography to a shared token file consumable by both web and mobile.',
        labelIdxs: [1, 4],
        coverColor: '#0079BF',
        checklists: [
          {
            title: 'Token categories',
            items: [
              { text: 'Colors', done: true },
              { text: 'Typography', done: true },
              { text: 'Spacing', done: false },
              { text: 'Motion & easing', done: false },
            ],
          },
        ],
      },
      {
        list: 1,
        title: 'Conduct user interviews for v2',
        desc: 'Recruit 5 power users. Run 30-min discovery sessions. Synthesize insights into Notion.',
        labelIdxs: [1, 2],
      },
      {
        list: 2,
        title: 'API integration for real-time sync',
        desc: 'Implement WebSocket channel so board mutations broadcast to all connected members.',
        labelIdxs: [0, 4],
        checklists: [
          {
            title: 'Implementation',
            items: [
              { text: 'Socket server bootstrap', done: false },
              { text: 'Room join / leave handlers', done: false },
              { text: 'Client subscription hook', done: false },
            ],
          },
        ],
      },
      {
        list: 2,
        title: 'Fix race condition on drag-and-drop',
        desc: 'Rapid successive drags occasionally produce inverted positions. Add client-side dedupe.',
        labelIdxs: [0, 3],
      },
      {
        list: 3,
        title: 'Kick-off meeting with stakeholders',
        desc: 'Shared the sprint plan, risk register, and success criteria. Meeting notes archived.',
        labelIdxs: [2, 4],
      },
    ],
  });

  // ── Template 2: Design Sprint (Design · Featured)
  await seedTemplate({
    title: 'Design Sprint',
    description: 'A 5-day process for solving problems and testing new ideas.',
    category: 'design',
    coverImageUrl:
      'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=1200&q=80&auto=format&fit=crop',
    isFeatured: true,
    isMostPopular: false,
    boardBackgroundType: 'image',
    boardBackgroundValue:
      'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=1600&q=80&auto=format&fit=crop',
    labels: [
      { name: 'Research', color: LABEL_COLORS[6] },  // sky
      { name: 'UX', color: LABEL_COLORS[4] },         // purple
      { name: 'UI', color: LABEL_COLORS[8] },         // pink
      { name: 'Dev', color: LABEL_COLORS[5] },        // blue
      { name: 'Blocked', color: LABEL_COLORS[3] },    // red
      { name: 'Approved', color: LABEL_COLORS[0] },   // green
    ],
    lists: ['Understand', 'Sketch', 'Decide', 'Prototype', 'Test'],
    cards: [
      {
        list: 0,
        title: 'Map the problem space',
        desc: 'Collect pain points from support tickets, NPS comments, and sales call notes.',
        labelIdxs: [0, 1],
      },
      {
        list: 0,
        title: 'Expert interviews — 5× subject matter experts',
        desc: '30-min sessions across engineering, support, and design. Record and transcribe.',
        labelIdxs: [0],
      },
      {
        list: 1,
        title: 'Lightning demos of competitor solutions',
        desc: 'Each team member brings 2 references. 3-min demos, 2-min discussion.',
        labelIdxs: [1, 2],
      },
      {
        list: 1,
        title: 'Crazy 8s sketching session',
        desc: 'Individual ideation: 8 ideas in 8 minutes. Share and dot-vote the strongest.',
        labelIdxs: [1],
      },
      {
        list: 2,
        title: 'Storyboard the winning concept',
        desc: '10-panel storyboard covering the full user journey. Agree on scope for prototype.',
        labelIdxs: [1, 2],
        coverColor: '#89609E',
      },
      {
        list: 3,
        title: 'Build clickable prototype in Figma',
        desc: 'Hi-fi prototype of the storyboard. Focus on flows, not pixel polish.',
        labelIdxs: [2, 3],
        checklists: [
          {
            title: 'Prototype scope',
            items: [
              { text: 'Entry screen', done: false },
              { text: 'Happy path flow', done: false },
              { text: 'Error state', done: false },
              { text: 'Success confirmation', done: false },
            ],
          },
        ],
      },
      {
        list: 4,
        title: 'Recruit 5 test participants',
        desc: 'Target the same persona: first-time users. Screener in Google Forms.',
        labelIdxs: [0],
      },
      {
        list: 4,
        title: 'Run usability sessions & synthesize',
        desc: '60 min each. Note findings on stickies; pattern-match into themes on Day 5.',
        labelIdxs: [0, 5],
      },
    ],
  });

  // ── Template 3: Daily Task Tracker (Education · Grid only · Gradient cover)
  await seedTemplate({
    title: 'Daily Task Tracker',
    description:
      'Stay organized every day with a simple yet effective system for managing your to-do lists and priorities.',
    category: 'education',
    coverGradient:
      'linear-gradient(135deg, #fcd34d 0%, #fb923c 50%, #ec4899 100%)',
    isFeatured: false,
    isMostPopular: false,
    boardBackgroundType: 'gradient',
    boardBackgroundValue:
      'linear-gradient(135deg, #fcd34d 0%, #fb923c 50%, #ec4899 100%)',
    labels: [
      { name: 'Urgent', color: LABEL_COLORS[3] },      // red
      { name: 'Important', color: LABEL_COLORS[2] },   // orange
      { name: 'Personal', color: LABEL_COLORS[4] },    // purple
      { name: 'Work', color: LABEL_COLORS[5] },        // blue
      { name: 'Learning', color: LABEL_COLORS[6] },    // sky
      { name: 'Health', color: LABEL_COLORS[0] },      // green
    ],
    lists: ['To Do', 'Doing', 'Done'],
    cards: [
      {
        list: 0,
        title: 'Morning routine — meditation & journaling',
        desc: '10 minutes of silence, 5 minutes writing three priorities for the day.',
        labelIdxs: [2, 5],
      },
      {
        list: 0,
        title: 'Weekly review — reflect & plan',
        desc: 'Review what shipped, what got dropped, what to carry over. 30-minute slot every Friday.',
        labelIdxs: [1, 3],
        checklists: [
          {
            title: 'Review prompts',
            items: [
              { text: 'What went well?', done: false },
              { text: 'What got stuck?', done: false },
              { text: 'What will I do differently next week?', done: false },
            ],
          },
        ],
      },
      {
        list: 0,
        title: 'Read 20 pages of current book',
        labelIdxs: [4],
      },
      {
        list: 1,
        title: 'Finish chapter outline for side project',
        desc: 'Top-level structure for each of the 8 chapters.',
        labelIdxs: [1, 3],
      },
      {
        list: 1,
        title: 'Prep groceries & meals for the week',
        labelIdxs: [2, 5],
      },
      {
        list: 2,
        title: 'Complete online course module 4',
        labelIdxs: [4],
      },
      {
        list: 2,
        title: 'Submit quarterly report',
        labelIdxs: [0, 3],
      },
    ],
  });

  // ── Template 4: Sales Pipeline (Sales · Featured)
  await seedTemplate({
    title: 'Sales Pipeline',
    description:
      'Track deals from first contact to closed-won with a five-stage pipeline and clear ownership at every step.',
    category: 'sales',
    coverImageUrl:
      'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&q=80&auto=format&fit=crop',
    isFeatured: true,
    isMostPopular: false,
    boardBackgroundType: 'image',
    boardBackgroundValue:
      'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1600&q=80&auto=format&fit=crop',
    labels: [
      { name: 'Enterprise', color: LABEL_COLORS[3] }, // red
      { name: 'Mid-market', color: LABEL_COLORS[2] }, // orange
      { name: 'SMB', color: LABEL_COLORS[0] },        // green
      { name: 'Inbound', color: LABEL_COLORS[5] },    // blue
      { name: 'Outbound', color: LABEL_COLORS[4] },   // purple
      { name: 'At risk', color: LABEL_COLORS[1] },    // yellow
    ],
    lists: ['Leads', 'Contacted', 'Qualified', 'Proposal', 'Closed'],
    cards: [
      {
        list: 0,
        title: 'Acme Corp — enterprise expansion',
        desc: '500-seat upsell opportunity. Champion: VP of Operations. Budget signal confirmed.',
        labelIdxs: [0, 3],
      },
      {
        list: 0,
        title: 'Northwind Traders — new logo',
        desc: 'Outbound prospect from recent trade show. Targeting Q3 start.',
        labelIdxs: [1, 4],
      },
      {
        list: 1,
        title: 'Globex — discovery call scheduled',
        desc: 'Intro call on Thursday. Agenda: current tooling, pain points, timeline.',
        labelIdxs: [0, 4],
        checklists: [
          {
            title: 'Pre-call prep',
            items: [
              { text: 'Review LinkedIn of attendees', done: true },
              { text: 'Draft discovery questions', done: false },
              { text: 'Send agenda + Zoom link', done: false },
            ],
          },
        ],
      },
      {
        list: 1,
        title: 'Initech — waiting on decision maker',
        desc: 'Primary contact moved internally; identifying new champion.',
        labelIdxs: [1, 5],
      },
      {
        list: 2,
        title: 'Soylent — technical evaluation',
        desc: 'POC requirements confirmed. Security review in progress.',
        labelIdxs: [0, 3],
        coverColor: '#519839',
      },
      {
        list: 3,
        title: 'Umbrella — proposal sent',
        desc: 'Custom pricing tier with annual commit. Follow up in 3 business days.',
        labelIdxs: [0, 3],
        checklists: [
          {
            title: 'Close plan',
            items: [
              { text: 'Legal review of MSA', done: false },
              { text: 'Procurement intro', done: false },
              { text: 'Kickoff date proposed', done: false },
            ],
          },
        ],
      },
      {
        list: 4,
        title: 'Stark Industries — closed-won',
        desc: 'Signed 3-year deal. Handoff to CS team complete.',
        labelIdxs: [0, 3],
      },
    ],
  });

  // ── Template 5: Marketing Campaign Planner (Marketing · Featured)
  await seedTemplate({
    title: 'Marketing Campaign Planner',
    description:
      'Plan and ship integrated campaigns — from creative brief through launch day and post-mortem.',
    category: 'marketing',
    coverImageUrl:
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&q=80&auto=format&fit=crop',
    isFeatured: true,
    isMostPopular: false,
    boardBackgroundType: 'image',
    boardBackgroundValue:
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1600&q=80&auto=format&fit=crop',
    labels: [
      { name: 'Social', color: LABEL_COLORS[8] },  // pink
      { name: 'Email', color: LABEL_COLORS[5] },   // blue
      { name: 'Paid', color: LABEL_COLORS[3] },    // red
      { name: 'Content', color: LABEL_COLORS[4] }, // purple
      { name: 'Event', color: LABEL_COLORS[2] },   // orange
      { name: 'Organic', color: LABEL_COLORS[0] }, // green
    ],
    lists: ['Ideas', 'Planning', 'In Production', 'Review', 'Published'],
    cards: [
      {
        list: 0,
        title: 'Q4 product launch umbrella campaign',
        desc: 'Cross-channel launch for the new analytics module. Define messaging pillars.',
        labelIdxs: [0, 1, 2, 3],
      },
      {
        list: 0,
        title: 'Customer story series — 3 flagship accounts',
        desc: 'Video + written case studies. Coordinate with CS on approvals.',
        labelIdxs: [3, 5],
      },
      {
        list: 1,
        title: 'Webinar — "Scaling with ops automation"',
        desc: 'Joint session with partner. Draft promo plan, registration flow, and follow-up sequence.',
        labelIdxs: [1, 4],
        checklists: [
          {
            title: 'Launch checklist',
            items: [
              { text: 'Confirm speakers + slides', done: false },
              { text: 'Landing page live', done: false },
              { text: 'Promo emails scheduled', done: false },
              { text: 'Day-of run-of-show', done: false },
            ],
          },
        ],
      },
      {
        list: 2,
        title: 'Blog post — launch announcement',
        desc: '800 words, 3 screenshots, keyword targets locked.',
        labelIdxs: [3, 5],
      },
      {
        list: 2,
        title: 'Paid ad creative — LinkedIn & Google',
        desc: '4 ad variants per channel. Brief in Figma, copy in Doc.',
        labelIdxs: [2],
        coverColor: '#CD5A91',
      },
      {
        list: 3,
        title: 'Lifecycle email — onboarding refresh',
        desc: '5-step drip optimized for activation. Awaiting brand review.',
        labelIdxs: [1],
      },
      {
        list: 4,
        title: 'October newsletter',
        desc: 'Sent to 42k subscribers. Open rate 38%, CTR 6.2%.',
        labelIdxs: [1, 5],
      },
    ],
  });

  // ── Template 6: Business Plan (Business · Gradient cover)
  await seedTemplate({
    title: 'Business Plan',
    description:
      'A lightweight operating plan for small teams — cover vision, market, operations, and finance on one board.',
    category: 'business',
    coverGradient:
      'linear-gradient(135deg, #334155 0%, #475569 50%, #64748b 100%)',
    isFeatured: false,
    isMostPopular: false,
    boardBackgroundType: 'gradient',
    boardBackgroundValue:
      'linear-gradient(135deg, #334155 0%, #475569 50%, #64748b 100%)',
    labels: [
      { name: 'Q1', color: LABEL_COLORS[0] },         // green
      { name: 'Q2', color: LABEL_COLORS[5] },         // blue
      { name: 'Q3', color: LABEL_COLORS[2] },         // orange
      { name: 'Q4', color: LABEL_COLORS[4] },         // purple
      { name: 'Key result', color: LABEL_COLORS[3] }, // red
      { name: 'Risk', color: LABEL_COLORS[1] },       // yellow
    ],
    lists: ['Vision', 'Market', 'Operations', 'Finance'],
    cards: [
      {
        list: 0,
        title: 'Mission & 3-year outlook',
        desc: 'One-paragraph mission. Three-bullet outlook for where the company is in 36 months.',
        labelIdxs: [0],
      },
      {
        list: 0,
        title: 'Core values (5)',
        desc: 'Short list of operating principles everyone on the team can recite.',
      },
      {
        list: 1,
        title: 'Target segment & ICP',
        desc: 'Describe the ideal customer: company size, industry, champion role, top 3 pains.',
        labelIdxs: [0, 4],
        checklists: [
          {
            title: 'ICP fields',
            items: [
              { text: 'Segment', done: false },
              { text: 'Top 3 pain points', done: false },
              { text: 'Buying committee', done: false },
              { text: 'Disqualifiers', done: false },
            ],
          },
        ],
      },
      {
        list: 1,
        title: 'Competitive landscape',
        desc: '2×2 matrix of the 5 most-named alternatives plus our positioning cell.',
        labelIdxs: [1, 5],
      },
      {
        list: 2,
        title: 'Hiring plan — next 4 quarters',
        desc: 'Roles by quarter with ownership and cost estimate.',
        labelIdxs: [0, 1, 2, 3],
      },
      {
        list: 2,
        title: 'Top 3 operational risks',
        desc: 'Single-supplier dependencies, key-person risk, regulatory exposure.',
        labelIdxs: [5],
      },
      {
        list: 3,
        title: 'Revenue target & funnel math',
        desc: 'Bottom-up: pipeline needed to hit annual revenue plan at current conversion rates.',
        labelIdxs: [0, 4],
      },
      {
        list: 3,
        title: 'Cash runway model',
        desc: 'Monthly burn + cash on hand → implied runway under base/bull/bear scenarios.',
        labelIdxs: [4, 5],
      },
    ],
  });

  console.log('\n🎉 All boards and templates seeded successfully!');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
