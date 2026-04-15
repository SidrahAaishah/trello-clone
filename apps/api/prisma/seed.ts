import { PrismaClient } from '@prisma/client';
import {
  LABEL_COLORS,
  BOARD_BG_PRESETS,
  POSITION_STEP,
} from '@trello-clone/shared';

const prisma = new PrismaClient();

async function main() {
  // Default user (no auth per assignment spec).
  const user = await prisma.user.upsert({
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

  // A second teammate so member assignment has something to demo.
  const teammate = await prisma.user.upsert({
    where: { id: 'user_alex' },
    update: {},
    create: {
      id: 'user_alex',
      displayName: 'Alex Kim',
      initials: 'AK',
      color: '#EB5A46',
    },
  });

  // Existing data wipe (idempotent seed).
  await prisma.board.deleteMany({ where: { ownerId: user.id } });

  const board = await prisma.board.create({
    data: {
      title: 'Product Launch',
      ownerId: user.id,
      backgroundType: 'color',
      backgroundValue: BOARD_BG_PRESETS[0],
      members: {
        create: [
          { userId: user.id, role: 'owner' },
          { userId: teammate.id, role: 'member' },
        ],
      },
    },
  });

  const labels = await Promise.all(
    LABEL_COLORS.slice(0, 5).map((color, idx) =>
      prisma.label.create({
        data: {
          boardId: board.id,
          color,
          name: ['Urgent', 'Bug', 'Feature', 'Design', 'Docs'][idx] ?? '',
        },
      }),
    ),
  );

  const listTitles = ['To Do', 'In Progress', 'Review', 'Done'];
  const lists = await Promise.all(
    listTitles.map((title, idx) =>
      prisma.list.create({
        data: {
          boardId: board.id,
          title,
          position: (idx + 1) * POSITION_STEP,
        },
      }),
    ),
  );

  const sampleCards: Array<{
    list: number;
    title: string;
    desc?: string;
    labels?: number[];
    members?: string[];
    due?: Date | null;
    cover?: { type: 'color'; value: string } | null;
  }> = [
    {
      list: 0,
      title: 'Finalize landing page copy',
      desc: 'Align headline with brand voice and confirm CTAs.',
      labels: [2, 3],
      members: [user.id],
      due: new Date(Date.now() + 4 * 86400000),
    },
    {
      list: 0,
      title: 'Prepare launch email',
      labels: [4],
      members: [user.id, teammate.id],
    },
    {
      list: 1,
      title: 'Ship onboarding flow v2',
      desc: 'Replace modal with inline coach-marks.',
      labels: [0, 2],
      members: [teammate.id],
      due: new Date(Date.now() - 86400000),
      cover: { type: 'color', value: '#61BD4F' },
    },
    {
      list: 1,
      title: 'Fix board drag-drop flicker',
      labels: [1],
      members: [user.id],
    },
    {
      list: 2,
      title: 'Review new checkout design',
      labels: [3],
      members: [teammate.id],
    },
    {
      list: 3,
      title: 'Publish v1.4 changelog',
      labels: [4],
      members: [user.id],
      due: new Date(Date.now() - 3 * 86400000),
    },
  ];

  for (let i = 0; i < sampleCards.length; i++) {
    const cfg = sampleCards[i];
    const card = await prisma.card.create({
      data: {
        boardId: board.id,
        listId: lists[cfg.list].id,
        title: cfg.title,
        description: cfg.desc ?? '',
        position: (i + 1) * POSITION_STEP,
        dueAt: cfg.due ?? null,
        dueComplete: cfg.list === 3,
        coverType: cfg.cover?.type ?? null,
        coverValue: cfg.cover?.value ?? null,
        labels: cfg.labels
          ? { create: cfg.labels.map((idx) => ({ labelId: labels[idx].id })) }
          : undefined,
        members: cfg.members
          ? { create: cfg.members.map((uid) => ({ userId: uid })) }
          : undefined,
      },
    });

    if (cfg.list === 1 && i === 2) {
      const cl = await prisma.checklist.create({
        data: {
          cardId: card.id,
          title: 'Launch checklist',
          position: POSITION_STEP,
        },
      });
      const items = [
        { text: 'Write release notes', done: true },
        { text: 'Schedule social posts', done: true },
        { text: 'Notify support team', done: false },
        { text: 'Flip feature flag', done: false },
      ];
      await Promise.all(
        items.map((it, idx) =>
          prisma.checklistItem.create({
            data: {
              checklistId: cl.id,
              text: it.text,
              done: it.done,
              position: (idx + 1) * POSITION_STEP,
            },
          }),
        ),
      );
    }

    if (i === 0) {
      await prisma.comment.create({
        data: {
          cardId: card.id,
          authorId: teammate.id,
          body: 'Let\'s keep it under 12 words and punchy.',
        },
      });
    }
  }

  // eslint-disable-next-line no-console
  console.log('Seed complete — board:', board.id);
}

main()
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
