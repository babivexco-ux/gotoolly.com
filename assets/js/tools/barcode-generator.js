/* ============================================
   GO TOOLLY - BARCODE GENERATOR
   ============================================ */

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const generateBtns = document.querySelectorAll('.generate-btn');
    const clearBtn = document.getElementById('clearBtn');
    const copyBtn = document.getElementById('copyBtn');
    const viewBtn = document.getElementById('viewBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const barcodeDisplay = document.getElementById('barcodeDisplay');
    const fullscreenModal = document.getElementById('fullscreenModal');
    const fullscreenClose = document.getElementById('fullscreenClose');
    const fullscreenImage = document.getElementById('fullscreenImage');
    const formContainers = document.querySelectorAll('.form-container');
    
    // State
    let currentBarcodeType = 'qrcode'; // Match the selected type in HTML
    let currentBarcodeImage = null;
    let currentBarcodeData = '';
    
    // Initialize
    initEventListeners();
    updateFormDisplay();
    
    function initEventListeners() {
        // Use event delegation for better performance and to handle dynamic content
        const barcodeTypesContainer = document.querySelector('.barcode-types');
        if (barcodeTypesContainer) {
            barcodeTypesContainer.addEventListener('click', function(e) {
                const target = e.target;
                
                // Handle category header clicks
                if (target.closest('.category-header')) {
                    const header = target.closest('.category-header');
                    toggleCategory(header);
                    return;
                }
                
                // Handle type option clicks
                if (target.closest('.type-option')) {
                    const option = target.closest('.type-option');
                    selectBarcodeType(option);
                    return;
                }
            });
        }
        
        // Generate buttons (support multiple placements across forms)
        if (generateBtns && generateBtns.length) {
            generateBtns.forEach(btn => btn.addEventListener('click', generateBarcode));
        }
        
        // Clear button
        if (clearBtn) {
            clearBtn.addEventListener('click', clearAll);
        }
        
        // Control buttons
        if (copyBtn) copyBtn.addEventListener('click', copyBarcode);
        if (viewBtn) viewBtn.addEventListener('click', viewFullscreen);
        if (downloadBtn) downloadBtn.addEventListener('click', downloadBarcode);
        
        // Fullscreen modal
        if (fullscreenClose) fullscreenClose.addEventListener('click', closeFullscreen);
        if (fullscreenModal) {
            fullscreenModal.addEventListener('click', (e) => {
                if (e.target === fullscreenModal) {
                    closeFullscreen();
                }
            });
        }
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && fullscreenModal && fullscreenModal.classList.contains('active')) {
                closeFullscreen();
            }
        });
    }
    
    function toggleCategory(header) {
        const category = header.dataset.category;
        const content = document.getElementById(`${category}-content`);
        
        if (!content) return;
        
        // Toggle active class on header
        header.classList.toggle('active');
        
        // Toggle active class on content
        content.classList.toggle('active');
    }
    
    function selectBarcodeType(option) {
        const selectedType = option.dataset.type;
        const selectedText = option.textContent.trim();
        
        if (!selectedType) {
            return;
        }
        
        // Remove selected class from all type options
        document.querySelectorAll('.type-option').forEach(opt => {
            opt.classList.remove('selected');
        });
        
        // Add selected class to clicked option
        option.classList.add('selected');
        
        // Update current type
        currentBarcodeType = selectedType;
        
        // Update form display
        updateFormDisplay();
        
        // Clear previous barcode
        clearBarcode();
    }
    
    function updateFormDisplay() {
        // Hide all forms
        formContainers.forEach(container => container.classList.remove('active'));
        
        // If no barcode type is selected, don't show any form
        if (!currentBarcodeType) {
            return;
        }
        
        // Show appropriate form based on barcode type
        let targetForm = 'form-generic'; // Default
        
        if (currentBarcodeType === 'vcard' || currentBarcodeType === 'mecard') {
            targetForm = 'form-vcard';
        } else if (['ean13', 'ean8', 'upca', 'upce'].includes(currentBarcodeType)) {
            targetForm = 'form-ean';
        } else if (['isbn13', 'isbn10'].includes(currentBarcodeType)) {
            targetForm = 'form-isbn';
        }
        
        const targetContainer = document.getElementById(targetForm);
        if (targetContainer) {
            targetContainer.classList.add('active');
        }
        
        // Initialize with default values for selected type
        initializeFormWithDefaults();
    }
    
    function initializeFormWithDefaults() {
        if (currentBarcodeType === 'qrcode') {
            document.getElementById('content').value = 'https://www.example.com';
        } else if (currentBarcodeType === 'vcard') {
            document.getElementById('firstName').value = 'John';
            document.getElementById('lastName').value = 'Doe';
            document.getElementById('phone').value = '+1 (555) 123-4567';
            document.getElementById('email').value = 'john@example.com';
            document.getElementById('company').value = 'Example Corp';
        } else if (currentBarcodeType === 'ean13') {
            document.getElementById('numericCode').value = '5901234123457';
        } else if (currentBarcodeType === 'isbn13') {
            document.getElementById('isbnNumber').value = '978-3-16-148410-0';
        }
    }
    
    function generateBarcode() {
        const data = collectFormData();
        
        if (!validateData(data)) {
            return;
        }
        
        currentBarcodeData = data.content;
        
        // Generate barcode based on type
        if (is2DBarcode(currentBarcodeType)) {
            generate2DBarcode(data);
        } else {
            generateLinearBarcode(data);
        }
    }
    
    function clearAll() {
        // Reset barcode type selection
        currentBarcodeType = '';
        
        // Clear all form inputs
        document.querySelectorAll('input, textarea').forEach(input => {
            input.value = '';
        });
        
        // Remove all selections from barcode types
        document.querySelectorAll('.type-option').forEach(opt => {
            opt.classList.remove('selected');
        });
        
        // Update form display and clear barcode
        updateFormDisplay();
        clearBarcode();
    }

    function collectFormData() {
        const activeForm = document.querySelector('.form-container.active');
        const data = { type: currentBarcodeType };
        
        if (activeForm.id === 'form-vcard') {
            // Collect vCard data
            const firstName = document.getElementById('firstName').value.trim();
            const lastName = document.getElementById('lastName').value.trim();
            const phone = document.getElementById('phone').value.trim();
            const email = document.getElementById('email').value.trim();
            const company = document.getElementById('company').value.trim();
            const jobTitle = document.getElementById('title') ? document.getElementById('title').value.trim() : '';
            
            data.firstName = firstName;
            data.lastName = lastName;
            data.phone = phone;
            data.email = email;
            data.company = company;
            data.jobTitle = jobTitle;
            
            // Format vCard content
            data.content = formatVCard(firstName, lastName, phone, email, company, jobTitle);
        } else if (activeForm.id === 'form-ean') {
            // Collect numeric code
            data.content = document.getElementById('numericCode').value.trim();
        } else if (activeForm.id === 'form-isbn') {
            // Collect ISBN
            data.content = document.getElementById('isbnNumber').value.trim().replace(/[-\s]/g, '');
        } else {
            // Generic content
            data.content = document.getElementById('content').value.trim();
        }
        
        return data;
    }
    
    function validateData(data) {
        if (!data.content) {
            alert('Please enter data to generate a barcode.');
            return false;
        }
        
        // Type-specific validations
        if (['ean13', 'ean8', 'upca', 'upce', 'itf14'].includes(currentBarcodeType)) {
            // Remove any non-digit characters
            const cleanedContent = data.content.replace(/\D/g, '');
            
            if (cleanedContent.length === 0) {
                alert('Please enter numeric digits for this barcode type.');
                return false;
            }
            
            const lengthRanges = {
                'ean13': { min: 12, max: 13, name: 'EAN-13', hint: '12 or 13 digits' },
                'ean8': { min: 7, max: 8, name: 'EAN-8', hint: '7 or 8 digits' },
                'upca': { min: 11, max: 12, name: 'UPC-A', hint: '11 or 12 digits' },
                'upce': { min: 6, max: 8, name: 'UPC-E', hint: '6, 7, or 8 digits' },
                'itf14': { min: 13, max: 14, name: 'ITF-14', hint: '13 or 14 digits' }
            };
            
            const range = lengthRanges[currentBarcodeType];
            if (range && (cleanedContent.length < range.min || cleanedContent.length > range.max)) {
                alert(`${range.name} requires ${range.hint}.\n\nYou entered ${cleanedContent.length} digits.`);
                return false;
            }
            
            // Update data.content with cleaned version
            data.content = cleanedContent;
        }
        
        if (['isbn13', 'isbn10'].includes(currentBarcodeType)) {
            const cleanedContent = data.content.replace(/\D/g, '');
            
            if (!/^\d+$/.test(cleanedContent)) {
                alert('Please enter only numeric digits for ISBN.');
                return false;
            }
            
            const expectedLength = currentBarcodeType === 'isbn13' ? 13 : 10;
            if (cleanedContent.length !== expectedLength && cleanedContent.length !== expectedLength - 1) {
                alert(`ISBN-${expectedLength === 13 ? '13' : '10'} requires ${expectedLength - 1} or ${expectedLength} digits.\n\nYou entered ${cleanedContent.length} digits.`);
                return false;
            }
            
            data.content = cleanedContent;
        }
        
        return true;
    }
    
    function getExpectedLength(type) {
        const lengths = {
            'ean13': 12, // JsBarcode can calculate check digit from 12
            'ean8': 7,
            'upca': 11,
            'upce': 6
        };
        return lengths[type];
    }
    
    function formatVCard(firstName, lastName, phone, email, company, jobTitle) {
        let vcard = 'BEGIN:VCARD\nVERSION:3.0\n';
        
        if (firstName || lastName) {
            vcard += `FN:${firstName} ${lastName}\n`;
            vcard += `N:${lastName};${firstName};;;\n`;
        }
        
        if (company) {
            vcard += `ORG:${company}\n`;
        }
        
        if (jobTitle) {
            vcard += `TITLE:${jobTitle}\n`;
        }
        
        if (phone) {
            vcard += `TEL;TYPE=CELL:${phone}\n`;
        }
        
        if (email) {
            vcard += `EMAIL;TYPE=WORK:${email}\n`;
        }
        
        vcard += 'END:VCARD';
        
        return vcard;
    }
    
    function is2DBarcode(type) {
        return ['qrcode', 'qrcode-mobile', 'qrcode-event', 'datamatrix', 'datamatrix-mobile', 'datamatrix-event', 'pdf417', 'vcard', 'mecard'].includes(type);
    }
    
    function generate2DBarcode(data) {
        const size = 500;
        
        // Use the QRCode library if available for better quality
        if (typeof QRCode !== 'undefined' && (currentBarcodeType.includes('qrcode') || currentBarcodeType === 'vcard' || currentBarcodeType === 'mecard')) {
            const canvas = document.createElement('canvas');
            QRCode.toCanvas(canvas, data.content, {
                width: size,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#ffffff'
                }
            }, function(error) {
                if (error) {
                    console.error('QRCode generation error:', error);
                    // Fallback to API
                    const apiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data.content)}`;
                    displayBarcode(apiUrl);
                } else {
                    const dataUrl = canvas.toDataURL('image/png');
                    displayBarcode(dataUrl);
                }
            });
        } else {
            // Fallback to API for QR codes and other 2D formats
            const apiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data.content)}`;
            displayBarcode(apiUrl);
        }
    }
    
    function generateLinearBarcode(data) {
        // Use JsBarcode library for proper barcode generation
        if (typeof JsBarcode === 'undefined') {
            console.error('JsBarcode library not loaded');
            alert('Barcode library not loaded. Please refresh the page.');
            return;
        }
        
        // Create an img element (JsBarcode works well with img elements)
        const img = document.createElement('img');
        
        // Map our barcode types to JsBarcode format names
        // Note: JsBarcode format names are case-insensitive for most formats
        const formatMap = {
            'code128': 'CODE128',
            'code39': 'CODE39',
            'code93': 'CODE128', // CODE93 may not be available in older versions, fallback to CODE128
            'itf14': 'ITF14',
            'ean13': 'EAN13',
            'ean8': 'EAN8',
            'upca': 'UPC',
            'upce': 'UPCE',
            'isbn13': 'EAN13',
            'isbn10': 'CODE128'
        };
        
        const format = formatMap[currentBarcodeType] || 'CODE128';
        
        // Validate and prepare data for specific formats
        let barcodeData = data.content;
        
        // For EAN/UPC formats, ensure proper length and numeric only
        if (['EAN13', 'EAN8', 'UPC', 'UPCE', 'ITF14'].includes(format)) {
            barcodeData = barcodeData.replace(/\D/g, ''); // Remove non-digits
        }
        
        try {
            // Use JsBarcode with the img element
            JsBarcode(img, barcodeData, {
                format: format,
                width: 3,
                height: 120,
                displayValue: true,
                fontSize: 20,
                font: 'Arial',
                fontOptions: 'bold',
                textAlign: 'center',
                textPosition: 'bottom',
                textMargin: 10,
                margin: 20,
                background: '#ffffff',
                lineColor: '#000000'
            });
            
            // The img.src is now a data URL
            displayBarcode(img.src);
            
        } catch (error) {
            console.error('Barcode generation error:', error);
            
            // Provide helpful error messages based on format
            let helpMessage = '';
            if (format === 'EAN13') {
                helpMessage = 'EAN-13 requires exactly 12 or 13 digits.';
            } else if (format === 'EAN8') {
                helpMessage = 'EAN-8 requires exactly 7 or 8 digits.';
            } else if (format === 'UPC') {
                helpMessage = 'UPC-A requires exactly 11 or 12 digits.';
            } else if (format === 'UPCE') {
                helpMessage = 'UPC-E requires 6, 7, or 8 digits.';
            } else if (format === 'ITF14') {
                helpMessage = 'ITF-14 requires exactly 13 or 14 digits.';
            } else if (format === 'CODE39') {
                helpMessage = 'CODE39 supports: A-Z, 0-9, space, and - . $ / + %';
            }
            
            alert(`Error generating ${format} barcode.\n\n${helpMessage}\n\nError: ${error.message}`);
        }
    }
    
    function displayBarcode(imageSrc) {
        const img = document.createElement('img');
        img.src = imageSrc;
        img.alt = 'Generated Barcode';
        img.className = 'barcode-image';
        
        img.onload = function() {
            currentBarcodeImage = img;
            barcodeDisplay.innerHTML = '';
            barcodeDisplay.appendChild(img);
            barcodeDisplay.classList.add('has-content');
            
            // Enable control buttons
            copyBtn.disabled = false;
            viewBtn.disabled = false;
            downloadBtn.disabled = false;
        };
        
        img.onerror = function() {
            alert('Error generating barcode. Please try again.');
            console.error('Failed to load barcode image');
        };
    }
    
    function clearBarcode() {
        barcodeDisplay.innerHTML = '<div class="placeholder-text">Select barcode type and enter data, then click "Generate Barcode" to see your result here.</div>';
        barcodeDisplay.classList.remove('has-content');
        
        // Disable control buttons
        copyBtn.disabled = true;
        viewBtn.disabled = true;
        downloadBtn.disabled = true;
        
        currentBarcodeImage = null;
        currentBarcodeData = '';
    }
    
    function copyBarcode() {
        if (!currentBarcodeImage) {
            alert('Please generate a barcode first');
            return;
        }
        
        try {
            // Copy image to clipboard
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            canvas.width = currentBarcodeImage.naturalWidth;
            canvas.height = currentBarcodeImage.naturalHeight;
            
            ctx.drawImage(currentBarcodeImage, 0, 0);
            
            canvas.toBlob(function(blob) {
                const item = new ClipboardItem({ 'image/png': blob });
                navigator.clipboard.write([item]).then(function() {
                    // Show success feedback
                    const originalText = copyBtn.innerHTML;
                    copyBtn.innerHTML = '<svg class="control-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>Copied!';
                    setTimeout(() => {
                        copyBtn.innerHTML = originalText;
                    }, 2000);
                }).catch(function(error) {
                    console.error('Copy failed:', error);
                    alert('Failed to copy barcode. Please try downloading instead.');
                });
            });
        } catch (error) {
            console.error('Copy error:', error);
            alert('Failed to copy barcode. Please try downloading instead.');
        }
    }
    
    function viewFullscreen() {
        if (!currentBarcodeImage) {
            alert('Please generate a barcode first');
            return;
        }
        
        fullscreenImage.src = currentBarcodeImage.src;
        fullscreenModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    
    function closeFullscreen() {
        fullscreenModal.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    function downloadBarcode() {
        if (!currentBarcodeImage) {
            alert('Please generate a barcode first');
            return;
        }
        
        try {
            const link = document.createElement('a');
            link.href = currentBarcodeImage.src;
            
            // Generate filename based on type and content
            const timestamp = new Date().toISOString().slice(0, 10);
            const sanitizedContent = currentBarcodeData.substring(0, 20).replace(/[^a-zA-Z0-9]/g, '_');
            link.download = `${currentBarcodeType}_${sanitizedContent}_${timestamp}.png`;
            
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            
            setTimeout(() => {
                document.body.removeChild(link);
            }, 100);
        } catch (error) {
            console.error('Download error:', error);
            alert('Error downloading barcode. Please try again.');
        }
    }
    
    // Public API
    window.barcodeGenerator = {
        generateBarcode,
        copyBarcode,
        viewFullscreen,
        downloadBarcode
    };
});