const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;
const DATA_FILE = path.join(__dirname, 'data.json');

app.use(cors());
app.use(express.json());

// 读取旅行数据
app.get('/api/travel-data', async (req, res) => {
    try {
        const data = await fs.readFile(DATA_FILE, 'utf8');
        res.json(JSON.parse(data));
    } catch (error) {
        console.error('Error reading data file:', error);
        res.status(500).json({ error: 'Failed to read travel data' });
    }
});

// 更新旅行数据
app.put('/api/travel-data', async (req, res) => {
    try {
        const newData = req.body;

        // 验证数据结构
        if (!newData || typeof newData !== 'object') {
            return res.status(400).json({ error: 'Invalid data format' });
        }

        // 写入文件
        await fs.writeFile(DATA_FILE, JSON.stringify(newData, null, 2), 'utf8');

        res.json({
            success: true,
            message: 'Travel data updated successfully',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error writing data file:', error);
        res.status(500).json({ error: 'Failed to update travel data' });
    }
});

// 部分更新旅行数据
app.patch('/api/travel-data/:section', async (req, res) => {
    try {
        const section = req.params.section;
        const sectionData = req.body;

        // 读取现有数据
        const existingData = await fs.readFile(DATA_FILE, 'utf8');
        const data = JSON.parse(existingData);

        // 更新指定部分
        data[section] = sectionData;

        // 写入文件
        await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');

        res.json({
            success: true,
            message: `${section} updated successfully`,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error updating data section:', error);
        res.status(500).json({ error: 'Failed to update data section' });
    }
});

// 健康检查
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        dataFile: DATA_FILE
    });
});

app.listen(PORT, () => {
    console.log(`Travel Plan API server running on port ${PORT}`);
    console.log(`Data file: ${DATA_FILE}`);
});