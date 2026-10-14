import {
  boolean,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { users } from './users.js';

export const questionType = pgEnum('question_type', [
  'single_choice',
  'multiple_choice',
]);

export const questionDifficulty = pgEnum('question_difficulty', [
  'easy',
  'medium',
  'hard',
]);

export const questionStatus = pgEnum('question_status', [
  'draft',
  'published',
  'archived',
]);

export const testType = pgEnum('test_type', [
  'exam',
  'quiz',
  'current_affairs_quiz',
]);

export const testStatus = pgEnum('test_status', [
  'draft',
  'published',
  'archived',
]);

export const questionReportStatus = pgEnum('question_report_status', [
  'pending',
  'reviewed',
  'resolved',
  'dismissed',
]);

export const testAttemptStatus = pgEnum('test_attempt_status', [
  'in_progress',
  'submitted',
  'timed_out',
  'abandoned',
]);

export const questions = pgTable(
  'questions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    content: text('content').notNull(),
    explanation: text('explanation'),
    type: questionType('type').notNull().default('single_choice'),
    difficulty: questionDifficulty('difficulty').notNull().default('medium'),
    status: questionStatus('status').notNull().default('draft'),
    subject: text('subject').notNull(),
    topic: text('topic'),
    tags: text('tags').array().notNull().default([]),
    marks: numeric('marks', { mode: 'number' }).notNull().default(1),
    negativeMarks: numeric('negative_marks', { mode: 'number' })
      .notNull()
      .default(0),
    source: text('source'),
    createdBy: text('created_by').references(() => users.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('questions_status_created_at_idx').on(table.status, table.createdAt),
    index('questions_subject_topic_idx').on(table.subject, table.topic),
    index('questions_difficulty_idx').on(table.difficulty),
    index('questions_created_by_idx').on(table.createdBy),
  ],
);

export const questionOptions = pgTable(
  'question_options',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    questionId: uuid('question_id')
      .notNull()
      .references(() => questions.id, { onDelete: 'cascade' }),
    content: text('content').notNull(),
    imageUrl: text('image_url'),
    position: integer('position').notNull(),
    isCorrect: boolean('is_correct').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex('question_options_question_id_position_unique').on(
      table.questionId,
      table.position,
    ),
    index('question_options_question_id_idx').on(table.questionId),
  ],
);

export const savedQuestions = pgTable(
  'saved_questions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    questionId: uuid('question_id')
      .notNull()
      .references(() => questions.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('saved_questions_user_id_question_id_unique').on(
      table.userId,
      table.questionId,
    ),
    index('saved_questions_user_id_created_at_idx').on(
      table.userId,
      table.createdAt,
    ),
    index('saved_questions_question_id_idx').on(table.questionId),
  ],
);

export const tests = pgTable(
  'tests',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    title: text('title').notNull(),
    description: text('description'),
    type: testType('type').notNull(),
    status: testStatus('status').notNull().default('draft'),
    subject: text('subject'),
    durationMinutes: integer('duration_minutes'),
    createdBy: text('created_by').references(() => users.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('tests_type_status_idx').on(table.type, table.status),
    index('tests_created_by_idx').on(table.createdBy),
  ],
);

export const testQuestions = pgTable(
  'test_questions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    testId: uuid('test_id')
      .notNull()
      .references(() => tests.id, { onDelete: 'cascade' }),
    questionId: uuid('question_id')
      .notNull()
      .references(() => questions.id, { onDelete: 'cascade' }),
    position: integer('position').notNull(),
    marks: numeric('marks', { mode: 'number' }),
    negativeMarks: numeric('negative_marks', { mode: 'number' }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('test_questions_test_id_question_id_unique').on(
      table.testId,
      table.questionId,
    ),
    uniqueIndex('test_questions_test_id_position_unique').on(
      table.testId,
      table.position,
    ),
    index('test_questions_question_id_idx').on(table.questionId),
  ],
);

export const testAttempts = pgTable(
  'test_attempts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    testId: uuid('test_id')
      .notNull()
      .references(() => tests.id),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    attemptNumber: integer('attempt_number').notNull().default(1),
    status: testAttemptStatus('status').notNull().default('in_progress'),
    marksAwarded: numeric('marks_awarded', { mode: 'number' })
      .notNull()
      .default(0),
    maximumMarks: numeric('maximum_marks', { mode: 'number' })
      .notNull()
      .default(0),
    startedAt: timestamp('started_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    endedAt: timestamp('ended_at', { withTimezone: true }),
    timeSpentSeconds: integer('time_spent_seconds'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex('test_attempts_user_id_test_id_attempt_number_unique').on(
      table.userId,
      table.testId,
      table.attemptNumber,
    ),
    index('test_attempts_user_id_started_at_idx').on(
      table.userId,
      table.startedAt,
    ),
    index('test_attempts_test_id_status_idx').on(table.testId, table.status),
  ],
);

export const testAttemptAnswers = pgTable(
  'test_attempt_answers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    attemptId: uuid('attempt_id')
      .notNull()
      .references(() => testAttempts.id, { onDelete: 'cascade' }),
    questionId: uuid('question_id')
      .notNull()
      .references(() => questions.id),
    isCorrect: boolean('is_correct'),
    marksAwarded: numeric('marks_awarded', { mode: 'number' })
      .notNull()
      .default(0),
    maximumMarks: numeric('maximum_marks', { mode: 'number' }).notNull(),
    negativeMarks: numeric('negative_marks', { mode: 'number' })
      .notNull()
      .default(0),
    timeSpentSeconds: integer('time_spent_seconds'),
    answeredAt: timestamp('answered_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex('test_attempt_answers_attempt_id_question_id_unique').on(
      table.attemptId,
      table.questionId,
    ),
    index('test_attempt_answers_question_id_idx').on(table.questionId),
  ],
);

export const testAttemptAnswerOptions = pgTable(
  'test_attempt_answer_options',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    answerId: uuid('answer_id')
      .notNull()
      .references(() => testAttemptAnswers.id, { onDelete: 'cascade' }),
    optionId: uuid('option_id')
      .notNull()
      .references(() => questionOptions.id),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('test_attempt_answer_options_answer_id_option_id_unique').on(
      table.answerId,
      table.optionId,
    ),
    index('test_attempt_answer_options_option_id_idx').on(table.optionId),
  ],
);

export const reportedQuestions = pgTable(
  'reported_questions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    questionId: uuid('question_id')
      .notNull()
      .references(() => questions.id, { onDelete: 'cascade' }),
    reason: text('reason').notNull(),
    details: text('details'),
    status: questionReportStatus('status').notNull().default('pending'),
    reviewedBy: text('reviewed_by').references(() => users.id, {
      onDelete: 'set null',
    }),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    resolutionNote: text('resolution_note'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex('reported_questions_user_id_question_id_unique').on(
      table.userId,
      table.questionId,
    ),
    index('reported_questions_status_created_at_idx').on(
      table.status,
      table.createdAt,
    ),
    index('reported_questions_question_id_idx').on(table.questionId),
    index('reported_questions_reviewed_by_idx').on(table.reviewedBy),
  ],
);

