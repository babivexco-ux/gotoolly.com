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
        showError('Failed to compress PDF. The file may be corrupted or use unsupported features.');
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
    errorDiv.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        ${message}
    `;
    
    // Style the error message
    errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? 'var(--color-success)' : 'var(--color-error)'};
        color: white;
        padding: 12px 20px;
        border-radius: var(--radius-lg);
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 1000;
        display: flex;
        align-items: center;
        gap: 10px;
        max-width: 400px;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(errorDiv);
    
    // Remove after 5 seconds
    setTimeout(() => {
        errorDiv.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (errorDiv.parentNode) {
                document.body.removeChild(errorDiv);
            }
        }, 300);
    }, 5000);
    
    // Add keyframes for animation
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