import { Ref } from 'vue';
import { PartialDeep } from 'type-fest';

export type MaybeRef<T> = T | Ref<T>;

export type MaybeRefs<T> = {
  [K in keyof T]: MaybeRef<T[K]>;
};

export type NonUndefined<T> = T extends undefined ? never : T;

export type DeepPartial<T> = PartialDeep<T>;
