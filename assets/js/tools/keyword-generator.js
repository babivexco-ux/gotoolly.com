/* ============================================
   GO TOOLLY - KEYWORD GENERATOR
   ============================================ */

function initKeywordGenerator() {
    const topicInput = document.getElementById('topic-input');
    const generateBtn = document.getElementById('generate-btn');
    const resultsArea = document.getElementById('results-area');
    const keywordsList = document.getElementById('keywords-list');
    const copyAllBtn = document.getElementById('copy-all-btn');
    const resetBtn = document.getElementById('reset-btn');
    
    const modifiers = ['best', 'cheap', 'free', 'top', 'easy', 'simple', 'fast', 'reliable', 'affordable'];
    const questions = ['how to', 'what is', 'where to', 'why', 'when to', 'best way to'];
    
    function initEventListeners() {
        generateBtn.addEventListener('click', generateKeywords);
        copyAllBtn.addEventListener('click', copyAllKeywords);
        resetBtn.addEventListener('click', resetTool);
    }
    
    function generateKeywords() {
        const topic = topicInput.value.trim();
        if (!topic) {
            alert('Please enter a topic');
            return;
        }
        
        let keywords = [];
        
        // Exact
        if (document.querySelector('input[name="exact"]').checked) {
            keywords.push(topic);
        }
        
        // Long-tail
        if (document.querySelector('input[name="long-tail"]').checked) {
            modifiers.forEach(mod => {
                keywords.push(`${mod} ${topic}`);
                keywords.push(`${topic} ${mod}`);
            });
        }
        
        // Questions
        if (document.querySelector('input[name="questions"]').checked) {
            questions.forEach(q => {
                keywords.push(`${q} ${topic}`);
            });
        }
        
        // Modifiers (already included in long-tail)
        
        displayKeywords(keywords);
    }
    
    function displayKeywords(keywords) {
        // Render keywords using DOM nodes to avoid HTML injection issues (safer on mobile)
        keywordsList.innerHTML = '';

        if (!keywords || keywords.length === 0) {
            resultsArea.style.display = 'none';
            return;
        }

        keywords.forEach(kw => {
            const item = document.createElement('div');
            item.className = 'keyword-item';

            const span = document.createElement('span');
            span.textContent = kw;

            const btn = document.createElement('button');
            btn.className = 'btn btn-small';
            btn.type = 'button';
            btn.textContent = 'Copy';
            btn.addEventListener('click', () => {
                navigator.clipboard.writeText(kw).then(() => {
                    const original = btn.textContent;
                    btn.textContent = 'Copied!';
                    setTimeout(() => btn.textContent = original, 2000);
                }).catch(() => {
                    // fallback
                    alert('Could not copy to clipboard');
                });
            });

            item.appendChild(span);
            item.appendChild(btn);
            keywordsList.appendChild(item);
        });

        resultsArea.style.display = 'block';
        // Ensure the results are visible on small screens
        resultsArea.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    function copyAllKeywords() {
        const keywords = Array.from(document.querySelectorAll('.keyword-item span'))
            .map(el => el.textContent)
            .join('\n');
        
        navigator.clipboard.writeText(keywords).then(() => {
            copyAllBtn.textContent = 'Copied!';
            setTimeout(() => copyAllBtn.textContent = 'Copy All', 2000);
        });
    }
    
    function resetTool() {
        topicInput.value = '';
        resultsArea.style.display = 'none';
        keywordsList.innerHTML = '';
    }
    
    // Initialize event listeners after helper functions are declared
    initEventListeners();

    window.copyKeyword = function(text) {
        navigator.clipboard.writeText(text);
    };
    
    window.keywordGenerator = {
        generateKeywords,
        copyAllKeywords,
        resetTool
    };
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initKeywordGenerator);
} else {
    initKeywordGenerator();
}
