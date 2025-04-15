// 使用百度OCR API进行文字识别
import fetch from 'node-fetch';
import sharp from 'sharp';

// 百度OCR API配置
const BAIDU_OCR_API_KEY = 'CdFEv5cJRn2QgOyLjpl93W2M'; // 需要替换为实际的API Key
const BAIDU_OCR_SECRET_KEY = 'N65tO0jSFSN8bYXUAXen0CJugySJVlpZ'; // 需要替换为实际的Secret Key
const OCR_API_URL = 'https://aip.baidubce.com/rest/2.0/ocr/v1/general_basic';

// 最大文件大小限制（4MB）
const MAX_FILE_SIZE = 4 * 1024 * 1024;

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

// 压缩图片到指定大小以下
async function compressImage(imageBuffer) {
    // 检查原始图片大小
    if (imageBuffer.length <= MAX_FILE_SIZE) {
        console.log('图片大小已符合要求，无需压缩');
        return imageBuffer;
    }
    
    console.log(`原始图片大小: ${(imageBuffer.length / 1024 / 1024).toFixed(2)}MB，开始压缩...`);
    
    // 创建sharp实例
    const image = sharp(imageBuffer);
    const metadata = await image.metadata();
    
    // 计算压缩比例，从90%开始逐步降低
    let quality = 90;
    let compressedBuffer = imageBuffer;
    
    while (compressedBuffer.length > MAX_FILE_SIZE && quality > 10) {
        // 计算新的尺寸（如果图片太大，同时也缩小尺寸）
        let width = metadata.width;
        let height = metadata.height;
        
        // 如果图片尺寸很大，适当缩小
        if (width > 2000 || height > 2000) {
            const ratio = Math.min(2000 / width, 2000 / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
        }
        
        // 压缩图片
        compressedBuffer = await image
            .resize(width, height, { fit: 'inside' })
            .jpeg({ quality })
            .toBuffer();
        
        console.log(`压缩后质量: ${quality}%, 大小: ${(compressedBuffer.length / 1024 / 1024).toFixed(2)}MB`);
        
        // 如果还是太大，降低质量继续尝试
        quality -= 10;
    }
    
    // 如果压缩后仍然超过限制，使用更激进的压缩方法
    if (compressedBuffer.length > MAX_FILE_SIZE) {
        console.log('使用更激进的压缩方法...');
        
        // 计算需要的缩放比例
        const targetSize = MAX_FILE_SIZE * 0.95; // 预留5%空间
        const currentSize = compressedBuffer.length;
        const scaleFactor = Math.sqrt(targetSize / currentSize);
        
        // 重新计算尺寸
        const newWidth = Math.floor(metadata.width * scaleFactor);
        const newHeight = Math.floor(metadata.height * scaleFactor);
        
        compressedBuffer = await image
            .resize(newWidth, newHeight, { fit: 'inside' })
            .jpeg({ quality: 70 })
            .toBuffer();
        
        console.log(`最终压缩结果: 大小: ${(compressedBuffer.length / 1024 / 1024).toFixed(2)}MB`);
    }
    
    return compressedBuffer;
}

// 执行OCR识别
export async function performOCR(imageBuffer) {
    try {
        // 压缩图片
        const compressedImageBuffer = await compressImage(imageBuffer);
        
        // 获取access_token
        const accessToken = await getAccessToken();
        
        // 准备图片数据
        const base64Image = compressedImageBuffer.toString('base64');
        
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