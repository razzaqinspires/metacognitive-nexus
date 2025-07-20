// File: metacognitive-nexus/src/utils/Logger.js
// (Tidak ada perubahan pada file Logger.js)
import P from 'pino';

const logger = P({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    transport: {
        target: 'pino-pretty',
        options: {
            colorize: true,
            ignore: 'pid,hostname', // Menghilangkan pid dan hostname untuk output yang lebih bersih
            translateTime: 'SYS:HH:MM:ss Z', // Menampilkan waktu lokal
        }
    }
});

export class Logger {
    static info(message, showToUser = false) {
        logger.info(message);
        // Implementasi showToUser akan dihandel oleh lapisan di atas (misal, di bot WhatsApp)
    }

    static warn(message, showToUser = false) {
        logger.warn(message);
    }

    static error(message, error = null, showToUser = false) {
        if (error) {
            logger.error({ error: error.message, stack: error.stack }, message);
        } else {
            logger.error(message);
        }
    }

    static debug(message) {
        logger.debug(message);
    }
}