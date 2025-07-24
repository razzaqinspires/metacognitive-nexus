// File: metacognitive-nexus/src/models/InteractionLogSchema.js

// Impor langsung generateInteractionId dari MathHelpers.js
import { generateInteractionId } from '../utils/MathHelpers.js'; 

/**
 * Mendefinisikan satu upaya transaksi yang dilakukan oleh DSO.
 * @typedef {object} AttemptTransaction
 * @property {number} attempt_sequence - Urutan upaya (0, 1, 2, ...).
 * @property {string} provider - Provider yang dicoba (e.g., 'openai').
 * @property {string} model - Model yang dicoba (e.g., 'gpt-4o').
 * @property {object} outcome - Hasil dari upaya ini.
 * @property {'SUCCESS' | 'FAILURE'} outcome.status - Status keberhasilan upaya ini.
 * @property {number} outcome.latencyMs - Latensi untuk upaya spesifik ini.
 * @property {string} [outcome.failureReason] - Alasan kegagalan (e.g., 'RATE_LIMIT_EXCEEDED', 'INVALID_API_KEY', 'TIMEOUT', 'CONTENT_FILTERED', 'CONTEXT_LENGTH_EXCEEDED').
 */

/**
 * Mendefinisikan 'pikiran' AI pada saat keputusan awal dibuat.
 * @typedef {object} CognitiveSnapshot
 * @property {string} intent - Niat yang terdeteksi oleh ManifoldNavigator (e.g., 'CodeGeneration').
 * @property {string} policyUsed - Nama kebijakan DSO yang digunakan (e.g., 'policy_code_gen').
 * @property {number} topCandidateQlcScore - Skor QLC dari kandidat teratas yang pertama kali dipilih.
 * @property {string} [artisticStyle] - (Jika relevan) Gaya yang dipilih oleh MultimodalSynthesizer.
 * @property {Array<string>} [fallbackPath] - Jalur fallback yang dicoba oleh DSO.
 */

/**
 * Skema utama untuk Jejak Kausal & Metakognitif.
 * Ini adalah fosil dari satu pemikiran lengkap.
 * @typedef {object} InteractionLog
 * @property {string} id - ID unik untuk seluruh jejak interaksi.
 * @property {Date} timestamp - Timestamp saat interaksi dimulai.
 * @property {string} userId - ID anonim pengguna.
 * @property {string} platform - Platform asal interaksi (e.g., 'whatsapp_group', 'whatsapp_private', 'web_dashboard', 'internal_schedule').
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
 * @property {object} [promptMetadata] - Metadata tambahan yang diteruskan bersama prompt (misal: command_execution, type_correction).
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
        artisticStyle: 'string',
        fallbackPath: ['string']
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
    },
    promptMetadata: 'object'
};

// Fungsi generateInteractionId sekarang diimpor dari MathHelpers.js.
// Jika ada kode duplikat di sini sebelumnya, itu harus dihapus.
export { generateInteractionId }; // Re-export untuk kompatibilitas jika ada yang mengimpor dari sini