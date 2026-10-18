import { Types } from 'mongoose';

export function serializeForDO(val: any): any {
  if (val === null || val === undefined) return val;
  if (
    val instanceof Types.ObjectId ||
    val?._bsontype === 'ObjectID' ||
    (typeof val?.toHexString === 'function' && typeof val?.equals === 'function')
  ) {
    return { __type: 'ObjectId', value: val.toHexString() };
  }
  if (val instanceof RegExp) {
    return { __type: 'RegExp', source: val.source, flags: val.flags };
  }
  if (val instanceof Date) {
    return val;
  }
  if (Array.isArray(val)) {
    return val.map(serializeForDO);
  }
  if (typeof val === 'object') {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(val)) {
      out[k] = serializeForDO(v);
    }
    return out;
  }
  return val;
}

export function deserializeInDO(val: any): any {
  if (val === null || val === undefined) return val;
  if (typeof val === 'object') {
    if (val.__type === 'ObjectId' && typeof val.value === 'string') {
      return new Types.ObjectId(val.value);
    }
    if (val.__type === 'RegExp' && typeof val.source === 'string') {
      return new RegExp(val.source, val.flags);
    }
    if (Array.isArray(val)) {
      return val.map(deserializeInDO);
    }
    if (val instanceof Date) {
      return val;
    }
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(val)) {
      out[k] = deserializeInDO(v);
    }
    return out;
  }
  return val;
}

export function serializeResultFromDO(val: any): any {
  if (val === null || val === undefined) return val;
  if (typeof val?.toObject === 'function') {
    val = val.toObject();
  }
  if (
    val instanceof Types.ObjectId ||
    val?._bsontype === 'ObjectID' ||
    (typeof val?.toHexString === 'function' && typeof val?.equals === 'function')
  ) {
    return { __type: 'ObjectId', value: val.toHexString() };
  }
  if (val instanceof RegExp) {
    return { __type: 'RegExp', source: val.source, flags: val.flags };
  }
  if (val instanceof Date) {
    return val;
  }
  if (Array.isArray(val)) {
    return val.map(serializeResultFromDO);
  }
  if (typeof val === 'object') {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(val)) {
      out[k] = serializeResultFromDO(v);
    }
    return out;
  }
  return val;
}

export function deserializeResultInWorker(val: any): any {
  if (val === null || val === undefined) return val;
  if (typeof val === 'object') {
    if (val.__type === 'ObjectId' && typeof val.value === 'string') {
      return new Types.ObjectId(val.value);
    }
    if (val.__type === 'RegExp' && typeof val.source === 'string') {
      return new RegExp(val.source, val.flags);
    }
    if (Array.isArray(val)) {
      return val.map(deserializeResultInWorker);
    }
    if (val instanceof Date) {
      return val;
    }
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(val)) {
      out[k] = deserializeResultInWorker(v);
    }
    if (out._id && typeof out.toObject !== 'function') {
      Object.defineProperty(out, 'toObject', {
        value: function () {
          return { ...this };
        },
        enumerable: false,
        configurable: true,
      });
    }
    return out;
  }
  return val;
}
