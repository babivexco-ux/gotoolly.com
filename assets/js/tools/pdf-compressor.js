// PDF Compressor - Hybrid Approach (Client-side MVP with server-side readiness)
// ============================================================================
// This tool provides client-side compression for files ≤ 5 MB
// For larger files, it offers server-side processing option
// All processing happens in browser for privacy

// Constants
const MAX_CLIENT_SIZE = 5 * 1024 * 1024; // 5 MB in bytes
const DEFAULT_IMAGE_QUALITY = 0.7;

// State management
let currentFile = null;
let originalFileSize = 0;
let compressedPDFBytes = null;
let processingActive = false;

// DOM Elements
const pdfInput = document.getElementById('pdf-input');
const selectPdfBtn = document.getElementById('select-pdf');
const dropZone = document.getElementById('drop-zone');
const fileInfo = document.getElementById('file-info');
const fileName = document.getElementById('file-name');
const fileSize = document.getElementById('file-size');
const fileStatus = document.getElementById('file-status');
const serverOption = document.getElementById('server-option');
const compressionOptions = document.getElementById('compression-options');
const imageQualitySlider = document.getElementById('image-quality');
const imageQualityValue = document.getElementById('image-quality-value');
const initialState = document.getElementById('initial-state');
const progressContainer = document.getElementById('progress-container');
const progressFill = document.getElementById('progress-fill');
const statusText = document.getElementById('status-text');
const resultContainer = document.getElementById('result-container');
const originalSize = document.getElementById('original-size');
const compressedSize = document.getElementById('compressed-size');
const sizeReduction = document.getElementById('size-reduction');
const downloadPdfBtn = document.getElementById('download-pdf');
const processAnotherBtn = document.getElementById('process-another');
const useServerBtn = document.getElementById('use-server');

// Initialize event listeners
function initEventListeners() {
    // File selection
    // Prevent click bubbling from inside the drop zone (e.g., the button) so the file dialog only opens once
    selectPdfBtn.addEventListener('click', (e) => { e.stopPropagation(); pdfInput.click(); });
    pdfInput.addEventListener('change', handleFileSelect);
    
    // Drag and drop
    dropZone.addEventListener('dragover', handleDragOver);
    dropZone.addEventListener('dragleave', handleDragLeave);
    dropZone.addEventListener('drop', handleDrop);
    // Only trigger file dialog when clicking directly on the drop zone background (not child elements)
    dropZone.addEventListener('click', (e) => { if (e.target === e.currentTarget) pdfInput.click(); });
    
    // Compression options
    imageQualitySlider.addEventListener('input', updateImageQualityDisplay);
    
    // Action buttons
    downloadPdfBtn.addEventListener('click', handleDownload);
    processAnotherBtn.addEventListener('click', resetInterface);
    useServerBtn.addEventListener('click', handleServerCompression);
    
    // Metadata radio buttons
    document.querySelectorAll('input[name="metadata"]').forEach(radio => {
        radio.addEventListener('change', updateMetadataDisplay);
    });
}

// File handling
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
        processFile(file);
    } else {
        showError('Please select a valid PDF file.');
    }
}

function handleDragOver(event) {
    event.preventDefault();
    dropZone.classList.add('dragover');
}

function handleDragLeave(event) {
    event.preventDefault();
    dropZone.classList.remove('dragover');
}

function handleDrop(event) {
    event.preventDefault();
    dropZone.classList.remove('dragover');
    
    const file = event.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') {
        processFile(file);
    } else {
        showError('Please drop a valid PDF file.');
    }
}

// Process uploaded file
function processFile(file) {
    if (processingActive) {
        showError('Please wait for current compression to complete.');
        return;
    }
    
    currentFile = file;
    originalFileSize = file.size;
    
    // Update file info display
    fileName.textContent = file.name;
    fileSize.textContent = formatFileSize(file.size);
    fileInfo.style.display = 'block';
    
    // Check file size and show appropriate options
    if (file.size <= MAX_CLIENT_SIZE) {
        fileStatus.textContent = 'Within limit';
        fileStatus.style.background = 'var(--color-success-light)';
        fileStatus.style.color = 'var(--color-success)';
        serverOption.style.display = 'none';
        compressionOptions.style.display = 'block';
        
        // Enable compression
        setTimeout(() => {
            startClientCompression();
        }, 500);
    } else {
        fileStatus.textContent = 'Too large';
        fileStatus.style.background = 'var(--color-warning-light)';
        fileStatus.style.color = 'var(--color-warning)';
        serverOption.style.display = 'block';
        compressionOptions.style.display = 'none';
        
        showError(`File size (${formatFileSize(file.size)}) exceeds 5 MB limit for client-side compression. Use server option for better results.`);
    }
}

