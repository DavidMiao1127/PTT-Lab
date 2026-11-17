// Intentionally empty by default.
// Add Drizzle tables here when the site actually needs a database.
// See examples/d1/db/schema.ts for an opt-in example.
import { sqliteTable, text, integer, index, uniqueIndex } from 'drizzle-orm/sqlite-core';
export const sessions = sqliteTable('sessions', {id:text('id').primaryKey(),token:text('token').notNull().unique(),userId:text('user_id'),profile:text('profile').notNull(),items:text('items').notNull(),status:text('status').notNull(),selected:text('selected').notNull(),summary:text('summary'),createdAt:integer('created_at').notNull(),completedAt:integer('completed_at')});
export const answers=sqliteTable('answers',{id:text('id').primaryKey(),sessionId:text('session_id').notNull(),pairId:text('pair_id').notNull(),choice:text('choice').notNull(),confidence:integer('confidence').notNull(),activeMs:integer('active_ms').notNull(),submittedAt:integer('submitted_at').notNull()},t=>[index('answers_session').on(t.sessionId)]);
export const visits=sqliteTable('visits',{id:text('id').primaryKey(),sessionId:text('session_id').notNull(),pairId:text('pair_id').notNull(),openedAt:integer('opened_at').notNull()},t=>[index('visits_session_pair').on(t.sessionId,t.pairId)]);
export const events=sqliteTable('events',{id:text('id').primaryKey(),sessionId:text('session_id').notNull(),pairId:text('pair_id').notNull(),payload:text('payload').notNull(),receivedAt:integer('received_at').notNull()},t=>[index('events_session_pair').on(t.sessionId,t.pairId)]);
export const evidence=sqliteTable('evidence',{id:text('id').primaryKey(),sessionId:text('session_id').notNull(),pairId:text('pair_id').notNull(),payload:text('payload').notNull(),submittedAt:integer('submitted_at').notNull()},t=>[index('evidence_session').on(t.sessionId)]);

export const importedSources = sqliteTable('imported_sources', {
  id: text('id').primaryKey(),
  payload: text('payload').notNull(),
});

export const importedPairs = sqliteTable('imported_pairs', {
  id: text('id').primaryKey(),
  itemId: text('item_id').notNull(),
  author: text('author').notNull(),
  domain: text('domain').notNull(),
  level: text('level').notNull(),
  method: text('method').notNull(),
  model: text('model').notNull(),
  runId: text('run_id').notNull(),
  generatedText: text('generated_text').notNull(),
  createdAt: integer('created_at').notNull(),
}, t => [
  uniqueIndex('imported_pairs_method_run').on(t.itemId, t.method, t.model, t.runId),
]);
