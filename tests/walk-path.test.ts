import { describe, expect, test } from 'bun:test';
import { walkPath } from '../src/walk-path';
import { FakerPluginError } from '../src/errors';

function mkInstance() {
    return {
        person: {
            firstName: function(this: any) { return 'Alice'; },
            fullName: function(this: any) { return 'Alice Smith'; },
        },
        number: {
            int: function(this: any, opts?: { min: number; max: number }) {
                return opts ? (opts.min + opts.max) / 2 : 0;
            },
        },
        helpers: {
            arrayElement: function(this: any, arr: unknown[]) { return arr[0]; },
        },
    };
}

describe('walkPath', () => {
    test('returns bound function at single-level path', () => {
        const fn = walkPath(mkInstance(), 'person.firstName');
        expect(fn()).toBe('Alice');
    });

    test('returns bound function at nested path', () => {
        const fn = walkPath(mkInstance(), 'helpers.arrayElement');
        expect(fn(['x', 'y'])).toBe('x');
    });

    test('throws FakerPluginError on missing segment', () => {
        expect(() => walkPath(mkInstance(), 'person.unknown')).toThrow(FakerPluginError);
        expect(() => walkPath(mkInstance(), 'person.unknown')).toThrow(/unknown/);
    });

    test('throws with full path in error on deep miss', () => {
        try {
            walkPath(mkInstance(), 'foo.bar.baz');
            expect.unreachable('should have thrown');
        } catch (e) {
            expect((e as Error).message).toContain('foo.bar.baz');
        }
    });

    test('throws when terminal is not a function', () => {
        expect(() => walkPath(mkInstance(), 'person')).toThrow(/not a function/);
    });

    test('throws on empty path', () => {
        expect(() => walkPath(mkInstance(), '')).toThrow(/empty/);
    });

    test('binds `this` to parent object', () => {
        // Given a parent object with a method that relies on `this`
        const obj = {
            ns: {
                getter: function(this: { x: number }) { return this.x; },
                x: 42,
            },
        };
        const fn = walkPath(obj, 'ns.getter');
        expect(fn()).toBe(42);
    });
});
