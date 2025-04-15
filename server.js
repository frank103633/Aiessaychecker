import OpenAI from "openai";
import express from "express";
import path from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import multer from 'multer';
import { processMultipleImages } from './ocr.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// 配置multer存储
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 增加到10MB，给压缩留出空间
    },
    fileFilter: (req, file, cb) => {
        // 接受更多图片格式
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('只允许上传图片文件'));
        }
    }
});

const client = new OpenAI({
  apiKey: "sk-Oh2AIByD18544HqtnVoslgPi1XHMymgtwXyYyXeumRIiQhiD",
  baseURL: "https://api.hunyuan.cloud.tencent.com/v1",
});

app.post('/api/analyze', async (req, res) => {
  try {
    const { text } = req.body;
    
    // 添加请求间隔
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const completion = await client.chat.completions.create({
      model: "hunyuan-turbos-latest",
      messages: [{
        role: "user",
        content: `请分析以下文本由AI生成的概率（以百分比形式表示），并详细说明判断依据。然后从以下维度分析并给出1-10的评分：
        1. 语言流畅度：文本的表达是否自然流畅
        2. 创意性：内容是否具有独特性和创新性
        3. 逻辑性：论述是否具有清晰的逻辑结构
        4. 词汇多样性：用词是否丰富多样
        5. 情感表达：是否具有适当的情感色彩
        6. 结构完整性：文本结构是否完整合理
        文本：${text}`
      }],
      extra_body: {
        enable_enhancement: true
      }
    });
    
    res.json({ content: completion.choices[0].message.content });
  } catch (error) {
    console.error('API调用失败:', error);
    
    // 优化错误处理
    if (error.code === '2003') {
      res.status(429).json({ 
        error: '请求过于频繁，请稍后再试',
        retryAfter: 60
      });
    } else {
      res.status(500).json({ 
        error: '服务器内部错误',
        details: error.message 
      });
    }
  }
});

app.post('/api/ocr', upload.array('images'), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: '请上传图片文件' });
    }

    // 获取上传的图片buffer
    const imageBuffers = req.files.map(file => file.buffer);
    
    // 使用百度OCR API处理图片
    const text = await processMultipleImages(imageBuffers);

    res.json({ text });
  } catch (error) {
    console.error('OCR处理失败:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});