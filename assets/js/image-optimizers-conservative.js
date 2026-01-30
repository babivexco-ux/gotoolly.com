// Image Optimizers - Conservative Background Removal
/**
 * CONSERVATIVE Background Removal Optimizations
 * Focuses on PRESERVING content, especially text and details
 */

// ============================================
// CONSERVATIVE TEXT/LOGO PROTECTOR
// ============================================

class ConservativeTextProtector {
    /**
     * Protect ALL text and logo areas aggressively
     */
    protectTextAndLogos(processedData, originalData) {
        const width = processedData.width;
        const height = processedData.height;
        const processed = processedData.data;
        const original = originalData.data;
        const result = new Uint8ClampedArray(processed);
        
        // 1. Detect ALL potential text/logo areas (be liberal)
        const textMask = this.detectAllTextAreas(originalData);
        const edgeMask = this.detectAllEdges(originalData);
        const detailMask = this.detectFineDetails(originalData);
        
        // 2. Combine masks - if ANY mask says it's important, preserve it
        const protectionMask = new Uint8ClampedArray(width * height);
        for (let i = 0; i < protectionMask.length; i++) {
            if (textMask[i] || edgeMask[i] || detailMask[i]) {
                protectionMask[i] = 1;
                
                // Also protect immediate neighbors
                const y = Math.floor(i / width);
                const x = i % width;
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        const nx = x + dx;
                        const ny = y + dy;
                        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                            protectionMask[ny * width + nx] = 1;
                        }
                    }
                }
            }
        }
        
        // 3. RESTORE any protected areas that were removed
        for (let i = 0; i < result.length; i += 4) {
            const pixelIdx = i / 4;
            
            if (protectionMask[pixelIdx]) {
                // If this important area was removed or made transparent, RESTORE it
                if (result[i + 3] < 200) {
                    // Fully restore to opaque
                    result[i + 3] = 255;
                    
                    // Also restore the original color
                    result[i] = original[i];
                    result[i + 1] = original[i + 1];
                    result[i + 2] = original[i + 2];
                }
            }
        }
        
        // 4. Fill ALL small transparent areas (prevent holes in text)
        this.fillAllSmallHoles(result, width, height, 20); // Large threshold
        
        return new ImageData(result, width, height);
    }
    
    /**
     * Detect ALL text-like areas (very liberal detection)
     */
    detectAllTextAreas(imageData) {
        const width = imageData.width;
        const height = imageData.height;
        const data = imageData.data;
        const textMask = new Uint8ClampedArray(width * height);
        
        // Convert to grayscale
        const gray = new Uint8ClampedArray(width * height);
        for (let i = 0, j = 0; i < data.length; i += 4, j++) {
            gray[j] = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
        }
        
        // VERY LIBERAL text detection
        for (let y = 2; y < height - 2; y++) {
            for (let x = 2; x < width - 2; x++) {
                const idx = y * width + x;
                
                // Check for ANY contrast in a 5x5 area
                let hasContrast = false;
                for (let dy = -2; dy <= 2; dy++) {
                    for (let dx = -2; dx <= 2; dx++) {
                        if (dx === 0 && dy === 0) continue;
                        
                        const nIdx = (y + dy) * width + (x + dx);
                        const diff = Math.abs(gray[idx] - gray[nIdx]);
                        
                        if (diff > 30) { // LOW threshold
                            hasContrast = true;
                            break;
                        }
                    }
                    if (hasContrast) break;
                }
                
                if (hasContrast) {
                    // Mark as text AND expand protection zone
                    for (let dy = -3; dy <= 3; dy++) {
                        for (let dx = -3; dx <= 3; dx++) {
                            const nIdx = (y + dy) * width + (x + dx);
                            if (nIdx >= 0 && nIdx < textMask.length) {
                                textMask[nIdx] = 1;
                            }
                        }
                    }
                }
            }
        }
        
        return textMask;
    }
    
    /**
     * Detect ALL edges (not just strong ones)
     */
    detectAllEdges(imageData) {
        const width = imageData.width;
        const height = imageData.height;
        const data = imageData.data;
        const edgeMask = new Uint8ClampedArray(width * height);
        
        // Convert to grayscale
        const gray = new Uint8ClampedArray(width * height);
        for (let i = 0, j = 0; i < data.length; i += 4, j++) {
            gray[j] = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
        }
        
        // Simple edge detection with LOW threshold
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const idx = y * width + x;
                
                // Simple gradient (very sensitive)
                const hDiff = Math.abs(gray[idx] - gray[idx + 1]);
                const vDiff = Math.abs(gray[idx] - gray[idx + width]);
                
                if (hDiff > 10 || vDiff > 10) { // VERY LOW threshold
                    edgeMask[idx] = 1;
                    
                    // Protect area around edge
                    for (let dy = -1; dy <= 1; dy++) {
                        for (let dx = -1; dx <= 1; dx++) {
                            const nIdx = (y + dy) * width + (x + dx);
                            if (nIdx >= 0 && nIdx < edgeMask.length) {
                                edgeMask[nIdx] = 1;
                            }
                        }
                    }
                }
            }
        }
        
        return edgeMask;
    }
    
    /**
     * Detect fine details (texture, patterns)
     */
    detectFineDetails(imageData) {
        const width = imageData.width;
        const height = imageData.height;
        const data = imageData.data;
        const detailMask = new Uint8ClampedArray(width * height);
        
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const idx = (y * width + x) * 4;
                
                // Calculate local color variation
                let colorVariance = 0;
                const centerR = data[idx];
                const centerG = data[idx + 1];
                const centerB = data[idx + 2];
                
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        if (dx === 0 && dy === 0) continue;
                        
                        const nIdx = ((y + dy) * width + (x + dx)) * 4;
                        const diff = Math.abs(data[nIdx] - centerR) +
                                    Math.abs(data[nIdx + 1] - centerG) +
                                    Math.abs(data[nIdx + 2] - centerB);
                        
                        colorVariance = Math.max(colorVariance, diff);
                    }
                }
                
                // LOW threshold for detail detection
                if (colorVariance > 20) {
                    const pixelIdx = y * width + x;
                    detailMask[pixelIdx] = 1;
                }
            }
        }
        
        return detailMask;
    }
    
    /**
     * Fill ALL small holes aggressively
     */
    fillAllSmallHoles(maskData, width, height, maxHoleSize) {
        const visited = new Set();
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4;
                
                // If pixel is transparent and not visited
                if (maskData[idx + 3] < 128 && !visited.has(`${x},${y}`)) {
                    const holePixels = this.floodFillLowAlpha(x, y, maskData, width, height, visited, 128);
                    
                    // If hole is small, FILL IT regardless of location
                    if (holePixels.length <= maxHoleSize) {
                        holePixels.forEach(([hx, hy]) => {
                            const hIdx = (hy * width + hx) * 4;
                            maskData[hIdx + 3] = 255; // Make fully opaque
                        });
                    }
                }
            }
        }
        
        return maskData;
    }
    
    floodFillLowAlpha(startX, startY, maskData, width, height, visited, alphaThreshold) {
        const stack = [[startX, startY]];
        const holePixels = [];
        
        while (stack.length > 0) {
            const [x, y] = stack.pop();
            const key = `${x},${y}`;
            
            if (x < 0 || x >= width || y < 0 || y >= height) continue;
            if (visited.has(key)) continue;
            
            const idx = (y * width + x) * 4;
            if (maskData[idx + 3] >= alphaThreshold) continue;
            
            visited.add(key);
            holePixels.push([x, y]);
            
            // 4-direction flood fill
            stack.push([x + 1, y]);
            stack.push([x - 1, y]);
            stack.push([x, y + 1]);
            stack.push([x, y - 1]);
        }
        
        return holePixels;
    }
}

