// File: metacognitive-nexus/src/utils/Logger.js (Dengan Mekanisme Fokus)
import pino from 'pino';

const pinoInstance = pino({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    transport: {
        target: 'pino-pretty',
        options: {
            colorize: true,
            ignore: 'pid,hostname',
            translateTime: 'SYS:HH:MM:ss Z',
        },
    },
});

export class Logger {
    static #isMuted = false;

    /**
     * [BARU] Menekan semua output log ke konsol.
     * Mengaktifkan mode 'fokus'.
     */
    static mute() {
        this.#isMuted = true;
    }

    /**
     * [BARU] Mengaktifkan kembali output log ke konsol.
     * Menonaktifkan mode 'fokus'.
     */
    static unmute() {
        this.#isMuted = false;
    }

    static info(message) {
        if (this.#isMuted) return;
        pinoInstance.info(message);
    }

    static warn(message) {
        if (this.#isMuted) return;
        pinoInstance.warn(message);
    }

    static error(message, error = null) {
        if (this.#isMuted) return;
        if (error instanceof Error) {
            pinoInstance.error({ error: { message: error.message, stack: error.stack } }, message);
        } else {
            pinoInstance.error(message);
        }
    }

    static debug(message) {
        if (this.#isMuted) return;
        pinoInstance.debug(message);
    }
    
    static getPinoInstance(options = {}) {
        const finalOptions = { ...options };
        if (this.#isMuted) {
            finalOptions.level = 'silent';
        }
        return pinoInstance.child({}, finalOptions);
    }
}