import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Book, type BookDocument } from '../../core/schema/index.js';
import type { CurrentUser } from '../auth/auth.service.js';
import type { CreateBookInput, UpdateBookInput } from './dto/book.dto.js';

@Injectable()
export class BookService {
  constructor(
    @InjectModel(Book.name)
    private readonly bookModel: Model<BookDocument>,
  ) {}

  async listPublished() {
    const docs = await this.bookModel
      .find({ isArchived: false })
      .sort({ publishedAt: -1, createdAt: -1 })
      .lean();
    return docs.map((doc) => this.formatBook(doc));
  }

  async getPublished(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Book was not found.');
    }
    const doc = await this.bookModel
      .findOne({ _id: new Types.ObjectId(id), isArchived: false })
      .lean();

    if (!doc) {
      throw new NotFoundException('Book was not found.');
    }
    return this.formatBook(doc);
  }

  async listManageable(user: CurrentUser) {
    this.assertEditor(user);
    const filter =
      user.role === 'admin'
        ? {}
        : { entryBy: new Types.ObjectId(user.id) };

    const docs = await this.bookModel
      .find(filter)
      .sort({ updatedAt: -1 })
      .lean();
    return docs.map((doc) => this.formatBook(doc));
  }

  async getManageable(id: string, user: CurrentUser) {
    const doc = await this.findManageable(id, user);
    return this.formatBook(doc);
  }

  async create(input: CreateBookInput, user: CurrentUser) {
    this.assertEditor(user);
    const created = await this.bookModel.create({
      ...input,
      entryBy: new Types.ObjectId(user.id),
    });
    return this.formatBook(created.toObject());
  }

  async update(id: string, input: UpdateBookInput, user: CurrentUser) {
    await this.findManageable(id, user);
    const updated = await this.bookModel
      .findByIdAndUpdate(
        new Types.ObjectId(id),
        { $set: input },
        { new: true },
      )
      .lean();

    if (!updated) {
      throw new NotFoundException('Book was not found.');
    }
    return this.formatBook(updated);
  }

  async remove(id: string, user: CurrentUser) {
    await this.findManageable(id, user);
    await this.bookModel.findByIdAndDelete(new Types.ObjectId(id));
  }

  private async findManageable(id: string, user: CurrentUser) {
    this.assertEditor(user);
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Book was not found.');
    }
    const doc = await this.bookModel.findById(new Types.ObjectId(id)).lean();
    if (!doc) {
      throw new NotFoundException('Book was not found.');
    }
    if (user.role !== 'admin' && doc.entryBy.toString() !== user.id) {
      throw new ForbiddenException('You cannot manage this book.');
    }
    return doc;
  }

  private assertEditor(user: CurrentUser) {
    if (user.role === 'student') {
      throw new ForbiddenException('Editor access is required.');
    }
  }

  private formatBook(doc: any) {
    return {
      id: doc._id.toString(),
      _id: doc._id.toString(),
      title: doc.title,
      description: doc.description,
      coverImage: doc.coverImage,
      relatedCovers: doc.relatedCovers || [],
      displayPrice: doc.displayPrice,
      price: doc.price,
      discount: doc.discount,
      tags: doc.tags || [],
      publishedAt: doc.publishedAt,
      author: doc.author || null,
      originalPublisher: doc.originalPublisher || null,
      entryBy: doc.entryBy?.toString(),
      isArchived: doc.isArchived,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }
}
