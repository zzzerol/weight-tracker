// server.js
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// 导入健康检查路由
const healthRouter = require('./health');

// 初始化Express应用
const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 使用健康检查路由
app.use(healthRouter);

// 确保数据目录存在
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// 连接SQLite数据库
const db = new sqlite3.Database(path.join(dataDir, 'weight_tracker.db'), (err) => {
    if (err) {
        console.error('数据库连接失败:', err.message);
    } else {
        console.log('SQLite数据库连接成功');
        initializeDatabase();
    }
});

// 初始化数据库表
function initializeDatabase() {
    // 用户表
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        email TEXT UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    // 个人设置表
    db.run(`CREATE TABLE IF NOT EXISTS user_settings (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        height REAL NOT NULL DEFAULT 170,
        gender TEXT NOT NULL DEFAULT 'male',
        initial_weight REAL NOT NULL DEFAULT 210,
        target_weight REAL NOT NULL DEFAULT 135,
        target_months INTEGER NOT NULL DEFAULT 6,
        reminder_enabled BOOLEAN NOT NULL DEFAULT 0,
        reminder_time TEXT NOT NULL DEFAULT '20:00',
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`);

    // 体重记录表
    db.run(`CREATE TABLE IF NOT EXISTS weight_records (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        date TEXT NOT NULL,
        weight REAL NOT NULL,
        feeling TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, date),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`);

    // 自动备份表
    db.run(`CREATE TABLE IF NOT EXISTS backups (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        backup_data TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`);

    console.log('数据库表初始化完成');
}

// 用户认证中间件
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: '访问令牌缺失' });
    }

    // 简单验证：检查用户是否存在
    db.get('SELECT * FROM users WHERE id = ?', [token], (err, user) => {
        if (err || !user) {
            return res.status(403).json({ error: '无效的访问令牌' });
        }
        req.user = user;
        next();
    });
}

// 用户相关API
app.post('/api/auth/register', async (req, res) => {
    // 注册开关配置 - true: 允许注册, false: 关闭注册
    const ALLOW_REGISTRATION = false; // 这里控制开关状态
    
    if (!ALLOW_REGISTRATION) {
        return res.status(403).json({ error: '注册功能已关闭，请联系管理员' });
    }

    try {
        const { username, password, email } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: '用户名和密码不能为空' });
        }

        // 检查用户名是否已存在
        const existingUser = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        if (existingUser) {
            return res.status(400).json({ error: '用户名已存在' });
        }

        // 密码加密
        const hashedPassword = await bcrypt.hash(password, 10);
        const userId = uuidv4();

        // 创建用户
        await new Promise((resolve, reject) => {
            db.run('INSERT INTO users (id, username, password, email) VALUES (?, ?, ?, ?)',
                [userId, username, hashedPassword, email], (err) => {
                    if (err) reject(err);
                    else resolve();
                });
        });

        // 创建默认设置
        await new Promise((resolve, reject) => {
            db.run('INSERT INTO user_settings (id, user_id) VALUES (?, ?)',
                [uuidv4(), userId], (err) => {
                    if (err) reject(err);
                    else resolve();
                });
        });

        res.status(201).json({ 
            message: '用户注册成功',
            userId: userId
        });
    } catch (error) {
        console.error('注册失败:', error);
        res.status(500).json({ error: '注册失败' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: '用户名和密码不能为空' });
        }

        // 查找用户
        const user = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        if (!user) {
            return res.status(401).json({ error: '用户名或密码错误' });
        }

        // 验证密码
        const passwordValid = await bcrypt.compare(password, user.password);
        if (!passwordValid) {
            return res.status(401).json({ error: '用户名或密码错误' });
        }

        res.json({
            message: '登录成功',
            token: user.id,
            username: user.username
        });
    } catch (error) {
        console.error('登录失败:', error);
        res.status(500).json({ error: '登录失败' });
    }
});

// 用户设置API
app.get('/api/settings', authenticateToken, (req, res) => {
    db.get('SELECT * FROM user_settings WHERE user_id = ?', [req.user.id], (err, settings) => {
        if (err) {
            return res.status(500).json({ error: '获取设置失败' });
        }
        res.json(settings || {});
    });
});

