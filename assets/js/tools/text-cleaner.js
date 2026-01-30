/* ============================================
   GO TOOLLY - TEXT CLEANER
   ============================================ */

document.addEventListener('DOMContentLoaded', function() {
    const textInput = document.getElementById('text-input');
    const cleanBtn = document.getElementById('clean-btn');
    const resetBtn = document.getElementById('reset-btn');
    const copyBtn = document.getElementById('copy-btn');
    const resultArea = document.getElementById('result-area');
    const resultText = document.getElementById('result-text');
    const statsArea = document.getElementById('stats');
    const removeExtraSpaces = document.getElementById('remove-extra-spaces');
    const removeEmptyLines = document.getElementById('remove-empty-lines');
    const trimLines = document.getElementById('trim-lines');
    const removeSpecialChars = document.getElementById('remove-special-chars');
    
    initEventListeners();
    
    function initEventListeners() {
        cleanBtn.addEventListener('click', cleanText);
        resetBtn.addEventListener('click', resetTool);
        copyBtn.addEventListener('click', copyResult);
    }
    
    function cleanText() {
        const text = textInput.value;
        if (!text.trim()) {
            alert('Please enter some text to clean');
            return;
        }
        
        const beforeChars = text.length;
        let cleaned = text;
        
        // Remove special characters if selected
        if (removeSpecialChars.checked) {
            cleaned = cleaned.replace(/[^a-zA-Z0-9\s\.\,\!\?\-]/g, '');
        }
        
        // Trim line starts/ends if selected
        if (trimLines.checked) {
            cleaned = cleaned.split('\n').map(line => line.trim()).join('\n');
        }
        
        // Remove empty lines if selected
        if (removeEmptyLines.checked) {
            cleaned = cleaned.split('\n').filter(line => line.trim()).join('\n');
        }
        
        // Remove extra spaces if selected
        if (removeExtraSpaces.checked) {
            cleaned = cleaned.replace(/  +/g, ' ');
        }
        
        const afterChars = cleaned.length;
        const removedChars = beforeChars - afterChars;
        
        resultText.textContent = cleaned;
        resultArea.style.display = 'block';
        
        document.getElementById('before-chars').textContent = beforeChars;
        document.getElementById('after-chars').textContent = afterChars;
        document.getElementById('removed-chars').textContent = removedChars;
        statsArea.style.display = 'grid';
    }
    
    function copyResult() {
        const text = resultText.textContent;
        navigator.clipboard.writeText(text).then(() => {
            copyBtn.textContent = 'Copied!';
            setTimeout(() => copyBtn.textContent = 'Copy Result', 2000);
        });
    }
    
    function resetTool() {
        textInput.value = '';
        resultArea.style.display = 'none';
        statsArea.style.display = 'none';
        resultText.textContent = '';
    }
});
