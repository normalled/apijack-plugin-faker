import { FakerPluginError } from './errors';

export interface SplitResult {
    path: string;
    rawArgs: string[];
}

export function splitArgs(input: string): SplitResult {
    const tokens = splitTopLevelCommas(input);
    if (tokens.length === 0) throw new FakerPluginError('_faker requires at least a path argument');
    const path = tokens[0]!.trim();
    const rawArgs = tokens.slice(1).map(t => t.trim());
    return { path, rawArgs };
}

function splitTopLevelCommas(input: string): string[] {
    const out: string[] = [];
    let current = '';
    let i = 0;
    while (i < input.length) {
        const c = input[i]!;
        if (c === '"' || c === "'") {
            const close = findCloseQuote(input, i);
            current += input.slice(i, close + 1);
            i = close + 1;
            continue;
        }
        if (c === '{' || c === '[' || c === '(') {
            const close = findClose(input, i);
            current += input.slice(i, close + 1);
            i = close + 1;
            continue;
        }
        if (c === ',') {
            out.push(current);
            current = '';
            i++;
            continue;
        }
        current += c;
        i++;
    }
    if (current.length > 0 || out.length > 0) out.push(current);
    return out;
}

function findCloseQuote(input: string, openIdx: number): number {
    const quote = input[openIdx]!;
    let j = openIdx + 1;
    while (j < input.length) {
        const c = input[j]!;
        if (c === '\\') { j += 2; continue; }
        if (c === quote) return j;
        j++;
    }
    throw new FakerPluginError(`unclosed string literal starting at index ${openIdx}`);
}

function findClose(input: string, openIdx: number): number {
    const open = input[openIdx]!;
    const close = open === '{' ? '}' : open === '[' ? ']' : ')';
    let depth = 1;
    let j = openIdx + 1;
    while (j < input.length) {
        const c = input[j]!;
        if (c === '"' || c === "'") { j = findCloseQuote(input, j) + 1; continue; }
        if (c === '{' || c === '[' || c === '(') { depth++; j++; continue; }
        if (c === '}' || c === ']' || c === ')') {
            depth--;
            if (depth === 0) {
                if (c !== close) {
                    throw new FakerPluginError(`mismatched closing "${c}" at index ${j}`);
                }
                return j;
            }
            j++;
            continue;
        }
        j++;
    }
    throw new FakerPluginError(`unclosed "${open}" starting at index ${openIdx}`);
}
