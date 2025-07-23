// File: metacognitive-nexus/src/models/IdeonSchema.js

import { createHash } from 'node:crypto'; // Perbaikan impor

/**
 * Mendefinisikan hubungan semantik berbobot antar Ideon.
 * @typedef {object} IdeonRelation
 * @property {string} targetIdeonId - ID dari Ideon lain.
 * @property {'RELATED_TO' | 'PREREQUISITE_FOR' | 'EXAMPLE_OF' | 'TOOL_FOR' | 'ANTONYM_OF' | 'SYNONYM_OF' | 'DERIVED_FROM' | 'METAPHOR_FOR' | 'IMPLIES' | 'CONTRADICTS' | 'CAUSES' | 'PART_OF'} type - Sifat dari hubungan.
 * @property {number} weight - Kekuatan hubungan (0.0 - 1.0).
 */

/**
 * Mendefinisikan satu sudut pandang atau konteks dari sebuah Ideon.
 * @typedef {object} IdeonPerspective
 * @property {string} context - Konteks dari perspektif ini (e.g., 'technical', 'philosophical', 'historical', 'emotional').
 * @property {string} description - Deskripsi Ideon dari sudut pandang ini.
 * @property {string | null} vectorId - ID dari vektor deskripsi ini di dalam ManifoldMemory (untuk pencarian semantik).
 */

/**
 * Mendefinisikan keadaan dinamis dari sebuah Ideon.
 * @typedef {object} IdeonActivation
 * @property {number} level - Tingkat aktivasi saat ini (0.0 - 1.0), 'energi' dari ide.
 * @property {Date} lastAccessed - Timestamp terakhir kali Ideon ini diakses atau digunakan.
 * @property {number} decayRate - Tingkat peluruhan aktivasi per jam jika tidak digunakan.
 */

/**
 * Mendefinisikan bagaimana sebuah Ideon dapat memodulasi parameter sistem lain.
 * @typedef {object} HeuristicModulator
 * @property {'DSO_POLICY' | 'SYNTHESIZER_STYLE' | 'COMMAND_GUARD_THRESHOLD' | 'TASK_SCHEDULE'} targetSystem - Sistem yang akan dipengaruhi.
 * @property {string} parameter - Parameter yang akan diubah (e.g., 'w_l', 'default_style', 'spam_threshold').
 * @property {string} modification - Operasi yang dilakukan (e.g., 'temp_increase(0.2)', 'set("anime")', 'adjust_by_factor(0.9)').
 */

/**
 * Skema utama untuk Ideon: unit pemikiran yang hidup dan dinamis.
 * @typedef {object} Ideon
 * @property {string} id - Sidik jari genomik unik dari Ideon (hash dari nama kanonikalnya).
 * @property {string} canonicalName - Nama utama yang paling representatif.
 * @property {string[]} aliases - Nama-nama alternatif.
 * @property {IdeonPerspective[]} perspectives - Berbagai sudut pandang terhadap Ideon ini.
 * @property {string[]} categories - Kategori tingkat tinggi (e.g., 'Concept', 'Command', 'Entity', 'Event').
 * @property {IdeonRelation[]} relations - Jaringan hubungan semantik yang kaya.
 * @property {IdeonActivation} activation - Keadaan energi dan peluruhan dinamisnya.
 * @property {number} confidenceScore - Keyakinan AI terhadap pemahamannya (berbeda dari aktivasi).
 * @property {string[]} sourceInteractionIds - Jejak interaksi yang membentuk atau memperkaya Ideon ini.
 * @property {HeuristicModulator[]} [heuristicModulators] - (Opsional) Pengaruh perilaku yang dimiliki Ideon ini.
 */
export const IdeonSchema = {
    id: 'string',
    canonicalName: 'string',
    aliases: ['string'],
    perspectives: [{
        context: 'string',
        description: 'string',
        vectorId: 'string' // Bisa null sampai di-embed
    }],
    categories: ['string'],
    relations: [{
        targetIdeonId: 'string',
        type: 'string', // Dibatasi oleh tipe dalam IdeonRelation
        weight: 'number'
    }],
    activation: {
        level: 'number',
        lastAccessed: 'Date',
        decayRate: 'number'
    },
    confidenceScore: 'number',
    sourceInteractionIds: ['string'],
    heuristicModulators: [{
        targetSystem: 'string',
        parameter: 'string',
        modification: 'string'
    }]
};

/**
 * Menghasilkan 'sidik jari genomik' yang unik dan konsisten untuk setiap Ideon.
 * @param {string} canonicalName - Nama kanonikal dari Ideon.
 * @returns {string} - Hash SHA-256 sebagai ID.
 */
export function generateIdeonId(canonicalName) {
    // Menggunakan hash kriptografis memastikan bahwa nama yang sama akan selalu menghasilkan ID yang sama,
    // mencegah duplikasi Ideon dalam sistem.
    return createHash('sha256').update(canonicalName.toLowerCase().trim()).digest('hex');
}