import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, desc, eq, inArray } from 'drizzle-orm';
import { db } from '../../core/config/db.js';
import {
  questionOptions,
  questions,
  testAttemptAnswerOptions,
  testAttemptAnswers,
  testAttempts,
  testQuestions,
  tests,
} from '../../core/schema/index.js';
import type { CurrentUser } from '../clerk-auth/clerk-auth.service.js';
import type {
  CreateExamInput,
  SaveAnswerInput,
  UpdateExamInput,
} from './dto/exam.dto.js';

type DbExecutor =
  typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0];

@Injectable()
export class ExamService {
  listPublished() {
    return db
      .select()
      .from(tests)
      .where(eq(tests.status, 'published'))
      .orderBy(desc(tests.createdAt));
  }

  async getPublished(id: string) {
    const [test] = await db
      .select()
      .from(tests)
      .where(and(eq(tests.id, id), eq(tests.status, 'published')))
      .limit(1);
    if (!test) throw new NotFoundException('Exam was not found.');
    return { ...test, questions: await this.getTestQuestions(id, false) };
  }

  async listManageable(user: CurrentUser) {
    this.assertEditor(user);
    return user.role === 'admin'
      ? db.select().from(tests).orderBy(desc(tests.updatedAt))
      : db
          .select()
          .from(tests)
          .where(eq(tests.createdBy, user.id))
          .orderBy(desc(tests.updatedAt));
  }

  async create(input: CreateExamInput, user: CurrentUser) {
    this.assertEditor(user);
    await this.validateQuestionIds(
      input.questions.map((item) => item.questionId),
    );
    return db.transaction(async (tx) => {
      const { questions: items, ...values } = input;
      const [test] = await tx
        .insert(tests)
        .values({ ...values, createdBy: user.id })
        .returning();
      if (!test) throw new Error('Exam creation did not return a row.');
      await tx
        .insert(testQuestions)
        .values(
          items.map((item, position) => ({
            ...item,
            testId: test.id,
            position,
          })),
        );
      return {
        ...test,
        questions: await this.getTestQuestions(test.id, true, tx),
      };
    });
  }

  async update(id: string, input: UpdateExamInput, user: CurrentUser) {
    const existing = await this.findManageable(id, user);
    if (input.questions)
      await this.validateQuestionIds(
        input.questions.map((item) => item.questionId),
      );
    return db.transaction(async (tx) => {
      const { questions: items, ...values } = input;
      const [test] = await tx
        .update(tests)
        .set({ ...values, updatedAt: new Date() })
        .where(eq(tests.id, existing.id))
        .returning();
      if (!test) throw new NotFoundException('Exam was not found.');
      if (items) {
        await tx.delete(testQuestions).where(eq(testQuestions.testId, id));
        await tx
          .insert(testQuestions)
          .values(
            items.map((item, position) => ({ ...item, testId: id, position })),
          );
      }
      return { ...test, questions: await this.getTestQuestions(id, true, tx) };
    });
  }

  async remove(id: string, user: CurrentUser) {
    await this.findManageable(id, user);
    try {
      await db.delete(tests).where(eq(tests.id, id));
    } catch (error) {
      if ((error as { code?: string }).code === '23503')
        throw new ConflictException(
          'An exam with attempts cannot be deleted. Archive it instead.',
        );
      throw error;
    }
  }

  async startAttempt(testId: string, user: CurrentUser) {
    const [test] = await db
      .select()
      .from(tests)
      .where(and(eq(tests.id, testId), eq(tests.status, 'published')))
      .limit(1);
    if (!test) throw new NotFoundException('Exam was not found.');
    const membership = await db
      .select({
        questionId: testQuestions.questionId,
        marks: testQuestions.marks,
        negativeMarks: testQuestions.negativeMarks,
        defaultMarks: questions.marks,
        defaultNegativeMarks: questions.negativeMarks,
      })
      .from(testQuestions)
      .innerJoin(questions, eq(testQuestions.questionId, questions.id))
      .where(eq(testQuestions.testId, testId))
      .orderBy(asc(testQuestions.position));
    if (!membership.length)
      throw new ConflictException('This exam has no questions.');
    const previous = await db
      .select({ attemptNumber: testAttempts.attemptNumber })
      .from(testAttempts)
      .where(
        and(eq(testAttempts.testId, testId), eq(testAttempts.userId, user.id)),
      )
      .orderBy(desc(testAttempts.attemptNumber))
      .limit(1);
    const attemptNumber = (previous[0]?.attemptNumber ?? 0) + 1;
    const maximumMarks = membership.reduce(
      (sum, item) => sum + (item.marks ?? item.defaultMarks),
      0,
    );
    return db.transaction(async (tx) => {
      const [attempt] = await tx
        .insert(testAttempts)
        .values({ testId, userId: user.id, attemptNumber, maximumMarks })
        .returning();
      if (!attempt) throw new Error('Attempt creation did not return a row.');
      await tx
        .insert(testAttemptAnswers)
        .values(
          membership.map((item) => ({
            attemptId: attempt.id,
            questionId: item.questionId,
            maximumMarks: item.marks ?? item.defaultMarks,
            negativeMarks: item.negativeMarks ?? item.defaultNegativeMarks,
          })),
        );
      return this.getAttempt(attempt.id, user, tx);
    });
  }