app.put('/api/settings', authenticateToken, (req, res) => {
    const { height, gender, initial_weight, target_weight, target_months, reminder_enabled, reminder_time } = req.body;
    
    db.get('SELECT * FROM user_settings WHERE user_id = ?', [req.user.id], (err, existingSettings) => {
        if (err) {
            return res.status(500).json({ error: '获取设置失败' });
        }

        if (existingSettings) {
            db.run(`UPDATE user_settings SET 
                height = ?, gender = ?, initial_weight = ?, target_weight = ?, 
                target_months = ?, reminder_enabled = ?, reminder_time = ?, updated_at = CURRENT_TIMESTAMP
                WHERE user_id = ?`,
                [height, gender, initial_weight, target_weight, target_months, reminder_enabled ? 1 : 0, reminder_time, req.user.id],
                (err) => {
                    if (err) {
                        return res.status(500).json({ error: '更新设置失败' });
                    }
                    res.json({ message: '设置更新成功' });
                });
        } else {
            db.run('INSERT INTO user_settings (id, user_id, height, gender, initial_weight, target_weight, target_months, reminder_enabled, reminder_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [uuidv4(), req.user.id, height, gender, initial_weight, target_weight, target_months, reminder_enabled ? 1 : 0, reminder_time],
                (err) => {
                    if (err) {
                        return res.status(500).json({ error: '创建设置失败' });
                    }
                    res.json({ message: '设置创建成功' });
                });
        }
    });
});

// 体重记录API
app.get('/api/records', authenticateToken, (req, res) => {
    const { start_date, end_date, sort = 'date_desc' } = req.query;
    
    let query = 'SELECT * FROM weight_records WHERE user_id = ?';
    const params = [req.user.id];
    
    if (start_date && end_date) {
        query += ' AND date BETWEEN ? AND ?';
        params.push(start_date, end_date);
    } else if (start_date) {
        query += ' AND date >= ?';
        params.push(start_date);
    } else if (end_date) {
        query += ' AND date <= ?';
        params.push(end_date);
    }
    
    switch (sort) {
        case 'date_asc':
            query += ' ORDER BY date ASC';
            break;
        case 'weight_asc':
            query += ' ORDER BY weight ASC';
            break;
        case 'weight_desc':
            query += ' ORDER BY weight DESC';
            break;
        default:
            query += ' ORDER BY date DESC';
    }

    db.all(query, params, (err, records) => {
        if (err) {
            return res.status(500).json({ error: '获取记录失败' });
        }
        res.json(records);
    });
});

app.get('/api/records/:date', authenticateToken, (req, res) => {
    const { date } = req.params;
    
    db.get('SELECT * FROM weight_records WHERE user_id = ? AND date = ?', [req.user.id, date], (err, record) => {
        if (err) {
            return res.status(500).json({ error: '获取记录失败' });
        }
        res.json(record || null);
    });
});

app.post('/api/records', authenticateToken, (req, res) => {
    const { date, weight, feeling, notes } = req.body;
    
    if (!date || !weight) {
        return res.status(400).json({ error: '日期和体重不能为空' });
    }

    db.get('SELECT * FROM weight_records WHERE user_id = ? AND date = ?', [req.user.id, date], (err, existingRecord) => {
        if (err) {
            return res.status(500).json({ error: '检查记录失败' });
        }

        if (existingRecord) {
            // 更新现有记录
            db.run(`UPDATE weight_records SET 
                weight = ?, feeling = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?`,
                [weight, feeling, notes, existingRecord.id],
                (err) => {
                    if (err) {
                        return res.status(500).json({ error: '更新记录失败' });
                    }
                    res.json({ message: '记录更新成功' });
                });
        } else {
            // 创建新记录
            db.run('INSERT INTO weight_records (id, user_id, date, weight, feeling, notes) VALUES (?, ?, ?, ?, ?, ?)',
                [uuidv4(), req.user.id, date, weight, feeling, notes],
                (err) => {
                    if (err) {
                        return res.status(500).json({ error: '创建记录失败' });
                    }
                    res.status(201).json({ message: '记录创建成功' });
                });
        }
    });
});

app.delete('/api/records/:date', authenticateToken, (req, res) => {
    const { date } = req.params;
    
    db.run('DELETE FROM weight_records WHERE user_id = ? AND date = ?', [req.user.id, date], (err) => {
        if (err) {
            return res.status(500).json({ error: '删除记录失败' });
        }
        res.json({ message: '记录删除成功' });
    });
});

