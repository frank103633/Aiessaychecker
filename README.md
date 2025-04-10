# AI作文检测系统

## 项目简介

这是一个用于检测中小学作文是否由AI代写的Web应用程序。系统支持多种输入方式，包括文本粘贴、文件上传和拍照上传，并使用腾讯混元大模型进行智能分析，生成专业的检测报告和可视化结果。

## 功能特点

- **多种输入方式**：支持文本直接粘贴、文件上传（.txt, .doc, .docx, .pdf）和拍照上传
- **智能分析**：基于腾讯混元大模型的强大分析能力，从多个维度评估作文
- **专业报告**：生成详细的分析报告，包括连贯性、创造性、结构性、词汇丰富度和人类特征等多个维度
- **可视化结果**：使用雷达图直观展示各项指标评分
- **响应式设计**：适配各种设备，包括电脑、平板和手机
- **简洁美观**：界面设计简洁直观，操作便捷

## 技术栈

- 前端：HTML5, CSS3, JavaScript, Chart.js
- 后端：Python, Flask
- API：腾讯混元大模型 (OpenAI兼容接口)

## 安装与使用

### 环境要求

- Python 3.7+
- Flask
- OpenAI Python SDK

### 安装步骤

1. 克隆或下载本项目到本地

2. 安装所需依赖：
   ```
   pip install flask openai
   ```

3. 设置环境变量：
   ```
   # Windows
   set HUNYUAN_API_KEY=你的腾讯混元API密钥
   
   # Linux/Mac
   export HUNYUAN_API_KEY=你的腾讯混元API密钥
   ```

4. 启动服务器：
   ```
   python server.py
   ```

5. 在浏览器中访问：
   ```
   http://localhost:5000
   ```

## 使用说明

1. 在首页选择输入方式：文本输入、文件上传或拍照上传
2. 输入或上传作文内容
3. 点击"开始分析"按钮
4. 等待系统分析（通常需要几秒钟）
5. 查看分析结果，包括AI生成概率、雷达图和详细分析报告

## 注意事项

- 文件上传目前仅支持直接读取TXT文件内容
- 拍照上传功能需要调用OCR服务，当前版本为模拟实现
- 分析结果的准确性取决于腾讯混元大模型的能力

## 许可证

MIT License

## 联系方式

如有问题或建议，请联系项目维护者。