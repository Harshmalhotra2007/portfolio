/* AeroFinance Expense Tracker - Inline JavaScript
 * Extracted from expense.html for CSP compliance
 * Last updated: 2026-11-13
 */

// ============================================
// Utility Functions
// ============================================

function escapeHTML(str) {
    if (typeof str !== 'string') return '';
    return str.replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>').replace(/"/g, '"').replace(/'/g, '&#039;');
}

function formatCurrency(amount) {
    return '\u20B9' + Math.abs(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ============================================
// Toast Notification System
// ============================================

function showToast(message, type = 'success', action = null) {
    const container = document.getElementById('toastContainer');

    while (container.children.length >= 3) {
        container.removeChild(container.firstChild);
    }

    const toast = document.createElement('div');
    toast.className = 'toast';
    const icon = type === 'success' ? 'check-circle' : 'alert-circle';
    toast.innerHTML = `
        <i data-lucide="${icon}" class="toast-${type}"></i>
        <div class="toast-content">
            <span>${escapeHTML(message)}</span>
        </div>
    `;

    if (action && action.text && action.callback) {
        const actionBtn = document.createElement('button');
        actionBtn.textContent = action.text;
        actionBtn.className = 'toast-action-btn';
        actionBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            action.callback();
            if (toast.parentNode === container) {
                container.removeChild(toast);
            }
        });
        toast.querySelector('.toast-content').appendChild(actionBtn);
    }

    container.appendChild(toast);
    lucide.createIcons();

    const duration = action ? 5000 : 3000;

    setTimeout(() => {
        if (toast.parentNode === container) {
            toast.style.animation = 'slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) reverse forwards';
            setTimeout(() => {
                if (toast.parentNode === container) {
                    container.removeChild(toast);
                }
            }, 300);
        }
    }, duration);
}

// ============================================
// Theme Engine
// ============================================

const THEME_KEY = 'expense_theme';

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const icon = theme === 'dark' ? 'sun' : 'moon';
    const labelText = theme === 'dark' ? 'Light Mode' : 'Dark Mode';

    const themeToggle = document.getElementById('themeToggle');
    themeToggle.innerHTML = `
        <i data-lucide="${icon}"></i>
        <span>${labelText}</span>
    `;
    lucide.createIcons();

    Chart.defaults.color = theme === 'dark' ? '#a1a1aa' : '#64748b';
    Chart.defaults.borderColor = theme === 'dark' ? '#27272a' : '#e2e8f0';

    renderCharts();
}

function initTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(saved || (prefersDark ? 'dark' : 'light'));
}

// ============================================
// Transaction Management
// ============================================

let transactions = [];
let editingId = null;
let sortColumn = 'date';
let sortDirection = 'desc';
let currentPage = 1;
const ITEMS_PER_PAGE = 10;
let selectedTxnIds = new Set();

const defaultCategories = {
    income: ['Salary', 'Freelance', 'Investments', 'Gifts', 'Refunds', 'Other Income'],
    expense: ['Food & Dining', 'Transport', 'Shopping', 'Entertainment', 'Bills & Utilities', 'Healthcare', 'Education', 'Travel', 'Groceries', 'Subscriptions', 'Personal Care', 'Home', 'Other Expense']
};

const defaultAccounts = ['Cash', 'Bank Account', 'Credit Card', 'UPI', 'Wallet'];

function getCategoriesForType(type) {
    return defaultCategories[type] || [];
}

function getAccounts() {
    return defaultAccounts;
}

function loadTransactions() {
    const stored = localStorage.getItem('expense_transactions');
    if (stored) {
        try {
            transactions = JSON.parse(stored);
        } catch (e) {
            console.error('Failed to parse transactions:', e);
            transactions = [];
        }
    }
}

function saveTransactions() {
    localStorage.setItem('expense_transactions', JSON.stringify(transactions));
}

function addTransaction(data) {
    const newTxn = {
        id: Date.now().toString(36) + Math.random().toString(36).substr(2),
        date: data.date,
        category: data.category,
        note: data.note || '',
        type: data.type,
        amount: parseFloat(data.amount),
        account: data.account || 'Cash',
        recurring: data.recurring || false,
        frequency: data.frequency || 'monthly',
        attachment: data.attachment || null,
        createdAt: new Date().toISOString()
    };
    transactions.unshift(newTxn);
    saveTransactions();
    return newTxn;
}

