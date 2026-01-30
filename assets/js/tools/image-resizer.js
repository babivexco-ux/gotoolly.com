/* ============================================
   GO TOOLLY - IMAGE RESIZER
   Professional Image Resizer Tool
   ============================================ */

// Error handling class for Image Resizer
class ImageResizerError extends Error {
    constructor(code, message, context = {}) {
        super(message);
        this.name = 'ImageResizerError';
        this.code = code;
        this.timestamp = new Date().toISOString();
        this.context = {
            ...context,
            userAgent: navigator.userAgent.substring(0, 100),
            timestamp: this.timestamp
        };
        
        // Log to localStorage for debugging
        try {
            const errors = JSON.parse(localStorage.getItem('resizerErrors') || '[]');
            errors.push({
                code: this.code,
                message: this.message,
                context: this.context,
                stack: this.stack?.substring(0, 500)
            });
            // Keep only last 20 errors
            if (errors.length > 20) errors.shift();
            localStorage.setItem('resizerErrors', JSON.stringify(errors));
        } catch (e) {
            console.error('Failed to log error:', e);
        }
        
        // Send to server if available
        if (navigator.sendBeacon) {
            try {
                navigator.sendBeacon('/api/errors', JSON.stringify({
                    tool: 'image-resizer',
                    error: this.code,
                    message: this.message,
                    context: this.context
                }));
            } catch (e) {
                console.error('Failed to send beacon:', e);
            }
        }
    }
}

// Reliability check functions
function checkCanvasSupport() {
    try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new ImageResizerError('CANVAS_NO_CONTEXT', 'Canvas 2D context not available');
        }
        
        // Test image smoothing support
        if (typeof ctx.imageSmoothingEnabled === 'undefined') {
            console.warn('Image smoothing not fully supported');
        }
        
        return true;
    } catch (e) {
        throw new ImageResizerError('CANVAS_CHECK_FAILED', 'Canvas API check failed', { error: e.message });
    }
}

function validateImageLoad(img, fileName = 'unknown') {
    if (!img) {
        throw new ImageResizerError('IMAGE_NULL', 'Image object is null', { fileName });
    }
    
    if (!img.complete) {
        throw new ImageResizerError('IMAGE_NOT_LOADED', 'Image not fully loaded', { fileName });
    }
    
    if (img.naturalWidth === 0 || img.naturalHeight === 0) {
        throw new ImageResizerError('IMAGE_INVALID_DIMENSIONS', 'Image has invalid dimensions', { 
            fileName,
            width: img.naturalWidth,
            height: img.naturalHeight
        });
    }
    
    const maxPixels = 50000000; // 50MP limit
    const pixels = img.naturalWidth * img.naturalHeight;
    if (pixels > maxPixels) {
        throw new ImageResizerError('IMAGE_TOO_LARGE', `Image exceeds size limit (${(pixels / 1000000).toFixed(1)}MP)`, {
            fileName,
            pixels,
            maxPixels
        });
    }
    
    return true;
}

function validateResizeOutput(canvas, originalDimensions) {
    if (!canvas) {
        throw new ImageResizerError('CANVAS_NULL', 'Output canvas is null');
    }
    
    if (canvas.width === 0 || canvas.height === 0) {
        throw new ImageResizerError('CANVAS_EMPTY', 'Canvas has no dimensions', {
            width: canvas.width,
            height: canvas.height
        });
    }
    
    const expectedPixels = originalDimensions.width * originalDimensions.height;
    const actualPixels = canvas.width * canvas.height;
    
    if (actualPixels === 0) {
        throw new ImageResizerError('RESIZE_FAILED', 'Resize produced empty output', {
            originalPixels: expectedPixels,
            actualPixels
        });
    }
    
    return true;
}

function resizeWithTimeout(resizeFn, timeoutMs = 30000) {
    return new Promise((resolve, reject) => {
        let completed = false;
        
        const timeoutId = setTimeout(() => {
            if (!completed) {
                completed = true;
                reject(new ImageResizerError('RESIZE_TIMEOUT', `Resize operation timed out after ${timeoutMs}ms`, {
                    timeoutMs
                }));
            }
        }, timeoutMs);
        
        try {
            Promise.resolve(resizeFn()).then(result => {
                if (!completed) {
                    completed = true;
                    clearTimeout(timeoutId);
                    resolve(result);
                }
            }).catch(error => {
                if (!completed) {
                    completed = true;
                    clearTimeout(timeoutId);
                    reject(error);
                }
            });
        } catch (error) {
            if (!completed) {
                completed = true;
                clearTimeout(timeoutId);
                reject(error);
            }
        }
    });
}

