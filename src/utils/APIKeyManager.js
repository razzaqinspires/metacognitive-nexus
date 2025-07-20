// File: metacognitive-nexus/src/utils/APIKeyManager.js
// (Tidak ada perubahan pada file APIKeyManager.js)
import { Logger } from './Logger.js';

export class APIKeyManager {
    #keys = [];
    #currentIndex = 0;
    #providerName;

    constructor(providerName, keys) {
        if (!Array.isArray(keys) || keys.length === 0) {
            Logger.error(`[APIKeyManager] ${providerName}: Tidak ada API Keys yang disediakan.`);
            this.#keys = [];
        } else {
            this.#keys = keys;
            Logger.info(`[APIKeyManager] ${providerName}: Mengelola ${keys.length} API Key.`);
        }
        this.#providerName = providerName;
    }

    getKey() {
        if (this.#keys.length === 0) {
            Logger.warn(`[APIKeyManager] ${this.#providerName}: Tidak ada API Key yang tersedia untuk rotasi.`);
            return null;
        }
        const key = this.#keys[this.#currentIndex];
        this.#currentIndex = (this.#currentIndex + 1) % this.#keys.length;
        Logger.debug(`[APIKeyManager] ${this.#providerName}: Menggunakan API Key pada indeks ${this.#currentIndex === 0 ? this.#keys.length - 1 : this.#currentIndex - 1}.`);
        return key;
    }

    getAllKeys() {
        return [...this.#keys];
    }

    resetRotation() {
        this.#currentIndex = 0;
        Logger.info(`[APIKeyManager] ${this.#providerName}: Rotasi API Key direset.`);
    }

    hasKeys() {
        return this.#keys.length > 0;
    }
}