/* ============================================
   GO TOOLLY - PDF TOOLS
   Professional PDF Splitter, Extractor & Rotator
   ============================================ */

// ============================================
// COMMON UTILITIES
// ============================================

class NotificationSystem {
    static show(message, type = 'info', duration = 3000) {
        // Remove existing notifications
        document.querySelectorAll('.notification').forEach(n => n.remove());
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Auto-remove after duration
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duration);
    }
}

class FileHandler {
    static async loadPDF(file) {
        if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
            throw new Error('Please select a valid PDF file');
        }
        
        if (file.size > 50 * 1024 * 1024) {
            throw new Error('File size must be less than 50MB for browser processing');
        }
        
        try {
            const arrayBuffer = await file.arrayBuffer();
            return new Uint8Array(arrayBuffer);
        } catch (error) {
            throw new Error('Failed to read PDF file: ' + error.message);
        }
    }
}

// ============================================
// PDF SPLITTER MODULE
// ============================================

class PDFSplitter {
    constructor() {
        this.init();
    }
    
    init() {
        // Initialize DOM elements
        this.pdfInput = document.getElementById('split-pdf-input');
        this.dropZone = document.getElementById('split-drop-zone');
        this.selectPdfBtn = document.getElementById('split-select-pdf');
        this.fileInfo = document.getElementById('split-file-info');
        this.fileName = document.getElementById('split-file-name');
        this.filePages = document.getElementById('split-file-pages');
        this.settingsSection = document.getElementById('split-settings-section');
        this.pageSelector = document.getElementById('split-page-selector');
        this.selectAllBtn = document.getElementById('select-all-btn');
        this.deselectAllBtn = document.getElementById('deselect-all-btn');
        this.extractBtn = document.getElementById('split-extract-btn');
        this.resetBtn = document.getElementById('split-reset-btn');
        this.resultsSection = document.getElementById('split-results-section');
        this.resultFilename = document.getElementById('split-result-filename');
        this.resultPages = document.getElementById('split-result-pages');
        this.downloadBtn = document.getElementById('split-download-btn');
        
        // State
        this.pdfBytes = null;
        this.totalPages = 0;
        this.extractedBytes = null;
        
        this.setupEventListeners();
        this.hideAllSections();
    }
    
    hideAllSections() {
        this.fileInfo.style.display = 'none';
        this.settingsSection.style.display = 'none';
        this.resultsSection.style.display = 'none';
    }
    
    setupEventListeners() {
        // File selection
        // Stop propagation on the visible button so clicks don't bubble up to the drop zone
        // which would trigger the file dialog twice.
        this.selectPdfBtn.addEventListener('click', (e) => { e.stopPropagation(); this.pdfInput.click(); });
        this.pdfInput.addEventListener('change', (e) => this.handleFileSelect(e));
        
        // Drag and drop
        this.dropZone.addEventListener('dragover', this.handleDragOver.bind(this));
        this.dropZone.addEventListener('dragleave', this.handleDragLeave.bind(this));
        this.dropZone.addEventListener('drop', this.handleDrop.bind(this));
        // Only open file dialog when the drop zone background itself is clicked
        // (prevents child elements like the "Select" button from causing a double-open).
        this.dropZone.addEventListener('click', (e) => {
            if (e.target === this.dropZone) {
                this.pdfInput.click();
            }
        });
        
        // Page controls
        this.selectAllBtn.addEventListener('click', () => this.selectAllPages());
        this.deselectAllBtn.addEventListener('click', () => this.deselectAllPages());
        
        // Action buttons
        this.extractBtn.addEventListener('click', () => this.performExtraction());
        this.resetBtn.addEventListener('click', () => this.resetTool());
        this.downloadBtn.addEventListener('click', () => this.downloadExtractedPDF());
    }
    
    handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        this.dropZone.classList.add('dragover');
    }
    
    handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        this.dropZone.classList.remove('dragover');
    }
    
    handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        this.dropZone.classList.remove('dragover');
        
        const files = Array.from(e.dataTransfer.files);
        const pdfFiles = files.filter(f => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'));
        
        if (pdfFiles.length === 0) {
            NotificationSystem.show('Please drop a valid PDF file', 'error');
            return;
        }
        
        this.loadPDF(pdfFiles[0]);
    }
    
    async handleFileSelect(e) {
        const files = Array.from(e.target.files);
        const pdfFiles = files.filter(f => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'));
        
        if (pdfFiles.length === 0) {
            NotificationSystem.show('Please select a valid PDF file', 'error');
            return;
        }
        
        this.loadPDF(pdfFiles[0]);
    }
    
    async loadPDF(file) {
        try {
            NotificationSystem.show('Loading PDF...', 'info');
            
            this.pdfBytes = await FileHandler.loadPDF(file);
            const pdfDoc = await PDFLib.PDFDocument.load(this.pdfBytes);
            this.totalPages = pdfDoc.getPageCount();
            
            // Update file info
            this.fileName.textContent = `📄 ${file.name}`;
            this.filePages.textContent = `${this.totalPages} pages`;
            this.fileInfo.style.display = 'block';
            
            // Render page checkboxes
            this.renderPageCheckboxes();
            
            // Show settings section
            this.settingsSection.style.display = 'block';
            this.resultsSection.style.display = 'none';
            
            NotificationSystem.show('PDF loaded successfully', 'success');
            
        } catch (error) {
            NotificationSystem.show(error.message, 'error');
        }
    }
    
    renderPageCheckboxes() {
        this.pageSelector.innerHTML = '';
        
        for (let i = 1; i <= this.totalPages; i++) {
            const div = document.createElement('div');
            div.className = 'page-checkbox';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `split-page-${i}`;
            checkbox.value = i;
            checkbox.checked = true;
            
            const label = document.createElement('label');
            label.htmlFor = `split-page-${i}`;
            label.textContent = `Page ${i}`;
            
            div.appendChild(checkbox);
            div.appendChild(label);
            this.pageSelector.appendChild(div);
        }
    }
    
    selectAllPages() {
        const checkboxes = this.pageSelector.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(cb => cb.checked = true);
    }
    
    deselectAllPages() {
        const checkboxes = this.pageSelector.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(cb => cb.checked = false);
    }
    
    async performExtraction() {
        if (!this.pdfBytes) {
            NotificationSystem.show('Please load a PDF first', 'error');
            return;
        }
        
        const checkboxes = Array.from(this.pageSelector.querySelectorAll('input[type="checkbox"]:checked'));
        if (checkboxes.length === 0) {
            NotificationSystem.show('Please select at least one page', 'error');
            return;
        }
        
        const selectedPages = checkboxes.map(cb => parseInt(cb.value) - 1);
        
        try {
            this.extractBtn.disabled = true;
            NotificationSystem.show('Extracting pages...', 'info');
            
            const sourcePdf = await PDFLib.PDFDocument.load(this.pdfBytes);
            const newPdf = await PDFLib.PDFDocument.create();
            
            for (const pageIndex of selectedPages) {
                const [copiedPage] = await newPdf.copyPages(sourcePdf, [pageIndex]);
                newPdf.addPage(copiedPage);
            }
            
            this.extractedBytes = await newPdf.save();
            
            this.resultFilename.textContent = 'extracted.pdf';
            this.resultPages.textContent = selectedPages.length;
            this.resultsSection.style.display = 'block';
            this.extractBtn.disabled = false;
            
            // Scroll to results
            this.resultsSection.scrollIntoView({ behavior: 'smooth' });
            
            NotificationSystem.show('Pages extracted successfully', 'success');
            
        } catch (error) {
            NotificationSystem.show('Extraction failed: ' + error.message, 'error');
            this.extractBtn.disabled = false;
        }
    }
    
    downloadExtractedPDF() {
        if (!this.extractedBytes) {
            NotificationSystem.show('No extracted PDF available', 'error');
            return;
        }
        
        const blob = new Blob([this.extractedBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        
        a.href = url;
        a.download = `extracted-${new Date().getTime()}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        // Clean up
        setTimeout(() => URL.revokeObjectURL(url), 100);
        
        NotificationSystem.show('Download started!', 'success');
    }
    
    resetTool() {
        this.pdfInput.value = '';
        this.pdfBytes = null;
        this.totalPages = 0;
        this.extractedBytes = null;
        
        this.hideAllSections();
        this.pageSelector.innerHTML = '<div class="empty-state"><p>Pages will appear here after PDF upload</p></div>';
        
        NotificationSystem.show('Tool reset', 'success');
    }
}

// ============================================
// PDF ROTATOR MODULE - FIXED VERSION
// ============================================

class PDFRotator {
    constructor() {
        this.pdfBytes = null;
        this.pdfPages = [];
        this.selectedPages = new Set();
        this.currentRotation = 0;
        this.customRotationMode = false;
        
        this.init();
    }
    
    init() {
        // Initialize DOM elements
        this.dropZone = document.getElementById('rotate-drop-zone');
        this.pdfInput = document.getElementById('rotate-pdf-input');
        this.selectPdfBtn = document.getElementById('rotate-select-pdf');
        this.toolInterfaceLeft = document.getElementById('rotate-tool-interface-left');
        this.toolInterfaceMiddle = document.getElementById('rotate-tool-interface-middle');
        this.pageList = document.getElementById('rotate-page-list');
        this.downloadBtn = document.getElementById('rotate-download-pdf');
        this.processAnotherBtn = document.getElementById('rotate-process-another');
        this.pageCountDisplay = document.getElementById('rotate-page-count-display');
        this.pdfPreview = document.getElementById('rotate-pdf-preview');
        
        // Rotation buttons
        this.rotationButtons = document.querySelectorAll('.rotation-btn');
        this.customRotationInput = document.getElementById('custom-rotation-input');
        this.customDegrees = document.getElementById('custom-degrees');
        this.customDegreesInput = document.getElementById('custom-degrees-input');
        this.rotateCustomBtn = document.getElementById('rotate-custom');
        
        // Batch controls
        this.applyAllBtn = document.getElementById('apply-all');
        this.applySelectedBtn = document.getElementById('apply-selected');
        this.resetAllBtn = document.getElementById('reset-all');
        this.autoDetectBtn = document.getElementById('auto-detect');
        
        this.setupEventListeners();
        this.setupDragAndDrop();
        
        console.log('PDF Rotator initialized');
    }
    
    setupEventListeners() {
        // File selection
        this.selectPdfBtn.addEventListener('click', () => this.pdfInput.click());
        this.pdfInput.addEventListener('change', (e) => this.handleFileSelect(e));
        
        // Rotation buttons
        this.rotationButtons.forEach(btn => {
            if (btn.id !== 'rotate-custom') {
                btn.addEventListener('click', () => this.handleRotationSelect(btn));
            }
        });
        
        // Custom rotation
        this.rotateCustomBtn.addEventListener('click', () => {
            this.customRotationMode = true;
            this.customRotationInput.style.display = 'block';
            this.rotationButtons.forEach(b => b.classList.remove('active'));
            this.rotateCustomBtn.classList.add('active');
            this.currentRotation = parseInt(this.customDegrees.value) || 0;
            this.updateSelectedPagesRotation();
        });
        
        // Custom degree inputs
        this.customDegrees.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            this.customDegreesInput.value = value;
            if (this.customRotationMode) {
                this.currentRotation = value;
                this.updateSelectedPagesRotation();
            }
        });
        
        this.customDegreesInput.addEventListener('input', (e) => {
            let value = parseInt(e.target.value);
            if (value < -180) value = -180;
            if (value > 180) value = 180;
            e.target.value = value;
            this.customDegrees.value = value;
            if (this.customRotationMode) {
                this.currentRotation = value;
                this.updateSelectedPagesRotation();
            }
        });
        
        // Batch controls
        this.applyAllBtn.addEventListener('click', () => this.applyToAllPages());
        this.applySelectedBtn.addEventListener('click', () => this.applyToSelectedPages());
        this.resetAllBtn.addEventListener('click', () => this.resetAllPages());
        this.autoDetectBtn.addEventListener('click', () => this.autoDetectOrientation());
        
        // Action buttons
        this.downloadBtn.addEventListener('click', () => this.downloadRotatedPDF());
        this.processAnotherBtn.addEventListener('click', () => this.resetTool());
    }
    
    setupDragAndDrop() {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            this.dropZone.addEventListener(eventName, this.preventDefaults, false);
        });
        
        const highlight = () => {
            this.dropZone.style.borderColor = 'var(--color-primary)';
            this.dropZone.style.backgroundColor = 'var(--color-primary-light)';
        };
        
        const unhighlight = () => {
            this.dropZone.style.borderColor = '';
            this.dropZone.style.backgroundColor = '';
        };
        
        ['dragenter', 'dragover'].forEach(eventName => {
            this.dropZone.addEventListener(eventName, highlight, false);
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            this.dropZone.addEventListener(eventName, unhighlight, false);
        });
        
        this.dropZone.addEventListener('drop', (e) => this.handleDrop(e), false);
    }
    
    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files.length > 0) {
            this.handleFile(files[0]);
        }
    }
    
    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            this.handleFile(file);
        }
    }
    
    async handleFile(file) {
        try {
            NotificationSystem.show('Loading PDF...', 'info');
            
            this.pdfBytes = await FileHandler.loadPDF(file);
            const pdfDoc = await PDFLib.PDFDocument.load(this.pdfBytes);
            const pages = pdfDoc.getPages();
            
            // Initialize page data
            this.pdfPages = pages.map((page, index) => ({
                index,
                rotation: 0,
                width: page.getWidth(),
                height: page.getHeight(),
                originalRotation: page.getRotation().angle
            }));
            
            // Update UI
            this.pageCountDisplay.textContent = `(${pages.length} pages)`;
            this.toolInterfaceLeft.style.display = 'block';
            this.toolInterfaceMiddle.style.display = 'block';
            this.dropZone.style.display = 'none';
            
            // Initialize rotation to 0 degrees
            this.handleRotationSelect(document.getElementById('rotate-0'));
            
            // Generate thumbnails
            await this.generateThumbnails();
            
            NotificationSystem.show('PDF loaded successfully', 'success');
            
        } catch (error) {
            console.error('Error loading PDF:', error);
            NotificationSystem.show(error.message, 'error');
        }
    }
    
    async generateThumbnails() {
        try {
            // Clear page list
            this.pageList.innerHTML = '';
            
            // Create page items without actual thumbnails (simplified for now)
            for (let i = 0; i < this.pdfPages.length; i++) {
                this.createPageItem(i + 1);
            }
            
            // Update preview
            this.updatePreview();
            
        } catch (error) {
            console.error('Error generating thumbnails:', error);
            NotificationSystem.show('Error generating page thumbnails', 'error');
        }
    }
    
    createPageItem(pageNumber) {
        const pageIndex = pageNumber - 1;
        const pageData = this.pdfPages[pageIndex];
        
        const pageItem = document.createElement('div');
        pageItem.className = 'page-item';
        pageItem.dataset.pageIndex = pageIndex;
        
        // Determine orientation
        const isPortrait = pageData.height > pageData.width;
        const orientation = isPortrait ? 'Portrait' : 'Landscape';
        
        pageItem.innerHTML = `
            <div class="page-thumbnail">
                <div style="display: flex; align-items: center; justify-content: center; width: 100%; height: 100%;">
                    <span style="font-size: 12px; color: var(--color-text-light);">Page ${pageNumber}</span>
                </div>
            </div>
            <div class="page-info">
                <div class="page-number">Page ${pageNumber}</div>
                <div class="page-orientation">${orientation} • ${Math.round(pageData.width)}×${Math.round(pageData.height)}</div>
                <div class="current-rotation">Rotation: <span class="rotation-value">${pageData.rotation}°</span></div>
            </div>
            <div class="page-controls">
                <button class="page-btn select-btn">Select</button>
            </div>
        `;
        
        // Add click event for selection
        pageItem.addEventListener('click', (e) => {
            if (!e.target.classList.contains('page-btn')) {
                this.togglePageSelection(pageIndex);
            }
        });
        
        // Add button event
        const selectBtn = pageItem.querySelector('.select-btn');
        selectBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.togglePageSelection(pageIndex);
        });
        
        this.pageList.appendChild(pageItem);
    }
    
    togglePageSelection(pageIndex) {
        if (this.selectedPages.has(pageIndex)) {
            this.selectedPages.delete(pageIndex);
        } else {
            this.selectedPages.add(pageIndex);
        }
        
        // Update UI
        this.updatePageList();
        this.updateUIState();
    }
    
    updatePageList() {
        document.querySelectorAll('.page-item').forEach((item, index) => {
            const pageIndex = parseInt(item.dataset.pageIndex);
            const pageData = this.pdfPages[pageIndex];
            
            // Update rotation display
            const rotationValue = item.querySelector('.rotation-value');
            if (rotationValue) {
                rotationValue.textContent = `${pageData.rotation}°`;
            }
            
            // Update selection state
            if (this.selectedPages.has(pageIndex)) {
                item.classList.add('selected');
            } else {
                item.classList.remove('selected');
            }
        });
    }
    
    handleRotationSelect(button) {
        this.customRotationMode = false;
        this.customRotationInput.style.display = 'none';
        
        // Update active button
        this.rotationButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        // Get rotation degrees
        this.currentRotation = parseInt(button.dataset.degrees) || 0;
        
        // Update selected pages
        this.updateSelectedPagesRotation();
    }
    
    updateSelectedPagesRotation() {
        const pagesToUpdate = this.selectedPages.size > 0 ? 
            Array.from(this.selectedPages) : 
            Array.from({length: this.pdfPages.length}, (_, i) => i);
        
        pagesToUpdate.forEach(pageIndex => {
            this.pdfPages[pageIndex].rotation = this.currentRotation;
        });
        
        this.updatePageList();
        this.updateUIState();
        this.updatePreview();
    }
    
    applyToAllPages() {
        if (this.pdfPages.length === 0) {
            NotificationSystem.show('No PDF loaded', 'error');
            return;
        }

        // Ensure currentRotation reflects the active rotation control
        const activeRotationBtn = document.querySelector('.rotation-btn.active');
        if (activeRotationBtn && activeRotationBtn.id !== 'rotate-custom') {
            this.currentRotation = parseInt(activeRotationBtn.dataset.degrees) || 0;
        }
        if (this.customRotationMode) {
            this.currentRotation = parseInt(this.customDegrees.value) || 0;
        }

        // Select all pages and apply rotation
        this.selectedPages.clear();
        this.pdfPages.forEach((_, index) => this.selectedPages.add(index));
        this.updateSelectedPagesRotation();

        NotificationSystem.show(`Applied ${this.currentRotation}° to all ${this.pdfPages.length} pages`, 'success');
    }
    
    applyToSelectedPages() {
        if (this.selectedPages.size === 0) {
            NotificationSystem.show('Please select pages first by clicking on them', 'error');
            return;
        }

        // Ensure currentRotation reflects active controls
        const activeRotationBtn = document.querySelector('.rotation-btn.active');
        if (activeRotationBtn && activeRotationBtn.id !== 'rotate-custom') {
            this.currentRotation = parseInt(activeRotationBtn.dataset.degrees) || 0;
        }
        if (this.customRotationMode) {
            this.currentRotation = parseInt(this.customDegrees.value) || 0;
        }

        this.updateSelectedPagesRotation();
        NotificationSystem.show(`Applied ${this.currentRotation}° to ${this.selectedPages.size} selected page(s)`, 'success');
    }
    
    resetAllPages() {
        if (this.pdfPages.length === 0) {
            NotificationSystem.show('No PDF loaded', 'error');
            return;
        }

        this.pdfPages.forEach(page => page.rotation = 0);
        this.selectedPages.clear();
        this.updatePageList();
        this.updateUIState();

        NotificationSystem.show('All page rotations have been reset', 'success');
    }
    
    autoDetectOrientation() {
        if (!this.pdfPages || this.pdfPages.length === 0) {
            NotificationSystem.show('No PDF loaded', 'error');
            return;
        }

        NotificationSystem.show('Auto-detecting orientations...', 'info');

        // Clear selections and prepare to select all affected pages
        this.selectedPages.clear();

        // Base decision on page aspect ratio
        this.pdfPages.forEach((page, index) => {
            const w = page.width;
            const h = page.height;

            // If the page is wider than tall (landscape), rotate to 90°, else make sure it's 0°
            if (w > h) {
                page.rotation = 90;
            } else {
                page.rotation = 0;
            }

            // Mark page as affected so user can review
            this.selectedPages.add(index);
        });

        this.updatePageList();
        this.updateUIState();
        NotificationSystem.show(`Auto-detect applied to ${this.pdfPages.length} page(s)`, 'success');
    }
    
    async updatePreview() {
        if (!this.pdfBytes || !window['pdfjsLib']) {
            this.pdfPreview.innerHTML = '<div style="text-align:center;color:var(--color-text-light);padding:20px;">No PDF loaded</div>';
            return;
        }
        // Find the first selected page, or default to first page
        let pageIndex = 0;
        if (this.selectedPages && this.selectedPages.size > 0) {
            pageIndex = Math.min(...Array.from(this.selectedPages));
        }
        // Clear preview
        this.pdfPreview.innerHTML = '<div style="text-align:center;color:var(--color-text-light);padding:20px;">Loading preview...</div>';
        try {
            // Always pass a copy of the buffer to avoid ArrayBuffer detachment issues
            const loadingTask = window['pdfjsLib'].getDocument({ data: this.pdfBytes.slice ? this.pdfBytes.slice() : new Uint8Array(this.pdfBytes) });
            const pdf = await loadingTask.promise;
            const page = await pdf.getPage(pageIndex + 1);
            // Get rotation from our state
            const rotation = (this.pdfPages && this.pdfPages[pageIndex]) ? (this.pdfPages[pageIndex].rotation || 0) : 0;
            // Calculate scale to fit preview area
            const container = this.pdfPreview;
            const maxWidth = container.clientWidth || 400;
            const maxHeight = container.clientHeight || 400;
            const viewport0 = page.getViewport({ scale: 1, rotation });
            const scale = Math.min(maxWidth / viewport0.width, maxHeight / viewport0.height, 1.5);
            const viewport = page.getViewport({ scale, rotation });
            // Create canvas
            const canvas = document.createElement('canvas');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            const context = canvas.getContext('2d');
            // White background
            context.fillStyle = '#fff';
            context.fillRect(0, 0, canvas.width, canvas.height);
            // Render
            await page.render({ canvasContext: context, viewport }).promise;
            // Show canvas
            this.pdfPreview.innerHTML = '';
            this.pdfPreview.appendChild(canvas);
            // Add status
            const status = document.createElement('div');
            status.style = 'text-align:center;color:var(--color-text-light);margin-top:8px;font-size:14px;';
            status.textContent = `Page ${pageIndex + 1} — Rotation: ${rotation}°`;
            this.pdfPreview.appendChild(status);
        } catch (err) {
            this.pdfPreview.innerHTML = `<div style="color:#dc2626;text-align:center;padding:20px;">Preview error: ${err.message}</div>`;
        }
    }
    
    async downloadRotatedPDF() {
        if (!this.pdfBytes) {
            NotificationSystem.show('Please load a PDF first', 'error');
            return;
        }

        try {
            this.downloadBtn.disabled = true;
            NotificationSystem.show('Creating rotated PDF...', 'info');
            
            // Create a new PDF document
            const pdfDoc = await PDFLib.PDFDocument.load(this.pdfBytes);
            const pages = pdfDoc.getPages();
            
            // Apply rotations
            for (let i = 0; i < this.pdfPages.length; i++) {
                if (this.pdfPages[i].rotation !== 0) {
                    pages[i].setRotation(PDFLib.degrees(this.pdfPages[i].rotation));
                }
            }
            
            // Save PDF
            const pdfBytes = await pdfDoc.save();
            
            // Create download link
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `rotated-${new Date().getTime()}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            NotificationSystem.show('Rotated PDF downloaded successfully', 'success');
            this.downloadBtn.disabled = false;
            
        } catch (error) {
            console.error('Error creating rotated PDF:', error);
            NotificationSystem.show('Error creating rotated PDF. Please try again.', 'error');
            this.downloadBtn.disabled = false;
        }
    }
    
    resetTool() {
        this.pdfBytes = null;
        this.pdfPages = [];
        this.selectedPages.clear();
        this.currentRotation = 0;
        this.customRotationMode = false;
        
        // Reset UI
        this.toolInterfaceLeft.style.display = 'none';
        this.toolInterfaceMiddle.style.display = 'none';
        this.dropZone.style.display = 'block';
        this.pageList.innerHTML = '<div class="empty-state"><p>Pages will appear here after PDF upload</p></div>';
        this.pdfPreview.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: var(--color-text-light);">Select a page to preview</div>';
        this.pdfInput.value = '';
        
        // Reset rotation buttons
        this.rotationButtons.forEach(btn => btn.classList.remove('active'));
        document.getElementById('rotate-0').classList.add('active');
        this.customRotationInput.style.display = 'none';
        
        this.updateUIState();
        NotificationSystem.show('Tool reset successfully', 'success');
    }
    
    updateUIState() {
        const hasPDF = this.pdfBytes !== null;
        const hasSelectedPages = this.selectedPages.size > 0;
        
        this.downloadBtn.disabled = !hasPDF;
        this.applySelectedBtn.disabled = !hasSelectedPages;
        this.applyAllBtn.disabled = !hasPDF;
        this.resetAllBtn.disabled = !hasPDF;
        this.autoDetectBtn.disabled = !hasPDF;
    }
}

// ============================================
// MAIN INITIALIZATION
// ============================================

let splitterInstance = null;
let rotatorInstance = null;

function initializeSplitterTool() {
    if (!splitterInstance) {
        splitterInstance = new PDFSplitter();
        console.log('PDF Splitter initialized');
    }
    return splitterInstance;
}

function initializeRotatorTool() {
    if (!rotatorInstance) {
        rotatorInstance = new PDFRotator();
        console.log('PDF Rotator initialized');
    }
    return rotatorInstance;
}

// Tab switching handler
function setupTabSwitching() {
    const splitTabBtn = document.getElementById('tab-split');
    const rotateTabBtn = document.getElementById('tab-rotate');
    const splitTabContent = document.getElementById('split-tab');
    const rotateTabContent = document.getElementById('rotate-tab');

    function switchToTab(tabName) {
        // Hide all tabs
        splitTabContent.style.display = 'none';
        rotateTabContent.style.display = 'none';
        
        // Remove active class from all buttons
        splitTabBtn.classList.remove('active');
        rotateTabBtn.classList.remove('active');

        // Show selected tab and set active button
        if (tabName === 'split') {
            splitTabContent.style.display = 'block';
            splitTabBtn.classList.add('active');
            initializeSplitterTool();
        } else if (tabName === 'rotate') {
            rotateTabContent.style.display = 'block';
            rotateTabBtn.classList.add('active');
            initializeRotatorTool();
        }
    }

    // Add event listeners
    splitTabBtn.addEventListener('click', () => switchToTab('split'));
    rotateTabBtn.addEventListener('click', () => switchToTab('rotate'));

    // Initialize with split tab by default
    switchToTab('split');
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize main tools
    setupTabSwitching();
    
    console.log('PDF Tools page loaded successfully');
});