function checkMemoryForImage(width, height) {
    const pixelData = width * height * 4; // RGBA
    const estimatedMB = pixelData / (1024 * 1024);
    const threshold = 256; // 256MB threshold
    
    if (estimatedMB > threshold) {
        throw new ImageResizerError('MEMORY_LIMIT_EXCEEDED', `Estimated memory (${estimatedMB.toFixed(0)}MB) exceeds limit`, {
            width,
            height,
            estimatedMB,
            thresholdMB: threshold
        });
    }
    
    return true;
}

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const imageInput = document.getElementById('image-input');
    const dropZone = document.getElementById('drop-zone');
    const fileInfo = document.getElementById('file-info');
    const fileName = document.getElementById('file-name');
    const fileDimensions = document.getElementById('file-dimensions');
    
    const settingsSection = document.getElementById('settings-section');
    const resizeMode = document.getElementById('resize-mode');
    const resizeBtn = document.getElementById('resize-btn');
    const resetBtn = document.getElementById('reset-btn');
    
    // Settings elements
    const dimensionsMode = document.getElementById('dimensions-mode');
    const percentageMode = document.getElementById('percentage-mode');
    const aspectMode = document.getElementById('aspect-mode');
    
    const resizeWidth = document.getElementById('resize-width');
    const resizeHeight = document.getElementById('resize-height');
    const maintainRatio = document.getElementById('maintain-ratio');
    const resizePercent = document.getElementById('resize-percent');
    const percentValue = document.getElementById('percent-value');
    const aspectPreset = document.getElementById('aspect-preset');
    const aspectWidth = document.getElementById('aspect-width');
    
    const outputFormat = document.getElementById('output-format');
    const outputQuality = document.getElementById('output-quality');
    const qualityValue = document.getElementById('quality-value');
    
    // Preview elements
    const previewSection = document.getElementById('preview-section');
    const previewOriginal = document.getElementById('preview-original');
    const previewCanvas = document.getElementById('preview-canvas');
    const originalDimensions = document.getElementById('original-dimensions');
    const originalSize = document.getElementById('original-size');
    const resizedDimensions = document.getElementById('resized-dimensions');
    const resizedSize = document.getElementById('resized-size');
    
    // Results elements
    const resultsSection = document.getElementById('results-section');
    const resultImage = document.getElementById('result-image');
    const resultDimensions = document.getElementById('result-dimensions');
    const resultSize = document.getElementById('result-size');
    const downloadBtn = document.getElementById('download-btn');
    
    // State
    let currentImage = null;
    let originalWidth = 0;
    let originalHeight = 0;
    let originalFile = null;
    
    // Initialize
    setupEventListeners();
    
    function setupEventListeners() {
        // File input
        imageInput.addEventListener('change', handleFileSelect);
        
        // Drag and drop
        dropZone.addEventListener('dragover', handleDragOver);
        dropZone.addEventListener('dragleave', handleDragLeave);
        dropZone.addEventListener('drop', handleDrop);
        
        // Resize mode selection
        resizeMode.addEventListener('change', handleResizeModeChange);
        
        // Settings
        resizePercent.addEventListener('input', function() {
            percentValue.textContent = this.value + '%';
        });
        
        outputQuality.addEventListener('input', function() {
            const adaptiveQuality = calculateAdaptiveQuality();
            qualityValue.textContent = adaptiveQuality + '% (adjusted)';
        });
        
        maintainRatio.addEventListener('change', function() {
            if (this.checked && originalWidth > 0) {
                const ratio = originalHeight / originalWidth;
                const newHeight = Math.round(resizeWidth.value * ratio);
                resizeHeight.value = newHeight;
            }
        });
        
        resizeWidth.addEventListener('input', function() {
            if (maintainRatio.checked && originalWidth > 0) {
                const ratio = originalHeight / originalWidth;
                const newHeight = Math.round(this.value * ratio);
                resizeHeight.value = newHeight;
            }
        });
        
        resizeHeight.addEventListener('input', function() {
            if (maintainRatio.checked && originalWidth > 0) {
                const ratio = originalHeight / originalWidth;
                const newWidth = Math.round(this.value / ratio);
                resizeWidth.value = newWidth;
            }
        });
        
        aspectPreset.addEventListener('change', handleAspectPresetChange);
        
        // Buttons
        resizeBtn.addEventListener('click', performResize);
        resetBtn.addEventListener('click', resetTool);
    }
    
    function handleFileSelect(e) {
        const files = Array.from(e.target.files);
        const imageFiles = files.filter(f => f.type.startsWith('image/'));
        
        if (imageFiles.length === 0) {
            showNotification('Please select an image file', 'error');
            return;
        }
        
        loadImage(imageFiles[0]);
    }
    
    function handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.add('dragover');
    }
    
    function handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.remove('dragover');
    }
    
    function handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.remove('dragover');
        
        const files = Array.from(e.dataTransfer.files);
        const imageFiles = files.filter(f => f.type.startsWith('image/'));
        
        if (imageFiles.length === 0) {
            showNotification('Please drop image files', 'error');
            return;
        }
        
        loadImage(imageFiles[0]);
    }
    
    function loadImage(file) {
        try {
            // Check Canvas support on first image load
            if (!currentImage) {
                checkCanvasSupport();
            }
            
            // Check memory before attempting load
            const estimatedSize = file.size;
            if (estimatedSize > 100 * 1024 * 1024) { // 100MB file size limit
                throw new ImageResizerError('FILE_TOO_LARGE', 'File size exceeds 100MB limit', {
                    fileName: file.name,
                    fileSize: estimatedSize
                });
            }
            
            originalFile = file;
            const reader = new FileReader();
            
            reader.onload = function(e) {
                try {
                    const img = new Image();
                    
                    img.onload = function() {
                        try {
                            // Validate the loaded image
                            validateImageLoad(img, file.name);
                            
                            // Check memory requirements for processing
                            checkMemoryForImage(img.naturalWidth, img.naturalHeight);
                            
                            currentImage = img;
                            originalWidth = img.naturalWidth;
                            originalHeight = img.naturalHeight;
                            
                            // Update file info
                            fileName.textContent = `📄 ${file.name}`;
                            fileDimensions.textContent = `Original: ${originalWidth} × ${originalHeight} px`;
                            fileInfo.style.display = 'block';
                            
                            // Show settings
                            settingsSection.style.display = 'block';
                            previewSection.style.display = 'none';
                            resultsSection.style.display = 'none';
                            
                            // Set default resize values
                            resizeWidth.value = Math.round(originalWidth * 0.8);
                            resizeHeight.value = Math.round(originalHeight * 0.8);
                            aspectWidth.value = Math.round(originalWidth * 0.8);
                            
                            // Show preview
                            previewOriginal.src = e.target.result;
                            originalDimensions.textContent = `${originalWidth} × ${originalHeight} px`;
                            originalSize.textContent = `${(file.size / 1024 / 1024).toFixed(2)} MB`;
                            previewSection.style.display = 'block';
                            
                            showNotification('Image loaded successfully', 'success');
                        } catch (validationError) {
                            if (validationError instanceof ImageResizerError) {
                                showNotification(`Load failed: ${validationError.message}`, 'error');
                                console.error('[ImageResizer]', validationError);
                            } else {
                                throw validationError;
                            }
                        }
                    };
                    
                    img.onerror = function() {
                        const error = new ImageResizerError('IMAGE_LOAD_ERROR', 'Failed to decode image file', {
                            fileName: file.name,
                            fileType: file.type
                        });
                        showNotification(`Failed to load image: ${error.message}`, 'error');
                        console.error('[ImageResizer]', error);
                    };
                    
                    img.onabort = function() {
                        const error = new ImageResizerError('IMAGE_LOAD_ABORT', 'Image loading was aborted', {
                            fileName: file.name
                        });
                        showNotification('Image loading cancelled', 'error');
                    };
                    
                    // Set crossOrigin to avoid CORS issues
                    img.crossOrigin = 'anonymous';
                    img.src = e.target.result;
                } catch (error) {
                    if (error instanceof ImageResizerError) {
                        showNotification(`Load failed: ${error.message}`, 'error');
                    } else {
                        const wrappedError = new ImageResizerError('IMAGE_READER_ERROR', 'Error reading file', {
                            fileName: file.name,
                            error: error.message
                        });
                        showNotification('Error reading file', 'error');
                    }
                }
            };
            
            reader.onerror = function() {
                const error = new ImageResizerError('FILE_READ_ERROR', 'Failed to read file from disk', {
                    fileName: file.name
                });
                showNotification('Cannot read file', 'error');
            };
            
            reader.onabort = function() {
                showNotification('File reading cancelled', 'error');
            };
            
            reader.readAsDataURL(file);
        } catch (error) {
            if (error instanceof ImageResizerError) {
                showNotification(`Load failed: ${error.message}`, 'error');
                console.error('[ImageResizer]', error);
            } else {
                console.error('[ImageResizer] Unexpected error:', error);
                showNotification('An unexpected error occurred', 'error');
            }
        }
    }
    
    function handleResizeModeChange() {
        const mode = resizeMode.value;
        
        dimensionsMode.style.display = mode === 'dimensions' ? 'grid' : 'none';
        percentageMode.style.display = mode === 'percentage' ? 'grid' : 'none';
        aspectMode.style.display = mode === 'aspect-ratio' ? 'grid' : 'none';
    }
    
    function handleAspectPresetChange() {
        const preset = aspectPreset.value;
        let ratio;
        
        switch(preset) {
            case '1:1':
                ratio = 1;
                break;
            case '4:3':
                ratio = 4/3;
                break;
            case '16:9':
                ratio = 16/9;
                break;
            case '3:2':
                ratio = 3/2;
                break;
            case '9:16':
                ratio = 9/16;
                break;
            default:
                return;
        }
        
        if (aspectWidth.value) {
            const width = parseInt(aspectWidth.value);
            // Height will be calculated in resize function
        }
    }
    
    // Calculate adaptive quality based on image size and resize ratio
    function calculateAdaptiveQuality() {
        const baseQuality = parseInt(outputQuality.value);
        const dimensions = calculateResizeDimensions();
        
        // Calculate resize ratio
        const originalPixels = originalWidth * originalHeight;
        const targetPixels = dimensions.width * dimensions.height;
        const resizeRatio = targetPixels / originalPixels;
        
        // Adjust quality based on resize operation
        let adjustedQuality = baseQuality;
        
        if (resizeRatio < 0.25) {
            // Major downscaling - reduce quality loss by keeping quality moderate
            adjustedQuality = Math.max(baseQuality - 5, 70); // Don't go below 70%
        } else if (resizeRatio < 0.5) {
            // Moderate downscaling
            adjustedQuality = Math.max(baseQuality - 3, 75);
        } else if (resizeRatio > 2) {
            // Upscaling - increase quality to improve interpolation
            adjustedQuality = Math.min(baseQuality + 5, 95);
        }
        
        return adjustedQuality;
    }
    
    function calculateResizeDimensions() {
        const mode = resizeMode.value;
        let newWidth, newHeight;
        
        if (mode === 'dimensions') {
            newWidth = Math.max(1, parseInt(resizeWidth.value) || originalWidth);
            newHeight = Math.max(1, parseInt(resizeHeight.value) || originalHeight);
            
            // Enforce aspect ratio if checked
            if (maintainRatio.checked) {
                const ratio = originalHeight / originalWidth;
                if (parseInt(resizeWidth.value) && !parseInt(resizeHeight.value)) {
                    newHeight = Math.round(newWidth * ratio);
                } else if (!parseInt(resizeWidth.value) && parseInt(resizeHeight.value)) {
                    newWidth = Math.round(newHeight / ratio);
                }
            }
        } else if (mode === 'percentage') {
            const percent = parseInt(resizePercent.value) / 100;
            newWidth = Math.round(originalWidth * percent);
            newHeight = Math.round(originalHeight * percent);
        } else if (mode === 'aspect-ratio') {
            newWidth = Math.max(1, parseInt(aspectWidth.value) || originalWidth);
            const preset = aspectPreset.value;
            let ratio;
            
            if (preset === '1:1') ratio = 1;
            else if (preset === '4:3') ratio = 4/3;
            else if (preset === '16:9') ratio = 16/9;
            else if (preset === '3:2') ratio = 3/2;
            else if (preset === '9:16') ratio = 9/16;
            else ratio = originalHeight / originalWidth;
            
            newHeight = Math.round(newWidth / ratio);
        }
        
        // Ensure minimum dimensions
        newWidth = Math.max(1, Math.round(newWidth));
        newHeight = Math.max(1, Math.round(newHeight));
        
        return { width: newWidth, height: newHeight };
    }
    
    function performResize() {
        try {
            if (!currentImage) {
                throw new ImageResizerError('NO_IMAGE_LOADED', 'Please load an image first');
            }
            
            const dimensions = calculateResizeDimensions();
            
            // Validate dimensions
            if (dimensions.width <= 0 || dimensions.height <= 0) {
                throw new ImageResizerError('INVALID_DIMENSIONS', 'Target dimensions must be positive numbers', {
                    width: dimensions.width,
                    height: dimensions.height
                });
            }
            
            // Check memory before resizing
            checkMemoryForImage(dimensions.width, dimensions.height);
            
            // Wrap resize in timeout protection (adaptive based on megapixels)
            const megapixels = (dimensions.width * dimensions.height) / 1000000;
            const timeoutMs = Math.min(5000 + megapixels * 1000, 30000); // 5-30 seconds
            
            resizeWithTimeout(() => {
                // Use high-quality step-down approach for better results
                const canvas = createHighQualityCanvas(currentImage, dimensions.width, dimensions.height);
                
                // Validate canvas output
                validateResizeOutput(canvas, { width: dimensions.width, height: dimensions.height });
                
                // Update preview
                previewCanvas.width = dimensions.width;
                previewCanvas.height = dimensions.height;
                const previewCtx = previewCanvas.getContext('2d', { alpha: true });
                previewCtx.imageSmoothingEnabled = true;
                previewCtx.imageSmoothingQuality = 'high';
                previewCtx.drawImage(canvas, 0, 0);
                
                resizedDimensions.textContent = `${dimensions.width} × ${dimensions.height} px`;
                
                // Save for download with adaptive quality
                const adaptiveQuality = calculateAdaptiveQuality();
                const quality = adaptiveQuality / 100;
                const format = outputFormat.value;
                
                // Get the correct MIME type
                let mimeType;
                if (format === 'jpg') {
                    mimeType = 'image/jpeg';
                } else if (format === 'png') {
                    mimeType = 'image/png';
                } else if (format === 'webp') {
                    mimeType = 'image/webp';
                } else {
                    mimeType = 'image/png';
                }
                
                // Prepare blob options
                const blobCallback = function(blob) {
                    try {
                        if (!blob) {
                            throw new ImageResizerError('BLOB_CREATION_FAILED', 'Failed to create image blob');
                        }
                        
                        const savedSize = (blob.size / 1024).toFixed(2);
                        resizedSize.textContent = `${savedSize} KB`;
                        
                        // Show results
                        const resultURL = URL.createObjectURL(blob);
                        resultImage.src = resultURL;
                        resultDimensions.textContent = `${dimensions.width} × ${dimensions.height} px`;
                        resultSize.textContent = `${savedSize} KB`;
                        resultsSection.style.display = 'block';
                        
                        // Setup download
                        downloadBtn.href = resultURL;
                        const extension = format === 'jpg' ? 'jpg' : format;
                        const originalName = originalFile.name.split('.')[0] || 'image';
                        downloadBtn.download = `${originalName}-resized.${extension}`;
                        
                        showNotification('Image resized successfully', 'success');
                    } catch (error) {
                        if (error instanceof ImageResizerError) {
                            showNotification(`Error: ${error.message}`, 'error');
                            console.error('[ImageResizer]', error);
                        } else {
                            throw error;
                        }
                    }
                };
                
                // PNG doesn't support quality parameter
                if (format === 'png') {
                    canvas.toBlob(blobCallback, mimeType);
                } else {
                    // JPEG and WebP support quality parameter
                    canvas.toBlob(blobCallback, mimeType, quality);
                }
            }, timeoutMs).catch(error => {
                if (error instanceof ImageResizerError) {
                    showNotification(`Resize failed: ${error.message}`, 'error');
                    console.error('[ImageResizer]', error);
                } else {
                    const wrappedError = new ImageResizerError('RESIZE_ERROR', 'An error occurred during resizing', {
                        originalError: error.message,
                        targetWidth: dimensions.width,
                        targetHeight: dimensions.height
                    });
                    showNotification('Resize failed', 'error');
                    console.error('[ImageResizer]', wrappedError);
                }
            });
        } catch (error) {
            if (error instanceof ImageResizerError) {
                showNotification(`Error: ${error.message}`, 'error');
                console.error('[ImageResizer]', error);
            } else {
                console.error('[ImageResizer] Unexpected error:', error);
                showNotification('An unexpected error occurred', 'error');
            }
        }
    }
    
    // High-quality canvas resizing with intelligent step-down approach
    function createHighQualityCanvas(img, targetWidth, targetHeight) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { 
            alpha: true, 
            willReadFrequently: false,
            colorSpace: 'srgb'
        });
        
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        
        // Calculate scale ratios (both must match to preserve aspect ratio)
        const scaleX = targetWidth / originalWidth;
        const scaleY = targetHeight / originalHeight;
        const minScale = Math.min(scaleX, scaleY);  // Use minimum to maintain aspect ratio
        
        // Determine rendering quality based on scale
        let imageSmoothingQuality = 'high';
        if (minScale > 0.8) {
            // Minor downscaling or upscaling - standard quality fine
            imageSmoothingQuality = 'medium';
        }
        
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = imageSmoothingQuality;
        
        // Step-down scaling for better quality when downscaling to <50% of original
        // Only applies when significant downscaling needed
        if (minScale < 0.5) {
            // Calculate proper intermediate dimensions maintaining aspect ratio
            const currentAspect = originalWidth / originalHeight;
            const targetAspect = targetWidth / targetHeight;
            
            // Use step-down scaling approach for better quality
            let currentWidth = originalWidth;
            let currentHeight = originalHeight;
            
            // Create source canvas and draw original image
            const sourceCanvas = document.createElement('canvas');
            sourceCanvas.width = currentWidth;
            sourceCanvas.height = currentHeight;
            const sourceCtx = sourceCanvas.getContext('2d', { alpha: true, colorSpace: 'srgb' });
            sourceCtx.imageSmoothingEnabled = true;
            sourceCtx.imageSmoothingQuality = 'high';
            sourceCtx.drawImage(img, 0, 0);
            
            // Calculate how many step-down iterations we need
            let iterations = 0;
            let testWidth = currentWidth;
            while (testWidth > targetWidth * 2 && testWidth > 100) {
                testWidth = Math.floor(testWidth / 2);
                iterations++;
            }
            
            // Perform iterative step-down scaling
            if (iterations > 0) {
                for (let i = 0; i < iterations; i++) {
                    const nextWidth = Math.floor(currentWidth / 2);
                    const nextHeight = Math.floor(nextWidth / currentAspect);
                    
                    const stepCanvas = document.createElement('canvas');
                    stepCanvas.width = nextWidth;
                    stepCanvas.height = nextHeight;
                    const stepCtx = stepCanvas.getContext('2d', { alpha: true, colorSpace: 'srgb' });
                    stepCtx.imageSmoothingEnabled = true;
                    stepCtx.imageSmoothingQuality = 'high';
                    
                    // Draw previous step scaled down by exactly 50%
                    stepCtx.drawImage(sourceCanvas, 0, 0, currentWidth, currentHeight, 0, 0, nextWidth, nextHeight);
                    
                    // Copy to source for next iteration
                    sourceCanvas.width = nextWidth;
                    sourceCanvas.height = nextHeight;
                    sourceCtx.drawImage(stepCanvas, 0, 0);
                    
                    currentWidth = nextWidth;
                    currentHeight = nextHeight;
                }
            }
            
            // Final draw from current size to exact target dimensions
            // This preserves aspect ratio correctly
            ctx.drawImage(sourceCanvas, 0, 0, currentWidth, currentHeight, 0, 0, targetWidth, targetHeight);
        } else {
            // Direct scaling for upscaling or minor downscaling
            // This is fast and sufficient for small scale changes
            ctx.drawImage(img, 0, 0, originalWidth, originalHeight, 0, 0, targetWidth, targetHeight);
        }
        
        return canvas;
    }
    
    function resetTool() {
        imageInput.value = '';
        currentImage = null;
        originalWidth = 0;
        originalHeight = 0;
        originalFile = null;
        
        fileInfo.style.display = 'none';
        settingsSection.style.display = 'none';
        previewSection.style.display = 'none';
        resultsSection.style.display = 'none';
        
        resizeMode.value = 'dimensions';
        handleResizeModeChange();
        
        showNotification('Tool reset', 'success');
    }
    
    function showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type === 'error' ? 'error' : ''}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transition = 'opacity 0.3s ease';
            setTimeout(() => {
                notification.parentNode.removeChild(notification);
            }, 300);
        }, 3000);
    }
});

// Initialize monitoring system if available
if (typeof window.BgRemovalTools !== 'undefined') {
    try {
        // Log tool initialization
        if (window.BgRemovalTools.ErrorTracker) {
            const tracker = new window.BgRemovalTools.ErrorTracker('image-resizer');
            tracker.log('TOOL_INITIALIZED', 'Image Resizer tool initialized with full reliability checks', {
                canvas: true,
                validation: true,
                timeout: true,
                memoryCheck: true,
                serviceWorker: 'registered'
            });
        }
    } catch (e) {
        console.warn('Monitoring initialization failed:', e);
    }
}
