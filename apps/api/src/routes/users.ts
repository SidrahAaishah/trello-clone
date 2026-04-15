import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { mapMember } from '../services/mappers.js';

const router = Router();

// Who am I (default user).
router.get('/me', async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user) return res.status(500).json({ error: { code: 'NO_USER', message: 'Default user missing' } });
  res.json({ user: mapMember(user) });
});

// List of potential members to assign (everyone in the system for MVP).
router.get('/', async (_req, res) => {
  const users = await prisma.user.findMany({ orderBy: { displayName: 'asc' } });
  res.json({ users: users.map(mapMember) });
});

export default router;
