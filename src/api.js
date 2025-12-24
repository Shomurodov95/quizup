// Backend API bilan ishlash

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// API xatoliklarini boshqarish
async function fetchWithErrorHandling(url, options = {}) {
    try {
        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API request failed:', error);
        throw error;
    }
}

export class Api {
    // Barcha talabalarni olish
    static async getAllStudents() {
        try {
            console.log('Fetching students from:', `${API_URL}/students`);
            const data = await fetchWithErrorHandling(`${API_URL}/students`);
            console.log('Students received:', data);
            return Array.isArray(data) ? data : [];
        } catch (error) {
            console.error('Error fetching students:', error);
            return [];
        }
    }

    // Yangi talaba qo'shish (test boshlaganda)
    static async addStudent(studentName, studentGroup) {
        try {
            console.log('Adding student:', studentName, studentGroup);
            const data = await fetchWithErrorHandling(`${API_URL}/students`, {
                method: 'POST',
                body: JSON.stringify({ studentName, studentGroup })
            });
            console.log('Student added:', data);
            return data;
        } catch (error) {
            console.error('Error adding student:', error);
            return null;
        }
    }

    // Talaba natijasini yangilash (test tugaganda)
    static async updateStudentResult(studentName, studentGroup, score, percentage, passed) {
        try {
            console.log('Updating student result:', { studentName, studentGroup, score, percentage, passed });
            const data = await fetchWithErrorHandling(`${API_URL}/students/update-by-name`, {
                method: 'PUT',
                body: JSON.stringify({
                    studentName,
                    studentGroup,
                    score,
                    percentage,
                    passed
                })
            });
            console.log('Student result updated:', data);
            return data;
        } catch (error) {
            console.error('Error updating student:', error);
            return null;
        }
    }

    // Talabani o'chirish
    static async deleteStudent(id) {
        try {
            const response = await fetch(`${API_URL}/students/${id}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Network error');
            return await response.json();
        } catch (error) {
            console.error('Error deleting student:', error);
            return false;
        }
    }

    // Barcha natijalarni o'chirish
    static async clearAllResults() {
        try {
            const response = await fetch(`${API_URL}/students`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Network error');
            return await response.json();
        } catch (error) {
            console.error('Error clearing results:', error);
            return false;
        }
    }

    // Statistikalar
    static async getStatistics() {
        try {
            console.log('Fetching statistics from:', `${API_URL}/statistics`);
            const data = await fetchWithErrorHandling(`${API_URL}/statistics`);
            console.log('Statistics received:', data);
            return data || {
                total: 0,
                passed: 0,
                failed: 0,
                avgScore: 0
            };
        } catch (error) {
            console.error('Error fetching statistics:', error);
            return {
                total: 0,
                passed: 0,
                failed: 0,
                avgScore: 0
            };
        }
    }

    // Quiz status olish
    static async getQuizStatus() {
        try {
            console.log('📡 Fetching quiz status from:', `${API_URL}/quiz/status`);
            const response = await fetch(`${API_URL}/quiz/status`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`Server xatosi: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('✅ Quiz status received:', data);
            return data;
        } catch (error) {
            console.error('❌ Error fetching quiz status:', error);
            // Xatolik bo'lsa, server ishlamayapti deb hisoblaymiz
            return { quizStarted: false, error: error.message };
        }
    }

    // Server holatini tekshirish
    static async checkServerHealth() {
        try {
            const response = await fetch(`${API_URL}/health`, {
                method: 'GET',
                timeout: 5000
            });
            return response.ok;
        } catch (error) {
            console.error('Server health check failed:', error);
            return false;
        }
    }

    // Quizni boshlash
    static async startQuiz() {
        try {
            // Avval server ishlayotganini tekshirish
            const serverOk = await this.checkServerHealth();
            if (!serverOk) {
                throw new Error('Server ishlamayapti! Iltimos, server.py ni ishga tushiring.');
            }

            console.log('📡 Sending start quiz request to:', `${API_URL}/quiz/start`);
            const response = await fetch(`${API_URL}/quiz/start`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Server xatosi: ${response.status} - ${errorText}`);
            }
            
            const data = await response.json();
            console.log('✅ Quiz start response:', data);
            return data;
        } catch (error) {
            console.error('❌ Error starting quiz:', error);
            throw error;
        }
    }

    // Quizni to'xtatish
    static async stopQuiz() {
        try {
            // Avval server ishlayotganini tekshirish
            const serverOk = await this.checkServerHealth();
            if (!serverOk) {
                throw new Error('Server ishlamayapti! Iltimos, server.py ni ishga tushiring.');
            }

            console.log('📡 Sending stop quiz request to:', `${API_URL}/quiz/stop`);
            const response = await fetch(`${API_URL}/quiz/stop`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Server xatosi: ${response.status} - ${errorText}`);
            }
            
            const data = await response.json();
            console.log('✅ Quiz stop response:', data);
            return data;
        } catch (error) {
            console.error('❌ Error stopping quiz:', error);
            throw error;
        }
    }
}

