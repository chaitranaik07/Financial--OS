// Simulated AI Insights Engine

window.generateInsights = function(transactions) {
    const insightElement = document.getElementById('ai-insight-text');
    if (!insightElement) return;

    if (transactions.length < 5) {
        insightElement.innerHTML = `<strong>Setup Phase:</strong> Add more transactions to generate meaningful insights.`;
        return;
    }

    const currentMonth = new Date().getMonth();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    
    let currentExpense = 0;
    let lastExpense = 0;
    
    // Category tracking for current month
    const categoryTotals = {};

    transactions.forEach(t => {
        if (t.type === 'expense') {
            const tMonth = new Date(t.date).getMonth();
            if (tMonth === currentMonth) {
                currentExpense += t.amount;
                categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
            } else if (tMonth === lastMonth) {
                lastExpense += t.amount;
            }
        }
    });

    // 1. Check Spending Trend
    let insightStr = '';
    
    if (lastExpense > 0) {
        const change = ((currentExpense - lastExpense) / lastExpense) * 100;
        if (change > 10) {
            insightStr = `⚠️ <strong>Alert:</strong> Your spending is up <strong>${change.toFixed(1)}%</strong> compared to last month. `;
        } else if (change < -10) {
            insightStr = `🎉 <strong>Great job!</strong> Your spending is down <strong>${Math.abs(change).toFixed(1)}%</strong> compared to last month. `;
        }
    }

    // 2. Identify top category
    let topCategory = '';
    let topAmount = 0;
    for (const [cat, amt] of Object.entries(categoryTotals)) {
        if (amt > topAmount) {
            topAmount = amt;
            topCategory = cat;
        }
    }

    if (topCategory && currentExpense > 0) {
        const percent = ((topAmount / currentExpense) * 100).toFixed(1);
        if(!insightStr) insightStr = `💡 <strong>Insight:</strong> `;
        insightStr += `<strong>${topCategory}</strong> makes up ${percent}% of your expenses this month. Consider setting a strict budget for it.`;
    }

    if(!insightStr) {
        insightStr = `✅ <strong>All good:</strong> Your spending patterns are stable and within normal ranges.`;
    }

    insightElement.innerHTML = insightStr;
};
