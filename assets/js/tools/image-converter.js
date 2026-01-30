/* ============================================
   GO TOOLLY - IMAGE CONVERTER
   ============================================ */

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const imageInput = document.getElementById('image-input');
    const convertBtn = document.getElementById('convert-btn');
    const resetBtn = document.getElementById('reset-btn');
    const qualitySlider = document.getElementById('quality');
    const qualityValue = document.getElementById('quality-value');
    const outputFormat = document.getElementById('output-format');
    const resizeMode = document.getElementById('resize-mode');
    const maxWidth = document.getElementById('max-width');
    const maxHeight = document.getElementById('max-height');
    const fileCount = document.getElementById('file-count');
    const progressArea = document.getElementById('progress-area');
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');
    const progressPercent = document.getElementById('progress-percent');
    const resultsArea = document.getElementById('results-area');
    const resultsContent = document.getElementById('results-content');
    const downloadAllBtn = document.getElementById('download-all');
    
    // State
    let images = [];
    let conversionResults = [];
    
    // Initialize event listeners
    initEventListeners();
    
    function initEventListeners() {
        // File input change
        imageInput.addEventListener('change', handleFileSelect);
        
        // Quality slider
        qualitySlider.addEventListener('input', function() {
            qualityValue.textContent = this.value;
        });
        
        // Convert button
        convertBtn.addEventListener('click', convertImages);
        
        // Reset button
        resetBtn.addEventListener('click', resetTool);
        
        // Download all button
        downloadAllBtn.addEventListener('click', downloadAllImages);
        
        // Drag and drop
        const dropZone = document.querySelector('.file-input-label');
        dropZone.addEventListener('dragover', handleDragOver);
        dropZone.addEventListener('drop', handleDrop);
    }
    
    function handleFileSelect(event) {
        const files = event.target.files;
        if (files.length === 0) return;
        
        images = Array.from(files).filter(file => 
            file.type.startsWith('image/')
        );
        fileCount.textContent = `${images.length} file${images.length > 1 ? 's' : ''} selected`;
        convertBtn.disabled = images.length === 0;
        
        // Show preview of first image
        if (images.length > 0) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const previewArea = document.querySelector('.file-input-label');
                previewArea.innerHTML = `
                    <img src="${e.target.result}" class="image-preview" alt="Preview" height="120">
                    <span>${images.length} image${images.length > 1 ? 's' : ''} ready</span>
                `;
                previewArea.classList.add('has-content');
            };
            reader.readAsDataURL(images[0]);
        }
    }
    
    function handleDragOver(event) {
        event.preventDefault();
        event.stopPropagation();
        event.dataTransfer.dropEffect = 'copy';
    }
    
    function handleDrop(event) {
        event.preventDefault();
        event.stopPropagation();
        
        const files = event.dataTransfer.files;
        if (files.length === 0) return;
        
        const imageFiles = Array.from(files).filter(file => 
            file.type.startsWith('image/')
        );
        
        if (imageFiles.length === 0) {
            showNotification('Please drop image files only', 'error');
            return;
        }
        
        images = imageFiles;
        imageInput.files = event.dataTransfer.files;
        fileCount.textContent = `${images.length} file${images.length > 1 ? 's' : ''} selected`;
        convertBtn.disabled = false;
        
        // Show preview
        if (images.length > 0) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const previewArea = document.querySelector('.file-input-label');
                previewArea.innerHTML = `
                    <img src="${e.target.result}" class="image-preview" alt="Preview">
                    <span>${images.length} image${images.length > 1 ? 's' : ''} ready</span>
                `;
                previewArea.classList.add('has-content');
            };
            reader.readAsDataURL(images[0]);
        }
    }
    
    async function convertImages() {
        if (images.length === 0) {
            showNotification('Please select images first', 'error');
            return;
        }
        
        // Show progress
        progressArea.style.display = 'block';
        convertBtn.disabled = true;
        conversionResults = [];
        
        const quality = parseInt(qualitySlider.value) / 100;
        const format = outputFormat.value;
        const resize = resizeMode.value;
        const width = resize === 'width' || resize === 'both' ? parseInt(maxWidth.value) : 0;
        const height = resize === 'height' || resize === 'both' ? parseInt(maxHeight.value) : 0;
        const preserveMetadata = document.getElementById('preserve-metadata').checked;
        const optimizePNG = document.getElementById('optimize-png').checked;
        const progressiveJPEG = document.getElementById('progressive-jpeg').checked;
        
        let processed = 0;
        
        for (const imageFile of images) {
            try {
                progressText.textContent = `Converting: ${imageFile.name}`;
                progressPercent.textContent = `${Math.round((processed / images.length) * 100)}%`;
                progressFill.style.width = `${(processed / images.length) * 100}%`;
                
                const result = await convertImage(
                    imageFile,
                    quality,
                    format,
                    resize,
                    width,
                    height,
                    preserveMetadata,
                    optimizePNG,
                    progressiveJPEG
                );
                
                conversionResults.push({
                    ...result,
                    originalName: imageFile.name
                });
                
                processed++;
                progressPercent.textContent = `${Math.round((processed / images.length) * 100)}%`;
                progressFill.style.width = `${(processed / images.length) * 100}%`;
            } catch (error) {
                console.error('Error converting image:', error);
                showNotification(`Failed to convert ${imageFile.name}: ${error.message}`, 'error');
            }
        }
        
        // Hide progress, show results
        progressArea.style.display = 'none';
        convertBtn.disabled = false;
        
        if (conversionResults.length > 0) {
            displayResults();
            resultsArea.style.display = 'block';
            showNotification(`Successfully converted ${conversionResults.length} image${conversionResults.length > 1 ? 's' : ''}`, 'success');
            
            // Scroll to results
            resultsArea.scrollIntoView({ behavior: 'smooth' });
        }
    }
    
    async function convertImage(file, quality, format, resizeMode, maxWidth, maxHeight, preserveMetadata, optimizePNG, progressiveJPEG) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                const img = new Image();
                img.onload = function() {
                    // Calculate new dimensions
                    let width = img.width;
                    let height = img.height;
                    
                    if (resizeMode !== 'none') {
                        if (resizeMode === 'width' && width > maxWidth) {
                            height = Math.round((height * maxWidth) / width);
                            width = maxWidth;
                        } else if (resizeMode === 'height' && height > maxHeight) {
                            width = Math.round((width * maxHeight) / height);
                            height = maxHeight;
                        } else if (resizeMode === 'both') {
                            width = maxWidth;
                            height = maxHeight;
                        }
                    }
                    
                    // Create canvas
                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    
                    const ctx = canvas.getContext('2d');
                    
                    // Draw image with high quality scaling
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    // Determine output MIME type and extension
                    let mimeType, extension;
                    switch(format) {
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
                        case 'avif':
                            mimeType = 'image/avif';
                            extension = 'avif';
                            break;
                        default:
                            mimeType = 'image/jpeg';
                            extension = 'jpg';
                    }
                    
                    // Convert to blob
                    canvas.toBlob(function(blob) {
                        if (!blob) {
                            reject(new Error('Failed to convert image'));
                            return;
                        }
                        
                        const originalSize = file.size;
                        const convertedSize = blob.size;
                        const sizeChange = ((convertedSize - originalSize) / originalSize * 100).toFixed(1);
                        
                        resolve({
                            blob,
                            originalSize,
                            convertedSize,
                            sizeChange,
                            width,
                            height,
                            mimeType,
                            extension,
                            url: URL.createObjectURL(blob)
                        });
                    }, mimeType, format === 'png' ? (1 - quality) : quality);
                };
                
                img.onerror = function() {
                    reject(new Error('Failed to load image'));
                };
                
                img.src = e.target.result;
            };
            
            reader.onerror = function() {
                reject(new Error('Failed to read file'));
            };
            
            reader.readAsDataURL(file);
        });
    }
    
    function displayResults() {
        let html = '';
        let totalOriginalSize = 0;
        let totalConvertedSize = 0;
        
        conversionResults.forEach((result, index) => {
            totalOriginalSize += result.originalSize;
            totalConvertedSize += result.convertedSize;
            
            const originalSizeStr = formatFileSize(result.originalSize);
            const convertedSizeStr = formatFileSize(result.convertedSize);
            const change = parseFloat(result.sizeChange);
            const changeText = change > 0 ? `+${change}%` : `${change}%`;
            const changeColor = change <= 0 ? 'var(--color-secondary)' : 'var(--color-text-light)';
            
            html += `
                <div class="result-item" style="margin-bottom: var(--space-4); padding: var(--space-4); border: 1px solid var(--color-border); border-radius: var(--radius-md);">
                    <div style="display: flex; align-items: center; gap: var(--space-4); margin-bottom: var(--space-2);">
                        <img src="${result.url}" alt="Converted" style="width: 60px; height: 60px; object-fit: cover; border-radius: var(--radius-sm);">
                        <div style="flex: 1;">
                            <div style="font-weight: var(--weight-medium); margin-bottom: var(--space-1);">
                                ${result.originalName} → ${result.originalName.replace(/\.[^/.]+$/, "")}.${result.extension}
                            </div>
                            <div style="font-size: var(--text-sm); color: var(--color-text-light);">
                                ${result.width} × ${result.height} pixels • ${result.extension.toUpperCase()}
                            </div>
                        </div>
                        <button class="btn btn-primary btn-sm" data-index="${index}">
                            Download
                        </button>
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-2); font-size: var(--text-sm);">
                        <div style="text-align: center;">
                            <div style="font-weight: var(--weight-medium);">Original</div>
                            <div style="color: var(--color-text-light);">${originalSizeStr}</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-weight: var(--weight-medium);">Converted</div>
                            <div style="color: var(--color-primary);">${convertedSizeStr}</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-weight: var(--weight-medium);">Size Change</div>
                            <div style="color: ${changeColor};">
                                ${changeText}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
        
        // Add totals
        const totalChange = ((totalConvertedSize - totalOriginalSize) / totalOriginalSize * 100).toFixed(1);
        const totalChangeText = totalChange > 0 ? `+${totalChange}%` : `${totalChange}%`;
        const totalChangeColor = totalChange <= 0 ? 'var(--color-secondary)' : 'var(--color-text-light)';
        
        html += `
            <div class="result-totals" style="margin-top: var(--space-6); padding: var(--space-4); background-color: var(--color-surface); border-radius: var(--radius-md);">
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-4); text-align: center;">
                    <div>
                        <div style="font-size: var(--text-sm); color: var(--color-text-light);">Total Original</div>
                        <div style="font-size: var(--text-xl); font-weight: var(--weight-bold);">${formatFileSize(totalOriginalSize)}</div>
                    </div>
                    <div>
                        <div style="font-size: var(--text-sm); color: var(--color-text-light);">Total Converted</div>
                        <div style="font-size: var(--text-xl); font-weight: var(--weight-bold); color: var(--color-primary);">${formatFileSize(totalConvertedSize)}</div>
                    </div>
                    <div>
                        <div style="font-size: var(--text-sm); color: var(--color-text-light);">Total Change</div>
                        <div style="font-size: var(--text-xl); font-weight: var(--weight-bold); color: ${totalChangeColor};">
                            ${totalChangeText}
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        resultsContent.innerHTML = html;
        
        // Add download event listeners
        resultsContent.querySelectorAll('button[data-index]').forEach(button => {
            button.addEventListener('click', function() {
                const index = parseInt(this.getAttribute('data-index'));
                downloadSingleImage(index);
            });
        });
    }
    
    function downloadSingleImage(index) {
        const result = conversionResults[index];
        if (!result) return;
        
        const link = document.createElement('a');
        link.href = result.url;
        link.download = `${result.originalName.replace(/\.[^/.]+$/, "")}.${result.extension}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    
    async function downloadAllImages() {
        if (conversionResults.length === 0) return;
        
        if (conversionResults.length === 1) {
            downloadSingleImage(0);
            return;
        }
        
        downloadAllBtn.disabled = true;
        downloadAllBtn.textContent = 'Creating ZIP...';
        
        try {
            // Download individually (ZIP would require JSZip library)
            for (let i = 0; i < conversionResults.length; i++) {
                const result = conversionResults[i];
                const link = document.createElement('a');
                link.href = result.url;
                link.download = `${result.originalName.replace(/\.[^/.]+$/, "")}.${result.extension}`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            showNotification('All files downloaded', 'success');
        } catch (error) {
            console.error('Error downloading files:', error);
            showNotification('Failed to download files', 'error');
        } finally {
            downloadAllBtn.disabled = false;
            downloadAllBtn.textContent = 'Download All (.zip)';
        }
    }
    
    function resetTool() {
        imageInput.value = '';
        images = [];
        conversionResults = [];
        
        fileCount.textContent = '0 files selected';
        convertBtn.disabled = true;
        resultsArea.style.display = 'none';
        progressArea.style.display = 'none';
        
        const previewArea = document.querySelector('.file-input-label');
        previewArea.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
            </svg>
            <span>Click to select images or drag and drop</span>
        `;
        previewArea.classList.remove('has-content');
        
        resultsContent.innerHTML = '';
        
        showNotification('Tool reset', 'info');
    }
    
    // Helper functions
    function showNotification(message, type = 'info') {
        if (typeof window.showNotification === 'function') {
            window.showNotification(message, type);
        } else {
            alert(message);
        }
    }
    
    function formatFileSize(bytes) {
        if (window.formatFileSize) {
            return window.formatFileSize(bytes);
        }
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
});