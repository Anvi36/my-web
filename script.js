let currentTopic = null;
let timeLeft = 300; // 5 minutes in seconds
let timer = null;
let currentQuestion = 0;
let score = 0;
let selectedTopic = null;
let scoreHistory = JSON.parse(localStorage.getItem('scoreHistory')) || [];
let currentDifficulty = 'all';
let categories = [];
let userAnswers = []; // Add this at the top with other variables
let currentTheme = localStorage.getItem('theme') || 'light';

// Add this after the categories array at the top
const learningResources = {
    9: { // General Knowledge
        name: "General Knowledge",
        resources: [
            { name: "Britannica", url: "https://www.britannica.com/", description: "Comprehensive encyclopedia with articles on various topics" },
            { name: "Khan Academy", url: "https://www.khanacademy.org/", description: "Free educational resources across multiple subjects" }
        ]
    },
    17: { // Science & Nature
        name: "Science & Nature",
        resources: [
            { name: "NASA", url: "https://www.nasa.gov/", description: "Space exploration and scientific discoveries" },
            { name: "National Geographic", url: "https://www.nationalgeographic.com/", description: "Nature, science, and exploration" },
            { name: "Science Daily", url: "https://www.sciencedaily.com/", description: "Latest science news and research" }
        ]
    },
    18: { // Computers
        name: "Computers",
        resources: [
            { name: "freeCodeCamp", url: "https://www.freecodecamp.org/", description: "Free coding tutorials and projects" },
            { name: "MDN Web Docs", url: "https://developer.mozilla.org/", description: "Web development resources and documentation" },
            { name: "Codecademy", url: "https://www.codecademy.com/", description: "Interactive coding lessons" }
        ]
    },
    19: { // Mathematics
        name: "Mathematics",
        resources: [
            { name: "Khan Academy Math", url: "https://www.khanacademy.org/math", description: "Free math lessons and practice" },
            { name: "Brilliant", url: "https://brilliant.org/", description: "Interactive math and science learning" },
            { name: "Math is Fun", url: "https://www.mathsisfun.com/", description: "Easy-to-understand math concepts" }
        ]
    },
    20: { // Mythology
        name: "Mythology",
        resources: [
            { name: "Greek Mythology", url: "https://www.greekmythology.com/", description: "Comprehensive guide to Greek mythology" },
            { name: "Mythopedia", url: "https://mythopedia.com/", description: "Encyclopedia of mythology from around the world" }
        ]
    },
    21: { // Sports
        name: "Sports",
        resources: [
            { name: "ESPN", url: "https://www.espn.com/", description: "Sports news, scores, and analysis" },
            { name: "Olympics", url: "https://olympics.com/", description: "Official Olympic Games website" }
        ]
    },
    22: { // Geography
        name: "Geography",
        resources: [
            { name: "National Geographic Maps", url: "https://www.nationalgeographic.com/maps/", description: "Interactive maps and geography resources" },
            { name: "Google Earth", url: "https://earth.google.com/", description: "Explore the world in 3D" }
        ]
    },
    23: { // History
        name: "History",
        resources: [
            { name: "History.com", url: "https://www.history.com/", description: "Historical articles and videos" },
            { name: "BBC History", url: "https://www.bbc.co.uk/history", description: "Historical content from BBC" }
        ]
    }
};

// Initialize DOM elements
const startBtn = document.querySelector('.start-btn');
const skipBtn = document.querySelector('.skip-btn');
const timerDisplay = document.querySelector('.timer');
const topicDisplay = document.querySelector('.topic-display');
const quizContainer = document.querySelector('.quiz-container');
const resultContainer = document.querySelector('.result-container');
const progressBar = document.querySelector('.progress');
const changeTopicBtn = document.querySelector('.change-topic-btn');
const themeToggle = document.querySelector('.theme-toggle');
const themeIcon = themeToggle.querySelector('i');

