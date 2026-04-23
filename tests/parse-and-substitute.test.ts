import { describe, expect, test } from 'bun:test';
import { parseAndSubstitute } from '../src/parse-and-substitute';

function mkHelpers(vars: Record<string, unknown>) {
    return {
        resolve: (v: string) => {
            const match = v.match(/^\$([a-zA-Z_][a-zA-Z0-9_.]*)$/);
            if (match) {
                const segments = match[1]!.split('.');
                let current: unknown = vars;
                for (const seg of segments) {
                    if (current == null || typeof current !== 'object') return undefined;
                    current = (current as Record<string, unknown>)[seg];
                }
                return current;
            }
            // Simple interpolation: substring replace
            return v.replace(/\$([a-zA-Z_][a-zA-Z0-9_]*)/g, (_m, n: string) => String(vars[n] ?? ''));
        },
    };
}

describe('parseAndSubstitute', () => {
    test('parses number literal', () => {
        expect(parseAndSubstitute('5', mkHelpers({}))).toBe(5);
    });

    test('parses string literal (JSON5 syntax)', () => {
        expect(parseAndSubstitute("'hello'", mkHelpers({}))).toBe('hello');
        expect(parseAndSubstitute('"hello"', mkHelpers({}))).toBe('hello');
    });

    test('parses array literal', () => {
        expect(parseAndSubstitute('[1, 2, 3]', mkHelpers({}))).toEqual([1, 2, 3]);
    });

    test('parses object literal with unquoted keys', () => {
        expect(parseAndSubstitute('{a: 1, b: 2}', mkHelpers({}))).toEqual({ a: 1, b: 2 });
    });

    test('parses multi-line object literal', () => {
        const input = '{\n  a: 1,\n  b: {c: 2}\n}';
        expect(parseAndSubstitute(input, mkHelpers({}))).toEqual({ a: 1, b: { c: 2 } });
    });

    test('substitutes exact-match $ref with native value', () => {
        const vars = { count: 42, label: 'hi', obj: { x: 1 } };
        expect(parseAndSubstitute('"$count"', mkHelpers(vars))).toBe(42);
        expect(parseAndSubstitute('"$label"', mkHelpers(vars))).toBe('hi');
        expect(parseAndSubstitute('"$obj"', mkHelpers(vars))).toEqual({ x: 1 });
    });

    test('interpolated string $ref produces string', () => {
        expect(parseAndSubstitute('"prefix-$label-suffix"', mkHelpers({ label: 'hi' }))).toBe(
            'prefix-hi-suffix',
        );
    });

    test('substitutes $ref inside nested object', () => {
        const vars = { userId: 7 };
        const result = parseAndSubstitute('{a: {b: "$userId"}}', mkHelpers(vars));
        expect(result).toEqual({ a: { b: 7 } });
    });

    test('substitutes $ref inside array element', () => {
        const vars = { pick: 'red' };
        const result = parseAndSubstitute('["x", "$pick"]', mkHelpers(vars));
        expect(result).toEqual(['x', 'red']);
    });

    test('preserves non-$ strings unchanged', () => {
        expect(parseAndSubstitute('"hello world"', mkHelpers({}))).toBe('hello world');
    });

    test('supports $ref with dotted path', () => {
        const vars = { user: { name: 'Bob' } };
        expect(parseAndSubstitute('"$user.name"', mkHelpers(vars))).toBe('Bob');
    });

    test('throws FakerPluginError on invalid JSON5', () => {
        expect(() => parseAndSubstitute('{a:', mkHelpers({}))).toThrow(/json5|parse/i);
    });
});
