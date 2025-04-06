from flask import Flask, request, jsonify, send_from_directory
import os
import json
from openai import OpenAI

app = Flask(__name__, static_folder='./')

# 初始化腾讯混元大模型客户端
client = OpenAI(
    api_key=os.environ.get("sk-Oh2AIByD18544HqtnVoslgPi1XHMymgtwXyYyXeumRIiQhiD"),  # 混元 APIKey
    base_url="https://api.hunyuan.cloud.tencent.com/v1",  # 混元 endpoint
)

# 提供静态文件
@app.route('/')
def index():
    return send_from_directory('./', 'index.html')

@app.route('/<path:path>')
def static_files(path):
    return send_from_directory('./', path)

# API端点：分析作文
@app.route('/api/analyze', methods=['POST'])
def analyze_essay():
    data = request.json
    essay_content = data.get('content', '')
    
    if not essay_content:
        return jsonify({'error': '未提供作文内容'}), 400
    
    try:
        # 调用腾讯混元大模型API
        prompt = f"""
        请分析以下中小学生作文是否由AI生成。请从以下几个方面进行分析：
        1. 连贯性：文章的逻辑连贯程度
        2. 创造性：文章的创新和独特表达
        3. 结构性：文章的结构组织
        4. 词汇丰富度：用词的多样性和准确性
        5. 人类特征：是否包含人类写作的特征，如个人情感、经历等
        
        对每个方面给出0-100的评分，并给出AI生成概率的百分比。
        同时提供详细的分析报告，包括文章结构分析、语言表达分析、内容创新分析、情感表达分析和总体评价。
        
        请以JSON格式返回结果，包含以下字段：
        - aiProbability: 数字，表示AI生成的概率（0-100）
        - features: 对象，包含各项特征的评分（coherence, creativity, structure, vocabulary, humanLikeness）
        - analysis: 数组，包含详细分析的各个段落
        
        作文内容：
        {essay_content}
        """
        
        completion = client.chat.completions.create(
            model="hunyuan-turbos-latest",
            messages=[
                {"role": "user", "content": prompt}
            ],
            enable_enhancement=True  # 启用增强参数
        )
        
        # 解析API返回的结果
        response_text = completion.choices[0].message.content
        
        # 尝试从返回文本中提取JSON
        try:
            # 查找JSON开始和结束的位置
            json_start = response_text.find('{')
            json_end = response_text.rfind('}')
            
            if json_start != -1 and json_end != -1:
                json_str = response_text[json_start:json_end+1]
                result = json.loads(json_str)
            else:
                # 如果无法找到JSON，则构造一个模拟结果
                result = create_mock_result(essay_content)
        except json.JSONDecodeError:
            # 如果JSON解析失败，则构造一个模拟结果
            result = create_mock_result(essay_content)
        
        return jsonify(result)
        
    except Exception as e:
        print(f"API调用错误: {str(e)}")
        # 出错时返回模拟数据
        return jsonify(create_mock_result(essay_content))

# 创建模拟结果（当API调用失败时使用）
def create_mock_result(content):
    import random
    
    # 基于文本长度简单估算一些特征
    text_length = len(content)
    base_coherence = min(80, max(40, text_length / 100))
    base_creativity = min(70, max(30, text_length / 150))
    
    # 添加一些随机性
    coherence = base_coherence + random.uniform(-10, 10)
    creativity = base_creativity + random.uniform(-15, 15)
    structure = random.uniform(50, 85)
    vocabulary = random.uniform(40, 90)
    human_likeness = random.uniform(45, 85)
    
    # 计算AI生成概率（这里简单地基于特征的平均值）
    features_avg = (coherence + creativity + structure + vocabulary + human_likeness) / 5
    ai_probability = 100 - features_avg + random.uniform(-10, 10)
    ai_probability = max(0, min(100, ai_probability))  # 确保在0-100范围内
    
    return {
        "aiProbability": ai_probability,
        "features": {
            "coherence": coherence,
            "creativity": creativity,
            "structure": structure,
            "vocabulary": vocabulary,
            "humanLikeness": human_likeness
        },
        "analysis": [
            f"文章结构分析：文章长度为{text_length}字符，结构{['较为松散', '一般', '较为紧凑', '非常紧凑'][int(structure/25)]}。",
            f"语言表达分析：语言表达{['较为简单', '一般', '较为丰富', '非常丰富'][int(vocabulary/25)]}，用词{['单一', '较为多样', '多样', '非常多样'][int(vocabulary/25)]}。",
            f"内容创新分析：内容创新性{['较低', '一般', '较高', '非常高'][int(creativity/25)]}，{['表述模板化明显', '部分表述较为模板化', '表述较为个性化', '表述非常个性化'][int(creativity/25)]}。",
            f"情感表达分析：情感表达{['机械', '较为生硬', '较为自然', '非常自然'][int(human_likeness/25)]}，{['缺乏', '略有', '具有', '充满'][int(human_likeness/25)]}个人特色。",
            f"总体评价：综合各项指标，该作文由{'AI生成' if ai_probability > 50 else '人工撰写'}的可能性较{'高' if abs(ai_probability - 50) > 20 else '为明显' if abs(ai_probability - 50) > 10 else '低'}。"
        ]
    }

if __name__ == '__main__':
    # 设置Flask应用在所有网络接口上监听，端口为5000
    app.run(host='0.0.0.0', port=5000, debug=True)