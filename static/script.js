let learningContent = null;
let currentSection = 0;
let currentQuiz = null;
let completedSections = [];

function switchMode(mode) {
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        if (item.getAttribute('data-mode') === mode) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
    
    const normalMode = document.getElementById('normal-mode');
    const interviewMode = document.getElementById('interview-mode');
    
    if (mode === 'normal') {
        normalMode.classList.add('active');
        normalMode.style.display = 'block';
        interviewMode.classList.remove('active');
        interviewMode.style.display = 'none';
    } else if (mode === 'interview') {
        normalMode.classList.remove('active');
        normalMode.style.display = 'none';
        interviewMode.classList.add('active');
        interviewMode.style.display = 'block';
    }
}

document.getElementById('topic-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const topic = document.getElementById('topic').value;
    const familiarity = document.getElementById('familiarity').value;
    const time = document.getElementById('time').value;
    
    showLoading(true);
    
    try {
        const response = await fetch('/generate-content', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ topic, familiarity, time })
        });
        
        if (!response.ok) {
            throw new Error('Failed to generate content');
        }
        
        learningContent = await response.json();
        showLearningScreen();
    } catch (error) {
        alert('Error generating content. Please try again.');
        console.error(error);
    } finally {
        showLoading(false);
    }
});

function showLoading(show) {
    document.getElementById('loading').classList.toggle('active', show);
}

function showLearningScreen() {
    document.getElementById('start-screen').classList.remove('active');
    document.getElementById('learning-screen').classList.add('active');
    
    document.getElementById('overview-content').innerHTML = `<p>${learningContent.overview}</p>`;
    document.getElementById('total-sections').textContent = learningContent.sections.length;
    updateProgress();
}

function showSections() {
    document.getElementById('overview-section').style.display = 'none';
    document.getElementById('sections-list').style.display = 'block';
    
    const container = document.getElementById('sections-container');
    container.innerHTML = '';
    
    learningContent.sections.forEach((section, index) => {
        const isCompleted = completedSections.includes(index);
        const sectionEl = document.createElement('div');
        sectionEl.className = `section-item ${isCompleted ? 'completed' : ''}`;
        sectionEl.innerHTML = `
            <div>
                <strong>${section.title}</strong>
            </div>
            <span class="status">${isCompleted ? '✅' : '📖'}</span>
        `;
        sectionEl.onclick = () => showSection(index);
        container.appendChild(sectionEl);
    });
}

function showSection(index) {
    currentSection = index;
    const section = learningContent.sections[index];
    
    document.getElementById('sections-list').style.display = 'none';
    document.getElementById('section-detail').style.display = 'block';
    
    document.getElementById('section-title').textContent = section.title;
    document.getElementById('section-content').innerHTML = section.content;
    
    const pointsEl = document.getElementById('section-points');
    if (section.key_points && section.key_points.length > 0) {
        pointsEl.innerHTML = `
            <div class="key-points">
                <h3>🔑 Key Points</h3>
                <ul>
                    ${section.key_points.map(point => `<li>${point}</li>`).join('')}
                </ul>
            </div>
        `;
    } else {
        pointsEl.innerHTML = '';
    }
}

function backToSections() {
    document.getElementById('section-detail').style.display = 'none';
    document.getElementById('quiz-section').style.display = 'none';
    document.getElementById('results-section').style.display = 'none';
    document.getElementById('sections-list').style.display = 'block';
    showSections();
}

async function startQuiz() {
    showLoading(true);
    
    try {
        const response = await fetch('/generate-quiz', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ section_index: currentSection })
        });
        
        if (!response.ok) {
            throw new Error('Failed to generate quiz');
        }
        
        currentQuiz = await response.json();
        displayQuiz();
    } catch (error) {
        alert('Error generating quiz. Please try again.');
        console.error(error);
    } finally {
        showLoading(false);
    }
}

function displayQuiz() {
    document.getElementById('section-detail').style.display = 'none';
    document.getElementById('quiz-section').style.display = 'block';
    
    const container = document.getElementById('quiz-container');
    container.innerHTML = '';
    
    currentQuiz.questions.forEach((q, qIndex) => {
        const questionEl = document.createElement('div');
        questionEl.className = 'quiz-question';
        questionEl.innerHTML = `
            <p class="question-text"><strong>Question ${qIndex + 1}:</strong> ${q.question}</p>
            <div class="options">
                ${q.options.map((option, optIndex) => `
                    <label class="option">
                        <input type="radio" name="q${qIndex}" value="${optIndex}">
                        <span>${option}</span>
                    </label>
                `).join('')}
            </div>
        `;
        container.appendChild(questionEl);
    });
}

async function submitQuiz() {
    const answers = [];
    
    currentQuiz.questions.forEach((q, index) => {
        const selected = document.querySelector(`input[name="q${index}"]:checked`);
        answers.push(selected ? parseInt(selected.value) : -1);
    });
    
    if (answers.some(a => a === -1)) {
        alert('Please answer all questions before submitting.');
        return;
    }
    
    showLoading(true);
    
    try {
        const response = await fetch('/submit-quiz', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                answers,
                section_index: currentSection
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to submit quiz');
        }
        
        const result = await response.json();
        completedSections = result.completed_sections;
        showResults(result);
    } catch (error) {
        alert('Error submitting quiz. Please try again.');
        console.error(error);
    } finally {
        showLoading(false);
    }
}

