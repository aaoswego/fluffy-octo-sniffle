let learningContent = null;
let currentSection = 0;
let currentQuiz = null;
let completedSections = [];

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
    document.getElementById('section-content').innerHTML = `<p>${section.content}</p>`;
    
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
            <h4>Question ${qIndex + 1}: ${q.question}</h4>
            ${q.options.map((option, optIndex) => `
                <label class="quiz-option">
                    <input type="radio" name="q${qIndex}" value="${optIndex}">
                    ${option}
                </label>
            `).join('')}
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
