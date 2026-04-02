
import { create, all } from 'mathjs';
import { TMonteCarloResult, TSimulationParameter } from '../types';

const math = create(all, {});

export const MathService = {
    /**
     * Generates a random number following a Gaussian (Normal) distribution.
     * Uses Box-Muller transform.
     */
    gaussianRandom(mean: number, stdDev: number): number {
        const u = 1 - Math.random(); // Converting [0,1) to (0,1]
        const v = Math.random();
        const z = Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
        return z * stdDev + mean;
    },

    uniformRandom(min: number, max: number): number {
        return min + Math.random() * (max - min);
    },

    triangularRandom(min: number, max: number): number {
        const u = Math.random();
        const mode = (min + max) / 2;
        if (u < (mode - min) / (max - min)) {
            return min + Math.sqrt(u * (max - min) * (mode - min));
        } else {
            return max - Math.sqrt((1 - u) * (max - min) * (max - mode));
        }
    },

    /**
     * Runs a Monte Carlo simulation based on provided parameters.
     */
    runMonteCarlo(parameters: TSimulationParameter[], iterations: number = 1000): TMonteCarloResult {
        const results: number[] = [];

        for (let i = 0; i < iterations; i++) {
            let iterationTotal = 0;
            
            parameters.forEach(param => {
                let value = 0;
                const dist = param.distributionType || 'Normal';
                
                if (dist === 'Uniform') {
                    value = this.uniformRandom(param.min, param.max);
                } else if (dist === 'Triangular') {
                    value = this.triangularRandom(param.min, param.max);
                } else {
                    // Normal
                    const mean = (param.max + param.min) / 2;
                    const stdDev = (param.max - param.min) / 6;
                    value = this.gaussianRandom(mean, stdDev);
                    value = Math.max(param.min, Math.min(param.max, value));
                }
                
                iterationTotal += value;
            });

            results.push(iterationTotal);
        }

        // Use mathjs for precise statistical calculations
        const p10 = math.quantileSeq(results, 0.1) as number;
        const p50 = math.quantileSeq(results, 0.5) as number; // Median
        const p90 = math.quantileSeq(results, 0.9) as number;
        const mean = math.mean(results) as number;

        // Generate Histograms Buckets
        const bucketCount = 10;
        const minVal = math.min(results);
        const maxVal = math.max(results);
        const range = maxVal - minVal;
        const bucketSize = range / bucketCount;

        const buckets = [];
        for(let b=0; b<bucketCount; b++) {
             const currentBoundary = minVal + b * bucketSize;
             const bucketEnd = currentBoundary + bucketSize;
             const count = results.filter(r => r >= currentBoundary && r < bucketEnd).length;
             
             // Normalize height for UI (0-100)
             const heightPercent = (count / iterations) * 100 * 3;

             buckets.push({
                 range: `${Math.round(currentBoundary)}-${Math.round(bucketEnd)}`,
                 count: count,
                 heightPercent: Math.min(heightPercent, 100)
             });
        }

        return {
            mean: Math.round(mean),
            median: Math.round(p50),
            p10: Math.round(p10),
            p90: Math.round(p90),
            iterations,
            buckets,
            recommendation: "" 
        };
    },

    /**
     * Calculates Cosine Similarity between two vectors.
     * Used for Semantic Search / RAG.
     */
    cosineSimilarity(vecA: number[], vecB: number[]): number {
        if (vecA.length !== vecB.length) {
            throw new Error("Vector length mismatch");
        }
        const dotProduct = math.dot(vecA, vecB);
        const normA = math.norm(vecA) as number;
        const normB = math.norm(vecB) as number;
        
        if (normA === 0 || normB === 0) return 0;
        return dotProduct / (normA * normB);
    }
};