function updateTransaction(id, data) {
    const idx = transactions.findIndex(t => t.id === id);
    if (idx !== -1) {
        transactions[idx] = { ...transactions[idx], ...data };
        saveTransactions();
        return true;
    }
    return false;
}

function deleteTransaction(id) {
    transactions = transactions.filter(t => t.id !== id);
    saveTransactions();
}

function deleteTransactions(ids) {
    const idSet = new Set(ids);
    transactions = transactions.filter(t => !idSet.has(t.id));
    saveTransactions();
}

function clearAllData() {
    if (confirm('This will permanently delete ALL transactions, budgets, and settings. Are you sure?')) {
        localStorage.removeItem('expense_transactions');
        localStorage.removeItem('expense_budgets');
        localStorage.removeItem('expense_webhook');
        transactions = [];
        currentPage = 1;
        selectedTxnIds.clear();
        renderAll();
        showToast('All data cleared', 'success');
    }
}

// ============================================
// Sorting & Pagination
// ============================================

function getSortedFilteredTransactions() {
    const filter = document.querySelector('.filter-btn.active')?.dataset.filter || 'all';
    let filtered = transactions;

    const search = document.getElementById('searchInput')?.value.toLowerCase() || '';
    if (search) {
        filtered = filtered.filter(t =>
            t.note.toLowerCase().includes(search) ||
            t.category.toLowerCase().includes(search) ||
            t.account.toLowerCase().includes(search)
        );
    }

    const categoryFilter = document.getElementById('tableCategoryFilter')?.value || 'all';
    if (categoryFilter !== 'all') {
        filtered = filtered.filter(t => t.category === categoryFilter);
    }

    const startDate = document.getElementById('tableStartDate')?.value;
    const endDate = document.getElementById('tableEndDate')?.value;
    if (startDate) filtered = filtered.filter(t => t.date >= startDate);
    if (endDate) filtered = filtered.filter(t => t.date <= endDate);

    if (filter === 'income') filtered = filtered.filter(t => t.type === 'income');
    else if (filter === 'expense') filtered = filtered.filter(t => t.type === 'expense');

    return filtered;
}

function renderPagination(totalItems) {
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;
    if (currentPage > totalPages) currentPage = totalPages;

    const startIdx = (currentPage - 1) * ITEMS_PER_PAGE + 1;
    const endIdx = Math.min(currentPage * ITEMS_PER_PAGE, totalItems);

    const pagination = document.getElementById('tablePagination');
    pagination.innerHTML = `
        <div class="pagination-controls">
            <div class="pagination-info">
                Showing <span class="pagination-highlight">${startIdx}</span> to <span class="pagination-highlight">${endIdx}</span> of <span class="pagination-highlight">${totalItems}</span> transactions
            </div>
            <div class="pagination-actions">
                <button class="page-btn" ${currentPage === 1 ? 'disabled' : ''} data-page="${currentPage - 1}"><i data-lucide="chevrons-left" class="chevron-icon"></i></button>
                <button class="page-btn" ${currentPage === 1 ? 'disabled' : ''} data-page="${currentPage - 1}"><i data-lucide="chevron-left" class="chevron-icon"></i></button>
                ${Array.from({length: Math.min(5, totalPages)}, (_, _i) => {
                    const pageNum = totalPages <= 5 ? _i + 1 : (currentPage > 3 ? Math.max(1, totalPages - 4) : 1) + _i;
                    return `<button class="page-btn ${pageNum === currentPage ? 'active' : ''}" data-page="${pageNum}">${pageNum}</button>`;
                }).join('')}
                <button class="page-btn" ${currentPage === totalPages ? 'disabled' : ''} data-page="${currentPage + 1}"><i data-lucide="chevron-right" class="chevron-icon"></i></button>
                <button class="page-btn" ${currentPage === totalPages ? 'disabled' : ''} data-page="${totalPages}"><i data-lucide="chevrons-right" class="chevron-icon"></i></button>
            </div>
        </div>
    `;
    lucide.createIcons();
}

// ============================================
// Budget Management
// ============================================

let budgets = {};

