// health.js
const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

router.get('/api/health', (req, res) => {
    try {
        // 检查数据库连接
        const dbPath = path.join(__dirname, 'data', 'weight_tracker.db');
        const db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                return res.status(500).json({
                    status: 'error',
                    message: '数据库连接失败',
                    error: err.message
                });
            }

            db.get('SELECT 1', (err, row) => {
                db.close();
                
                if (err) {
                    return res.status(500).json({
                        status: 'error',
                        message: '数据库查询失败',
                        error: err.message
                    });
                }

                res.json({
                    status: 'ok',
                    message: '应用运行正常',
                    timestamp: new Date().toISOString(),
                    version: '1.0.0',
                    database: 'SQLite',
                    uptime: process.uptime()
                });
            });
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: '健康检查失败',
            error: error.message
        });
    }
});

module.exports = router;