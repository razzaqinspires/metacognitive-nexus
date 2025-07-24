// File: metacognitive-nexus/src/utils/Logger.js (Dengan Mekanisme Fokus & Konfigurasi Lingkungan)
import pino from 'pino';

// Konfigurasi transport Pino berdasarkan lingkungan
const transportConfig = process.env.NODE_ENV === 'production' ? null : {
    target: 'pino-pretty',
    options: {
        colorize: true,
        ignore: 'pid,hostname',
        translateTime: 'SYS:HH:MM:ss Z',
    },
};

const pinoInstance = pino({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    ...(transportConfig && { transport: transportConfig }) // Hanya tambahkan transport jika ada
});

export class Logger {
    static #isMuted = false;

    /**
     * [BARU] Menekan semua output log ke konsol.
     * Mengaktifkan mode 'fokus'.
     */
    static mute() {
        if (this.#isMuted) return; // [PERBAIKAN] Jangan lakukan apa-apa jika sudah muted
        this.#isMuted = true;
        pinoInstance.level = 'silent';
        // Pesan ini hanya dicetak jika sebelumnya tidak muted
        console.log("[Logger] Muted. Logging output suppressed.");
    }

    /**
     * [BARU] Mengaktifkan kembali output log ke konsol.
     * Menonaktifkan mode 'fokus'.
     */
    static unmute() {
        if (!this.#isMuted) return; // [PERBAIKAN] Jangan lakukan apa-apa jika sudah unmuted
        this.#isMuted = false;
        pinoInstance.level = process.env.NODE_ENV === 'production' ? 'info' : 'debug';
        // Pesan ini hanya dicetak jika sebelumnya muted
        console.log("[Logger] Unmuted. Logging output re-enabled.");
    }

    static info(message, ...args) {
        pinoInstance.info(message, ...args);
    }

    static warn(message, ...args) {
        pinoInstance.warn(message, ...args);
    }

    static error(message, error = null, ...args) {
        if (error instanceof Error) {
            pinoInstance.error({ error: { message: error.message, stack: error.stack } }, message, ...args);
        } else {
            pinoInstance.error(message, ...args);
        }
    }

    static debug(message, ...args) {
        pinoInstance.debug(message, ...args);
    }
    
    static getPinoInstance(options = {}) {
        const finalOptions = { ...options };
        if (this.#isMuted) {
            finalOptions.level = 'silent';
        } else if (!finalOptions.level) {
            finalOptions.level = process.env.NODE_ENV === 'production' ? 'info' : 'debug';
        }
        return pinoInstance.child({}, finalOptions);
    }
}