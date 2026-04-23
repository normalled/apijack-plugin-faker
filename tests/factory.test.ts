import { describe, expect, test } from 'bun:test';
import faker from '../src/index';

describe('faker() factory', () => {
    test('returns plugin with name "faker" and version', () => {
        const p = faker();
        expect(p.name).toBe('faker');
        expect(p.version).toBe('1.0.0');
        expect(p.__package?.name).toBe('@normalled/apijack-plugin-faker');
    });

    test('createRoutineResolvers returns an object with _faker', () => {
        const p = faker();
        const resolvers = p.createRoutineResolvers!({});
        expect(resolvers._faker).toBeDefined();
        expect(typeof resolvers._faker).toBe('function');
    });

    test('each createRoutineResolvers call produces an independent instance', () => {
        const p = faker();
        const helpers = { resolve: (s: string) => s };
        const r1 = p.createRoutineResolvers!({ seed: 1 });
        const r2 = p.createRoutineResolvers!({ seed: 1 });
        // Two independent instances with same seed produce equal output
        expect(r1._faker!('person.firstName', helpers)).toBe(
            r2._faker!('person.firstName', helpers),
        );
        // Different seeds should produce different output
        const r3 = p.createRoutineResolvers!({ seed: 999 });
        expect(r1._faker!('person.firstName', helpers)).not.toBe(
            r3._faker!('person.firstName', helpers),
        );
    });

    test('seed from routine opts overrides factory default', () => {
        const p = faker({ seed: 1 });
        const helpers = { resolve: (s: string) => s };
        const defaultSeed = p.createRoutineResolvers!({});
        const overridden = p.createRoutineResolvers!({ seed: 2 });
        expect(defaultSeed._faker!('person.firstName', helpers)).not.toBe(
            overridden._faker!('person.firstName', helpers),
        );
    });

    test('locale option switches language', () => {
        const p = faker();
        const helpers = { resolve: (s: string) => s };
        const en = p.createRoutineResolvers!({ locale: 'en', seed: 42 });
        const de = p.createRoutineResolvers!({ locale: 'de', seed: 42 });
        const nameEn = en._faker!('person.firstName', helpers);
        const nameDe = de._faker!('person.firstName', helpers);
        // Different locales produce different names even with same seed
        expect(nameEn).not.toBe(nameDe);
    });

    test('throws on unknown locale', () => {
        const p = faker();
        expect(() => p.createRoutineResolvers!({ locale: 'xx-ZZ' })).toThrow(/locale/);
    });
});