function loadBudgets() {
    const stored = localStorage.getItem('expense_budgets');
    if (stored) {
        try {
            budgets = JSON.parse(stored);
        } catch (e) {
            console.error('Failed to parse budgets:', e);
            budgets = {};
        }
    }
}

function saveBudgets() {
    localStorage.setItem('expense_budgets', JSON.stringify(budgets));
}

function renderBudgets() {
    const list = document.getElementById('budgetList');
    if (!list) return;

    const categories = [...new Set(transactions.map(t => t.category))];
    list.innerHTML = categories.map(cat => {
        const budget = budgets[cat] || 0;
        const spent = transactions
            .filter(t => t.type === 'expense' && t.category === cat)
            .reduce((sum, t) => sum + t.amount, 0);
        const percent = budget > 0 ? Math.min(100, (spent / budget) * 100) : 0;
        const fillClass = percent >= 100 ? 'danger' : percent >= 80 ? 'warning' : '';
        return `
            <div class="budget-item">
                <div class="budget-header">
                    <span>${escapeHTML(cat)}</span>
                    <span>${formatCurrency(spent)} / ${budget > 0 ? formatCurrency(budget) : 'No limit'}</span>
                </div>
                <div class="budget-progress-track">
                    <div class="budget-progress-fill ${fillClass}" data-width="${Math.min(percent, 100)}"></div>
                </div>
            </div>
        `;
    }).join('');
}

function openBudgetModal() {
    const modal = document.getElementById('budgetModal');
    const grid = document.getElementById('dynamicBudgetInputs');
    const categories = [...new Set(transactions.map(t => t.category))];

    grid.innerHTML = categories.map(cat => `
        <div class="form-group">
            <label for="budget_${escapeHTML(cat)}">${escapeHTML(cat)}</label>
            <input type="number" id="budget_${escapeHTML(cat)}" class="form-control" value="${budgets[cat] || ''}" placeholder="0" min="0" step="100">
        </div>
    `).join('');
    modal.classList.add('active');
}

// ============================================
// Webhook / n8n Integration
// ============================================

function loadWebhookConfig() {
    const stored = localStorage.getItem('expense_webhook');
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch (e) {
            return {};
        }
    }
    return {};
}

function saveWebhookConfig(config) {
    localStorage.setItem('expense_webhook', JSON.stringify(config));
}

function simulateWebhook() {
    const url = document.getElementById('webhookUrlInput').value;
    if (!url) {
        showToast('Enter webhook URL first', 'error');
        return;
    }

    const config = loadWebhookConfig();
    config.url = url;
    saveWebhookConfig(config);

    showToast('Webhook saved. Test event sent.', 'success');
}

// ============================================
// Import / Export
// ============================================

function exportData(format) {
    const data = {
        transactions,
        budgets,
        webhook: loadWebhookConfig(),
        exportedAt: new Date().toISOString()
    };

    if (format === 'json') {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        downloadBlob(blob, `expense-backup-${Date.now()}.json`);
    } else {
        const headers = ['id', 'date', 'category', 'note', 'type', 'amount', 'account', 'recurring', 'frequency', 'createdAt'];
        const rows = transactions.map(t => headers.map(h => {
            let v = t[h];
            if (typeof v === 'string' && v.includes(',')) v = '"' + v + '"';
            return v;
        }).join(','));
        const csv = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        downloadBlob(blob, `expense-backup-${Date.now()}.csv`);
    }
    showToast(`${format.toUpperCase()} exported`, 'success');
}

function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

function validateImportData(data) {
    if (!data || !Array.isArray(data.transactions)) {
        throw new Error('Invalid backup format');
    }
    if (JSON.stringify(data).length > 102400) {
        throw new Error('Backup file too large (>100KB)');
    }
    return data;
}

function importData(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => {
            try {
                let data;
                if (file.name.endsWith('.json')) {
                    data = JSON.parse(e.target.result);
                } else {
                    const lines = e.target.result.split('\n').filter(l => l.trim());
                    const headers = lines[0].split(',');
                    data = { transactions: lines.slice(1).map(line => {
                        const values = line.split(',');
                        const obj = {};
                        headers.forEach((h, i) => obj[h] = values[i]);
                        return obj;
                    })};
                }
                data = validateImportData(data);
                transactions = data.transactions.map(t => ({
                    ...t,
                    amount: parseFloat(t.amount),
                    recurring: t.recurring === 'true' || t.recurring === true
                }));
                if (data.budgets) budgets = data.budgets;
                if (data.webhook) saveWebhookConfig(data.webhook);
                saveTransactions();
                saveBudgets();
                currentPage = 1;
                selectedTxnIds.clear();
                renderAll();
                showToast('Data imported successfully', 'success');
                resolve();
            } catch (err) {
                showToast('Import failed: ' + err.message, 'error');
                reject(err);
            }
        };
        reader.readAsText(file);
    });
}

