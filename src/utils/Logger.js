// File: metacognitive-nexus/src/utils/Logger.js (Versi Definitif & Utuh)

import pino from 'pino';

// Instance pino utama dibuat sekali di sini, membentuk satu sumber kebenaran untuk logging.
// Ini adalah "pusat saraf" dari sistem pencatatan kita.
const pinoInstance = pino({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    transport: {
        target: 'pino-pretty',
        options: {
            colorize: true,
            ignore: 'pid,hostname', // Menghilangkan detail yang tidak perlu untuk kejelasan.
            translateTime: 'SYS:HH:MM:ss Z', // Format waktu yang mudah dibaca.
        },
    },
});

/**
 * Logger adalah utilitas logging statis universal untuk seluruh ekosistem Nexus.
 * Ia menyediakan antarmuka yang bersih dan konsisten untuk melaporkan keadaan internal sistem.
 * Tidak untuk diinstansiasi dengan 'new'; semua metodenya statis.
 */
export class Logger {
    /**
     * Mencatat informasi umum atau peristiwa penting.
     * @param {string} message - Pesan yang akan dicatat.
     */
    static info(message) {
        pinoInstance.info(message);
    }

    /**
     * Mencatat peringatan untuk kondisi yang tidak terduga tetapi tidak fatal.
     * @param {string} message - Pesan peringatan.
     */
    static warn(message) {
        pinoInstance.warn(message);
    }

    /**
     * Mencatat kesalahan kritis, lengkap dengan detail dari obyek Error.
     * @param {string} message - Deskripsi konteks kesalahan.
     * @param {Error | null} [error=null] - Obyek Error yang ditangkap.
     */
    static error(message, error = null) {
        if (error instanceof Error) {
            // Menyertakan message dan stack dari error untuk diagnosis yang mendalam.
            pinoInstance.error({ error: { message: error.message, stack: error.stack } }, message);
        } else {
            pinoInstance.error(message);
        }
    }

    /**
     * Mencatat pesan debugging yang hanya muncul di lingkungan pengembangan.
     * @param {string} message - Pesan debugging teknis.
     */
    static debug(message) {
        pinoInstance.debug(message);
    }
    
    /**
     * [METODE BARU] Menyediakan instance Pino yang dapat dikonfigurasi untuk library eksternal.
     * Ini adalah "duta besar" yang memungkinkan sistem logging kita berintegrasi secara harmonis
     * dengan alat lain seperti Baileys, tanpa mengubah konfigurasi global.
     * @param {object} [options={}] - Opsi pino, misalnya { level: 'silent' }.
     * @returns {import('pino').Logger}
     */
    static getPinoInstance(options = {}) {
        // Menggunakan .child() untuk membuat logger turunan dengan opsi baru (misal: level yang berbeda)
        // tanpa mengubah instance utama. Ini adalah pola yang bersih dan aman.
        return pinoInstance.child({}, options);
    }
}