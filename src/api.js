// Backend API bilan ishlash

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export class Api {
    // Barcha talabalarni olish
    static async getAllStudents() {
        try {
            const response = await fetch(`${API_URL}/students`);
            if (!response.ok) throw new Error('Network error');
            return await response.json();
        } catch (error) {
            console.error('Error fetching students:', error);
            return [];
        }
    }

    // Yangi talaba qo'shish (test boshlaganda)
    static async addStudent(studentName, studentGroup) {
        try {
            const response = await fetch(`${API_URL}/students`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ studentName, studentGroup })
            });
            if (!response.ok) throw new Error('Network error');
            return await response.json();
        } catch (error) {
            console.error('Error adding student:', error);
            return null;
        }
    }

    // Talaba natijasini yangilash (test tugaganda)
    static async updateStudentResult(studentName, studentGroup, score, percentage, passed) {
        try {
            const response = await fetch(`${API_URL}/students/update-by-name`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    studentName,
                    studentGroup,
                    score,
                    percentage,
                    passed
                })
            });
            if (!response.ok) throw new Error('Network error');
            return await response.json();
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
            const response = await fetch(`${API_URL}/statistics`);
            if (!response.ok) throw new Error('Network error');
            return await response.json();
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
}

