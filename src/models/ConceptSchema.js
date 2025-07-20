// File: metacognitive-nexus/src/models/ConceptSchema.js

/**
 * @typedef {object} Concept
 * @property {string} id - ID unik untuk konsep ini (UUID atau hash dari nama untuk konsistensi).
 * @property {string} name - Nama utama dari konsep (misal: 'Artificial Consciousness', 'Quantum Computing').
 * @property {string[]} aliases - Nama-nama lain atau sinonim untuk konsep ini (misal: ['AC', 'AI Consciousness']).
 * @property {string} description - Definisi singkat atau deskripsi inti dari konsep.
 * @property {string[]} categories - Kategori yang relevan untuk konsep ini (misal: ['AI', 'Philosophy', 'Computer Science']).
 * @property {string[]} relatedConcepts - Array ID konsep lain yang terkait secara semantik (misal: 'Neural Networks' terkait dengan 'Deep Learning').
 * @property {string[]} prerequisiteConcepts - Array ID konsep yang harus dipahami terlebih dahulu (misal: 'Linear Algebra' untuk 'Machine Learning').
 * @property {string[]} derivedConcepts - Array ID konsep yang diturunkan atau dibangun dari konsep ini.
 * @property {number} confidenceScore - Tingkat keyakinan AI dalam pemahaman konsep ini (0.0 - 1.0). Akan meningkat seiring dengan validasi dan penggunaan.
 * @property {string[]} sourceInteractions - Array ID dari `InteractionLog` yang berkontribusi pada pembelajaran atau penyempurnaan konsep ini.
 * @property {Date} createdAt - Timestamp saat konsep ini pertama kali teridentifikasi atau dibuat.
 * @property {Date} lastUpdated - Timestamp saat konsep ini terakhir kali diperbarui atau diperkaya.
 * @property {object} [metadata] - Objek opsional untuk metadata tambahan, seperti:
 * @property {string} [metadata.originProvider] - Provider AI eksternal yang pertama kali memberikan insight tentang konsep ini.
 * @property {string} [metadata.complexityLevel] - Tingkat kompleksitas konsep (misal: 'basic', 'intermediate', 'advanced').
 * @property {string} [metadata.domain] - Domain spesifik yang lebih rinci (misal: 'Natural Language Processing', 'Robotics').
 */
export const ConceptSchema = {
    id: 'string',
    name: 'string',
    aliases: ['string'],
    description: 'string',
    categories: ['string'],
    relatedConcepts: ['string'],
    prerequisiteConcepts: ['string'],
    derivedConcepts: ['string'],
    confidenceScore: 'number', // Range 0.0 to 1.0
    sourceInteractions: ['string'], // References InteractionLog.id
    createdAt: 'Date',
    lastUpdated: 'Date',
    metadata: {
        originProvider: 'string',
        complexityLevel: 'string', // e.g., 'basic', 'intermediate', 'advanced'
        domain: 'string'
    }
};

// Fungsi utilitas untuk membuat ID konsep yang konsisten
export function generateConceptId(conceptName) {
    // Menggunakan UUID atau hashing sederhana untuk memastikan keunikan dan konsistensi
    // Di lingkungan produksi, ini bisa berupa UUID V5 berdasarkan namespace tertentu.
    return conceptName.toLowerCase().replace(/\s+/g, '-'); // Contoh sederhana: "Artificial Consciousness" -> "artificial-consciousness"
}