  listAttempts(user: CurrentUser) {
    return db
      .select({
        attempt: testAttempts,
        test: { id: tests.id, title: tests.title, type: tests.type },
      })
      .from(testAttempts)
      .innerJoin(tests, eq(testAttempts.testId, tests.id))
      .where(eq(testAttempts.userId, user.id))
      .orderBy(desc(testAttempts.startedAt));
  }

  async getAttempt(id: string, user: CurrentUser, executor: DbExecutor = db) {
    const [row] = await executor
      .select({ attempt: testAttempts, test: tests })
      .from(testAttempts)
      .innerJoin(tests, eq(testAttempts.testId, tests.id))
      .where(and(eq(testAttempts.id, id), eq(testAttempts.userId, user.id)))
      .limit(1);
    if (!row) throw new NotFoundException('Exam attempt was not found.');
    const answers = await executor
      .select()
      .from(testAttemptAnswers)
      .where(eq(testAttemptAnswers.attemptId, id));
    const selections = answers.length
      ? await executor
          .select()
          .from(testAttemptAnswerOptions)
          .where(
            inArray(
              testAttemptAnswerOptions.answerId,
              answers.map((answer) => answer.id),
            ),
          )
      : [];
    const exposeScore = row.attempt.status !== 'in_progress';
    const correctOptions =
      exposeScore && answers.length
        ? await executor
            .select({
              id: questionOptions.id,
              questionId: questionOptions.questionId,
            })
            .from(questionOptions)
            .where(
              and(
                inArray(
                  questionOptions.questionId,
                  answers.map((answer) => answer.questionId),
                ),
                eq(questionOptions.isCorrect, true),
              ),
            )
        : [];
    return {
      ...row,
      answers: answers.map((answer) => ({
        id: answer.id,
        questionId: answer.questionId,
        optionIds: selections
          .filter((item) => item.answerId === answer.id)
          .map((item) => item.optionId),
        timeSpentSeconds: answer.timeSpentSeconds,
        answeredAt: answer.answeredAt,
        ...(exposeScore
          ? {
              isCorrect: answer.isCorrect,
              marksAwarded: answer.marksAwarded,
              maximumMarks: answer.maximumMarks,
              negativeMarks: answer.negativeMarks,
              correctOptionIds: correctOptions
                .filter((option) => option.questionId === answer.questionId)
                .map((option) => option.id),
            }
          : {}),
      })),
    };
  }

  async saveAnswer(
    attemptId: string,
    questionId: string,
    input: SaveAnswerInput,
    user: CurrentUser,
  ) {
    const attempt = await this.requireActiveAttempt(attemptId, user);
    const [answer] = await db
      .select()
      .from(testAttemptAnswers)
      .where(
        and(
          eq(testAttemptAnswers.attemptId, attempt.id),
          eq(testAttemptAnswers.questionId, questionId),
        ),
      )
      .limit(1);
    if (!answer)
      throw new NotFoundException('Question is not part of this exam attempt.');
    if (input.optionIds.length) {
      const valid = await db
        .select({ id: questionOptions.id })
        .from(questionOptions)
        .where(
          and(
            eq(questionOptions.questionId, questionId),
            inArray(questionOptions.id, input.optionIds),
          ),
        );
      if (valid.length !== input.optionIds.length)
        throw new BadRequestException(
          'One or more options do not belong to this question.',
        );
    }
    await db.transaction(async (tx) => {
      await tx
        .delete(testAttemptAnswerOptions)
        .where(eq(testAttemptAnswerOptions.answerId, answer.id));
      if (input.optionIds.length)
        await tx
          .insert(testAttemptAnswerOptions)
          .values(
            input.optionIds.map((optionId) => ({
              answerId: answer.id,
              optionId,
            })),
          );
      await tx
        .update(testAttemptAnswers)
        .set({
          answeredAt: input.optionIds.length ? new Date() : null,
          timeSpentSeconds: input.timeSpentSeconds,
          updatedAt: new Date(),
        })
        .where(eq(testAttemptAnswers.id, answer.id));
    });
    return this.getAttempt(attemptId, user);
  }