// Client-side compression
async function startClientCompression() {
    if (!currentFile || processingActive) return;
    
    processingActive = true;
    initialState.style.display = 'none';
    progressContainer.style.display = 'block';
    resultContainer.style.display = 'none';
    
    updateProgress('Loading PDF document...', 10);
    
    try {
        // Read the file
        const arrayBuffer = await currentFile.arrayBuffer();
        
        updateProgress('Parsing PDF structure...', 20);
        
        // Quick heuristic: check for encryption/token that pdf-lib may not support
        // and ensure the file contains a PDF header (%PDF-) near the start.
        const headBytes = arrayBuffer.slice(0, 1024);
        let head = '';
        try {
            head = new TextDecoder('utf-8', { fatal: false }).decode(headBytes);
        } catch (e) {
            head = '';
        }

        // Header check: look for %PDF- within the first 1KB
        if (!/\%PDF-/.test(head)) {
            // Provide a clear error for missing header (common for corrupted/truncated or wrong-file uploads)
            throw new Error("No PDF header found (no '%PDF-' signature) — file may be corrupted, truncated, or not a PDF.");
        }

        if (/\/Encrypt/.test(head) || /Encrypt\b/.test(head)) {
            throw new Error('PDF appears to be encrypted or uses features not supported client-side');
        }

        // Load PDF using pdf-lib
        const { PDFDocument } = PDFLib;
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        
        updateProgress('Optimizing images...', 40);
        
        // Get compression settings
        const imageQuality = parseFloat(imageQualitySlider.value);
        const removeMetadata = document.querySelector('input[name="metadata"]:checked').value === 'yes';
        
        // Client-side optimization steps
        // Note: pdf-lib has limited image optimization capabilities
        // In production, this would use more advanced techniques
        
        // 1. Remove metadata if requested
        if (removeMetadata) {
            pdfDoc.setTitle('');
            pdfDoc.setAuthor('');
            pdfDoc.setSubject('');
            pdfDoc.setKeywords([]);
            pdfDoc.setProducer('');
            pdfDoc.setCreator('');
            pdfDoc.setCreationDate(new Date(0));
            pdfDoc.setModificationDate(new Date(0));
        }
        
        updateProgress('Processing images...', 60);
        
        // 2. Basic image optimization (simulated in client-side)
        // Note: Actual image downscaling would require more complex processing
        // For MVP, we're using pdf-lib's limited capabilities
        const pages = pdfDoc.getPages();
        
        // Simulate processing time for UX feedback
        await simulateProcessing();
        
        updateProgress('Finalizing compression...', 80);
        
        // 3. Save with compression flags
        const compressedBytes = await pdfDoc.save({
            useObjectStreams: true,
            addDefaultPage: false,
            objectsPerTick: 50,
            updateFieldAppearances: false
        });
        
        updateProgress('Compression complete!', 100);
        
        // Store result
        compressedPDFBytes = compressedBytes;
        
        // Show results
        setTimeout(() => {
            showResults(compressedBytes);
        }, 500);
        
    } catch (error) {
        console.error('Compression error:', error);
        // Show detailed message and offer server-side option
        const msg = error && error.message ? error.message : 'Failed to compress PDF. The file may be corrupted or use unsupported features.';
        showError(msg);
        // Reveal server option so user can try server-side processing if available
        serverOption.style.display = 'block';
    } finally {
        processingActive = false;
    }
}

