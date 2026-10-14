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
  reportedQuestions,
  savedQuestions,
} from '../../core/schema/index.js';
import type { CurrentUser } from '../clerk-auth/clerk-auth.service.js';
import type {
  CreateQuestionsInput,
  ReportQuestionInput,
  UpdateQuestionInput,
} from './dto/question.dto.js';

@Injectable()
export class QuestionService {
  async listPublished() {
    const rows = await db
      .select()
      .from(questions)
      .where(eq(questions.status, 'published'))
      .orderBy(desc(questions.createdAt));
    return this.withOptions(rows, false);
  }

  async getPublished(id: string) {
    const [row] = await db
      .select()
      .from(questions)
      .where(and(eq(questions.id, id), eq(questions.status, 'published')))
      .limit(1);
    if (!row) throw new NotFoundException('Question was not found.');
    return (await this.withOptions([row], false))[0];
  }

  async listManageable(user: CurrentUser) {
    this.assertEditor(user);
    const rows =
      user.role === 'admin'
        ? await db.select().from(questions).orderBy(desc(questions.updatedAt))
        : await db
            .select()
            .from(questions)
            .where(eq(questions.createdBy, user.id))
            .orderBy(desc(questions.updatedAt));
    return this.withOptions(rows, true);
  }

  async createMany(input: CreateQuestionsInput, user: CurrentUser) {
    this.assertEditor(user);
    return db.transaction(async (tx) => {
      const result = [];
      for (const item of input.questions) {
        const { options, ...values } = item;
        const [question] = await tx
          .insert(questions)
          .values({ ...values, createdBy: user.id })
          .returning();
        if (!question)
          throw new Error('Question creation did not return a row.');
        const insertedOptions = await tx
          .insert(questionOptions)
          .values(
            options.map((option, position) => ({
              ...option,
              questionId: question.id,
              position,
            })),
          )
          .returning();
        result.push({ ...question, options: insertedOptions });
      }
      return result;
    });
  }

  async update(id: string, input: UpdateQuestionInput, user: CurrentUser) {
    const existing = await this.findManageable(id, user);
    if (input.type || input.options) {
      const effectiveType = input.type ?? existing.type;
      const effectiveOptions =
        input.options ??
        (await db
          .select()
          .from(questionOptions)
          .where(eq(questionOptions.questionId, id)));
      const correctCount = effectiveOptions.filter(
        (option) => option.isCorrect,
      ).length;
      if (
        correctCount === 0 ||
        (effectiveType === 'single_choice' && correctCount !== 1)
      ) {
        throw new BadRequestException(
          'The correct options do not match the question type.',
        );
      }
    }
    return db.transaction(async (tx) => {
      const { options, ...values } = input;
      const [question] = await tx
        .update(questions)
        .set({ ...values, updatedAt: new Date() })
        .where(eq(questions.id, existing.id))
        .returning();
      if (!question) throw new NotFoundException('Question was not found.');
      if (options) {
        await tx
          .delete(questionOptions)
          .where(eq(questionOptions.questionId, id));
        await tx
          .insert(questionOptions)
          .values(
            options.map((option, position) => ({
              ...option,
              questionId: id,
              position,
            })),
          );
      }
      const rows = await tx
        .select()
        .from(questionOptions)
        .where(eq(questionOptions.questionId, id))
        .orderBy(asc(questionOptions.position));
      return { ...question, options: rows };
    });
  }

  async remove(id: string, user: CurrentUser) {
    await this.findManageable(id, user);
    await db.delete(questions).where(eq(questions.id, id));
  }

  async listSaved(user: CurrentUser) {
    const rows = await db
      .select({ savedAt: savedQuestions.createdAt, question: questions })
      .from(savedQuestions)
      .innerJoin(questions, eq(savedQuestions.questionId, questions.id))
      .where(eq(savedQuestions.userId, user.id))
      .orderBy(desc(savedQuestions.createdAt));
    const enriched = await this.withOptions(
      rows.map((row) => row.question),
      false,
    );
    return rows.map((row, index) => ({
      savedAt: row.savedAt,
      question: enriched[index],
    }));
  }

  async save(questionId: string, user: CurrentUser) {
    await this.requireQuestion(questionId);
    try {
      const [saved] = await db
        .insert(savedQuestions)
        .values({ userId: user.id, questionId })
        .returning();
      return saved;
    } catch (error) {
      if ((error as { code?: string }).code === '23505')
        throw new ConflictException('Question is already saved.');
      throw error;
    }
  }

  async unsave(questionId: string, user: CurrentUser) {
    await db
      .delete(savedQuestions)
      .where(
        and(
          eq(savedQuestions.userId, user.id),
          eq(savedQuestions.questionId, questionId),
        ),
      );
  }

  async report(
    questionId: string,
    input: ReportQuestionInput,
    user: CurrentUser,
  ) {
    await this.requireQuestion(questionId);
    try {
      const [report] = await db
        .insert(reportedQuestions)
        .values({ ...input, userId: user.id, questionId })
        .returning();
      return report;
    } catch (error) {
      if ((error as { code?: string }).code === '23505')
        throw new ConflictException('You have already reported this question.');
      throw error;
    }
  }

  private async withOptions<T extends typeof questions.$inferSelect>(
    rows: T[],
    includeAnswers: boolean,
  ) {
    if (!rows.length) return [];
    const options = await db
      .select()
      .from(questionOptions)
      .where(
        inArray(
          questionOptions.questionId,
          rows.map((row) => row.id),
        ),
      )
      .orderBy(asc(questionOptions.position));
    return rows.map((row) => {
      const visibleQuestion = includeAnswers
        ? row
        : (({ explanation: _explanation, ...safeQuestion }) => safeQuestion)(
            row,
          );
      return {
        ...visibleQuestion,
        options: options
          .filter((option) => option.questionId === row.id)
          .map((option) =>
            includeAnswers
              ? option
              : {
                  id: option.id,
                  questionId: option.questionId,
                  content: option.content,
                  imageUrl: option.imageUrl,
                  position: option.position,
                },
          ),
      };
    });
  }

  private async requireQuestion(id: string) {
    const [row] = await db
      .select({ id: questions.id })
      .from(questions)
      .where(eq(questions.id, id))
      .limit(1);
    if (!row) throw new NotFoundException('Question was not found.');
  }

  private async findManageable(id: string, user: CurrentUser) {
    this.assertEditor(user);
    const [row] = await db
      .select()
      .from(questions)
      .where(eq(questions.id, id))
      .limit(1);
    if (!row) throw new NotFoundException('Question was not found.');
    if (user.role !== 'admin' && row.createdBy !== user.id)
      throw new ForbiddenException('You cannot manage this question.');
    return row;
  }

  private assertEditor(user: CurrentUser) {
    if (user.role === 'student')
      throw new ForbiddenException('Editor access is required.');
  }
}
