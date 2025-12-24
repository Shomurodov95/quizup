import { questions } from './questions.js';
import { Storage } from './storage.js';
import { Api } from './api.js';
import { goHome } from './app.js';

export class Quiz {
    constructor() {
        this.currentQuestion = 0;
        this.score = 0;
        this.selectedAnswer = null;
        this.studentName = '';
        this.studentGroup = '';
    }

    start() {
        this.showNameInput();
    }

    showNameInput() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="quiz-container">
                <div class="screen">
                    <h1>🎯 Quiz Up</h1>
                    <p class="subtitle">Ma'lumotlaringizni kiriting</p>
                    <div class="name-input-container">
                        <input type="text" id="studentNameInput" class="name-input" placeholder="Ismingiz..." maxlength="50" required>
                        <input type="text" id="studentGroupInput" class="name-input" placeholder="Guruhi (masalan: 101, 102, A1)" maxlength="20" required>
                        <button type="button" class="btn btn-primary" id="startQuizBtn">Boshlash</button>
                    </div>
                </div>
            </div>
        `;

        const nameInput = document.getElementById('studentNameInput');
        const groupInput = document.getElementById('studentGroupInput');
        const startBtn = document.getElementById('startQuizBtn');

        const handleStart = () => {
            if (nameInput.value.trim() && groupInput.value.trim()) {
                this.beginQuiz();
            } else {
                alert('Iltimos, ism va guruhni kiriting!');
            }
        };

        nameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                groupInput.focus();
            }
        });

        groupInput.addEventListener('keypress', async (e) => {
            if (e.key === 'Enter') {
                if (nameInput.value.trim() && groupInput.value.trim()) {
                    await this.beginQuiz();
                } else {
                    alert('Iltimos, ism va guruhni kiriting!');
                }
            }
        });

        startBtn.addEventListener('click', handleStart);
        nameInput.focus();
    }

    async beginQuiz() {
        // Avval quiz status'ni tekshirish
        try {
            console.log('🔍 Checking quiz status before starting...');
            const quizStatus = await Api.getQuizStatus();
            console.log('📊 Quiz status:', quizStatus);
            
            if (!quizStatus || !quizStatus.quizStarted) {
                const errorMsg = quizStatus?.error 
                    ? `⏸️ Server bilan bog'lanishda muammo!\n\nXatolik: ${quizStatus.error}\n\nIltimos, server ishlayotganini tekshiring.`
                    : '⏸️ Test hali boshlanmagan!\n\nIltimos, admin testni boshlashini kutib turing.';
                alert(errorMsg);
                return;
            }
            console.log('✅ Quiz started, proceeding...');
        } catch (error) {
            console.error('❌ Error checking quiz status:', error);
            alert(`⏸️ Server bilan bog'lanishda muammo!\n\nXatolik: ${error.message}\n\nIltimos, server ishlayotganini tekshiring.`);
            return;
        }

        const nameInput = document.getElementById('studentNameInput');
        const groupInput = document.getElementById('studentGroupInput');
        this.studentName = nameInput.value.trim() || 'Noma\'lum';
        this.studentGroup = groupInput.value.trim() || 'Noma\'lum';
        this.currentQuestion = 0;
        this.score = 0;
        this.selectedAnswer = null;
        
        // Talaba testni boshlaganda ma'lumotlarni saqlash
        // Backend ga yuborish
        try {
            const student = await Api.addStudent(this.studentName, this.studentGroup);
            this.activeStudentId = student?.id;
        } catch (error) {
            console.error('Error saving student:', error);
            // Fallback to localStorage
            this.activeStudentId = Storage.saveActiveStudent(this.studentName, this.studentGroup).id;
        }
        
        this.showQuestion();
    }

    showQuestion() {
        const question = questions[this.currentQuestion];
        const app = document.getElementById('app');
        
        app.innerHTML = `
            <div class="quiz-container">
                <div class="screen" id="quizScreen">
                    <div class="quiz-header">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${((this.currentQuestion + 1) / questions.length) * 100}%"></div>
                        </div>
                        <div class="quiz-info">
                            <span class="question-number">${this.currentQuestion + 1} / ${questions.length}</span>
                            <span class="score">Ball: ${this.score}</span>
                        </div>
                    </div>

                    <div class="question-container">
                        <h2 class="question">${question.question}</h2>
                        <div class="answers" id="answersContainer"></div>
                    </div>

                    <button type="button" class="btn btn-secondary hidden" id="nextBtn">Keyingi savol</button>
                </div>
            </div>
        `;

        const answersContainer = document.getElementById('answersContainer');
        const nextBtn = document.getElementById('nextBtn');

        question.answers.forEach((answer, index) => {
            const answerBtn = document.createElement('button');
            answerBtn.className = 'answer-btn';
            answerBtn.textContent = answer;
            answerBtn.addEventListener('click', () => this.selectAnswer(index));
            answersContainer.appendChild(answerBtn);
        });

        nextBtn.addEventListener('click', () => this.nextQuestion());
        this.selectedAnswer = null;
    }

    selectAnswer(index) {
        if (this.selectedAnswer !== null) return;

        this.selectedAnswer = index;
        const question = questions[this.currentQuestion];
        const answerButtons = document.querySelectorAll('.answer-btn');
        const nextBtn = document.getElementById('nextBtn');

        answerButtons.forEach(btn => btn.disabled = true);

        answerButtons[index].classList.add('selected');

        if (index === question.correct) {
            answerButtons[index].classList.add('correct');
            this.score++;
            document.querySelector('.score').textContent = `Ball: ${this.score}`;
        } else {
            answerButtons[index].classList.add('incorrect');
            answerButtons[question.correct].classList.add('correct');
        }

        nextBtn.classList.remove('hidden');
    }

    nextQuestion() {
        this.currentQuestion++;

        if (this.currentQuestion < questions.length) {
            this.showQuestion();
        } else {
            this.showResults();
        }
    }

    async showResults() {
        const percentage = Math.round((this.score / questions.length) * 100);
        const passed = percentage >= 60;

        // Backend ga natijani yuborish
        try {
            await Api.updateStudentResult(this.studentName, this.studentGroup, this.score, percentage, passed);
            
            // Alert ko'rsatish - Test tugadi
            alert(`✅ Test tugatildi!\n\nTalaba: ${this.studentName}\nGuruh: ${this.studentGroup}\nBall: ${this.score} / ${questions.length}\nFoiz: ${percentage}%\nHolat: ${passed ? '✅ O\'tdi' : '❌ O\'tmadi'}\n\nMa'lumotlar admin panelga yuborildi!`);
        } catch (error) {
            console.error('Error saving result:', error);
            // Fallback to localStorage
            if (this.activeStudentId) {
                Storage.removeActiveStudent(this.activeStudentId);
            }
            Storage.saveResult(this.studentName, this.studentGroup, this.score, percentage, passed);
            
            // Alert ko'rsatish (fallback)
            alert(`✅ Test tugatildi!\n\nTalaba: ${this.studentName}\nGuruh: ${this.studentGroup}\nBall: ${this.score} / ${questions.length}\nFoiz: ${percentage}%\nHolat: ${passed ? '✅ O\'tdi' : '❌ O\'tmadi'}`);
        }

        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="quiz-container">
                <div class="screen">
                    <h1>🎉 Test yakunlandi!</h1>
                    <div class="results-content">
                        <div class="score-circle ${passed ? 'passed' : 'failed'}">
                            <div class="score-value">${this.score}</div>
                            <div class="score-label">/ ${questions.length}</div>
                        </div>
                        <p class="score-percentage">${percentage}%</p>
                        <p class="score-message ${passed ? 'passed' : 'failed'}">
                            ${passed 
                                ? "🎉 Tabriklaymiz! Siz o'tdingiz! 🎉" 
                                : "Yaxshilab o'rganish kerak. Qayta urinib ko'ring! 📚"}
                        </p>
                        <p class="student-name">Talaba: ${this.studentName} | Guruh: ${this.studentGroup}</p>
                    </div>
                    <div class="results-actions">
                        <button type="button" class="btn btn-primary" id="restartBtn">Qayta o'ynash</button>
                        <button type="button" class="btn btn-secondary" id="homeBtn">Bosh sahifa</button>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('restartBtn').addEventListener('click', () => {
            this.start();
        });

        document.getElementById('homeBtn').addEventListener('click', () => {
            goHome();
        });
    }
}

