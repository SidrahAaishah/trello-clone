import type { Prisma, PrismaClient } from '@prisma/client';
import { POSITION_STEP } from '@trello-clone/shared';
import { logActivity } from './activity.js';

type Tx = PrismaClient | Prisma.TransactionClient;

export interface InstantiateTemplateOptions {
  templateId: string;
  userId: string;
  title: string;
  includeCards: boolean;
}

/**
 * Create a fresh Board (+ lists, labels, optionally cards with checklists)
 * from an existing Template. Runs in a single transaction so a failure never
 * leaves a partially-constructed board behind.
 *
 * Returns the newly-created boardId so callers can fetch/redirect.
 */
export async function instantiateTemplate(
  tx: Tx,
  opts: InstantiateTemplateOptions,
) {
  const template = await tx.template.findUnique({
    where: { id: opts.templateId },
    include: {
      labels: true,
      lists: {
        include: {
          cards: {
            include: {
              labels: true,
              checklists: { include: { items: true } },
            },
          },
        },
      },
    },
  });

  if (!template) return null;

  // 1. Create the board shell (owner membership included, matching POST /boards).
  const board = await tx.board.create({
    data: {
      title: opts.title,
      ownerId: opts.userId,
      backgroundType: template.boardBackgroundType,
      backgroundValue: template.boardBackgroundValue,
      members: { create: { userId: opts.userId, role: 'owner' } },
    },
  });

  // 2. Copy labels first so we can reference them from cards.
  const labelIdMap = new Map<string, string>();
  for (const tl of template.labels) {
    const label = await tx.label.create({
      data: {
        boardId: board.id,
        name: tl.name,
        color: tl.color,
      },
    });
    labelIdMap.set(tl.id, label.id);
  }

  // 3. Copy lists (always, even if includeCards = false — an empty board
  //    with the template's structural skeleton is still useful).
  const sortedLists = template.lists.slice().sort((a, b) => a.position - b.position);

  for (const [li, tList] of sortedLists.entries()) {
    const list = await tx.list.create({
      data: {
        boardId: board.id,
        title: tList.title,
        position: (li + 1) * POSITION_STEP,
      },
    });

    if (!opts.includeCards) continue;

    const sortedCards = tList.cards.slice().sort((a, b) => a.position - b.position);

    for (const [ci, tCard] of sortedCards.entries()) {
      const card = await tx.card.create({
        data: {
          boardId: board.id,
          listId: list.id,
          title: tCard.title,
          description: tCard.description,
          position: (ci + 1) * POSITION_STEP,
          coverType: tCard.coverType,
          coverValue: tCard.coverValue,
          labels: {
            create: tCard.labels
              .map((cl) => labelIdMap.get(cl.labelId))
              .filter((id): id is string => Boolean(id))
              .map((labelId) => ({ labelId })),
          },
        },
      });

      // Copy checklists + items.
      const sortedChecklists = tCard.checklists
        .slice()
        .sort((a, b) => a.position - b.position);

      for (const [chi, tChecklist] of sortedChecklists.entries()) {
        const checklist = await tx.checklist.create({
          data: {
            cardId: card.id,
            title: tChecklist.title,
            position: (chi + 1) * POSITION_STEP,
          },
        });

        const sortedItems = tChecklist.items
          .slice()
          .sort((a, b) => a.position - b.position);

        if (sortedItems.length > 0) {
          await tx.checklistItem.createMany({
            data: sortedItems.map((it, ii) => ({
              checklistId: checklist.id,
              text: it.text,
              done: it.done,
              position: (ii + 1) * POSITION_STEP,
            })),
          });
        }
      }
    }
  }

  // 4. Bump template useCount for the "Most popular" surface over time.
  await tx.template.update({
    where: { id: template.id },
    data: { useCount: { increment: 1 } },
  });

  // 5. Activity log — uses a template-specific type so the board history
  //    surfaces "Created from <template>" distinctly from a blank board.
  await logActivity(tx, {
    boardId: board.id,
    actorId: opts.userId,
    type: 'board.createdFromTemplate',
    payload: {
      title: board.title,
      templateId: template.id,
      templateTitle: template.title,
      includeCards: opts.includeCards,
    },
  });

  return { boardId: board.id };
}
