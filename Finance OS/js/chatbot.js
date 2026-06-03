// Finance GPT - Simple NLP Chatbot

class Chatbot {
    constructor() {
        this.messagesDiv = document.getElementById('chat-messages');
        this.chatForm = document.getElementById('chat-form');
        this.chatInput = document.getElementById('chat-input');
        
        this.overlay = document.getElementById('chat-overlay');
        this.panel = document.getElementById('ai-chat-panel');
        
        this.init();
    }

    init() {
        if(!this.chatForm) return;

        this.chatForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const text = this.chatInput.value.trim();
            if(text) {
                this.addMessage(text, 'user');
                this.chatInput.value = '';
                this.processMessage(text);
            }
        });

        // Close chat
        document.querySelectorAll('.close-chat-btn').forEach(btn => {
            btn.addEventListener('click', () => this.closeChat());
        });
        this.overlay.addEventListener('click', () => this.closeChat());
    }

    openChat() {
        this.overlay.classList.remove('hidden');
        this.panel.classList.add('open');
        this.chatInput.focus();
    }

    closeChat() {
        this.overlay.classList.add('hidden');
        this.panel.classList.remove('open');
    }

    addMessage(text, sender = 'bot') {
        const div = document.createElement('div');
        div.className = `chat-bubble ${sender}-bubble`;
        div.innerHTML = text;
        this.messagesDiv.appendChild(div);
        
        // Auto scroll to bottom
        this.messagesDiv.scrollTop = this.messagesDiv.scrollHeight;
    }

    async processMessage(msg) {
        const text = msg.toLowerCase();
        const sym = window.app ? window.app.sym : '₹';
        
        // Add artificial delay for typing effect
        await new Promise(resolve => setTimeout(resolve, 600));

        // Helper to parse amount (handles commas like 1,000)
        const getAmount = (str) => {
            const match = str.replace(/,/g, '').match(/\b\d+(\.\d{1,2})?\b/);
            return match ? parseFloat(match[0]) : null;
        };

        // 1. ADD TRANSACTION INTENT (Income or Expense)
        if (text.includes('add') || text.includes('spent') || text.includes('bought') || text.includes('received') || text.includes('earned') || text.includes('got')) {
            const amount = getAmount(text);
            
            if (amount) {
                // Determine if it's income
                let type = 'expense';
                if (text.includes('salary') || text.includes('earned') || text.includes('received') || text.includes('income')) {
                    type = 'income';
                }

                // Determine category
                let category = 'Other';
                if (type === 'expense') {
                    if (text.includes('food') || text.includes('groc') || text.includes('dinner') || text.includes('eat') || text.includes('meal')) category = 'Food';
                    else if (text.includes('transport') || text.includes('taxi') || text.includes('uber') || text.includes('gas') || text.includes('bus') || text.includes('train')) category = 'Transport';
                    else if (text.includes('shop') || text.includes('cloth') || text.includes('shoe') || text.includes('buy')) category = 'Shopping';
                    else if (text.includes('movie') || text.includes('entertain') || text.includes('game') || text.includes('fun')) category = 'Entertainment';
                    else if (text.includes('bill') || text.includes('electric') || text.includes('water') || text.includes('internet')) category = 'Bills';
                    else if (text.includes('health') || text.includes('doctor') || text.includes('medicine') || text.includes('pharmacy')) category = 'Healthcare';
                    else if (text.includes('school') || text.includes('education') || text.includes('book') || text.includes('course')) category = 'Education';
                    else if (text.includes('rent') || text.includes('hous') || text.includes('apart')) category = 'Housing';
                } else {
                    if (text.includes('salary') || text.includes('pay') || text.includes('job')) category = 'Salary';
                    else if (text.includes('invest') || text.includes('stock') || text.includes('dividend')) category = 'Investments';
                    else if (text.includes('freelance') || text.includes('gig')) category = 'Freelance';
                    else if (text.includes('gift') || text.includes('present')) category = 'Gifts';
                }

                // Add to DB
                if (window.app && typeof db !== 'undefined') {
                    const transaction = { 
                        type: type, 
                        amount: amount, 
                        desc: 'Added via Chatbot', 
                        category: category, 
                        date: new Date().toISOString().split('T')[0], 
                        deleted: false 
                    };
                    await db.addTransaction(transaction);
                    await window.app.loadData(); // refresh UI
                    
                    const actionWord = type === 'income' ? 'income' : 'expense';
                    this.addMessage(`✅ I've added an ${actionWord} of <strong>${sym}${amount}</strong> under <strong>${category}</strong>.`);
                    if(navigator.vibrate) navigator.vibrate(50);
                    return;
                }
            } else {
                this.addMessage(`I see you want to add a transaction, but I couldn't find the amount. Please include a number, like <em>"Add 500 for food"</em>.`);
                return;
            }
        }

        // 2. QUERY INTENT: Net Balance / Worth
        if (text.includes('balance') || text.includes('net worth') || text.includes('how much money do i have') || text.includes('left')) {
            if (window.app) {
                let inc = 0, exp = 0;
                window.app.transactions.forEach(t => {
                    if(t.type === 'income') inc += t.amount;
                    else exp += t.amount;
                });
                const bal = inc - exp;
                this.addMessage(`Your current net balance is <strong>${sym}${bal.toFixed(2)}</strong>. You have earned ${sym}${inc.toFixed(2)} and spent ${sym}${exp.toFixed(2)}.`);
                return;
            }
        }

        // 3. QUERY INTENT: "How much did I spend on [Category]" or "Total expenses/income"
        if (text.includes('how much') || text.includes('total') || text.includes('spend') || text.includes('earn')) {
            if (window.app) {
                const txs = window.app.transactions;
                const categories = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Healthcare', 'Education', 'Housing', 'Salary', 'Investments', 'Freelance', 'Gifts'];
                let foundCat = null;
                
                for(let cat of categories) {
                    if(text.includes(cat.toLowerCase())) {
                        foundCat = cat;
                        break;
                    }
                }

                if (foundCat) {
                    const isInc = ['Salary', 'Investments', 'Freelance', 'Gifts'].includes(foundCat);
                    const total = txs.filter(t => t.type === (isInc ? 'income' : 'expense') && t.category === foundCat)
                                     .reduce((sum, t) => sum + t.amount, 0);
                    
                    const actionWord = isInc ? 'earned' : 'spent';
                    this.addMessage(`You have ${actionWord} <strong>${sym}${total.toFixed(2)}</strong> on ${foundCat}.`);
                    return;
                } else {
                    if(text.includes('earn') || text.includes('income')) {
                        const totalInc = txs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
                        this.addMessage(`Your total income is <strong>${sym}${totalInc.toFixed(2)}</strong>.`);
                    } else {
                        const totalExpense = txs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
                        this.addMessage(`Your total expenses are <strong>${sym}${totalExpense.toFixed(2)}</strong>.`);
                    }
                    return;
                }
            }
        }

        // 4. QUERY INTENT: "Biggest expense"
        if (text.includes('biggest') || text.includes('largest') || text.includes('highest')) {
            if (window.app && window.app.transactions.length > 0) {
                const expenses = window.app.transactions.filter(t => t.type === 'expense');
                if(expenses.length > 0) {
                    const biggest = expenses.reduce((max, t) => (t.amount > max.amount ? t : max), expenses[0]);
                    this.addMessage(`Your biggest expense was <strong>${biggest.desc}</strong> for <strong>${sym}${biggest.amount}</strong>.`);
                    return;
                } else {
                    this.addMessage("You don't have any expenses yet!");
                    return;
                }
            }
        }

        // Catch-all simple responses
        if (text === 'yes' || text === 'ok' || text === 'sure' || text === 'thanks' || text === 'thank you') {
            this.addMessage("You're welcome! What would you like to do next?");
            return;
        }
        if (text === 'hello' || text === 'hi' || text === 'hey') {
            this.addMessage("Hello! I'm ready to help you manage your finances. Try saying 'Add 500 for groceries'.");
            return;
        }

        // Default response
        this.addMessage("I'm not exactly sure how to help with that. Try asking me <em>'What is my balance?'</em> or tell me to <em>'Add 200 for a taxi'</em>.");
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.chatbot = new Chatbot();
});
