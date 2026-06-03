// Tesseract.js AI Receipt Scanner logic

class ReceiptScanner {
    constructor() {
        this.init();
    }

    init() {
        const fileInput = document.getElementById('receipt-file');
        const uploadBox = document.getElementById('file-upload-box');
        
        if(fileInput && uploadBox) {
            // Trigger file input when clicking box
            uploadBox.addEventListener('click', () => {
                fileInput.click();
            });

            fileInput.addEventListener('change', (e) => {
                if(e.target.files && e.target.files.length > 0) {
                    this.scanImage(e.target.files[0]);
                }
            });
        }
    }

    async scanImage(file) {
        const loadingUI = document.getElementById('scanner-loading');
        const uploadBox = document.getElementById('file-upload-box');
        
        // Show loading state
        uploadBox.classList.add('hidden');
        loadingUI.classList.remove('hidden');

        try {
            // Run Tesseract OCR on the browser
            const result = await Tesseract.recognize(file, 'eng', {
                logger: m => console.log(m) // Optional: log progress
            });

            const text = result.data.text;
            console.log("OCR Extracted Text:", text);

            this.parseData(text);

        } catch (error) {
            console.error("Scanner Error:", error);
            alert("Failed to analyze image. Please try again or enter manually.");
        } finally {
            // Reset UI
            uploadBox.classList.remove('hidden');
            loadingUI.classList.add('hidden');
            document.getElementById('scanner-modal').classList.add('hidden');
        }
    }

    parseData(text) {
        // Very basic heuristic parsing rules
        
        // 1. Find Amount (Look for $ or ₹ followed by numbers, or words like "Total", "Amount")
        let amount = 0;
        const amountRegex = /(?:total|amount|due|balance)[\s:]*[$₹]?([\d,]+\.\d{2})/i;
        const matchAmount = text.match(amountRegex);
        
        if (matchAmount && matchAmount[1]) {
            amount = parseFloat(matchAmount[1].replace(',', ''));
        } else {
            // Fallback: find the largest number with two decimals
            const allDecimals = text.match(/\b\d+\.\d{2}\b/g);
            if(allDecimals) {
                amount = Math.max(...allDecimals.map(v => parseFloat(v)));
            }
        }

        // 2. Guess Category based on keywords
        let category = 'Other';
        const lowerText = text.toLowerCase();
        if (lowerText.includes('uber') || lowerText.includes('taxi') || lowerText.includes('gas')) category = 'Transport';
        else if (lowerText.includes('walmart') || lowerText.includes('target') || lowerText.includes('grocery')) category = 'Food';
        else if (lowerText.includes('netflix') || lowerText.includes('cinema')) category = 'Entertainment';

        // 3. Open Modal and Auto-fill
        if(window.app) {
            window.app.openTransactionModal('expense'); // Default to expense for receipts
            
            if(amount > 0) {
                document.getElementById('trans_amount').value = amount;
            }
            
            document.getElementById('trans_desc').value = "Scanned Receipt";
            
            const catSelect = document.getElementById('trans_category');
            if(catSelect) catSelect.value = category;

            // Optional Haptic Feedback
            if(navigator.vibrate) navigator.vibrate(50);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.scanner = new ReceiptScanner();
});
