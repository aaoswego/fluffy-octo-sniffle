import os
import json
import secrets
from flask import Flask, render_template, request, jsonify, session
from openai import OpenAI

app = Flask(__name__)
if not os.environ.get('SESSION_SECRET'):
    raise RuntimeError("SESSION_SECRET environment variable must be set")
app.secret_key = os.environ.get('SESSION_SECRET')

# the newest OpenAI model is "gpt-5" which was released August 7, 2025.
# do not change this unless explicitly requested by the user
openai_client = OpenAI(api_key=os.environ.get('OPENAI_API_KEY'))

quiz_storage = {}
content_storage = {}

@app.route('/')
def index():
    return render_template('index.html')

def validate_learning_content(content):
    if not isinstance(content, dict):
        return None
    
    if 'overview' not in content or not isinstance(content['overview'], str):
        content['overview'] = 'Welcome to your learning session!'
    
    if 'sections' not in content or not isinstance(content['sections'], list):
        return None
    
    validated_sections = []
    for section in content['sections']:
        if not isinstance(section, dict):
            continue
        
        estimated_time = section.get('estimated_time', 5)
        if not isinstance(estimated_time, (int, float)):
            try:
                estimated_time = int(estimated_time)
            except:
                estimated_time = 5
        
        validated_section = {
            'title': section.get('title', 'Untitled Section') if isinstance(section.get('title'), str) else 'Untitled Section',
            'estimated_time': int(estimated_time),
            'content': section.get('content', 'Content not available') if isinstance(section.get('content'), str) else 'Content not available',
            'key_points': section.get('key_points', []) if isinstance(section.get('key_points'), list) else []
        }
        
        validated_section['key_points'] = [
            str(point) for point in validated_section['key_points'] 
            if point and isinstance(point, (str, int, float))
        ]
        
        validated_sections.append(validated_section)
    
    if not validated_sections:
        return None
    
    return {
        'overview': content['overview'],
        'sections': validated_sections
    }

