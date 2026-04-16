import { Router } from 'express';
import {
  listTemplatesQuerySchema,
  instantiateTemplateInputSchema,
} from '@trello-clone/shared';
import { prisma } from '../lib/prisma.js';
import { notFound } from '../lib/errors.js';
import { mapBoard } from '../services/mappers.js';
import {
  mapTemplateSummary,
  mapTemplateDetail,
} from '../services/templateMappers.js';
import { instantiateTemplate } from '../services/instantiateTemplate.js';

const router = Router();

// GET /api/templates — gallery listing. Supports optional category filter
// and featured-only filter. Results sorted most-popular-first so the
// "Most popular" pin and the grid share a sensible default order.
router.get('/', async (req, res) => {
  const { category, featured } = listTemplatesQuerySchema.parse(req.query);

  const templates = await prisma.template.findMany({
    where: {
      ...(category ? { category } : {}),
      ...(featured !== undefined ? { isFeatured: featured } : {}),
    },
    orderBy: [
      { isMostPopular: 'desc' },
      { isFeatured: 'desc' },
      { useCount: 'desc' },
      { title: 'asc' },
    ],
  });

  res.json({ templates: templates.map(mapTemplateSummary) });
});

// GET /api/templates/:id — full detail (lists, cards, labels, checklists).
// Currently only used by the create-from-template dialog's preview section
// and for debugging, but exposed so future list/card preview UIs can light up
// without another backend change.
router.get('/:id', async (req, res) => {
  const template = await prisma.template.findUnique({
    where: { id: req.params.id },
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
  if (!template) throw notFound('Template');

  res.json({ template: mapTemplateDetail(template) });
});

// POST /api/templates/:id/instantiate — create a real Board from a Template.
// Body: { title, includeCards }. Returns the new board envelope so the web
// client can `navigate(/boards/:id)` immediately.
router.post('/:id/instantiate', async (req, res) => {
  const input = instantiateTemplateInputSchema.parse(req.body);

  // Bump the transaction ceilings above Prisma's 5s default — cloning a
  // fully-populated template (lists + cards + checklists + items + labels)
  // is O(cards * relations) sequential inserts and can drift past 5s on
  // slower dev machines or remote DBs.
  const result = await prisma.$transaction(
    async (tx) => {
      return instantiateTemplate(tx, {
        templateId: req.params.id,
        userId: req.userId,
        title: input.title,
        includeCards: input.includeCards,
      });
    },
    { maxWait: 10_000, timeout: 30_000 },
  );

  if (!result) throw notFound('Template');

  const board = await prisma.board.findUnique({ where: { id: result.boardId } });
  if (!board) throw notFound('Board');

  res.status(201).json({ board: mapBoard(board) });
});

export default router;
