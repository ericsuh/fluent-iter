import { isIterable, isAsyncIterable, Flatten, ItemOf } from './util';

/**
 * A wrapper for async iterables that supplies a fluent interface
 * for various convenience methods
 */
export class FluentAsyncIterable<T> implements AsyncIterable<T> {
    constructor(input: AsyncIterable<T> | (() => AsyncIterable<T>)) {
        if (isAsyncIterable(input)) {
            this.#input = input;
        } else if (typeof input === 'function') {
            this.#input = input();
        } else {
            throw new TypeError('input is not an async iterable');
        }
    }

    unwrap(): AsyncIterable<T> {
        return this.#input;
    }

    [Symbol.asyncIterator](): AsyncIterator<T> {
        return this.#input[Symbol.asyncIterator]();
    }

    toString(): string {
        return '[FluentAsyncIterable]';
    }

    async toArray(): Promise<Array<T>> {
        const arr = [];
        for await (const x of this.#input) {
            arr.push(x);
        }
        return arr;
    }

    async toSet(): Promise<Set<T>> {
        return new Set(await this.toArray());
    }

    map<U>(fn: (x: T) => U | Promise<U>): FluentAsyncIterable<U> {
        const a = this.#input;
        return new FluentAsyncIterable(async function* () {
            for await (const x of a) {
                yield await fn(x);
            }
        });
    }

    filter(predicate: (x: T) => boolean | Promise<boolean>): FluentAsyncIterable<T> {
        const a = this.#input;
        return new FluentAsyncIterable(async function* () {
            for await (const x of a) {
                if (await predicate(x)) {
                    yield x;
                }
            }
        });
    }

    where(predicate: (a: T) => boolean | Promise<boolean>): FluentAsyncIterable<T> {
        return this.filter(predicate);
    }

    forEach(fn: (x: T) => void | Promise<void>): FluentAsyncIterable<void> {
        return this.map(fn);
    }

    concat<U>(other: AsyncIterable<U>): FluentAsyncIterable<T | U> {
        const a = this.#input;
        return new FluentAsyncIterable(async function* () {
            for await (const x of a) {
                yield x;
            }
            for await (const x of other) {
                yield x;
            }
        });
    }

    flat(): FluentAsyncIterable<ItemOf<Flatten<T>>> {
        const a = this.#input;
        return new FluentAsyncIterable(async function* () {
            const stack: (AsyncIterator<T> | Iterator<T>)[] = [a[Symbol.asyncIterator]()];
            while (stack.length > 0) {
                const next = await stack[stack.length-1].next();
                if (next.done) {
                    stack.pop();
                } else if (isAsyncIterable(next.value)) {
                    stack.push(next.value[Symbol.asyncIterator]() as AsyncIterator<T, any, undefined>);
                } else if (isIterable(next.value)) {
                    stack.push(next.value[Symbol.iterator]() as Iterator<T, any, undefined>);
                } else {
                    yield next.value as ItemOf<Flatten<T>>;
                }
            }
        });
    }

    enumerate(): FluentAsyncIterable<[number, T]> {
        const a = this.#input;
        return new FluentAsyncIterable(async function* () {
            let i = 0;
            for await (const x of a) {
                yield [i, x];
                i += 1;
            }
        });
    }

    zip<U>(other: AsyncIterable<U>): FluentAsyncIterable<[T, U]> {
        const a = this.#input;
        return new FluentAsyncIterable(async function* () {
            const ai = a[Symbol.asyncIterator]();
            const bi = other[Symbol.asyncIterator]();
            while (true) {
                const [nexta, nextb] = await Promise.all([ai.next(), bi.next()]);
                if (nexta.done || nextb.done) {
                    return [nexta.value, nextb.value];
                } else {
                    yield [nexta.value, nextb.value];
                }
            }
        });
    }

    async all(predicate: (x: T) => boolean | Promise<boolean>): Promise<boolean> {
        for await (const x of this.#input) {
            if (!(await predicate(x))) {
                return false;
            }
        }
        return true;
    }

    async every(predicate: (x: T) => boolean | Promise<boolean>): Promise<boolean> {
        return await this.all(predicate);
    }

    async any(predicate: (x: T) => boolean | Promise<boolean>): Promise<boolean> {
        for await (const x of this.#input) {
            if (await predicate(x)) {
                return true;
            }
        }
        return false;
    }

    async some(predicate: (x: T) => boolean | Promise<boolean>): Promise<boolean> {
        return await this.any(predicate);
    }

    async join(sep: string = ','): Promise<string> {
        return (await this.map((x) => String(x)).toArray()).join(sep);
    }

    async reduce<U>(reducer: (a: U, x: T) => U | Promise<U>, initial: U): Promise<U> {
        let current = initial;
        for await (const x of this.#input) {
            current = await reducer(current, x);
        }
        return current;
    }

    #input: AsyncIterable<T>;
}
