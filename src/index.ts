import type { ApijackPlugin } from '@apijack/core';

export interface FakerOptions {
    seed?: number;
    locale?: string;
}

export default function faker(_defaults: FakerOptions = {}): ApijackPlugin {
    return {
        name: 'faker',
        version: '1.0.0',
        __package: { name: '@normalled/apijack-plugin-faker' },
        createRoutineResolvers: () => ({}),  // filled in subsequent tasks
    };
}