// Add event listeners
startBtn.addEventListener('click', startChallenge);
skipBtn.addEventListener('click', skipToQuiz);
document.querySelector('.restart-btn').addEventListener('click', resetChallenge);
changeTopicBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to change the topic? Your current progress will be lost.')) {
        resetChallenge();
        document.querySelector('.topic-selector').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
});
themeToggle.addEventListener('click', toggleTheme);
document.querySelector('.history-toggle').addEventListener('click', function() {
    const content = document.querySelector('.score-history-content');
    const isHidden = content.classList.contains('hidden');
    content.classList.toggle('hidden');
    this.classList.toggle('active');
});

// Fetch categories from OpenTDB API
async function fetchCategories() {
    try {
        const response = await fetch('https://opentdb.com/api_category.php');
        const data = await response.json();
        categories = data.trivia_categories;
        initializeTopicSelector();
    } catch (error) {
        console.error('Error fetching categories:', error);
        // Fallback categories if API fails
        categories = [
            { id: 9, name: "General Knowledge" },
            { id: 10, name: "Entertainment: Books" },
            { id: 11, name: "Entertainment: Film" },
            { id: 12, name: "Entertainment: Music" },
            { id: 13, name: "Entertainment: Musicals & Theatres" },
            { id: 14, name: "Entertainment: Television" },
            { id: 15, name: "Entertainment: Video Games" },
            { id: 16, name: "Entertainment: Board Games" }
        ];
        initializeTopicSelector();
    }
}

// Fetch questions for a category
async function fetchQuestions(categoryId, difficulty = 'medium') {
    try {
        // If difficulty is 'all', use a random difficulty
        const selectedDifficulty = difficulty === 'all' ? ['easy', 'medium', 'hard'][Math.floor(Math.random() * 3)] : difficulty;
        
        // First try with the specific category
        let response = await fetch(`https://opentdb.com/api.php?amount=10&category=${categoryId}&difficulty=${selectedDifficulty}`);
        let data = await response.json();
        
        // If no questions found, try without difficulty filter
        if (!data.results || data.results.length === 0) {
            response = await fetch(`https://opentdb.com/api.php?amount=10&category=${categoryId}`);
            data = await response.json();
        }
        
        // If still no questions, use fallback questions
        if (!data.results || data.results.length === 0) {
            console.log('Using fallback questions for category:', categoryId);
            return generateFallbackQuestions(categoryId);
        }

        // Process and return the questions
        return data.results.map(q => {
            const allAnswers = [...q.incorrect_answers, q.correct_answer];
            const shuffledAnswers = allAnswers.sort(() => Math.random() - 0.5);
            const correctIndex = shuffledAnswers.indexOf(q.correct_answer);

            return {
                question: q.question,
                options: shuffledAnswers,
                correct: correctIndex
            };
        });
    } catch (error) {
        console.error('Error fetching questions:', error);
        return generateFallbackQuestions(categoryId);
    }
}

// Initialize topic selector
function initializeTopicSelector() {
    const topicSelector = document.querySelector('.topic-selector');
    topicSelector.innerHTML = ''; // Clear existing topics
    
    categories.forEach(category => {
        const topicCard = document.createElement('div');
        topicCard.className = 'topic-card';
        topicCard.setAttribute('data-topic', category.name);
        topicCard.innerHTML = `
            <h3>${category.name}</h3>
            <p>Test your knowledge in ${category.name.toLowerCase()}!</p>
            <div class="topic-category">Trivia • ${currentDifficulty}</div>
        `;
        topicCard.addEventListener('click', () => selectTopic(category));
        topicSelector.appendChild(topicCard);
    });
}

