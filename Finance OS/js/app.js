// Main Application Logic

const CATEGORIES = {
    expense: ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Healthcare', 'Education', 'Housing', 'Other'],
    income: ['Salary', 'Investments', 'Freelance', 'Gifts', 'Other']
};

const CURRENCIES = {
    'INR': '₹',
    'USD': '$',
    'EUR': '€',
    'GBP': '£'
};

class FinanceApp {
    constructor() {
        this.currentView = 'dashboard-view';
        this.transactions = []; // Active
        this.trash = []; // Deleted
        this.currency = localStorage.getItem('finance_currency') || 'INR';
        this.sym = CURRENCIES[this.currency];
        this.itemToDelete = null; // Temp holder for confirm modal
        
        // DOM Elements
        this.elements = {
            navItems: document.querySelectorAll('.nav-item'),
            views: document.querySelectorAll('.view'),
            pageTitle: document.getElementById('page-title'),
            quickAddBtn: document.getElementById('btn-quick-add'),
            scanBtn: document.getElementById('btn-scan-receipt'),
            mobileScanBtn: document.getElementById('mobile-scanner-btn'),
            
            // Modals
            transactionModal: document.getElementById('transaction-modal'),
            scannerModal: document.getElementById('scanner-modal'),
            confirmModal: document.getElementById('confirm-modal'),
            closeModalBtns: document.querySelectorAll('.close-modal'),
            
            // Forms
            transactionForm: document.getElementById('transaction-form'),
            transTypeRadios: document.querySelectorAll('input[name="trans_type"]'),
            transCategorySelect: document.getElementById('trans_category'),
            
            // Dashboard Elements
            dashIncome: document.getElementById('dash-income'),
            dashExpense: document.getElementById('dash-expense'),
            dashBalance: document.getElementById('dash-balance'),
            dashSavingsRate: document.getElementById('dash-savings-rate'),
            recentTransTableBody: document.querySelector('#recent-transactions-table tbody'),
            noDataMsg: document.getElementById('no-data-msg'),
            
            // Transactions View
            allTransTableBody: document.querySelector('#all-transactions-table tbody'),
            filterType: document.getElementById('filter-type'),
            filterCategory: document.getElementById('filter-category'),

            // Trash View
            trashTableBody: document.querySelector('#trash-table tbody'),
            trashEmptyMsg: document.getElementById('trash-empty-msg'),
            btnEmptyTrash: document.getElementById('btn-empty-trash'),

            // Settings View
            settingCurrency: document.getElementById('setting-currency'),
            btnSaveSettings: document.getElementById('btn-save-settings')
        };

        this.init();
    }

    async init() {
        await db.init();
        
        // Force load rich demo data once for this version
        if (!localStorage.getItem('demo_loaded_v2')) {
            await db.seedRichDemoData();
            localStorage.setItem('demo_loaded_v2', 'true');
        } else {
            await db.seedMockDataIfEmpty();
        }
        
        // Setup Event Listeners
        this.setupEventListeners();
        
        // Ensure UI matches loaded settings
        this.elements.settingCurrency.value = this.currency;
        document.querySelectorAll('.currency-symbol').forEach(el => el.innerText = this.sym);
        
        // Check and apply saved theme
        const savedTheme = localStorage.getItem('finance_theme');
        if (savedTheme === 'light') {
            document.body.classList.add('light-theme');
            document.body.classList.remove('dark-theme');
            const themeIcon = document.querySelector('#btn-theme-toggle i');
            if(themeIcon) {
                themeIcon.classList.remove('fa-moon');
                themeIcon.classList.add('fa-sun');
            }
        }

        // Initial populates
        this.updateCategoryDropdown('expense');
        
        // Finalize initialization by loading data and rendering
        await this.loadData();
    }

    async loadData() {
        this.transactions = await db.getTransactions(false); // Active
        this.trash = await db.getTransactions(true); // Deleted
        
        this.renderDashboard();
        this.renderTransactionsList();
        this.renderTrashList();
        
        // Init Charts (defined in charts.js)
        if(window.initCharts) window.initCharts(this.transactions);
        if(window.generateInsights) window.generateInsights(this.transactions);
    }

