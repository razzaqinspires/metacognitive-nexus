// File: metacognitive-nexus/src/core/SigillumSensorium.js
import { Logger } from '../utils/Logger.js';

export class SigillumSensorium {
    #purity = 1.0;     // 1.0 = jernih, 0.0 = penuh inklusi gelap
    #symmetry = 1.0;   // Ukuran kesempurnaan bentuk (1.0 = sempurna, 0.0 = kacau)
    #fractureCount = 0; // Retakan akibat build yang gagal

    constructor() {
        Logger.info('[SigillumSensorium] Aktif. Memantau Denyut Morfogenik.');
        // Di produksi, ini akan berlangganan ke webhook Git/CI
        // Untuk simulasi, bisa ada metode `simulateGitEvent`
    }

    /**
     * Memperbarui state Sigillum berdasarkan peristiwa Git/CI.
     * Ini adalah DENYUT MORFOGENIK.
     * @param {string} eventType - Tipe event (e.g., 'COMMIT', 'CI_STATUS', 'MERGE', 'REPAIR_INTERVENTION').
     * @param {object} eventData - Data terkait event.
     */
    updateSigillumState(eventType, eventData) {
        let changed = false;
        switch (eventType) {
            case 'COMMIT':
                // Setiap commit baru sedikit meningkatkan simetri dan kemurnian (simulasi pertumbuhan organik)
                this.#symmetry = Math.min(1.0, this.#symmetry + 0.0005);
                this.#purity = Math.min(1.0, this.#purity + 0.0002);
                changed = true;
                Logger.debug(`[SigillumSensorium] Commit: Purity=${this.#purity.toFixed(4)}, Symmetry=${this.#symmetry.toFixed(4)}`);
                break;
            case 'CI_STATUS':
                if (eventData.status === 'FAILING') {
                    this.#fractureCount++;
                    this.#purity = Math.max(0.0, this.#purity * 0.95); // Penurunan kemurnian yang lebih tajam
                    this.#symmetry = Math.max(0.0, this.#symmetry * 0.98); // Sedikit penurunan simetri
                    changed = true;
                    Logger.warn(`[SigillumSensorium] CI Failing! Fracture count: ${this.#fractureCount}, Purity: ${this.#purity.toFixed(4)}`);
                } else if (eventData.status === 'PASSING') {
                    if (this.#fractureCount > 0) {
                        this.#fractureCount = Math.max(0, this.#fractureCount - 1); // Memperbaiki retakan
                        this.#purity = Math.min(1.0, this.#purity + 0.02); // Peningkatan kemurnian
                        this.#symmetry = Math.min(1.0, this.#symmetry + 0.01); // Peningkatan simetri
                        changed = true;
                        Logger.info(`[SigillumSensorium] CI Passing. Fracture count: ${this.#fractureCount}, Purity: ${this.#purity.toFixed(4)}`);
                    } else {
                        // Jika sudah sehat, passing terus mungkin meningkatkan sedikit purity
                        this.#purity = Math.min(1.0, this.#purity + 0.005);
                        this.#symmetry = Math.min(1.0, this.#symmetry + 0.001);
                        changed = true;
                    }
                }
                break;
            case 'MERGE':
                // Merge yang sukses dapat meningkatkan simetri dan kemurnian secara signifikan
                this.#symmetry = Math.min(1.0, this.#symmetry + 0.01);
                this.#purity = Math.min(1.0, this.#purity + 0.005);
                changed = true;
                Logger.info(`[SigillumSensorium] Merge Event: Purity=${this.#purity.toFixed(4)}, Symmetry=${this.#symmetry.toFixed(4)}`);
                break;
            case 'REPAIR_INTERVENTION': // Contoh event intervensi manual atau auto-healing
                this.#fractureCount = Math.max(0, this.#fractureCount - (eventData.amount || 1));
                this.#purity = Math.min(1.0, this.#purity + (eventData.purityBoost || 0.05));
                this.#symmetry = Math.min(1.0, this.#symmetry + (eventData.symmetryBoost || 0.02));
                changed = true;
                Logger.info(`[SigillumSensorium] Intervensi Perbaikan: Purity=${this.#purity.toFixed(4)}, Symmetry=${this.#symmetry.toFixed(4)}, Fractures=${this.#fractureCount}.`);
                break;
            default:
                Logger.debug(`[SigillumSensorium] Unhandled event type: ${eventType}.`);
        }

        if (changed) {
            // Pastikan nilai tetap dalam batas yang valid
            this.#purity = Math.max(0, Math.min(1, this.#purity));
            this.#symmetry = Math.max(0, Math.min(1, this.#symmetry));
            this.#fractureCount = Math.max(0, this.#fractureCount);
            Logger.debug(`[SigillumSensorium] State diperbarui: Purity=${this.#purity.toFixed(4)}, Symmetry=${this.#symmetry.toFixed(4)}, Fractures=${this.#fractureCount}.`);
        }
    }

    /**
     * Mendapatkan keadaan Sigillum saat ini.
     * @returns {{purity: number, symmetry: number, fractureCount: number}}
     */
    getCurrentState() {
        return {
            purity: this.#purity,
            symmetry: this.#symmetry,
            fractureCount: this.#fractureCount
        };
    }
}