// ============================================
// Chart Rendering
// ============================================

let comparisonChart = null;
let expenseChart = null;
let trendChart = null;

function getChartColors() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    return {
        grid: isDark ? '#27272a' : '#e2e8f0',
        text: isDark ? '#a1a1aa' : '#64748b',
        income: '#00ff66',
        expense: '#ff4757',
        categories: ['#00f0ff', '#00ff66', '#ffa502', '#7b68ee', '#ff4757', '#e67e22', '#3498db', '#9b59b6', '#1abc9c', '#f39c12', '#e74c3c', '#2ecc71']
    };
}

function renderCharts() {
    const colors = getChartColors();

    // Income vs Expense Chart
    const monthlyData = {};
    transactions.forEach(t => {
        const month = t.date.substring(0, 7);
        if (!monthlyData[month]) monthlyData[month] = { income: 0, expense: 0 };
        if (t.type === 'income') monthlyData[month].income += t.amount;
        else monthlyData[month].expense += t.amount;
    });

    const months = Object.keys(monthlyData).sort().slice(-12);
    const incomeData = months.map(m => monthlyData[m].income);
    const expenseData = months.map(m => monthlyData[m].expense);

    const ctx1 = document.getElementById('comparisonChart')?.getContext('2d');
    if (ctx1) {
        if (comparisonChart) comparisonChart.destroy();
        comparisonChart = new Chart(ctx1, {
            type: 'bar',
            data: {
                labels: months.map(m => m.substring(5) + '/' + m.substring(2,4)),
                datasets: [
                    { label: 'Income', data: incomeData, backgroundColor: colors.income, borderColor: colors.income, borderWidth: 0, borderRadius: 4 },
                    { label: 'Expense', data: expenseData, backgroundColor: colors.expense, borderColor: colors.expense, borderWidth: 0, borderRadius: 4 }
                ]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: true, labels: { color: colors.text } } }, scales: { x: { grid: { color: colors.grid } }, y: { beginAtZero: true, grid: { color: colors.grid }, ticks: { color: colors.text } } } }
        });
    }

    // Expense Breakdown Chart
    const categoryTotals = {};
    transactions.filter(t => t.type === 'expense').forEach(t => {
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
    });

    const ctx2 = document.getElementById('expenseChart')?.getContext('2d');
    if (ctx2) {
        if (expenseChart) expenseChart.destroy();
        expenseChart = new Chart(ctx2, {
            type: 'doughnut',
            data: {
                labels: Object.keys(categoryTotals),
                datasets: [{ data: Object.values(categoryTotals), backgroundColor: colors.categories, borderWidth: 0 }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: colors.text, font: { size: 10 } } } } }
        });
    }

    // Monthly Trend Chart
    const ctx3 = document.getElementById('trendChart')?.getContext('2d');
    if (ctx3) {
        if (trendChart) trendChart.destroy();
        const monthlyNet = months.map(m => (monthlyData[m].income || 0) - (monthlyData[m].expense || 0));
        trendChart = new Chart(ctx3, {
            type: 'line',
            data: {
                labels: months.map(m => m.substring(5) + '/' + m.substring(2,4)),
                datasets: [{
                    label: 'Net Flow',
                    data: monthlyNet,
                    borderColor: monthlyNet[monthlyNet.length-1] >= 0 ? colors.income : colors.expense,
                    backgroundColor: 'transparent',
                    tension: 0.3,
                    fill: false,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { color: colors.grid } }, y: { grid: { color: colors.grid }, ticks: { color: colors.text } } } }
        });
    }
}

// ============================================
// Transaction Table Rendering
// ============================================

