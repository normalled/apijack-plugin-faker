import { FakerPluginError } from './errors';

type AnyObj = Record<string, unknown>;

export function walkPath(root: unknown, path: string): (...args: unknown[]) => unknown {
    if (!path) throw new FakerPluginError('empty path');
    const segments = path.split('.');
    let current: unknown = root;
    let parent: unknown = null;
    for (let i = 0; i < segments.length; i++) {
        const seg = segments[i]!;
        if (current == null || typeof current !== 'object') {
            throw new FakerPluginError(
                `path "${path}" not found at "${seg}" (previous segment was not an object)`,
            );
        }
        if (!(seg in (current as AnyObj))) {
            throw new FakerPluginError(`path "${path}" not found at "${seg}"`);
        }
        parent = current;
        current = (current as AnyObj)[seg];
    }
    if (typeof current !== 'function') {
        throw new FakerPluginError(`path "${path}" resolves to a namespace, not a function`);
    }
    return (current as (...args: unknown[]) => unknown).bind(parent);
}