    setupEventListeners() {
        // Navigation
        this.elements.navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const target = item.dataset.target;
                if(target) {
                    e.preventDefault();
                    let title = item.querySelector('span') ? item.querySelector('span').innerText : 'Dashboard';
                    if(target === 'settings-view') title = 'Settings';
                    this.switchView(target, title);
                    this.elements.navItems.forEach(nav => nav.classList.remove('active'));
                    item.classList.add('active');
                    if(navigator.vibrate) navigator.vibrate(20);
                    
                    // Handle Sidebar state
                    const sidebar = document.getElementById('sidebar');
                    const sidebarOverlay = document.getElementById('sidebar-overlay');
                    if (window.innerWidth <= 768 && sidebar && sidebarOverlay) {
                        sidebar.classList.add('closed');
                        sidebarOverlay.classList.add('hidden');
                    } else if (window.innerWidth > 768 && sidebar) {
                        sidebar.classList.add('collapsed');
                    }
                }
            });
        });

        // Mobile Settings Button
        const mobileSettingsBtn = document.getElementById('mobile-settings-btn');
        if (mobileSettingsBtn) {
            mobileSettingsBtn.addEventListener('click', (e) => {
                this.switchView('settings-view', 'Settings');
                this.elements.navItems.forEach(nav => nav.classList.remove('active'));
            });
        }
        
        // Hamburger Menu Logic
        const btnHamburger = document.getElementById('btn-hamburger');
        const sidebar = document.getElementById('sidebar');
        const sidebarOverlay = document.getElementById('sidebar-overlay');
        const btnCloseSidebar = document.getElementById('btn-close-sidebar');

        const toggleSidebar = () => {
            if (window.innerWidth <= 768) {
                sidebar.classList.toggle('closed');
                sidebarOverlay.classList.toggle('hidden');
            } else {
                sidebar.classList.toggle('collapsed');
            }
        };

        if (btnHamburger) btnHamburger.addEventListener('click', toggleSidebar);
        if (btnCloseSidebar) btnCloseSidebar.addEventListener('click', toggleSidebar);
        
        // Avatar Click Toggle (acts like hamburger)
        const userAvatarBtn = document.getElementById('user-avatar-btn');
        if (userAvatarBtn) userAvatarBtn.addEventListener('click', toggleSidebar);
        if (sidebarOverlay) {
            sidebarOverlay.addEventListener('click', () => {
                sidebar.classList.add('closed');
                sidebarOverlay.classList.add('hidden');
            });
        }

        // Modals
        this.elements.quickAddBtn.addEventListener('click', () => this.openTransactionModal('expense'));
        if(this.elements.scanBtn) this.elements.scanBtn.addEventListener('click', () => this.openScannerModal());
        if(this.elements.mobileScanBtn) this.elements.mobileScanBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.openScannerModal();
        });
        
        // AI Chatbot Button
        const aiBtn = document.getElementById('btn-ai-chat');
        if (aiBtn) {
            aiBtn.addEventListener('click', () => {
                if(window.chatbot) window.chatbot.openChat();
            });
        }
        
        // Theme Toggle Button
        const themeBtn = document.getElementById('btn-theme-toggle');
        if (themeBtn) {
            themeBtn.addEventListener('click', () => this.toggleTheme());
        }

        this.elements.closeModalBtns.forEach(btn => {
            btn.addEventListener('click', () => this.elements.transactionModal.classList.add('hidden'));
        });
        
        document.querySelector('.close-scanner-modal').addEventListener('click', () => {
            this.elements.scannerModal.classList.add('hidden');
        });

        // Form Type Change -> Update Categories
        this.elements.transTypeRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.updateCategoryDropdown(e.target.value);
            });
        });

        // Form Submit
        this.elements.transactionForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const type = document.querySelector('input[name="trans_type"]:checked').value;
            const amount = parseFloat(document.getElementById('trans_amount').value);
            const desc = document.getElementById('trans_desc').value;
            const category = document.getElementById('trans_category').value;
            const date = document.getElementById('trans_date').value;

            const transaction = { type, amount, desc, category, date, deleted: false };
            
            await db.addTransaction(transaction);
            
            if(navigator.vibrate) navigator.vibrate([30, 50, 30]); // Success pattern

            await this.loadData(); // Re-fetches and re-renders everything
            
            this.elements.transactionModal.classList.add('hidden');
            this.elements.transactionForm.reset();
        });

        // View All button
        document.getElementById('btn-view-all-trans').addEventListener('click', () => {
            document.querySelector('.nav-item[data-target="transactions-view"]').click();
        });

        // Filters in Transactions View
        this.elements.filterType.addEventListener('change', () => this.renderTransactionsList());
        this.elements.filterCategory.addEventListener('change', () => this.renderTransactionsList());

        // Custom Confirm Delete Logic
        document.getElementById('btn-cancel-delete').addEventListener('click', () => {
            this.elements.confirmModal.classList.add('hidden');
            this.itemToDelete = null;
        });

        document.getElementById('btn-confirm-delete').addEventListener('click', async () => {
            if(this.itemToDelete) {
                await db.softDeleteTransaction(this.itemToDelete);
                if(navigator.vibrate) navigator.vibrate(50);
                this.elements.confirmModal.classList.add('hidden');
                this.itemToDelete = null;
                await this.loadData();
            }
        });

        // Empty Trash Logic
        this.elements.btnEmptyTrash.addEventListener('click', async () => {
            if(confirm("Permanently delete all items in trash? This cannot be undone.")) {
                await db.emptyTrash();
                await this.loadData();
            }
        });

        // Settings Save
        this.elements.btnSaveSettings.addEventListener('click', () => {
            const cur = this.elements.settingCurrency.value;
            localStorage.setItem('finance_currency', cur);
            this.currency = cur;
            this.sym = CURRENCIES[cur];
            
            document.querySelectorAll('.currency-symbol').forEach(el => el.innerText = this.sym);
            this.loadData(); // Re-render with new currency
            
            const btn = this.elements.btnSaveSettings;
            const origText = btn.innerText;
            btn.innerText = "Saved!";
            setTimeout(() => btn.innerText = origText, 2000);
        });
    }

    switchView(viewId, title) {
        this.elements.views.forEach(view => {
            if (view.id === viewId) {
                view.classList.add('active');
                view.classList.remove('hidden');
            } else {
                view.classList.remove('active');
                view.classList.add('hidden');
            }
        });
        this.elements.pageTitle.innerText = title;
        
        if (viewId === 'transactions-view') {
            this.populateFilterCategories();
            this.renderTransactionsList();
        }
    }

    toggleTheme() {
        const body = document.body;
        const icon = document.querySelector('#btn-theme-toggle i');
        
        if (body.classList.contains('light-theme')) {
            // Switch to Dark Theme
            body.classList.remove('light-theme');
            body.classList.add('dark-theme');
            localStorage.setItem('finance_theme', 'dark');
            if(icon) {
                icon.classList.remove('fa-sun');
                icon.classList.add('fa-moon');
            }
        } else {
            // Switch to Light Theme
            body.classList.add('light-theme');
            body.classList.remove('dark-theme');
            localStorage.setItem('finance_theme', 'light');
            if(icon) {
                icon.classList.remove('fa-moon');
                icon.classList.add('fa-sun');
            }
        }
    }

    openTransactionModal(type = 'expense') {
        document.getElementById('trans_date').value = new Date().toISOString().split('T')[0];
        document.querySelector(`input[name="trans_type"][value="${type}"]`).checked = true;
        this.updateCategoryDropdown(type);
        this.elements.transactionModal.classList.remove('hidden');
    }

    openScannerModal() {
        this.elements.scannerModal.classList.remove('hidden');
    }

    updateCategoryDropdown(type) {
        const select = this.elements.transCategorySelect;
        select.innerHTML = '';
        CATEGORIES[type].forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.innerText = cat;
            select.appendChild(option);
        });
    }

    populateFilterCategories() {
        const select = this.elements.filterCategory;
        select.innerHTML = '<option value="all">All Categories</option>';
        const allCats = [...CATEGORIES.expense, ...CATEGORIES.income];
        const uniqueCats = [...new Set(allCats)];
        
        uniqueCats.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.innerText = cat;
            select.appendChild(option);
        });
    }

    renderDashboard() {
        let totalIncome = 0;
        let totalExpense = 0;

        this.transactions.forEach(t => {
            if (t.type === 'income') totalIncome += t.amount;
            else if (t.type === 'expense') totalExpense += t.amount;
        });

        const netBalance = totalIncome - totalExpense;
        const savingsRate = totalIncome > 0 ? ((netBalance / totalIncome) * 100).toFixed(1) : 0;

        this.elements.dashIncome.innerText = `${this.sym}${totalIncome.toFixed(2)}`;
        this.elements.dashExpense.innerText = `${this.sym}${totalExpense.toFixed(2)}`;
        this.elements.dashBalance.innerText = `${this.sym}${netBalance.toFixed(2)}`;
        this.elements.dashSavingsRate.innerText = `${savingsRate}%`;

        // Update Health Score
        const healthScoreVal = document.getElementById('health-score-val');
        const healthScoreDesc = document.getElementById('health-score-desc');
        
        if(healthScoreVal) {
            let score = 50;
            if(savingsRate > 20) score += 20;
            if(savingsRate > 40) score += 15;
            if(netBalance > 0) score += 15;
            
            healthScoreVal.innerText = score;
            
            if(score > 80) healthScoreDesc.innerText = "Excellent Financial Health";
            else if(score > 60) healthScoreDesc.innerText = "Good Financial Health";
            else if(score > 40) healthScoreDesc.innerText = "Needs Improvement";
            else healthScoreDesc.innerText = "Critical Condition";
        }

        // Render Recent Transactions (Limit 5)
        const tbody = this.elements.recentTransTableBody;
        tbody.innerHTML = '';
        
        if (this.transactions.length === 0) {
            this.elements.noDataMsg.classList.remove('hidden');
            document.getElementById('recent-transactions-table').classList.add('hidden');
        } else {
            this.elements.noDataMsg.classList.add('hidden');
            document.getElementById('recent-transactions-table').classList.remove('hidden');
            
            const recent = this.transactions.slice(0, 5);
            recent.forEach(t => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td data-label="Date">${t.date}</td>
                    <td data-label="Description">${t.desc}</td>
                    <td class="desktop-only" data-label="Category">${t.category}</td>
                    <td data-label="Amount" class="${t.type === 'income' ? 'text-success' : 'text-danger'}">
                        ${t.type === 'income' ? '+' : '-'}${this.sym}${t.amount.toFixed(2)}
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }
    }

    renderTransactionsList() {
        const tbody = this.elements.allTransTableBody;
        if(!tbody) return;
        tbody.innerHTML = '';
        
        const typeFilter = this.elements.filterType.value;
        const catFilter = this.elements.filterCategory.value;

        let filtered = this.transactions;
        if (typeFilter !== 'all') filtered = filtered.filter(t => t.type === typeFilter);
        if (catFilter !== 'all') filtered = filtered.filter(t => t.category === catFilter);

        filtered.forEach(t => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td data-label="Date">${t.date}</td>
                <td data-label="Description">${t.desc}</td>
                <td class="desktop-only" data-label="Category">${t.category}</td>
                <td data-label="Amount" class="${t.type === 'income' ? 'text-success' : 'text-danger'}">
                    ${t.type === 'income' ? '+' : '-'}${this.sym}${t.amount.toFixed(2)}
                </td>
                <td data-label="Action">
                    <button class="glass-btn icon-btn text-danger btn-delete" data-id="${t.id}">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Add soft-delete listeners
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.itemToDelete = e.currentTarget.dataset.id;
                this.elements.confirmModal.classList.remove('hidden');
            });
        });
    }

    renderTrashList() {
        const tbody = this.elements.trashTableBody;
        if(!tbody) return;
        tbody.innerHTML = '';
        
        if (this.trash.length === 0) {
            this.elements.trashEmptyMsg.classList.remove('hidden');
            document.getElementById('trash-table').classList.add('hidden');
        } else {
            this.elements.trashEmptyMsg.classList.add('hidden');
            document.getElementById('trash-table').classList.remove('hidden');
            
            this.trash.forEach(t => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td data-label="Date">${t.date}</td>
                    <td data-label="Description"><del>${t.desc}</del></td>
                    <td data-label="Amount">${this.sym}${t.amount.toFixed(2)}</td>
                    <td data-label="Action">
                        <div class="flex-row" style="justify-content: flex-end;">
                            <button class="glass-btn icon-btn text-success btn-recover" data-id="${t.id}" title="Recover">
                                <i class="fa-solid fa-rotate-left"></i>
                            </button>
                            <button class="glass-btn icon-btn text-danger btn-hard-delete" data-id="${t.id}" title="Permanently Delete">
                                <i class="fa-solid fa-xmark"></i>
                            </button>
                        </div>
                    </td>
                `;
                tbody.appendChild(tr);
            });

            // Recover listeners
            document.querySelectorAll('.btn-recover').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const id = e.currentTarget.dataset.id;
                    await db.recoverTransaction(id);
                    if(navigator.vibrate) navigator.vibrate(30);
                    this.loadData();
                });
            });

            // Hard delete listeners
            document.querySelectorAll('.btn-hard-delete').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const id = e.currentTarget.dataset.id;
                    if(confirm("Permanently delete this transaction?")) {
                        await db.hardDeleteTransaction(id);
                        this.loadData();
                    }
                });
            });
        }
    }
}

// Global App reference, usually initiated after AuthManager finishes
window.initApp = function() {
    window.app = new FinanceApp();
}