function renderTransactions() {
    const filtered = getSortedFilteredTransactions();
    const totalItems = filtered.length;
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const pageItems = filtered.slice(start, start + ITEMS_PER_PAGE);

    const tbody = document.getElementById('transactionList');
    if (!tbody) return;

    tbody.innerHTML = pageItems.map((txn, _i) => {
        const isSelected = selectedTxnIds.has(txn.id);

        return `
            <tr class="${isSelected ? 'selected' : ''}" data-id="${txn.id}">
                <td class="txn-checkbox-cell"><input type="checkbox" class="txn-checkbox" data-id="${txn.id}" ${isSelected ? 'checked' : ''}></td>
                <td class="txn-date-cell">${escapeHTML(txn.date)}</td>
                <td class="txn-category-cell">${escapeHTML(txn.category)} <span class="badge-account">${escapeHTML(txn.account)}</span></td>
                <td class="note-text">${escapeHTML(txn.note) || '<span class="note-placeholder">—</span>'}</td>
                <td class="txn-type-cell"><span class="badge ${txn.type === 'expense' ? 'badge-danger' : 'badge-success'}">${txn.type === 'income' ? 'Income' : 'Expense'}</span></td>
                <td class="amount-text ${txn.type === 'income' ? 'positive' : 'negative'}">${formatCurrency(txn.amount)}</td>
                <td class="txn-actions-cell">
                    <div class="txn-actions-flex">
                        ${txn.attachment ? '<i data-lucide="image" class="icon-xs-14-primary"></i>' : ''}
                        ${txn.recurring ? '<i data-lucide="refresh-cw" class="icon-xs-11-spin"></i>' : ''}
                        <button class="edit-btn" data-id="${txn.id}" aria-label="Edit"><i data-lucide="pencil" class="icon-sm-12"></i></button>
                        <button class="delete-btn" data-id="${txn.id}" aria-label="Delete"><i data-lucide="trash-2" class="icon-sm-12"></i></button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    // Update select all checkbox
    const selectAll = document.getElementById('selectAllTxns');
    if (selectAll) selectAll.checked = pageItems.length > 0 && pageItems.every(t => selectedTxnIds.has(t.id));

    renderPagination(totalItems);
    lucide.createIcons();

    // Attach event listeners
    attachTransactionListeners();
}

function attachTransactionListeners() {
    // Checkbox selection
    document.querySelectorAll('.txn-checkbox').forEach(cb => {
        cb.addEventListener('change', (e) => {
            const id = e.target.dataset.id;
            if (e.target.checked) selectedTxnIds.add(id);
            else selectedTxnIds.delete(id);
            updateBulkDeleteVisibility();
        });
    });

    // Select all
    const selectAll = document.getElementById('selectAllTxns');
    if (selectAll) {
        selectAll.onchange = (e) => {
            document.querySelectorAll('.txn-checkbox').forEach(cb => {
                cb.checked = e.target.checked;
                const id = cb.dataset.id;
                if (e.target.checked) selectedTxnIds.add(id);
                else selectedTxnIds.delete(id);
            });
            updateBulkDeleteVisibility();
        };
    }

    // Edit buttons
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.onclick = (e) => {
            e.stopPropagation();
            openEditModal(e.currentTarget.dataset.id);
        };
    });

    // Delete buttons
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.onclick = (e) => {
            e.stopPropagation();
            if (confirm('Delete this transaction?')) {
                deleteTransaction(e.currentTarget.dataset.id);
                selectedTxnIds.delete(e.currentTarget.dataset.id);
                renderAll();
                showToast('Transaction deleted', 'success');
            }
        };
    });
}

function updateBulkDeleteVisibility() {
    const btn = document.getElementById('bulkDeleteBtn');
    if (btn) btn.style.display = selectedTxnIds.size > 0 ? 'inline-flex' : 'none';
}

function deleteSelected() {
    if (selectedTxnIds.size === 0) return;
    if (confirm(`Delete ${selectedTxnIds.size} selected transactions?`)) {
        deleteTransactions([...selectedTxnIds]);
        selectedTxnIds.clear();
        renderAll();
        showToast(`${selectedTxnIds.size} transactions deleted`, 'success');
    }
}

// ============================================
// Modal Management
// ============================================

function openAddModal() {
    editingId = null;
    document.getElementById('formTitle').textContent = 'Add Transaction';
    resetForm();
    populateFormDropdowns();
    document.getElementById('transactionModal').classList.add('active');
    document.getElementById('formName').focus();
}

function openEditModal(id) {
    const txn = transactions.find(t => t.id === id);
    if (!txn) return;

    editingId = id;
    document.getElementById('formTitle').textContent = 'Edit Transaction';
    populateFormDropdowns();

    document.getElementById('type').value = txn.type;
    document.getElementById('category').value = txn.category;
    document.getElementById('account').value = txn.account || 'Cash';
    document.getElementById('amount').value = txn.amount;
    document.getElementById('date').value = txn.date;
    document.getElementById('note').value = txn.note || '';

    const recurringCheck = document.getElementById('recurringCheck');
    recurringCheck.checked = txn.recurring || false;
    document.getElementById('frequencyGroup').style.display = txn.recurring ? 'block' : 'none';
    if (txn.recurring) document.getElementById('frequency').value = txn.frequency || 'monthly';

    if (txn.attachment) {
        document.getElementById('attachmentPreview').src = txn.attachment;
        document.getElementById('attachmentPreview').style.display = 'block';
        document.getElementById('clearAttachmentBtn').style.display = 'inline-flex';
        document.getElementById('attachmentBase64').value = txn.attachment;
    }

    document.getElementById('transactionModal').classList.add('active');
    document.getElementById('formName').focus();
}

function populateFormDropdowns() {
    const type = document.getElementById('type').value || 'expense';
    const categories = getCategoriesForType(type);
    const catSelect = document.getElementById('category');
    catSelect.innerHTML = categories.map(c => `<option value="${escapeHTML(c)}">${escapeHTML(c)}</option>`).join('');

    const accounts = getAccounts();
    const accSelect = document.getElementById('account');
    accSelect.innerHTML = accounts.map(a => `<option value="${escapeHTML(a)}">${escapeHTML(a)}</option>`).join('');
}

function resetForm() {
    document.getElementById('transactionForm').reset();
    document.getElementById('editId').value = '';
    document.getElementById('attachmentPreview').src = '';
    document.getElementById('attachmentPreview').style.display = 'none';
    document.getElementById('clearAttachmentBtn').style.display = 'none';
    document.getElementById('attachmentBase64').value = '';
    document.getElementById('frequencyGroup').style.display = 'none';
    document.getElementById('recurringCheck').checked = false;
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
    if (modalId === 'transactionModal') resetForm();
}

function handleFormSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    const data = {
        date: formData.get('date'),
        type: formData.get('type'),
        category: formData.get('category'),
        amount: parseFloat(formData.get('amount')),
        account: formData.get('account'),
        note: formData.get('note'),
        recurring: formData.get('recurring') === 'on',
        frequency: formData.get('frequency'),
        attachment: document.getElementById('attachmentBase64').value || null
    };

    if (editingId) {
        updateTransaction(editingId, data);
        showToast('Transaction updated', 'success');
    } else {
        addTransaction(data);
        showToast('Transaction added', 'success');
    }
    closeModal('transactionModal');
    renderAll();
}

function handleBudgetFormSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    formData.forEach((value, key) => {
        if (key.startsWith('budget_')) {
            const cat = key.replace('budget_', '');
            budgets[cat] = parseFloat(value) || 0;
        }
    });
    saveBudgets();
    renderBudgets();
    closeModal('budgetModal');
    showToast('Budgets updated', 'success');
}

// ============================================
// Initialization
// ============================================

function initEventListeners() {
    // Theme toggle
    document.getElementById('themeToggle').addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        localStorage.setItem(THEME_KEY, next);
        applyTheme(next);
    });

    // Navigation tabs
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            document.querySelectorAll('.section-wrapper').forEach(s => s.classList.remove('active'));
            document.getElementById(btn.dataset.tab + 'Tab').classList.add('active');
        });
    });

    // Mobile menu toggle
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.querySelector('.sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    menuToggle?.addEventListener('click', () => {
        sidebar.classList.toggle('active');
        sidebarOverlay.classList.toggle('active');
    });
    sidebarOverlay?.addEventListener('click', () => {
        sidebar.classList.remove('active');
        sidebarOverlay.classList.remove('active');
    });

    // Export/Import
    document.getElementById('exportJsonBtn').addEventListener('click', () => exportData('json'));
    document.getElementById('exportCsvBtn').addEventListener('click', () => exportData('csv'));
    document.getElementById('importBtn').addEventListener('click', () => document.getElementById('importInput').click());
    document.getElementById('importInput').addEventListener('change', (e) => {
        if (e.target.files[0]) importData(e.target.files[0]).finally(() => e.target.value = '');
    });

    // Reset all data
    document.getElementById('resetBtn').addEventListener('click', clearAllData);

    // Add transaction
    document.getElementById('openAddModalBtn').addEventListener('click', openAddModal);
    document.getElementById('transactionForm').addEventListener('submit', handleFormSubmit);
    document.getElementById('closeModalBtn').addEventListener('click', () => closeModal('transactionModal'));
    document.getElementById('cancelModalBtn').addEventListener('click', () => closeModal('transactionModal'));

    // Budget modal
    document.getElementById('openBudgetModalBtn').addEventListener('click', openBudgetModal);
    document.getElementById('budgetForm').addEventListener('submit', handleBudgetFormSubmit);
    document.getElementById('closeBudgetModalBtn').addEventListener('click', () => closeModal('budgetModal'));
    document.getElementById('cancelBudgetModalBtn').addEventListener('click', () => closeModal('budgetModal'));

    // Webhook
    document.getElementById('simulateWebhookBtn').addEventListener('click', simulateWebhook);

    // Bulk delete
    document.getElementById('bulkDeleteBtn').addEventListener('click', deleteSelected);

    // Attachment handling
    document.getElementById('attachment').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                document.getElementById('attachmentPreview').src = ev.target.result;
                document.getElementById('attachmentPreview').style.display = 'block';
                document.getElementById('clearAttachmentBtn').style.display = 'inline-flex';
                document.getElementById('attachmentBase64').value = ev.target.result;
            };
            reader.readAsDataURL(file);
        }
    });
    document.getElementById('clearAttachmentBtn').addEventListener('click', () => {
        document.getElementById('attachmentPreview').src = '';
        document.getElementById('attachmentPreview').style.display = 'none';
        document.getElementById('clearAttachmentBtn').style.display = 'none';
        document.getElementById('attachmentBase64').value = '';
        document.getElementById('attachment').value = '';
    });

    // Recurring toggle
    document.getElementById('recurringCheck').addEventListener('change', (e) => {
        document.getElementById('frequencyGroup').style.display = e.target.checked ? 'block' : 'none';
    });

    // Table sorting
    document.querySelectorAll('.sortable-header').forEach(th => {
        th.addEventListener('click', () => {
            const col = th.dataset.sort;
            if (sortColumn === col) sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
            else { sortColumn = col; sortDirection = 'asc'; }
            document.querySelectorAll('.sort-indicator').forEach(s => s.textContent = '');
            document.getElementById('sort_' + col).textContent = sortDirection === 'asc' ? '▲' : '▼';
            renderTransactions();
        });
    });

    // Table filters
    document.getElementById('searchInput')?.addEventListener('input', () => { currentPage = 1; renderTransactions(); });
    document.getElementById('tableCategoryFilter')?.addEventListener('change', () => { currentPage = 1; renderTransactions(); });
    document.getElementById('tableStartDate')?.addEventListener('change', () => { currentPage = 1; renderTransactions(); });
    document.getElementById('tableEndDate')?.addEventListener('change', () => { currentPage = 1; renderTransactions(); });
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentPage = 1;
            renderTransactions();
        });
    });

    // Pagination
    document.getElementById('tablePagination')?.addEventListener('click', (e) => {
        const btn = e.target.closest('.page-btn');
        if (btn && !btn.disabled) {
            currentPage = parseInt(btn.dataset.page);
            renderTransactions();
        }
    });

    // Type change updates category dropdown
    document.getElementById('type')?.addEventListener('change', populateFormDropdowns);
}

function renderAll() {
    renderTransactions();
    renderBudgets();
    renderCharts();
}

function initApp() {
    loadTransactions();
    loadBudgets();
    initTheme();
    initEventListeners();
    renderAll();

    // Load browser testing suite dynamically if requested (Issue 28)
    if (location.search.includes('runTests=true')) {
        const script = document.createElement('script');
        script.src = 'test_suite.js';
        document.body.appendChild(script);
    }
}

document.addEventListener('DOMContentLoaded', initApp);