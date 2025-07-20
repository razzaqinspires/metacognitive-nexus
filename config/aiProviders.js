// File: metacognitive-nexus/config/aiProviders.js
// Ini akan menjadi konfigurasi AI kita.
// API Keys sebaiknya diambil dari environment variables di produksi,
// namun untuk pengembangan awal dan agar bisa segera upload,
// kita akan letakkan placeholder di sini.
// INGAT: JANGAN KOMIT API KEY SENSITIF KE REPO PUBLIK!
// Ini hanyalah contoh struktur.
export const aiProvidersConfig = {
    defaultProvider: 'openai', // Provider default untuk prioritas awal (meskipun DSO akan override)
    providers: {
        openai: {
            apiKeys: [
                process.env.OPENAI_API_KEY_1 || 'sk-YOUR_OPENAI_KEY_1',
                process.env.OPENAI_API_KEY_2 || 'sk-YOUR_OPENAI_KEY_2',
            ].filter(key => key && !key.includes('YOUR_')),
            models: ['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'],
            // Urutan model eksplisit untuk degradasi, semakin kecil indexnya semakin canggih
            modelOrder: {
                'gpt-4o': 0,
                'gpt-4-turbo': 1,
                'gpt-3.5-turbo': 2
            },
            qualityWeight: 1.0, // Bobot kualitas untuk OpenAI (contoh)
            latencyWeight: 1.0,
            costWeight: 1.0,
        },
        gemini: {
            apiKeys: [
                process.env.GEMINI_API_KEY_1 || 'AIzaSyA_YOUR_GEMINI_KEY_1',
                process.env.GEMINI_API_KEY_2 || 'AIzaSyA_YOUR_GEMINI_KEY_2',
            ].filter(key => key && !key.includes('YOUR_')),
            models: ['gemini-1.5-pro-latest', 'gemini-pro'],
            modelOrder: {
                'gemini-1.5-pro-latest': 0,
                'gemini-pro': 1
            },
            qualityWeight: 0.9, // Bobot kualitas untuk Gemini (contoh)
            latencyWeight: 1.0,
            costWeight: 1.0,
        },
        groq: {
            apiKeys: [
                process.env.GROQ_API_KEY_1 || 'gsk_YOUR_GROQ_KEY_1',
            ].filter(key => key && !key.includes('YOUR_')),
            models: ['llama3-8b-8192', 'llama3-70b-8192'], // Perhatikan model yang tersedia di Groq
            modelOrder: {
                'llama3-8b-8192': 0,
                'llama3-70b-8192': 1 // 70b umumnya lebih lambat dan mahal, jadi prioritas lebih rendah
            },
            qualityWeight: 0.8, // Bobot kualitas untuk Groq (contoh)
            latencyWeight: 0.5, // Groq biasanya sangat cepat, jadi bobot latensi bisa lebih rendah jika kita memprioritaskan ini
            costWeight: 1.0,
        },
    },
};