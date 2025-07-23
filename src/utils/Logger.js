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
        this.#isMuted = true;
        // Mengatur level pinoInstance menjadi 'silent' saat dimute
        pinoInstance.level = 'silent';
        console.log("[Logger] Muted. Logging output suppressed."); // Pesan ini akan selalu muncul
    }

    /**
     * [BARU] Mengaktifkan kembali output log ke konsol.
     * Menonaktifkan mode 'fokus'.
     */
    static unmute() {
        this.#isMuted = false;
        // Mengembalikan level pinoInstance ke level semula
        pinoInstance.level = process.env.NODE_ENV === 'production' ? 'info' : 'debug';
        console.log("[Logger] Unmuted. Logging output re-enabled."); // Pesan ini akan selalu muncul
    }

    static info(message, ...args) {
        // if (this.#isMuted) return; // Tidak perlu cek ini karena level pinoInstance sudah diatur
        pinoInstance.info(message, ...args);
    }

    static warn(message, ...args) {
        // if (this.#isMuted) return;
        pinoInstance.warn(message, ...args);
    }

    static error(message, error = null, ...args) {
        // if (this.#isMuted) return;
        if (error instanceof Error) {
            pinoInstance.error({ error: { message: error.message, stack: error.stack } }, message, ...args);
        } else {
            pinoInstance.error(message, ...args);
        }
    }

    static debug(message, ...args) {
        // if (this.#isMuted) return;
        pinoInstance.debug(message, ...args);
    }
    
    /**
     * Mengembalikan instance Pino child. Berguna untuk modul internal yang ingin log.
     * @param {object} options Opsi tambahan untuk child logger.
     * @returns {pino.Logger}
     */
    static getPinoInstance(options = {}) {
        // Pastikan level yang benar diterapkan pada child logger, terutama saat muted
        const finalOptions = { ...options };
        if (this.#isMuted) {
            finalOptions.level = 'silent';
        } else if (!finalOptions.level) { // Gunakan level default jika tidak disetel
            finalOptions.level = process.env.NODE_ENV === 'production' ? 'info' : 'debug';
        }
        return pinoInstance.child({}, finalOptions);
    }
}