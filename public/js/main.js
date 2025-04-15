// ... existing code ...

// 处理图片上传
function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // 显示加载指示器
    document.getElementById('loading').style.display = 'block';
    
    // 检查文件大小
    if (file.size > 10 * 1024 * 1024) {
        alert('图片太大，请选择小于10MB的图片');
        document.getElementById('loading').style.display = 'none';
        return;
    }
    
    // 检查是否为图片
    if (!file.type.startsWith('image/')) {
        alert('请选择图片文件');
        document.getElementById('loading').style.display = 'none';
        return;
    }
    
    // 显示上传中的提示
    const statusElement = document.getElementById('status-message');
    if (statusElement) {
        statusElement.textContent = '正在处理图片，请稍候...';
        statusElement.style.display = 'block';
    }
    
    // 创建FormData对象
    const formData = new FormData();
    formData.append('image', file);
    
    // 发送请求
    fetch('/upload-image', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            return response.text().then(text => {
                throw new Error(`服务器错误 (${response.status}): ${text}`);
            });
        }
        return response.json();
    })
    .then(data => {
        // 处理成功响应
        // ... existing code ...
    })
    .catch(error => {
        console.error('图片上传错误:', error);
        alert('图片处理失败: ' + error.message + '\n请尝试使用更清晰的图片或直接输入文本。');
        
        if (statusElement) {
            statusElement.textContent = '图片处理失败，请重试或直接输入文本';
            statusElement.style.color = 'red';
        }
    })
    .finally(() => {
        // 隐藏加载指示器
        document.getElementById('loading').style.display = 'none';
    });
}

// ... existing code ...