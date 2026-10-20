import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { createHmac } from 'node:crypto';
import type { Model } from 'mongoose';
import { Types } from 'mongoose';
import { env } from '../../core/config/env.js';
import {
  type BlogDocument,
  Blog,
  type CommentDocument,
  Comment,
  type CommentStatus,
} from '../../core/schema/index.js';
import type { CurrentUser } from '../auth/auth.service.js';
import type { CreateCommentInput, ModerateCommentInput } from './dto/comment.dto.js';

@Injectable()
export class CommentsService {
  constructor(
    @InjectModel(Blog.name)
    private readonly blogModel: Model<BlogDocument>,
    @InjectModel(Comment.name)
    private readonly commentModel: Model<CommentDocument>,
  ) {}

  async listPublished(slug: string, language?: 'HINGLISH' | 'ENGLISH') {
    const blog = await this.findPublishedBlog(slug, language);
    const blogIds = await this.groupBlogIds(blog);
    const comments = await this.commentModel
      .find({ blogId: { $in: blogIds }, parentCommentId: null, status: 'APPROVED' })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    const parentIds = comments.map((comment) => comment._id);
    const replies = parentIds.length
      ? await this.commentModel
          .find({ parentCommentId: { $in: parentIds }, status: 'APPROVED' })
          .sort({ createdAt: 1 })
          .lean()
      : [];

    const repliesByParent = new Map<string, any[]>();
    for (const reply of replies) {
      const key = reply.parentCommentId!.toString();
      repliesByParent.set(key, [...(repliesByParent.get(key) || []), this.publicComment(reply)]);
    }

    return {
      comments: comments.map((comment) => ({
        ...this.publicComment(comment),
        replies: repliesByParent.get(comment._id.toString()) || [],
      })),
    };
  }

  async create(
    slug: string,
    language: 'HINGLISH' | 'ENGLISH' | undefined,
    input: CreateCommentInput,
    user: CurrentUser | null,
    clientIp: string | null,
  ) {
    const blog = await this.findPublishedBlog(slug, language);
    const threadBlogIds = await this.groupBlogIds(blog);
    const parentCommentId = await this.resolveParentCommentId(input.parentCommentId, threadBlogIds);

    if (user) {
      await this.assertUserRateLimit(user.id);
    } else if (!input.authorName) {
      throw new BadRequestException('A name is required for a guest comment.');
    }

    const payload: Record<string, unknown> = {
      blogId: blog._id,
      parentCommentId,
      authorUserId: user ? new Types.ObjectId(user.id) : null,
      authorName: user?.name || input.authorName,
      content: input.content,
      status: 'APPROVED',
    };

    if (!user) {
      payload.anonymousIpHash = this.hashGuestIp(clientIp);
    }

    try {
      const comment = await this.commentModel.create(payload);
      return { comment: this.publicComment(comment), message: 'Your comment has been posted.' };
    } catch (error: any) {
      if (error?.code === 11000 && !user) {
        throw new ConflictException('You have already posted a guest comment. Please log in to comment again.');
      }
      throw error;
    }
  }

  async listForModeration(status?: CommentStatus, blogId?: string, translationGroupId?: string) {
    if (blogId && !Types.ObjectId.isValid(blogId)) throw new BadRequestException('Blog was not found.');
    const groupedIds = translationGroupId
      ? await this.blogModel.distinct('_id', { translationGroupId })
      : null;
    const filter: Record<string, unknown> = {
      ...(status ? { status } : {}),
      ...(blogId ? { blogId: new Types.ObjectId(blogId) } : {}),
      ...(groupedIds ? { blogId: { $in: groupedIds } } : {}),
    };
    const comments = await this.commentModel
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(100)
      .populate('blogId', '_id title slug')
      .lean();
    return { comments: comments.map((comment) => this.moderationComment(comment)) };
  }

  async listArticlesWithCounts(search?: string) {
    const match = search?.trim()
      ? { $match: { $or: [{ 'blog.title': { $regex: search.trim(), $options: 'i' } }, { 'blog.slug': { $regex: search.trim(), $options: 'i' } }] } }
      : null;
    const rows = await this.commentModel.aggregate([
      { $lookup: { from: 'blogs', localField: 'blogId', foreignField: '_id', as: 'blog' } },
      { $unwind: '$blog' },
      { $group: {
        _id: { $ifNull: ['$blog.translationGroupId', { $toString: '$blogId' }] },
        blog: { $first: '$blog' },
        total: { $sum: 1 },
        pending: { $sum: { $cond: [{ $eq: ['$status', 'PENDING'] }, 1, 0] } },
        approved: { $sum: { $cond: [{ $eq: ['$status', 'APPROVED'] }, 1, 0] } },
        rejected: { $sum: { $cond: [{ $eq: ['$status', 'REJECTED'] }, 1, 0] } },
        spam: { $sum: { $cond: [{ $eq: ['$status', 'SPAM'] }, 1, 0] } },
        latestCommentAt: { $max: '$createdAt' },
      } },
      ...(match ? [match] : []),
      { $sort: { pending: -1, latestCommentAt: -1 } },
      { $limit: 100 },
      { $project: { _id: 0, id: { $toString: '$_id' }, translationGroupId: { $ifNull: ['$blog.translationGroupId', null] }, title: '$blog.title', slug: '$blog.slug', total: 1, pending: 1, approved: 1, rejected: 1, spam: 1, latestCommentAt: 1 } },
    ]).exec();
    return { articles: rows };
  }

