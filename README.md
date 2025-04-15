# AI写作检查器

这是一个使用AI技术检查文本内容的工具，支持直接输入文本或上传图片进行OCR识别后分析。

## 功能特点

- 文本直接输入分析
- 图片OCR识别后分析（使用百度OCR API，支持中英文）
- 多维度评分分析
- 可视化雷达图展示分析结果

## 配置说明

### 百度OCR API配置

本项目使用百度OCR API进行图片文字识别，使用前需要进行以下配置：

1. 访问[百度AI开放平台](https://ai.baidu.com/)注册账号
2. 创建文字识别应用，获取API Key和Secret Key
3. 在`ocr.js`文件中替换以下内容：

```javascript
const BAIDU_OCR_API_KEY = 'YOUR_API_KEY'; // 替换为您的API Key
const BAIDU_OCR_SECRET_KEY = 'YOUR_SECRET_KEY'; // 替换为您的Secret Key
```

## 安装与运行

```bash
# 安装依赖
npm install

# 启动服务
node server.js
```

## 使用方法

1. 打开浏览器访问 http://localhost:3000
2. 选择「文本输入」或「图片上传」
3. 输入文本或上传图片
4. 点击「开始检查」按钮
5. 查看分析结果

## 注意事项

- 图片OCR识别需要联网
- 百度OCR API有调用次数限制，请参考百度AI开放平台的使用条款
- 首次使用需要替换API密钥才能正常使用OCR功能