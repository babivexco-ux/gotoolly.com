/**
 * Advanced Background Removal Tools
 * Version: 2.0.0
 * Description: Advanced algorithms for background removal and image segmentation
 */

(function() {
    'use strict';
    
    // ============================================
    // IMAGE TYPE DETECTOR
    // ============================================
    
    class ImageTypeDetector {
        /**
         * Detect the type of image for optimal processing
         * @param {ImageData} imageData - Source image data
         * @param {string} fileName - Optional filename for hints
         * @returns {string} Image type ('person', 'product', 'logo', 'document', 'mixed')
         */
        static detect(imageData, fileName = '') {
            const features = this.analyzeImageFeatures(imageData);
            let type = 'mixed';
            
            // Check filename for hints
            if (fileName) {
                const lowerName = fileName.toLowerCase();
                
                if (lowerName.includes('portrait') || lowerName.includes('person') || 
                    lowerName.includes('face') || lowerName.includes('profile')) {
                    return 'person';
                }
                
                if (lowerName.includes('product') || lowerName.includes('item') || 
                    lowerName.includes('object')) {
                    return 'product';
                }
                
                if (lowerName.includes('logo') || lowerName.includes('icon') || 
                    lowerName.includes('badge') || lowerName.includes('emblem')) {
                    return 'logo';
                }
                
                if (lowerName.includes('document') || lowerName.includes('text') || 
                    lowerName.includes('scan')) {
                    return 'document';
                }
            }
            
            // Determine based on features
            if (features.skinToneScore > 0.3 && features.faceLikeness > 0.5) {
                type = 'person';
            } else if (features.edgeSharpness > 0.7 && features.colorUniformity > 0.6) {
                type = 'product';
            } else if (features.highContrastAreas > 0.4 && features.smallFeatures > 0.5) {
                type = 'logo';
            } else if (features.textLikeness > 0.6) {
                type = 'document';
            }
            
            return type;
        }
        
        /**
         * Analyze image features for type detection
         * @param {ImageData} imageData - Source image data
         * @returns {Object} Feature scores
         */
        static analyzeImageFeatures(imageData) {
            const { width, height, data } = imageData;
            const features = {
                skinToneScore: 0,
                faceLikeness: 0,
                edgeSharpness: 0,
                colorUniformity: 0,
                highContrastAreas: 0,
                smallFeatures: 0,
                textLikeness: 0
            };
            
            const totalPixels = width * height;
            let skinPixels = 0;
            let edgePixels = 0;
            let highContrastPixels = 0;
            
            // Convert to grayscale for some analyses
            const gray = new Uint8ClampedArray(totalPixels);
            
            for (let i = 0, j = 0; i < data.length; i += 4, j++) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                
                // Skin tone detection
                if (window.ImageOptimizers.ColorUtils.isSkinTone(r, g, b)) {
                    skinPixels++;
                }
                
                // Grayscale conversion
                gray[j] = window.ImageOptimizers.ColorUtils.getLuminance(r, g, b);
            }
            
            // Edge and contrast analysis
            for (let y = 1; y < height - 1; y++) {
                for (let x = 1; x < width - 1; x++) {
                    const idx = y * width + x;
                    const grayValue = gray[idx];
                    
                    // Simple edge detection
                    const contrast = 
                        Math.abs(grayValue - gray[idx + 1]) + 
                        Math.abs(grayValue - gray[idx + width]);
                    
                    if (contrast > 50) {
                        edgePixels++;
                    }
                    
                    if (contrast > 100) {
                        highContrastPixels++;
                    }
                }
            }
            
            // Calculate scores
            features.skinToneScore = skinPixels / totalPixels;
            features.edgeSharpness = edgePixels / totalPixels;
            features.highContrastAreas = highContrastPixels / totalPixels;
            
            // Analyze color uniformity in borders
            features.colorUniformity = this.analyzeBorderUniformity(imageData, width, height);
            
            // Simple face detection (looking for face-like color patterns)
            features.faceLikeness = this.detectFaceLikeness(imageData, width, height);
            
            return features;
        }
        
        /**
         * Analyze border color uniformity
         * @private
         */
        static analyzeBorderUniformity(imageData, width, height) {
            const borderWidth = Math.min(20, Math.floor(width * 0.1));
            const borderColors = [];
            const { data } = imageData;
            
            // Sample border pixels
            for (let y = 0; y < borderWidth; y++) {
                for (let x = 0; x < width; x += 5) {
                    const idx = (y * width + x) * 4;
                    borderColors.push([data[idx], data[idx + 1], data[idx + 2]]);
                }
            }
            
            // Bottom border
            for (let y = height - borderWidth; y < height; y++) {
                for (let x = 0; x < width; x += 5) {
                    const idx = (y * width + x) * 4;
                    borderColors.push([data[idx], data[idx + 1], data[idx + 2]]);
                }
            }
            
            // Calculate color variance
            if (borderColors.length < 2) return 0;
            
            const mean = this.calculateMeanColor(borderColors);
            const variance = this.calculateColorVariance(borderColors, mean);
            
            // Normalize variance (0-1, where 1 is perfectly uniform)
            return Math.max(0, 1 - (variance / 10000));
        }
        
        /**
         * Simple face likeness detection
         * @private
         */
        static detectFaceLikeness(imageData, width, height) {
            // This is a simplified version - in production, use a proper face detection library
            const centerX = Math.floor(width / 2);
            const centerY = Math.floor(height / 3); // Faces are usually in upper third
            
            // Check if there's a skin-tone blob in the expected face area
            let skinInCenter = 0;
            let totalInCenter = 0;
            
            const detectionRadius = Math.min(width, height) / 4;
            
            for (let y = Math.max(0, centerY - detectionRadius); 
                 y < Math.min(height, centerY + detectionRadius); y++) {
                for (let x = Math.max(0, centerX - detectionRadius); 
                     x < Math.min(width, centerX + detectionRadius); x++) {
                    
                    const idx = (y * width + x) * 4;
                    const r = imageData.data[idx];
                    const g = imageData.data[idx + 1];
                    const b = imageData.data[idx + 2];
                    
                    if (window.ImageOptimizers.ColorUtils.isSkinTone(r, g, b)) {
                        skinInCenter++;
                    }
                    totalInCenter++;
                }
            }
            
            return totalInCenter > 0 ? skinInCenter / totalInCenter : 0;
        }
        
        /**
         * Calculate mean color
         * @private
         */
        static calculateMeanColor(colors) {
            let r = 0, g = 0, b = 0;
            
            for (const [cr, cg, cb] of colors) {
                r += cr;
                g += cg;
                b += cb;
            }
            
            return [
                r / colors.length,
                g / colors.length,
                b / colors.length
            ];
        }
        
        /**
         * Calculate color variance
         * @private
         */
        static calculateColorVariance(colors, mean) {
            let variance = 0;
            const [meanR, meanG, meanB] = mean;
            
            for (const [cr, cg, cb] of colors) {
                variance += Math.pow(cr - meanR, 2) +
                           Math.pow(cg - meanG, 2) +
                           Math.pow(cb - meanB, 2);
            }
            
            return variance / colors.length;
        }
    }
    
    // ============================================
    // PERSON/ PORTRAIT OPTIMIZER
    // ============================================
    
    class PortraitOptimizer {
        /**
         * Optimize background removal for portraits
         * @param {ImageData} processedData - Processed image data
         * @param {ImageData} originalData - Original image data
         * @param {Object} options - Processing options
         * @returns {ImageData} Optimized image data
         */
        static optimize(processedData, originalData, options = {}) {
            const { width, height } = processedData;
            const result = new Uint8ClampedArray(processedData.data);
            
            const config = {
                protectHair: options.protectHair !== false,
                protectSkin: options.protectSkin !== false,
                smoothEdges: options.smoothEdges !== false,
                fillHoles: options.fillHoles !== false,
                ...options
            };
            
            // 1. Detect and protect skin tones
            if (config.protectSkin) {
                this.protectSkinTones(result, originalData, width, height);
            }
            
            // 2. Enhance hair edges
            if (config.protectHair) {
                this.enhanceHairEdges(result, originalData, width, height);
            }
            
            // 3. Smooth jagged edges
            if (config.smoothEdges) {
                const imageData = new ImageData(result, width, height);
                const smoothed = window.ImageOptimizers.MaskUtils.blurMask(imageData, 1);
                result.set(smoothed.data);
            }
            
            // 4. Fill small holes
            if (config.fillHoles) {
                const imageData = new ImageData(result, width, height);
                const filled = window.ImageOptimizers.MaskUtils.fillHoles(imageData, 50);
                result.set(filled.data);
            }
            
            return new ImageData(result, width, height);
        }
        
        /**
         * Protect skin tone areas from being removed
         * @private
         */
        static protectSkinTones(resultData, originalData, width, height) {
            const original = originalData.data;
            
            for (let i = 0; i < resultData.length; i += 4) {
                const r = original[i];
                const g = original[i + 1];
                const b = original[i + 2];
                
                // If pixel is skin tone and currently transparent/semi-transparent
                if (window.ImageOptimizers.ColorUtils.isSkinTone(r, g, b)) {
                    const currentAlpha = resultData[i + 3];
                    
                    // Boost alpha for skin tones
                    if (currentAlpha < 200) {
                        resultData[i + 3] = Math.min(255, currentAlpha + 100);
                    }
                }
            }
        }
        
        /**
         * Enhance hair edges for natural look
         * @private
         */
        static enhanceHairEdges(resultData, originalData, width, height) {
            const original = originalData.data;
            
            // First pass: detect hair-like edges
            const hairEdges = this.detectHairEdges(originalData, width, height);
            
            // Second pass: enhance detected edges
            for (let i = 0, j = 0; i < resultData.length; i += 4, j++) {
                if (hairEdges[j] > 0.5) {
                    const currentAlpha = resultData[i + 3];
                    
                    // Create soft feather effect for hair edges
                    if (currentAlpha < 180) {
                        const enhanceAmount = Math.floor((1 - hairEdges[j]) * 75);
                        resultData[i + 3] = Math.min(255, currentAlpha + enhanceAmount);
                    }
                }
            }
        }
        
        /**
         * Detect hair-like edges (fine, wispy edges)
         * @private
         */
        static detectHairEdges(imageData, width, height) {
            const edges = new Float32Array(width * height);
            const { data } = imageData;
            
            // Convert to grayscale with emphasis on fine details
            const gray = new Uint8ClampedArray(width * height);
            
            for (let i = 0, j = 0; i < data.length; i += 4, j++) {
                // Use luminance with slight edge enhancement
                gray[j] = window.ImageOptimizers.ColorUtils.getLuminance(
                    data[i], data[i + 1], data[i + 2]
                );
            }
            
            // Detect fine edges using gradient magnitude
            for (let y = 2; y < height - 2; y++) {
                for (let x = 2; x < width - 2; x++) {
                    const idx = y * width + x;
                    
                    // Calculate gradient in 5x5 area for fine details
                    let maxGradient = 0;
                    
                    for (let dy = -2; dy <= 2; dy++) {
                        for (let dx = -2; dx <= 2; dx++) {
                            if (dx === 0 && dy === 0) continue;
                            
                            const nIdx = (y + dy) * width + (x + dx);
                            const gradient = Math.abs(gray[idx] - gray[nIdx]);
                            maxGradient = Math.max(maxGradient, gradient);
                        }
                    }
                    
                    // Normalize and store
                    edges[idx] = Math.min(1, maxGradient / 100);
                }
            }
            
            return edges;
        }
    }
    
    // ============================================
    // PRODUCT/ OBJECT OPTIMIZER
    // ============================================
    
    class ProductOptimizer {
        /**
         * Optimize background removal for products/objects
         * @param {ImageData} processedData - Processed image data
         * @param {ImageData} originalData - Original image data
         * @param {Object} options - Processing options
         * @returns {ImageData} Optimized image data
         */
        static optimize(processedData, originalData, options = {}) {
            const { width, height } = processedData;
            const result = new Uint8ClampedArray(processedData.data);
            
            const config = {
                sharpEdges: options.sharpEdges !== false,
                removeShadows: options.removeShadows !== false,
                cleanBackground: options.cleanBackground !== false,
                ...options
            };
            
            // 1. Sharpen edges for crisp product outlines
            if (config.sharpEdges) {
                this.sharpenEdges(result, width, height);
            }
            
            // 2. Remove shadow artifacts
            if (config.removeShadows) {
                this.removeShadows(result, originalData, width, height);
            }
            
            // 3. Clean up background residue
            if (config.cleanBackground) {
                this.cleanBackgroundResidue(result, originalData, width, height);
            }
            
            return new ImageData(result, width, height);
        }
        
        /**
         * Sharpen edges for product images
         * @private
         */
        static sharpenEdges(resultData, width, height) {
            const temp = new Uint8ClampedArray(resultData);
            
            for (let y = 1; y < height - 1; y++) {
                for (let x = 1; x < width - 1; x++) {
                    const idx = (y * width + x) * 4 + 3;
                    const alpha = temp[idx];
                    
                    // Check if this is an edge pixel
                    if (alpha > 10 && alpha < 245) {
                        // Look for transparent neighbors
                        let hasTransparentNeighbor = false;
                        let hasOpaqueNeighbor = false;
                        
                        for (let dy = -1; dy <= 1; dy++) {
                            for (let dx = -1; dx <= 1; dx++) {
                                if (dx === 0 && dy === 0) continue;
                                
                                const nIdx = ((y + dy) * width + (x + dx)) * 4 + 3;
                                const neighborAlpha = temp[nIdx];
                                
                                if (neighborAlpha < 10) hasTransparentNeighbor = true;
                                if (neighborAlpha > 245) hasOpaqueNeighbor = true;
                            }
                        }
                        
                        // If edge between foreground and background, make crisp
                        if (hasTransparentNeighbor && hasOpaqueNeighbor) {
                            resultData[idx] = alpha > 128 ? 255 : 0;
                        }
                    }
                }
            }
        }
        
        /**
         * Remove shadow artifacts
         * @private
         */
        static removeShadows(resultData, originalData, width, height) {
            const original = originalData.data;
            
            for (let i = 0; i < resultData.length; i += 4) {
                const alpha = resultData[i + 3];
                
                // Only process semi-transparent pixels
                if (alpha > 10 && alpha < 200) {
                    const r = original[i];
                    const g = original[i + 1];
                    const b = original[i + 2];
                    
                    // Check if pixel is dark (potential shadow)
                    const luminance = window.ImageOptimizers.ColorUtils.getLuminance(r, g, b);
                    
                    if (luminance < 50) {
                        // Likely a shadow - remove it
                        resultData[i + 3] = 0;
                    }
                }
            }
        }
        
        /**
         * Clean up background residue
         * @private
         */
        static cleanBackgroundResidue(resultData, originalData, width, height) {
            const original = originalData.data;
            
            // Detect background color from borders
            const bgColor = window.ImageOptimizers.BackgroundDetection
                .detectBackgroundColor(originalData);
            
            for (let i = 0; i < resultData.length; i += 4) {
                const alpha = resultData[i + 3];
                
                // Only check pixels that might be background residue
                if (alpha > 0 && alpha < 255) {
                    const r = original[i];
                    const g = original[i + 1];
                    const b = original[i + 2];
                    
                    // Check similarity to background
                    const distance = window.ImageOptimizers.ColorUtils.colorDistance(
                        r, g, b, bgColor[0], bgColor[1], bgColor[2]
                    );
                    
                    // If very similar to background, remove it
                    if (distance < 30) {
                        resultData[i + 3] = 0;
                    }
                }
            }
        }
    }
    
    // ============================================
    // LOGO/ TEXT OPTIMIZER
    // ============================================
    
    class LogoTextOptimizer {
        /**
         * Optimize background removal for logos and text
         * @param {ImageData} processedData - Processed image data
         * @param {ImageData} originalData - Original image data
         * @param {Object} options - Processing options
         * @returns {ImageData} Optimized image data
         */
        static optimize(processedData, originalData, options = {}) {
            const { width, height } = processedData;
            const result = new Uint8ClampedArray(processedData.data);
            
            const config = {
                preserveSharpness: options.preserveSharpness !== false,
                fillCharacterHoles: options.fillCharacterHoles !== false,
                removeAntiAliasing: options.removeAntiAliasing !== false,
                ...options
            };
            
            // 1. Preserve sharp edges (important for text)
            if (config.preserveSharpness) {
                this.preserveSharpEdges(result, originalData, width, height);
            }
            
            // 2. Fill holes inside characters
            if (config.fillCharacterHoles) {
                const imageData = new ImageData(result, width, height);
                const filled = window.ImageOptimizers.MaskUtils.fillHoles(imageData, 10);
                result.set(filled.data);
            }
            
            // 3. Remove anti-aliasing artifacts
            if (config.removeAntiAliasing) {
                this.removeAntiAliasing(result, width, height);
            }
            
            return new ImageData(result, width, height);
        }
        
        /**
         * Preserve sharp edges important for text readability
         * @private
         */
        static preserveSharpEdges(resultData, originalData, width, height) {
            const original = originalData.data;
            const edgeMap = this.detectSharpEdges(originalData, width, height);
            
            for (let i = 0, j = 0; i < resultData.length; i += 4, j++) {
                if (edgeMap[j] > 0.7) {
                    // This is a sharp edge - make sure it's fully opaque
                    resultData[i + 3] = 255;
                }
            }
        }
        
        /**
         * Detect sharp edges (high contrast boundaries)
         * @private
         */
        static detectSharpEdges(imageData, width, height) {
            const edges = new Float32Array(width * height);
            const { data } = imageData;
            
            // Convert to grayscale
            const gray = new Uint8ClampedArray(width * height);
            
            for (let i = 0, j = 0; i < data.length; i += 4, j++) {
                gray[j] = window.ImageOptimizers.ColorUtils.getLuminance(
                    data[i], data[i + 1], data[i + 2]
                );
            }
            
            // Detect high-contrast edges
            for (let y = 1; y < height - 1; y++) {
                for (let x = 1; x < width - 1; x++) {
                    const idx = y * width + x;
                    const center = gray[idx];
                    
                    // Check immediate neighbors for high contrast
                    let maxContrast = 0;
                    
                    for (let dy = -1; dy <= 1; dy++) {
                        for (let dx = -1; dx <= 1; dx++) {
                            if (dx === 0 && dy === 0) continue;
                            
                            const nIdx = (y + dy) * width + (x + dx);
                            const contrast = Math.abs(center - gray[nIdx]);
                            maxContrast = Math.max(maxContrast, contrast);
                        }
                    }
                    
                    // Store normalized contrast
                    edges[idx] = Math.min(1, maxContrast / 100);
                }
            }
            
            return edges;
        }
        
        /**
         * Remove anti-aliasing artifacts
         * @private
         */
        static removeAntiAliasing(resultData, width, height) {
            const temp = new Uint8ClampedArray(resultData);
            
            for (let y = 1; y < height - 1; y++) {
                for (let x = 1; x < width - 1; x++) {
                    const idx = (y * width + x) * 4 + 3;
                    const alpha = temp[idx];
                    
                    // Only process semi-transparent pixels
                    if (alpha > 10 && alpha < 245) {
                        // Check if this is isolated anti-aliasing
                        let opaqueNeighbors = 0;
                        let transparentNeighbors = 0;
                        
                        for (let dy = -1; dy <= 1; dy++) {
                            for (let dx = -1; dx <= 1; dx++) {
                                if (dx === 0 && dy === 0) continue;
                                
                                const nIdx = ((y + dy) * width + (x + dx)) * 4 + 3;
                                const neighborAlpha = temp[nIdx];
                                
                                if (neighborAlpha > 245) opaqueNeighbors++;
                                if (neighborAlpha < 10) transparentNeighbors++;
                            }
                        }
                        
                        // If surrounded by opaque pixels, make opaque
                        if (opaqueNeighbors >= 5) {
                            resultData[idx] = 255;
                        }
                        // If surrounded by transparent pixels, make transparent
                        else if (transparentNeighbors >= 5) {
                            resultData[idx] = 0;
                        }
                    }
                }
            }
        }
    }
    
    // ============================================
    // EDGE CLEANUP PROCESSOR
    // ============================================
    
    class EdgeCleanupProcessor {
        /**
         * Clean up edges and remove halo artifacts
         * @param {ImageData} processedData - Processed image data
         * @param {ImageData} originalData - Original image data
         * @param {Object} options - Cleanup options
         * @returns {ImageData} Cleaned image data
         */
        static cleanup(processedData, originalData, options = {}) {
            const { width, height } = processedData;
            const result = new Uint8ClampedArray(processedData.data);
            
            const config = {
                intensity: options.intensity || 0.8,
                removeHalo: options.removeHalo !== false,
                smoothTransition: options.smoothTransition !== false,
                ...options
            };
            
            // 1. Detect and remove halo artifacts
            if (config.removeHalo) {
                this.removeHaloArtifacts(result, originalData, width, height, config.intensity);
            }
            
            // 2. Smooth edge transitions
            if (config.smoothTransition) {
                this.smoothEdgeTransitions(result, width, height);
            }
            
            // 3. Remove isolated pixels
            this.removeIsolatedPixels(result, width, height);
            
            return new ImageData(result, width, height);
        }
        
        /**
         * Remove halo artifacts (background residue on edges)
         * @private
         */
        static removeHaloArtifacts(resultData, originalData, width, height, intensity) {
            const original = originalData.data;
            
            // Detect background color
            const bgColor = window.ImageOptimizers.BackgroundDetection
                .detectBackgroundColor(originalData);
            
            for (let y = 1; y < height - 1; y++) {
                for (let x = 1; x < width - 1; x++) {
                    const idx = (y * width + x) * 4 + 3;
                    const alpha = resultData[idx];
                    
                    // Only process edge pixels
                    if (alpha > 10 && alpha < 245) {
                        // Check if this pixel is on an edge
                        let hasTransparentNeighbor = false;
                        let hasOpaqueNeighbor = false;
                        
                        for (let dy = -1; dy <= 1; dy++) {
                            for (let dx = -1; dx <= 1; dx++) {
                                if (dx === 0 && dy === 0) continue;
                                
                                const nIdx = ((y + dy) * width + (x + dx)) * 4 + 3;
                                const neighborAlpha = resultData[nIdx];
                                
                                if (neighborAlpha < 10) hasTransparentNeighbor = true;
                                if (neighborAlpha > 245) hasOpaqueNeighbor = true;
                            }
                        }
                        
                        // If this is an edge pixel
                        if (hasTransparentNeighbor && hasOpaqueNeighbor) {
                            const pixelIdx = idx - 3;
                            const r = original[pixelIdx];
                            const g = original[pixelIdx + 1];
                            const b = original[pixelIdx + 2];
                            
                            // Check similarity to background
                            const distance = window.ImageOptimizers.ColorUtils.colorDistance(
                                r, g, b, bgColor[0], bgColor[1], bgColor[2]
                            );
                            
                            // Remove if similar to background (halo artifact)
                            const threshold = 60 * (1 - intensity);
                            if (distance < threshold) {
                                resultData[idx] = 0;
                            }
                        }
                    }
                }
            }
        }
        
        /**
         * Smooth edge transitions
         * @private
         */
        static smoothEdgeTransitions(resultData, width, height) {
            const temp = new Uint8ClampedArray(resultData);
            
            // Apply simple smoothing to edge pixels
            for (let y = 1; y < height - 1; y++) {
                for (let x = 1; x < width - 1; x++) {
                    const idx = (y * width + x) * 4 + 3;
                    const alpha = temp[idx];
                    
                    // Only process edge pixels
                    if (alpha > 10 && alpha < 245) {
                        let sum = 0;
                        let count = 0;
                        
                        // Average with neighbors
                        for (let dy = -1; dy <= 1; dy++) {
                            for (let dx = -1; dx <= 1; dx++) {
                                const nIdx = ((y + dy) * width + (x + dx)) * 4 + 3;
                                sum += temp[nIdx];
                                count++;
                            }
                        }
                        
                        resultData[idx] = Math.round(sum / count);
                    }
                }
            }
        }
        
        /**
         * Remove isolated pixels (speckles)
         * @private
         */
        static removeIsolatedPixels(resultData, width, height) {
            const temp = new Uint8ClampedArray(resultData);
            
            for (let y = 1; y < height - 1; y++) {
                for (let x = 1; x < width - 1; x++) {
                    const idx = (y * width + x) * 4 + 3;
                    const alpha = temp[idx];
                    
                    // Check isolated opaque pixels
                    if (alpha > 200) {
                        let transparentNeighbors = 0;
                        
                        for (let dy = -1; dy <= 1; dy++) {
                            for (let dx = -1; dx <= 1; dx++) {
                                if (dx === 0 && dy === 0) continue;
                                
                                const nIdx = ((y + dy) * width + (x + dx)) * 4 + 3;
                                if (temp[nIdx] < 50) {
                                    transparentNeighbors++;
                                }
                            }
                        }
                        
                        // If surrounded by transparency, remove isolated pixel
                        if (transparentNeighbors >= 6) {
                            resultData[idx] = 0;
                        }
                    }
                }
            }
        }
    }
    
    // ============================================
    // MASK REFINEMENT TOOLS
    // ============================================
    
    class MaskRefinementTools {
        constructor() {
            this.brushHistory = [];
            this.maxHistory = 20;
        }
        
        /**
         * Apply brush stroke to mask
         * @param {Uint8ClampedArray} maskData - Current mask data
         * @param {number} x - Brush center X
         * @param {number} y - Brush center Y
         * @param {number} size - Brush size
         * @param {string} mode - 'add' or 'remove'
         * @param {number} width - Image width
         * @param {number} height - Image height
         * @returns {Uint8ClampedArray} Updated mask data
         */
        applyBrushStroke(maskData, x, y, size, mode, width, height) {
            // Save current state for undo
            this.saveState(maskData);
            
            const radius = Math.floor(size / 2);
            const value = mode === 'add' ? 255 : 0;
            
            // Apply circular brush
            for (let dy = -radius; dy <= radius; dy++) {
                for (let dx = -radius; dx <= radius; dx++) {
                    // Check if within circle
                    if (dx * dx + dy * dy <= radius * radius) {
                        const px = Math.floor(x + dx);
                        const py = Math.floor(y + dy);
                        
                        if (px >= 0 && px < width && py >= 0 && py < height) {
                            const idx = (py * width + px) * 4 + 3;
                            maskData[idx] = value;
                        }
                    }
                }
            }
            
            return maskData;
        }
        
        /**
         * Undo last brush stroke
         * @param {Uint8ClampedArray} maskData - Current mask data
         * @returns {Uint8ClampedArray} Previous mask data or null
         */
        undo(maskData) {
            if (this.brushHistory.length > 0) {
                const previous = this.brushHistory.pop();
                maskData.set(previous);
                return maskData;
            }
            return null;
        }
        
        /**
         * Save current mask state
         * @private
         */
        saveState(maskData) {
            // Clone current state
            const state = new Uint8ClampedArray(maskData);
            this.brushHistory.push(state);
            
            // Limit history size
            if (this.brushHistory.length > this.maxHistory) {
                this.brushHistory.shift();
            }
        }
        
        /**
         * Clear brush history
         */
        clearHistory() {
            this.brushHistory = [];
        }
    }
    
    // ============================================
    // MAIN PROCESSOR
    // ============================================
    
    class BackgroundRemovalProcessor {
        /**
         * Process image with optimal settings based on image type
         * @param {ImageData} originalData - Original image data
         * @param {string} imageType - Image type ('person', 'product', 'logo', 'auto')
         * @param {Object} options - Processing options
         * @returns {Promise<ImageData>} Processed image data
         */
        static async process(originalData, imageType = 'auto', options = {}) {
            // Auto-detect image type if needed
            let type = imageType;
            if (type === 'auto') {
                type = ImageTypeDetector.detect(originalData);
            }
            
            console.log(`Processing as ${type} image`);
            
            // Initial processing based on type
            let processedData = await this.initialProcessing(originalData, type, options);
            
            // Apply type-specific optimizations
            processedData = this.applyTypeOptimizations(processedData, originalData, type, options);
            
            // Apply edge cleanup
            if (options.edgeCleanup !== false) {
                processedData = EdgeCleanupProcessor.cleanup(
                    processedData, 
                    originalData, 
                    { intensity: options.edgeCleanupIntensity || 0.8 }
                );
            }
            
            // Apply final refinements
            processedData = this.applyFinalRefinements(processedData, originalData, options);
            
            return processedData;
        }
        
        /**
         * Initial processing step
         * @private
         */
        static async initialProcessing(originalData, type, options) {
            // For now, use basic color-based segmentation
            // In production, this would use AI models (TensorFlow.js, etc.)
            
            const { width, height } = originalData;
            const result = new Uint8ClampedArray(originalData.data);
            
            // Detect background color
            const bgColor = window.ImageOptimizers.BackgroundDetection
                .detectBackgroundColor(originalData);
            
            // Create initial mask
            for (let i = 0; i < result.length; i += 4) {
                const r = originalData.data[i];
                const g = originalData.data[i + 1];
                const b = originalData.data[i + 2];
                
                const distance = window.ImageOptimizers.ColorUtils.colorDistance(
                    r, g, b, bgColor[0], bgColor[1], bgColor[2]
                );
                
                // Simple thresholding (adjust based on image type)
                let threshold = 50;
                if (type === 'person') threshold = 40;
                if (type === 'product') threshold = 60;
                if (type === 'logo') threshold = 30;
                
                if (distance < threshold) {
                    result[i + 3] = 0; // Make transparent
                }
            }
            
            return new ImageData(result, width, height);
        }
        
        /**
         * Apply type-specific optimizations
         * @private
         */
        static applyTypeOptimizations(processedData, originalData, type, options) {
            switch (type) {
                case 'person':
                    return PortraitOptimizer.optimize(processedData, originalData, {
                        protectHair: options.protectHair !== false,
                        protectSkin: options.protectSkin !== false,
                        smoothEdges: options.smoothEdges !== false,
                        fillHoles: options.fillHoles !== false
                    });
                    
                case 'product':
                    return ProductOptimizer.optimize(processedData, originalData, {
                        sharpEdges: options.sharpEdges !== false,
                        removeShadows: options.removeShadows !== false,
                        cleanBackground: options.cleanBackground !== false
                    });
                    
                case 'logo':
                case 'document':
                    return LogoTextOptimizer.optimize(processedData, originalData, {
                        preserveSharpness: options.preserveSharpness !== false,
                        fillCharacterHoles: options.fillCharacterHoles !== false,
                        removeAntiAliasing: options.removeAntiAliasing !== false
                    });
                    
                default:
                    return processedData;
            }
        }
        
        /**
         * Apply final refinements
         * @private
         */
        static applyFinalRefinements(processedData, originalData, options) {
            const { width, height } = processedData;
            const result = new Uint8ClampedArray(processedData.data);
            
            // Fill small holes
            if (options.fillHoles !== false) {
                const imageData = new ImageData(result, width, height);
                const filled = window.ImageOptimizers.MaskUtils.fillHoles(imageData, 100);
                result.set(filled.data);
            }
            
            // Smooth edges if requested
            if (options.smoothEdges) {
                const imageData = new ImageData(result, width, height);
                const smoothed = window.ImageOptimizers.MaskUtils.blurMask(imageData, 1);
                result.set(smoothed.data);
            }
            
            return new ImageData(result, width, height);
        }
    }
    
    // ============================================
    // EXPORT ALL CLASSES
    // ============================================
    
    window.BackgroundRemovalTools = {
        ImageTypeDetector,
        PortraitOptimizer,
        ProductOptimizer,
        LogoTextOptimizer,
        EdgeCleanupProcessor,
        MaskRefinementTools,
        BackgroundRemovalProcessor
    };
    
    console.log('Background Removal Tools loaded successfully');
    
})();