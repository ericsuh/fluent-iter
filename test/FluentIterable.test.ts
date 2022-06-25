import { FluentIterable } from '../src/FluentIterable';

describe("FluentIterable", () => {
    test('toArray()', () => {
        const i = new FluentIterable(function *() {
            yield 1;
            yield 2;
            yield 7;
        });
        expect(i.toArray()).toEqual([1,2,7]);
    });
});
