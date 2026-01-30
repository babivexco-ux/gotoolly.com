/* ============================================
   GO TOOLLY - IMAGE COMPRESSOR
   Professional Image Compression Tool
   Version 2.1 - Fixed double-compress and UI click issues
   - Prevent duplicate clicks from triggering multiple runs
   - Stop propagation on browse-link to avoid double file-picker invocation
   - Cleaned up drop-zone click behavior
   - Removed stray HTML diff markers (fixed UI text placement)
   ============================================ */

// ============================================
// ERROR HANDLING SYSTEM
// ============================================
class ImageCompressorError extends Error {
    constructor(code, message, context = {}) {
        super(message);
        this.code = code;
        this.message = message;
        this.context = context;
        this.timestamp = new Date().toISOString();
        
        console.error(`[${this.code}] ${this.message}`, context);
    }
}

// ============================================
// MAIN APPLICATION
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('=== IMAGE COMPRESSOR INITIALIZED ===');
    
    // DOM Elements
    const imageInput = document.getElementById('image-input');
    const dropZone = document.getElementById('drop-zone');
    const fileList = document.getElementById('file-list');
    const fileNames = document.getElementById('file-names');
    const fileCount = document.getElementById('file-count');
    const qualitySlider = document.getElementById('quality');
    const qualityValue = document.getElementById('quality-value');
    const qualityFill = document.getElementById('quality-fill');
    const maxWidthSelect = document.getElementById('max-width');
    const formatSelect = document.getElementById('format');
    const formatTip = document.getElementById('format-tip');
    const compressBtn = document.getElementById('compress-btn');
    const resetBtn = document.getElementById('reset-btn');
    const progressArea = document.getElementById('progress-area');
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');
    const progressPercent = document.getElementById('progress-percent');
    const resultsArea = document.getElementById('results-area');
    const resultsContent = document.getElementById('results-content');
    const emptyResults = document.getElementById('empty-results');
    const downloadSelectedBtn = document.getElementById('download-selected');
    // const downloadAllBtn = document.getElementById('download-all');
    const originalSizeEl = document.getElementById('original-size');
    const compressedSizeEl = document.getElementById('compressed-size');
    const savingsPercentEl = document.getElementById('savings-percent');
    const comparisonArea = document.getElementById('comparison-area');
    const comparisonOriginalImg = document.getElementById('comparison-original-img');
    const comparisonCompressedImg = document.getElementById('comparison-compressed-img');
    
    // State
    let selectedFiles = [];
    let compressedResults = [];
    let selectedImageIndex = null;
    let originalImageUrls = new Map(); // Store original image URLs for comparison
    let isProcessing = false; // Guard against duplicate compression runs
    
    // ============================================
    // INITIALIZATION
    // ============================================
    function initialize() {
        console.log('Initializing image compressor...');
        
        // Verify all required elements exist (downloadSelectedBtn is optional)
        const requiredElements = {
            imageInput, dropZone, qualitySlider, compressBtn,
            resultsContent
        };
        
        for (const [name, element] of Object.entries(requiredElements)) {
            if (!element) {
                console.error(`❌ Missing required element: ${name}`);
                return;
            }
        }
        
        if (!downloadSelectedBtn) {
            console.warn('⚠️ Optional element "downloadSelectedBtn" not found; download-selected functionality will be disabled.');
        }
        
        console.log('✓ All elements found');
        
        // Setup event listeners
        setupEventListeners();
        // Add click-to-browse for drop zone
        const browseLink = document.getElementById('browse-link');
        if (browseLink && imageInput) {
            // Prevent event propagation to avoid the dropZone click handler firing twice
            browseLink.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                if (imageInput) imageInput.click();
            });

            // Accessible activation via keyboard (Enter / Space)
            browseLink.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    if (imageInput) imageInput.click();
                }
            });
        }
        
        // Hide empty results if results are showing
        if (compressedResults.length > 0) {
            emptyResults.style.display = 'none';
            // Use block to preserve panel layout (avoid forcing flex which can rearrange inner content)
            resultsArea.style.display = 'block';
        }
        
        console.log('✓ Initialization complete');
    }
    
    // ============================================
    // EVENT LISTENERS SETUP - FIXED VERSION
    // ============================================
    function setupEventListeners() {
        console.log('Setting up event listeners...');
        
        // File input change - CORRECTLY SET UP
        if (imageInput) {
            console.log('✓ Setting up image input listener');
            imageInput.addEventListener('change', handleFileSelect);
        } else {
            console.error('❌ imageInput element not found!');
        }
        
        // Drop zone events - FIXED: Only handle drag/drop, NOT click
        if (dropZone) {
            console.log('✓ Setting up drop zone listeners');
            
            // Add a click fallback to ensure the file picker opens even if label behavior is inconsistent
            // Only trigger when clicking the drop zone itself (avoid nested clickable elements triggering twice)
            dropZone.addEventListener('click', (e) => {
                try {
                    // If the click started on the browse-link or the native file input itself, do nothing.
                    // This prevents the file picker from being triggered twice (native click + programmatic click)
                    if (e.target && e.target.closest) {
                        if (e.target.closest('#browse-link') || e.target.closest('#image-input') || (e.target.tagName && e.target.tagName.toLowerCase() === 'input' && e.target.type === 'file')) return;
                    }
                } catch (err) {
                    // If closest() is not available for any reason, fall back to a safe click
                }
                if (imageInput) imageInput.click();
            });
            
            // Drag/drop handlers on the drop zone
            dropZone.addEventListener('dragover', handleDragOver);
            dropZone.addEventListener('dragleave', handleDragLeave);
            dropZone.addEventListener('drop', handleDrop);
            
            // Also attach drag/drop handlers to the file input itself so drops land correctly
            if (imageInput) {
                imageInput.addEventListener('dragover', handleDragOver);
                imageInput.addEventListener('dragleave', handleDragLeave);
                imageInput.addEventListener('drop', handleDrop);
            }
            
            // The label will automatically trigger the file input when clicked
            // because it has for="image-input" attribute or contains the input
        } else {
            console.error('❌ dropZone element not found!');
        }
        
        // Quality slider
        if (qualitySlider) {
            qualitySlider.addEventListener('input', function() {
                const value = this.value;
                qualityValue.textContent = value + '%';
                if (qualityFill) {
                    qualityFill.style.transform = `scaleX(${value/100})`;
                    
                    // Update quality bar color based on value
                    if (value < 40) {
                        qualityFill.style.background = '#ef4444';
                    } else if (value < 70) {
                        qualityFill.style.background = '#f59e0b';
                    } else {
                        qualityFill.style.background = '#10b981';
                    }
                }
            });
        }
        
        // Format select tip
        if (formatSelect) {
            formatSelect.addEventListener('change', function() {
                const tips = {
                    'original': 'Keep original format',
                    'jpeg': 'Best for photos',
                    'png': 'Best for graphics with transparency',
                    'webp': 'Best compression (modern format)'
                };
                if (formatTip) {
                    formatTip.textContent = tips[this.value] || '';
                }
            });
        }
        
        // Main buttons
        if (compressBtn) {
            // Prevent duplicate clicks from starting multiple runs
            compressBtn.addEventListener('click', function(e) {
                e.preventDefault();
                if (isProcessing) {
                    console.warn('Compression already in progress - ignoring duplicate click');
                    return;
                }
                compressImages();
            });
        }
        
        if (resetBtn) {
            resetBtn.addEventListener('click', resetTool);
        }
        
        if (downloadSelectedBtn) {
            downloadSelectedBtn.addEventListener('click', downloadSelectedImage);
        }
        
        // Removed downloadAllBtn event listener since button is deleted
        
        // Initial quality bar color
        if (qualityFill) {
            qualityFill.style.transform = 'scaleX(0.8)';
            qualityFill.style.background = '#10b981';
        }
        
        console.log('✓ Event listeners setup complete');
    }
    
    // ============================================
    // FILE HANDLING
    // ============================================
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
        const imageFiles = files.filter(file => file.type.startsWith('image/'));
        
        if (imageFiles.length === 0) {
            showNotification('Please drop image files only', 'error');
            return;
        }
        
        selectedFiles = imageFiles;
        updateFileList();
        compressBtn.disabled = false;
        showNotification(`Added ${imageFiles.length} image(s)`, 'success');
    }
    
    function handleFileSelect(e) {
        console.log('File input changed, files:', e.target.files);
        
        if (!e.target.files || e.target.files.length === 0) {
            console.log('No files selected');
            return;
        }
        
        const files = Array.from(e.target.files);
        console.log(`Selected ${files.length} files`);
        
        // Filter and validate image files
        const validFormats = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp'];
        selectedFiles = files.filter(file => {
            if (!file.type.startsWith('image/')) {
                showNotification(`Skipped ${file.name}: Not an image`, 'warning');
                return false;
            }
            
            if (!validFormats.includes(file.type)) {
                showNotification(`Skipped ${file.name}: Unsupported format`, 'warning');
                return false;
            }
            
            if (file.size > 10 * 1024 * 1024) {
                showNotification(`Skipped ${file.name}: File too large (>10MB)`, 'error');
                return false;
            }
            
            return true;
        });
        
        console.log(`Valid images: ${selectedFiles.length}`);
        
        if (selectedFiles.length > 0) {
            updateFileList();
            compressBtn.disabled = false;
            showNotification(`Selected ${selectedFiles.length} image(s)`, 'success');
        } else {
            showNotification('No valid image files selected', 'error');
            compressBtn.disabled = true;
        }
    }
    
    function updateFileList() {
        if (!fileList) return;
        
        if (selectedFiles.length === 0) {
            fileList.style.display = 'none';
            if (compressBtn) compressBtn.disabled = true;
            if (fileCount) fileCount.textContent = '0';
            return;
        }
        
        fileList.style.display = 'block';
        if (fileNames) {
            fileNames.innerHTML = selectedFiles.map((f, i) => {
                const size = formatFileSize(f.size);
                const icon = f.type.includes('png') ? '🖼️' : 
                            f.type.includes('jpeg') ? '📷' : 
                            f.type.includes('webp') ? '🌐' : '📄';
                return `<div style="margin-bottom: 4px; padding: 4px 8px; background: rgba(0,0,0,0.02); border-radius: 4px;">
                    ${icon} ${f.name} (${size})
                </div>`;
            }).join('');
        }
        
        if (compressBtn) compressBtn.disabled = false;
        if (fileCount) fileCount.textContent = String(selectedFiles.length);
    }
    
    // ============================================
    // IMAGE COMPRESSION CORE
    // ============================================
    async function compressImages() {
        if (isProcessing) {
            console.warn('Compression already running - skipping additional request');
            return;
        }
        isProcessing = true;

        try {
            if (selectedFiles.length === 0) {
                showNotification('Please select images first', 'error');
                return;
            }
            
            // Reset state
            compressedResults = [];
            selectedImageIndex = null;
            if (downloadSelectedBtn) downloadSelectedBtn.disabled = true;
            
            // Show progress
            if (compressBtn) {
                compressBtn.disabled = true;
                compressBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
            }
            
            if (progressArea) progressArea.style.display = 'block';
            if (emptyResults) emptyResults.style.display = 'none';
            if (resultsArea) resultsArea.style.display = 'block';
            
            const quality = parseInt(qualitySlider.value) / 100;
            const maxWidth = parseInt(maxWidthSelect.value);
            const outputFormat = formatSelect.value;
            const totalFiles = selectedFiles.length;
            
            let originalTotalSize = 0;
            let compressedTotalSize = 0;
            let processedCount = 0;
            
            // Process images sequentially to avoid memory issues
            for (let i = 0; i < selectedFiles.length; i++) {
                const file = selectedFiles[i];
                originalTotalSize += file.size;
                
                updateProgress(i, totalFiles, `Processing: ${file.name}`);
                
                try {
                    // Store original image URL for comparison
                    const originalUrl = URL.createObjectURL(file);
                    originalImageUrls.set(file.name, originalUrl);
                    
                    const result = await compressImage(file, quality, maxWidth, outputFormat);
                    
                    compressedTotalSize += result.compressedSize;
                    compressedResults.push(result);
                    processedCount++;
                    
                    // Update UI with each result
                    updateResultsUI();
                    
                } catch (error) {
                    console.error('Error compressing ' + file.name, error);
                    showNotification(`Failed to compress ${file.name}: ${error.message}`, 'error');
                }
            }
            
            // Final update
            updateProgress(totalFiles, totalFiles, 'Complete!');
            
            // Update statistics
            updateStatistics(originalTotalSize, compressedTotalSize);
            
            // Reset UI state
            setTimeout(() => {
                if (progressArea) progressArea.style.display = 'none';
                if (compressBtn) {
                    compressBtn.disabled = false;
                    compressBtn.innerHTML = '<i class="fas fa-compress-alt"></i> Compress Images';
                }
                
                if (processedCount > 0) {
                    showNotification(`Successfully compressed ${processedCount} image(s)`, 'success');
                    // Select first image by default
                    if (compressedResults.length > 0) {
                        selectImage(0);
                    }
                }
            }, 500);
        } finally {
            // Always clear processing flag so new runs can start
            isProcessing = false;
        }
    }
    
    async function compressImage(file, quality, maxWidth, outputFormat) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                const img = new Image();
                
                img.onload = function() {
                    try {
                        // Validate image
                        if (!img.width || !img.height) {
                            throw new ImageCompressorError('INVALID_IMAGE', 'Image failed to load');
                        }
                        
                        // Calculate new dimensions
                        let width = img.width;
                        let height = img.height;
                        
                        if (maxWidth > 0 && width > maxWidth) {
                            const ratio = maxWidth / width;
                            width = Math.round(maxWidth);
                            height = Math.round(height * ratio);
                        }
                        
                        // Create canvas with proper settings
                        const canvas = document.createElement('canvas');
                        canvas.width = width;
                        canvas.height = height;
                        
                        const ctx = canvas.getContext('2d', {
                            alpha: true, // Preserve transparency
                            desynchronized: true // Performance hint
                        });
                        
                        if (!ctx) {
                            throw new ImageCompressorError('CANVAS_ERROR', 'Failed to get canvas context');
                        }
                        
                        // Configure high-quality rendering
                        ctx.imageSmoothingEnabled = true;
                        ctx.imageSmoothingQuality = 'high';
                        
                        // Clear canvas with white background for JPEG (no transparency)
                        if (outputFormat === 'jpeg' || file.type === 'image/jpeg') {
                            ctx.fillStyle = '#FFFFFF';
                            ctx.fillRect(0, 0, width, height);
                        }
                        
                        // Draw image with high quality
                        ctx.drawImage(img, 0, 0, width, height);
                        
                        // Determine output format
                        let mimeType, extension;
                        
                        switch(outputFormat) {
                            case 'jpeg':
                                mimeType = 'image/jpeg';
                                extension = 'jpg';
                                break;
                            case 'png':
                                mimeType = 'image/png';
                                extension = 'png';
                                break;
                            case 'webp':
                                mimeType = 'image/webp';
                                extension = 'webp';
                                break;
                            default: // 'original'
                                mimeType = file.type;
                                extension = file.name.split('.').pop().toLowerCase();
                        }
                        
                        // Adaptive quality adjustment based on image size
                        let finalQuality = quality;
                        const megapixels = (width * height) / 1000000;
                        
                        if (megapixels < 0.5) {
                            // Very small images can use higher compression
                            finalQuality = Math.max(0.3, quality - 0.2);
                        } else if (megapixels > 5) {
                            // Large images need better quality preservation
                            finalQuality = Math.min(0.95, quality + 0.1);
                        }
                        
                        // Create blob with format-specific handling
                        canvas.toBlob(
                            function(blob) {
                                if (!blob) {
                                    reject(new ImageCompressorError('BLOB_ERROR', 'Failed to create compressed image'));
                                    return;
                                }
                                
                                const originalSize = file.size;
                                const compressedSize = blob.size;
                                const savedPercent = originalSize > 0 ? 
                                    Math.round(((originalSize - compressedSize) / originalSize) * 100) : 0;
                                
                                // Generate filename
                                const nameParts = file.name.split('.');
                                const baseName = nameParts.slice(0, -1).join('.');
                                const newFileName = `${baseName}-compressed.${extension}`;
                                
                                const result = {
                                    file: blob,
                                    name: newFileName,
                                    originalName: file.name,
                                    originalSize: originalSize,
                                    compressedSize: compressedSize,
                                    savedPercent: savedPercent,
                                    width: width,
                                    height: height,
                                    url: URL.createObjectURL(blob),
                                    quality: Math.round(finalQuality * 100),
                                    format: mimeType.split('/')[1].toUpperCase()
                                };
                                
                                resolve(result);
                            },
                            mimeType,
                            mimeType === 'image/png' ? undefined : finalQuality // PNG doesn't use quality parameter
                        );
                        
                    } catch (error) {
                        reject(error);
                    }
                };
                
                img.onerror = () => {
                    reject(new ImageCompressorError('IMAGE_LOAD_ERROR', 'Failed to load image data'));
                };
                
                img.src = e.target.result;
            };
            
            reader.onerror = () => {
                reject(new ImageCompressorError('FILE_READ_ERROR', 'Failed to read file'));
            };
            
            reader.readAsDataURL(file);
        });
    }
    
    // ============================================
    // UI UPDATES
    // ============================================
    function updateProgress(current, total, message = 'Processing...') {
        const percent = Math.round((current / total) * 100);
        if (progressFill) progressFill.style.width = percent + '%';
        if (progressPercent) progressPercent.textContent = percent + '%';
        if (progressText) progressText.textContent = message;
    }
    
    function updateResultsUI() {
        if (!resultsContent) return;
        
        resultsContent.innerHTML = '';
        
        compressedResults.forEach((result, index) => {
            const resultItem = document.createElement('div');
            resultItem.className = `result-item ${selectedImageIndex === index ? 'selected' : ''}`;
            resultItem.dataset.index = index;

            const savingsColor = result.savedPercent >= 0 ? '#10b981' : '#ef4444';
            const savingsIcon = result.savedPercent >= 0 ? '↓' : '↑';

            resultItem.innerHTML = `
                <div class="result-preview">
                    <img src="${result.url}" alt="${result.originalName}" loading="lazy" height="120">
                </div>
                <div class="result-info">
                    <small style="display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                        ${result.originalName}
                    </small>
                    <div style="display: flex; justify-content: space-between; margin-top: 4px;">
                        <span style="color: var(--color-text-light); font-size: 11px;">
                            ${formatFileSize(result.originalSize)}
                        </span>
                        <span style="color: ${savingsColor}; font-weight: bold; font-size: 11px;">
                            ${savingsIcon} ${Math.abs(result.savedPercent)}%
                        </span>
                        <span style="color: var(--color-text-light); font-size: 11px;">
                            ${formatFileSize(result.compressedSize)}
                        </span>
                    </div>
                    <div style="font-size: 10px; color: var(--color-text-light); margin-top: 2px;">
                        ${result.width}×${result.height}px • ${result.format} • Q${result.quality}
                    </div>
                </div>
            `;

            // Add Download button directly below the image
            const downloadBtn = document.createElement('button');
            downloadBtn.className = 'btn btn-primary btn-sm';
            downloadBtn.style = 'width: 100%; margin-top: 8px;';
            downloadBtn.innerHTML = '<i class="fas fa-download"></i> Download';
            downloadBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                downloadBlob(result.file, result.name);
                showNotification(`Downloaded ${result.name}`, 'success');
            });
            resultItem.appendChild(downloadBtn);

            // Add click handler for selection
            resultItem.addEventListener('click', () => selectImage(index));

            resultsContent.appendChild(resultItem);
        });
    }
    
    function selectImage(index) {
        // Update selection
        document.querySelectorAll('.result-item').forEach(item => {
            item.classList.remove('selected');
        });
        
        if (compressedResults[index]) {
            const resultItem = document.querySelector(`.result-item[data-index="${index}"]`);
            if (resultItem) {
                resultItem.classList.add('selected');
            }
            
            selectedImageIndex = index;
            if (downloadSelectedBtn) downloadSelectedBtn.disabled = false;
            
            // Update comparison view
            const result = compressedResults[index];
            const originalUrl = originalImageUrls.get(result.originalName);
            
            if (originalUrl && comparisonOriginalImg && comparisonCompressedImg) {
                comparisonOriginalImg.src = originalUrl;
                comparisonCompressedImg.src = result.url;
                if (comparisonArea) {
                    comparisonArea.style.display = 'block';
                    
                    // Scroll comparison into view
                    setTimeout(() => {
                        comparisonArea.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }, 100);
                }
            }
        }
    }
    
    function updateStatistics(originalTotal, compressedTotal) {
        if (originalSizeEl) {
            originalSizeEl.textContent = formatFileSize(originalTotal);
        }
        
        if (compressedSizeEl) {
            compressedSizeEl.textContent = formatFileSize(compressedTotal);
        }
        
        if (savingsPercentEl) {
            if (originalTotal > 0) {
                const savingsPercent = Math.round(((originalTotal - compressedTotal) / originalTotal) * 100);
                savingsPercentEl.textContent = savingsPercent + '%';
                savingsPercentEl.style.color = savingsPercent >= 0 ? '#10b981' : '#ef4444';
            } else {
                savingsPercentEl.textContent = '0%';
            }
        }
    }
    
    // ============================================
    // DOWNLOAD FUNCTIONS
    // ============================================
    function downloadSelectedImage() {
        if (selectedImageIndex === null || !compressedResults[selectedImageIndex]) {
            showNotification('No image selected', 'error');
            return;
        }
        
        const result = compressedResults[selectedImageIndex];
        downloadBlob(result.file, result.name);
        showNotification(`Downloaded ${result.name}`, 'success');
    }
    
    async function downloadAllImages() {
        if (compressedResults.length === 0) {
            showNotification('No compressed images available', 'error');
            return;
        }
        
        if (compressedResults.length === 1) {
            // Single file, download directly
            downloadSelectedImage();
            return;
        }
        
        // Multiple files, create ZIP
        try {
            if (downloadAllBtn) {
                downloadAllBtn.disabled = true;
                const originalText = downloadAllBtn.innerHTML;
                downloadAllBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating ZIP...';
            }
            
            const zip = new JSZip();
            
            compressedResults.forEach(result => {
                zip.file(result.name, result.file);
            });
            
            const blob = await zip.generateAsync({ 
                type: 'blob',
                compression: 'DEFLATE',
                compressionOptions: { level: 6 }
            });
            
            downloadBlob(blob, 'compressed-images.zip');
            showNotification(`Downloaded ${compressedResults.length} images as ZIP`, 'success');
            
        } catch (error) {
            console.error('ZIP creation error:', error);
            showNotification('Failed to create ZIP file', 'error');
        } finally {
            if (downloadAllBtn) {
                downloadAllBtn.disabled = false;
                downloadAllBtn.innerHTML = '<i class="fas fa-file-archive"></i> Download All as ZIP';
            }
        }
    }
    
    function downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up URL after download
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
    
    // ============================================
    // RESET FUNCTION
    // ============================================
    function resetTool() {
        // Clear file state
        selectedFiles = [];
        compressedResults = [];
        selectedImageIndex = null;
        
        // Clean up object URLs
        originalImageUrls.forEach(url => URL.revokeObjectURL(url));
        originalImageUrls.clear();
        compressedResults.forEach(result => URL.revokeObjectURL(result.url));
        
        // Reset UI
        if (imageInput) imageInput.value = '';
        if (fileList) fileList.style.display = 'none';
        if (resultsArea) resultsArea.style.display = 'none';
        if (emptyResults) emptyResults.style.display = 'flex';
        if (compressBtn) compressBtn.disabled = true;
        if (downloadSelectedBtn) downloadSelectedBtn.disabled = true;
        if (progressArea) progressArea.style.display = 'none';
        if (comparisonArea) comparisonArea.style.display = 'none';
        if (fileCount) fileCount.textContent = '0';
        
        // Reset controls
        if (qualitySlider) qualitySlider.value = 80;
        if (qualityValue) qualityValue.textContent = '80%';
        if (qualityFill) {
            qualityFill.style.width = '80%';
            qualityFill.style.background = '#10b981';
        }
        if (maxWidthSelect) maxWidthSelect.value = 1280;
        if (formatSelect) formatSelect.value = 'webp';
        if (formatTip) formatTip.textContent = 'WebP offers best compression';
        
        showNotification('Tool has been reset', 'info');
    }
    
    // ============================================
    // UTILITY FUNCTIONS
    // ============================================
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    function showNotification(message, type = 'info') {
        // Remove any existing notification
        const existing = document.querySelector('.custom-notification');
        if (existing) existing.remove();
        
        // Create notification
        const notification = document.createElement('div');
        notification.className = 'custom-notification';
        
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        
        notification.innerHTML = `
            <div style="
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 12px 20px;
                background: ${type === 'error' ? '#ef4444' : 
                           type === 'success' ? '#10b981' : 
                           type === 'warning' ? '#f59e0b' : '#3b82f6'};
                color: white;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 9999;
                font-weight: 500;
                display: flex;
                align-items: center;
                gap: 8px;
                animation: slideIn 0.3s ease-out;
            ">
                ${icons[type] || icons.info} ${message}
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Add animation styles if not already present
        if (!document.querySelector('#notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
        
        // Remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOut 0.3s ease-out';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }
        }, 3000);
    }
    
    // ============================================
    // INITIALIZE APPLICATION
    // ============================================
    initialize();
});