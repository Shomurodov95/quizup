import { Storage } from './storage.js';
import { Api } from './api.js';
import './admin.css';

export class AdminPanel {
    constructor() {
        this.results = [];
        this.statistics = {
            total: 0,
            passed: 0,
            failed: 0,
            avgScore: 0
        };
        this.autoRefreshInterval = null;
    }

    async loadData() {
        try {
            this.results = await Api.getAllStudents();
            this.statistics = await Api.getStatistics();
        } catch (error) {
            console.error('Error loading data:', error);
            // Fallback to localStorage
            this.results = Storage.getAllStudents();
            this.statistics = Storage.getStatistics();
        }
    }

    async render() {
        await this.loadData();
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="admin-container">
                <div class="admin-header">
                    <h1>👨‍🏫 Admin Panel</h1>
                    <div class="admin-header-actions">
                        <a href="/" class="btn btn-secondary">Talabalar sahifasi</a>
                        <button type="button" class="btn btn-secondary" id="logoutBtn">Chiqish</button>
                    </div>
                </div>

                <div class="admin-stats">
                    <div class="stat-card">
                        <div class="stat-value">${this.statistics.total}</div>
                        <div class="stat-label">Jami talabalar</div>
                    </div>
                    <div class="stat-card success">
                        <div class="stat-value">${this.statistics.passed}</div>
                        <div class="stat-label">O'tganlar</div>
                    </div>
                    <div class="stat-card danger">
                        <div class="stat-value">${this.statistics.failed}</div>
                        <div class="stat-label">O'tmaganlar</div>
                    </div>
                    <div class="stat-card info">
                        <div class="stat-value">${this.statistics.avgScore}%</div>
                        <div class="stat-label">O'rtacha ball</div>
                    </div>
                </div>

                <div class="admin-actions">
                    <button type="button" class="btn btn-danger" id="clearBtn">Barcha natijalarni o'chirish</button>
                    <button type="button" class="btn btn-secondary" id="refreshBtn">Yangilash</button>
                </div>

                <div class="results-section">
                    <h2>Talabalar natijalari</h2>
                    <p style="color: #666; margin-bottom: 15px; font-size: 0.9rem;">
                        💡 Ma'lumotlar avtomatik yangilanadi (har 3 soniyada)
                    </p>
                    ${this.results.length === 0 
                        ? '<p class="no-results">Hozircha natijalar yo\'q</p>'
                        : this.renderResultsTable()
                    }
                </div>
            </div>
        `;

        this.setupEventListeners();
        this.startAutoRefresh();
    }

    startAutoRefresh() {
        // Avvalgi intervalni tozalash
        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
        }
        
        // Har 3 soniyada yangilash
        this.autoRefreshInterval = setInterval(async () => {
            await this.loadData();
            await this.render();
        }, 3000);
    }

    stopAutoRefresh() {
        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
            this.autoRefreshInterval = null;
        }
    }

    renderResultsTable() {
        // Natijalarni sanaga qarab teskari tartibda ko'rsatish (eng yangisi birinchi)
        const sortedResults = [...this.results].sort((a, b) => b.timestamp - a.timestamp);

        return `
            <div class="table-container">
                <table class="results-table">
                    <thead>
                        <tr>
                            <th>№</th>
                            <th>Talaba ismi</th>
                            <th>Guruh</th>
                            <th>Ball</th>
                            <th>Foiz</th>
                            <th>Holat</th>
                            <th>Sana</th>
                            <th>Amallar</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${sortedResults.map((result, index) => {
                            const isTesting = result.status === 'testing';
                            const passed = result.passed === 1 || result.passed === true;
                            const rowClass = isTesting ? 'testing-row' : (passed ? 'passed-row' : 'failed-row');
                            
                            return `
                            <tr class="${rowClass}">
                                <td>${index + 1}</td>
                                <td>${result.student_name} ${isTesting ? '⏳' : ''}</td>
                                <td>${result.student_group || 'Noma\'lum'}</td>
                                <td>${isTesting ? '<span style="color: #667eea;">Test yechmoqda...</span>' : `${result.score} / 40`}</td>
                                <td>${isTesting ? '-' : `${result.percentage}%`}</td>
                                <td>
                                    ${isTesting 
                                        ? '<span class="status-badge testing">⏳ Test yechmoqda</span>'
                                        : `<span class="status-badge ${passed ? 'success' : 'danger'}">
                                            ${passed ? '✅ O\'tdi' : '❌ O\'tmadi'}
                                           </span>`
                                    }
                                </td>
                                <td>${this.formatDate(result.created_at || result.date)}</td>
                                <td>
                                    ${!isTesting ? `<button type="button" class="btn-delete" data-id="${result.id}">🗑️</button>` : '-'}
                                </td>
                            </tr>
                        `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    formatDate(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${day}.${month}.${year} ${hours}:${minutes}`;
    }

    setupEventListeners() {
        document.getElementById('logoutBtn').addEventListener('click', () => {
            sessionStorage.removeItem('admin_authenticated');
            window.location.href = '/?admin=true';
        });

        document.getElementById('refreshBtn').addEventListener('click', async () => {
            await this.loadData();
            await this.render();
        });

        document.getElementById('clearBtn').addEventListener('click', async () => {
            if (confirm('Barcha natijalarni o\'chirishni tasdiqlaysizmi?')) {
                try {
                    await Api.clearAllResults();
                } catch (error) {
                    console.error('Error clearing results:', error);
                    Storage.clearAllResults();
                }
                await this.loadData();
                await this.render();
            }
        });

        // Delete buttons
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = parseInt(e.target.dataset.id);
                if (confirm('Bu natijani o\'chirishni tasdiqlaysizmi?')) {
                    try {
                        await Api.deleteStudent(id);
                    } catch (error) {
                        console.error('Error deleting student:', error);
                        Storage.deleteResult(id);
                    }
                    await this.loadData();
                    await this.render();
                }
            });
        });
    }
}

