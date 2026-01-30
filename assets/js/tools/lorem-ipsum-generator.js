/* ============================================
   GO TOOLLY - LOREM IPSUM GENERATOR
   ============================================ */

document.addEventListener('DOMContentLoaded', function() {
    const generateBtn = document.getElementById('generate-btn');
    const resetBtn = document.getElementById('reset-btn');
    const copyBtn = document.getElementById('copy-btn');
    const textType = document.getElementById('text-type');
    const quantity = document.getElementById('quantity');
    const startWithLorem = document.getElementById('start-with-lorem');
    const resultArea = document.getElementById('result-area');
    const resultText = document.getElementById('result-text');
    
    // Lorem ipsum data
    const loremWords = [
        'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit',
        'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore',
        'magna', 'aliqua', 'enim', 'ad', 'minim', 'veniam', 'quis', 'nostrud',
        'exercitation', 'ullamco', 'laboris', 'nisi', 'aliquip', 'ex', 'ea', 'commodo',
        'consequat', 'duis', 'aute', 'irure', 'in', 'reprehenderit', 'voluptate',
        'velit', 'esse', 'cillum', 'fugiat', 'nulla', 'pariatur', 'excepteur', 'sint',
        'occaecat', 'cupidatat', 'non', 'proident', 'sunt', 'culpa', 'qui', 'officia',
        'deserunt', 'mollit', 'anim', 'id', 'est', 'laborum'
    ];
    
    const sentences = [
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
        'Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
        'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.',
        'Nisi ut aliquip ex ea commodo consequat duis aute irure dolor.',
        'In reprehenderit in voluptate velit esse cillum dolore eu fugiat.',
        'Nulla pariatur excepteur sint occaecat cupidatat non proident.',
        'Sunt in culpa qui officia deserunt mollit anim id est laborum.',
        'Duis aute irure dolor in reprehenderit in voluptate velit esse.',
        'Cillum dolore eu fugiat nulla pariatur excepteur sint occaecat.',
        'Cupidatat non proident sunt in culpa qui officia deserunt mollit.'
    ];
    
    initEventListeners();
    
    function initEventListeners() {
        generateBtn.addEventListener('click', generateText);
        resetBtn.addEventListener('click', resetTool);
        copyBtn.addEventListener('click', copyResult);
    }
    
    function generateText() {
        const type = textType.value;
        const qty = parseInt(quantity.value);
        let result = '';
        
        if (startWithLorem.checked && type === 'paragraphs') {
            result = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. ';
        }
        
        if (type === 'paragraphs') {
            for (let i = 0; i < qty; i++) {
                const sentences_count = Math.floor(Math.random() * 4) + 4;
                for (let j = 0; j < sentences_count; j++) {
                    const sentenceLength = Math.floor(Math.random() * 8) + 5;
                    const sentenceWords = [];
                    for (let k = 0; k < sentenceLength; k++) {
                        sentenceWords.push(getRandomWord());
                    }
                    const sentence = sentenceWords.join(' ');
                    result += sentence.charAt(0).toUpperCase() + sentence.slice(1) + '. ';
                }
                result += '\n\n';
            }
        } else if (type === 'sentences') {
            for (let i = 0; i < qty; i++) {
                const sentenceLength = Math.floor(Math.random() * 8) + 5;
                const sentenceWords = [];
                for (let j = 0; j < sentenceLength; j++) {
                    sentenceWords.push(getRandomWord());
                }
                const sentence = sentenceWords.join(' ');
                result += sentence.charAt(0).toUpperCase() + sentence.slice(1) + '. ';
                if ((i + 1) % 3 === 0) result += '\n';
            }
        } else if (type === 'words') {
            const words = [];
            for (let i = 0; i < qty; i++) {
                words.push(getRandomWord());
            }
            result = words.join(' ');
        }
        
        resultText.textContent = result.trim();
        resultArea.style.display = 'block';
    }
    
    function getRandomWord() {
        return loremWords[Math.floor(Math.random() * loremWords.length)];
    }
    
    function copyResult() {
        const text = resultText.textContent;
        navigator.clipboard.writeText(text).then(() => {
            copyBtn.textContent = 'Copied!';
            setTimeout(() => copyBtn.textContent = 'Copy Text', 2000);
        });
    }
    
    function resetTool() {
        quantity.value = 5;
        resultArea.style.display = 'none';
        resultText.textContent = '';
    }
});
