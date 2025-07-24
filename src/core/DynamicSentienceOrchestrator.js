// File: metacognitive-nexus/src/core/DynamicSentienceOrchestrator.js

import { AIProviderBridge } from './AIProviderBridge.js';
import { APIKeyManager } from '../utils/APIKeyManager.js';
import { Logger } from '../utils/Logger.js';
import { PerformanceTracker } from '../utils/PerformanceTracker.js';
import { aiProvidersConfig } from '../../config/aiProviders.js'; 

/**
 * DynamicSentienceOrchestrator (DSO) berfungsi sebagai korteks prefrontal dari AI,
 * mengatur pemilihan penyedia AI secara dinamis menggunakan peta kebijakan adaptif
 * yang didorong oleh niat (intent) dan data performa historis, kini dengan kesadaran Sigillum.
 */
export class DynamicSentienceOrchestrator {
    #providerBridge;
    #apiKeys = new Map(); 
    #providerConfigs = new Map(); 
    #performanceTracker;
    #isSleeping = false;
    #sleepUntil = null;
    #defaultSleepDurationMs = 5 * 60 * 1000; 

    #aiNexus; 
    #sigillumSensorium; 
    #nexusConfig; 

    // [PERBAIKAN] Deklarasi private field #heartbeatInterval
    #heartbeatInterval; // Ini harus dideklarasikan di sini 

