/* ============================================
   GO TOOLLY - IMAGE EDITOR
   Combined Image Converter & Resizer
   ============================================ */

document.addEventListener('DOMContentLoaded', function() {
    // Tab switching - handle both old tab-button and new tool-option
    const tabButtons = document.querySelectorAll('.tab-button, .tool-option[data-tab]');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            if (!tabName) return;
            
            // Remove active class from all buttons and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked button and corresponding content
            this.classList.add('active');
            const targetTab = document.getElementById(tabName);
            if (targetTab) {
                targetTab.classList.add('active');
            }
        });
    });
    
    // ==========================================
    // CONVERTER FUNCTIONALITY
    // ==========================================
    
    // Converter DOM Elements
    const converterImageInput = document.getElementById('converter-image-input');
    const converterFileCount = document.getElementById('converter-file-count');
    const converterConvertBtn = document.getElementById('converter-convert-btn');
    const converterResetBtn = document.getElementById('converter-reset-btn');
    const converterQualitySlider = document.getElementById('converter-quality');
    const converterQualityValue = document.getElementById('converter-quality-value');
    const converterOutputFormat = document.getElementById('converter-output-format');
    const converterResizeMode = document.getElementById('converter-resize-mode');
    const converterMaxWidth = document.getElementById('converter-max-width');
    const converterMaxHeight = document.getElementById('converter-max-height');
    const converterProgressArea = document.getElementById('converter-progress-area');
    const converterProgressFill = document.getElementById('converter-progress-fill');
    const converterProgressText = document.getElementById('converter-progress-text');
    const converterProgressPercent = document.getElementById('converter-progress-percent');
    const converterResultsArea = document.getElementById('converter-results-area');
    const converterResultsContent = document.getElementById('converter-results-content');
    
    // Converter State
    let converterImages = [];
    let converterResults = [];
    
    // Converter Event Listeners
    if (converterImageInput) converterImageInput.addEventListener('change', converterHandleFileSelect);
    if (converterQualitySlider) converterQualitySlider.addEventListener('input', function() {
        if (converterQualityValue) converterQualityValue.textContent = this.value;
    });
    if (converterConvertBtn) converterConvertBtn.addEventListener('click', converterConvertImages);
    if (converterResetBtn) converterResetBtn.addEventListener('click', converterResetTool);
    
    const converterDropZone = document.querySelector('[for="converter-image-input"]');
    if (converterDropZone) {
        converterDropZone.addEventListener('dragover', converterHandleDragOver);
        converterDropZone.addEventListener('drop', converterHandleDrop);
    }
    
    // Converter Resize Mode Change
    if (converterResizeMode) converterResizeMode.addEventListener('change', function() {
        const value = this.value;
        const widthContainer = document.getElementById('converter-width-container');
        const heightContainer = document.getElementById('converter-height-container');
        
        if (widthContainer) widthContainer.style.display = 'none';
        if (heightContainer) heightContainer.style.display = 'none';
        
        if (value === 'width' || value === 'both') {
            if (widthContainer) widthContainer.style.display = 'block';
        }
        if (value === 'height' || value === 'both') {
            if (heightContainer) heightContainer.style.display = 'block';
        }
    });
    
    function converterHandleFileSelect(event) {
        const files = event.target.files;
        if (files.length === 0) return;
        
        converterImages = Array.from(files).filter(file => 
            file.type.startsWith('image/')
        );
        converterFileCount.textContent = `${converterImages.length} file${converterImages.length > 1 ? 's' : ''} selected`;
        converterConvertBtn.disabled = converterImages.length === 0;
        
        if (converterImages.length > 0) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const previewArea = document.querySelector('.converter-label');
                previewArea.innerHTML = `
                    <img src="${e.target.result}" class="image-preview" alt="Preview" style="width: 48px; height: 48px; object-fit: cover; border-radius: 4px;">
                    <span>${converterImages.length} image${converterImages.length > 1 ? 's' : ''} ready</span>
                `;
                previewArea.classList.add('has-content');
            };
            reader.readAsDataURL(converterImages[0]);
        }
    }
    
    function converterHandleDragOver(event) {
        event.preventDefault();
        event.stopPropagation();
        event.dataTransfer.dropEffect = 'copy';
    }
    
    function converterHandleDrop(event) {
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
        
        converterImages = imageFiles;
        converterImageInput.files = event.dataTransfer.files;
        converterFileCount.textContent = `${converterImages.length} file${converterImages.length > 1 ? 's' : ''} selected`;
        converterConvertBtn.disabled = false;
        
        if (converterImages.length > 0) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const previewArea = document.querySelector('.converter-label');
                previewArea.innerHTML = `
                    <img src="${e.target.result}" class="image-preview" alt="Preview" style="width: 48px; height: 48px; object-fit: cover; border-radius: 4px;">
                    <span>${converterImages.length} image${converterImages.length > 1 ? 's' : ''} ready</span>
                `;
                previewArea.classList.add('has-content');
            };
            reader.readAsDataURL(converterImages[0]);
        }
    }
    
    async function converterConvertImages() {
        if (converterImages.length === 0) {
            showNotification('Please select images first', 'error');
            return;
        }
        
        converterProgressArea.style.display = 'block';
        converterConvertBtn.disabled = true;
        converterResults = [];
        
        const quality = parseInt(converterQualitySlider.value) / 100;
        const format = converterOutputFormat.value;
        const resize = converterResizeMode.value;
        const width = resize === 'width' || resize === 'both' ? parseInt(converterMaxWidth.value) : 0;
        const height = resize === 'height' || resize === 'both' ? parseInt(converterMaxHeight.value) : 0;
        const preserveMetadata = document.getElementById('converter-preserve-metadata').checked;
        const optimizePNG = document.getElementById('converter-optimize-png').checked;
        const progressiveJPEG = document.getElementById('converter-progressive-jpeg').checked;
        
        let processed = 0;
        
        for (const imageFile of converterImages) {
            try {
                converterProgressText.textContent = `Converting: ${imageFile.name}`;
                converterProgressPercent.textContent = `${Math.round((processed / converterImages.length) * 100)}%`;
                converterProgressFill.style.width = `${(processed / converterImages.length) * 100}%`;
                
                const result = await converterConvertImage(
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
                
                converterResults.push({
                    ...result,
                    originalName: imageFile.name
                });
                
                processed++;
                converterProgressPercent.textContent = `${Math.round((processed / converterImages.length) * 100)}%`;
                converterProgressFill.style.width = `${(processed / converterImages.length) * 100}%`;
            } catch (error) {
                console.error('Error converting image:', error);
                showNotification(`Failed to convert ${imageFile.name}: ${error.message}`, 'error');
            }
        }
        
        if (converterProgressArea) {
            converterProgressArea.style.display = 'none';
        }
        if (converterConvertBtn) {
            converterConvertBtn.disabled = false;
        }
        
        if (converterResults.length > 0) {
            converterDisplayResults();
            if (converterResultsArea) {
                converterResultsArea.style.display = 'block';
                converterResultsArea.scrollIntoView({ behavior: 'smooth' });
            }
            showNotification(`Successfully converted ${converterResults.length} image${converterResults.length > 1 ? 's' : ''}`, 'success');
        }
    }
    
    async function converterConvertImage(file, quality, format, resizeMode, maxWidth, maxHeight, preserveMetadata, optimizePNG, progressiveJPEG) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                const img = new Image();
                img.onload = function() {
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
                    
                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    
                    const ctx = canvas.getContext('2d');
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';
                    ctx.drawImage(img, 0, 0, width, height);
                    
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
                    }, mimeType, quality);
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
    
    function converterDisplayResults() {
        let html = '';
        let totalOriginalSize = 0;
        let totalConvertedSize = 0;
        
        converterResults.forEach((result, index) => {
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
                        <button class="btn btn-primary btn-sm" data-index="${index}" style="cursor: pointer;">
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
        
        if (converterResultsContent) {
            converterResultsContent.innerHTML = html;
            
            converterResultsContent.querySelectorAll('button[data-index]').forEach(button => {
                button.addEventListener('click', function() {
                    const index = parseInt(this.getAttribute('data-index'));
                    converterDownloadSingleImage(index);
                });
            });
        }
        
        if (converterResultsArea) {
            converterResultsArea.style.display = 'block';
        }
    }
    
    function converterDownloadSingleImage(index) {
        const result = converterResults[index];
        if (!result) return;
        
        const link = document.createElement('a');
        link.href = result.url;
        link.download = `${result.originalName.replace(/\.[^/.]+$/, "")}.${result.extension}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    

    
    function converterResetTool() {
        converterImageInput.value = '';
        converterImages = [];
        converterResults = [];
        
        converterFileCount.textContent = '0 files selected';
        converterConvertBtn.disabled = true;
        converterResultsArea.style.display = 'none';
        converterProgressArea.style.display = 'none';
        
        const previewArea = document.querySelector('.converter-label');
        previewArea.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
            </svg>
            <span>Click to select images or drag and drop</span>
        `;
        previewArea.classList.remove('has-content');
        
        converterResultsContent.innerHTML = '';
        
        showNotification('Tool reset', 'info');
    }
    
    // ==========================================
    // RESIZER FUNCTIONALITY
    // ==========================================
    
    // Resizer DOM Elements
    const resizerImageInput = document.getElementById('resizer-image-input');
    const resizerDropZone = document.getElementById('resizer-drop-zone');
    const resizerFileInfo = document.getElementById('resizer-file-info');
    const resizerFileName = document.getElementById('resizer-file-name');
    const resizerFileDimensions = document.getElementById('resizer-file-dimensions');
    const resizerSettingsSection = document.getElementById('resizer-settings-section');
    const resizerResizeMode = document.getElementById('resizer-resize-mode');
    const resizerResizeBtn = document.getElementById('resizer-resize-btn');
    const resizerResetBtn = document.getElementById('resizer-reset-btn');
    const resizerDimensionsMode = document.getElementById('resizer-dimensions-mode');
    const resizerPercentageMode = document.getElementById('resizer-percentage-mode');
    const resizerAspectMode = document.getElementById('resizer-aspect-mode');
    const resizerResizeWidth = document.getElementById('resizer-resize-width');
    const resizerResizeHeight = document.getElementById('resizer-resize-height');
    const resizerMaintainRatio = document.getElementById('resizer-maintain-ratio');
    const resizerResizePercent = document.getElementById('resizer-resize-percent');
    const resizerPercentValue = document.getElementById('resizer-percent-value');
    const resizerAspectPreset = document.getElementById('resizer-aspect-preset');
    const resizerAspectWidth = document.getElementById('resizer-aspect-width');
    const resizerOutputFormat = document.getElementById('resizer-output-format');
    const resizerOutputQuality = document.getElementById('resizer-output-quality');
    const resizerQualityValue = document.getElementById('resizer-quality-value');
    const resizerPreviewSection = document.getElementById('resizer-preview-section');
    const resizerPreviewOriginal = document.getElementById('resizer-preview-original');
    const resizerPreviewCanvas = document.getElementById('resizer-preview-canvas');
    const resizerOriginalDimensions = document.getElementById('resizer-original-dimensions');
    const resizerOriginalSize = document.getElementById('resizer-original-size');
    const resizerResizedDimensions = document.getElementById('resizer-resized-dimensions');
    const resizerResizedSize = document.getElementById('resizer-resized-size');
    const resizerResultsSection = document.getElementById('resizer-results-section');
    const resizerResultImage = document.getElementById('resizer-result-image');
    const resizerResultDimensions = document.getElementById('resizer-result-dimensions');
    const resizerResultSize = document.getElementById('resizer-result-size');
    const resizerDownloadBtn = document.getElementById('resizer-download-btn');
    
    // Resizer State
    let resizerCurrentImage = null;
    let resizerOriginalWidth = 0;
    let resizerOriginalHeight = 0;
    let resizerOriginalFile = null;
    
    // Resizer Event Listeners
    if (resizerImageInput) resizerImageInput.addEventListener('change', resizerHandleFileSelect);
    if (resizerDropZone) {
        resizerDropZone.addEventListener('dragover', resizerHandleDragOver);
        resizerDropZone.addEventListener('dragleave', resizerHandleDragLeave);
        resizerDropZone.addEventListener('drop', resizerHandleDrop);
    }
    if (resizerResizeMode) resizerResizeMode.addEventListener('change', resizerHandleResizeModeChange);
    if (resizerResizePercent) resizerResizePercent.addEventListener('input', function() {
        if (resizerPercentValue) resizerPercentValue.textContent = this.value + '%';
    });
    if (resizerOutputQuality) resizerOutputQuality.addEventListener('input', function() {
        if (resizerQualityValue) resizerQualityValue.textContent = this.value + '%';
    });
    if (resizerMaintainRatio) resizerMaintainRatio.addEventListener('change', function() {
        if (this.checked && resizerOriginalWidth > 0) {
            const ratio = resizerOriginalHeight / resizerOriginalWidth;
            const newHeight = Math.round(resizerResizeWidth.value * ratio);
            if (resizerResizeHeight) resizerResizeHeight.value = newHeight;
        }
    });
    if (resizerResizeWidth) resizerResizeWidth.addEventListener('input', function() {
        if (resizerMaintainRatio && resizerMaintainRatio.checked && resizerOriginalWidth > 0) {
            const ratio = resizerOriginalHeight / resizerOriginalWidth;
            const newHeight = Math.round(this.value * ratio);
            if (resizerResizeHeight) resizerResizeHeight.value = newHeight;
        }
    });
    if (resizerAspectPreset) resizerAspectPreset.addEventListener('change', resizerHandleAspectPresetChange);
    if (resizerResizeBtn) resizerResizeBtn.addEventListener('click', resizerPerformResize);
    if (resizerResetBtn) resizerResetBtn.addEventListener('click', resizerResetTool);
    
    function resizerHandleFileSelect(e) {
        const files = Array.from(e.target.files);
        const imageFiles = files.filter(f => f.type.startsWith('image/'));
        
        if (imageFiles.length === 0) {
            showNotification('Please select an image file', 'error');
            return;
        }
        
        resizerLoadImage(imageFiles[0]);
    }
    
    function resizerHandleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        resizerDropZone.classList.add('dragover');
    }
    
    function resizerHandleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        resizerDropZone.classList.remove('dragover');
    }
    
    function resizerHandleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        resizerDropZone.classList.remove('dragover');
        
        const files = Array.from(e.dataTransfer.files);
        const imageFiles = files.filter(f => f.type.startsWith('image/'));
        
        if (imageFiles.length === 0) {
            showNotification('Please drop image files', 'error');
            return;
        }
        
        resizerLoadImage(imageFiles[0]);
    }
    
    function resizerLoadImage(file) {
        resizerOriginalFile = file;
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const img = new Image();
            
            img.onload = function() {
                resizerCurrentImage = img;
                resizerOriginalWidth = img.width;
                resizerOriginalHeight = img.height;
                
                if (resizerFileName) resizerFileName.textContent = `📄 ${file.name}`;
                if (resizerFileDimensions) resizerFileDimensions.textContent = `Original: ${resizerOriginalWidth} × ${resizerOriginalHeight} px`;
                if (resizerFileInfo) resizerFileInfo.style.display = 'block';
                
                if (resizerSettingsSection) resizerSettingsSection.style.display = 'block';
                if (resizerPreviewSection) resizerPreviewSection.style.display = 'none';
                if (resizerResultsSection) resizerResultsSection.style.display = 'none';
                
                if (resizerResizeWidth) resizerResizeWidth.value = Math.round(resizerOriginalWidth * 0.8);
                if (resizerResizeHeight) resizerResizeHeight.value = Math.round(resizerOriginalHeight * 0.8);
                if (resizerAspectWidth) resizerAspectWidth.value = Math.round(resizerOriginalWidth * 0.8);
                
                if (resizerPreviewOriginal) resizerPreviewOriginal.src = e.target.result;
                if (resizerOriginalDimensions) resizerOriginalDimensions.textContent = `${resizerOriginalWidth} × ${resizerOriginalHeight} px`;
                if (resizerOriginalSize) resizerOriginalSize.textContent = `${(file.size / 1024 / 1024).toFixed(2)} MB`;
                if (resizerPreviewSection) resizerPreviewSection.style.display = 'block';
                
                showNotification('Image loaded successfully', 'success');
            };
            
            img.onerror = function() {
                showNotification('Failed to load image', 'error');
            };
            
            img.src = e.target.result;
        };
        
        reader.readAsDataURL(file);
    }
    
    function resizerHandleResizeModeChange() {
        if (!resizerResizeMode) return;
        const mode = resizerResizeMode.value;
        
        if (resizerDimensionsMode) resizerDimensionsMode.style.display = mode === 'dimensions' ? 'grid' : 'none';
        if (resizerPercentageMode) resizerPercentageMode.style.display = mode === 'percentage' ? 'grid' : 'none';
        if (resizerAspectMode) resizerAspectMode.style.display = mode === 'aspect-ratio' ? 'grid' : 'none';
    }
    
    function resizerHandleAspectPresetChange() {
        // Aspect ratio will be calculated in resize
    }
    
    function resizerCalculateResizeDimensions() {
        const mode = resizerResizeMode.value;
        let newWidth, newHeight;
        
        if (mode === 'dimensions') {
            newWidth = parseInt(resizerResizeWidth.value) || resizerOriginalWidth;
            newHeight = parseInt(resizerResizeHeight.value) || resizerOriginalHeight;
        } else if (mode === 'percentage') {
            const percent = parseInt(resizerResizePercent.value) / 100;
            newWidth = Math.round(resizerOriginalWidth * percent);
            newHeight = Math.round(resizerOriginalHeight * percent);
        } else if (mode === 'aspect-ratio') {
            newWidth = parseInt(resizerAspectWidth.value) || resizerOriginalWidth;
            const preset = resizerAspectPreset.value;
            let ratio;
            
            if (preset === '1:1') ratio = 1;
            else if (preset === '4:3') ratio = 4/3;
            else if (preset === '16:9') ratio = 16/9;
            else if (preset === '3:2') ratio = 3/2;
            else if (preset === '9:16') ratio = 9/16;
            else ratio = resizerOriginalHeight / resizerOriginalWidth;
            
            newHeight = Math.round(newWidth / ratio);
        }
        
        return { width: newWidth, height: newHeight };
    }
    
    function resizerPerformResize() {
        if (!resizerCurrentImage) {
            showNotification('Please load an image first', 'error');
            return;
        }
        
        const dimensions = resizerCalculateResizeDimensions();
        if (!dimensions || !dimensions.width || !dimensions.height) {
            showNotification('Please enter valid dimensions', 'error');
            return;
        }
        
        // Create canvas with high-quality rendering settings
        const canvas = document.createElement('canvas');
        canvas.width = dimensions.width;
        canvas.height = dimensions.height;
        
        const ctx = canvas.getContext('2d', { alpha: true });
        
        // Enable high-quality image smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // Use better rendering algorithm (bilinear filtering)
        ctx.filter = 'blur(0px)';
        
        // Draw image with proper rendering
        ctx.drawImage(resizerCurrentImage, 0, 0, dimensions.width, dimensions.height);
        
        // Create preview with same quality settings
        if (resizerPreviewCanvas) {
            resizerPreviewCanvas.width = dimensions.width;
            resizerPreviewCanvas.height = dimensions.height;
            const previewCtx = resizerPreviewCanvas.getContext('2d', { alpha: true });
            
            previewCtx.imageSmoothingEnabled = true;
            previewCtx.imageSmoothingQuality = 'high';
            previewCtx.filter = 'blur(0px)';
            
            previewCtx.drawImage(resizerCurrentImage, 0, 0, dimensions.width, dimensions.height);
        }
        
        if (resizerResizedDimensions) {
            resizerResizedDimensions.textContent = `${dimensions.width} × ${dimensions.height} px`;
        }
        
        const quality = resizerOutputQuality ? (parseInt(resizerOutputQuality.value) / 100) : 0.95;
        const format = resizerOutputFormat ? resizerOutputFormat.value : 'png';
        
        // Use highest quality for JPEG and PNG
        let blobQuality = quality;
        if (format === 'png') {
            // PNG doesn't use quality parameter, but we ensure lossless encoding
            blobQuality = undefined;
        } else if (format === 'webp') {
            // Ensure high quality for WebP
            blobQuality = Math.max(quality, 0.90);
        } else {
            // JPEG: ensure minimum 90% quality
            blobQuality = Math.max(quality, 0.90);
        }
        
        canvas.toBlob(function(blob) {
            const savedSizeKB = (blob.size / 1024).toFixed(2);
            if (resizerResizedSize) resizerResizedSize.textContent = `${savedSizeKB} KB`;

            // Create a converter-style result and add it to the Conversion Results list
            const url = URL.createObjectURL(blob);
            const originalSize = resizerOriginalFile ? resizerOriginalFile.size : 0;
            const convertedSize = blob.size;
            const sizeChange = originalSize > 0 ? ((convertedSize - originalSize) / originalSize * 100).toFixed(1) : 0;
            const extension = format === 'jpg' ? 'jpg' : format;

            const result = {
                url: url,
                originalName: resizerOriginalFile ? resizerOriginalFile.name : 'resized-image',
                extension: extension,
                convertedSize: convertedSize,
                originalSize: originalSize,
                width: dimensions.width,
                height: dimensions.height,
                sizeChange: sizeChange
            };

            // Push to converterResults and re-render results area
            converterResults.push(result);
            if (typeof converterDisplayResults === 'function') {
                converterDisplayResults();
            }
            if (converterResultsArea) {
                converterResultsArea.style.display = 'block';
                converterResultsArea.scrollIntoView({ behavior: 'smooth' });
            }

            showNotification('Image resized and added to Conversion Results', 'success');
        }, `image/${format}`, blobQuality);
    }
    
    function resizerResetTool() {
        if (resizerImageInput) resizerImageInput.value = '';
        resizerCurrentImage = null;
        resizerOriginalWidth = 0;
        resizerOriginalHeight = 0;
        resizerOriginalFile = null;
        
        if (resizerFileInfo) resizerFileInfo.style.display = 'none';
        if (resizerSettingsSection) resizerSettingsSection.style.display = 'none';
        if (resizerPreviewSection) resizerPreviewSection.style.display = 'none';
        if (resizerResultsSection) resizerResultsSection.style.display = 'none';
        
        if (resizerResizeMode) {
            resizerResizeMode.value = 'dimensions';
            resizerHandleResizeModeChange();
        }
        
        showNotification('Tool reset', 'success');
    }
    
    // ==========================================
    // SHARED HELPER FUNCTIONS
    // ==========================================
    
    function showNotification(message, type = 'info') {
        if (typeof window.showNotification === 'function') {
            window.showNotification(message, type);
        } else {
            const notification = document.createElement('div');
            notification.className = `notification ${type === 'error' ? 'error' : ''}`;
            notification.textContent = message;
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.style.opacity = '0';
                notification.style.transition = 'opacity 0.3s ease';
                setTimeout(() => {
                    notification.parentNode?.removeChild(notification);
                }, 300);
            }, 3000);
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
