// IndexedDB Wrapper for robust storage
class FinanceDB {
    constructor() {
        this.dbName = 'FinanceOS_DB';
        this.dbVersion = 2; // Upgraded version for new fields
        this.db = null;
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = (event) => reject(event.target.error);

            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                if (!db.objectStoreNames.contains('transactions')) {
                    const txStore = db.createObjectStore('transactions', { keyPath: 'id', autoIncrement: true });
                    txStore.createIndex('date', 'date', { unique: false });
                    txStore.createIndex('type', 'type', { unique: false });
                    txStore.createIndex('deleted', 'deleted', { unique: false });
                }

                if (!db.objectStoreNames.contains('goals')) {
                    db.createObjectStore('goals', { keyPath: 'id', autoIncrement: true });
                }
            };
        });
    }

    // --- Transactions ---
    async addTransaction(transaction) {
        // Ensure default deleted flag is false
        transaction.deleted = transaction.deleted || false;
        
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(['transactions'], 'readwrite');
            const store = tx.objectStore('transactions');
            const request = store.add(transaction);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async updateTransaction(transaction) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(['transactions'], 'readwrite');
            const store = tx.objectStore('transactions');
            const request = store.put(transaction);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async getTransactions(includeDeleted = false) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(['transactions'], 'readonly');
            const store = tx.objectStore('transactions');
            const request = store.getAll();

            request.onsuccess = () => {
                let data = request.result;
                
                if(!includeDeleted) {
                    data = data.filter(item => !item.deleted);
                } else {
                    data = data.filter(item => item.deleted); // Return ONLY deleted if includeDeleted is true
                }
                
                // Sort by date descending
                data = data.sort((a, b) => new Date(b.date) - new Date(a.date));
                resolve(data);
            };
            request.onerror = () => reject(request.error);
        });
    }

    async softDeleteTransaction(id) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(['transactions'], 'readwrite');
            const store = tx.objectStore('transactions');
            const getReq = store.get(Number(id));
            
            getReq.onsuccess = () => {
                const data = getReq.result;
                if(data) {
                    data.deleted = true;
                    store.put(data);
                    resolve();
                } else {
                    reject('Item not found');
                }
            };
        });
    }

    async recoverTransaction(id) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(['transactions'], 'readwrite');
            const store = tx.objectStore('transactions');
            const getReq = store.get(Number(id));
            
            getReq.onsuccess = () => {
                const data = getReq.result;
                if(data) {
                    data.deleted = false;
                    store.put(data);
                    resolve();
                } else {
                    reject('Item not found');
                }
            };
        });
    }

    async hardDeleteTransaction(id) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(['transactions'], 'readwrite');
            const store = tx.objectStore('transactions');
            const request = store.delete(Number(id));

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async emptyTrash() {
        const deletedTxs = await this.getTransactions(true);
        for(const t of deletedTxs) {
            await this.hardDeleteTransaction(t.id);
        }
    }

    // --- Utility ---
    async clearAllTransactions() {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(['transactions'], 'readwrite');
            const store = tx.objectStore('transactions');
            const request = store.clear();
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async seedRichDemoData() {
        await this.clearAllTransactions();
        
        const today = new Date();
        const formatDate = (daysAgo) => {
            const d = new Date(today);
            d.setDate(d.getDate() - daysAgo);
            return this.formatDate(d);
        };

        const mockData = [
            { type: 'income', amount: 85000, desc: 'Monthly Salary', category: 'Salary', date: formatDate(15), deleted: false },
            { type: 'expense', amount: 25000, desc: 'Apartment Rent', category: 'Housing', date: formatDate(14), deleted: false },
            { type: 'expense', amount: 4500, desc: 'Supermarket Groceries', category: 'Food', date: formatDate(12), deleted: false },
            { type: 'expense', amount: 3200, desc: 'Zara Clothing', category: 'Shopping', date: formatDate(10), deleted: false },
            { type: 'expense', amount: 1200, desc: 'Dinner at Restaurant', category: 'Food', date: formatDate(8), deleted: false },
            { type: 'expense', amount: 800, desc: 'Uber Ride', category: 'Transport', date: formatDate(5), deleted: false },
            { type: 'expense', amount: 5500, desc: 'Nike Shoes', category: 'Shopping', date: formatDate(3), deleted: false },
            { type: 'expense', amount: 1500, desc: 'Movie Tickets', category: 'Entertainment', date: formatDate(1), deleted: false }
        ];

        for (const item of mockData) {
            await this.addTransaction(item);
        }
    }

    async seedMockDataIfEmpty() {
        const txs = await this.getTransactions();
        if (txs.length === 0) {
            await this.seedRichDemoData();
        }
    }

    formatDate(date) {
        return date.toISOString().split('T')[0];
    }
}

const db = new FinanceDB();
