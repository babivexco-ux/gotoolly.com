/* ============================================
   GO TOOLLY - WORD COUNTER
   ============================================ */

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const textInput = document.getElementById('text-input');
    const resetBtn = document.getElementById('reset-btn');
    const wordCount = document.getElementById('word-count');
    const charCount = document.getElementById('char-count');
    const charNoSpace = document.getElementById('char-no-space');
    const sentenceCount = document.getElementById('sentence-count');
    const paragraphCount = document.getElementById('paragraph-count');
    const readingTime = document.getElementById('reading-time');
    const statsArea = document.getElementById('stats');
    
    // Initialize
    initEventListeners();
    
    function initEventListeners() {
        // Text input events - update on input and paste
        textInput.addEventListener('input', debounce(updateCounts, 300));
        textInput.addEventListener('paste', function() {
            setTimeout(updateCounts, 100);
        });
        
        // Reset button
        resetBtn.addEventListener('click', clearText);
    }
    
    function updateCounts() {
        const text = textInput.value;
        
        // Show stats container if there's text
        if (text.trim().length > 0) {
            statsArea.style.display = 'grid';
        } else {
            statsArea.style.display = 'none';
        }
        
        // Word count (split by whitespace, filter out empty strings)
        const words = text.trim().split(/\s+/).filter(word => word.length > 0);
        const wordCountValue = text.trim() === '' ? 0 : words.length;
        
        // Character counts
        const charCountValue = text.length;
        const charNoSpaceValue = text.replace(/\s+/g, '').length;
        
        // Sentence count (split by . ! ?)
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const sentenceCountValue = text.trim() === '' ? 0 : sentences.length;
        
        // Paragraph count (split by newlines, filter out empty paragraphs)
        const paragraphs = text.split(/\n+/).filter(p => p.trim().length > 0);
        const paragraphCountValue = text.trim() === '' ? 0 : paragraphs.length;
        
        // Reading time (average 238 words per minute)
        const readingTimeValue = wordCountValue > 0 ? 
            Math.max(1, Math.ceil(wordCountValue / 238)) : 0;
        
        // Update UI with proper formatting
        wordCount.textContent = wordCountValue.toLocaleString();
        charCount.textContent = charCountValue.toLocaleString();
        charNoSpace.textContent = charNoSpaceValue.toLocaleString();
        sentenceCount.textContent = sentenceCountValue.toLocaleString();
        paragraphCount.textContent = paragraphCountValue.toLocaleString();
        readingTime.textContent = readingTimeValue > 0 ? 
            `${readingTimeValue} min${readingTimeValue !== 1 ? 's' : ''}` : '0 min';
    }
    
    function clearText() {
        textInput.value = '';
        textInput.focus();
        statsArea.style.display = 'none';
    }
    
    // Debounce utility function
    function debounce(func, delay) {
        let timeoutId;
        return function(...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func(...args), delay);
        };
    }
    
    // Export functionality
    window.wordCounter = {
        getStats: function(text) {
            const words = text.trim().split(/\s+/).filter(word => word.length > 0);
            const wordCountValue = text.trim() === '' ? 0 : words.length;
            const charCountValue = text.length;
            const charNoSpaceValue = text.replace(/\s+/g, '').length;
            const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
            const sentenceCountValue = text.trim() === '' ? 0 : sentences.length;
            const paragraphs = text.split(/\n+/).filter(p => p.trim().length > 0);
            const paragraphCountValue = text.trim() === '' ? 0 : paragraphs.length;
            
            return {
                words: wordCountValue,
                characters: charCountValue,
                charactersNoSpaces: charNoSpaceValue,
                sentences: sentenceCountValue,
                paragraphs: paragraphCountValue,
                readingTime: wordCountValue > 0 ? Math.max(1, Math.ceil(wordCountValue / 238)) : 0
            };
        }
    };
});