// Select topic
async function selectTopic(category) {
    const topicCards = document.querySelectorAll('.topic-card');
    topicCards.forEach(card => card.classList.remove('selected'));
    event.currentTarget.classList.add('selected');
    
    // Show loading state
    const topicDisplay = document.querySelector('.topic-display');
    topicDisplay.setAttribute('data-topic', category.name);
    topicDisplay.innerHTML = `
        <h2>Loading Questions...</h2>
        <p>Please wait while we prepare your quiz.</p>
    `;
    
    try {
        selectedTopic = {
            name: category.name,
            description: `Test your knowledge in ${category.name.toLowerCase()}!`,
            category: "Trivia",
            difficulty: currentDifficulty,
            questions: await fetchQuestions(category.id, currentDifficulty),
            resources: learningResources[category.id]?.resources || []
        };
        
        // Update topic display with loaded questions and resources
        topicDisplay.innerHTML = `
            <h2>${selectedTopic.name}</h2>
            <p>${selectedTopic.description}</p>
            <div class="topic-category">${selectedTopic.category} • ${selectedTopic.difficulty}</div>
            <div class="learning-resources">
                <h3>Learning Resources:</h3>
                <div class="resource-list">
                    ${selectedTopic.resources.map(resource => `
                        <a href="${resource.url}" target="_blank" class="resource-link">
                            <span class="resource-name">${resource.name}</span>
                            <span class="resource-description">${resource.description}</span>
                        </a>
                    `).join('')}
                </div>
            </div>
        `;
        
        // Scroll to challenge container
        document.querySelector('.challenge-container').scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (error) {
        console.error('Error selecting topic:', error);
        topicDisplay.innerHTML = `
            <h2>Error Loading Questions</h2>
            <p>Please try selecting a different topic.</p>
        `;
    }
}

// Update score history
function updateScoreHistory(topic, score) {
    const percentage = (score / topic.questions.length) * 100;
    const timestamp = new Date();
    scoreHistory.unshift({
        topic: topic.name,
        score: percentage,
        date: timestamp.toLocaleDateString(),
        time: timestamp.toLocaleTimeString(),
        id: Date.now() // Unique identifier for each entry
    });
    if (scoreHistory.length > 5) scoreHistory.pop();
    localStorage.setItem('scoreHistory', JSON.stringify(scoreHistory));
    displayScoreHistory();
}

// Display score history
function displayScoreHistory() {
    const scoreList = document.getElementById('scoreList');
    if (!scoreHistory.length) {
        scoreList.innerHTML = '<div class="no-scores">No scores yet. Complete a quiz to see your history!</div>';
        return;
    }
    
    scoreList.innerHTML = `
        <div class="score-history-header">
            <h3>Recent Scores</h3>
            <button class="clear-history-btn" onclick="clearScoreHistory()">Clear History</button>
        </div>
        ${scoreHistory.map(score => `
            <div class="score-item" data-id="${score.id}">
                <div class="score-info">
                    <span class="score-topic">${score.topic}</span>
                    <span class="score-date">${score.date} ${score.time}</span>
                </div>
                <div class="score-value">
                    <span class="score-percentage">${Math.round(score.score)}%</span>
                </div>
            </div>
        `).join('')}
    `;
}

// Clear score history
function clearScoreHistory() {
    if (confirm('Are you sure you want to clear your score history?')) {
        scoreHistory = [];
        localStorage.removeItem('scoreHistory');
        displayScoreHistory();
    }
}

// Show feedback message
function showFeedback(message, isCorrect) {
    const feedback = document.querySelector('.feedback-message');
    feedback.textContent = message;
    feedback.style.background = isCorrect ? '#4CAF50' : '#ff6b6b';
    feedback.style.display = 'block';
    setTimeout(() => {
        feedback.style.display = 'none';
    }, 2000);
}

// Update question progress
function updateQuestionProgress() {
    const progress = document.querySelector('.question-progress');
    progress.innerHTML = currentTopic.questions.map((_, index) => `
        <div class="question-dot ${index < currentQuestion ? 'answered' : ''}"></div>
    `).join('');
}

// Modify startChallenge function
async function startChallenge() {
    if (!selectedTopic) {
        const randomCategory = categories[Math.floor(Math.random() * categories.length)];
        const topicDisplay = document.querySelector('.topic-display');
        topicDisplay.innerHTML = `
            <h2>Loading Questions...</h2>
            <p>Please wait while we prepare your quiz.</p>
        `;
        
        try {
            selectedTopic = {
                name: randomCategory.name,
                description: `Test your knowledge in ${randomCategory.name.toLowerCase()}!`,
                category: "Trivia",
                difficulty: currentDifficulty,
                questions: await fetchQuestions(randomCategory.id, currentDifficulty)
            };
            
            topicDisplay.innerHTML = `
                <h2>${selectedTopic.name}</h2>
                <p>${selectedTopic.description}</p>
                <div class="topic-category">${selectedTopic.category} • ${selectedTopic.difficulty}</div>
            `;
        } catch (error) {
            console.error('Error starting challenge:', error);
            topicDisplay.innerHTML = `
                <h2>Error Loading Questions</h2>
                <p>Please try again.</p>
            `;
            return;
        }
    }
    
    currentTopic = selectedTopic;
    startTimer();
    startBtn.style.display = 'none';
    changeTopicBtn.style.display = 'block';
    skipBtn.style.display = 'block';
    
    // Scroll to challenge container
    document.querySelector('.challenge-container').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function skipToQuiz() {
    clearInterval(timer);
    quizContainer.style.display = 'block';
    currentQuestion = 0; // Reset to first question
    displayQuestion();
}

function startTimer() {
    timer = setInterval(() => {
        timeLeft--;
        updateTimer();
        updateProgress();
        
        if (timeLeft <= 0) {
            endChallenge();
        }
    }, 1000);
}

function updateTimer() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    if (timeLeft <= 30) {
        timerDisplay.classList.add('timer-warning');
    }
}

function updateProgress() {
    const progress = ((300 - timeLeft) / 300) * 100;
    progressBar.style.width = `${progress}%`;
}

function endChallenge() {
    clearInterval(timer);
    quizContainer.style.display = 'block';
    currentQuestion = 0; // Reset to first question
    displayQuestion();
}

function showQuiz() {
    quizContainer.style.display = 'block';
    displayQuestion();
}

function displayQuestion() {
    if (!currentTopic || !currentTopic.questions || currentTopic.questions.length === 0) {
        console.error('No questions available');
        return;
    }

    const question = currentTopic.questions[currentQuestion];
    const quizQuestion = document.querySelector('.quiz-question');
    
    // Update question progress dots
    updateQuestionProgress();
    
    // Decode HTML entities in question and options
    const decodedQuestion = decodeHTMLEntities(question.question);
    const decodedOptions = question.options.map(opt => decodeHTMLEntities(opt));
    
    quizQuestion.innerHTML = `
        <h3>Question ${currentQuestion + 1} of ${currentTopic.questions.length}</h3>
        <p>${decodedQuestion}</p>
        <div class="options">
            ${decodedOptions.map((option, index) => `
                <div class="option" data-index="${index}">${option}</div>
            `).join('')}
        </div>
    `;

    // Add event listeners to options
    const options = quizQuestion.querySelectorAll('.option');
    options.forEach(option => {
        option.addEventListener('click', () => {
            const selectedIndex = parseInt(option.dataset.index);
            selectOption(selectedIndex);
        });
    });
}

// Helper function to decode HTML entities
function decodeHTMLEntities(text) {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
}

function selectOption(optionIndex) {
    const question = currentTopic.questions[currentQuestion];
    const options = document.querySelectorAll('.option');
    
    // Disable all options after selection
    options.forEach(option => {
        option.classList.remove('selected', 'correct', 'wrong');
        option.style.pointerEvents = 'none';
    });
    
    // Show selected option
    options[optionIndex].classList.add('selected');
    
    // Store user's answer
    userAnswers[currentQuestion] = {
        question: question.question,
        userAnswer: question.options[optionIndex],
        correctAnswer: question.options[question.correct],
        isCorrect: optionIndex === question.correct
    };
    
    // Check if correct
    if (optionIndex === question.correct) {
        options[optionIndex].classList.add('correct');
        score++;
        showFeedback('Correct!', true);
    } else {
        options[optionIndex].classList.add('wrong');
        options[question.correct].classList.add('correct');
        showFeedback('Incorrect!', false);
    }
    
    // Move to next question after delay
    setTimeout(() => {
        currentQuestion++;
        if (currentQuestion < currentTopic.questions.length) {
            displayQuestion();
        } else {
            updateScoreHistory(currentTopic, score);
            showResults();
        }
    }, 1500);
}

function showResults() {
    quizContainer.style.display = 'none';
    resultContainer.style.display = 'block';
    
    const percentage = (score / currentTopic.questions.length) * 100;
    const expertLevel = getExpertLevel(percentage);
    
    resultContainer.innerHTML = `
        <div class="result-summary">
            <h2>Challenge Complete!</h2>
            <div class="score">${Math.round(percentage)}%</div>
            <div class="expert-level">${expertLevel}</div>
        </div>
        <div class="answers-review">
            ${userAnswers.map((answer, index) => `
                <div class="answer-item ${answer.isCorrect ? 'correct' : 'incorrect'}">
                    <div class="question">Question ${index + 1}: ${decodeHTMLEntities(answer.question)}</div>
                    <div class="your-answer">Your answer: ${decodeHTMLEntities(answer.userAnswer)}</div>
                    ${!answer.isCorrect ? `<div class="correct-answer">Correct answer: ${decodeHTMLEntities(answer.correctAnswer)}</div>` : ''}
                </div>
            `).join('')}
        </div>
        <div class="result-actions">
            <button class="restart-btn">Try Another Topic</button>
        </div>
    `;
    
    // Add event listener to restart button
    resultContainer.querySelector('.restart-btn').addEventListener('click', resetChallenge);
    
    // Smooth scroll to results
    resultContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function getExpertLevel(percentage) {
    if (percentage >= 90) return "Expert";
    if (percentage >= 70) return "Advanced";
    if (percentage >= 50) return "Intermediate";
    if (percentage >= 30) return "Beginner";
    return "Novice";
}

function resetChallenge() {
    timeLeft = 300;
    currentQuestion = 0;
    score = 0;
    selectedTopic = null;
    userAnswers = []; // Reset user answers
    
    resultContainer.style.display = 'none';
    startBtn.style.display = 'block';
    changeTopicBtn.style.display = 'none';
    skipBtn.style.display = 'none';
    
    const topicCards = document.querySelectorAll('.topic-card');
    topicCards.forEach(card => card.classList.remove('selected'));
    
    topicDisplay.innerHTML = `
        <h2>Your Topic</h2>
        <p>Select a topic or click Start for a random topic!</p>
    `;
    progressBar.style.width = '0%';
    updateTimer();
}

// Add difficulty filter
document.querySelectorAll('.difficulty-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
        document.querySelectorAll('.difficulty-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentDifficulty = btn.dataset.difficulty;
        
        // Reset the challenge
        resetChallenge();
        
        // Reinitialize topic selector with new difficulty
        initializeTopicSelector();
        
        // If a topic was selected, update it with new difficulty
        if (selectedTopic) {
            selectedTopic = {
                ...selectedTopic,
                difficulty: currentDifficulty,
                questions: await fetchQuestions(selectedTopic.id, currentDifficulty)
            };
        }
    });
});