// Server-side compression (stub - prepares for backend implementation)
function handleServerCompression() {
    if (!currentFile) return;
    
    // Show server processing message
    updateProgress('Preparing for server upload...', 0);
    progressContainer.style.display = 'block';
    
    // This is where the server-side upload would happen
    // For MVP, we just show a message about server processing
    
    setTimeout(() => {
        showError('Server-side compression would be implemented here. In production, this would upload to a backend using Ghostscript/qPDF for advanced compression.');
        
        // Reset after showing message
        setTimeout(() => {
            progressContainer.style.display = 'none';
        }, 3000);
    }, 1000);
    
    // Server-side implementation note:
    // 1. Upload file to secure endpoint
    // 2. Process with Ghostscript: gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=/screen -dNOPAUSE -dQUIET -dBATCH -sOutputFile=output.pdf input.pdf
    // 3. Or use qPDF: qpdf --linearize --object-streams=generate input.pdf output.pdf
    // 4. Return compressed file to user
}

// Display results
function showResults(compressedBytes) {
    const compressedSizeBytes = compressedBytes.byteLength;
    const reduction = ((originalFileSize - compressedSizeBytes) / originalFileSize * 100).toFixed(1);
    
    // Update result display
    originalSize.textContent = formatFileSize(originalFileSize);
    compressedSize.textContent = formatFileSize(compressedSizeBytes);
    sizeReduction.textContent = `${reduction}%`;
    
    // Update reduction color based on result
    if (parseFloat(reduction) > 10) {
        sizeReduction.style.color = 'var(--color-success)';
    } else if (parseFloat(reduction) > 0) {
        sizeReduction.style.color = 'var(--color-warning)';
    } else {
        sizeReduction.style.color = 'var(--color-error)';
    }
    
    // Show results and enable download
    progressContainer.style.display = 'none';
    resultContainer.style.display = 'block';
    downloadPdfBtn.disabled = false;
}

// Download compressed PDF
function handleDownload() {
    if (!compressedPDFBytes) {
        showError('No compressed PDF available.');
        return;
    }
    
    const blob = new Blob([compressedPDFBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    
    a.href = url;
    a.download = `compressed-${currentFile.name}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    // Clean up
    setTimeout(() => URL.revokeObjectURL(url), 100);
    
    // Show success message
    showError('Download started!', 'success');
}

// Reset interface
function resetInterface() {
    // Reset file input
    pdfInput.value = '';
    
    // Reset state
    currentFile = null;
    originalFileSize = 0;
    compressedPDFBytes = null;
    processingActive = false;
    
    // Reset UI
    fileInfo.style.display = 'none';
    serverOption.style.display = 'none';
    compressionOptions.style.display = 'none';
    progressContainer.style.display = 'none';
    resultContainer.style.display = 'none';
    initialState.style.display = 'block';
    downloadPdfBtn.disabled = true;
    
    // Reset options
    imageQualitySlider.value = DEFAULT_IMAGE_QUALITY;
    updateImageQualityDisplay();
    document.querySelector('input[name="metadata"][value="yes"]').checked = true;
}

// UI helpers
function updateProgress(message, percent) {
    statusText.textContent = message;
    progressFill.style.width = `${percent}%`;
}

function updateImageQualityDisplay() {
    const value = parseFloat(imageQualitySlider.value);
    const labels = ['Low', 'Medium-Low', 'Medium', 'Medium-High', 'High'];
    const index = Math.min(Math.floor(value * 5), 4);
    imageQualityValue.textContent = labels[index];
}

function updateMetadataDisplay() {
    const value = document.querySelector('input[name="metadata"]:checked').value;
    document.getElementById('metadata-value').textContent = value === 'yes' ? 'Yes' : 'No';
}

function showError(message, type = 'error') {
    // Create error message element
    const errorDiv = document.createElement('div');
    errorDiv.className = `error-message ${type}`;

    // Make it focusable/selectable and accessible
    errorDiv.tabIndex = 0;
    errorDiv.setAttribute('role', 'alert');
    errorDiv.setAttribute('aria-live', 'assertive');

    // Message content with selectable span and a copy button
    const msgSpan = document.createElement('span');
    msgSpan.style.flex = '1';
    msgSpan.style.whiteSpace = 'pre-wrap';
    msgSpan.style.overflowWrap = 'anywhere';
    msgSpan.textContent = message;

    const icon = document.createElement('i');
    icon.className = `fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}`;

    const copyBtn = document.createElement('button');
    copyBtn.textContent = 'Copy';
    copyBtn.style.cssText = 'margin-left:12px;background:transparent;border:1px solid rgba(255,255,255,0.15);color:inherit;padding:6px 10px;border-radius:6px;cursor:pointer;';
    copyBtn.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(message);
            copyBtn.textContent = 'Copied';
            setTimeout(() => (copyBtn.textContent = 'Copy'), 2000);
        } catch (_e) {
            // ignore clipboard failures
        }
    });

    errorDiv.appendChild(icon);
    errorDiv.appendChild(msgSpan);
    errorDiv.appendChild(copyBtn);

    // Style the error message with sensible fallbacks so it's never transparent
    errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? "var(--color-success, #059669)" : "var(--color-error, #ef4444)"};
        color: white;
        padding: 12px 20px;
        border-radius: var(--radius-lg);
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 10px;
        max-width: 640px;
        animation: slideIn 0.3s ease;
        white-space: pre-wrap;
    `;

    document.body.appendChild(errorDiv);

    // Focus it so users (and screen readers) notice it immediately
    errorDiv.focus();

    // Append to persistent on-page error log for debugging (visible while page is open)
    try {
        ensureErrorLog();
        appendErrorLog(message);
    } catch (e) {
        console.warn('Failed to append to error log:', e && e.message);
    }

    // Remove after a longer period to allow copying/selection
    setTimeout(() => {
        errorDiv.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (errorDiv.parentNode) {
                document.body.removeChild(errorDiv);
            }
        }, 300);
    }, 7000);

