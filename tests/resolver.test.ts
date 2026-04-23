import { describe, expect, test } from 'bun:test';
import { Faker, en } from '@faker-js/faker';
import { buildFakerResolver } from '../src/resolver';

function mkInstance(seed?: number): Faker {
    const f = new Faker({ locale: en });
    if (seed != null) f.seed(seed);
    return f;
}

function mkHelpers(vars: Record<string, unknown> = {}) {
    return {
        resolve: (v: string) => {
            const m = v.match(/^\$([a-zA-Z_][a-zA-Z0-9_.]*)$/);
            if (m) {
                const segs = m[1]!.split('.');
                let c: unknown = vars;
                for (const s of segs) {
                    if (c == null || typeof c !== 'object') return undefined;
                    c = (c as Record<string, unknown>)[s];
                }
                return c;
            }
            return v.replace(/\$(\w+)/g, (_m, n: string) => String(vars[n] ?? ''));
        },
    };
}

describe('_faker resolver', () => {
    test('person.firstName returns a string', () => {
        const fn = buildFakerResolver(mkInstance(42));
        const out = fn('person.firstName', mkHelpers());
        expect(typeof out).toBe('string');
        expect((out as string).length).toBeGreaterThan(0);
    });

    test('string.alpha with options returns sized string', () => {
        const fn = buildFakerResolver(mkInstance(42));
        const out = fn("string.alpha, {length: 10, casing: 'upper'}", mkHelpers());
        expect(out).toMatch(/^[A-Z]{10}$/);
    });

    test('helpers.arrayElement returns a member', () => {
        const fn = buildFakerResolver(mkInstance(42));
        const out = fn('helpers.arrayElement, ["a", "b", "c"]', mkHelpers());
        expect(['a', 'b', 'c']).toContain(out);
    });

    test('number.int with min/max returns value in range', () => {
        const fn = buildFakerResolver(mkInstance(42));
        for (let i = 0; i < 20; i++) {
            const out = fn('number.int, {min: 5, max: 10}', mkHelpers());
            expect(out).toBeGreaterThanOrEqual(5);
            expect(out).toBeLessThanOrEqual(10);
        }
    });

    test('seed determinism: same seed → same output', () => {
        const fn1 = buildFakerResolver(mkInstance(123));
        const fn2 = buildFakerResolver(mkInstance(123));
        expect(fn1('person.firstName', mkHelpers())).toBe(fn2('person.firstName', mkHelpers()));
    });

    test('$ref substitution: quoted exact-match produces native type', () => {
        const fn = buildFakerResolver(mkInstance(42));
        const out = fn('number.int, {min: 1, max: "$maxVal"}', mkHelpers({ maxVal: 100 }));
        expect(out).toBeGreaterThanOrEqual(1);
        expect(out).toBeLessThanOrEqual(100);
    });

    test('throws on empty args', () => {
        const fn = buildFakerResolver(mkInstance(42));
        expect(() => fn('', mkHelpers())).toThrow(/path/);
    });

    test('throws on invalid path', () => {
        const fn = buildFakerResolver(mkInstance(42));
        expect(() => fn('nonexistent.path', mkHelpers())).toThrow(/not found/);
    });

    test('throws when path is a namespace', () => {
        const fn = buildFakerResolver(mkInstance(42));
        expect(() => fn('person', mkHelpers())).toThrow(/not a function/);
    });

    test('path-only call with no args works for zero-arg faker functions', () => {
        const fn = buildFakerResolver(mkInstance(42));
        expect(typeof fn('person.fullName', mkHelpers())).toBe('string');
    });
});
