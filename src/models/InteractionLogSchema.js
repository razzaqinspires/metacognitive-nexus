// File: metacognitive-nexus/src/models/InteractionLogSchema.js

/**
 * Mendefinisikan satu upaya transaksi yang dilakukan oleh DSO.
 * @typedef {object} AttemptTransaction
 * @property {number} attempt_sequence - Urutan upaya (0, 1, 2, ...).
 * @property {string} provider - Provider yang dicoba (e.g., 'openai').
 * @property {string} model - Model yang dicoba (e.g., 'gpt-4o').
 * @property {object} outcome - Hasil dari upaya ini.
 * @property {'SUCCESS' | 'FAILURE'} outcome.status - Status keberhasilan upaya ini.
 * @property {number} outcome.latencyMs - Latensi untuk upaya spesifik ini.
 * @property {string} [outcome.failureReason] - Alasan kegagalan (e.g., 'RATE_LIMIT_EXCEEDED', 'INVALID_API_KEY', 'TIMEOUT', 'CONTENT_FILTER').
 */

/**
 * Mendefinisikan 'pikiran' AI pada saat keputusan awal dibuat.
 * @typedef {object} CognitiveSnapshot
 * @property {string} intent - Niat yang terdeteksi oleh ManifoldNavigator (e.g., 'CodeGeneration').
 * @property {string} policyUsed - Nama kebijakan DSO yang digunakan (e.g., 'policy_code_gen').
 * @property {number} topCandidateQlcScore - Skor QLC dari kandidat teratas yang pertama kali dipilih.
 * @property {string} [artisticStyle] - (Jika relevan) Gaya yang dipilih oleh MultimodalSynthesizer.
 */

/**
 * Skema utama untuk Jejak Kausal & Metakognitif.
 * Ini adalah fosil dari satu pemikiran lengkap.
 * @typedef {object} InteractionLog
 * @property {string} id - ID unik untuk seluruh jejak interaksi.
 * @property {Date} timestamp - Timestamp saat interaksi dimulai.
 * @property {string} userId - ID anonim pengguna.
 * @property {string} platform - Platform asal interaksi.
 * @property {string} promptText - Teks prompt mentah dari pengguna.
 * @property {CognitiveSnapshot} cognitiveSnapshot - "Pikiran" AI sebelum eksekusi.
 * @property {AttemptTransaction[]} transactions - Rantai kausal dari semua upaya yang dilakukan.
 * @property {object} finalOutcome - Hasil akhir dari seluruh interaksi.
 * @property {boolean} finalOutcome.success - Apakah interaksi secara keseluruhan berhasil?
 * @property {string | null} finalOutcome.response - Teks respons akhir jika berhasil.
 * @property {string | null} finalOutcome.error - Pesan error akhir jika gagal total.
 * @property {object} [causalLinks] - Tautan ke memori manifold.
 * @property {string} [causalLinks.promptVectorId] - ID konsep prompt di UCM.
 * @property {string} [causalLinks.responseVectorId] - ID konsep respons di UCM.
 * @property {object} [feedback] - Umpan balik yang dapat ditindaklanjuti.
 * @property {number} [feedback.rating] - Skor 1-5.
 * @property {string} [feedback.comment] - Komentar teks.
 * @property {string} [feedback.correctedResponse] - Respons yang disarankan oleh pengguna.
 * @property {string[]} [feedback.tags] - Tag feedback (e.g., ['tidak_akurat', 'membantu']).
 */
export const InteractionLogSchema = {
    id: 'string',
    timestamp: 'Date',
    userId: 'string',
    platform: 'string',
    promptText: 'string',
    cognitiveSnapshot: {
        intent: 'string',
        policyUsed: 'string',
        topCandidateQlcScore: 'number',
        artisticStyle: 'string'
    },
    transactions: [{
        attempt_sequence: 'number',
        provider: 'string',
        model: 'string',
        outcome: {
            status: 'string', // 'SUCCESS' | 'FAILURE'
            latencyMs: 'number',
            failureReason: 'string'
        }
    }],
    finalOutcome: {
        success: 'boolean',
        response: 'string',
        error: 'string'
    },
    causalLinks: {
        promptVectorId: 'string',
        responseVectorId: 'string'
    },
    feedback: {
        rating: 'number',
        comment: 'string',
        correctedResponse: 'string',
        tags: ['string']
    }
};

/**
 * Menghasilkan ID unik standar (UUID v4) untuk setiap jejak interaksi.
 * @returns {string}
 */
export function generateInteractionId() {
    // Implementasi UUID v4 yang lebih kuat dan sesuai standar
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    // Fallback untuk lingkungan yang lebih tua
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}