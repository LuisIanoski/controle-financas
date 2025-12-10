let editingId = null;
let editingType = null; // 'expense' ou 'balance'
let chart = null;

function getLocalStorage() {
    const data = localStorage.getItem('financeData');
    return data ? JSON.parse(data) : { salary: 0, expenses: [], balances: [] };
}

function saveLocalStorage(data) {
    localStorage.setItem('financeData', JSON.stringify(data));
}

function formatMoney(value) {
    return 'R$ ' + value.toFixed(2).replace('.', ',');
}

function formatDate(dateString) {
    const [year, month, day] = dateString.split('-');
    return day + '/' + month + '/' + year;
}

function isDateValid(dateString) {
    const today = new Date();
    today.setHours(0, 0, 0, 0); 
    
    const [year, month, day] = dateString.split('-');
    const selectedDate = new Date(year, month - 1, day);
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    return selectedDate >= firstDay && selectedDate <= today;
}

function saveSalary(e) {
    e.preventDefault();
    const value = parseFloat(document.getElementById('salaryInput').value);

    if (!value || value < 0) {
        alert('Salário inválido!');
        return;
    }

    const data = getLocalStorage();
    data.salary = value;
    saveLocalStorage(data);
    document.getElementById('salaryInput').value = '';
    updateDisplay();
}

function addExpense(e) {
    e.preventDefault();
    const date = document.getElementById('expenseDate').value;
    const name = document.getElementById('expenseName').value;
    const value = parseFloat(document.getElementById('expenseValue').value);

    if (!isDateValid(date)) {
        alert('A data deve estar entre o primeiro dia do mês e hoje!');
        return;
    }

    if (!date || !name || !value || value <= 0) {
        alert('Preencha todos os campos!');
        return;
    }

    const data = getLocalStorage();
    data.expenses.push({
        id: Date.now(),
        date,
        name,
        value
    });
    saveLocalStorage(data);
    document.getElementById('expenseName').value = '';
    document.getElementById('expenseValue').value = '';
    updateDisplay();
}

function addBalance(e) {
    e.preventDefault();
    const date = document.getElementById('balanceDate').value;
    const name = document.getElementById('balanceName').value;
    const value = parseFloat(document.getElementById('balanceValue').value);

    if (!isDateValid(date)) {
        alert('A data deve estar entre o primeiro dia do mês e hoje!');
        return;
    }

    if (!date || !name || !value || value <= 0) {
        alert('Preencha todos os campos!');
        return;
    }

    const data = getLocalStorage();
    data.balances.push({
        id: Date.now(),
        date,
        name,
        value
    });
    saveLocalStorage(data);
    document.getElementById('balanceName').value = '';
    document.getElementById('balanceValue').value = '';
    updateDisplay();
}

function deleteExpense(id) {
    if (confirm('Deletar esta despesa?')) {
        const data = getLocalStorage();
        data.expenses = data.expenses.filter(e => e.id !== id);
        saveLocalStorage(data);
        updateDisplay();
    }
}

function deleteBalance(id) {
    if (confirm('Deletar este saldo?')) {
        const data = getLocalStorage();
        data.balances = data.balances.filter(b => b.id !== id);
        saveLocalStorage(data);
        updateDisplay();
    }
}

function openEditModal(id) {
    const data = getLocalStorage();
    const expense = data.expenses.find(e => e.id === id);
    if (!expense) return;

    editingId = id;
    editingType = 'expense';
    document.getElementById('editDate').value = expense.date;
    document.getElementById('editName').value = expense.name;
    document.getElementById('editValue').value = expense.value;
    document.getElementById('editModal').classList.add('active');
}

function openEditBalanceModal(id) {
    const data = getLocalStorage();
    const balance = data.balances.find(b => b.id === id);
    if (!balance) return;

    editingId = id;
    editingType = 'balance';
    document.getElementById('editDate').value = balance.date;
    document.getElementById('editName').value = balance.name;
    document.getElementById('editValue').value = balance.value;
    document.getElementById('editModal').classList.add('active');
}

function closeModal() {
    document.getElementById('editModal').classList.remove('active');
    editingId = null;
    editingType = null;
}

function saveEdit() {
    const date = document.getElementById('editDate').value;
    const name = document.getElementById('editName').value;
    const value = parseFloat(document.getElementById('editValue').value);

    if (!isDateValid(date)) {
        alert('A data deve estar entre o primeiro dia do mês e hoje!');
        return;
    }

    if (!date || !name || !value || value <= 0) {
        alert('Dados inválidos!');
        return;
    }

    const data = getLocalStorage();
    
    if (editingType === 'expense') {
        const expense = data.expenses.find(e => e.id === editingId);
        if (expense) {
            expense.date = date;
            expense.name = name;
            expense.value = value;
        }
    } else if (editingType === 'balance') {
        const balance = data.balances.find(b => b.id === editingId);
        if (balance) {
            balance.date = date;
            balance.name = name;
            balance.value = value;
        }
    }
    
    saveLocalStorage(data);
    updateDisplay();
    closeModal();
}

function clearAll() {
    if (confirm('Limpar todos os dados?')) {
        localStorage.removeItem('financeData');
        updateDisplay();
    }
}