// Filter topics by difficulty
function filterTopics() {
    const topicCards = document.querySelectorAll('.topic-card');
    topicCards.forEach(card => {
        if (currentDifficulty === 'all') {
            card.style.display = 'block';
        } else {
            const difficultyText = card.querySelector('.topic-category').textContent.split('•')[1].trim();
            card.style.display = difficultyText.toLowerCase() === currentDifficulty ? 'block' : 'none';
        }
    });
}

// Update generateFallbackQuestions function with category-specific questions
function generateFallbackQuestions(categoryId) {
    const categoryQuestions = {
        17: [ // Science & Nature
            {
                question: "What is the chemical symbol for gold?",
                options: ["Au", "Ag", "Cu", "Fe"]
            },
            {
                question: "Which planet is known as the Red Planet?",
                options: ["Mars", "Venus", "Jupiter", "Saturn"]
            },
            {
                question: "What is the hardest natural substance?",
                options: ["Diamond", "Gold", "Iron", "Platinum"]
            },
            {
                question: "What is the largest organ in the human body?",
                options: ["Skin", "Heart", "Brain", "Liver"]
            },
            {
                question: "Which element has the atomic number 1?",
                options: ["Hydrogen", "Helium", "Oxygen", "Carbon"]
            }
        ],
        18: [ // Computers
            {
                question: "What does CPU stand for?",
                options: ["Central Processing Unit", "Computer Personal Unit", "Central Program Utility", "Computer Processing Unit"]
            },
            {
                question: "Who is known as the father of computers?",
                options: ["Charles Babbage", "Alan Turing", "John von Neumann", "Ada Lovelace"]
            },
            {
                question: "What is the binary equivalent of decimal 10?",
                options: ["1010", "1001", "1100", "1111"]
            },
            {
                question: "Which company developed JavaScript?",
                options: ["Netscape", "Microsoft", "Apple", "Google"]
            },
            {
                question: "What does HTML stand for?",
                options: ["HyperText Markup Language", "High Text Markup Language", "Hyperlink Text Markup", "High Text Markup"]
            }
        ],
        19: [ // Mathematics
            {
                question: "What is the value of π (pi) to two decimal places?",
                options: ["3.14", "3.41", "3.24", "3.42"]
            },
            {
                question: "What is the square root of 144?",
                options: ["12", "10", "14", "16"]
            },
            {
                question: "What is 2 to the power of 3?",
                options: ["8", "6", "9", "4"]
            },
            {
                question: "What is the sum of angles in a triangle?",
                options: ["180 degrees", "90 degrees", "360 degrees", "270 degrees"]
            },
            {
                question: "What is the next number in the sequence: 2, 4, 8, 16, ...?",
                options: ["32", "24", "20", "28"]
            }
        ],
        20: [ // Mythology
            {
                question: "Who is the king of the gods in Greek mythology?",
                options: ["Zeus", "Poseidon", "Hades", "Apollo"]
            },
            {
                question: "What is the name of the three-headed dog in Greek mythology?",
                options: ["Cerberus", "Hydra", "Chimera", "Sphinx"]
            },
            {
                question: "Who is the Roman equivalent of the Greek god Zeus?",
                options: ["Jupiter", "Mars", "Neptune", "Saturn"]
            },
            {
                question: "What is the name of the winged horse in Greek mythology?",
                options: ["Pegasus", "Phoenix", "Griffin", "Hippogriff"]
            },
            {
                question: "Who is the goddess of wisdom in Greek mythology?",
                options: ["Athena", "Hera", "Aphrodite", "Artemis"]
            }
        ],
        21: [ // Sports
            {
                question: "Which sport is known as 'the beautiful game'?",
                options: ["Football", "Cricket", "Basketball", "Tennis"]
            },
            {
                question: "How many players are there in a standard basketball team on court?",
                options: ["5", "4", "6", "7"]
            },
            {
                question: "Which country won the first FIFA World Cup?",
                options: ["Uruguay", "Brazil", "Argentina", "Italy"]
            },
            {
                question: "What is the highest possible score in a single frame of snooker?",
                options: ["147", "155", "167", "180"]
            },
            {
                question: "Which sport is played at Wimbledon?",
                options: ["Tennis", "Cricket", "Golf", "Rugby"]
            }
        ]
    };

    // Get category-specific questions or use general questions
    const questions = categoryQuestions[categoryId] || [
        {
            question: "What is the capital of France?",
            options: ["Paris", "London", "Berlin", "Madrid"]
        },
        {
            question: "Which planet is known as the Red Planet?",
            options: ["Mars", "Venus", "Jupiter", "Saturn"]
        },
        {
            question: "Who painted the Mona Lisa?",
            options: ["Leonardo da Vinci", "Pablo Picasso", "Vincent van Gogh", "Michelangelo"]
        },
        {
            question: "What is the largest mammal in the world?",
            options: ["Blue Whale", "African Elephant", "Giraffe", "Polar Bear"]
        },
        {
            question: "Which element has the chemical symbol 'Au'?",
            options: ["Gold", "Silver", "Copper", "Platinum"]
        }
    ];

    // Ensure we have exactly 10 questions
    while (questions.length < 10) {
        questions.push(questions[Math.floor(Math.random() * questions.length)]);
    }

    // Add random correct answers
    return questions.map(q => ({
        ...q,
        correct: Math.floor(Math.random() * 4)
    }));
}