@app.route('/generate-content', methods=['POST'])
def generate_content():
    data = request.json
    if not data or not isinstance(data, dict):
        return jsonify({'error': 'Invalid request body'}), 400
    
    topic = data.get('topic')
    familiarity = data.get('familiarity')
    time_available = data.get('time')
    
    try:
        response = openai_client.chat.completions.create(
            model="gpt-5",
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert educator. Create a detailed learning plan with well-formatted content. IMPORTANT: Always include a recap/summary section as the LAST section to review all key concepts before the quiz. Use HTML formatting in the content field: <p> for paragraphs, <strong> for emphasis, <ul><li> for lists, <br> for line breaks. Respond with JSON using double quotes in this exact format: {\"overview\": \"brief overview text\", \"sections\": [{\"title\": \"section title\", \"estimated_time\": 5, \"content\": \"HTML formatted content with multiple paragraphs\", \"key_points\": [\"point1\", \"point2\"]}]} where estimated_time is in minutes."
                },
                {
                    "role": "user",
                    "content": f"Create a comprehensive, detailed learning plan for a {familiarity} level student who has {time_available} minutes to study the topic: {topic}. The content should be substantial and rich - each section should have multiple paragraphs with detailed explanations, examples, and context. Use the full time available to provide thorough coverage. Include estimated_time (in minutes) for each section. Make sure to include a final recap section that summarizes all the main concepts covered. Format the content with HTML tags for better readability."
                }
            ],
            response_format={"type": "json_object"},
            max_completion_tokens=8192
        )
        
        raw_content = response.choices[0].message.content
        if not raw_content:
            return jsonify({'error': 'Failed to generate content'}), 500
            
        content = json.loads(raw_content)
        validated_content = validate_learning_content(content)
        
        if not validated_content:
            return jsonify({'error': 'Invalid content format generated'}), 500
        
        session_id = get_session_id()
        content_storage[session_id] = {
            'learning_content': validated_content,
            'topic': topic
        }
        
        session['current_section'] = 0
        session['completed_sections'] = []
        
        return jsonify(validated_content)
    except json.JSONDecodeError as e:
        return jsonify({'error': 'Failed to parse AI response'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def validate_quiz(quiz):
    if not isinstance(quiz, dict) or 'questions' not in quiz:
        return None
    
    if not isinstance(quiz['questions'], list):
        return None
    
    validated_questions = []
    for q in quiz['questions']:
        if not isinstance(q, dict):
            continue
        
        question_text = q.get('question', 'Question not available')
        if not isinstance(question_text, str):
            question_text = str(question_text)
        
        options = q.get('options', [])
        if not isinstance(options, list) or len(options) < 2:
            continue
        
        options = [str(opt) for opt in options if opt][:4]
        if len(options) < 2:
            continue
        
        correct_answer = q.get('correct_answer', 0)
        if isinstance(correct_answer, str):
            try:
                correct_answer = int(correct_answer)
            except:
                correct_answer = 0
        
        if not isinstance(correct_answer, int) or correct_answer < 0 or correct_answer >= len(options):
            correct_answer = 0
        
        validated_questions.append({
            'question': question_text,
            'options': options,
            'correct_answer': correct_answer
        })
    
    if not validated_questions:
        return None
    
    return {'questions': validated_questions}

def get_session_id():
    if 'session_id' not in session:
        session['session_id'] = secrets.token_urlsafe(32)
    return session['session_id']

@app.route('/generate-quiz', methods=['POST'])
def generate_quiz():
    data = request.json
    if not data or not isinstance(data, dict):
        return jsonify({'error': 'Invalid request body'}), 400
    
    try:
        section_index = int(data.get('section_index', 0))
        if section_index < 0:
            return jsonify({'error': 'Invalid section index'}), 400
    except (TypeError, ValueError):
        return jsonify({'error': 'Invalid section index type'}), 400
    
    session_id = get_session_id()
    stored_data = content_storage.get(session_id)
    
    if not stored_data:
        return jsonify({'error': 'No learning content found'}), 400
    
    learning_content = stored_data.get('learning_content')
    topic = stored_data.get('topic')
    
    if not learning_content or not topic:
        return jsonify({'error': 'No learning content found'}), 400
    
    if section_index >= len(learning_content['sections']):
        return jsonify({'error': 'Invalid section index'}), 400
    
    section = learning_content['sections'][section_index]
    
    try:
        response = openai_client.chat.completions.create(
            model="gpt-5",
            messages=[
                {
                    "role": "system",
                    "content": "You are a quiz generator. Create 3 multiple choice questions. Respond with JSON using double quotes in this exact format: {\"questions\": [{\"question\": \"question text\", \"options\": [\"option1\", \"option2\", \"option3\", \"option4\"], \"correct_answer\": 0}]} where correct_answer is the index of the correct option (0-3)."
                },
                {
                    "role": "user",
                    "content": f"Create quiz questions about the topic '{topic}' based on this section:\nTitle: {section['title']}\nContent: {section['content']}\n\nIMPORTANT: All questions must be specifically about {topic}."
                }
            ],
            response_format={"type": "json_object"},
            max_completion_tokens=4096
        )
        
        raw_quiz = response.choices[0].message.content
        if not raw_quiz:
            return jsonify({'error': 'Failed to generate quiz'}), 500
        
        quiz = json.loads(raw_quiz)
        validated_quiz = validate_quiz(quiz)
        
        if not validated_quiz:
            return jsonify({'error': 'Invalid quiz format generated'}), 500
        
        session_id = get_session_id()
        quiz_key = f'{session_id}_quiz_{section_index}'
        quiz_storage[quiz_key] = validated_quiz
        
        client_quiz = {
            'questions': [
                {
                    'question': q['question'],
                    'options': q['options']
                }
                for q in validated_quiz['questions']
            ]
        }
        
        return jsonify(client_quiz)
    except json.JSONDecodeError as e:
        return jsonify({'error': 'Failed to parse quiz response'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/submit-quiz', methods=['POST'])
def submit_quiz():
    data = request.json
    if not data or not isinstance(data, dict):
        return jsonify({'error': 'Invalid request body'}), 400
    
    try:
        section_index = int(data.get('section_index', 0))
        if section_index < 0:
            return jsonify({'error': 'Invalid section index'}), 400
    except (TypeError, ValueError):
        return jsonify({'error': 'Invalid section index type'}), 400
    
    answers = data.get('answers', [])
    if not isinstance(answers, list):
        return jsonify({'error': 'Invalid answers format'}), 400
    
    try:
        answers = [int(a) for a in answers]
    except (TypeError, ValueError):
        return jsonify({'error': 'Invalid answer values'}), 400
    
    session_id = get_session_id()
    quiz_key = f'{session_id}_quiz_{section_index}'
    stored_quiz = quiz_storage.get(quiz_key)
    
    if not stored_quiz or 'questions' not in stored_quiz:
        return jsonify({'error': 'Quiz not found'}), 400
    
    correct_answers = [q['correct_answer'] for q in stored_quiz['questions']]
    
    if len(answers) != len(correct_answers):
        return jsonify({'error': 'Invalid number of answers'}), 400
    
    score = sum(1 for i, answer in enumerate(answers) if answer == correct_answers[i])
    total = len(correct_answers)
    percentage = (score / total * 100) if total > 0 else 0
    
    completed = session.get('completed_sections', [])
    if section_index not in completed:
        completed.append(section_index)
        session['completed_sections'] = completed
    
    return jsonify({
        'score': score,
        'total': total,
        'percentage': percentage,
        'completed_sections': completed
    })

@app.route('/reset', methods=['POST'])
def reset():
    session.clear()
    return jsonify({'success': True})

@app.route('/generate-interview-quiz', methods=['POST'])
def generate_interview_quiz():
    data = request.json
    if not data or not isinstance(data, dict):
        return jsonify({'error': 'Invalid request body'}), 400
    
    company = data.get('company')
    job_description = data.get('job_description')
    
    if not company or not job_description:
        return jsonify({'error': 'Company name and job description are required'}), 400
    
    try:
        response = openai_client.chat.completions.create(
            model="gpt-5",
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert interviewer. Create 20 multiple choice interview questions based on the job description. Questions should cover technical skills, behavioral scenarios, and company-specific knowledge. Respond with JSON using double quotes in this exact format: {\"questions\": [{\"question\": \"question text\", \"options\": [\"option1\", \"option2\", \"option3\", \"option4\"], \"correct_answer\": 0}]} where correct_answer is the index of the correct option (0-3)."
                },
                {
                    "role": "user",
                    "content": f"Create 20 interview questions for a position at {company}. Job description:\n\n{job_description}"
                }
            ],
            response_format={"type": "json_object"},
            max_completion_tokens=8192
        )
        
        raw_quiz = response.choices[0].message.content
        if not raw_quiz:
            return jsonify({'error': 'Failed to generate interview questions'}), 500
        
        quiz = json.loads(raw_quiz)
        validated_quiz = validate_quiz(quiz)
        
        if not validated_quiz:
            return jsonify({'error': 'Invalid quiz format generated'}), 500
        
        session_id = get_session_id()
        quiz_key = f'{session_id}_interview_quiz'
        quiz_storage[quiz_key] = validated_quiz
        
        session['company'] = company
        session['job_description'] = job_description
        
        client_quiz = {
            'questions': [
                {
                    'question': q['question'],
                    'options': q['options']
                }
                for q in validated_quiz['questions']
            ]
        }
        
        return jsonify(client_quiz)
    except json.JSONDecodeError as e:
        return jsonify({'error': 'Failed to parse quiz response'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/submit-interview-quiz', methods=['POST'])
def submit_interview_quiz():
    data = request.json
    if not data or not isinstance(data, dict):
        return jsonify({'error': 'Invalid request body'}), 400
    
    answers = data.get('answers', [])
    if not isinstance(answers, list):
        return jsonify({'error': 'Invalid answers format'}), 400
    
    try:
        answers = [int(a) for a in answers]
    except (TypeError, ValueError):
        return jsonify({'error': 'Invalid answer values'}), 400
    
    session_id = get_session_id()
    quiz_key = f'{session_id}_interview_quiz'
    stored_quiz = quiz_storage.get(quiz_key)
    
    if not stored_quiz or 'questions' not in stored_quiz:
        return jsonify({'error': 'Quiz not found'}), 400
    
    correct_answers = [q['correct_answer'] for q in stored_quiz['questions']]
    
    if len(answers) != len(correct_answers):
        return jsonify({'error': 'Invalid number of answers'}), 400
    
    score = sum(1 for i, answer in enumerate(answers) if answer == correct_answers[i])
    total = len(correct_answers)
    percentage = (score / total * 100) if total > 0 else 0
    
    incorrect_questions = []
    for i, answer in enumerate(answers):
        if answer != correct_answers[i]:
            q = stored_quiz['questions'][i]
            incorrect_questions.append({
                'question_number': i + 1,
                'question': q['question'],
                'your_answer': q['options'][answer] if 0 <= answer < len(q['options']) else 'Not answered',
                'correct_answer': q['options'][q['correct_answer']]
            })
    
    return jsonify({
        'score': score,
        'total': total,
        'percentage': percentage,
        'incorrect_questions': incorrect_questions
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
