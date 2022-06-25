import { FluentAsyncIterable } from '../src/FluentAsyncIterable';

describe("FluentAsyncIterable", () => {
    test('toArray()', async () => {
        const i = new FluentAsyncIterable(async function *() {
            yield 1;
            yield 2;
            yield 7;
        });
        expect(await i.toArray()).toEqual([1,2,7]);
    });
});
