document.addEventListener('DOMContentLoaded', function() {
    // 获取DOM元素
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');
    const analyzeBtn = document.getElementById('analyze-btn');
    const loadingSection = document.getElementById('loading');
    const resultSection = document.getElementById('result-section');
    const fileInput = document.getElementById('file-input');
    const photoInput = document.getElementById('photo-input');
    const photoPreview = document.getElementById('photo-preview');
    const essayText = document.getElementById('essay-text');
    const aiScore = document.getElementById('ai-score');
    const verdict = document.getElementById('verdict');
    const analysisContent = document.getElementById('analysis-content');
    
    let radarChart = null;
    let essayContent = '';
    
    // 标签页切换功能
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // 移除所有标签页的active类
            tabBtns.forEach(b => b.classList.remove('active'));
            tabPanes.forEach(p => p.classList.remove('active'));
            
            // 添加当前标签页的active类
            this.classList.add('active');
            const tabId = this.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
        });
    });
    
    // 文件上传处理
    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        // 检查文件类型
        const validTypes = ['.txt', '.doc', '.docx', '.pdf'];
        const fileExt = file.name.substring(file.name.lastIndexOf('.'));
        if (!validTypes.includes(fileExt.toLowerCase())) {
            alert('请上传支持的文件格式：.txt, .doc, .docx, .pdf');
            fileInput.value = '';
            return;
        }
        
        // 处理文件内容
        if (fileExt.toLowerCase() === '.txt') {
            const reader = new FileReader();
            reader.onload = function(e) {
                essayContent = e.target.result;
            };
            reader.readAsText(file);
        } else {
            // 对于非txt文件，提示用户需要OCR处理
            alert('非TXT格式的文件需要OCR处理，目前仅支持直接读取TXT文件内容。其他格式请使用拍照上传或直接粘贴文本。');
        }
    });
    
    // 拍照上传处理
    photoInput.addEventListener('change', async function(e) {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;
        
        // 清空预览区域
        photoPreview.innerHTML = '';
        let allOcrText = '';
        
        // 处理每个文件
        for (const file of files) {
            // 检查是否为图片
            if (!file.type.startsWith('image/')) {
                alert('请只上传图片文件');
                continue;
            }
            
            try {
                // 显示图片预览
                const previewUrl = await readFileAsDataURL(file);
                const imgElement = document.createElement('div');
                imgElement.innerHTML = `<img src="${previewUrl}" alt="预览图片">`;
                photoPreview.appendChild(imgElement);
                
                // 调用OCR API处理图片
                const ocrResult = await processOCR(file);
                allOcrText += ocrResult + '\n\n';
            } catch (error) {
                console.error('处理图片时出错:', error);
                alert(`处理图片 ${file.name} 时出错`);
            }
        }
        
        // 显示OCR结果
        if (allOcrText) {
            document.getElementById('ocr-result').classList.remove('hidden');
            document.getElementById('ocr-text').value = allOcrText.trim();
        }
    });
    
    // 确认使用OCR结果
    document.getElementById('confirm-ocr').addEventListener('click', function() {
        const ocrText = document.getElementById('ocr-text').value;
        if (ocrText) {
            essayText.value = ocrText;
            // 切换到文本输入标签页
            document.querySelector('[data-tab="text"]').click();
        }
    });
    
    // 文件读取为DataURL
    function readFileAsDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.onerror = e => reject(e);
            reader.readAsDataURL(file);
        });
    }
    
    // OCR处理函数
    async function processOCR(file) {
        // 这里应该调用实际的OCR API
        // 示例中使用模拟数据
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(`这是图片 ${file.name} 的OCR识别结果示例。\n实际应用中这里将返回真实的文字识别内容。`);
            }, 1000);
        });
    });
    
    // 分析按钮点击事件
    analyzeBtn.addEventListener('click', function() {
        // 获取当前活动的输入方式
        const activeTab = document.querySelector('.tab-pane.active').id;
        
        // 根据不同的输入方式获取文本内容
        if (activeTab === 'text') {
            essayContent = essayText.value.trim();
        }
        // 文件和图片的内容在各自的事件处理中已经设置
        
        // 检查是否有内容
        if (!essayContent) {
            alert('请输入或上传作文内容');
            return;
        }
        
        // 显示加载动画
        loadingSection.classList.remove('hidden');
        resultSection.classList.add('hidden');
        
        // 调用API分析作文
        analyzeEssay(essayContent);
    });
    
    // 调用API分析作文
    async function analyzeEssay(content) {
        try {
            // 构建API请求
            const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ content: content })
            });
            
            // 模拟API调用（实际项目中应替换为真实API调用）
            // 这里我们模拟一个延迟和响应
            setTimeout(() => {
                // 模拟的分析结果
                const mockResult = {
                    aiProbability: Math.random() * 100,
                    features: {
                        coherence: Math.random() * 100,
                        creativity: Math.random() * 100,
                        structure: Math.random() * 100,
                        vocabulary: Math.random() * 100,
                        humanLikeness: Math.random() * 100
                    },
                    analysis: [
                        "文章结构分析：文章结构清晰，段落划分合理。",
                        "语言表达分析：语言表达流畅，用词丰富多样。",
                        "内容创新分析：内容有一定创新性，但部分表述较为模板化。",
                        "情感表达分析：情感表达自然，有个人特色。",
                        "总体评价：综合各项指标，该作文由人工撰写的可能性较高。"
                    ]
                };
                
                // 显示分析结果
                displayResults(mockResult);
                
                // 隐藏加载动画，显示结果区域
                loadingSection.classList.add('hidden');
                resultSection.classList.remove('hidden');
            }, 2000); // 模拟2秒的API调用时间
            
        } catch (error) {
            console.error('分析过程中出错:', error);
            alert('分析过程中出错，请重试');
            loadingSection.classList.add('hidden');
        }
    }
    
    // 显示分析结果
    function displayResults(result) {
        // 设置AI生成概率
        const probability = result.aiProbability.toFixed(1);
        aiScore.textContent = `${probability}%`;
        
        // 设置判定结果
        if (result.aiProbability > 50) {
            verdict.textContent = 'AI生成';
            verdict.classList.add('ai');
        } else {
            verdict.textContent = '人工撰写';
            verdict.classList.remove('ai');
        }
        
        // 显示详细分析
        analysisContent.innerHTML = result.analysis.map(item => `<p>${item}</p>`).join('');
        
        // 绘制雷达图
        drawRadarChart(result.features);
    }
    
    // 绘制雷达图
    function drawRadarChart(features) {
        const ctx = document.getElementById('radar-chart').getContext('2d');
        
        // 如果已经有图表，先销毁
        if (radarChart) {
            radarChart.destroy();
        }
        
        // 创建新的雷达图
        radarChart = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: ['连贯性', '创造性', '结构性', '词汇丰富度', '人类特征'],
                datasets: [{
                    label: '作文特征分析',
                    data: [
                        features.coherence,
                        features.creativity,
                        features.structure,
                        features.vocabulary,
                        features.humanLikeness
                    ],
                    backgroundColor: 'rgba(52, 152, 219, 0.2)',
                    borderColor: 'rgba(52, 152, 219, 1)',
                    pointBackgroundColor: 'rgba(52, 152, 219, 1)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgba(52, 152, 219, 1)'
                }]
            },
            options: {
                scales: {
                    r: {
                        angleLines: {
                            display: true
                        },
                        suggestedMin: 0,
                        suggestedMax: 100
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    }
                }
            }
        });
    }
});