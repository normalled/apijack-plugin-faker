import { describe, expect, test } from 'bun:test';
import { splitArgs } from '../src/split-args';

describe('splitArgs', () => {
    test('path only, no args', () => {
        expect(splitArgs('person.firstName')).toEqual({ path: 'person.firstName', rawArgs: [] });
    });

    test('path + single simple arg', () => {
        expect(splitArgs('number.int, 5')).toEqual({ path: 'number.int', rawArgs: ['5'] });
    });

    test('trims whitespace around path', () => {
        expect(splitArgs('  person.firstName  ')).toEqual({ path: 'person.firstName', rawArgs: [] });
    });

    test('path + object arg', () => {
        const r = splitArgs('number.int, {min: 1, max: 10}');
        expect(r.path).toBe('number.int');
        expect(r.rawArgs).toEqual(['{min: 1, max: 10}']);
    });

    test('path + nested object arg preserved as one token', () => {
        const r = splitArgs('person.fullName, {firstName: "A", nested: {x: 1}}');
        expect(r.rawArgs).toEqual(['{firstName: "A", nested: {x: 1}}']);
    });

    test('path + array arg', () => {
        const r = splitArgs('helpers.arrayElement, ["a", "b", "c"]');
        expect(r.rawArgs).toEqual(['["a", "b", "c"]']);
    });

    test('path + multiple args', () => {
        const r = splitArgs('x.y, {a: 1}, "second"');
        expect(r.rawArgs).toEqual(['{a: 1}', '"second"']);
    });

    test('respects commas inside strings', () => {
        const r = splitArgs('x.y, "a, b", {k: "c, d"}');
        expect(r.rawArgs).toEqual(['"a, b"', '{k: "c, d"}']);
    });

    test('respects escaped quotes', () => {
        const r = splitArgs('x.y, "has \\" quote", 1');
        expect(r.rawArgs).toEqual(['"has \\" quote"', '1']);
    });

    test('multi-line args', () => {
        const input = 'x.y, {\n  a: 1,\n  b: 2\n}';
        const r = splitArgs(input);
        expect(r.rawArgs).toEqual(['{\n  a: 1,\n  b: 2\n}']);
    });

    test('throws on unclosed brace', () => {
        expect(() => splitArgs('x.y, {a: 1')).toThrow(/unclosed/i);
    });
});
