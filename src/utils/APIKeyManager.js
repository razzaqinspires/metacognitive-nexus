// File: metacognitive-nexus/src/utils/APIKeyManager.js (Versi Evolusi Definitif)
import { Logger } from './Logger.js';

/**
 * APIKeyManager direkayasa ulang sebagai Credential Governor.
 * Ia secara aktif mengelola sebuah pool kredensial, lengkap dengan status kesehatan,
 * feedback loop, dan mekanisme self-healing.
 */
export class APIKeyManager {
    // #keys sekarang menyimpan obyek dengan status, bukan hanya string.
    // { key: string, status: 'active' | 'impaired' | 'compromised', impairedUntil: Date | null }
    #keys = [];
    #providerName;
    #roundRobinIndex = 0; // Tetap menggunakan round-robin untuk kunci yang sehat

    constructor(providerName, keys) {
        this.#providerName = providerName;
        if (!Array.isArray(keys) || keys.length === 0) {
            Logger.warn(`[KeyGovernor] ${providerName}: Tidak ada kredensial yang disediakan.`);
            this.#keys = [];
        } else {
            // Ubah array string menjadi struktur obyek yang kaya
            this.#keys = keys.map(key => ({
                key: key,
                status: 'active',
                impairedUntil: null,
            }));
            Logger.info(`[KeyGovernor] ${providerName}: Mengawasi ${this.#keys.length} kredensial.`);
        }
    }

    /**
     * Metode seleksi cerdas untuk mendapatkan kunci yang paling layak.
     * @returns {string | null} Kunci API yang aktif atau null jika tidak ada.
     */
    getKey() {
        const activeKeys = this.#keys.filter(k => k.status === 'active');
        
        // Cek apakah ada kunci 'impaired' yang sudah bisa dicoba lagi (self-healing)
        const now = Date.now();
        const healedKeys = this.#keys.filter(k => k.status === 'impaired' && k.impairedUntil && now > k.impairedUntil);
        
        healedKeys.forEach(k => {
            Logger.info(`[KeyGovernor] Kunci untuk ${this.#providerName} pulih dari status 'impaired'. Mengaktifkan kembali.`);
            k.status = 'active';
            k.impairedUntil = null;
            activeKeys.push(k);
        });

        if (activeKeys.length === 0) {
            Logger.warn(`[KeyGovernor] ${this.#providerName}: Tidak ada kredensial aktif yang tersedia saat ini.`);
            return null;
        }

        // Terapkan rotasi round-robin hanya pada kunci yang aktif
        this.#roundRobinIndex = this.#roundRobinIndex % activeKeys.length;
        const selectedKey = activeKeys[this.#roundRobinIndex];
        this.#roundRobinIndex++;

        Logger.debug(`[KeyGovernor] ${this.#providerName}: Menyediakan kredensial aktif.`);
        return selectedKey.key;
    }

    /**
     * Menerima laporan dari sistem tingkat atas (DSO) tentang status sebuah kunci.
     * @param {string} failedKey - Kunci spesifik yang gagal.
     * @param {'RATE_LIMIT' | 'INVALID_KEY' | 'OTHER'} failureType - Jenis kegagalan.
     */
    reportStatus(failedKey, failureType) {
        const keyObject = this.#keys.find(k => k.key === failedKey);
        if (!keyObject) return;

        switch (failureType) {
            case 'RATE_LIMIT':
                keyObject.status = 'impaired';
                // Istirahatkan selama 60 detik sebelum mencoba lagi
                keyObject.impairedUntil = Date.now() + 60 * 1000;
                Logger.warn(`[KeyGovernor] Kunci untuk ${this.#providerName} diistirahatkan sementara karena RATE_LIMIT.`);
                break;
            case 'INVALID_KEY':
                keyObject.status = 'compromised';
                keyObject.impairedUntil = null; // Karantina permanen
                Logger.error(`[KeyGovernor] Kritis: Kunci untuk ${this.#providerName} terdeteksi tidak valid dan dikarantina secara permanen.`);
                break;
            default:
                // Untuk error lain, kita anggap sementara
                keyObject.status = 'impaired';
                keyObject.impairedUntil = Date.now() + 30 * 1000; // Istirahat singkat
                Logger.warn(`[KeyGovernor] Kunci untuk ${this.#providerName} diistirahatkan karena error sementara.`);
                break;
        }
    }

    /**
     * Mengembalikan semua kunci, terlepas dari statusnya (untuk debugging).
     * @returns {string[]}
     */
    getAllKeys() {
        return this.#keys.map(k => k.key);
    }

    /**
     * Memeriksa apakah ada setidaknya satu kunci yang aktif.
     * @returns {boolean}
     */
    hasActiveKeys() {
        // Cek juga kunci yang bisa pulih
        const now = Date.now();
        return this.#keys.some(k => k.status === 'active' || (k.status === 'impaired' && k.impairedUntil && now > k.impairedUntil));
    }

    /**
     * Mereset status semua kunci kembali ke 'active'. Berguna saat AI "bangun dari tidur".
     */
    resetAllKeyStatuses() {
        this.#keys.forEach(k => {
            if (k.status !== 'compromised') { // Jangan aktifkan kembali kunci yang sudah pasti rusak
                k.status = 'active';
                k.impairedUntil = null;
            }
        });
        this.#roundRobinIndex = 0;
        Logger.info(`[KeyGovernor] ${this.#providerName}: Status semua kredensial yang dapat digunakan telah direset ke 'active'.`);
    }
}