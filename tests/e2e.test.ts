import { describe, expect, test } from 'bun:test';
import faker from '../src/index';

function makeRoutineCtx(vars: Record<string, unknown>) {
    const resolve = (v: string): unknown => {
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
    };
    return { resolve };
}

describe('faker plugin e2e', () => {
    test('routine-scoped seeding produces reproducible outputs', () => {
        const p = faker();
        const resolvers1 = p.createRoutineResolvers!({ seed: 7 });
        const resolvers2 = p.createRoutineResolvers!({ seed: 7 });
        const ctx = makeRoutineCtx({});
        const a = resolvers1._faker!('person.fullName', ctx);
        const b = resolvers2._faker!('person.fullName', ctx);
        expect(a).toBe(b);
    });

    test('$ref substitution in nested object args', () => {
        const p = faker();
        const resolvers = p.createRoutineResolvers!({ seed: 10 });
        const ctx = makeRoutineCtx({ userFirst: 'Jordan' });
        const email = resolvers._faker!(
            'internet.email, {firstName: "$userFirst"}',
            ctx,
        );
        expect(String(email)).toMatch(/jordan/i);
    });

    test('array arg with $ref substitution', () => {
        const p = faker();
        const resolvers = p.createRoutineResolvers!({ seed: 5 });
        const ctx = makeRoutineCtx({ pick: 'green' });
        const picked = resolvers._faker!(
            'helpers.arrayElement, ["red", "blue", "$pick"]',
            ctx,
        );
        expect(['red', 'blue', 'green']).toContain(picked);
    });

    test('routines are isolated: two concurrent-style invocations with different seeds stay separate', () => {
        const p = faker();
        const r1 = p.createRoutineResolvers!({ seed: 1 });
        const r2 = p.createRoutineResolvers!({ seed: 2 });
        const ctx = makeRoutineCtx({});
        const a1 = r1._faker!('person.firstName', ctx);
        const b1 = r2._faker!('person.firstName', ctx);
        const a2 = r1._faker!('person.firstName', ctx);
        const b2 = r2._faker!('person.firstName', ctx);
        expect(a1).not.toBe(a2);
        expect(b1).not.toBe(b2);
        expect(a1).not.toBe(b1);
    });
});
