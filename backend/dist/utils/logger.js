"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
class Logger {
    constructor(context) {
        this.context = context;
    }
    info(message) {
        console.log(`[INFO] [${this.context}] ${message}`);
    }
    error(message) {
        console.error(`[ERROR] [${this.context}] ${message}`);
    }
    warn(message) {
        console.warn(`[WARN] [${this.context}] ${message}`);
    }
    debug(message) {
        if (process.env.NODE_ENV === 'development') {
            console.log(`[DEBUG] [${this.context}] ${message}`);
        }
    }
}
exports.Logger = Logger;
