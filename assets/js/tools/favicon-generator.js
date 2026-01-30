/* ============================================
   GO TOOLLY - FAVICON GENERATOR
   Professional-Quality Favicons
   ============================================ */

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    const previewCanvas = document.getElementById('preview-canvas');
    const previewContainer = document.getElementById('preview-container');
    const downloadBtn = document.getElementById('download-btn');
    
    // Text mode
    const textInput = document.getElementById('text-input');
    const textMaxChars = document.getElementById('text-max-chars');
    const textBgColor = document.getElementById('text-bg-color');
    const textColorMode = document.getElementById('text-color-mode');
    const textColorPicker = document.getElementById('text-color-picker');
    const textColorPickerGroup = document.getElementById('text-color-picker-group');
    const textShape = document.getElementById('text-shape');
    const textFontSize = document.getElementById('text-font-size');
    const textBold = document.getElementById('text-bold');
    const charCount = document.getElementById('char-count');
    
    // Emoji mode
    const emojiInput = document.getElementById('emoji-input');
    const emojiBgMode = document.getElementById('emoji-bg-mode');
    const emojiBgColor = document.getElementById('emoji-bg-color');
    const emojiBgColorGroup = document.getElementById('emoji-bg-color-group');
    
    // Image mode
    const imageInput = document.getElementById('image-input');
    const imageFit = document.getElementById('image-fit');
    const imageBgColor = document.getElementById('image-bg-color');
    
    let currentMode = 'text';
    let uploadedImage = null;
    
    initEventListeners();
    updateCharCount();
    generatePreview();
    
    function initEventListeners() {
        // Tabs
        tabButtons.forEach(button => {
            button.addEventListener('click', switchTab);
        });
        
        // Text mode
        textInput.addEventListener('input', function() {
            updateCharCount();
            generatePreview();
        });
        textMaxChars.addEventListener('change', function() {
            const maxLen = parseInt(this.value);
            textInput.maxLength = maxLen;
            // Trim input if it exceeds new max
            if (textInput.value.length > maxLen) {
                textInput.value = textInput.value.substring(0, maxLen);
            }
            updateCharCount();
            generatePreview();
        });
        textBgColor.addEventListener('change', generatePreview);
        if (textColorMode) {
            textColorMode.addEventListener('change', function() {
                if (textColorPickerGroup) {
                    textColorPickerGroup.style.display = this.value === 'custom' ? 'block' : 'none';
                }
                generatePreview();
            });
        }
        if (textColorPicker) {
            textColorPicker.addEventListener('input', generatePreview);
            textColorPicker.addEventListener('change', generatePreview);
        }
        textShape.addEventListener('change', generatePreview);
        textFontSize.addEventListener('change', generatePreview);
        textBold.addEventListener('change', generatePreview);
        
        // Emoji mode
        emojiInput.addEventListener('input', generatePreview);
        emojiInput.addEventListener('paste', function(e) {
            // Allow paste event to complete naturally
            setTimeout(generatePreview, 0);
        });
        emojiBgMode.addEventListener('change', function() {
            emojiBgColorGroup.style.display = this.value === 'colored' ? 'block' : 'none';
            generatePreview();
        });
        emojiBgColor.addEventListener('change', generatePreview);
        
        // Image mode
        imageInput.addEventListener('change', handleImageUpload);
        imageFit.addEventListener('change', generatePreview);
        imageBgColor.addEventListener('change', generatePreview);
        
        // Download
        downloadBtn.addEventListener('click', downloadFaviconBundle);
    }
    
    function switchTab(e) {
        const tabName = e.target.getAttribute('data-tab');
        currentMode = tabName;

        // Update buttons
        tabButtons.forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');

        // Update content
        tabContents.forEach(content => content.classList.remove('active'));
        const newContent = document.getElementById(tabName);
        newContent.classList.add('active');

        // Smooth the preview update to avoid jank/flicker
        if (previewContainer) {
            previewContainer.style.opacity = '0';
        }

        // Auto-focus the appropriate input field (let browser settle first)
        setTimeout(() => {
            if (tabName === 'text') {
                textInput.focus();
            } else if (tabName === 'emoji') {
                emojiInput.focus();
            } else if (tabName === 'image') {
                imageInput.focus();
            }

            // Defer expensive drawing a tick so the UI can update, then fade in
            requestAnimationFrame(() => {
                setTimeout(() => {
                    generatePreview();
                    if (previewContainer) previewContainer.style.opacity = '1';
                }, 40);
            });
        }, 0);
    }
    
    function handleImageUpload(e) {
        const file = e.target.files[0];
        if (!file) {
            uploadedImage = null;
            return;
        }
        
        if (!file.type.startsWith('image/')) {
            showNotification('Please upload an image file', 'error');
            imageInput.value = '';
            uploadedImage = null;
            return;
        }
        
        if (file.size > 10 * 1024 * 1024) {
            showNotification('Image too large (max 10 MB)', 'error');
            imageInput.value = '';
            uploadedImage = null;
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            uploadedImage = new Image();
            uploadedImage.onload = function() {
                generatePreview();
            };
            uploadedImage.onerror = function() {
                showNotification('Failed to load image', 'error');
                uploadedImage = null;
                imageInput.value = '';
            };
            uploadedImage.src = e.target.result;
        };
        reader.onerror = function() {
            showNotification('Failed to read file', 'error');
            imageInput.value = '';
            uploadedImage = null;
        };
        reader.readAsDataURL(file);
    }
    
    function generatePreview() {
        const ctx = previewCanvas.getContext('2d');
        ctx.clearRect(0, 0, 256, 256);
        
        if (currentMode === 'text') {
            generateTextFavicon(ctx);
        } else if (currentMode === 'emoji') {
            generateEmojiFavicon(ctx);
        } else if (currentMode === 'image') {
            generateImageFavicon(ctx);
        }
        
        previewContainer.style.display = 'block';
    }
    
    function generateTextFavicon(ctx) {
        const text = (textInput.value || 'A').toUpperCase();
        const bgColor = textBgColor.value;
        const isBold = textBold.checked;
        const shape = textShape.value;
        const fontSizeMode = textFontSize ? textFontSize.value : 'auto';
        
        // Determine text color
        let textColor;
        if (textColorMode && textColorMode.value === 'custom' && textColorPicker) {
            textColor = textColorPicker.value;
        } else {
            textColor = getContrastColor(bgColor);
        }
        
        // Draw background based on shape
        ctx.fillStyle = bgColor;
        if (shape === 'rounded') {
            roundRect(ctx, 0, 0, 256, 256, 30);
            ctx.fill();
        } else if (shape === 'circle') {
            ctx.beginPath();
            ctx.arc(128, 128, 128, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.fillRect(0, 0, 256, 256);
        }
        
        // Calculate font size based on text length and mode
        let fontSize;
        if (fontSizeMode === 'auto') {
            // Dynamic sizing based on text length
            const charCount = text.length;
            if (charCount === 1) {
                fontSize = 160;
            } else if (charCount === 2) {
                fontSize = 120;
            } else if (charCount === 3) {
                fontSize = 90;
            } else if (charCount === 4) {
                fontSize = 70;
            } else if (charCount === 5) {
                fontSize = 58;
            } else {
                fontSize = 48;
            }
        } else if (fontSizeMode === 'small') {
            fontSize = 50;
        } else if (fontSizeMode === 'medium') {
            fontSize = 80;
        } else if (fontSizeMode === 'large') {
            fontSize = 120;
        } else {
            fontSize = 100;
        }
        
        // Draw text
        ctx.fillStyle = textColor;
        ctx.font = `${isBold ? 'bold' : 'normal'} ${fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, 128, 128);
    }
    
    function updateCharCount() {
        const current = textInput.value.length;
        const max = parseInt(textMaxChars.value);
        charCount.textContent = `(${current}/${max})`;
    }
    
    function generateEmojiFavicon(ctx) {
        let emoji = emojiInput.value.trim();
        
        // If no emoji provided, use default
        if (!emoji) {
            emoji = '👍';
        }
        
        // Extract first character/grapheme (handles emoji with variations)
        const graphemes = [...emoji];
        emoji = graphemes[0] || '👍';
        
        const bgMode = emojiBgMode.value;
        
        if (bgMode === 'colored') {
            const bgColor = emojiBgColor.value;
            ctx.fillStyle = bgColor;
            ctx.fillRect(0, 0, 256, 256);
        }
        
        // Draw emoji - use system emoji font for better compatibility
        ctx.font = 'bold 200px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        try {
            ctx.fillText(emoji, 128, 128);
        } catch (e) {
            // Fallback if emoji fails to render
            ctx.font = '180px Arial';
            ctx.fillText(emoji, 128, 140);
        }
    }
    
    function generateImageFavicon(ctx) {
        if (!uploadedImage) {
            ctx.fillStyle = imageBgColor.value;
            ctx.fillRect(0, 0, 256, 256);
            ctx.fillStyle = '#ccc';
            ctx.font = '14px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Upload an image', 128, 128);
            return;
        }
        
        const fit = imageFit.value;
        const bgColor = imageBgColor.value;
        
        // Draw background
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, 256, 256);
        
        if (fit === 'cover') {
            // Cover mode: crop center
            drawImageCover(ctx, uploadedImage, 0, 0, 256, 256);
        } else {
            // Contain mode: scale with padding
            drawImageContain(ctx, uploadedImage, 0, 0, 256, 256);
        }
    }
    
    function drawImageCover(ctx, img, x, y, w, h) {
        const ratio = Math.max(w / img.width, h / img.height);
        const width = img.width * ratio;
        const height = img.height * ratio;
        const offsetX = (w - width) / 2;
        const offsetY = (h - height) / 2;
        ctx.drawImage(img, x + offsetX, y + offsetY, width, height);
    }
    
    function drawImageContain(ctx, img, x, y, w, h) {
        const ratio = Math.min(w / img.width, h / img.height);
        const width = img.width * ratio;
        const height = img.height * ratio;
        const offsetX = (w - width) / 2;
        const offsetY = (h - height) / 2;
        ctx.drawImage(img, x + offsetX, y + offsetY, width, height);
    }
    
    function getContrastColor(hexColor) {
        const r = parseInt(hexColor.substr(1, 2), 16);
        const g = parseInt(hexColor.substr(3, 2), 16);
        const b = parseInt(hexColor.substr(5, 2), 16);
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        return brightness > 155 ? '#000000' : '#ffffff';
    }
    
    function roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }
    
    async function downloadFaviconBundle() {
        downloadBtn.disabled = true;
        downloadBtn.textContent = '⏳ Generating...';
        
        try {
            const JSZip = window.JSZip;
            if (!JSZip) {
                showNotification('ZIP library not loaded. Trying single download...', 'info');
                downloadSingleIco();
                return;
            }
            
            const zip = new JSZip();
            
            // Generate all sizes
            const sizes = [16, 32, 256];
            for (const size of sizes) {
                const canvas = document.createElement('canvas');
                canvas.width = size;
                canvas.height = size;
                const ctx = canvas.getContext('2d');
                
                // Scale preview to this size
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = 256;
                tempCanvas.height = 256;
                const tempCtx = tempCanvas.getContext('2d');
                
                // Redraw at 256
                if (currentMode === 'text') {
                    generateTextFavicon(tempCtx);
                } else if (currentMode === 'emoji') {
                    generateEmojiFavicon(tempCtx);
                } else if (currentMode === 'image') {
                    generateImageFavicon(tempCtx);
                }
                
                // Resize to target
                ctx.drawImage(tempCanvas, 0, 0, 256, 256, 0, 0, size, size);
                
                // Add to ZIP
                const blob = await canvasToBlob(canvas, 'image/png');
                if (size === 256) {
                    zip.file('apple-touch-icon.png', blob);
                    zip.file('favicon-256.png', blob);
                } else {
                    zip.file(`favicon-${size}x${size}.png`, blob);
                }
            }
            
            // Generate ICO
            const icoCanvas = document.createElement('canvas');
            icoCanvas.width = 256;
            icoCanvas.height = 256;
            const icoCtx = icoCanvas.getContext('2d');
            
            if (currentMode === 'text') {
                generateTextFavicon(icoCtx);
            } else if (currentMode === 'emoji') {
                generateEmojiFavicon(icoCtx);
            } else if (currentMode === 'image') {
                generateImageFavicon(icoCtx);
            }
            
            const icoBlob = await canvasToBlob(icoCanvas, 'image/png');
            zip.file('favicon.ico', icoBlob);
            
            // Add webmanifest
            const manifest = {
                "name": "Website",
                "short_name": "Site",
                "icons": [
                    { "src": "/favicon-16x16.png", "sizes": "16x16", "type": "image/png" },
                    { "src": "/favicon-32x32.png", "sizes": "32x32", "type": "image/png" },
                    { "src": "/favicon-256.png", "sizes": "256x256", "type": "image/png" },
                    { "src": "/apple-touch-icon.png", "sizes": "180x180", "type": "image/png" }
                ],
                "theme_color": textBgColor.value || "#2563eb",
                "background_color": "#ffffff",
                "display": "standalone"
            };
            zip.file('site.webmanifest', JSON.stringify(manifest, null, 2));
            
            // Add README
            const readme = `# Favicon Installation Guide\n\n## Files Included\n- favicon.ico - Traditional favicon format\n- favicon-16x16.png - Browser tab icon\n- favicon-32x32.png - Browser address bar\n- favicon-256.png - High resolution\n- apple-touch-icon.png - iOS home screen\n- site.webmanifest - Web app manifest\n\n## Installation\n\nAdd this to your <head> section:\n\n<link rel="icon" type="image/x-icon" href="/favicon.ico">\n<link rel="apple-touch-icon" href="/apple-touch-icon.png">\n<link rel="manifest" href="/site.webmanifest">`;
            zip.file('README.txt', readme);
            
            // Download ZIP
            const blob = await zip.generateAsync({type: 'blob'});
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'favicon-bundle.zip';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            showNotification('✓ Favicon bundle downloaded!', 'success');
        } catch (error) {
            console.error('Error creating bundle:', error);
            showNotification('Download started. If bundle fails, downloading ICO instead...', 'info');
            downloadSingleIco();
        } finally {
            downloadBtn.disabled = false;
            downloadBtn.textContent = '↓ Download Favicon Bundle';
        }
    }
    
    function downloadSingleIco() {
        previewCanvas.toBlob(blob => {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'favicon.ico';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        });
    }
    
    function canvasToBlob(canvas, type) {
        return new Promise((resolve) => {
            canvas.toBlob(blob => {
                resolve(blob);
            }, type);
        });
    }
    
    function showNotification(message, type = 'info') {
        if (typeof window.showNotification === 'function') {
            window.showNotification(message, type);
        } else {
            alert(message);
        }
    }
});
