import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Types } from 'mongoose';
import {
  createDurableConnection,
  createDurableModelProxy,
  getMongoDOStub,
  runWithMongoDONamespace,
  setMongoDOStub,
} from './durable-model.js';

describe('DurableModelProxy & DurableConnection', () => {
  let mockStub: any;

  beforeEach(() => {
    mockStub = {
      execute: vi.fn(),
    };
    setMongoDOStub(mockStub);
  });

  afterEach(() => {
    setMongoDOStub(null);
  });

  it('builds and executes chained find query on DO stub', async () => {
    const fakeDocs = [
      {
        _id: { __type: 'ObjectId', value: new Types.ObjectId().toHexString() },
        title: 'Blog Post 1',
      },
    ];
    mockStub.execute.mockResolvedValue(fakeDocs);

    const blogModel = createDurableModelProxy('Blog');
    const result = await blogModel
      .find({ status: 'PUBLISHED' })
      .sort({ createdAt: -1 })
      .skip(10)
      .limit(5)
      .populate('categoryId')
      .lean();

    expect(mockStub.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'Blog',
        op: 'find',
        filter: { status: 'PUBLISHED' },
        options: expect.objectContaining({
          sort: { createdAt: -1 },
          skip: 10,
          limit: 5,
          populate: ['categoryId'],
          lean: true,
        }),
      }),
    );

    expect(result).toHaveLength(1);
    expect(result[0]._id).toBeInstanceOf(Types.ObjectId);
    expect(result[0].title).toBe('Blog Post 1');
  });

  it('executes create operation on DO stub', async () => {
    const newDocId = new Types.ObjectId();
    mockStub.execute.mockResolvedValue({
      _id: { __type: 'ObjectId', value: newDocId.toHexString() },
      name: 'John Doe',
      role: 'student',
    });

    const userModel = createDurableModelProxy('User');
    const created = await userModel.create({
      name: 'John Doe',
      email: 'john@example.com',
    });

    expect(mockStub.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'User',
        op: 'create',
        doc: {
          name: 'John Doe',
          email: 'john@example.com',
        },
      }),
    );

    expect(created._id).toBeInstanceOf(Types.ObjectId);
    expect(created._id.toHexString()).toBe(newDocId.toHexString());
    expect(created.name).toBe('John Doe');
  });

  it('executes updateOne operation on DO stub', async () => {
    mockStub.execute.mockResolvedValue({
      acknowledged: true,
      modifiedCount: 1,
    });

    const userModel = createDurableModelProxy('User');
    const res = await userModel.updateOne(
      { email: 'john@example.com' },
      { $set: { role: 'editor' } },
    );

    expect(mockStub.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'User',
        op: 'updateOne',
        filter: { email: 'john@example.com' },
        update: { $set: { role: 'editor' } },
      }),
    );
    expect(res.modifiedCount).toBe(1);
  });

  it('provides a durable connection with session and models proxy', async () => {
    const connection = createDurableConnection();
    expect(connection.readyState).toBe(1);

    expect(connection.supportsTransactions).toBe(false);
    await expect(connection.startSession()).rejects.toThrow('inside MongoDurableObject');

    const modelFromConnection = connection.model('Blog');
    expect(typeof modelFromConnection.find).toBe('function');

    const modelFromModelsProp = connection.models.Blog;
    expect(typeof modelFromModelsProp.find).toBe('function');
  });

  it('keeps each request Durable Object namespace isolated', async () => {
    setMongoDOStub(null);
    const first = { idFromName: vi.fn(() => 'first'), get: vi.fn() };
    const second = { idFromName: vi.fn(() => 'second'), get: vi.fn() };

    await Promise.all([
      runWithMongoDONamespace(first, async () => {
        await Promise.resolve();
        getMongoDOStub();
      }),
      runWithMongoDONamespace(second, async () => {
        await Promise.resolve();
        getMongoDOStub();
      }),
    ]);

    expect(first.get).toHaveBeenCalledWith('first');
    expect(second.get).toHaveBeenCalledWith('second');
  });
});