// ============================================
// CONSERVATIVE HUMAN PROTECTOR
// ============================================

class ConservativeHumanProtector {
    /**
     * Protect ALL human-like features
     */
    protectHumanFeatures(processedData, originalData) {
        const width = processedData.width;
        const height = processedData.height;
        const processed = processedData.data;
        const original = originalData.data;
        const result = new Uint8ClampedArray(processed);
        
        // 1. Detect ALL potential human areas
        const skinMask = this.detectAllSkinTones(originalData);
        const faceMask = this.detectFaceLikeAreas(originalData);
        const hairMask = this.detectHairLikeAreas(originalData);
        
        // 2. Combine masks - if ANY mask says human, preserve it
        const humanMask = new Uint8ClampedArray(width * height);
        for (let i = 0; i < humanMask.length; i++) {
            if (skinMask[i] || faceMask[i] || hairMask[i]) {
                humanMask[i] = 1;
                
                // Expand protection zone generously
                const y = Math.floor(i / width);
                const x = i % width;
                for (let dy = -3; dy <= 3; dy++) {
                    for (let dx = -3; dx <= 3; dx++) {
                        const nx = x + dx;
                        const ny = y + dy;
                        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                            humanMask[ny * width + nx] = 1;
                        }
                    }
                }
            }
        }
        