  async submit(id: string, user: CurrentUser) {
    const attempt = await this.requireActiveAttempt(id, user);
    const answers = await db
      .select()
      .from(testAttemptAnswers)
      .where(eq(testAttemptAnswers.attemptId, id));
    const selections = await db
      .select()
      .from(testAttemptAnswerOptions)
      .where(
        inArray(
          testAttemptAnswerOptions.answerId,
          answers.map((answer) => answer.id),
        ),
      );
    const options = await db
      .select({
        id: questionOptions.id,
        questionId: questionOptions.questionId,
        isCorrect: questionOptions.isCorrect,
      })
      .from(questionOptions)
      .where(
        inArray(
          questionOptions.questionId,
          answers.map((answer) => answer.questionId),
        ),
      );
    let total = 0;
    const graded = answers.map((answer) => {
      const selectedIds = selections
        .filter((item) => item.answerId === answer.id)
        .map((item) => item.optionId)
        .sort();
      const correctIds = options
        .filter(
          (item) => item.questionId === answer.questionId && item.isCorrect,
        )
        .map((item) => item.id)
        .sort();
      const isCorrect =
        selectedIds.length > 0 &&
        selectedIds.length === correctIds.length &&
        selectedIds.every((value, index) => value === correctIds[index]);
      const marksAwarded =
        selectedIds.length === 0
          ? 0
          : isCorrect
            ? answer.maximumMarks
            : -answer.negativeMarks;
      total += marksAwarded;
      return { answer, isCorrect, marksAwarded };
    });
    await db.transaction(async (tx) => {
      for (const item of graded)
        await tx
          .update(testAttemptAnswers)
          .set({
            isCorrect: item.isCorrect,
            marksAwarded: item.marksAwarded,
            updatedAt: new Date(),
          })
          .where(eq(testAttemptAnswers.id, item.answer.id));
      const endedAt = new Date();
      await tx
        .update(testAttempts)
        .set({
          status: 'submitted',
          marksAwarded: total,
          endedAt,
          timeSpentSeconds: Math.max(
            0,
            Math.floor(
              (endedAt.getTime() - attempt.startedAt.getTime()) / 1000,
            ),
          ),
          updatedAt: endedAt,
        })
        .where(eq(testAttempts.id, id));
    });
    return this.getAttempt(id, user);
  }

  private async getTestQuestions(
    testId: string,
    includeAnswers: boolean,
    executor: DbExecutor = db,
  ) {
    const rows = await executor
      .select({ membership: testQuestions, question: questions })
      .from(testQuestions)
      .innerJoin(questions, eq(testQuestions.questionId, questions.id))
      .where(eq(testQuestions.testId, testId))
      .orderBy(asc(testQuestions.position));
    if (!rows.length) return [];
    const options = await executor
      .select()
      .from(questionOptions)
      .where(
        inArray(
          questionOptions.questionId,
          rows.map((row) => row.question.id),
        ),
      )
      .orderBy(asc(questionOptions.position));
    return rows.map(({ membership, question }) => {
      const publicQuestion = includeAnswers
        ? question
        : (({ explanation: _explanation, ...safeQuestion }) => safeQuestion)(
            question,
          );
      return {
        ...publicQuestion,
        marks: membership.marks ?? question.marks,
        negativeMarks: membership.negativeMarks ?? question.negativeMarks,
        position: membership.position,
        options: options
          .filter((option) => option.questionId === question.id)
          .map((option) =>
            includeAnswers
              ? option
              : {
                  id: option.id,
                  content: option.content,
                  imageUrl: option.imageUrl,
                  position: option.position,
                },
          ),
      };
    });
  }

  private async validateQuestionIds(ids: string[]) {
    const rows = await db
      .select({ id: questions.id })
      .from(questions)
      .where(inArray(questions.id, ids));
    if (rows.length !== ids.length)
      throw new BadRequestException('One or more questions do not exist.');
  }

  private async findManageable(id: string, user: CurrentUser) {
    this.assertEditor(user);
    const [row] = await db
      .select()
      .from(tests)
      .where(eq(tests.id, id))
      .limit(1);
    if (!row) throw new NotFoundException('Exam was not found.');
    if (user.role !== 'admin' && row.createdBy !== user.id)
      throw new ForbiddenException('You cannot manage this exam.');
    return row;
  }

  private async requireActiveAttempt(id: string, user: CurrentUser) {
    const [row] = await db
      .select()
      .from(testAttempts)
      .where(and(eq(testAttempts.id, id), eq(testAttempts.userId, user.id)))
      .limit(1);
    if (!row) throw new NotFoundException('Exam attempt was not found.');
    if (row.status !== 'in_progress')
      throw new ConflictException('This exam attempt has already ended.');
    return row;
  }

  private assertEditor(user: CurrentUser) {
    if (user.role === 'student')
      throw new ForbiddenException('Editor access is required.');
  }
}
