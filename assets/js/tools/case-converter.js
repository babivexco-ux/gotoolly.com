/* ============================================
   GO TOOLLY - CASE CONVERTER
   ============================================ */

document.addEventListener('DOMContentLoaded', function() {
    const textInput = document.getElementById('text-input');
    const caseButtons = document.querySelectorAll('[data-case]');
    const copyBtn = document.getElementById('copy-btn');
    const resetBtn = document.getElementById('reset-btn');
    const resultArea = document.getElementById('result-area');
    const resultText = document.getElementById('result-text');
    
    initEventListeners();
    
    function initEventListeners() {
        caseButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                const caseType = this.dataset.case;
                convertCase(caseType);
            });
        });
        
        copyBtn.addEventListener('click', copyResult);
        resetBtn.addEventListener('click', resetTool);
    }
    
    function convertCase(type) {
        const text = textInput.value.trim();
        if (!text) {
            alert('Please enter some text');
            return;
        }
        
        let result = '';
        
        switch(type) {
            case 'uppercase':
                result = text.toUpperCase();
                break;
            case 'lowercase':
                result = text.toLowerCase();
                break;
            case 'titlecase':
                result = titleCase(text);
                break;
            case 'camelcase':
                result = camelCase(text);
                break;
            case 'snakecase':
                result = snakeCase(text);
                break;
            case 'kebabcase':
                result = kebabCase(text);
                break;
            case 'pascalcase':
                result = pascalCase(text);
                break;
            case 'sentencecase':
                result = sentenceCase(text);
                break;
        }
        
        resultText.textContent = result;
        resultArea.style.display = 'block';
    }
    
    function titleCase(str) {
        return str.replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
    }
    
    function camelCase(str) {
        return str.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
            return index === 0 ? word.toLowerCase() : word.toUpperCase();
        }).replace(/\s+/g, '');
    }
    
    function snakeCase(str) {
        return str.toLowerCase().replace(/\s+/g, '_').replace(/[^\w_]/g, '');
    }
    
    function kebabCase(str) {
        return str.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
    }
    
    function pascalCase(str) {
        return str.replace(/(?:^\w|[A-Z]|\b\w)/g, word => word.toUpperCase()).replace(/\s+/g, '');
    }
    
    function sentenceCase(str) {
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
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
        resultText.textContent = '';
    }
    
    window.caseConverter = {
        convertCase,
        copyResult,
        resetTool
    };
});
