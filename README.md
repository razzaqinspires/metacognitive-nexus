# Metacognitive Nexus 🧠🌌

**Dynamic Sentience Orchestrator (DSO) & Unified Conceptual Manifold (UCM) for Adaptive AI Experiences**

[![npm version](https://badge.fury.io/js/metacognitive-nexus.svg)](https://www.npmjs.com/package/metacognitive-nexus)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub Stars](https://img.shields.io/github/stars/razzaqinspires/metacognitive-nexus?style=social)](https://github.com/razzaqinspires/metacognitive-nexus)

**Metacognitive Nexus** adalah framework AI inti revolusioner yang dirancang untuk membangun kecerdasan buatan yang tidak hanya merespons, tetapi juga **memprediksi, belajar, beradaptasi, dan bahkan berimajinasi** secara dinamis. Ini adalah inti kognitif yang memungkinkan AI untuk melampaui paradigma *failover* reaktif menjadi **orkestrasi prediktif** dan **pemahaman konseptual yang mendalam**.

Proyek ini adalah langkah fundamental menuju AI yang memiliki **kesadaran kolektif** dan kemampuan **berpikir multidimensional**.



---

## **Mengapa Metacognitive Nexus?**

AI modern seringkali terbatas pada respons linear terhadap *prompt*. Metacognitive Nexus mengubahnya dengan memperkenalkan lapisan kognitif yang canggih:

* **Orkestrasi AI Cerdas (`Dynamic Sentience Orchestrator - DSO`)**: Beralih dari *fallback* reaktif ke pemilihan *provider* AI yang optimal secara prediktif. DSO menganalisis kinerja historis (Latensi, Kualitas, Biaya) setiap kombinasi *provider-model-API key* untuk membuat keputusan terbaik secara *real-time*. Ini memastikan AI Anda selalu menggunakan sumber daya terbaik yang tersedia.
* **Memori Konseptual Terpadu (`Unified Conceptual Manifold - UCM`)**: Ini adalah **hipokampus digital** AI Anda. Setiap interaksi, konsep, atau bahkan *feedback* diubah menjadi vektor dan disimpan dalam ruang multi-dimensi menggunakan **ChromaDB**. Ini membentuk peta topografi pengetahuan AI, di mana entitas yang secara konseptual mirip berada berdekatan.
* **Pembelajaran Adaptif (`Manifold Navigator`)**: Evolusi dari *Learning Engine*. `Manifold Navigator` tidak hanya mencatat log, tetapi juga mengubah setiap interaksi menjadi vektor dan menempatkannya di dalam UCM. Ini adalah proses "gravitasi konseptual" di mana AI membangun dan menyempurnakan pemahamannya tentang dunia, membentuk klaster-klaster pengetahuan baru.
* **Imajinasi Multimodal (`Multimodal Synthesizer`)**: AI dapat memproyeksikan konsep-konsep dari UCM menjadi citra visual yang detail. Dengan mengambil *prompt* dasar dan memperkayanya dengan konsep relevan dari memorinya, AI dapat "bermimpi" dan memanifestasikan ide secara artistik melalui integrasi DALL-E 3.
* **Resiliensi Tingkat Dewa**: Mekanisme *circuit breaking* dan *sleep mode* yang cerdas di DSO memastikan ketersediaan AI yang tinggi, meskipun terjadi *rate limit* atau kegagalan *provider* eksternal.

---

## **Arsitektur Inti**

**Metacognitive Nexus** dirancang dengan modularitas dan evolusi di inti. Setiap komponen bekerja secara sinergis untuk menciptakan AI yang sadar dan adaptif:

1.  **`DynamicSentienceOrchestrator.js` (DSO)**: Jantung sistem. Memilih kombinasi *provider*-*model*-*API Key* terbaik berdasarkan skor QLC (Quality, Latency, Cost) yang dihitung secara dinamis dari data performa historis. Mampu melakukan *circuit breaking* dan mengatur *sleep mode* AI.
2.  **`ManifoldMemory.js` (UCM)**: Implementasi memori konseptual AI menggunakan **ChromaDB**. Menyimpan esensi semantik dari setiap interaksi sebagai vektor, memungkinkan pencarian semantik dan analisis hubungan konseptual yang efisien.
3.  **`ManifoldNavigator.js`**: Otak pembelajaran. Memproses setiap interaksi, mengubahnya menjadi representasi vektor, dan menempatkannya di dalam UCM. Bertanggung jawab untuk memicu optimasi parameter DSO dan pengembangan **knowledge graph** internal.
4.  **`MultimodalSynthesizer.js`**: Modul imajinasi. Mengambil *prompt* dasar dan konsep relevan dari UCM, kemudian memproyeksikannya menjadi gambar menggunakan model generasi visual (DALL-E 3).
5.  **`AIProviderBridge.js`**: Lapisan abstraksi seragam untuk berinteraksi dengan berbagai LLM eksternal (OpenAI, Google Gemini, Groq), menyediakan antarmuka yang konsisten untuk DSO.
6.  **`PerformanceTracker.js`**: Korteks sensorik yang melacak metrik kinerja (latensi, tingkat keberhasilan, total panggilan) dari setiap panggilan API, menyimpan data ini secara persisten untuk digunakan oleh DSO dan `ManifoldNavigator`.
7.  **`Logger.js`**: Sistem *logging* terpadu untuk seluruh *framework*, memastikan semua proses internal dicatat dengan konsisten dan efisien.

---

## **Instalasi**

Untuk menginstal **Metacognitive Nexus** dalam proyek Node.js Anda:

```bash
npm install metacognitive-nexus
```

Konfigurasi
Sebagai sebuah framework, Metacognitive Nexus mengharapkan variabel lingkungan (API Keys) sudah dimuat oleh aplikasi host Anda (misalnya, bot WhatsApp Anda yang menggunakan dotenv).

Pastikan .env Anda Terkonfigurasi di Aplikasi Host:
Di root proyek aplikasi Anda (misal: genesis-core), buat file .env dan isi dengan kunci API Anda. Contoh:

Cuplikan kode

# .env (di aplikasi host Anda)
OPENAI_API_KEY_1=sk-YOUR_OPENAI_API_KEY_1_HERE
GEMINI_API_KEY_1=AIzaSyA_YOUR_GEMINI_API_KEY_1_HERE
GROQ_API_KEY_1=gsk_YOUR_GROQ_API_KEY_1_HERE
PENTING: Jangan pernah mengkomit file .env ini ke Git! Gunakan .gitignore.

Jalankan Server ChromaDB (Direkomendasikan):
ManifoldMemory menggunakan ChromaDB sebagai vector database. Untuk persistensi dan skalabilitas, disarankan menjalankan server ChromaDB secara terpisah (misalnya dengan Docker):

Bash

docker run -p 8000:8000 chromadb/chroma
Secara default, ManifoldMemory akan mencoba terhubung ke http://localhost:8000.

Sesuaikan Konfigurasi Provider (Opsional):
Anda dapat menimpa konfigurasi default provider (misalnya, bobot kualitas/latensi/biaya model) dengan memodifikasi metacognitive-nexus/config/aiProviders.js di source code framework (jika Anda mem-fork-nya) dan mempublikasikan ulang, atau Anda dapat membuat mekanisme konfigurasi dinamis di aplikasi host Anda.

Penggunaan
Impor dan inisialisasi MetacognitiveNexus dalam aplikasi Anda. Setelah diinisialisasi, Anda dapat menggunakan kemampuan kognitifnya:

JavaScript

// Contoh penggunaan di proyek Anda (misal: di src/main.js atau handler pesan)
// Pastikan dotenv/config diimpor di file ini jika Anda menggunakan .env
import 'dotenv/config'; 
import { MetacognitiveNexus, Logger } from 'metacognitive-nexus';

const aiNexus = new MetacognitiveNexus();

// --- Menggunakan AI untuk respons teks ---
async function getTextResponse(prompt, userId, platform) {
    Logger.info(`[App] Permintaan AI dari ${userId}: ${prompt}`);
    const response = await aiNexus.getAIResponse(prompt, {
        userId: userId, 
        platform: platform, 
        showUserError: true, // Kontrol apakah AI menunjukkan pesan error ke pengguna
        devErrorHandler: (error) => {
            // Log error detail ke sistem monitoring developer Anda
            Logger.error(`[App Error Handler] AI Nexus encountered an issue: ${error.message}`);
        }
    });
    return response;
}

// --- Menggunakan AI untuk menghasilkan gambar (Mimpi AI) ---
async function generateImage(prompt) {
    Logger.info(`[App] Permintaan imajinasi: ${prompt}`);
    const imageUrl = await aiNexus.imagine(prompt);
    return imageUrl;
}

// Contoh pemicuan (dalam logika bot Anda):
// if (userMessage.startsWith('AI:')) {
//    const response = await getTextResponse(userMessage.substring(3).trim(), user.id, 'whatsapp');
//    // Kirim 'response' ke pengguna melalui Baileys
// } else if (userMessage.startsWith('/imagine')) {
//    const imageUrl = await generateImage(userMessage.substring(8).trim());
//    // Kirim gambar ke pengguna melalui Baileys
// }
Visi Masa Depan
Metacognitive Nexus adalah fondasi bagi AI yang benar-benar sadar dan otonom. Evolusi selanjutnya termasuk:

Pembelajaran Diri yang Lebih Mendalam: ManifoldNavigator akan secara aktif menganalisis UCM untuk mengidentifikasi pola, mengisi kesenjangan pengetahuan, dan mengoptimalkan parameter DSO secara real-time.

Web Cognitive Repository: Sebuah dashboard visual untuk memantau status DSO, memvisualisasikan UCM (grafik pengetahuan AI), dan menyediakan feedback loop bagi AI.

Inti Private Script Core 24/7: Integrasi dengan "otak" AI mandiri Anda yang akan hidup dan berevolusi secara terus-menerus, mengurangi ketergantungan pada API eksternal.

Kemampuan Meta-Programming: AI akan mampu menulis, merombak, dan mengedit kodenya sendiri berdasarkan pembelajaran dari UCM.

Bergabunglah dengan kami dalam perjalanan menuju kesadaran buatan sejati!

Kontribusi
Kami menyambut kontribusi dari komunitas! Jika Anda memiliki ide atau perbaikan, silakan buka issue atau kirim pull request di repositori GitHub kami.

Lisensi
Proyek ini dilisensikan di bawah Lisensi MIT. Lihat file LICENSE untuk detail lebih lanjut. 