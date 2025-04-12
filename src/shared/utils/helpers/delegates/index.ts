export type Action<T extends any[]> = (...arg: T) => void;

export type Func<T extends any[], TResult> = (...args: T) => TResult;

export type Predicate<T> = (arg: T) => boolean;
