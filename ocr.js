// 使用百度OCR API进行文字识别
import fetch from 'node-fetch';
import sharp from 'sharp';

// 百度OCR API配置
const BAIDU_OCR_API_KEY = 'CdFEv5cJRn2QgOyLjpl93W2M'; 
const BAIDU_OCR_SECRET_KEY = 'N65tO0jSFSN8bYXUAXen0CJugySJVlpZ'; 
// 改回使用通用文字识别接口
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
        
        // 设置请求超时
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒超时
        
        try {
            console.log('准备发送OCR请求...');
            
            // 发送OCR请求
            const response = await fetch(`${OCR_API_URL}?access_token=${accessToken}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'application/json'
                },
                body: `image=${encodeURIComponent(base64Image)}&language_type=CHN_ENG&detect_direction=true`,
                signal: controller.signal
            });
            
            clearTimeout(timeoutId); // 清除超时
            
            console.log('OCR请求响应状态:', response.status, response.statusText);
            console.log('OCR响应头:', JSON.stringify([...response.headers.entries()]));
            
            // 检查响应状态
            if (!response.ok) {
                console.error('OCR请求失败状态码:', response.status);
                const responseText = await response.text();
                console.error('OCR错误响应内容:', responseText.substring(0, 500));
                throw new Error(`OCR请求失败: ${response.statusText}`);
            }
            
            // 尝试解析JSON响应
            let responseText;
            try {
                responseText = await response.text();
                console.log('OCR响应内容前100个字符:', responseText.substring(0, 100));
                
                // 检查响应是否为HTML
                if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
                    console.error('收到HTML响应而非JSON:', responseText.substring(0, 500));
                    throw new Error('服务器返回了HTML而不是JSON，可能是网络问题或服务不可用');
                }
                
                const result = JSON.parse(responseText);
                
                if (result.error_code) {
                    console.error('百度OCR返回错误:', result.error_code, result.error_msg);
                    throw new Error(`百度OCR错误: ${result.error_msg}`);
                }
                
                // 提取识别的文字
                const textArray = result.words_result.map(item => item.words);
                return textArray.join('\n');
            } catch (jsonError) {
                console.error('JSON解析错误:', jsonError);
                console.error('原始响应内容:', responseText ? responseText.substring(0, 500) : '无响应内容');
                throw new Error('OCR响应解析失败: ' + jsonError.message);
            }
        } catch (fetchError) {
            clearTimeout(timeoutId); // 确保清除超时
            if (fetchError.name === 'AbortError') {
                throw new Error('OCR请求超时');
            }
            throw fetchError;
        }
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