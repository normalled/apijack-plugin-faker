import { Faker, allLocales } from '@faker-js/faker';
import type { ApijackPlugin, CustomResolver } from '@apijack/core';
import { buildFakerResolver } from './resolver';
import { FakerPluginError } from './errors';

export interface FakerOptions {
    seed?: number;
    locale?: string;
}

function resolveLocale(localeKey: string | undefined): typeof allLocales[keyof typeof allLocales] {
    const key = localeKey ?? 'en';
    const locale = (allLocales as Record<string, unknown>)[key];
    if (!locale) {
        throw new FakerPluginError(`unknown locale "${key}"`);
    }
    return locale as typeof allLocales[keyof typeof allLocales];
}

export default function faker(defaults: FakerOptions = {}): ApijackPlugin {
    return {
        name: 'faker',
        version: '1.0.0',
        __package: { name: '@normalled/apijack-plugin-faker' },
        createRoutineResolvers: (opts: unknown): Record<string, CustomResolver> => {
            const merged: FakerOptions = { ...defaults, ...((opts as FakerOptions) ?? {}) };
            const instance = new Faker({ locale: resolveLocale(merged.locale) });
            if (merged.seed != null) instance.seed(merged.seed);
            return { _faker: buildFakerResolver(instance) as unknown as CustomResolver };
        },
    };
}

export { FakerPluginError } from './errors';
