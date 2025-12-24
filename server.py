from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Database fayl yo'li
DB_PATH = 'quiz.db'

def init_database():
    """Database va jadvalni yaratish"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS students (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_name TEXT NOT NULL,
            student_group TEXT NOT NULL,
            score INTEGER DEFAULT 0,
            percentage INTEGER DEFAULT 0,
            passed INTEGER DEFAULT 0,
            status TEXT DEFAULT 'testing',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Quiz status jadvali
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS quiz_status (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            quiz_started INTEGER DEFAULT 0,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Agar quiz_status bo'sh bo'lsa, default qiymat qo'shish
    cursor.execute('SELECT COUNT(*) as count FROM quiz_status')
    if cursor.fetchone()['count'] == 0:
        cursor.execute('INSERT INTO quiz_status (id, quiz_started) VALUES (1, 0)')
    
    conn.commit()
    conn.close()
    print("✅ Database initialized")

def get_db_connection():
    """Database ulanishini olish"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

# Database ni ishga tushirish
init_database()

# ========== API ENDPOINTS ==========

@app.route('/api/students', methods=['GET'])
def get_all_students():
    """Barcha talabalarni olish"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT 
                id,
                student_name,
                student_group,
                score,
                percentage,
                passed,
                status,
                created_at,
                updated_at,
                CASE 
                    WHEN status = 'testing' THEN strftime('%s', created_at) * 1000
                    ELSE strftime('%s', updated_at) * 1000
                END as timestamp
            FROM students 
            ORDER BY 
                CASE 
                    WHEN status = 'testing' THEN strftime('%s', created_at) * 1000
                    ELSE strftime('%s', updated_at) * 1000
                END DESC
        ''')
        
        students = []
        for row in cursor.fetchall():
            students.append({
                'id': row['id'],
                'student_name': row['student_name'],
                'student_group': row['student_group'],
                'score': row['score'],
                'percentage': row['percentage'],
                'passed': bool(row['passed']),
                'status': row['status'],
                'created_at': row['created_at'],
                'updated_at': row['updated_at'],
                'timestamp': row['timestamp'] if row['timestamp'] else int(datetime.now().timestamp() * 1000)
            })
        
        conn.close()
        print(f"✅ Returning {len(students)} students")
        return jsonify(students)
    except Exception as e:
        print(f"❌ Error getting students: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/api/students', methods=['POST'])
def add_student():
    """Yangi talaba qo'shish (test boshlaganda)"""
    try:
        data = request.json
        student_name = data.get('studentName', '').strip()
        student_group = data.get('studentGroup', '').strip()
        
        if not student_name or not student_group:
            return jsonify({'error': 'Ism va guruh kerak'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO students (student_name, student_group, status)
            VALUES (?, ?, 'testing')
        ''', (student_name, student_group))
        
        student_id = cursor.lastrowid
        conn.commit()
        
        # Yangi qo'shilgan talabani olish
        cursor.execute('SELECT * FROM students WHERE id = ?', (student_id,))
        row = cursor.fetchone()
        
        student = {
            'id': row['id'],
            'student_name': row['student_name'],
            'student_group': row['student_group'],
            'score': row['score'],
            'percentage': row['percentage'],
            'passed': bool(row['passed']),
            'status': row['status'],
            'created_at': row['created_at'],
            'updated_at': row['updated_at']
        }
        
        conn.close()
        return jsonify(student), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/students/update-by-name', methods=['PUT'])
def update_student_result():
    """Talaba natijasini yangilash (test tugaganda)"""
    try:
        data = request.json
        student_name = data.get('studentName', '').strip()
        student_group = data.get('studentGroup', '').strip()
        score = data.get('score', 0)
        percentage = data.get('percentage', 0)
        passed = data.get('passed', False)
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Avval test yechayotgan talabani topish
        cursor.execute('''
            SELECT * FROM students 
            WHERE student_name = ? AND student_group = ? AND status = 'testing'
            ORDER BY created_at DESC
            LIMIT 1
        ''', (student_name, student_group))
        
        existing = cursor.fetchone()
        
        if existing:
            # Yangilash
            cursor.execute('''
                UPDATE students 
                SET score = ?, percentage = ?, passed = ?, status = 'completed', updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            ''', (score, percentage, 1 if passed else 0, existing['id']))
            
            student_id = existing['id']
        else:
            # Yangi yaratish
            cursor.execute('''
                INSERT INTO students (student_name, student_group, score, percentage, passed, status)
                VALUES (?, ?, ?, ?, ?, 'completed')
            ''', (student_name, student_group, score, percentage, 1 if passed else 0))
            
            student_id = cursor.lastrowid
        
        conn.commit()
        
        # Yangilangan talabani olish
        cursor.execute('SELECT * FROM students WHERE id = ?', (student_id,))
        row = cursor.fetchone()
        
        student = {
            'id': row['id'],
            'student_name': row['student_name'],
            'student_group': row['student_group'],
            'score': row['score'],
            'percentage': row['percentage'],
            'passed': bool(row['passed']),
            'status': row['status'],
            'created_at': row['created_at'],
            'updated_at': row['updated_at']
        }
        
        conn.close()
        return jsonify(student)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/students/<int:student_id>', methods=['DELETE'])
def delete_student(student_id):
    """Talabani o'chirish"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('DELETE FROM students WHERE id = ?', (student_id,))
        conn.commit()
        conn.close()
        
        return jsonify({'message': 'Talaba o\'chirildi'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/students', methods=['DELETE'])
def clear_all_students():
    """Barcha natijalarni o'chirish"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('DELETE FROM students')
        conn.commit()
        conn.close()
        
        return jsonify({'message': 'Barcha natijalar o\'chirildi'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/statistics', methods=['GET'])
def get_statistics():
    """Statistikalar"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Jami tugatgan talabalar
        cursor.execute('SELECT COUNT(*) as count FROM students WHERE status = "completed"')
        total = cursor.fetchone()['count']
        
        # O'tganlar
        cursor.execute('SELECT COUNT(*) as count FROM students WHERE status = "completed" AND passed = 1')
        passed = cursor.fetchone()['count']
        
        # O'tmaganlar
        cursor.execute('SELECT COUNT(*) as count FROM students WHERE status = "completed" AND passed = 0')
        failed = cursor.fetchone()['count']
        
        # O'rtacha ball
        cursor.execute('SELECT AVG(percentage) as avg FROM students WHERE status = "completed"')
        avg_result = cursor.fetchone()['avg']
        avg_score = int(avg_result) if avg_result else 0
        
        conn.close()
        
        return jsonify({
            'total': total,
            'passed': passed,
            'failed': failed,
            'avgScore': avg_score
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Server holatini tekshirish"""
    return jsonify({'status': 'ok', 'message': 'Server ishlayapti'})

# Quiz status API endpoints
@app.route('/api/quiz/status', methods=['GET'])
def get_quiz_status():
    """Quiz status'ni olish"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT quiz_started FROM quiz_status WHERE id = 1')
        row = cursor.fetchone()
        conn.close()
        
        quiz_started = bool(row['quiz_started']) if row else False
        return jsonify({'quizStarted': quiz_started}), 200
    except Exception as e:
        print(f"❌ Error getting quiz status: {e}")
        return jsonify({'quizStarted': False}), 200

@app.route('/api/quiz/start', methods=['POST'])
def start_quiz():
    """Quizni boshlash (admin tomonidan)"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('UPDATE quiz_status SET quiz_started = 1, updated_at = CURRENT_TIMESTAMP WHERE id = 1')
        conn.commit()
        conn.close()
        print("✅ Quiz started by admin")
        return jsonify({'success': True, 'message': 'Quiz boshlandi'}), 200
    except Exception as e:
        print(f"❌ Error starting quiz: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/quiz/stop', methods=['POST'])
def stop_quiz():
    """Quizni to'xtatish (admin tomonidan)"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('UPDATE quiz_status SET quiz_started = 0, updated_at = CURRENT_TIMESTAMP WHERE id = 1')
        conn.commit()
        conn.close()
        print("⏸️ Quiz stopped by admin")
        return jsonify({'success': True, 'message': 'Quiz to\'xtatildi'}), 200
    except Exception as e:
        print(f"❌ Error stopping quiz: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print('🚀 Flask server ishga tushmoqda...')
    print('📡 Server: http://localhost:3001')
    app.run(host='0.0.0.0', port=3001, debug=True)

