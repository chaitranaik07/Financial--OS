// Reports Generation (CSV & PDF)

document.addEventListener('DOMContentLoaded', () => {
    const btnPdf = document.getElementById('btn-export-pdf');
    const btnCsv = document.getElementById('btn-export-csv');
    const reportType = document.getElementById('report-type');
    
    if(!btnPdf || !btnCsv) return;

    btnCsv.addEventListener('click', () => {
        const data = getFilteredData();
        exportToCSV(data);
    });

    btnPdf.addEventListener('click', () => {
        generatePDF();
    });

    function getFilteredData() {
        const type = reportType.value;
        const txs = window.app.transactions;
        const now = new Date();
        let filtered = txs;

        if (type === 'monthly') {
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();
            filtered = txs.filter(t => {
                const d = new Date(t.date);
                return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
            });
        } else if (type === 'annual') {
            const currentYear = now.getFullYear();
            filtered = txs.filter(t => {
                const d = new Date(t.date);
                return d.getFullYear() === currentYear;
            });
        }
        return filtered;
    }

    function updatePreview() {
        const previewArea = document.getElementById('report-preview');
        const data = getFilteredData();
        const sym = window.app.sym; // Get dynamic currency
        
        let income = 0;
        let expense = 0;
        
        data.forEach(t => {
            if(t.type === 'income') income += t.amount;
            else expense += t.amount;
        });

        const html = `
            <div style="font-family: 'Inter', sans-serif; color: #333;">
                <h2 style="color: #6366f1; margin-bottom: 20px; font-family: 'Outfit', sans-serif;">Finance OS Report</h2>
                <div style="display: flex; justify-content: space-between; margin-bottom: 20px; padding: 15px; background: #f8fafc; border-radius: 8px;">
                    <div>
                        <p style="margin:0; color: #64748b; font-size: 0.9rem;">Total Income</p>
                        <h3 style="margin:5px 0 0; color: #10b981;">${sym}${income.toFixed(2)}</h3>
                    </div>
                    <div>
                        <p style="margin:0; color: #64748b; font-size: 0.9rem;">Total Expenses</p>
                        <h3 style="margin:5px 0 0; color: #ef4444;">${sym}${expense.toFixed(2)}</h3>
                    </div>
                    <div>
                        <p style="margin:0; color: #64748b; font-size: 0.9rem;">Net Flow</p>
                        <h3 style="margin:5px 0 0; color: #0f172a;">${sym}${(income - expense).toFixed(2)}</h3>
                    </div>
                </div>
                
                <h3 style="margin-top: 30px; margin-bottom: 10px;">Transaction Breakdown</h3>
                <table style="width: 100%; border-collapse: collapse; text-align: left;">
                    <thead>
                        <tr style="border-bottom: 2px solid #e2e8f0;">
                            <th style="padding: 10px; color: #64748b;">Date</th>
                            <th style="padding: 10px; color: #64748b;">Description</th>
                            <th style="padding: 10px; color: #64748b;">Category</th>
                            <th style="padding: 10px; color: #64748b;">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.slice(0, 15).map(t => `
                            <tr style="border-bottom: 1px solid #f1f5f9;">
                                <td style="padding: 10px;">${t.date}</td>
                                <td style="padding: 10px;">${t.desc}</td>
                                <td style="padding: 10px;">${t.category}</td>
                                <td style="padding: 10px; color: ${t.type === 'income' ? '#10b981' : '#ef4444'}">
                                    ${t.type === 'income' ? '+' : '-'}${sym}${t.amount.toFixed(2)}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;

        previewArea.innerHTML = html;
    }

    function exportToCSV(data) {
        if(data.length === 0) {
            alert('No data to export.');
            return;
        }

        const headers = ['Date', 'Type', 'Category', 'Description', 'Amount'];
        const csvRows = [];
        csvRows.push(headers.join(','));

        data.forEach(t => {
            const row = [
                t.date,
                t.type,
                t.category,
                `"${t.desc.replace(/"/g, '""')}"`,
                t.amount
            ];
            csvRows.push(row.join(','));
        });

        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('hidden', '');
        a.setAttribute('href', url);
        a.setAttribute('download', `FinanceOS_Report.csv`);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    function generatePDF() {
        updatePreview(); // Ensure it's populated
        const element = document.getElementById('report-preview');
        element.classList.remove('hidden'); // Temporarily show for capture
        
        const opt = {
            margin:       10,
            filename:     `FinanceOS_Report.pdf`,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2 },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        if(typeof html2pdf !== 'undefined') {
            html2pdf().set(opt).from(element).save().then(() => {
                element.classList.add('hidden'); // Hide again
            });
        } else {
            alert('PDF Generation Library not loaded.');
            element.classList.add('hidden');
        }
    }
});