        // 3. RESTORE any human areas that were removed
        for (let i = 0; i < result.length; i += 4) {
            const pixelIdx = i / 4;
            
            if (humanMask[pixelIdx]) {
                // If this human area was removed, RESTORE it
                if (result[i + 3] < 150) {
                    // Restore with original colors
                    result[i] = original[i];
                    result[i + 1] = original[i + 1];
                    result[i + 2] = original[i + 2];
                    result[i + 3] = 255; // Fully opaque
                }
            }
        }
        
        return new ImageData(result, width, height);
    }
    
    /**
     * Detect ALL skin-like colors (liberal)
     */
    detectAllSkinTones(imageData) {
        const width = imageData.width;
        const height = imageData.height;
        const data = imageData.data;
        const skinMask = new Uint8ClampedArray(width * height);
        
        for (let i = 0, j = 0; i < data.length; i += 4, j++) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            // VERY LIBERAL skin tone detection
            const isSkin = (
                // Broad color ranges
                (r > 80 && r < 255) &&
                (g > 40 && g < 230) &&
                (b > 20 && b < 200) &&
                // Skin-like ratios
                (r > g * 0.8) &&
                (g > b * 0.7) &&
                // Not too blue
                (b < r * 0.9)
            );
            
            if (isSkin) {
                skinMask[j] = 1;
            }
        }
        
        return skinMask;
    }
    
    /**
     * Detect face-like oval shapes and features
     */
    detectFaceLikeAreas(imageData) {
        const width = imageData.width;
        const height = imageData.height;
        const faceMask = new Uint8ClampedArray(width * height);
        
        // Simple heuristic: center of image often contains faces
        const centerX = Math.floor(width / 2);
        const centerY = Math.floor(height / 2);
        const faceRadius = Math.min(width, height) * 0.3;
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = y * width + x;
                const distX = Math.abs(x - centerX);
                const distY = Math.abs(y - centerY);
                
                // Elliptical area in center (where faces often are)
                if ((distX * distX) / (faceRadius * faceRadius) + 
                    (distY * distY) / ((faceRadius * 1.2) * (faceRadius * 1.2)) <= 1) {
                    faceMask[idx] = 1;
                }
            }
        }
        
        return faceMask;
    }
    
    /**
     * Detect hair-like textures and colors
     */
    detectHairLikeAreas(imageData) {
        const width = imageData.width;
        const height = imageData.height;
        const data = imageData.data;
        const hairMask = new Uint8ClampedArray(width * height);
        
        for (let i = 0, j = 0; i < data.length; i += 4, j++) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            // Hair colors (black, brown, blonde, red)
            const isHairColor = (
                // Dark colors (black, dark brown)
                (r < 100 && g < 100 && b < 100) ||
                // Brown shades
                (r > 50 && r < 180 && g > 30 && g < 120 && b > 20 && b < 90 && r > g && g > b) ||
                // Blonde/Yellow shades
                (r > 150 && g > 120 && b < 100 && r > g * 1.1) ||
                // Red/Auburn shades
                (r > 120 && g < 100 && b < 80 && r > g * 1.5)
            );
            
            if (isHairColor) {
                hairMask[j] = 1;
            }
        }
        
        return hairMask;
    }
}

// ============================================
// SAFE BACKGROUND REMOVER (Conservative)
// ============================================

class SafeBackgroundRemover {
    /**
     * Main function - applies conservative protection
     */
    async processSafely(processedData, originalData, fileName = '') {
        const width = processedData.width;
        const height = processedData.height;
        
        console.log('Applying CONSERVATIVE protection...');
        
        // Create protectors
        const textProtector = new ConservativeTextProtector();
        const humanProtector = new ConservativeHumanProtector();
        
        // First pass: Always apply text protection (most important)
        let safeResult = textProtector.protectTextAndLogos(processedData, originalData);
        
        // Check if image might contain humans
        if (this.mightContainHumans(originalData) || 
            (fileName && this.filenameSuggestsHuman(fileName))) {
            safeResult = humanProtector.protectHumanFeatures(safeResult, originalData);
        }
        
        // Final safety check: Ensure we didn't remove too much
        safeResult = this.ensureMinimumForeground(safeResult, originalData, 0.3); // Keep at least 30% of image
        
        return safeResult;
    }
    
