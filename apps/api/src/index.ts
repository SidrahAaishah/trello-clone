import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import { defaultUser } from './middleware/auth.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';

import boardsRouter from './routes/boards.js';
import listsRouter from './routes/lists.js';
import cardsRouter from './routes/cards.js';
import labelsRouter from './routes/labels.js';
import checklistsRouter from './routes/checklists.js';
import commentsRouter from './routes/comments.js';
import activitiesRouter from './routes/activities.js';
import searchRouter from './routes/search.js';
import usersRouter from './routes/users.js';
import templatesRouter from './routes/templates.js';

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: (process.env.CORS_ORIGIN ?? '*')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    credentials: false,
  }),
);
app.use(express.json({ limit: '1mb' }));
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

app.get('/health', (_req, res) => res.json({ ok: true }));

// Everything below is protected by "default user" resolver.
app.use('/api', defaultUser);

app.use('/api/users', usersRouter);
app.use('/api/boards', boardsRouter);
app.use('/api/boards/:boardId/lists', listsRouter);
app.use('/api/boards/:boardId/labels', labelsRouter);
app.use('/api/boards/:boardId/activities', activitiesRouter);
app.use('/api', cardsRouter); // mounts /lists/:listId/cards and /cards/:cardId/*
app.use('/api', checklistsRouter); // mounts /cards/:cardId/checklists and /checklist-items/*
app.use('/api', commentsRouter); // /cards/:cardId/comments and /comments/:id
app.use('/api/search', searchRouter);
app.use('/api/templates', templatesRouter);

app.use(notFoundHandler);
app.use(errorHandler);

const port = Number(process.env.PORT ?? 4000);
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`api listening on :${port}`);
});
