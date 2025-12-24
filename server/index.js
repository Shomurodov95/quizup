import express from 'express';
import cors from 'cors';
import { initDatabase, getDb } from './database.js';
import { setupRoutes } from './routes.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Database ni ishga tushirish
initDatabase().then(() => {
    console.log('✅ Database connected');
    
    // Routes
    setupRoutes(app);
    
    // Server ni ishga tushirish
    app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
    }).on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.error(`❌ Port ${PORT} is already in use. Please stop the other server or change the port.`);
            process.exit(1);
        } else {
            console.error('❌ Server error:', err);
        }
    });
}).catch(err => {
    console.error('❌ Database error:', err);
});