// Initialize
fetchCategories();
displayScoreHistory();

// Add this function
function toggleTheme() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.body.setAttribute('data-theme', currentTheme);
    localStorage.setItem('theme', currentTheme);
    
    // Update icon
    themeIcon.className = currentTheme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
}

// Add this to initialize theme
function initializeTheme() {
    document.body.setAttribute('data-theme', currentTheme);
    themeIcon.className = currentTheme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
}

// Add to the initialization section at the bottom
initializeTheme();

// Navigation
const navLinks = document.querySelectorAll('.nav-tab');
const pages = document.querySelectorAll('.page');

navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetPage = link.getAttribute('data-page');
        
        // Update active states
        navLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        
        // Show target page
        pages.forEach(page => {
            page.classList.remove('active');
            if (page.id === targetPage) {
                page.classList.add('active');
            }
        });

        // Initialize page content
        switch(targetPage) {
            case 'home':
                initializeHomeHeader();
                break;
            case 'topics':
                initializeTopicsPage();
                break;
            case 'leaderboard':
                initializeLeaderboardPage();
                break;
        }
    });
});

// Leaderboard functionality
const leaderboardFilters = document.querySelectorAll('.filter-btn');
const leaderboardTable = document.querySelector('.leaderboard-table tbody');

leaderboardFilters.forEach(filter => {
    filter.addEventListener('click', () => {
        leaderboardFilters.forEach(f => f.classList.remove('active'));
        filter.classList.add('active');
        // TODO: Implement filtering logic
    });
});