// 统计数据API
app.get('/api/stats', authenticateToken, (req, res) => {
    // 获取用户设置
    db.get('SELECT * FROM user_settings WHERE user_id = ?', [req.user.id], (err, settings) => {
        if (err || !settings) {
            return res.status(500).json({ error: '获取设置失败' });
        }

        // 获取所有记录
        db.all('SELECT * FROM weight_records WHERE user_id = ? ORDER BY date', [req.user.id], (err, records) => {
            if (err) {
                return res.status(500).json({ error: '获取记录失败' });
            }

            if (records.length === 0) {
                return res.json({
                    total_days: 0,
                    total_lost: 0,
                    current_weight: 0,
                    remaining: settings.target_weight,
                    weekly_average: 0,
                    best_week: 0,
                    streak: 0
                });
            }

            const currentWeight = records[records.length - 1].weight;
            const initialWeight = settings.initial_weight;
            const targetWeight = settings.target_weight;
            const totalLost = initialWeight - currentWeight;
            const remaining = Math.max(0, currentWeight - targetWeight);
            const totalDays = records.length;

            // 计算连续记录天数
            let streak = 1;
            for (let i = records.length - 1; i > 0; i--) {
                const currentDate = new Date(records[i].date);
                const prevDate = new Date(records[i - 1].date);
                const diffDays = Math.floor((currentDate - prevDate) / (1000 * 60 * 60 * 24));
                
                if (diffDays === 1) {
                    streak++;
                } else {
                    break;
                }
            }

            // 计算每周平均减重
            let weeklyAverage = 0;
            let bestWeek = 0;
            
            if (records.length >= 7) {
                const weeks = Math.floor(records.length / 7);
                weeklyAverage = totalLost / weeks;

                // 计算最佳单周减重
                for (let i = 0; i < records.length - 6; i += 7) {
                    const weekStart = records[i].weight;
                    const weekEnd = records[Math.min(i + 6, records.length - 1)].weight;
                    const weekLost = weekStart - weekEnd;
                    if (weekLost > bestWeek) {
                        bestWeek = weekLost;
                    }
                }
            }

            res.json({
                total_days: totalDays,
                total_lost: parseFloat(totalLost.toFixed(1)),
                current_weight: parseFloat(currentWeight.toFixed(1)),
                remaining: parseFloat(remaining.toFixed(1)),
                weekly_average: parseFloat(weeklyAverage.toFixed(1)),
                best_week: parseFloat(bestWeek.toFixed(1)),
                streak: streak
            });
        });
    });
});

// 数据备份和恢复API
app.post('/api/backup', authenticateToken, (req, res) => {
    // 获取用户所有数据
    db.get('SELECT * FROM user_settings WHERE user_id = ?', [req.user.id], (err, settings) => {
        if (err) {
            return res.status(500).json({ error: '获取设置失败' });
        }

        db.all('SELECT * FROM weight_records WHERE user_id = ?', [req.user.id], (err, records) => {
            if (err) {
                return res.status(500).json({ error: '获取记录失败' });
            }

            const backupData = JSON.stringify({
                settings: settings || {},
                records: records || []
            });

            db.run('INSERT INTO backups (id, user_id, backup_data) VALUES (?, ?, ?)',
                [uuidv4(), req.user.id, backupData],
                (err) => {
                    if (err) {
                        return res.status(500).json({ error: '备份失败' });
                    }
                    res.json({ message: '备份成功', backupData: backupData });
                });
        });
    });
});

app.post('/api/restore', authenticateToken, (req, res) => {
    const { backupData } = req.body;
    
    try {
        const data = JSON.parse(backupData);
        
        // 开启事务
        db.run('BEGIN TRANSACTION', (err) => {
            if (err) throw err;

            // 恢复设置
            if (data.settings) {
                db.run(`REPLACE INTO user_settings (
                    id, user_id, height, gender, initial_weight, target_weight, 
                    target_months, reminder_enabled, reminder_time
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    data.settings.id || uuidv4(),
                    req.user.id,
                    data.settings.height,
                    data.settings.gender,
                    data.settings.initial_weight,
                    data.settings.target_weight,
                    data.settings.target_months,
                    data.settings.reminder_enabled ? 1 : 0,
                    data.settings.reminder_time
                ], (err) => {
                    if (err) throw err;
                });
            }

            // 恢复记录
            if (data.records && data.records.length > 0) {
                const placeholders = data.records.map(() => '(?, ?, ?, ?, ?, ?)').join(',');
                const values = [];
                
                data.records.forEach(record => {
                    values.push(
                        record.id || uuidv4(),
                        req.user.id,
                        record.date,
                        record.weight,
                        record.feeling,
                        record.notes
                    );
                });

                db.run(`REPLACE INTO weight_records (id, user_id, date, weight, feeling, notes) VALUES ${placeholders}`,
                    values, (err) => {
                        if (err) throw err;
                    });
            }

            // 提交事务
            db.run('COMMIT', (err) => {
                if (err) {
                    db.run('ROLLBACK');
                    return res.status(500).json({ error: '恢复失败' });
                }
                res.json({ message: '恢复成功' });
            });
        });
    } catch (error) {
        console.error('恢复失败:', error);
        res.status(500).json({ error: '恢复失败' });
    }
});

// 静态文件服务
app.use(express.static(path.join(__dirname, 'public')));

// 前端路由
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
    console.log('数据存储目录:', dataDir);
});

// 优雅关闭
process.on('SIGINT', () => {
    console.log('正在关闭服务器...');
    db.close((err) => {
        if (err) {
            console.error('数据库关闭失败:', err.message);
        } else {
            console.log('数据库连接已关闭');
        }
        process.exit(0);
    });
});