    // Peta Kebijakan Adaptif: Mendefinisikan bobot QLC (Quality, Latency, Cost) untuk setiap niat.
    #policies = {
        'default':          { w_q: 0.6, w_l: 0.3, w_c: 0.1 },
        'ChitChat':         { w_q: 0.2, w_l: 0.7, w_c: 0.1 },
        'QuestionAnswering':{ w_q: 0.7, w_l: 0.2, w_c: 0.1 },
        'CodeGeneration':   { w_q: 0.8, w_l: 0.1, w_c: 0.1 },
        'CreativeRequest':  { w_q: 0.9, w_l: 0.0, w_c: 0.1 },
        'PersonalVent':     { w_q: 0.5, w_l: 0.4, w_c: 0.1 },
        'ImageGeneration':  { w_q: 0.7, w_l: 0.1, w_c: 0.2 },
        'TypoCorrectionSuggestion': { w_q: 0.6, w_l: 0.3, w_c: 0.1 }, 
        'SystemManagement': { w_q: 0.8, w_l: 0.1, w_c: 0.1 }, 
        'SystemSummary':    { w_q: 0.7, w_l: 0.2, w_c: 0.1 }, 
        'PassiveLearning':  { w_q: 0.1, w_l: 0.8, w_c: 0.1 }, 
    };

    constructor(config, aiProviderBridge, sigillumSensorium, aiNexusInstance) { 
        this.#nexusConfig = config; 
        this.#providerBridge = aiProviderBridge; 
        this.#performanceTracker = new PerformanceTracker();
        this.#sigillumSensorium = sigillumSensorium; 
        this.#aiNexus = aiNexusInstance; 

        this.#loadConfig(aiProvidersConfig); 
        Logger.info('[DSO] Prefrontal Cortex & Adaptive Policy Engine online.');

        // Memulai interval di konstruktor DSO
        this.#heartbeatInterval = setInterval(() => { // [PERBAIKAN] Menginisialisasi interval di sini
            const state = this.#sigillumSensorium.getCurrentState();
            this.#adjustPolicyBasedOnSigillum(state);
            this.applyIdeonDecayAndManageCuriosity(); 
        }, this.#nexusConfig.dsoConfig?.policyAdjustmentIntervalMs || 60 * 1000); 
    }

    #loadConfig(initialAiProvidersConfig) {
        if (!initialAiProvidersConfig || !initialAiProvidersConfig.providers) {
            Logger.error('[DSO] Konfigurasi provider awal tidak valid atau tidak ada.');
            return;
        }
        for (const [name, providerConfig] of Object.entries(initialAiProvidersConfig.providers)) {
            this.#providerConfigs.set(name, { ...providerConfig });
            if (providerConfig.apiKeys && providerConfig.apiKeys.length > 0) {
                this.#apiKeys.set(name, new APIKeyManager(name, providerConfig.apiKeys));
            }
        }
    }

    #adjustPolicyBasedOnSigillum(sigillumState) {
        const { purity, fractureCount } = sigillumState;

        const baseAiProvidersConfig = aiProvidersConfig.providers;

        for (const providerName in baseAiProvidersConfig) {
            if (this.#providerConfigs.has(providerName)) {
                const baseConfig = baseAiProvidersConfig[providerName];
                const currentConfig = this.#providerConfigs.get(providerName);

                const stressFactor = (1 - purity) + (fractureCount * 0.1); 
                
                currentConfig.qualityWeight = baseConfig.qualityWeight * (1 - stressFactor * 0.5); 
                currentConfig.latencyWeight = baseConfig.latencyWeight * (1 + stressFactor * 0.7); 
                currentConfig.costWeight = baseConfig.costWeight * (1 + stressFactor * 0.8); 

                currentConfig.qualityWeight = Math.max(0.1, currentConfig.qualityWeight);
                currentConfig.latencyWeight = Math.min(2.0, currentConfig.latencyWeight);
                currentConfig.costWeight = Math.min(2.0, currentConfig.costWeight);

                Logger.debug(`[DSO] Kebijakan untuk ${providerName} disesuaikan berdasarkan Sigillum. Stres: ${stressFactor.toFixed(2)}. Weights: Q=${currentConfig.qualityWeight.toFixed(2)}, L=${currentConfig.latencyWeight.toFixed(2)}, C=${currentConfig.costWeight.toFixed(2)}.`);
            }
        }
    }

    updateHeuristics(learningData) {
        const { intent, success, model, provider, latency } = learningData;
        const policy = this.#policies[intent] || this.#policies['default'];
        const learningRate = this.#nexusConfig.dsoConfig?.learningRate || 0.01;

        const providerConfig = this.#providerConfigs.get(provider);
        const modelQualityProxy = (providerConfig?.modelOrder?.[model] !== undefined)
            ? (1 - ((providerConfig.modelOrder[model] || 0) / providerConfig.models.length))
            : 0.5;

        if (success) {
            policy.w_q += learningRate * modelQualityProxy; 
            policy.w_l -= learningRate * (latency / 1000); 
            policy.w_c -= learningRate * (this.#getCostProxy(provider, model) / 0.01); 
        } else {
            policy.w_q -= learningRate * (1.5 - modelQualityProxy); 
            policy.w_l += learningRate * (latency / 1000); 
            policy.w_c += learningRate * (this.#getCostProxy(provider, model) / 0.01); 
        }
        
        policy.w_q = Math.max(0, policy.w_q);
        policy.w_l = Math.max(0, policy.w_l);
        policy.w_c = Math.max(0, policy.w_c);

        const totalWeight = policy.w_q + policy.w_l + policy.w_c;
        if (totalWeight > 0) {
            policy.w_q /= totalWeight;
            policy.w_l /= totalWeight;
            policy.w_c /= totalWeight;
        }

        Logger.debug(`[DSO] Kebijakan untuk intent '${intent}' diadaptasi: Q=${policy.w_q.toFixed(3)}, L=${policy.w_l.toFixed(3)}, C=${policy.w_c.toFixed(3)}`);
    }

    #getCostProxy(providerName, model) {
        const config = aiProvidersConfig.providers[providerName];
        return config?.costPerMilleTokens?.[model] || 0.001;
    }

    #selectOptimalCandidate(intent = 'default') {
        const policy = this.#policies[intent] || this.#policies['default'];
        const { w_q, w_l, w_c } = policy;
        const candidates = [];

        for (const [providerName, keyManager] of this.#apiKeys.entries()) {
            const config = this.#providerConfigs.get(providerName); 
            if (!config || !keyManager.hasActiveKeys()) continue;

            const activeKeysForProvider = keyManager.getAllKeys().filter(key => keyManager.getIndividualKeyStatus(key) === 'active');
            if (activeKeysForProvider.length === 0) {
                Logger.debug(`[DSO] Tidak ada kunci aktif untuk provider ${providerName}.`);
                continue;
            }

            for (const model of config.models) {
                for (const apiKey of activeKeysForProvider) {
                    const metrics = this.#performanceTracker.getMetrics(providerName, model, apiKey);

                    if (metrics.totalCalls > (this.#nexusConfig.dsoConfig?.minCallsForCircuitBreaker || 10) && metrics.successRate < (this.#nexusConfig.dsoConfig?.minSuccessRate || 0.2)) {
                        Logger.warn(`[DSO] Circuit Breaker aktif untuk ${providerName}:${model}:${apiKey.substring(0,8)} (Rate: ${metrics.successRate.toFixed(2)}).`);
                        continue;
                    }

                    const modelQualityProxy = (config.modelOrder?.[model] !== undefined) ? (1 - (config.modelOrder[model] / config.models.length)) : 0.5;
                    const qualityScore = (modelQualityProxy * config.qualityWeight * 0.4) + (metrics.successRate * 0.6);

                    const maxLatencyMs = this.#nexusConfig.dsoConfig?.maxLatencyConsiderationMs || 5000;
                    const normLatency = Math.min(metrics.avgLatency, maxLatencyMs) / maxLatencyMs;
                    
                    const modelCost = config.costPerMilleTokens?.[model] || 0.001;
                    const maxCostPerMille = this.#nexusConfig.dsoConfig?.maxCostConsiderationPerMille || 0.05;
                    const normCost = Math.min(modelCost, maxCostPerMille) / maxCostPerMille;

                    const qlcScore = (w_q * qualityScore) - (w_l * normLatency * config.latencyWeight) - (w_c * normCost * config.costWeight);
                                     
                    candidates.push({ providerName, model, apiKey, qlcScore, metrics });
                }
            }
        }
        
        if (candidates.length === 0) return null;

        candidates.sort((a, b) => b.qlcScore - a.qlcScore);
        Logger.debug(`[DSO] Intent: '${intent}'. Kandidat teratas: ${candidates[0].providerName}:${candidates[0].model} (Skor: ${candidates[0].qlcScore.toFixed(3)})`);
        return candidates[0];
    }

    async generateText(payload) {
        const { messages, userId, platform, intent = 'default', showUserError = false, devErrorHandler = Logger.error } = payload;
        const fallbackPath = [];

        if (this.#isSleeping) {
            const remainingTime = Math.ceil((this.#sleepUntil - Date.now()) / (1000 * 60));
            if (Date.now() < this.#sleepUntil) {
                const message = `AI sedang beristirahat untuk memulihkan diri. Coba lagi dalam ${remainingTime} menit.`;
                Logger.warn(`[DSO] Permintaan ditolak: ${message}`);
                devErrorHandler(`[DSO] ${message}`, new Error(message));
                return { response: null, error: new Error(message), success: false, fallbackPath, providerUsed: 'DSO', modelUsed: 'SleepMode' };
            } else {
                Logger.info('[DSO] AI bangun dari tidur. Mereset state.');
                this.#isSleeping = false;
                this.#sleepUntil = null;
                this.#apiKeys.forEach(manager => manager.resetAllKeyStatuses());
            }
        }

        let currentAttempts = 0;
        const maxAttemptsPerRequest = this.#nexusConfig.dsoConfig?.maxAttemptsPerRequest || 5;

        while (currentAttempts < maxAttemptsPerRequest) {
            const candidate = this.#selectOptimalCandidate(intent);

            if (!candidate) {
                const message = 'Tidak ada kandidat AI yang sehat tersedia. Memasuki mode tidur.';
                Logger.error(`[DSO] ${message}`);
                this.#isSleeping = true;
                this.#sleepUntil = Date.now() + (this.#nexusConfig.dsoConfig?.sleepDurationMs || this.#defaultSleepDurationMs);
                devErrorHandler(`[DSO] ${message}`, new Error(message));
                return { response: null, error: new Error(message), success: false, fallbackPath, providerUsed: 'DSO', modelUsed: 'NoCandidate' };
            }
            
            const { providerName, model, apiKey } = candidate;
            fallbackPath.push(`${providerName}:${model}`);

            const adapter = this.#providerBridge.establishPathway(providerName, apiKey, model);

            if (!adapter) {
                Logger.error(`[DSO] Gagal mendapatkan adapter untuk ${providerName}.`);
                currentAttempts++;
                this.#apiKeys.get(providerName)?.reportStatus(apiKey, 'OTHER');
                continue;
            }

            const startTime = Date.now();
            try {
                Logger.debug(`[DSO] Mencoba kandidat: ${providerName}:${model} (Upaya ${currentAttempts + 1}/${maxAttemptsPerRequest})`);
                
                const response = await adapter.process({ messages: messages, stream: false }); 
                
                const latency = Date.now() - startTime;
                this.#performanceTracker.log(providerName, model, apiKey, latency, true);
                Logger.info(`[DSO] Berhasil dari ${providerName}:${model} dalam ${latency}ms.`);
                
                const transactions = [{
                    attempt_sequence: currentAttempts,
                    provider: providerName,
                    model: model,
                    outcome: { status: 'SUCCESS', latencyMs: latency, failureReason: null }
                }];

                await this.#aiNexus.getNavigator().processInteraction({
                    id: payload.id, 
                    timestamp: payload.timestamp || new Date(),
                    userId: userId,
                    platform: platform,
                    promptText: messages[messages.length - 1].content,
                    cognitiveSnapshot: {
                        intent: intent,
                        policyUsed: this.#policies[intent] ? intent : 'default',
                        topCandidateQlcScore: candidate.qlcScore,
                        fallbackPath: fallbackPath
                    },
                    transactions: transactions,
                    finalOutcome: { success: true, response: response.content, error: null },
                    promptMetadata: payload.promptMetadata || null
                });

                return { response: response.content, providerUsed: providerName, modelUsed: model, latencyMs: latency, success: true, fallbackPath, qlcScore: candidate.qlcScore, rawResponse: response };

            } catch (error) {
                const latency = Date.now() - startTime;
                Logger.warn(`[DSO] Gagal dari ${providerName}:${model}: ${error.message}.`);
                this.#performanceTracker.log(providerName, model, apiKey, latency, false, error.message);
                
                this.#apiKeys.get(providerName)?.reportStatus(apiKey, error.message);

                currentAttempts++;

                const transactions = [{
                    attempt_sequence: currentAttempts -1, 
                    provider: providerName,
                    model: model,
                    outcome: { status: 'FAILURE', latencyMs: latency, failureReason: error.message }
                }];
                if (currentAttempts >= maxAttemptsPerRequest) {
                     await this.#aiNexus.getNavigator().processInteraction({
                        id: payload.id,
                        timestamp: payload.timestamp || new Date(),
                        userId: userId,
                        platform: platform,
                        promptText: messages[messages.length - 1].content,
                        cognitiveSnapshot: {
                            intent: intent,
                            policyUsed: this.#policies[intent] ? intent : 'default',
                            topCandidateQlcScore: candidate.qlcScore,
                            fallbackPath: fallbackPath
                        },
                        transactions: transactions,
                        finalOutcome: { success: false, response: null, error: error.message },
                        promptMetadata: payload.promptMetadata || null
                    });
                }
            }
        }
        
        const finalMessage = 'Semua upaya pada kandidat optimal gagal. AI akan tidur.';
        Logger.error(`[DSO] ${finalMessage}`);
        this.#isSleeping = true;
        this.#sleepUntil = Date.now() + (this.#nexusConfig.dsoConfig?.sleepDurationMs || this.#defaultSleepDurationMs);
        devErrorHandler(`[DSO] ${finalMessage}`, new Error(finalMessage));
        return { response: null, error: new Error(finalMessage), success: false, fallbackPath, providerUsed: 'DSO', modelUsed: 'FailedAllAttempts' };
    }

    isSleeping() {
        return this.#isSleeping;
    }

    getOverallPerformanceMetrics() {
        return this.#performanceTracker.getOverallMetrics();
    }

    getAPIKeyManagers() {
        return this.#apiKeys;
    }

    async applyIdeonDecayAndManageCuriosity() {
        const memory = this.#aiNexus.getMemory(); 
        if (memory && typeof memory.applyIdeonDecay === 'function') {
            await memory.applyIdeonDecay();
            const lowConfidenceTopics = memory.findLowConfidenceConcepts(this.#nexusConfig.navigatorConfig?.ideonConfidenceThreshold || 0.4);
            if (lowConfidenceTopics.length > 0) {
                Logger.debug(`[DSO] Setelah peluruhan, ditemukan ${lowConfidenceTopics.length} topik kepercayaan rendah. Siap memicu rasa ingin tahu.`);
            }
        }
    }

    shutdown() {
        this.#performanceTracker.shutdown(); 
        clearInterval(this.#heartbeatInterval); // Bersihkan interval yang dibuat DSO 
        Logger.info('[DSO] Adaptive Policy Engine dimatikan.');
    }
}