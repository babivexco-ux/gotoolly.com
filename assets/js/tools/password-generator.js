/* ============================================
   GO TOOLLY - PASSWORD GENERATOR
   ============================================ */

document.addEventListener('DOMContentLoaded', function() {
    const lengthSlider = document.getElementById('password-length');
    const lengthDisplay = document.getElementById('length-display');
    const generateBtn = document.getElementById('generate-btn');
    const generateMultipleBtn = document.getElementById('generate-multiple-btn');
    const copyBtn = document.getElementById('copy-btn');
    const passwordText = document.getElementById('password-text');
    const strengthBar = document.getElementById('strength-bar');
    const strengthText = document.getElementById('strength-text');
    
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    initEventListeners();
    
    function initEventListeners() {
        lengthSlider.addEventListener('input', () => {
            lengthDisplay.textContent = lengthSlider.value;
        });
        
        generateBtn.addEventListener('click', generatePassword);
        generateMultipleBtn.addEventListener('click', generateMultiple);
        copyBtn.addEventListener('click', copyPassword);
    }
    
    function generatePassword() {
        const length = parseInt(lengthSlider.value);
        let characters = '';
        
        const useLowercase = document.querySelector('input[name="lowercase"]').checked;
        const useUppercase = document.querySelector('input[name="uppercase"]').checked;
        const useNumbers = document.querySelector('input[name="numbers"]').checked;
        const useSymbols = document.querySelector('input[name="symbols"]').checked;
        
        if (useLowercase) characters += lowercase;
        if (useUppercase) characters += uppercase;
        if (useNumbers) characters += numbers;
        if (useSymbols) characters += symbols;
        
        if (!characters) {
            alert('Select at least one character type');
            return;
        }
        
        let password = '';
        for (let i = 0; i < length; i++) {
            password += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        
        passwordText.textContent = password;
        updateStrength(password);
    }
    
    function generateMultiple() {
        for (let i = 0; i < 5; i++) {
            generatePassword();
            // In real implementation, add to list
        }
    }
    
    function updateStrength(password) {
        let strength = 0;
        let strengthLabel = 'Weak';
        
        if (password.length >= 8) strength += 25;
        if (password.length >= 12) strength += 25;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
        if (/\d/.test(password)) strength += 12.5;
        if (/[!@#$%^&*]/.test(password)) strength += 12.5;
        
        if (strength >= 75) strengthLabel = 'Strong';
        else if (strength >= 50) strengthLabel = 'Medium';
        
        strengthBar.style.width = strength + '%';
        strengthBar.style.backgroundColor = strength < 50 ? '#ef4444' : strength < 75 ? '#f59e0b' : '#10b981';
        strengthText.textContent = strengthLabel;
    }
    
    function copyPassword() {
        const password = passwordText.textContent;
        navigator.clipboard.writeText(password).then(() => {
            copyBtn.textContent = 'Copied!';
            setTimeout(() => copyBtn.textContent = 'Copy', 2000);
        });
    }
    
    window.passwordGenerator = {
        generatePassword,
        copyPassword
    };
});
