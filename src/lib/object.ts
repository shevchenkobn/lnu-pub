import { t } from './types';

export function* objectKeys<T extends object>(object: T): Generator<Extract<keyof T, string>, void, unknown> {
  for (const key in object) {
    if (object.hasOwnProperty(key)) {
      yield key;
    }
  }
}

export function* objectValues<T extends object>(
  object: T
): Generator<Extract<T[Extract<keyof T, string>], string>, void, unknown> {
  for (const key in object) {
    if (object.hasOwnProperty(key)) {
      yield (object as any)[key];
    }
  }
}

export function* objectEntries<T extends object>(
  object: T
): Generator<[Extract<keyof T, string>, T[Extract<keyof T, string>]], void, unknown> {
  for (const key in object) {
    if (object.hasOwnProperty(key)) {
      yield t(key, (object as any)[key]);
    }
  }
}