// Topics page functionality
const topicCards = document.querySelectorAll('.topic-card');
const topicDetails = document.querySelector('.topic-details');
const topicInfo = document.querySelector('.topic-info');

topicCards.forEach(card => {
    card.addEventListener('click', () => {
        const topicId = card.getAttribute('data-topic-id');
        const topicName = card.querySelector('h3').textContent;
        
        // Update topic details
        topicInfo.innerHTML = `
            <h2>${topicName}</h2>
            <p>Select a difficulty level to start learning about ${topicName}.</p>
        `;
        
        // Show topic details section
        topicDetails.style.display = 'block';
        
        // Update active state
        topicCards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');
    });
});

// Initialize the first page
document.querySelector('.nav-link[data-page="home"]').click();

// Dummy data for topics
const dummyTopics = [
    {
        id: 1,
        name: "Web Development",
        description: "Learn HTML, CSS, and JavaScript",
        difficulty: "Intermediate",
        image: "https://source.unsplash.com/random/800x600/?coding"
    },
    {
        id: 2,
        name: "Data Science",
        description: "Master Python, R, and Statistics",
        difficulty: "Advanced",
        image: "https://source.unsplash.com/random/800x600/?data"
    },
    {
        id: 3,
        name: "Mobile Development",
        description: "Build iOS and Android apps",
        difficulty: "Intermediate",
        image: "https://source.unsplash.com/random/800x600/?mobile"
    },
    {
        id: 4,
        name: "Machine Learning",
        description: "Explore AI and Neural Networks",
        difficulty: "Advanced",
        image: "https://source.unsplash.com/random/800x600/?robot"
    },
    {
        id: 5,
        name: "Game Development",
        description: "Create 2D and 3D games",
        difficulty: "Beginner",
        image: "https://source.unsplash.com/random/800x600/?game"
    },
    {
        id: 6,
        name: "Cybersecurity",
        description: "Learn network and system security",
        difficulty: "Advanced",
        image: "https://source.unsplash.com/random/800x600/?security"
    }
];

