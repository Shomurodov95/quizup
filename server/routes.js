import { dbRun, dbGet, dbAll } from './database.js';

export function setupRoutes(app) {
    // Barcha talabalarni olish
    app.get('/api/students', async (req, res) => {
        try {
            const students = await dbAll(`
                SELECT * FROM students 
                ORDER BY created_at DESC
            `);
            res.json(students);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Yangi talaba qo'shish (test boshlaganda)
    app.post('/api/students', async (req, res) => {
        try {
            const { studentName, studentGroup } = req.body;
            
            if (!studentName || !studentGroup) {
                return res.status(400).json({ error: 'Ism va guruh kerak' });
            }

            const result = await dbRun(`
                INSERT INTO students (student_name, student_group, status)
                VALUES (?, ?, 'testing')
            `, [studentName, studentGroup]);

            const student = await dbGet('SELECT * FROM students WHERE id = ?', [result.lastID]);
            res.status(201).json(student);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Talaba natijasini yangilash (test tugaganda)
    app.put('/api/students/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const { score, percentage, passed } = req.body;

            await dbRun(`
                UPDATE students 
                SET score = ?, percentage = ?, passed = ?, status = 'completed', updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `, [score, percentage, passed ? 1 : 0, id]);

            const student = await dbGet('SELECT * FROM students WHERE id = ?', [id]);
            res.json(student);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Talabani ism va guruh bo'yicha topish va yangilash
    app.put('/api/students/update-by-name', async (req, res) => {
        try {
            const { studentName, studentGroup, score, percentage, passed } = req.body;

            // Avval topish
            const existing = await dbGet(`
                SELECT * FROM students 
                WHERE student_name = ? AND student_group = ? AND status = 'testing'
                ORDER BY created_at DESC
                LIMIT 1
            `, [studentName, studentGroup]);

            if (existing) {
                await dbRun(`
                    UPDATE students 
                    SET score = ?, percentage = ?, passed = ?, status = 'completed', updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                `, [score, percentage, passed ? 1 : 0, existing.id]);

                const updated = await dbGet('SELECT * FROM students WHERE id = ?', [existing.id]);
                res.json(updated);
            } else {
                // Agar topilmasa, yangi yaratish
                const result = await dbRun(`
                    INSERT INTO students (student_name, student_group, score, percentage, passed, status)
                    VALUES (?, ?, ?, ?, ?, 'completed')
                `, [studentName, studentGroup, score, percentage, passed ? 1 : 0]);

                const student = await dbGet('SELECT * FROM students WHERE id = ?', [result.lastID]);
                res.json(student);
            }
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Talabani o'chirish
    app.delete('/api/students/:id', async (req, res) => {
        try {
            const { id } = req.params;
            await dbRun('DELETE FROM students WHERE id = ?', [id]);
            res.json({ message: 'Talaba o\'chirildi' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Barcha natijalarni o'chirish
    app.delete('/api/students', async (req, res) => {
        try {
            await dbRun('DELETE FROM students');
            res.json({ message: 'Barcha natijalar o\'chirildi' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Statistikalar
    app.get('/api/statistics', async (req, res) => {
        try {
            const total = await dbGet('SELECT COUNT(*) as count FROM students WHERE status = "completed"');
            const passed = await dbGet('SELECT COUNT(*) as count FROM students WHERE status = "completed" AND passed = 1');
            const failed = await dbGet('SELECT COUNT(*) as count FROM students WHERE status = "completed" AND passed = 0');
            const avgScore = await dbGet('SELECT AVG(percentage) as avg FROM students WHERE status = "completed"');

            res.json({
                total: total.count,
                passed: passed.count,
                failed: failed.count,
                avgScore: Math.round(avgScore.avg || 0)
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
}