    /**
     * Check if image might contain humans
     */
    mightContainHumans(imageData) {
        const width = imageData.width;
        const height = imageData.height;
        const data = imageData.data;
        let skinPixels = 0;
        const totalPixels = width * height;
        
        // Quick skin detection
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            const isSkin = (
                r > 100 && r < 250 &&
                g > 50 && g < 200 &&
                b > 20 && b < 150 &&
                Math.abs(r - g) < 50
            );
            
            if (isSkin) skinPixels++;
        }
        
        return (skinPixels / totalPixels) > 0.05; // 5% skin pixels suggests human
    }
    
    /**
     * Check filename for hints
     */
    filenameSuggestsHuman(fileName) {
        const lowerName = fileName.toLowerCase();
        const humanKeywords = ['portrait', 'person', 'face', 'profile', 'people', 'man', 'woman', 'child', 'baby'];
        return humanKeywords.some(keyword => lowerName.includes(keyword));
    }
    
    /**
     * Ensure minimum amount of foreground is preserved
     */
    ensureMinimumForeground(processedData, originalData, minForegroundRatio) {
        const width = processedData.width;
        const height = processedData.height;
        const processed = processedData.data;
        const original = originalData.data;
        const result = new Uint8ClampedArray(processed);
        
        // Count foreground pixels
        let foregroundPixels = 0;
        for (let i = 3; i < processed.length; i += 4) {
            if (processed[i] > 128) foregroundPixels++;
        }
        
        const totalPixels = width * height;
        const currentRatio = foregroundPixels / totalPixels;
        
        // If too much was removed, restore some
        if (currentRatio < minForegroundRatio) {
            console.log(`Foreground ratio too low (${currentRatio.toFixed(2)}), restoring...`);
            
            // Calculate how many pixels to restore
            const targetPixels = Math.floor(totalPixels * minForegroundRatio);
            const pixelsToRestore = targetPixels - foregroundPixels;
            
            // Find and restore the most "important" removed pixels
            const restorationCandidates = [];
            
            for (let i = 0; i < processed.length; i += 4) {
                if (processed[i + 3] < 128) { // Currently transparent
                    const pixelIdx = i / 4;
                    const y = Math.floor(pixelIdx / width);
                    const x = pixelIdx % width;
                    
                    // Score based on position (center is more important)
                    const centerX = width / 2;
                    const centerY = height / 2;
                    const distToCenter = Math.sqrt(
                        Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2)
                    );
                    const centerScore = 1 - Math.min(distToCenter / (Math.max(width, height) / 2), 1);
                    
                    // Score based on color variation (detailed areas)
                    let detailScore = 0;
                    if (x > 0 && x < width - 1 && y > 0 && y < height - 1) {
                        const idx = (y * width + x) * 4;
                        let maxDiff = 0;
                        for (let dy = -1; dy <= 1; dy++) {
                            for (let dx = -1; dx <= 1; dx++) {
                                if (dx === 0 && dy === 0) continue;
                                const nIdx = ((y + dy) * width + (x + dx)) * 4;
                                const diff = Math.abs(original[nIdx] - original[idx]) +
                                           Math.abs(original[nIdx + 1] - original[idx + 1]) +
                                           Math.abs(original[nIdx + 2] - original[idx + 2]);
                                maxDiff = Math.max(maxDiff, diff);
                            }
                        }
                        detailScore = Math.min(maxDiff / 100, 1);
                    }
                    
                    const totalScore = centerScore * 0.7 + detailScore * 0.3;
                    restorationCandidates.push({ i, score: totalScore });
                }
            }
            
            // Sort by score (highest first) and restore top candidates
            restorationCandidates.sort((a, b) => b.score - a.score);
            const toRestore = Math.min(pixelsToRestore, restorationCandidates.length);
            
            for (let j = 0; j < toRestore; j++) {
                const candidate = restorationCandidates[j];
                result[candidate.i] = original[candidate.i];
                result[candidate.i + 1] = original[candidate.i + 1];
                result[candidate.i + 2] = original[candidate.i + 2];
                result[candidate.i + 3] = 255; // Make opaque
            }
        }
        
        return new ImageData(result, width, height);
    }
}

