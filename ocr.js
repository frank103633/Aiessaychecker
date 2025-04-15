// 使用百度OCR API进行文字识别
import fetch from 'node-fetch';

// 百度OCR API配置
const BAIDU_OCR_API_KEY = 'CdFEv5cJRn2QgOyLjpl93W2M'; // 需要替换为实际的API Key
const BAIDU_OCR_SECRET_KEY = 'N65tO0jSFSN8bYXUAXen0CJugySJVlpZ'; // 需要替换为实际的Secret Key
const OCR_API_URL = 'https://aip.baidubce.com/rest/2.0/ocr/v1/general_basic';

// 获取百度OCR的access_token
async function getAccessToken() {
    const tokenUrl = `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${BAIDU_OCR_API_KEY}&client_secret=${BAIDU_OCR_SECRET_KEY}`;
    
    try {
        const response = await fetch(tokenUrl, {
            method: 'POST'
        });
        
        if (!response.ok) {
            throw new Error(`获取token失败: ${response.statusText}`);
        }
        
        const data = await response.json();
        return data.access_token;
    } catch (error) {
        console.error('获取百度OCR access_token失败:', error);
        throw new Error('获取百度OCR授权失败: ' + error.message);
    }
}

// 执行OCR识别
export async function performOCR(imageBuffer) {
    try {
        // 获取access_token
        const accessToken = await getAccessToken();
        
        // 准备图片数据
        const base64Image = imageBuffer.toString('base64');
        
        // 发送OCR请求
        const response = await fetch(`${OCR_API_URL}?access_token=${accessToken}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: `image=${encodeURIComponent(base64Image)}&language_type=CHN_ENG`
        });
        
        if (!response.ok) {
            throw new Error(`OCR请求失败: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (result.error_code) {
            throw new Error(`百度OCR错误: ${result.error_msg}`);
        }
        
        // 提取识别的文字
        const textArray = result.words_result.map(item => item.words);
        return textArray.join('\n');
    } catch (error) {
        console.error('OCR处理失败:', error);
        throw new Error('OCR处理失败: ' + error.message);
    }
}

// 处理多张图片
export async function processMultipleImages(imageBuffers) {
    try {
        // 并行处理多张图片
        const textResults = await Promise.all(
            imageBuffers.map(buffer => performOCR(buffer))
        );
        
        // 合并所有识别结果
        return textResults.join('\n\n');
    } catch (error) {
        console.error('批量OCR处理失败:', error);
        throw new Error('批量OCR处理失败: ' + error.message);
    }
}