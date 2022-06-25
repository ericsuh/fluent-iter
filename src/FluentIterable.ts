import { isIterable, Flatten, ItemOf } from './util';

/**
 * A wrapper for iterables that supplies a fluent interface for various convenience methods
 */
export class FluentIterable<T> implements Iterable<T>  {
    static keys<K extends string | number | symbol, V>(obj: Record<K, V>): FluentIterable<K> {
        return new FluentIterable(Object.keys(obj) as K[]);
    }

    static values<K extends string | number | symbol, V>(obj: Record<K, V>): FluentIterable<V> {
        return new FluentIterable(Object.values(obj));
    }

    static entries<K extends string | number | symbol, V>(obj: Record<K, V>): FluentIterable<[K, V]> {
        return new FluentIterable(Object.entries(obj) as [K, V][]);
    }

    constructor(input: Iterable<T> | (() => Iterable<T>)) {
        if (isIterable(input)) {
            this.#input = input;
        } else if (typeof input === 'function') {
            this.#input = input();
        } else {
            throw new TypeError('input is not an iterable');
        }
    }

    [Symbol.iterator](): Iterator<T> {
        return this.#input[Symbol.iterator]();
    }

    unwrap(): Iterable<T> {
        return this.#input;
    }

    toString(): string {
        return '[FluentIterable]';
    }

    toArray(): Array<T> {
        return Array.from(this.#input);
    }

    toSet(): Set<T> {
        return new Set(this.#input);
    }

    map<U>(fn: (x: T) => U): FluentIterable<U> {
        const a = this.#input;
        return new FluentIterable(function* () {
            for (const x of a) {
                yield fn(x);
            }
        });
    }

    filter(predicate: (x: T) => boolean): FluentIterable<T> {
        const a = this.#input;
        return new FluentIterable(function* () {
            for (const x of a) {
                if (predicate(x)) {
                    yield x;
                }
            }
        });
    }

    where(predicate: (x: T) => boolean): FluentIterable<T> {
        return this.filter(predicate);
    }

    concat<U>(other: Iterable<U>): FluentIterable<T | U> {
        const a = this.#input;
        return new FluentIterable(function* () {
            for (const x of a) {
                yield x;
            }
            for (const x of other) {
                yield x;
            }
        });
    }

    flat(): FluentIterable<ItemOf<Flatten<T>>> {
        const a = this.#input;
        return new FluentIterable(function* () {
            const stack = [a[Symbol.iterator]()];
            while (stack.length > 0) {
                const next = stack[stack.length-1].next();
                if (next.done) {
                    stack.pop();
                } else if (isIterable(next.value)) {
                    stack.push(next.value[Symbol.iterator]() as Iterator<T, any, undefined>);
                } else {
                    yield next.value as ItemOf<Flatten<T>>;
                }
            }
        });
    }

    enumerate(): FluentIterable<[number, T]> {
        const a = this.#input;
        return new FluentIterable(function* () {
            let i = 0;
            for (const x of a) {
                yield [i, x];
                i += 1;
            }
        });
    }

    zip<U>(other: Iterable<U>): FluentIterable<[T, U]> {
        const a = this.#input;
        return new FluentIterable(function* () {
            const ai = a[Symbol.iterator]();
            const bi = other[Symbol.iterator]();
            while (true) {
                const nexta = ai.next();
                const nextb = bi.next();
                if (nexta.done || nextb.done) {
                    return [nexta.value, nextb.value];
                } else {
                    yield [nexta.value, nextb.value];
                }
            }
        });
    }

    forEach(fn: (x: T) => void): FluentIterable<void> {
        return this.map(fn);
    }

    all(predicate: (x: T) => boolean): boolean {
        for (const x of this.#input) {
            if (!predicate(x)) {
                return false;
            }
        }
        return true;
    }

    every(predicate: (x: T) => boolean): boolean {
        return this.all(predicate);
    }

    any(predicate: (x: T) => boolean): boolean {
        for (const x of this.#input) {
            if (predicate(x)) {
                return true;
            }
        }
        return false;
    }

    some(predicate: (x: T) => boolean): boolean {
        return this.any(predicate);
    }

    join(sep: string = ','): string {
        return this.map((x) => String(x)).toArray().join(sep);
    }

    reduce<U>(reducer: (acc: U, x: T) => U, initial: U): U {
        let current = initial;
        for (const x of this.#input) {
            current = reducer(current, x);
        }
        return current;
    }

    #input: Iterable<T>;
}
