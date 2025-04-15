document.addEventListener('DOMContentLoaded', () => {
    const checkBtn = document.getElementById('checkBtn');
    const contentInput = document.getElementById('contentInput');
    const imageInput = document.getElementById('imageInput');
    const imagePreview = document.getElementById('imagePreview');
    const resultSection = document.getElementById('resultSection');
    let radarChart = null;
    let uploadedImages = [];

    imageInput.addEventListener('change', (e) => {
        // 确保清空之前的图片数组和预览
        uploadedImages = [];
        imagePreview.innerHTML = '';
        
        // 获取新选择的文件
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            // 只处理第一张图片
            uploadedImages = [files[0]];
            const file = files[0];
            
            // 创建新的FileReader实例
            const reader = new FileReader();
            reader.onload = (event) => {
                // 确保预览区域是空的
                if (imagePreview.children.length > 0) {
                    imagePreview.innerHTML = '';
                }
                
                const img = document.createElement('img');
                img.src = event.target.result;
                img.className = 'img-thumbnail';
                img.style.maxWidth = '150px';
                img.style.height = 'auto';
                imagePreview.appendChild(img);
            };
            reader.readAsDataURL(file);
        }
    });

    checkBtn.addEventListener('click', async () => {
        let text = contentInput.value.trim();
        const activeTab = document.querySelector('.nav-link.active');
        
        if (activeTab.id === 'image-tab') {
            if (uploadedImages.length === 0) {
                alert('请选择需要识别的图片');
                return;
            }
            try {
                checkBtn.disabled = true;
                checkBtn.textContent = 'OCR识别中...';
                const formData = new FormData();
                uploadedImages.forEach(file => {
                    formData.append('images', file);
                });
                
                const response = await fetch('/api/ocr', {
                    method: 'POST',
                    body: formData
                });
                
                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || '请求失败');
                }
                
                const result = await response.json();
                text = result.text;
                if (!text.trim()) {
                    throw new Error('未能识别出文字内容');
                }
            } catch (error) {
                alert(error.message);
                checkBtn.disabled = false;
                checkBtn.textContent = '开始检查';
                return;
            }
        } else if (!text) {
            alert('请输入需要检查的文本');
            return;
        }

        try {
            checkBtn.disabled = true;
            checkBtn.textContent = '检查中...';
            
            const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || '请求失败');
            }

            const data = await response.json();
            if (!data || !data.content) {
                throw new Error('服务器返回无效数据');
            }
            
            // 解析AI返回的内容
            const content = data.content;
            // 提取AI生成的概率，优先匹配百分比格式
            const aiGeneratedMatch = content.match(/AI生成概率[：:] *(\d+(?:\.\d+)?%|\d+(?:\.\d+)?\s*%|无法判定)/i) || 
                                   content.match(/AI生成的概率[：:] *(\d+(?:\.\d+)?%|\d+(?:\.\d+)?\s*%|无法判定)/i);
            const aiProbability = aiGeneratedMatch ? aiGeneratedMatch[1].trim() : '无法判定';
            
            // 从内容中提取各维度得分
            // 首先尝试从详细分析中提取格式为 "1. 语言流畅度: 9/10" 的评分
            const detailedScoreMatches = content.match(/\d+\. ([^：:]+)[：:]\s*(\d+)\s*\/\s*10/g) || [];
            const dimensions = {};
            
            // 处理详细评分格式
            detailedScoreMatches.forEach(match => {
                const result = match.match(/\d+\. ([^：:]+)[：:]\s*(\d+)\s*\/\s*10/);
                if (result && result.length >= 3) {
                    const dimension = result[1].trim();
                    const score = parseInt(result[2]);
                    if (dimension && !isNaN(score)) {
                        dimensions[dimension] = score;
                    }
                }
            });
            
            // 如果没有找到详细格式的评分，尝试其他可能的格式
            if (Object.keys(dimensions).length === 0) {
                // 尝试匹配 "**语言流畅度**" 格式后跟评分的模式
                const starredMatches = content.match(/[\*]{2}([^\*]+)[\*]{2}[^\d]*(\d+)\s*\/\s*10/g) || [];
                starredMatches.forEach(match => {
                    const result = match.match(/[\*]{2}([^\*]+)[\*]{2}[^\d]*(\d+)\s*\/\s*10/);
                    if (result && result.length >= 3) {
                        const dimension = result[1].trim();
                        const score = parseInt(result[2]);
                        if (dimension && !isNaN(score)) {
                            dimensions[dimension] = score;
                        }
                    }
                });
                
                // 尝试匹配简单的数字列表格式
                if (Object.keys(dimensions).length === 0) {
                    const simpleMatches = content.match(/\d+\. ([^：:]+)[：:][^\d]*(\d+)/g) || [];
                    simpleMatches.forEach(match => {
                        const result = match.match(/\d+\. ([^：:]+)[：:][^\d]*(\d+)/);
                        if (result && result.length >= 3) {
                            const dimension = result[1].trim();
                            const score = parseInt(result[2]);
                            if (dimension && !isNaN(score)) {
                                dimensions[dimension] = score;
                            }
                        }
                    });
                }
            }
            
            // 如果没有找到任何维度得分，抛出错误
            if (Object.keys(dimensions).length === 0) {
                throw new Error('无法解析分析维度数据');
            }
            
            resultSection.innerHTML = `
                <div class="card shadow">
                    <div class="card-body">
                        <h4 class="card-title mb-4">检查结果</h4>
                        <div class="alert ${aiProbability !== '无法判定' && parseFloat(aiProbability) > 50 ? 'alert-warning' : 'alert-success'} text-center mb-4">
                            <h5 class="mb-0">AI生成概率：${aiProbability}</h5>
                        </div>
                        <div class="row">
                            <div class="col-md-6">
                                <canvas id="radarChart"></canvas>
                            </div>
                            <div class="col-md-6">
                                ${Object.entries(dimensions).map(([dimension, score]) => {
                                    let progressClass = 'bg-success';
                                    if (score < 5) progressClass = 'bg-danger';
                                    else if (score < 8) progressClass = 'bg-warning';
                                    
                                    return `
                                    <div class="dimension-card card mb-3">
                                        <div class="card-body">
                                            <div class="d-flex justify-content-between mb-2">
                                                <h5 class="mb-0">${dimension}</h5>
                                                <span class="badge ${progressClass.replace('bg-', 'text-bg-')}">${score}/10</span>
                                            </div>
                                            <div class="progress">
                                                <div class="progress-bar ${progressClass}" role="progressbar" style="width: ${score * 10}%" 
                                                    aria-valuenow="${score * 10}" aria-valuemin="0" aria-valuemax="100"></div>
                                            </div>
                                        </div>
                                    </div>
                                    `;
                                }).join('')}
                            </div>
                        </div>
                        <div class="card mt-3">
                            <div class="card-body">
                                <h5 class="card-title">详细分析报告</h5>
                                <div class="analysis-content">
                                    ${data.content ? data.content
                                        .replace(/[#*]/g, '')
                                        .split('\n')
                                        .filter(line => line.trim())
                                        .map(line => `<p class="mb-3">${line.trim()}</p>`)
                                        .join('') : '无详细分析内容'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>`;
            // 绘制雷达图
            const ctx = document.getElementById('radarChart').getContext('2d');
            if (radarChart) {
                radarChart.destroy();
            }
            radarChart = new Chart(ctx, {
                type: 'radar',
                data: {
                    labels: Object.keys(dimensions),
                    datasets: [{
                        label: '分析得分',
                        data: Object.values(dimensions),
                        backgroundColor: 'rgba(54, 162, 235, 0.2)',
                        borderColor: 'rgb(54, 162, 235)',
                        pointBackgroundColor: 'rgb(54, 162, 235)',
                        pointBorderColor: '#fff',
                        pointHoverBackgroundColor: '#fff',
                        pointHoverBorderColor: 'rgb(54, 162, 235)'
                    }]
                },
                options: {
                    elements: {
                        line: {
                            borderWidth: 3
                        }
                    },
                    scales: {
                        r: {
                            angleLines: {
                                display: true
                            },
                            suggestedMin: 0,
                            suggestedMax: 10
                        }
                    }
                }
            });

            resultSection.classList.remove('d-none');
        } catch (error) {
            alert(`检查失败: ${error.message}`);
        } finally {
            checkBtn.disabled = false;
            checkBtn.textContent = '检查文本';
        }
    });
});