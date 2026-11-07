import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Feedback,
  type FeedbackDocument,
  type FeedbackSource,
  type FeedbackStatus,
} from '../../core/schema/feedback.schema.js';
import type { CurrentUser } from '../auth/auth.service.js';
import type { CreateFeedbackInput, UpdateFeedbackStatusInput } from './dto/feedback.dto.js';

@Injectable()
export class FeedbackService {
  constructor(
    @InjectModel(Feedback.name)
    private readonly feedbackModel: Model<FeedbackDocument>,
  ) {}

  async create(input: CreateFeedbackInput, user: CurrentUser) {
    const feedbackData: any = {
      source: input.source,
      message: input.message,
      rating: input.rating ?? null,
      category: input.category ?? null,
      testTitle: input.testTitle ?? null,
      userId: new Types.ObjectId(user.id),
      userName: user.name || 'Learner',
      userEmail: user.email,
      userPhone: user.phone || null,
      status: 'NEW',
    };

    if (input.testId && Types.ObjectId.isValid(input.testId)) {
      feedbackData.testId = new Types.ObjectId(input.testId);
    }

    if (input.attemptId && Types.ObjectId.isValid(input.attemptId)) {
      feedbackData.attemptId = new Types.ObjectId(input.attemptId);
    }

    const created = await this.feedbackModel.create(feedbackData);
    return {
      success: true,
      id: created._id.toString(),
      message: 'Feedback submitted successfully. Thank you for helping us improve!',
    };
  }

  async list(query?: {
    source?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const filter: any = {};

    if (query?.source && query.source !== 'ALL') {
      filter.source = query.source;
    }

    if (query?.status && query.status !== 'ALL') {
      filter.status = query.status;
    }

    if (query?.search?.trim()) {
      const reg = new RegExp(query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [
        { message: reg },
        { userName: reg },
        { userEmail: reg },
        { testTitle: reg },
        { category: reg },
      ];
    }

    const page = Math.max(1, Number(query?.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query?.limit) || 25));
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.feedbackModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.feedbackModel.countDocuments(filter),
    ]);

    return {
      feedbacks: items.map((f: any) => ({
        id: f._id.toString(),
        source: f.source,
        message: f.message,
        rating: f.rating,
        category: f.category,
        testId: f.testId ? f.testId.toString() : null,
        testTitle: f.testTitle,
        attemptId: f.attemptId ? f.attemptId.toString() : null,
        userId: f.userId ? f.userId.toString() : null,
        userName: f.userName,
        userEmail: f.userEmail,
        userPhone: f.userPhone,
        status: f.status,
        adminNotes: f.adminNotes,
        reviewedAt: f.reviewedAt,
        createdAt: f.createdAt,
        updatedAt: f.updatedAt,
      })),
      total,
      page,
      limit,
      pages: Math.ceil(total / limit) || 1,
    };
  }

  async updateStatus(id: string, input: UpdateFeedbackStatusInput, adminUser: CurrentUser) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Feedback ID is invalid.');
    }

    const update: any = {
      status: input.status,
      reviewedByUserId: new Types.ObjectId(adminUser.id),
      reviewedAt: new Date(),
    };

    if (input.adminNotes !== undefined) {
      update.adminNotes = input.adminNotes;
    }

    const updated = await this.feedbackModel.findByIdAndUpdate(
      new Types.ObjectId(id),
      { $set: update },
      { returnDocument: 'after' },
    ).lean();

    if (!updated) {
      throw new NotFoundException('Feedback record was not found.');
    }

    return {
      success: true,
      id: updated._id.toString(),
      status: updated.status,
      adminNotes: updated.adminNotes,
    };
  }

  async remove(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Feedback ID is invalid.');
    }

    const res = await this.feedbackModel.findByIdAndDelete(new Types.ObjectId(id)).lean();
    if (!res) {
      throw new NotFoundException('Feedback record was not found.');
    }

    return { success: true };
  }
}

