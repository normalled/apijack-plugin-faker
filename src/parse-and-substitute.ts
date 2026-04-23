import JSON5 from 'json5';
import { FakerPluginError } from './errors';

export interface Helpers {
    resolve: (value: string) => unknown;
}

const EXACT_REF_RE = /^\$[a-zA-Z_][a-zA-Z0-9_.]*$/;

export function parseAndSubstitute(raw: string, helpers: Helpers): unknown {
    const trimmed = raw.trim();
    let parsed: unknown;
    try {
        parsed = JSON5.parse(trimmed);
    } catch (e) {
        throw new FakerPluginError(`failed to parse JSON5 arg: ${(e as Error).message}`);
    }
    return substitute(parsed, helpers);
}

function substitute(value: unknown, helpers: Helpers): unknown {
    if (typeof value === 'string') {
        if (EXACT_REF_RE.test(value)) {
            return helpers.resolve(value);
        }
        if (value.includes('$')) {
            const resolved = helpers.resolve(value);
            return typeof resolved === 'string' ? resolved : String(resolved);
        }
        return value;
    }
    if (Array.isArray(value)) {
        return value.map(v => substitute(v, helpers));
    }
    if (value !== null && typeof value === 'object') {
        const out: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
            out[k] = substitute(v, helpers);
        }
        return out;
    }
    return value;
}