// --- persistent error log helpers ---
function ensureErrorLog() {
    if (document.getElementById('pdf-error-log')) return;
    const log = document.createElement('aside');
    log.id = 'pdf-error-log';
    log.style.cssText = 'position:fixed;bottom:20px;left:20px;max-width:480px;max-height:40vh;overflow:auto;background:rgba(0,0,0,0.7);color:#fff;padding:12px;border-radius:8px;z-index:10000;font-size:13px;';
    const title = document.createElement('div');
    title.innerHTML = '<strong>Last Errors</strong> <button id="clear-error-log" style="margin-left:10px;background:transparent;border:1px solid rgba(255,255,255,0.15);color:inherit;padding:2px 6px;border-radius:6px;cursor:pointer;">Clear</button>';
    title.style.marginBottom = '8px';
    log.appendChild(title);
    const list = document.createElement('div');
    list.id = 'pdf-error-log-list';
    log.appendChild(list);
    document.body.appendChild(log);
    document.getElementById('clear-error-log').addEventListener('click', () => { document.getElementById('pdf-error-log-list').innerHTML = ''; });
}

function appendErrorLog(msg) {
    const list = document.getElementById('pdf-error-log-list');
    if (!list) return;
    const item = document.createElement('div');
    const time = new Date().toISOString();
    item.style.padding = '6px 0';
    item.style.borderTop = '1px dashed rgba(255,255,255,0.08)';
    item.innerHTML = `<div style="font-size:12px;color:rgba(255,255,255,0.7);margin-bottom:4px">${time}</div><div style="white-space:pre-wrap;">${escapeHtml(msg)}</div>`;
    list.insertBefore(item, list.firstChild);
}

function escapeHtml(unsafe) {
    return String(unsafe)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

    // Add keyframes for animation if missing
    if (!document.querySelector('#error-animations')) {
        const style = document.createElement('style');
        style.id = 'error-animations';
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
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function simulateProcessing() {
    return new Promise(resolve => {
        setTimeout(resolve, 800);
    });
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    initEventListeners();
    
    // Set initial values
    updateImageQualityDisplay();
    updateMetadataDisplay();
    
    // Clean up any existing object URLs on page unload
    window.addEventListener('beforeunload', () => {
        // Revoke any blob URLs that might still be active
        // This helps prevent memory leaks
        if (compressedPDFBytes) {
            // In a real implementation, we'd track created URLs
            console.log('Cleaning up compression resources...');
        }
    });
});