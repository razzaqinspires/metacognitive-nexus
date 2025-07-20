// File: metacognitive-nexus/src/models/InteractionLogSchema.js

/**
 * @typedef {object} InteractionLog
 * @property {string} id - ID unik untuk log interaksi ini (UUID).
 * @property {Date} timestamp - Timestamp lengkap saat interaksi terjadi.
 * @property {string} userId - ID anonim dari pengguna yang memulai interaksi (penting untuk privasi dan agregasi perilaku).
 * @property {string} platform - Platform asal interaksi (misal: 'whatsapp', 'web', 'api_client').
 * @property {string} prompt - Teks prompt lengkap yang dikirim ke AI.
 * @property {object} [promptMetadata] - Metadata tambahan tentang prompt:
 * @property {string} [promptMetadata.type] - Jenis prompt (misal: 'question', 'command', 'creative_request').
 * @property {number} [promptMetadata.length] - Panjang prompt dalam karakter.
 * @property {string} [promptMetadata.language] - Bahasa prompt (misal: 'en', 'id').
 * @property {string} response - Teks respons lengkap yang diterima dari AI.
 * @property {object} [responseMetadata] - Metadata tambahan tentang respons:
 * @property {string} [responseMetadata.type] - Jenis respons (misal: 'text', 'code', 'image_description').
 * @property {number} [responseMetadata.length] - Panjang respons dalam karakter.
 * @property {number} [responseMetadata.tokens] - Jumlah token yang digunakan (jika tersedia dari provider).
 * @property {number} [responseMetadata.cost] - Estimasi biaya interaksi ini (jika dapat dihitung).
 * @property {string} providerUsed - Nama provider AI yang akhirnya berhasil merespons (misal: 'openai', 'gemini', 'groq').
 * @property {string} modelUsed - Model spesifik dari provider yang digunakan (misal: 'gpt-4o', 'gemini-1.5-pro-latest').
 * @property {number} latencyMs - Waktu respons dalam milidetik dari awal permintaan hingga respons diterima.
 * @property {boolean} success - Status keberhasilan interaksi (true jika berhasil, false jika ada error/fallback).
 * @property {string} [errorMessage] - Pesan error jika interaksi gagal.
 * @property {string[]} [fallbackPath] - Array string yang mencatat urutan provider/model/key yang dicoba sebelum berhasil/gagal total.
 * @property {object} [feedback] - (Akan dikembangkan) Feedback pengguna tentang kualitas respons (misal: { score: 1-5, comment: '...' }).
 * @property {Date} createdAt - Timestamp saat log ini dibuat.
 */
export const InteractionLogSchema = {
    id: 'string',
    timestamp: 'Date',
    userId: 'string', // Anonymized user ID
    platform: 'string',
    prompt: 'string',
    promptMetadata: {
        type: 'string',
        length: 'number',
        language: 'string'
    },
    response: 'string',
    responseMetadata: {
        type: 'string',
        length: 'number',
        tokens: 'number',
        cost: 'number'
    },
    providerUsed: 'string',
    modelUsed: 'string',
    latencyMs: 'number',
    success: 'boolean',
    errorMessage: 'string',
    fallbackPath: ['string'], // e.g., ['openai:gpt-4o:key1', 'openai:gpt-3.5-turbo:key1', 'gemini:gemini-pro:key1']
    feedback: {
        score: 'number', // 1-5
        comment: 'string'
    },
    createdAt: 'Date'
};

// Fungsi utilitas untuk menghasilkan ID unik (UUID v4)
export function generateInteractionId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}