let editingId = null;
let chart = null;

function getLocalStorage() {
    const data = localStorage.getItem('financeData');
    return data ? JSON.parse(data) : { salary: 0, expenses: [] };
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

function deleteExpense(id) {
    if (confirm('Deletar esta despesa?')) {
        const data = getLocalStorage();
        data.expenses = data.expenses.filter(e => e.id !== id);
        saveLocalStorage(data);
        updateDisplay();
    }
}

function openEditModal(id) {
    const data = getLocalStorage();
    const expense = data.expenses.find(e => e.id === id);
    if (!expense) return;

    editingId = id;
    document.getElementById('editDate').value = expense.date;
    document.getElementById('editName').value = expense.name;
    document.getElementById('editValue').value = expense.value;
    document.getElementById('editModal').classList.add('active');
}

function closeModal() {
    document.getElementById('editModal').classList.remove('active');
    editingId = null;
}

function saveEdit() {
    const date = document.getElementById('editDate').value;
    const name = document.getElementById('editName').value;
    const value = parseFloat(document.getElementById('editValue').value);

    if (!date || !name || !value || value <= 0) {
        alert('Dados inválidos!');
        return;
    }

    const data = getLocalStorage();
    const expense = data.expenses.find(e => e.id === editingId);
    if (expense) {
        expense.date = date;
        expense.name = name;
        expense.value = value;
        saveLocalStorage(data);
        updateDisplay();
        closeModal();
    }
}

function clearAll() {
    if (confirm('Limpar todos os dados?')) {
        localStorage.removeItem('financeData');
        updateDisplay();
    }
}

function updateDisplay() {
    const data = getLocalStorage();
    const total = data.expenses.reduce((sum, e) => sum + e.value, 0);
    const balance = data.salary - total;

    document.getElementById('salaryDisplay').textContent = formatMoney(data.salary);
    document.getElementById('expensesDisplay').textContent = formatMoney(total);
    document.getElementById('balanceDisplay').textContent = formatMoney(balance);

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

    updateChart(data.salary, total);
}

function updateChart(salary, total) {
    const ctx = document.getElementById('expenseChart');
    if (!ctx) return;

    const balance = salary - total;
    const chartData = {
        labels: ['Despesas', 'Livre'],
        datasets: [{
            data: [total, Math.max(balance, 0)],
            backgroundColor: ['#ef4444', '#10b981'],
            borderColor: ['#dc2626', '#059669'],
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
                <h2>Editar Despesa</h2>
                <button class="modal-close" onclick="closeModal()">&times;</button>
            </div>
            <form onsubmit="event.preventDefault(); saveEdit();">
                <div class="form-group">
                    <label for="editDate">Data</label>
                    <input type="date" id="editDate" required>
                </div>
                <div class="form-group">
                    <label for="editName">Nome da Despesa</label>
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

    document.getElementById('salaryForm').addEventListener('submit', saveSalary);
    document.getElementById('expenseForm').addEventListener('submit', addExpense);
    document.getElementById('clearAllBtn').addEventListener('click', clearAll);
    document.getElementById('editModal').addEventListener('click', (e) => {
        if (e.target.id === 'editModal') closeModal();
    });

    document.getElementById('expenseDate').valueAsDate = new Date();
    updateDisplay();
});
