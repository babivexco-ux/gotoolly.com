/* ============================================
   GO TOOLLY - URL SLUG GENERATOR
   ============================================ */

document.addEventListener('DOMContentLoaded', function() {
    const textInput = document.getElementById('text-input');
    const generateBtn = document.getElementById('generate-btn');
    const resetBtn = document.getElementById('reset-btn');
    const copyBtn = document.getElementById('copy-btn');
    const useUnderscores = document.getElementById('use-underscores');
    const keepNumbers = document.getElementById('keep-numbers');
    const resultArea = document.getElementById('result-area');
    const resultText = document.getElementById('result-text');
    
    initEventListeners();
    
    function initEventListeners() {
        generateBtn.addEventListener('click', generateSlug);
        resetBtn.addEventListener('click', resetTool);
        copyBtn.addEventListener('click', copyResult);
    }
    
    function generateSlug() {
        const text = textInput.value.trim();
        if (!text) {
            alert('Please enter a title or text');
            return;
        }
        
        let slug = text;
        
        // Convert to lowercase
        slug = slug.toLowerCase();
        
        // Remove accents and diacritics
        slug = slug.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        
        // Replace spaces with hyphens or underscores
        const separator = useUnderscores.checked ? '_' : '-';
        slug = slug.replace(/\s+/g, separator);
        
        // Remove special characters
        if (keepNumbers.checked) {
            slug = slug.replace(/[^a-z0-9\-_]/g, '');
        } else {
            slug = slug.replace(/[^a-z\-_]/g, '');
        }
        
        // Remove multiple consecutive separators
        slug = slug.replace(new RegExp(`${separator}{2,}`, 'g'), separator);
        
        // Remove separators from start and end
        slug = slug.replace(new RegExp(`^${separator}+|${separator}+$`, 'g'), '');
        
        resultText.textContent = slug;
        resultArea.style.display = 'block';
    }
    
    function copyResult() {
        const text = resultText.textContent;
        navigator.clipboard.writeText(text).then(() => {
            copyBtn.textContent = 'Copied!';
            setTimeout(() => copyBtn.textContent = 'Copy Slug', 2000);
        });
    }
    
    function resetTool() {
        textInput.value = '';
        resultArea.style.display = 'none';
        resultText.textContent = '';
        useUnderscores.checked = false;
        keepNumbers.checked = true;
    }
});
