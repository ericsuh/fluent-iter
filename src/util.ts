export function isIterable<T>(x: unknown): x is Iterable<T> {
    return Boolean(x) && typeof (x as {[Symbol.iterator]: unknown})[Symbol.iterator] === 'function';
}

export function isAsyncIterable<T>(x: unknown): x is AsyncIterable<T> {
    return Boolean(x) && typeof (x as {[Symbol.asyncIterator]: unknown})[Symbol.asyncIterator] === 'function';
}

export type Flatten<I> = I extends Iterable<infer T> ? Iterable<Flatten<T>> : I;
export type ItemOf<I> = I extends Iterable<infer T> ? T : I;