// ============================================
// SIMPLE OVERRIDE SOLUTION
// ============================================

/**
 * SIMPLE FIX: Just override the AI when it removes too much
 */
function conservativeOverride(processedData, originalData) {
    const width = processedData.width;
    const height = processedData.height;
    const processed = processedData.data;
    const original = originalData.data;
    const result = new Uint8ClampedArray(processed);
    
    // Calculate how much was removed
    let removedPixels = 0;
    let totalPixels = width * height;
    
    for (let i = 3; i < processed.length; i += 4) {
        if (processed[i] < 50) removedPixels++; // Almost transparent
    }
    
    const removalRatio = removedPixels / totalPixels;
    
    // If too much was removed (> 70%), override the result
    if (removalRatio > 0.7) {
        console.log(`WARNING: Too much removed (${(removalRatio * 100).toFixed(1)}%), applying conservative mode`);
        
        // Simple conservative approach: Keep center 50% of image
        const centerX = width / 2;
        const centerY = height / 2;
        const keepRadius = Math.min(width, height) * 0.25;
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4;
                const distX = Math.abs(x - centerX);
                const distY = Math.abs(y - centerY);
                
                // If in center area OR pixel has high detail, keep it
                const inCenter = Math.sqrt(distX * distX + distY * distY) < keepRadius;
                
                if (inCenter) {
                    // Restore center area
                    result[idx] = original[idx];
                    result[idx + 1] = original[idx + 1];
                    result[idx + 2] = original[idx + 2];
                    result[idx + 3] = 255;
                }
            }
        }
        
        utils.showToast('Applied conservative mode to preserve content', 'warning');
    }
    
    return new ImageData(result, width, height);
}

// ============================================
// ULTRA-CONSERVATIVE MODE
// ============================================

/**
 * ULTRA-CONSERVATIVE: Preserves everything, removes only obvious background
 */
function ultraConservativeMode(originalData) {
    const width = originalData.width;
    const height = originalData.height;
    const data = originalData.data;
    const result = new Uint8ClampedArray(data.length);
    
    // Copy original
    result.set(data);
    
    // Only remove pixels that are VERY SIMILAR to border colors
    const borderColor = this.getDominantBorderColor(originalData);
    const removalThreshold = 40; // VERY conservative threshold
    
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        const dist = Math.sqrt(
            Math.pow(r - borderColor[0], 2) +
            Math.pow(g - borderColor[1], 2) +
            Math.pow(b - borderColor[2], 2)
        );
        
        // Only remove if VERY close to border color
        if (dist < removalThreshold) {
            result[i + 3] = 0; // Make transparent
        } else {
            result[i + 3] = 255; // Keep opaque
        }
    }
    
    return new ImageData(result, width, height);
}

function getDominantBorderColor(imageData) {
    const width = imageData.width;
    const height = imageData.height;
    const data = imageData.data;
    const borderSamples = [];
    
    // Sample border pixels
    const borderWidth = 5;
    
    // Top border
    for (let x = 0; x < width; x += 2) {
        for (let y = 0; y < borderWidth; y += 2) {
            const idx = (y * width + x) * 4;
            borderSamples.push([data[idx], data[idx + 1], data[idx + 2]]);
        }
    }
    
    // Bottom border
    for (let x = 0; x < width; x += 2) {
        for (let y = height - borderWidth; y < height; y += 2) {
            const idx = (y * width + x) * 4;
            borderSamples.push([data[idx], data[idx + 1], data[idx + 2]]);
        }
    }
    
    // Calculate average
    let sumR = 0, sumG = 0, sumB = 0;
    for (const [r, g, b] of borderSamples) {
        sumR += r;
        sumG += g;
        sumB += b;
    }
    
    return [
        Math.floor(sumR / borderSamples.length),
        Math.floor(sumG / borderSamples.length),
        Math.floor(sumB / borderSamples.length)
    ];
}

// ============================================
// EXPORT
// ============================================

window.ConservativeOptimizers = {
    ConservativeTextProtector,
    ConservativeHumanProtector,
    SafeBackgroundRemover,
    conservativeOverride,
    ultraConservativeMode
};

console.log('Conservative Image Optimizers loaded');