// Dummy data for leaderboard
const dummyLeaderboard = [
    { rank: 1, player: "Alex", topic: "Web Development", score: 98, date: "2024-03-15" },
    { rank: 2, player: "Sarah", topic: "Data Science", score: 95, date: "2024-03-14" },
    { rank: 3, player: "John", topic: "Machine Learning", score: 92, date: "2024-03-13" },
    { rank: 4, player: "Emma", topic: "Cybersecurity", score: 90, date: "2024-03-12" },
    { rank: 5, player: "Michael", topic: "Mobile Development", score: 88, date: "2024-03-11" },
    { rank: 6, player: "Lisa", topic: "Game Development", score: 85, date: "2024-03-10" },
    { rank: 7, player: "David", topic: "Web Development", score: 82, date: "2024-03-09" },
    { rank: 8, player: "Anna", topic: "Data Science", score: 80, date: "2024-03-08" },
    { rank: 9, player: "James", topic: "Cybersecurity", score: 78, date: "2024-03-07" },
    { rank: 10, player: "Sophie", topic: "Machine Learning", score: 75, date: "2024-03-06" }
];

// Function to initialize Topics page
function initializeTopicsPage() {
    const topicsGrid = document.querySelector('.topics-grid');
    topicsGrid.innerHTML = dummyTopics.map(topic => `
        <div class="topic-card" data-topic-id="${topic.id}">
            <div class="topic-image" style="background-image: url('${topic.image}')"></div>
            <h3>${topic.name}</h3>
            <p>${topic.description}</p>
            <div class="topic-difficulty">${topic.difficulty}</div>
        </div>
    `).join('');

    // Add click event listeners to topic cards
    document.querySelectorAll('.topic-card').forEach(card => {
        card.addEventListener('click', () => {
            const topicId = card.getAttribute('data-topic-id');
            const topic = dummyTopics.find(t => t.id === parseInt(topicId));
            showTopicDetails(topic);
        });
    });
}

