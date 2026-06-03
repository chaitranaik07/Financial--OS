// Chart Initialization and Update Logic

let charts = {};

// Chart.js Default styling for Glassmorphism
Chart.defaults.color = '#94a3b8';
Chart.defaults.font.family = "'Inter', sans-serif";
Chart.defaults.scale.grid.color = 'rgba(255, 255, 255, 0.05)';

window.initCharts = function(transactions) {
    updateCharts(transactions);
};

window.updateCharts = function(transactions) {
    renderTrendsChart(transactions);
    renderCategoryChart(transactions);
    renderCashflowChart(transactions);
    renderBudgetChart(transactions);
};

function getMonthlyData(transactions) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const incomeData = new Array(12).fill(0);
    const expenseData = new Array(12).fill(0);

    transactions.forEach(t => {
        const date = new Date(t.date);
        const monthIndex = date.getMonth();
        
        if (t.type === 'income') {
            incomeData[monthIndex] += t.amount;
        } else {
            expenseData[monthIndex] += t.amount;
        }
    });

    // Determine active months (up to current month)
    const currentMonth = new Date().getMonth();
    
    return {
        labels: months.slice(0, currentMonth + 1),
        income: incomeData.slice(0, currentMonth + 1),
        expense: expenseData.slice(0, currentMonth + 1)
    };
}

function renderTrendsChart(transactions) {
    const ctx = document.getElementById('trendsChart');
    if (!ctx) return;
    
    const data = getMonthlyData(transactions);

    if (charts.trends) {
        charts.trends.destroy();
    }

    charts.trends = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.labels,
            datasets: [
                {
                    label: 'Income',
                    data: data.income,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Expense',
                    data: data.expense,
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderWidth: 1
                }
            },
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

function renderCategoryChart(transactions) {
    const ctx = document.getElementById('categoryChart');
    if (!ctx) return;

    const expenses = transactions.filter(t => t.type === 'expense');
    const categoryTotals = {};
    
    expenses.forEach(t => {
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
    });

    const labels = Object.keys(categoryTotals);
    const data = Object.values(categoryTotals);
    
    // Vibrant colors for categories
    const colors = ['#6366f1', '#ec4899', '#3b82f6', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444', '#14b8a6', '#f97316'];

    if (charts.category) {
        charts.category.destroy();
    }

    charts.category = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors,
                borderWidth: 0,
                hoverOffset: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
                legend: {
                    position: 'right',
                    labels: { color: '#94a3b8', usePointStyle: true, boxWidth: 8 }
                }
            }
        }
    });
}

function renderCashflowChart(transactions) {
    const ctx = document.getElementById('cashflowChart');
    if (!ctx) return;

    const data = getMonthlyData(transactions);

    if (charts.cashflow) charts.cashflow.destroy();

    charts.cashflow = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.labels,
            datasets: [
                {
                    label: 'Income',
                    data: data.income,
                    backgroundColor: '#10b981',
                    borderRadius: 4
                },
                {
                    label: 'Expense',
                    data: data.expense,
                    backgroundColor: '#ef4444',
                    borderRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                tooltip: {
                    mode: 'index',
                    intersect: false,
                }
            }
        }
    });
}

function renderBudgetChart(transactions) {
    const ctx = document.getElementById('budgetChart');
    if (!ctx) return;

    // Simplified mock budget vs actual
    const labels = ['Housing', 'Food', 'Transport', 'Entertainment'];
    const budgets = [1500, 500, 200, 300];
    
    // Calculate actuals
    const actuals = [0, 0, 0, 0];
    const currentMonth = new Date().getMonth();
    
    transactions.forEach(t => {
        if(t.type === 'expense' && new Date(t.date).getMonth() === currentMonth) {
            const idx = labels.indexOf(t.category);
            if(idx > -1) actuals[idx] += t.amount;
        }
    });

    if (charts.budget) charts.budget.destroy();

    charts.budget = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Budget',
                    data: budgets,
                    fill: true,
                    backgroundColor: 'rgba(59, 130, 246, 0.2)',
                    borderColor: 'rgb(59, 130, 246)',
                    pointBackgroundColor: 'rgb(59, 130, 246)',
                    pointBorderColor: '#fff',
                },
                {
                    label: 'Actual Spent',
                    data: actuals,
                    fill: true,
                    backgroundColor: 'rgba(239, 68, 68, 0.2)',
                    borderColor: 'rgb(239, 68, 68)',
                    pointBackgroundColor: 'rgb(239, 68, 68)',
                    pointBorderColor: '#fff',
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    pointLabels: { color: '#94a3b8' },
                    ticks: { display: false }
                }
            }
        }
    });
}
