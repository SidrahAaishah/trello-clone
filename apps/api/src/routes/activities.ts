import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { mapActivity } from '../services/mappers.js';

const router = Router({ mergeParams: true });

router.get('/', async (req, res) => {
  const limit = Math.min(Number(req.query.limit ?? 50), 200);
  const activities = await prisma.activity.findMany({
    where: { boardId: req.params.boardId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: { actor: true },
  });
  res.json({ activities: activities.map(mapActivity) });
});

export default router;
