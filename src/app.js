import { Quiz } from './quiz.js';
import { AdminPanel } from './admin.js';

// Admin panel import qilindi

let currentView = 'home';

export function initApp() {
    renderHome();
    setupNavigation();
}

function renderHome() {
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="home-container">
            <div class="home-content">
                <h1>🎯 Quiz Up</h1>
                <p class="subtitle">HTML va CSS haqida 40 ta savol</p>
                <div class="home-buttons">
                    <button type="button" class="btn btn-primary" id="startQuizBtn">Testni boshlash</button>
                    <button type="button" class="btn btn-admin" id="adminBtn">👨‍🏫 Admin Panel</button>
                </div>
            </div>
        </div>
    `;

    document.getElementById('startQuizBtn').addEventListener('click', () => {
        currentView = 'quiz';
        const quiz = new Quiz();
        quiz.start();
    });

    document.getElementById('adminBtn').addEventListener('click', () => {
        showAdminPasswordPrompt();
    });
}

function showAdminPasswordPrompt() {
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="quiz-container">
            <div class="screen">
                <h1>👨‍🏫 Admin Panel</h1>
                <p class="subtitle">Parolni kiriting</p>
                <div class="name-input-container">
                    <input type="password" id="adminPasswordInput" class="name-input" placeholder="Parol..." autocomplete="off">
                    <button type="button" class="btn btn-primary" id="loginBtn">Kirish</button>
                    <button type="button" class="btn btn-secondary" id="backBtn">Orqaga</button>
                </div>
            </div>
        </div>
    `;
    
    const passwordInput = document.getElementById('adminPasswordInput');
    const loginBtn = document.getElementById('loginBtn');
    const backBtn = document.getElementById('backBtn');
    
    passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            authenticateAdmin();
        }
    });
    
    loginBtn.addEventListener('click', () => authenticateAdmin());
    backBtn.addEventListener('click', () => renderHome());
    passwordInput.focus();
}

async function authenticateAdmin() {
    const passwordInput = document.getElementById('adminPasswordInput');
    const enteredPassword = passwordInput.value;
    const correctPassword = localStorage.getItem('admin_password') || 'admin';
    
    if (enteredPassword === correctPassword) {
        sessionStorage.setItem('admin_authenticated', 'true');
        currentView = 'admin';
        console.log('Admin authenticated, loading panel...');
        const admin = new AdminPanel();
        await admin.render();
        console.log('Admin panel rendered');
    } else {
        alert('Noto\'g\'ri parol!');
        passwordInput.value = '';
        passwordInput.focus();
    }
}

function setupNavigation() {
    // Global navigation handler
    window.addEventListener('popstate', () => {
        if (currentView === 'home') {
            renderHome();
        }
    });
}

export function goHome() {
    currentView = 'home';
    renderHome();
}

