/**
 * Image Optimizers - Core utilities for image processing
 * Version: 2.0.0
 * Description: Essential image processing utilities for background removal
 */

(function() {
    'use strict';
    
    // ============================================
    // IMAGE UTILITIES
    // ============================================
    
    class ImageUtils {
        /**
         * Resize image to fit within max dimensions while maintaining aspect ratio
         * @param {HTMLCanvasElement} canvas - Source canvas
         * @param {number} maxWidth - Maximum width
         * @param {number} maxHeight - Maximum height
         * @returns {HTMLCanvasElement} Resized canvas
         */
        static resizeToFit(canvas, maxWidth, maxHeight) {
            const width = canvas.width;
            const height = canvas.height;
            
            // Check if resizing is needed
            if (width <= maxWidth && height <= maxHeight) {
                return canvas;
            }
            
            // Calculate new dimensions maintaining aspect ratio
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            const newWidth = Math.floor(width * ratio);
            const newHeight = Math.floor(height * ratio);
            
            // Create new canvas
            const resizedCanvas = document.createElement('canvas');
            resizedCanvas.width = newWidth;
            resizedCanvas.height = newHeight;
            
            // Draw resized image
            const ctx = resizedCanvas.getContext('2d', { alpha: true });
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(canvas, 0, 0, newWidth, newHeight);
            
            return resizedCanvas;
        }
        
        /**
         * Convert image element to canvas
         * @param {HTMLImageElement} image - Source image
         * @returns {HTMLCanvasElement} Canvas with image drawn
         */
        static imageToCanvas(image) {
            const canvas = document.createElement('canvas');
            canvas.width = image.naturalWidth || image.width;
            canvas.height = image.naturalHeight || image.height;
            
            const ctx = canvas.getContext('2d', { alpha: true });
            ctx.drawImage(image, 0, 0);
            
            return canvas;
        }
        
        /**
         * Get ImageData from canvas
         * @param {HTMLCanvasElement} canvas - Source canvas
         * @returns {ImageData} Image data
         */
        static getImageData(canvas) {
            const ctx = canvas.getContext('2d', { alpha: true });
            return ctx.getImageData(0, 0, canvas.width, canvas.height);
        }
        
        /**
         * Put ImageData onto canvas
         * @param {HTMLCanvasElement} canvas - Target canvas
         * @param {ImageData} imageData - Image data to apply
         */
        static putImageData(canvas, imageData) {
            const ctx = canvas.getContext('2d', { alpha: true });
            ctx.putImageData(imageData, 0, 0);
        }
        
        /**
         * Clone ImageData
         * @param {ImageData} imageData - Source image data
         * @returns {ImageData} Cloned image data
         */
        static cloneImageData(imageData) {
            return new ImageData(
                new Uint8ClampedArray(imageData.data),
                imageData.width,
                imageData.height
            );
        }
        
        /**
         * Create a canvas from ImageData
         * @param {ImageData} imageData - Source image data
         * @returns {HTMLCanvasElement} Canvas with image data
         */
        static canvasFromImageData(imageData) {
            const canvas = document.createElement('canvas');
            canvas.width = imageData.width;
            canvas.height = imageData.height;
            
            const ctx = canvas.getContext('2d', { alpha: true });
            ctx.putImageData(imageData, 0, 0);
            
            return canvas;
        }
        
        /**
         * Convert canvas to data URL
         * @param {HTMLCanvasElement} canvas - Source canvas
         * @param {string} format - Output format (png/jpeg/webp)
         * @param {number} quality - Quality (0-1)
         * @returns {string} Data URL
         */
        static toDataURL(canvas, format = 'png', quality = 0.92) {
            const mimeType = `image/${format === 'jpg' ? 'jpeg' : format}`;
            return canvas.toDataURL(mimeType, quality);
        }
        
        /**
         * Calculate image size in human-readable format
         * @param {number} bytes - Size in bytes
         * @returns {string} Formatted size
         */
        static formatFileSize(bytes) {
            if (bytes === 0) return '0 Bytes';
            
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        }
        
        /**
         * Check if image is too large for processing
         * @param {number} width - Image width
         * @param {number} height - Image height
         * @param {number} maxPixels - Maximum pixels
         * @returns {boolean} True if too large
         */
        static isTooLarge(width, height, maxPixels = 4096 * 4096) {
            return width * height > maxPixels;
        }
    }
    
    // ============================================
    // COLOR UTILITIES
    // ============================================
    
    class ColorUtils {
        /**
         * Convert RGB to HSL
         * @param {number} r - Red (0-255)
         * @param {number} g - Green (0-255)
         * @param {number} b - Blue (0-255)
         * @returns {Object} HSL values
         */
        static rgbToHsl(r, g, b) {
            r /= 255;
            g /= 255;
            b /= 255;
            
            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            let h, s, l = (max + min) / 2;
            
            if (max === min) {
                h = s = 0; // achromatic
            } else {
                const d = max - min;
                s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
                
                switch (max) {
                    case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                    case g: h = (b - r) / d + 2; break;
                    case b: h = (r - g) / d + 4; break;
                }
                
                h /= 6;
            }
            
            return {
                h: Math.round(h * 360),
                s: Math.round(s * 100),
                l: Math.round(l * 100)
            };
        }
        
        /**
         * Convert HSL to RGB
         * @param {number} h - Hue (0-360)
         * @param {number} s - Saturation (0-100)
         * @param {number} l - Lightness (0-100)
         * @returns {Object} RGB values
         */
        static hslToRgb(h, s, l) {
            h /= 360;
            s /= 100;
            l /= 100;
            
            let r, g, b;
            
            if (s === 0) {
                r = g = b = l; // achromatic
            } else {
                const hue2rgb = (p, q, t) => {
                    if (t < 0) t += 1;
                    if (t > 1) t -= 1;
                    if (t < 1/6) return p + (q - p) * 6 * t;
                    if (t < 1/2) return q;
                    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                    return p;
                };
                
                const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
                const p = 2 * l - q;
                
                r = hue2rgb(p, q, h + 1/3);
                g = hue2rgb(p, q, h);
                b = hue2rgb(p, q, h - 1/3);
            }
            
            return {
                r: Math.round(r * 255),
                g: Math.round(g * 255),
                b: Math.round(b * 255)
            };
        }
        
        /**
         * Calculate Euclidean color distance
         * @param {number} r1 - Red 1
         * @param {number} g1 - Green 1
         * @param {number} b1 - Blue 1
         * @param {number} r2 - Red 2
         * @param {number} g2 - Green 2
         * @param {number} b2 - Blue 2
         * @returns {number} Distance
         */
        static colorDistance(r1, g1, b1, r2, g2, b2) {
            return Math.sqrt(
                Math.pow(r1 - r2, 2) +
                Math.pow(g1 - g2, 2) +
                Math.pow(b1 - b2, 2)
            );
        }
        
        /**
         * Check if color is grayscale
         * @param {number} r - Red
         * @param {number} g - Green
         * @param {number} b - Blue
         * @param {number} tolerance - Allowed difference
         * @returns {boolean} True if grayscale
         */
        static isGrayscale(r, g, b, tolerance = 10) {
            return Math.abs(r - g) <= tolerance && 
                   Math.abs(g - b) <= tolerance && 
                   Math.abs(r - b) <= tolerance;
        }
        
        /**
         * Calculate luminance (perceived brightness)
         * @param {number} r - Red
         * @param {number} g - Green
         * @param {number} b - Blue
         * @returns {number} Luminance (0-255)
         */
        static getLuminance(r, g, b) {
            // Using standard luminance formula
            return 0.299 * r + 0.587 * g + 0.114 * b;
        }
        
        /**
         * Check if color is skin tone
         * @param {number} r - Red
         * @param {number} g - Green
         * @param {number} b - Blue
         * @returns {boolean} True if skin tone
         */
        static isSkinTone(r, g, b) {
            // Convert to YCbCr color space
            const y = 0.299 * r + 0.587 * g + 0.114 * b;
            const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
            const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;
            
            // Common skin tone ranges in YCbCr
            return (
                y > 80 && y < 220 &&
                cb > 85 && cb < 135 &&
                cr > 135 && cr < 180
            );
        }
        
        /**
         * Blend two colors
         * @param {Array} color1 - [r, g, b, a]
         * @param {Array} color2 - [r, g, b, a]
         * @returns {Array} Blended color
         */
        static blendColors(color1, color2) {
            const [r1, g1, b1, a1] = color1;
            const [r2, g2, b2, a2] = color2;
            
            const alpha1 = a1 / 255;
            const alpha2 = a2 / 255;
            const alpha = alpha1 + alpha2 * (1 - alpha1);
            
            if (alpha === 0) return [0, 0, 0, 0];
            
            const r = Math.round((r1 * alpha1 + r2 * alpha2 * (1 - alpha1)) / alpha);
            const g = Math.round((g1 * alpha1 + g2 * alpha2 * (1 - alpha1)) / alpha);
            const b = Math.round((b1 * alpha1 + b2 * alpha2 * (1 - alpha1)) / alpha);
            
            return [r, g, b, Math.round(alpha * 255)];
        }
    }
    
    // ============================================
    // MASK UTILITIES
    // ============================================
    
    class MaskUtils {
        /**
         * Apply Gaussian blur to mask
         * @param {ImageData} imageData - Source image data
         * @param {number} radius - Blur radius
         * @returns {ImageData} Blurred image data
         */
        static blurMask(imageData, radius = 1) {
            const { width, height, data } = imageData;
            const result = new Uint8ClampedArray(data);
            
            // Create Gaussian kernel
            const kernel = this.createGaussianKernel(radius);
            const kernelSize = radius * 2 + 1;
            const kernelRadius = Math.floor(kernelSize / 2);
            
            // Temporary buffer for horizontal pass
            const temp = new Uint8ClampedArray(data.length);
            
            // Horizontal blur pass
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    let sum = 0;
                    
                    for (let kx = -kernelRadius; kx <= kernelRadius; kx++) {
                        const px = Math.max(0, Math.min(width - 1, x + kx));
                        const idx = (y * width + px) * 4 + 3;
                        const weight = kernel[kx + kernelRadius];
                        sum += data[idx] * weight;
                    }
                    
                    const idx = (y * width + x) * 4 + 3;
                    temp[idx] = Math.round(sum);
                }
            }
            
            // Vertical blur pass
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    let sum = 0;
                    
                    for (let ky = -kernelRadius; ky <= kernelRadius; ky++) {
                        const py = Math.max(0, Math.min(height - 1, y + ky));
                        const idx = (py * width + x) * 4 + 3;
                        const weight = kernel[ky + kernelRadius];
                        sum += temp[idx] * weight;
                    }
                    
                    const idx = (y * width + x) * 4 + 3;
                    result[idx] = Math.round(sum);
                }
            }
            
            return new ImageData(result, width, height);
        }
        
        /**
         * Create Gaussian kernel
         * @param {number} radius - Kernel radius
         * @returns {Array} Gaussian kernel
         */
        static createGaussianKernel(radius) {
            const size = radius * 2 + 1;
            const kernel = new Array(size);
            const sigma = radius / 2;
            let sum = 0;
            
            // Calculate Gaussian values
            for (let i = 0; i < size; i++) {
                const x = i - radius;
                const value = Math.exp(-(x * x) / (2 * sigma * sigma));
                kernel[i] = value;
                sum += value;
            }
            
            // Normalize kernel
            for (let i = 0; i < size; i++) {
                kernel[i] /= sum;
            }
            
            return kernel;
        }
        
        /**
         * Dilate mask (expand foreground)
         * @param {ImageData} imageData - Source image data
         * @param {number} iterations - Number of iterations
         * @returns {ImageData} Dilated image data
         */
        static dilateMask(imageData, iterations = 1) {
            const { width, height, data } = imageData;
            let result = new Uint8ClampedArray(data);
            
            for (let iter = 0; iter < iterations; iter++) {
                const current = new Uint8ClampedArray(result);
                
                for (let y = 1; y < height - 1; y++) {
                    for (let x = 1; x < width - 1; x++) {
                        const idx = (y * width + x) * 4 + 3;
                        
                        // Check 3x3 neighborhood for maximum alpha
                        let maxAlpha = current[idx];
                        
                        for (let dy = -1; dy <= 1; dy++) {
                            for (let dx = -1; dx <= 1; dx++) {
                                const nIdx = ((y + dy) * width + (x + dx)) * 4 + 3;
                                maxAlpha = Math.max(maxAlpha, current[nIdx]);
                            }
                        }
                        
                        result[idx] = maxAlpha;
                    }
                }
            }
            
            return new ImageData(result, width, height);
        }
        
        /**
         * Erode mask (shrink foreground)
         * @param {ImageData} imageData - Source image data
         * @param {number} iterations - Number of iterations
         * @returns {ImageData} Eroded image data
         */
        static erodeMask(imageData, iterations = 1) {
            const { width, height, data } = imageData;
            let result = new Uint8ClampedArray(data);
            
            for (let iter = 0; iter < iterations; iter++) {
                const current = new Uint8ClampedArray(result);
                
                for (let y = 1; y < height - 1; y++) {
                    for (let x = 1; x < width - 1; x++) {
                        const idx = (y * width + x) * 4 + 3;
                        
                        // Check 3x3 neighborhood for minimum alpha
                        let minAlpha = current[idx];
                        
                        for (let dy = -1; dy <= 1; dy++) {
                            for (let dx = -1; dx <= 1; dx++) {
                                const nIdx = ((y + dy) * width + (x + dx)) * 4 + 3;
                                minAlpha = Math.min(minAlpha, current[nIdx]);
                            }
                        }
                        
                        result[idx] = minAlpha;
                    }
                }
            }
            
            return new ImageData(result, width, height);
        }
        
        /**
         * Invert mask
         * @param {ImageData} imageData - Source image data
         * @returns {ImageData} Inverted image data
         */
        static invertMask(imageData) {
            const { width, height, data } = imageData;
            const result = new Uint8ClampedArray(data);
            
            for (let i = 3; i < result.length; i += 4) {
                result[i] = 255 - result[i];
            }
            
            return new ImageData(result, width, height);
        }
        
        /**
         * Threshold mask
         * @param {ImageData} imageData - Source image data
         * @param {number} threshold - Threshold value (0-255)
         * @returns {ImageData} Thresholded image data
         */
        static thresholdMask(imageData, threshold = 128) {
            const { width, height, data } = imageData;
            const result = new Uint8ClampedArray(data);
            
            for (let i = 3; i < result.length; i += 4) {
                result[i] = result[i] >= threshold ? 255 : 0;
            }
            
            return new ImageData(result, width, height);
        }
        
        /**
         * Fill holes in mask
         * @param {ImageData} imageData - Source image data
         * @param {number} maxHoleSize - Maximum hole size to fill
         * @returns {ImageData} Image data with filled holes
         */
        static fillHoles(imageData, maxHoleSize = 100) {
            const { width, height, data } = imageData;
            const result = new Uint8ClampedArray(data);
            const visited = new Uint8Array(width * height);
            
            // Scan for holes
            for (let y = 1; y < height - 1; y++) {
                for (let x = 1; x < width - 1; x++) {
                    const idx = y * width + x;
                    
                    if (visited[idx]) continue;
                    
                    const pixelIdx = idx * 4 + 3;
                    if (result[pixelIdx] > 0) continue; // Already foreground
                    
                    // Flood fill to find hole
                    const holePixels = this._floodFill(x, y, result, visited, width, height);
                    
                    // Fill small holes
                    if (holePixels.length <= maxHoleSize) {
                        holePixels.forEach(px => {
                            const pxIdx = px * 4 + 3;
                            result[pxIdx] = 255;
                        });
                    }
                }
            }
            
            return new ImageData(result, width, height);
        }
        
        /**
         * Flood fill implementation
         * @private
         */
        static _floodFill(startX, startY, data, visited, width, height) {
            const stack = [[startX, startY]];
            const pixels = [];
            
            while (stack.length > 0) {
                const [x, y] = stack.pop();
                const idx = y * width + x;
                
                if (x < 0 || x >= width || y < 0 || y >= height) continue;
                if (visited[idx]) continue;
                
                const dataIdx = idx * 4 + 3;
                if (data[dataIdx] > 0) continue; // Not a hole
                
                visited[idx] = 1;
                pixels.push(idx);
                
                // 4-direction fill
                stack.push([x + 1, y]);
                stack.push([x - 1, y]);
                stack.push([x, y + 1]);
                stack.push([x, y - 1]);
            }
            
            return pixels;
        }
    }
    
    // ============================================
    // EDGE DETECTION
    // ============================================
    
    class EdgeDetection {
        /**
         * Sobel edge detection
         * @param {ImageData} imageData - Source image data
         * @returns {Float32Array} Edge magnitude map
         */
        static sobel(imageData) {
            const { width, height, data } = imageData;
            const result = new Float32Array(width * height);
            
            // Convert to grayscale
            const gray = new Uint8ClampedArray(width * height);
            for (let i = 0, j = 0; i < data.length; i += 4, j++) {
                gray[j] = ColorUtils.getLuminance(data[i], data[i + 1], data[i + 2]);
            }
            
            // Apply Sobel operator
            for (let y = 1; y < height - 1; y++) {
                for (let x = 1; x < width - 1; x++) {
                    const idx = y * width + x;
                    
                    // Horizontal gradient (Gx)
                    const gx = 
                        -gray[(y - 1) * width + (x - 1)] + gray[(y - 1) * width + (x + 1)] +
                        -2 * gray[y * width + (x - 1)] + 2 * gray[y * width + (x + 1)] +
                        -gray[(y + 1) * width + (x - 1)] + gray[(y + 1) * width + (x + 1)];
                    
                    // Vertical gradient (Gy)
                    const gy = 
                        -gray[(y - 1) * width + (x - 1)] - 2 * gray[(y - 1) * width + x] - gray[(y - 1) * width + (x + 1)] +
                        gray[(y + 1) * width + (x - 1)] + 2 * gray[(y + 1) * width + x] + gray[(y + 1) * width + (x + 1)];
                    
                    // Magnitude
                    result[idx] = Math.sqrt(gx * gx + gy * gy);
                }
            }
            
            return result;
        }
        
        /**
         * Canny edge detection (simplified)
         * @param {ImageData} imageData - Source image data
         * @param {number} lowThreshold - Low threshold
         * @param {number} highThreshold - High threshold
         * @returns {Uint8ClampedArray} Binary edge map
         */
        static canny(imageData, lowThreshold = 20, highThreshold = 50) {
            const edges = this.sobel(imageData);
            const { width, height } = imageData;
            const result = new Uint8ClampedArray(width * height);
            
            // Apply double threshold
            for (let i = 0; i < edges.length; i++) {
                if (edges[i] > highThreshold) {
                    result[i] = 255; // Strong edge
                } else if (edges[i] > lowThreshold) {
                    result[i] = 128; // Weak edge
                }
                // else 0 (no edge)
            }
            
            // Edge tracking by hysteresis
            for (let y = 1; y < height - 1; y++) {
                for (let x = 1; x < width - 1; x++) {
                    const idx = y * width + x;
                    
                    if (result[idx] === 128) {
                        // Check if connected to strong edge
                        let connected = false;
                        
                        for (let dy = -1; dy <= 1; dy++) {
                            for (let dx = -1; dx <= 1; dx++) {
                                if (result[(y + dy) * width + (x + dx)] === 255) {
                                    connected = true;
                                    break;
                                }
                            }
                            if (connected) break;
                        }
                        
                        result[idx] = connected ? 255 : 0;
                    }
                }
            }
            
            return result;
        }
        
        /**
         * Detect edges in alpha channel
         * @param {ImageData} imageData - Source image data
         * @returns {Uint8ClampedArray} Alpha edges
         */
        static detectAlphaEdges(imageData) {
            const { width, height, data } = imageData;
            const edges = new Uint8ClampedArray(width * height);
            
            for (let y = 1; y < height - 1; y++) {
                for (let x = 1; x < width - 1; x++) {
                    const idx = (y * width + x) * 4 + 3;
                    const alpha = data[idx];
                    
                    // Check alpha gradient
                    let maxDiff = 0;
                    
                    for (let dy = -1; dy <= 1; dy++) {
                        for (let dx = -1; dx <= 1; dx++) {
                            if (dx === 0 && dy === 0) continue;
                            
                            const nIdx = ((y + dy) * width + (x + dx)) * 4 + 3;
                            const diff = Math.abs(alpha - data[nIdx]);
                            maxDiff = Math.max(maxDiff, diff);
                        }
                    }
                    
                    edges[y * width + x] = Math.min(255, maxDiff * 2);
                }
            }
            
            return edges;
        }
    }
    
    // ============================================
    // PERFORMANCE UTILITIES
    // ============================================
    
    class PerformanceUtils {
        /**
         * Measure execution time of a function
         * @param {Function} fn - Function to measure
         * @param {string} label - Measurement label
         * @returns {Promise} Function result with timing
         */
        static async measureTime(fn, label = 'Operation') {
            const start = performance.now();
            const result = await fn();
            const end = performance.now();
            
            console.debug(`${label}: ${(end - start).toFixed(2)}ms`);
            return result;
        }
        
        /**
         * Check memory usage (if available)
         * @returns {Object|null} Memory info
         */
        static checkMemory() {
            if (performance.memory) {
                const mem = performance.memory;
                return {
                    used: Math.round(mem.usedJSHeapSize / 1024 / 1024 * 100) / 100,
                    total: Math.round(mem.totalJSHeapSize / 1024 / 1024 * 100) / 100,
                    limit: Math.round(mem.jsHeapSizeLimit / 1024 / 1024 * 100) / 100,
                    percent: Math.round((mem.usedJSHeapSize / mem.jsHeapSizeLimit) * 100)
                };
            }
            return null;
        }
        
        /**
         * Debounce function
         * @param {Function} fn - Function to debounce
         * @param {number} delay - Delay in milliseconds
         * @returns {Function} Debounced function
         */
        static debounce(fn, delay) {
            let timeoutId;
            return function(...args) {
                clearTimeout(timeoutId);
                timeoutId = setTimeout(() => fn.apply(this, args), delay);
            };
        }
        
        /**
         * Throttle function
         * @param {Function} fn - Function to throttle
         * @param {number} limit - Time limit in milliseconds
         * @returns {Function} Throttled function
         */
        static throttle(fn, limit) {
            let inThrottle;
            return function(...args) {
                if (!inThrottle) {
                    fn.apply(this, args);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            };
        }
        
        /**
         * Create a promise with timeout
         * @param {Promise} promise - Promise to wrap
         * @param {number} timeout - Timeout in milliseconds
         * @param {string} errorMessage - Error message on timeout
         * @returns {Promise} Promise with timeout
         */
        static withTimeout(promise, timeout, errorMessage = 'Operation timed out') {
            return Promise.race([
                promise,
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error(errorMessage)), timeout)
                )
            ]);
        }
    }
    
    // ============================================
    // BACKGROUND DETECTION
    // ============================================
    
    class BackgroundDetection {
        /**
         * Detect background color by sampling image borders
         * @param {ImageData} imageData - Source image data
         * @param {number} sampleSize - Number of pixels to sample per side
         * @returns {Array} [r, g, b] background color
         */
        static detectBackgroundColor(imageData, sampleSize = 20) {
            const { width, height, data } = imageData;
            const samples = [];
            
            // Sample from all four borders
            for (let i = 0; i < sampleSize; i++) {
                // Top border
                const topX = Math.floor((i / sampleSize) * width);
                const topIdx = (0 * width + topX) * 4;
                samples.push([data[topIdx], data[topIdx + 1], data[topIdx + 2]]);
                
                // Bottom border
                const bottomX = Math.floor((i / sampleSize) * width);
                const bottomIdx = ((height - 1) * width + bottomX) * 4;
                samples.push([data[bottomIdx], data[bottomIdx + 1], data[bottomIdx + 2]]);
                
                // Left border
                const leftY = Math.floor((i / sampleSize) * height);
                const leftIdx = (leftY * width + 0) * 4;
                samples.push([data[leftIdx], data[leftIdx + 1], data[leftIdx + 2]]);
                
                // Right border
                const rightY = Math.floor((i / sampleSize) * height);
                const rightIdx = (rightY * width + (width - 1)) * 4;
                samples.push([data[rightIdx], data[rightIdx + 1], data[rightIdx + 2]]);
            }
            
            // Calculate average color
            let r = 0, g = 0, b = 0;
            for (const [sr, sg, sb] of samples) {
                r += sr;
                g += sg;
                b += sb;
            }
            
            return [
                Math.round(r / samples.length),
                Math.round(g / samples.length),
                Math.round(b / samples.length)
            ];
        }
        
        /**
         * Create background mask based on color similarity
         * @param {ImageData} imageData - Source image data
         * @param {Array} bgColor - Background color [r, g, b]
         * @param {number} threshold - Similarity threshold
         * @returns {Uint8ClampedArray} Background mask
         */
        static createBackgroundMask(imageData, bgColor, threshold = 50) {
            const { width, height, data } = imageData;
            const mask = new Uint8ClampedArray(width * height);
            const [bgR, bgG, bgB] = bgColor;
            
            for (let i = 0, j = 0; i < data.length; i += 4, j++) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                
                const distance = ColorUtils.colorDistance(r, g, b, bgR, bgG, bgB);
                mask[j] = distance < threshold ? 255 : 0;
            }
            
            return mask;
        }
        
        /**
         * Refine background mask with edge-aware smoothing
         * @param {Uint8ClampedArray} mask - Initial mask
         * @param {ImageData} imageData - Original image data
         * @param {number} width - Image width
         * @param {number} height - Image height
         * @returns {Uint8ClampedArray} Refined mask
         */
        static refineBackgroundMask(mask, imageData, width, height) {
            const refined = new Uint8ClampedArray(mask);
            const { data } = imageData;
            
            for (let y = 1; y < height - 1; y++) {
                for (let x = 1; x < width - 1; x++) {
                    const idx = y * width + x;
                    
                    // Only process uncertain pixels
                    if (mask[idx] !== 128) continue;
                    
                    // Check local gradient
                    const pixelIdx = idx * 4;
                    const r = data[pixelIdx];
                    const g = data[pixelIdx + 1];
                    const b = data[pixelIdx + 2];
                    
                    let similarBackground = 0;
                    let similarForeground = 0;
                    
                    for (let dy = -1; dy <= 1; dy++) {
                        for (let dx = -1; dx <= 1; dx++) {
                            if (dx === 0 && dy === 0) continue;
                            
                            const nIdx = (y + dy) * width + (x + dx);
                            const neighborMask = mask[nIdx];
                            
                            if (neighborMask === 255) similarBackground++;
                            if (neighborMask === 0) similarForeground++;
                        }
                    }
                    
                    // Decide based on neighbors
                    if (similarBackground > similarForeground + 2) {
                        refined[idx] = 255;
                    } else if (similarForeground > similarBackground + 2) {
                        refined[idx] = 0;
                    }
                }
            }
            
            return refined;
        }
    }
    
    // ============================================
    // EXPORT UTILITIES
    // ============================================
    
    // Export all classes as a single namespace
    window.ImageOptimizers = {
        ImageUtils,
        ColorUtils,
        MaskUtils,
        EdgeDetection,
        PerformanceUtils,
        BackgroundDetection
    };
    
    console.log('Image Optimizers loaded successfully');
    
})();