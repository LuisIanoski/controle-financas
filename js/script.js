class FinanceManager {
    constructor() {
        this.salary = 0;
        this.expenses = [];
        this.editingId = null;
        this.chart = null;
        this.loadFromLocalStorage();
        this.initializeEventListeners();
        this.updateDisplay();
        this.setTodayDate();
    }

    initializeEventListeners() {
        document.getElementById('salaryForm').addEventListener('submit', (e) =>
            this.handleSalarySubmit(e)
        );
        document.getElementById('expenseForm').addEventListener('submit', (e) =>
            this.handleExpenseSubmit(e)
        );

        document.getElementById('clearAllBtn').addEventListener('click', () =>
            this.clearAll()
        );

        document.querySelector('.modal-close')?.addEventListener('click', () =>
            this.closeModal()
        );
        document.getElementById('cancelEditBtn')?.addEventListener('click', () =>
            this.closeModal()
        );
        document.getElementById('confirmEditBtn')?.addEventListener('click', () =>
            this.confirmEdit()
        );

        document.getElementById('editModal')?.addEventListener('click', (e) => {
            if (e.target.id === 'editModal') {
                this.closeModal();
            }
        });
    }

    setTodayDate() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('expenseDate').valueAsDate = new Date(
            new Date(today).getTime() + new Date(today).getTimezoneOffset() * 60000
        );
    }

    handleSalarySubmit(event) {
        event.preventDefault();

        const salaryInput = document.getElementById('salaryInput');
        const salaryValue = parseFloat(salaryInput.value.trim());

        if (!salaryValue || salaryValue < 0) {
            this.showAlert('Por favor, insira um salário válido!', 'danger');
            return;
        }

        this.salary = salaryValue;
        this.saveToLocalStorage();
        this.updateDisplay();

        this.showAlert('Salário atualizado com sucesso!', 'success');
        salaryInput.value = '';
    }

    handleExpenseSubmit(event) {
        event.preventDefault();

        const dateInput = document.getElementById('expenseDate');
        const nameInput = document.getElementById('expenseName');
        const valueInput = document.getElementById('expenseValue');

        const date = dateInput.value;
        const name = nameInput.value.trim();
        const value = parseFloat(valueInput.value);

        if (!date) {
            this.showAlert('Por favor, selecione uma data!', 'danger');
            return;
        }

        if (!name || name.length < 3) {
            this.showAlert('O nome da despesa deve ter no mínimo 3 caracteres!', 'danger');
            return;
        }

        if (!value || value <= 0) {
            this.showAlert('Por favor, insira um valor válido maior que zero!', 'danger');
            return;
        }

        const expense = {
            id: Date.now(),
            date: date,
            name: name,
            value: value,
        };

        this.expenses.push(expense);
        this.saveToLocalStorage();
        this.updateDisplay();

        this.showAlert('Despesa adicionada com sucesso!', 'success');

        dateInput.value = this.getTodayDate();
        nameInput.value = '';
        valueInput.value = '';
        nameInput.focus();
    }

    deleteExpense(id) {
        if (confirm('Tem certeza que deseja deletar esta despesa?')) {
            this.expenses = this.expenses.filter((expense) => expense.id !== id);
            this.saveToLocalStorage();
            this.updateDisplay();
            this.showAlert('Despesa deletada com sucesso!', 'success');
        }
    }

    openEditModal(id) {
        const expense = this.expenses.find((e) => e.id === id);
        if (!expense) return;

        this.editingId = id;
        document.getElementById('editDate').value = expense.date;
        document.getElementById('editName').value = expense.name;
        document.getElementById('editValue').value = expense.value;

        document.getElementById('editModal').classList.add('active');
        document.getElementById('editName').focus();
    }

    closeModal() {
        document.getElementById('editModal').classList.remove('active');
        this.editingId = null;
    }

    confirmEdit() {
        const date = document.getElementById('editDate').value;
        const name = document.getElementById('editName').value.trim();
        const value = parseFloat(document.getElementById('editValue').value);

        if (!date) {
            this.showAlert('Por favor, selecione uma data!', 'danger');
            return;
        }

        if (!name || name.length < 3) {
            this.showAlert('O nome da despesa deve ter no mínimo 3 caracteres!', 'danger');
            return;
        }

        if (!value || value <= 0) {
            this.showAlert('Por favor, insira um valor válido maior que zero!', 'danger');
            return;
        }

        const expense = this.expenses.find((e) => e.id === this.editingId);
        if (expense) {
            expense.date = date;
            expense.name = name;
            expense.value = value;
            this.saveToLocalStorage();
            this.updateDisplay();
            this.closeModal();
            this.showAlert('Despesa atualizada com sucesso!', 'success');
        }
    }

    clearAll() {
        if (confirm('Tem certeza que deseja limpar TODOS os dados? Esta ação não pode ser desfeita!')) {
            this.salary = 0;
            this.expenses = [];
            this.saveToLocalStorage();
            this.updateDisplay();
            this.showAlert('Todos os dados foram apagados!', 'warning');
        }
    }

    getTotalExpenses() {
        return this.expenses.reduce((total, expense) => total + expense.value, 0);
    }

    getFinalBalance() {
        return this.salary - this.getTotalExpenses();
    }

    updateDisplay() {
        this.updateSummary();
        this.renderExpensesList();
        this.updateChart();
    }

    updateSummary() {
        const salary = this.salary;
        const totalExpenses = this.getTotalExpenses();
        const finalBalance = this.getFinalBalance();

        document.getElementById('salaryDisplay').textContent = this.formatCurrency(salary);
        document.getElementById('expensesDisplay').textContent = this.formatCurrency(totalExpenses);

        const balanceElement = document.getElementById('balanceDisplay');
        balanceElement.textContent = this.formatCurrency(finalBalance);
    }

    updateChart() {
        const totalExpenses = this.getTotalExpenses();
        const balance = this.getFinalBalance();
        const salary = this.salary;

        const ctx = document.getElementById('expenseChart');
        if (!ctx) return;

        const chartData = {
            labels: ['Despesas', 'Livre'],
            datasets: [{
                data: [totalExpenses, Math.max(balance, 0)],
                backgroundColor: ['#ef4444', '#10b981'],
                borderColor: ['#dc2626', '#059669'],
                borderWidth: 2,
            }]
        };

        if (this.chart) {
            this.chart.data = chartData;
            this.chart.update();
        } else {
            this.chart = new Chart(ctx, {
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
                                font: {
                                    size: 12,
                                    weight: 'bold'
                                }
                            }
                        }
                    }
                }
            });
        }
    }

    renderExpensesList() {
        const list = document.getElementById('expensesList');

        if (this.expenses.length === 0) {
            list.innerHTML = '<p class="empty-message">Nenhuma despesa registrada ainda</p>';
            return;
        }

        const sortedExpenses = [...this.expenses].sort(
            (a, b) => new Date(b.date) - new Date(a.date)
        );

        list.innerHTML = sortedExpenses
            .map((expense) => this.createExpenseItem(expense))
            .join('');

        document.querySelectorAll('.btn-edit').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.dataset.id);
                this.openEditModal(id);
            });
        });

        document.querySelectorAll('.btn-delete').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.dataset.id);
                this.deleteExpense(id);
            });
        });
    }

    createExpenseItem(expense) {
        const formattedDate = this.formatDate(expense.date);
        const formattedValue = this.formatCurrency(expense.value);

        return `
            <div class="expense-item">
                <div class="expense-info">
                    <div class="expense-date">${formattedDate}</div>
                    <div class="expense-name">${this.escapeHtml(expense.name)}</div>
                </div>
                <div class="expense-value">- ${formattedValue}</div>
                <div class="expense-actions">
                    <button class="btn-edit" data-id="${expense.id}">Editar</button>
                    <button class="btn-delete" data-id="${expense.id}">Deletar</button>
                </div>
            </div>
        `;
    }

    saveToLocalStorage() {
        const data = {
            salary: this.salary,
            expenses: this.expenses,
        };
        localStorage.setItem('financeData', JSON.stringify(data));
    }

    loadFromLocalStorage() {
        const data = localStorage.getItem('financeData');
        if (data) {
            try {
                const parsed = JSON.parse(data);
                this.salary = parsed.salary || 0;
                this.expenses = Array.isArray(parsed.expenses) ? parsed.expenses : [];
            } catch (error) {
                console.error('Erro ao carregar dados:', error);
                this.salary = 0;
                this.expenses = [];
            }
        }
    }

    formatCurrency(value) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(value);
    }

    formatDate(dateString) {
        const date = new Date(dateString + 'T00:00:00');
        return new Intl.DateTimeFormat('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        }).format(date);
    }

    getTodayDate() {
        const today = new Date();
        return today.toISOString().split('T')[0];
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showAlert(message, type = 'info') {
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.textContent = message;

        alert.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 6px;
            font-weight: 600;
            z-index: 2000;
            max-width: 300px;
            word-wrap: break-word;
        `;

        const colors = {
            success: { bg: '#10b981', text: '#fff' },
            danger: { bg: '#ef4444', text: '#fff' },
            warning: { bg: '#f59e0b', text: '#fff' },
            info: { bg: '#3b82f6', text: '#fff' },
        };

        const color = colors[type] || colors.info;
        alert.style.backgroundColor = color.bg;
        alert.style.color = color.text;

        document.body.appendChild(alert);

        setTimeout(() => {
            alert.style.opacity = '0';
            alert.style.transition = 'opacity 0.3s ease-out';
            setTimeout(() => alert.remove(), 300);
        }, 3000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (!document.getElementById('editModal')) {
        const modal = document.createElement('div');
        modal.id = 'editModal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Editar Despesa</h2>
                    <button class="modal-close">&times;</button>
                </div>
                <form id="editForm">
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
                        <button type="button" id="cancelEditBtn" class="btn btn-danger">Cancelar</button>
                        <button type="button" id="confirmEditBtn" class="btn btn-success">Salvar Alterações</button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modal);
    }

    window.financeManager = new FinanceManager();
});
