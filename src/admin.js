import { Storage } from './storage.js';
import { Api } from './api.js';
import './admin.css';

// Api import qilishni tekshirish
if (typeof Api === 'undefined') {
    console.error('Api class topilmadi!');
}

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
            console.log('Loading data from API...');
            const students = await Api.getAllStudents();
            const stats = await Api.getStatistics();
            
            console.log('Students loaded:', students.length);
            console.log('Statistics:', stats);
            
            this.results = students || [];
            this.statistics = stats || {
                total: 0,
                passed: 0,
                failed: 0,
                avgScore: 0
            };
        } catch (error) {
            console.error('Error loading data:', error);
            // Fallback to localStorage
            try {
                this.results = Storage.getAllStudents();
                this.statistics = Storage.getStatistics();
            } catch (e) {
                console.error('LocalStorage fallback error:', e);
                this.results = [];
                this.statistics = {
                    total: 0,
                    passed: 0,
                    failed: 0,
                    avgScore: 0
                };
            }
        }
    }

    async render() {
        console.log('🎨 Rendering admin panel...');
        await this.loadData();
        console.log('✅ Data loaded:', this.results.length, 'students, stats:', this.statistics);
        const app = document.getElementById('app');
        
        if (!app) {
            console.error('❌ App element topilmadi!');
            return;
        }
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
                        <div class="stat-value">${this.results.length}</div>
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
                
                <div style="background: #fff3cd; padding: 10px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
                    <strong>⏳ Test yechayotgan talabalar: ${this.results.filter(r => r.status === 'testing').length}</strong>
                </div>

                <div class="quiz-control-section" style="background: #e8f4f8; padding: 20px; border-radius: 10px; margin-bottom: 20px; text-align: center;">
                    <h3 style="margin: 0 0 15px 0; color: #333;">🎯 Quiz Boshqaruvi</h3>
                    <div id="quizStatusDisplay" style="margin-bottom: 15px; font-size: 1.1rem; font-weight: 600;">
                        <span id="quizStatusText">Yuklanmoqda...</span>
                    </div>
                    <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                        <button type="button" class="btn btn-success" id="startQuizBtn" style="display: none;">
                            ▶️ Testni Boshlash
                        </button>
                        <button type="button" class="btn btn-warning" id="stopQuizBtn" style="display: none;">
                            ⏸️ Testni To'xtatish
                        </button>
                    </div>
                </div>

                <div class="admin-actions">
                    <button type="button" class="btn btn-danger" id="clearBtn">Barcha natijalarni o'chirish</button>
                    <button type="button" class="btn btn-secondary" id="refreshBtn">Yangilash</button>
                </div>

                <div class="results-section">
                    <h2>Talabalar natijalari (Jami: ${this.results.length})</h2>
                    <p style="color: #666; margin-bottom: 15px; font-size: 0.9rem;">
                        💡 Ma'lumotlarni yangilash uchun "Yangilash" tugmasini bosing
                    </p>
                    ${this.results.length === 0 
                        ? '<p class="no-results">Hozircha natijalar yo\'q</p>'
                        : this.renderResultsTable()
                    }
                </div>
            </div>
        `;

        this.setupEventListeners();
        this.loadQuizStatus();
        // Auto-refresh o'chirilgan
        // this.startAutoRefresh();
    }

    async loadQuizStatus() {
        try {
            const status = await Api.getQuizStatus();
            this.updateQuizStatusUI(status.quizStarted);
        } catch (error) {
            console.error('Error loading quiz status:', error);
            this.updateQuizStatusUI(false);
        }
    }

    updateQuizStatusUI(quizStarted) {
        const statusText = document.getElementById('quizStatusText');
        const startBtn = document.getElementById('startQuizBtn');
        const stopBtn = document.getElementById('stopQuizBtn');

        if (statusText && startBtn && stopBtn) {
            if (quizStarted) {
                statusText.innerHTML = '<span style="color: #28a745;">✅ Test boshlandi - Talabalar testni boshlay oladi</span>';
                startBtn.style.display = 'none';
                stopBtn.style.display = 'inline-block';
            } else {
                statusText.innerHTML = '<span style="color: #dc3545;">⏸️ Test to\'xtatilgan - Talabalar testni boshlay olmaydi</span>';
                startBtn.style.display = 'inline-block';
                stopBtn.style.display = 'none';
            }
        }
    }

    startAutoRefresh() {
        // Avvalgi intervalni tozalash
        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
            this.autoRefreshInterval = null;
        }
        
        console.log('🔄 Auto-refresh ishga tushirildi (har 2 soniyada)');
        
        // Har 2 soniyada yangilash (real-time uchun)
        this.autoRefreshInterval = setInterval(async () => {
            try {
                const app = document.getElementById('app');
                // Faqat admin panel ochiq bo'lsa yangilash
                if (app && app.querySelector('.admin-container')) {
                    console.log('🔄 Auto-refreshing...');
                    const oldCount = this.results.length;
                    await this.loadData();
                    const newCount = this.results.length;
                    
                    if (oldCount !== newCount) {
                        console.log(`📊 Talabalar soni o'zgardi: ${oldCount} → ${newCount}`);
                    }
                    
                    // UI ni yangilash
                    await this.updateUI();
                    // Quiz status'ni ham yangilash
                    await this.loadQuizStatus();
                } else {
                    console.log('⏸️ Admin panel ochiq emas, yangilash bekor qilindi');
                }
            } catch (error) {
                console.error('❌ Auto-refresh error:', error);
            }
        }, 2000);
    }

    // UI ni yangilash (to'liq render qilmasdan)
    async updateUI() {
        const app = document.getElementById('app');
        if (!app || !app.querySelector('.admin-container')) {
            console.log('⚠️ Admin container topilmadi, updateUI bekor qilindi');
            return;
        }

        console.log('🔄 UI yangilanmoqda...', this.results.length, 'talaba');
        
        try {
            // Statistikani yangilash
            const statCards = app.querySelectorAll('.stat-card .stat-value');
            if (statCards.length >= 4) {
                statCards[0].textContent = this.results.length;
                statCards[1].textContent = this.statistics.passed;
                statCards[2].textContent = this.statistics.failed;
                statCards[3].textContent = `${this.statistics.avgScore}%`;
            }

            // Test yechayotgan talabalar sonini yangilash
            const testingCount = this.results.filter(r => r.status === 'testing').length;
            const testingInfo = app.querySelector('.admin-stats + div');
            if (testingInfo) {
                testingInfo.innerHTML = `<strong>⏳ Test yechayotgan talabalar: ${testingCount}</strong>`;
            }

            // Jadvalni yangilash
            const resultsSection = app.querySelector('.results-section');
            if (resultsSection) {
                const h2 = resultsSection.querySelector('h2');
                if (h2) {
                    h2.textContent = `Talabalar natijalari (Jami: ${this.results.length})`;
                }

                if (this.results.length === 0) {
                    const tableContainer = resultsSection.querySelector('.table-container');
                    const noResults = resultsSection.querySelector('.no-results');
                    if (tableContainer) {
                        tableContainer.remove();
                    }
                    if (!noResults) {
                        const p = document.createElement('p');
                        p.className = 'no-results';
                        p.textContent = "Hozircha natijalar yo'q";
                        resultsSection.appendChild(p);
                    }
                } else {
                    // Jadvalni to'liq yangilash
                    const tableContainer = resultsSection.querySelector('.table-container');
                    const noResults = resultsSection.querySelector('.no-results');
                    
                    if (noResults) {
                        noResults.remove();
                    }
                    
                    // Eski jadvalni olib tashlash va yangisini qo'shish
                    if (tableContainer) {
                        const newTableHTML = this.renderResultsTable();
                        tableContainer.outerHTML = newTableHTML;
                        // Delete button event listenerlarni qo'shish
                        this.setupDeleteButtons();
                    } else {
                        // Agar jadval yo'q bo'lsa, yangisini yaratish
                        const newTableHTML = this.renderResultsTable();
                        resultsSection.insertAdjacentHTML('beforeend', newTableHTML);
                        this.setupDeleteButtons();
                    }
                }
            }
        } catch (error) {
            console.error('❌ UI yangilashda xatolik:', error);
            // Xatolik bo'lsa, to'liq render qilish
            await this.render();
        }
    }

    setupDeleteButtons() {
        // Delete buttons
        document.querySelectorAll('.btn-delete').forEach(btn => {
            // Avvalgi event listenerlarni olib tashlash
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            
            newBtn.addEventListener('click', async (e) => {
                const id = parseInt(e.target.dataset.id);
                if (confirm('Bu natijani o\'chirishni tasdiqlaysizmi?')) {
                    try {
                        await Api.deleteStudent(id);
                    } catch (error) {
                        console.error('Error deleting student:', error);
                        Storage.deleteResult(id);
                    }
                    await this.loadData();
                    await this.updateUI();
                }
            });
        });
    }

    stopAutoRefresh() {
        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
            this.autoRefreshInterval = null;
        }
    }

    renderResultsTable() {
        // Natijalarni tartiblash:
        // 1. Avval "testing" statusdagi talabalar (yuqorida) - eng yangisi birinchi
        // 2. Keyin "completed" statusdagi talabalar (pastda) - eng yangisi pastga qo'shiladi
        const sortedResults = [...this.results].sort((a, b) => {
            const aIsTesting = a.status === 'testing';
            const bIsTesting = b.status === 'testing';
            
            // Testing statusdagi talabalar birinchi (eng yangisi birinchi)
            if (aIsTesting && !bIsTesting) return -1;
            if (!aIsTesting && bIsTesting) return 1;
            
            // Bir xil status bo'lsa
            const timeA = a.timestamp || new Date(a.updated_at || a.created_at || 0).getTime();
            const timeB = b.timestamp || new Date(b.updated_at || b.created_at || 0).getTime();
            
            // Testing bo'lsa: eng yangisi birinchi (DESC)
            // Completed bo'lsa: eng yangisi pastga (ASC) - yangi ma'lumotlar pastga qo'shiladi
            if (aIsTesting) {
                return timeB - timeA; // DESC - eng yangisi birinchi
            } else {
                return timeA - timeB; // ASC - eng yangisi pastga
            }
        });

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
                            const isTesting = result.status === 'testing' || result.status === 'testing';
                            const passed = result.passed === 1 || result.passed === true;
                            const rowClass = isTesting ? 'testing-row' : (passed ? 'passed-row' : 'failed-row');
                            
                            // Field nomlarini tekshirish (backend dan kelgan ma'lumotlar)
                            const studentName = result.student_name || result.studentName;
                            const studentGroup = result.student_group || result.studentGroup;
                            const dateField = result.created_at || result.date;
                            
                            return `
                            <tr class="${rowClass}">
                                <td>${index + 1}</td>
                                <td><strong>${studentName || 'Noma\'lum'}</strong> ${isTesting ? '⏳' : ''}</td>
                                <td>${studentGroup || 'Noma\'lum'}</td>
                                <td>${isTesting ? '<span style="color: #667eea; font-weight: 600;">Test yechmoqda...</span>' : `${result.score || 0} / 40`}</td>
                                <td>${isTesting ? '-' : `${result.percentage || 0}%`}</td>
                                <td>
                                    ${isTesting 
                                        ? '<span class="status-badge testing">⏳ Test yechmoqda</span>'
                                        : `<span class="status-badge ${passed ? 'success' : 'danger'}">
                                            ${passed ? '✅ O\'tdi' : '❌ O\'tmadi'}
                                           </span>`
                                    }
                                </td>
                                <td>${this.formatDate(dateField)}</td>
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

        // Quiz Start/Stop buttons
        const startQuizBtn = document.getElementById('startQuizBtn');
        const stopQuizBtn = document.getElementById('stopQuizBtn');

        if (startQuizBtn) {
            startQuizBtn.addEventListener('click', async () => {
                if (confirm('Testni boshlashni tasdiqlaysizmi? Talabalar testni boshlay oladi.')) {
                    try {
                        await Api.startQuiz();
                        await this.loadQuizStatus();
                        alert('✅ Test boshlandi! Talabalar endi testni boshlay oladi.');
                    } catch (error) {
                        console.error('Error starting quiz:', error);
                        alert('❌ Xatolik yuz berdi. Qayta urinib ko\'ring.');
                    }
                }
            });
        }

        if (stopQuizBtn) {
            stopQuizBtn.addEventListener('click', async () => {
                if (confirm('Testni to\'xtatishni tasdiqlaysizmi? Talabalar testni boshlay olmaydi.')) {
                    try {
                        await Api.stopQuiz();
                        await this.loadQuizStatus();
                        alert('⏸️ Test to\'xtatildi! Talabalar testni boshlay olmaydi.');
                    } catch (error) {
                        console.error('Error stopping quiz:', error);
                        alert('❌ Xatolik yuz berdi. Qayta urinib ko\'ring.');
                    }
                }
            });
        }

        // Delete buttons
        this.setupDeleteButtons();
    }
}

