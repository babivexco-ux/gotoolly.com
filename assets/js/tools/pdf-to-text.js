/* ============================================
   GO TOOLLY - PDF TO TEXT CONVERTER
   Professional PDF to Text Conversion Tool
   ============================================ */

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const pdfInput = document.getElementById('pdf-input');
    const dropZone = document.getElementById('drop-zone');
    const fileInfo = document.getElementById('file-info');
    const fileName = document.getElementById('file-name');
    const filePages = document.getElementById('file-pages');
    
    const settingsSection = document.getElementById('settings-section');
    const pagesOption = document.getElementById('pages-option');
    const pageRangeGroup = document.getElementById('page-range-group');
    const pageRange = document.getElementById('page-range');
    const convertBtn = document.getElementById('convert-btn');
    const resetBtn = document.getElementById('reset-btn');
    
    const progressContainer = document.getElementById('progress-container');
    const progressFill = document.getElementById('progress-fill');
    
    const resultsSection = document.getElementById('results-section');
    const resultFilename = document.getElementById('result-filename');
    const resultPages = document.getElementById('result-pages');
    const downloadBtn = document.getElementById('download-btn');
    
    // State
    let pdfDoc = null;
    let totalPages = 0;
    
    // Initialize
    setupEventListeners();
    
    function setupEventListeners() {
        pdfInput.addEventListener('change', handleFileSelect);
        dropZone.addEventListener('dragover', handleDragOver);
        dropZone.addEventListener('dragleave', handleDragLeave);
        dropZone.addEventListener('drop', handleDrop);
        
        pagesOption.addEventListener('change', function() {
            pageRangeGroup.style.display = this.value === 'range' ? 'flex' : 'none';
        });
        
        convertBtn.addEventListener('click', performConversion);
        resetBtn.addEventListener('click', resetTool);
    }
    
    function handleFileSelect(e) {
        const files = Array.from(e.target.files);
        const pdfFiles = files.filter(f => f.type === 'application/pdf');
        
        if (pdfFiles.length === 0) {
            showNotification('Please select a PDF file', 'error');
            return;
        }
        
        loadPDF(pdfFiles[0]);
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
        const pdfFiles = files.filter(f => f.type === 'application/pdf');
        
        if (pdfFiles.length === 0) {
            showNotification('Please drop a PDF file', 'error');
            return;
        }
        
        loadPDF(pdfFiles[0]);
    }
    
    function loadPDF(file) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            pdfjsLib.getDocument(new Uint8Array(e.target.result)).promise.then(function(pdf) {
                pdfDoc = pdf;
                totalPages = pdf.numPages;
                
                fileName.textContent = `📄 ${file.name}`;
                filePages.textContent = `Pages: ${totalPages}`;
                fileInfo.style.display = 'block';
                
                settingsSection.style.display = 'block';
                resultsSection.style.display = 'none';
                
                showNotification('PDF loaded successfully', 'success');
            }).catch(function(error) {
                showNotification('Failed to load PDF: ' + error.message, 'error');
            });
        };
        
        reader.readAsArrayBuffer(file);
    }
    
    function getPageRanges() {
        if (pagesOption.value === 'all') {
            const pages = [];
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
            return pages;
        } else {
            const rangStr = pageRange.value.trim();
            if (!rangStr) {
                showNotification('Please enter a page range', 'error');
                return null;
            }
            
            const pages = new Set();
            const parts = rangStr.split(',');
            
            for (const part of parts) {
                const trimmed = part.trim();
                if (trimmed.includes('-')) {
                    const [start, end] = trimmed.split('-').map(n => parseInt(n.trim()));
                    for (let i = start; i <= end && i <= totalPages; i++) {
                        pages.add(i);
                    }
                } else {
                    const page = parseInt(trimmed);
                    if (page > 0 && page <= totalPages) {
                        pages.add(page);
                    }
                }
            }
            
            return Array.from(pages).sort((a, b) => a - b);
        }
    }
    
    async function performConversion() {
        if (!pdfDoc) {
            showNotification('Please load a PDF first', 'error');
            return;
        }
        
        const pages = getPageRanges();
        if (!pages || pages.length === 0) {
            showNotification('Invalid page range', 'error');
            return;
        }
        
        progressContainer.style.display = 'block';
        convertBtn.disabled = true;
        
        try {
            const textContent = [];
            
            // Extract text from PDF pages with intelligent spacing
            for (let i = 0; i < pages.length; i++) {
                const page = await pdfDoc.getPage(pages[i]);
                const text = await page.getTextContent();
                
                let pageText = '';
                let lastY = null;
                let lastX = null;
                
                for (const item of text.items) {
                    // Add line breaks between text blocks at different Y positions
                    if (lastY !== null && Math.abs(lastY - item.y) > 5) {
                        pageText += '\n';
                        lastX = null; // Reset X position for new line
                    }
                    
                    // Add intelligent spacing between words
                    if (lastX !== null && item.x - lastX > 2) {
                        // Check if we should add space based on text characteristics
                        const needsSpace = shouldAddSpace(pageText, item.str);
                        if (needsSpace) {
                            pageText += ' ';
                        }
                    }
                    
                    pageText += item.str;
                    lastY = item.y;
                    lastX = item.x + (item.width || 0);
                }
                
                textContent.push(pageText.trim());
                progressFill.style.width = ((i + 1) / pages.length * 100) + '%';
            }
            
            // Create text file from extracted content
            const textBlob = await createTextFromExtraction(textContent);
            
            const url = URL.createObjectURL(textBlob);
            downloadBtn.href = url;
            downloadBtn.download = 'document.txt';
            
            resultFilename.textContent = 'document.txt';
            resultPages.textContent = `Pages: ${pages.length}`;
            resultsSection.style.display = 'block';
            progressContainer.style.display = 'none';
            convertBtn.disabled = false;
            
            showNotification('PDF converted successfully', 'success');
        } catch (error) {
            showNotification('Conversion failed: ' + error.message, 'error');
            progressContainer.style.display = 'none';
            convertBtn.disabled = false;
        }
    }
    
    async function createTextFromExtraction(pages) {
        // Combine all pages into a single text file with page separators
        let textContent = '';
        pages.forEach((page, index) => {
            if (index > 0) {
                textContent += '\n\n' + '='.repeat(80) + '\nPAGE ' + (index + 1) + '\n' + '='.repeat(80) + '\n\n';
            } else {
                textContent += page + '\n\n';
            }
            textContent += page;
        });
        
        // Create a Blob from the text content
        const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
        return blob;
        const zip = new JSZip();
        
        // Add [Content_Types].xml
        zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`);
        
        // Add _rels/.rels
        zip.folder('_rels').file('.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`);
        
        // Add word/_rels/document.xml.rels
        zip.folder('word').folder('_rels').file('document.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`);
        
        // Add styles.xml
        zip.folder('word').file('styles.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:docDefaults>
<w:rPrDefault>
<w:rPr>
<w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
<w:sz w:val="22"/>
</w:rPr>
</w:rPrDefault>
</w:docDefaults>
</w:styles>`);
        
        // Create document.xml with text content
        let docXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:body>`;
        
        for (let pageIdx = 0; pageIdx < pages.length; pageIdx++) {
            const lines = pages[pageIdx].split('\n');
            
            for (const line of lines) {
                if (line.trim()) {
                    docXml += `<w:p>
<w:pPr><w:pStyle w:val="Normal"/></w:pPr>
<w:r>
<w:rPr><w:rStyle w:val="Normal"/></w:rPr>
<w:t>${escapeXml(line)}</w:t>
</w:r>
</w:p>`;
                } else {
                    docXml += `<w:p><w:pPr><w:pStyle w:val="Normal"/></w:pPr></w:p>`;
                }
            }
            
            // Add page break between pages (except after last page)
            if (pageIdx < pages.length - 1) {
                docXml += `<w:p>
<w:pPr>
<w:pageBreakBefore/>
</w:pPr>
</w:p>`;
            }
        }
        
        docXml += `</w:body>
</w:document>`;
        
        zip.folder('word').file('document.xml', docXml);
        
        return zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
    }
    
    function escapeXml(str) {
        if (!str) return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }
    
    function shouldAddSpace(previousText, currentText) {
        if (!previousText || !currentText) return false;
        
        // Get the last character of previous text
        const lastChar = previousText.charAt(previousText.length - 1);
        // Get the first character of current text
        const firstChar = currentText.charAt(0);
        
        // Check if characters are Arabic/Persian/Urdu
        const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
        const englishRegex = /[A-Za-z0-9]/;
        
        const lastIsArabic = arabicRegex.test(lastChar);
        const lastIsEnglish = englishRegex.test(lastChar);
        const currentIsArabic = arabicRegex.test(firstChar);
        const currentIsEnglish = englishRegex.test(firstChar);
        
        // Don't add space if last char is punctuation or whitespace already
        if (/[\s\-\(\[\{]/.test(lastChar)) {
            return false;
        }
        
        // Don't add space if current char is punctuation or closing bracket
        if (/[\-\)\]\}\,\.\!\?\:\;]/.test(firstChar)) {
            return false;
        }
        
        // If same script (both Arabic or both English), add space between words
        if ((lastIsArabic && currentIsArabic) || (lastIsEnglish && currentIsEnglish)) {
            return true;
        }
        
        // If switching between Arabic and English, add space
        if ((lastIsArabic && currentIsEnglish) || (lastIsEnglish && currentIsArabic)) {
            return true;
        }
        
        // For other cases (numbers, symbols), be conservative
        return /[A-Za-z0-9\u0600-\u06FF]/.test(lastChar) && /[A-Za-z0-9\u0600-\u06FF]/.test(firstChar);
    }
    
    function resetTool() {
        pdfInput.value = '';
        pdfDoc = null;
        totalPages = 0;
        
        fileInfo.style.display = 'none';
        settingsSection.style.display = 'none';
        resultsSection.style.display = 'none';
        progressContainer.style.display = 'none';
        
        pagesOption.value = 'all';
        pageRangeGroup.style.display = 'none';
        
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
