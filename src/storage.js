// LocalStorage bilan ishlash

export class Storage {
    static STORAGE_KEY = 'quiz_results';
    static ACTIVE_STUDENTS_KEY = 'active_students';

    // Talaba testni boshlaganda ma'lumotlarni saqlash
    static saveActiveStudent(studentName, studentGroup) {
        const activeStudents = this.getActiveStudents();
        const student = {
            id: Date.now(),
            studentName: studentName || 'Noma\'lum',
            studentGroup: studentGroup || 'Noma\'lum',
            startTime: new Date().toISOString(),
            timestamp: Date.now(),
            status: 'testing' // testing, completed
        };
        
        activeStudents.push(student);
        localStorage.setItem(this.ACTIVE_STUDENTS_KEY, JSON.stringify(activeStudents));
        return student;
    }

    // Faol talabalarni olish
    static getActiveStudents() {
        const data = localStorage.getItem(this.ACTIVE_STUDENTS_KEY);
        return data ? JSON.parse(data) : [];
    }

    // Talaba testni tugatganda faol ro'yxatdan o'chirish
    static removeActiveStudent(id) {
        const activeStudents = this.getActiveStudents();
        const filtered = activeStudents.filter(s => s.id !== id);
        localStorage.setItem(this.ACTIVE_STUDENTS_KEY, JSON.stringify(filtered));
    }

    // Barcha talabalarni olish (faol va tugatganlar)
    static getAllStudents() {
        const results = this.getAllResults();
        const activeStudents = this.getActiveStudents();
        
        // Faol talabalarni natijalar bilan birlashtirish
        const allStudents = [...results];
        
        // Faol talabalarni qo'shish (agar ular natijalar ro'yxatida bo'lmasa)
        activeStudents.forEach(active => {
            const exists = results.find(r => r.studentName === active.studentName && 
                                             r.studentGroup === active.studentGroup &&
                                             Math.abs(new Date(r.date).getTime() - new Date(active.startTime).getTime()) < 60000);
            if (!exists) {
                allStudents.push({
                    id: active.id,
                    studentName: active.studentName,
                    studentGroup: active.studentGroup,
                    score: '-',
                    percentage: '-',
                    passed: null,
                    date: active.startTime,
                    timestamp: active.timestamp,
                    status: 'testing'
                });
            }
        });
        
        return allStudents.sort((a, b) => b.timestamp - a.timestamp);
    }

    // Natijani saqlash
    static saveResult(studentName, studentGroup, score, percentage, passed) {
        const results = this.getAllResults();
        const result = {
            id: Date.now(),
            studentName: studentName || 'Noma\'lum',
            studentGroup: studentGroup || 'Noma\'lum',
            score: score,
            percentage: percentage,
            passed: passed,
            date: new Date().toISOString(),
            timestamp: Date.now(),
            status: 'completed'
        };
        
        results.push(result);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(results));
        
        // Faol ro'yxatdan o'chirish
        const activeStudents = this.getActiveStudents();
        const studentToRemove = activeStudents.find(s => 
            s.studentName === studentName && 
            s.studentGroup === studentGroup &&
            Math.abs(new Date(s.startTime).getTime() - new Date(result.date).getTime()) < 300000 // 5 daqiqa ichida
        );
        if (studentToRemove) {
            this.removeActiveStudent(studentToRemove.id);
        }
        
        return result;
    }

    // Barcha natijalarni olish
    static getAllResults() {
        const data = localStorage.getItem(this.STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    }

    // Natijalarni o'chirish
    static deleteResult(id) {
        const results = this.getAllResults();
        const filtered = results.filter(r => r.id !== id);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
    }

    // Barcha natijalarni tozalash
    static clearAllResults() {
        localStorage.removeItem(this.STORAGE_KEY);
    }

    // Statistikalar
    static getStatistics() {
        const results = this.getAllResults();
        const total = results.length;
        const passed = results.filter(r => r.passed).length;
        const failed = total - passed;
        const avgScore = total > 0 
            ? Math.round(results.reduce((sum, r) => sum + r.percentage, 0) / total)
            : 0;

        return {
            total,
            passed,
            failed,
            avgScore
        };
    }
}

