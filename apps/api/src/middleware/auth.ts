import type { NextFunction, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { HttpError } from '../lib/errors.js';


// Per assignment we have a single default user — no auth required.
// We still funnel all writes through a resolved userId so future auth is a drop-in.
export async function defaultUser(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  try {
    const user = await prisma.user.findFirst({ where: { isDefault: true } });
    if (!user) throw new HttpError(500, 'NO_DEFAULT_USER', 'Default user missing. Did you run the seed?');
    req.userId = user.id;
    next();
  } catch (err) {
    next(err);
  }
}