// Function to show topic details
function showTopicDetails(topic) {
    const topicDetails = document.querySelector('.topic-details');
    topicDetails.innerHTML = `
        <div class="topic-info">
            <h2>${topic.name}</h2>
            <p>${topic.description}</p>
            <div class="topic-difficulty">Difficulty: ${topic.difficulty}</div>
            <div class="topic-stats">
                <div class="stat">
                    <span class="stat-value">1.2k</span>
                    <span class="stat-label">Students</span>
                </div>
                <div class="stat">
                    <span class="stat-value">4.8</span>
                    <span class="stat-label">Rating</span>
                </div>
                <div class="stat">
                    <span class="stat-value">20h</span>
                    <span class="stat-label">Duration</span>
                </div>
            </div>
            <button class="start-learning-btn">Start Learning</button>
        </div>
    `;
    topicDetails.style.display = 'block';
}

// Function to initialize Leaderboard page
function initializeLeaderboardPage() {
    const leaderboardBody = document.querySelector('#leaderboardBody');
    leaderboardBody.innerHTML = dummyLeaderboard.map(entry => `
        <tr>
            <td>${entry.rank}</td>
            <td>${entry.player}</td>
            <td>${entry.topic}</td>
            <td>${entry.score}%</td>
            <td>${entry.date}</td>
        </tr>
    `).join('');

    // Add filter functionality
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const filter = btn.getAttribute('data-filter');
            filterLeaderboard(filter);
        });
    });
}

// Function to filter leaderboard
function filterLeaderboard(filter) {
    let filteredData = [...dummyLeaderboard];
    const today = new Date();
    
    switch(filter) {
        case 'week':
            const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            filteredData = dummyLeaderboard.filter(entry => new Date(entry.date) >= weekAgo);
            break;
        case 'month':
            const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
            filteredData = dummyLeaderboard.filter(entry => new Date(entry.date) >= monthAgo);
            break;
    }

    const leaderboardBody = document.querySelector('#leaderboardBody');
    leaderboardBody.innerHTML = filteredData.map(entry => `
        <tr>
            <td>${entry.rank}</td>
            <td>${entry.player}</td>
            <td>${entry.topic}</td>
            <td>${entry.score}%</td>
            <td>${entry.date}</td>
        </tr>
    `).join('');
}

// Initialize pages on load
initializeTopicsPage();
initializeLeaderboardPage();

// Function to initialize home page header
function initializeHomeHeader() {
    const header = document.querySelector('header');
    header.innerHTML = `
        <div class="header-content">
            <div class="header-text">
                <h1>5-Minute Expert Challenge</h1>
                <p>Learn a new topic in 5 minutes and test your knowledge!</p>
            </div>
            <div class="header-stats">
                <div class="stat-box">
                    <i class="fas fa-users"></i>
                    <span class="stat-number">10k+</span>
                    <span class="stat-label">Learners</span>
                </div>
                <div class="stat-box">
                    <i class="fas fa-book"></i>
                    <span class="stat-number">50+</span>
                    <span class="stat-label">Topics</span>
                </div>
                <div class="stat-box">
                    <i class="fas fa-trophy"></i>
                    <span class="stat-number">95%</span>
                    <span class="stat-label">Success Rate</span>
                </div>
            </div>
        </div>
    `;
}

// Initialize home page on load
initializeHomeHeader(); 