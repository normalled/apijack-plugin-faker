export class FakerPluginError extends Error {
    constructor(message: string) {
        super(`[faker] ${message}`);
        this.name = 'FakerPluginError';
    }
}