  async moderate(id: string, input: ModerateCommentInput, user: CurrentUser) {
    this.assertModerator(user);
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Comment was not found.');
    const comment = await this.commentModel.findByIdAndUpdate(
      id,
      { $set: { status: input.status, moderatedByUserId: new Types.ObjectId(user.id), moderatedAt: new Date() } },
      { new: true },
    );
    if (!comment) throw new NotFoundException('Comment was not found.');
    return { comment: this.moderationComment(comment) };
  }

  async remove(id: string, user: CurrentUser) {
    this.assertModerator(user);
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Comment was not found.');
    const commentId = new Types.ObjectId(id);
    const result = await this.commentModel.deleteMany({
      $or: [{ _id: commentId }, { parentCommentId: commentId }],
    });
    if (result.deletedCount === 0) throw new NotFoundException('Comment was not found.');
  }

  private async findPublishedBlog(slug: string, language?: 'HINGLISH' | 'ENGLISH') {
    const cleanSlug = slug.trim().toLowerCase().replace(/-(english|hinglish)$/i, '');
    const publishedCondition: any = {
      slug: { $in: [slug.trim().toLowerCase(), cleanSlug] },
      $or: [
        { status: 'PUBLISHED' },
        { status: 'SCHEDULED', scheduledAt: { $lte: new Date() } },
      ],
    };
    let blog = await this.blogModel.findOne({
      ...publishedCondition,
      ...(language ? { language } : {}),
    });
    // Match the article route: show comments for the available language when a translation is absent.
    if (!blog && language) blog = await this.blogModel.findOne(publishedCondition);
    if (!blog) throw new NotFoundException('Blog was not found.');
    return blog;
  }

  private async groupBlogIds(blog: any) {
    if (!blog.translationGroupId) return [blog._id];
    return this.blogModel.distinct('_id', { translationGroupId: blog.translationGroupId });
  }

  private async resolveParentCommentId(parentCommentId: string | null | undefined, blogIds: Types.ObjectId[]) {
    if (!parentCommentId) return null;
    if (!Types.ObjectId.isValid(parentCommentId)) throw new BadRequestException('Parent comment was not found.');
    const parent = await this.commentModel.exists({
      _id: new Types.ObjectId(parentCommentId),
      blogId: { $in: blogIds },
      parentCommentId: null,
    });
    if (!parent) throw new BadRequestException('Replies can only be added to a top-level comment.');
    return new Types.ObjectId(parentCommentId);
  }

  private async assertUserRateLimit(userId: string) {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60_000);
    const recentCount = await this.commentModel.countDocuments({
      authorUserId: new Types.ObjectId(userId),
      createdAt: { $gte: fiveMinutesAgo },
    });
    if (recentCount >= 5) {
      throw new HttpException('Please wait before posting another comment.', HttpStatus.TOO_MANY_REQUESTS);
    }
  }

  private hashGuestIp(clientIp: string | null) {
    if (!clientIp) throw new ServiceUnavailableException('Your network address could not be verified. Please log in to comment.');
    if (!env.COMMENT_IP_HASH_SECRET) {
      throw new ServiceUnavailableException('Guest comments are not configured. Please log in to comment.');
    }
    return createHmac('sha256', env.COMMENT_IP_HASH_SECRET).update(clientIp).digest('hex');
  }

  private assertModerator(user: CurrentUser) {
    if (user.role !== 'admin' && user.role !== 'editor') {
      throw new ForbiddenException('Editor access is required.');
    }
  }

  private publicComment(comment: any) {
    return {
      id: comment._id.toString(),
      parentCommentId: comment.parentCommentId?.toString() ?? null,
      authorName: comment.authorName,
      content: comment.content,
      createdAt: comment.createdAt,
    };
  }

  private moderationComment(comment: any) {
    return {
      ...this.publicComment(comment),
      status: comment.status,
      blog: comment.blogId && typeof comment.blogId === 'object' && 'title' in comment.blogId
        ? { id: comment.blogId._id.toString(), title: comment.blogId.title, slug: comment.blogId.slug }
        : null,
      moderatedAt: comment.moderatedAt ?? null,
    };
  }
}