function updateDisplay() {
    const data = getLocalStorage();
    const totalExpenses = data.expenses.reduce((sum, e) => sum + e.value, 0);
    const totalBalances = data.balances.reduce((sum, b) => sum + b.value, 0);
    const balance = data.salary + totalBalances - totalExpenses;

    document.getElementById('salaryDisplay').textContent = formatMoney(data.salary);
    document.getElementById('expensesDisplay').textContent = formatMoney(totalExpenses);
    
    const balanceDisplay = document.getElementById('balanceDisplay');
    balanceDisplay.textContent = formatMoney(balance);
    
    if (balance < 0) {
        balanceDisplay.parentElement.classList.add('negative-balance');
    } else {
        balanceDisplay.parentElement.classList.remove('negative-balance');
    }

    const list = document.getElementById('expensesList');
    if (data.expenses.length === 0) {
        list.innerHTML = '<p class="empty-message">Nenhuma despesa registrada</p>';
    } else {
        list.innerHTML = data.expenses
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .map(e => `
                <div class="expense-item">
                    <div class="expense-info">
                        <div class="expense-date">${formatDate(e.date)}</div>
                        <div class="expense-name">${e.name}</div>
                    </div>
                    <div class="expense-value">- ${formatMoney(e.value)}</div>
                    <div class="expense-actions">
                        <button class="btn-edit" onclick="openEditModal(${e.id})">Editar</button>
                        <button class="btn-delete" onclick="deleteExpense(${e.id})">Deletar</button>
                    </div>
                </div>
            `).join('');
    }

    const balancesList = document.getElementById('balancesList');
    if (data.balances.length === 0) {
        balancesList.innerHTML = '<p class="empty-message">Nenhum saldo adicionado</p>';
    } else {
        balancesList.innerHTML = data.balances
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .map(b => `
                <div class="balance-item">
                    <div class="expense-info">
                        <div class="expense-date">${formatDate(b.date)}</div>
                        <div class="expense-name">${b.name}</div>
                    </div>
                    <div class="balance-value">+ ${formatMoney(b.value)}</div>
                    <div class="expense-actions">
                        <button class="btn-edit" onclick="openEditBalanceModal(${b.id})">Editar</button>
                        <button class="btn-delete" onclick="deleteBalance(${b.id})">Deletar</button>
                    </div>
                </div>
            `).join('');
    }

    updateChart(data.salary + totalBalances, data.expenses);
}

function updateChart(salary, expenses) {
    const ctx = document.getElementById('expenseChart');
    if (!ctx) return;

    const total = expenses.reduce((sum, e) => sum + e.value, 0);
    const balance = salary - total;
    
    const labels = expenses.map(e => e.name);
    const values = expenses.map(e => e.value);
    
    if (balance > 0) {
        labels.push('Livre');
        values.push(balance);
    }
    
    const colors = [];
    for (let i = 0; i < values.length; i++) {
        if (i === values.length - 1 && balance > 0) {
            colors.push('#10b981'); 
        } else {
            colors.push('#ef4444'); 
        }
    }

    const chartData = {
        labels: labels,
        datasets: [{
            data: values,
            backgroundColor: colors,
            borderColor: '#1e293b',
            borderWidth: 2,
        }]
    };

    if (chart) {
        chart.data = chartData;
        chart.update();
    } else {
        chart = new Chart(ctx, {
            type: 'doughnut',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#f1f5f9',
                            padding: 20,
                            font: { size: 12, weight: 'bold' }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const valor = formatMoney(context.parsed);
                                return context.label + ': ' + valor;
                            }
                        }
                    }
                }
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const modal = document.createElement('div');
    modal.id = 'editModal';
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Editar</h2>
                <button class="modal-close" onclick="closeModal()">&times;</button>
            </div>
            <form onsubmit="event.preventDefault(); saveEdit();">
                <div class="form-group">
                    <label for="editDate">Data</label>
                    <input type="date" id="editDate" required>
                </div>
                <div class="form-group">
                    <label for="editName">Nome</label>
                    <input type="text" id="editName" required>
                </div>
                <div class="form-group">
                    <label for="editValue">Valor (R$)</label>
                    <input type="number" id="editValue" min="0" step="0.01" required>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-danger" onclick="closeModal()">Cancelar</button>
                    <button type="submit" class="btn btn-success">Salvar Alterações</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);

   
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    
    const minDate = firstDay.toISOString().split('T')[0];
    const maxDate = today.toISOString().split('T')[0];
    
    const expenseDateInput = document.getElementById('expenseDate');
    const balanceDateInput = document.getElementById('balanceDate');
    const editDateInput = document.getElementById('editDate');
    
    expenseDateInput.min = minDate;
    expenseDateInput.max = maxDate;
    balanceDateInput.min = minDate;
    balanceDateInput.max = maxDate;
    editDateInput.min = minDate;
    editDateInput.max = maxDate;

    document.getElementById('salaryForm').addEventListener('submit', saveSalary);
    document.getElementById('expenseForm').addEventListener('submit', addExpense);
    document.getElementById('balanceForm').addEventListener('submit', addBalance);
    document.getElementById('clearAllBtn').addEventListener('click', clearAll);
    document.getElementById('editModal').addEventListener('click', (e) => {
        if (e.target.id === 'editModal') closeModal();
    });

    expenseDateInput.valueAsDate = new Date();
    balanceDateInput.valueAsDate = new Date();
    updateDisplay();
});
