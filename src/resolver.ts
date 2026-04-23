import type { Faker } from '@faker-js/faker';
import { walkPath } from './walk-path';
import { splitArgs } from './split-args';
import { parseAndSubstitute, type Helpers } from './parse-and-substitute';
import { FakerPluginError } from './errors';

export type FakerResolver = (argsStr: string | undefined, helpers: Helpers | undefined) => unknown;

export function buildFakerResolver(instance: Faker): FakerResolver {
    return (argsStr, helpers) => {
        if (!argsStr) throw new FakerPluginError('_faker requires at least a path argument');
        if (!helpers) throw new FakerPluginError('resolver helpers missing');
        const { path, rawArgs } = splitArgs(argsStr);
        const fn = walkPath(instance, path);
        const parsed = rawArgs.map(raw => parseAndSubstitute(raw, helpers));
        return fn(...parsed);
    };
}
