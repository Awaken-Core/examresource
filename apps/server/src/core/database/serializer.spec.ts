import { describe, expect, it } from 'vitest';
import { Types } from 'mongoose';
import {
  deserializeInDO,
  deserializeResultInWorker,
  serializeForDO,
  serializeResultFromDO,
} from './serializer.js';

describe('DO Serializer', () => {
  it('serializes and deserializes Types.ObjectId correctly', () => {
    const id = new Types.ObjectId();
    const serialized = serializeForDO(id);

    expect(serialized).toEqual({
      __type: 'ObjectId',
      value: id.toHexString(),
    });

    const deserialized = deserializeInDO(serialized);
    expect(deserialized).toBeInstanceOf(Types.ObjectId);
    expect(deserialized.toHexString()).toBe(id.toHexString());
  });

  it('serializes and deserializes RegExp queries', () => {
    const regex = new RegExp('hello', 'i');
    const query = { title: regex };
    const serialized = serializeForDO(query);

    expect(serialized.title).toEqual({
      __type: 'RegExp',
      source: 'hello',
      flags: 'i',
    });

    const deserialized = deserializeInDO(serialized);
    expect(deserialized.title).toBeInstanceOf(RegExp);
    expect(deserialized.title.test('HELLO')).toBe(true);
    expect(deserialized.title.test('world')).toBe(false);
  });

  it('handles complex nested query with $in and ObjectIds', () => {
    const id1 = new Types.ObjectId();
    const id2 = new Types.ObjectId();
    const query = {
      _id: { $in: [id1, id2] },
      status: 'PUBLISHED',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    };

    const serialized = serializeForDO(query);
    expect(serialized._id.$in[0]).toEqual({ __type: 'ObjectId', value: id1.toHexString() });
    expect(serialized._id.$in[1]).toEqual({ __type: 'ObjectId', value: id2.toHexString() });

    const deserialized = deserializeInDO(serialized);
    expect(deserialized._id.$in[0].toHexString()).toBe(id1.toHexString());
    expect(deserialized._id.$in[1].toHexString()).toBe(id2.toHexString());
    expect(deserialized.status).toBe('PUBLISHED');
  });

  it('attaches toObject method to deserialized worker document if missing', () => {
    const rawResult = {
      _id: new Types.ObjectId(),
      name: 'Test Name',
      role: 'student',
    };

    const serialized = serializeResultFromDO(rawResult);
    const inWorker = deserializeResultInWorker(serialized);

    expect(inWorker._id).toBeInstanceOf(Types.ObjectId);
    expect(inWorker._id.toHexString()).toBe(rawResult._id.toHexString());
    expect(typeof inWorker.toObject).toBe('function');
    expect(inWorker.toObject()).toEqual(expect.objectContaining({ name: 'Test Name' }));
  });
});