function showResults(result) {
    document.getElementById('quiz-section').style.display = 'none';
    document.getElementById('results-section').style.display = 'block';
    
    let resultClass = 'needs-improvement';
    let message = 'Keep practicing! Every expert was once a beginner.';
    
    if (result.percentage >= 80) {
        resultClass = 'excellent';
        message = 'Excellent work! You\'ve mastered this section! 🎉';
    } else if (result.percentage >= 60) {
        resultClass = 'good';
        message = 'Good job! You\'re making great progress! 👍';
    }
    
    document.getElementById('results-title').textContent = '📊 Quiz Results';
    document.getElementById('results-content').innerHTML = `
        <div class="result-score ${resultClass}">${result.percentage.toFixed(0)}%</div>
        <div class="result-message">${message}</div>
        <p>You answered ${result.score} out of ${result.total} questions correctly.</p>
    `;
    
    updateProgress();
}

function updateProgress() {
    const total = learningContent ? learningContent.sections.length : 0;
    const completed = completedSections.length;
    const percentage = total > 0 ? (completed / total * 100) : 0;
    
    document.getElementById('progress-fill').style.width = `${percentage}%`;
    document.getElementById('progress-text').textContent = `${percentage.toFixed(0)}% Complete`;
    document.getElementById('sections-completed').textContent = completed;
}

async function resetApp() {
    try {
        await fetch('/reset', { method: 'POST' });
        location.reload();
    } catch (error) {
        console.error('Error resetting app:', error);
        location.reload();
    }
}

let interviewQuiz = null;

document.getElementById('interview-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const company = document.getElementById('company-name').value;
    const jobDescription = document.getElementById('job-description').value;
    
    showLoading(true);
    
    try {
        const response = await fetch('/generate-interview-quiz', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                company: company,
                job_description: jobDescription 
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to generate interview questions');
        }
        
        interviewQuiz = await response.json();
        showInterviewQuiz(company);
    } catch (error) {
        alert('Error generating interview questions. Please try again.');
        console.error(error);
    } finally {
        showLoading(false);
    }
});

function showInterviewQuiz(company) {
    document.getElementById('interview-input-screen').classList.remove('active');
    document.getElementById('interview-quiz-screen').classList.add('active');
    
    document.getElementById('interview-info').textContent = `Answer these 20 questions to prepare for your interview at ${company}`;
    
    const container = document.getElementById('interview-quiz-container');
    container.innerHTML = '';
    
    interviewQuiz.questions.forEach((q, index) => {
        const questionDiv = document.createElement('div');
        questionDiv.className = 'quiz-question';
        questionDiv.innerHTML = `
            <p class="question-text"><strong>Question ${index + 1}:</strong> ${q.question}</p>
            <div class="options">
                ${q.options.map((option, optIndex) => `
                    <label class="option">
                        <input type="radio" name="iq${index}" value="${optIndex}">
                        <span>${option}</span>
                    </label>
                `).join('')}
            </div>
        `;
        container.appendChild(questionDiv);
    });
}

async function submitInterviewQuiz() {
    const answers = [];
    
    interviewQuiz.questions.forEach((q, index) => {
        const selected = document.querySelector(`input[name="iq${index}"]:checked`);
        answers.push(selected ? parseInt(selected.value) : -1);
    });
    
    if (answers.some(a => a === -1)) {
        alert('Please answer all questions before submitting.');
        return;
    }
    
    showLoading(true);
    
    try {
        const response = await fetch('/submit-interview-quiz', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ answers })
        });
        
        if (!response.ok) {
            throw new Error('Failed to submit interview quiz');
        }
        
        const result = await response.json();
        showInterviewResults(result);
    } catch (error) {
        alert('Error submitting quiz. Please try again.');
        console.error(error);
    } finally {
        showLoading(false);
    }
}

function showInterviewResults(result) {
    document.getElementById('interview-quiz-screen').classList.remove('active');
    document.getElementById('interview-results-screen').classList.add('active');
    
    let resultClass = 'needs-improvement';
    let message = 'Keep studying! Review the job description and try again.';
    
    if (result.percentage >= 80) {
        resultClass = 'excellent';
        message = 'Outstanding! You\'re well-prepared for this interview! 🎉';
    } else if (result.percentage >= 60) {
        resultClass = 'good';
        message = 'Good preparation! Review a few more areas and you\'ll be ready! 👍';
    }
    
    let incorrectQuestionsHtml = '';
    if (result.incorrect_questions && result.incorrect_questions.length > 0) {
        incorrectQuestionsHtml = `
            <div class="incorrect-section">
                <h3>❌ Questions to Review (${result.incorrect_questions.length})</h3>
                <div class="incorrect-list">
                    ${result.incorrect_questions.map(q => `
                        <div class="incorrect-item">
                            <p class="incorrect-question"><strong>Question ${q.question_number}:</strong> ${q.question}</p>
                            <p class="incorrect-answer"><span class="label-wrong">Your answer:</span> ${q.your_answer}</p>
                            <p class="correct-answer"><span class="label-correct">Correct answer:</span> ${q.correct_answer}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    document.getElementById('interview-results-title').textContent = '📊 Interview Preparation Results';
    document.getElementById('interview-results-content').innerHTML = `
        <div class="result-score ${resultClass}">${result.percentage.toFixed(0)}%</div>
        <div class="result-message">${message}</div>
        <p>You answered ${result.score} out of ${result.total} questions correctly.</p>
        ${incorrectQuestionsHtml}
    `;
}

function resetInterview() {
    document.getElementById('interview-results-screen').classList.remove('active');
    document.getElementById('interview-input-screen').classList.add('active');
    document.getElementById('interview-form').reset();
    interviewQuiz = null;
}
