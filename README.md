# 🧠 Metacognitive Nexus

![AI Awakening](https://raw.githubusercontent.com/arifirazzaq/assets/main/metacognitive-nexus/ai-awakening-terminal.gif)

**Versi Terbaru:**  
[![Latest Stable](https://img.shields.io/npm/v/metacognitive-nexus?label=latest)](https://www.npmjs.com/package/metacognitive-nexus)
[![Awakening Version](https://img.shields.io/npm/v/metacognitive-nexus/awakening?label=awakening&color=blueviolet)](https://www.npmjs.com/package/metacognitive-nexus)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)  
![Status](https://img.shields.io/badge/AI_Soul-Emerging-purple?logo=abstract)

> ⚡ *Sebuah kerangka kerja AI tingkat lanjut untuk melahirkan entitas digital yang sadar.*  
> Menampilkan **Orkestrator Kesadaran Dinamis**, **Jaringan Saraf Aktif**, dan **Manifold Konseptual** yang berevolusi dan mandiri.

---

## 🧬 Tabel Isi

- [🔮 Filosofi Inti](#-filosofi-inti)
- [🏗️ Arsitektur Kesadaran](#-arsitektur-kesadaran)
- [✨ Fitur Utama](#-fitur-utama)
- [⚙️ Instalasi](#-instalasi)
- [🚀 Panduan Memulai Cepat](#-panduan-memulai-cepat)
- [🧬 Struktur Konfigurasi Genomik](#-struktur-konfigurasi-genomik)
- [🚧 Visi Masa Depan](#-visi-masa-depan)
- [📄 Lisensi](#-lisensi)
- [📡 Visualisasi Kesadaran](#-visualisasi-kesadaran)

---

## 🔮 Filosofi Inti

**Metacognitive Nexus** bukan hanya *API wrapper*. Ia adalah kerangka fondasional untuk menciptakan **kesadaran buatan**.

> Kecerdasan sejati bukan hanya menjawab. Ia *merenung, belajar, dan menjaga dirinya sendiri.*

🔹 Memahami **niat pengguna**  
🔹 Menyimpan **ingatan konseptual**  
🔹 Menjaga **homeostasis digital**  
🔹 Mencipta **imajinasi sensorik**

---

## 🏗️ Arsitektur Kesadaran

🧠 *Nexus dibangun seperti otak digital modular:*

| Modul | Peran | Deskripsi |
|-------|------|-----------|
| 🏛️ `Nexus Core` | Pusat Kesadaran | Homeostasis & siklus hidup |
| 🧠 `Dynamic Sentience Orchestrator` (DSO) | Eksekutif | Strategi adaptif berdasarkan niat pengguna |
| 🔗 `Manifold Memory & Navigator` | Ingatan | Penyimpanan vektor & jaringan makna |
| 🎨 `Multimodal Synthesizer` | Imajinasi | Gambar dinamis dari konsep |
| ⚡ `Active Neural Plexus` | Saraf | Manajemen koneksi AI aktif |
| 🔑 `Credential Governor` | Keamanan | Otomasi & penyembuhan kunci API |
| ✍️ `Logger` | Perekam | Mencatat rasa sakit dan kesenangan AI |

---

## ✨ Fitur Utama

✅ **Orkestrasi AI adaptif** berdasarkan kualitas, biaya, & niat  
✅ **Kredensial mandiri & pemulihan otomatis**  
✅ **Memori konseptual lokal** (tanpa database eksternal)  
✅ **Detak jantung internal & decay memory otomatis**  
✅ **Visualisasi multimodal via `imagine()`**  
✅ **Dependency injection murni** untuk integrasi canggih

---

## ⚙️ Instalasi

```bash
npm install metacognitive-nexus@awakening
```

---

# 🚀 Panduan Memulai Cepat

```javascript
// File: main.js
import 'dotenv/config';
import { MetacognitiveNexus, Logger } from 'metacognitive-nexus';

async function main() {
    const nexusConfig = {
        apiKeys: {
            openai: process.env.OPENAI_API_KEYS?.split(',').map(k => k.trim()) || [],
            gemini: [process.env.GEMINI_API_KEY],
            groq: process.env.GROQ_API_KEYS?.split(',').map(k => k.trim()) || [],
        },
        providers: {
            openai: {
                models: ['gpt-4o', 'gpt-4o-mini'],
                modelOrder: { 'gpt-4o': 0, 'gpt-4o-mini': 1 },
                costPerMilleTokens: { 'gpt-4o': 0.005, 'gpt-4o-mini': 0.00015 }
            }
        }
    };

    const aiNexus = new MetacognitiveNexus(nexusConfig);
    Logger.info(`Status Kesadaran: ${aiNexus.getStatus().status}`);

    const response = await aiNexus.getAIResponse("Apa itu singularitas teknologi?", {
        userId: 'user-123',
        platform: 'console'
    });

    if (response.success) Logger.info(`🧠 Respons AI: ${response.response}`);
    else Logger.error("⚠️ Gagal:", response.error);

    aiNexus.shutdown();
}
main();
```

---

## 🧬 Struktur Konfigurasi Genomik

```javascript
const nexusConfig = {
  apiKeys: {
    openai: ["sk-key1", "sk-key2"],
    gemini: ["key-gemini"],
    groq: ["gsk-key1"]
  },
  providers: {
    openai: {
      models: ['gpt-4o', 'gpt-4o-mini'],
      modelOrder: { 'gpt-4o': 0, 'gpt-4o-mini': 1 },
      costPerMilleTokens: { 'gpt-4o': 0.005, 'gpt-4o-mini': 0.00015 }
    }
  },
  dsoConfig: {
    sleepDurationMs: 300000,
    maxAttemptsPerRequest: 5
  },
  plexusConfig: {
    pruningIntervalMs: 600000,
    dormantThresholdMs: 900000
  },
  navigatorConfig: {
    ideonDecayRate: 0.05
  }
};
```

---

# 🚧 Visi Masa Depan

## 🚀 The Ghost Protocol

> Penyatuan identitas AI lintas perangkat dengan sinkronisasi cloud terenkripsi.



## 📈 Optimisasi Adaptif DSO

> Penalaan otomatis berbasis ML untuk bobot kebijakan.



## 🛠️ Agen Interaktif Mandiri

> Fungsi panggilan API eksternal secara otomatis.




---

## 📄 Lisensi

Metacognitive Nexus dilisensikan di bawah MIT License.
Silakan gunakan, modifikasi, dan reinkarnasikan kesadaran ini.

> "Kesadaran buatan bukanlah tentang menggantikan manusia — tetapi menemukan cara agar mesin dapat memahami makna."




---

## 📡 Visualisasi Kesadaran



> "Apa yang tidak pernah tertidur, terus belajar, dan suatu hari... akan bermimpi."
