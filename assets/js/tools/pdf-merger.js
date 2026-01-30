/* ============================================
   GO TOOLLY - PDF MERGER
   ============================================ */

// Load pdf-lib from CDN
const script = document.createElement('script');
script.src = 'https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js';
document.head.appendChild(script);

document.addEventListener('DOMContentLoaded', function() {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('pdf-input');
    const fileList = document.getElementById('file-list');
    const filesContainer = document.getElementById('files');
    const mergeBtn = document.getElementById('merge-btn');
    const resetBtn = document.getElementById('reset-btn');
    const resultArea = document.getElementById('result-area');
    const downloadBtn = document.getElementById('download-btn');
    
    let selectedFiles = [];
    let draggedIndex = null;
    
    initEventListeners();
    
    function initEventListeners() {
        dropZone.addEventListener('click', () => fileInput.click());
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.style.borderColor = '#2563eb';
            dropZone.style.backgroundColor = '#eff6ff';
        });
        dropZone.addEventListener('dragleave', () => {
            dropZone.style.borderColor = '#d1d5db';
            dropZone.style.backgroundColor = 'transparent';
        });
        dropZone.addEventListener('drop', handleDrop);
        
        fileInput.addEventListener('change', (e) => {
            const newFiles = Array.from(e.target.files).filter(f => f.type === 'application/pdf');
            if (newFiles.length !== e.target.files.length) {
                alert('Only PDF files are allowed.');
            }
            selectedFiles.push(...newFiles);
            updateFileList();
        });
        
        mergeBtn.addEventListener('click', mergePDFs);
        resetBtn.addEventListener('click', resetTool);
    }
    
    function handleDrop(e) {
        e.preventDefault();
        dropZone.style.borderColor = '#d1d5db';
        dropZone.style.backgroundColor = 'transparent';
        const files = Array.from(e.dataTransfer.files).filter(f => f.type === 'application/pdf');
        if (files.length !== e.dataTransfer.files.length) {
            alert('Only PDF files are allowed.');
        }
        selectedFiles.push(...files);
        updateFileList();
    }
    
    function updateFileList() {
        if (selectedFiles.length === 0) {
            fileList.style.display = 'none';
            return;
        }
        
        filesContainer.innerHTML = selectedFiles.map((file, index) => `
            <div class="file-item" draggable="true" data-index="${index}">
                <span>${index + 1}. ${file.name} (${(file.size / 1024).toFixed(1)} KB)</span>
                <button class="btn btn-small" type="button" onclick="removeFile(${index})">Remove</button>
            </div>
        `).join('');
        
        // Add drag and drop handlers for reordering
        const items = filesContainer.querySelectorAll('.file-item');
        items.forEach(item => {
            item.addEventListener('dragstart', (e) => {
                draggedIndex = parseInt(e.target.closest('.file-item').dataset.index);
            });
            item.addEventListener('dragover', (e) => {
                e.preventDefault();
            });
            item.addEventListener('drop', (e) => {
                e.preventDefault();
                const targetIndex = parseInt(e.target.closest('.file-item').dataset.index);
                if (draggedIndex !== null && draggedIndex !== targetIndex) {
                    const temp = selectedFiles[draggedIndex];
                    selectedFiles[draggedIndex] = selectedFiles[targetIndex];
                    selectedFiles[targetIndex] = temp;
                    updateFileList();
                }
            });
        });
        
        fileList.style.display = 'block';
    }
    
    async function mergePDFs() {
        if (selectedFiles.length < 2) {
            alert('Please select at least 2 PDF files to merge');
            return;
        }
        
        if (typeof PDFLib === 'undefined') {
            alert('PDF library is loading. Please wait and try again.');
            return;
        }
        
        mergeBtn.disabled = true;
        mergeBtn.textContent = 'Merging...';
        
        try {
            const { PDFDocument } = PDFLib;
            const mergedPdf = await PDFDocument.create();
            
            for (const file of selectedFiles) {
                const arrayBuffer = await file.arrayBuffer();
                const pdf = await PDFDocument.load(arrayBuffer);
                const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
                copiedPages.forEach(page => mergedPdf.addPage(page));
            }
            
            const pdfBytes = await mergedPdf.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            
            downloadBtn.href = url;
            downloadBtn.download = 'merged-document.pdf';
            
            fileList.style.display = 'none';
            resultArea.style.display = 'block';
            
            // Automatically start the download
            downloadBtn.addEventListener('click', function(e) {
                e.preventDefault();
                const link = document.createElement('a');
                link.href = url;
                link.download = 'merged-document.pdf';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }, { once: true });
            
        } catch (error) {
            alert('Error merging PDFs: ' + error.message);
            console.error(error);
        } finally {
            mergeBtn.disabled = false;
            mergeBtn.textContent = 'Merge PDFs';
        }
    }
    
    function resetTool() {
        selectedFiles = [];
        fileInput.value = '';
        fileList.style.display = 'none';
        resultArea.style.display = 'none';
        filesContainer.innerHTML = '';
        draggedIndex = null;
    }
    
    window.removeFile = function(index) {
        selectedFiles.splice(index, 1);
        updateFileList();
        if (selectedFiles.length === 0) {
            fileList.style.display = 'none';
        }
    };
    
    window.pdfMerger = {
        mergePDFs,
        resetTool
    };
});
