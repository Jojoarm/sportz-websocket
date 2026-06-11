import { Router } from 'express';
import { desc, eq } from 'drizzle-orm';
import { db } from '../db/db.js';
import { commentary } from '../db/schema.js';
import { matchIdParamSchema } from '../validation/matches.js';
import {
  createCommentarySchema,
  listCommentaryQuerySchema,
} from '../validation/commentary.js';

export const commentaryRouter = Router({ mergeParams: true });

const MAX_LIMIT = 100;

commentaryRouter.get('/', async (req, res) => {
  const paramsValidation = matchIdParamSchema.safeParse(req.params);
  if (!paramsValidation.success) {
    return res.status(400).json({
      error: 'Invalid match ID',
      details: paramsValidation.error.issues,
    });
  }

  const queryValidation = listCommentaryQuerySchema.safeParse(req.query);
  if (!queryValidation.success) {
    return res.status(400).json({
      error: 'Invalid query parameters',
      details: queryValidation.error.issues,
    });
  }

  const { id: matchId } = paramsValidation.data;
  const limit = Math.min(queryValidation.data.limit ?? MAX_LIMIT, MAX_LIMIT);

  try {
    const data = await db
      .select()
      .from(commentary)
      .where(eq(commentary.matchId, matchId))
      .orderBy(desc(commentary.createdAt))
      .limit(limit);

    return res.status(200).json({
      message: 'Commentary list',
      data,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: 'Failed to fetch commentary',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

commentaryRouter.post('/', async (req, res) => {
  const paramsValidation = matchIdParamSchema.safeParse(req.params);

  if (!paramsValidation.success) {
    return res.status(400).json({
      error: 'Invalid match ID',
      details: paramsValidation.error.issues,
    });
  }

  const bodyValidation = createCommentarySchema.safeParse(req.body);

  if (!bodyValidation.success) {
    return res.status(400).json({
      error: 'Invalid payload',
      details: bodyValidation.error.issues,
    });
  }

  try {
    const { id: matchId } = paramsValidation.data;
    const {
      minute,
      sequence,
      period,
      eventType,
      actor,
      team,
      message,
      metadata,
      tags,
    } = bodyValidation.data;

    const [event] = await db
      .insert(commentary)
      .values({
        matchId,
        minute,
        sequence: parseInt(sequence, 10),
        period,
        eventType,
        actor,
        team,
        message,
        metadata,
        tags: tags ? JSON.stringify(tags) : null,
      })
      .returning();

    if (res.app.locals.broadcastCommentary) {
      res.app.locals.broadcastCommentary(event.matchId, event);
    }

    res.status(201).json({
      message: 'Commentary created successfully',
      data: event,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: 'Failed to create commentary',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});
