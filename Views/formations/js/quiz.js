/* ════════════ QUIZ JS ════════════ */

/* ══════════════════════════════════════════════════════
   QUIZ DATA
══════════════════════════════════════════════════════ */
const quizzes = {
    'developpement-web': [
        {
            title: 'HTML5 Fundamentals',
            description: 'Test your knowledge of HTML5 tags and structure',
            questions: [
                {
                    question: 'Which HTML tag is used to create a hyperlink?',
                    options: ['<a>', '<link>', '<href>', '<url>'],
                    answer: 0,
                    explanation: 'The <a> (anchor) tag is used to create hyperlinks in HTML.'
                },
                {
                    question: 'Which tag defines the main heading (most important) on a page?',
                    options: ['<title>', '<header>', '<h1>', '<head>'],
                    answer: 2,
                    explanation: '<h1> defines the most important heading. <title> sets the browser tab title.'
                },
                {
                    question: 'Which tag is used to display an image?',
                    options: ['<picture>', '<img>', '<image>', '<src>'],
                    answer: 1,
                    explanation: 'The <img> tag is the correct HTML tag for embedding images.'
                },
                {
                    question: 'What attribute is required on <img> for accessibility?',
                    options: ['src', 'alt', 'title', 'id'],
                    answer: 1,
                    explanation: 'The "alt" attribute provides alternative text for screen readers and when the image fails to load.'
                },
                {
                    question: 'Which HTML5 element is used to define navigation links?',
                    options: ['<menu>', '<section>', '<nav>', '<aside>'],
                    answer: 2,
                    explanation: 'The <nav> element is specifically designed to hold navigation links.'
                }
            ]
        },
        {
            title: 'CSS Styling',
            description: 'Test your CSS properties, selectors and layout knowledge',
            questions: [
                {
                    question: 'Which CSS property changes the text color?',
                    options: ['font-color', 'text-color', 'color', 'background-color'],
                    answer: 2,
                    explanation: 'The "color" property sets the foreground (text) color of an element.'
                },
                {
                    question: 'Which CSS unit is relative to the root element\'s font size?',
                    options: ['em', 'px', 'rem', '%'],
                    answer: 2,
                    explanation: '"rem" (root em) is relative to the <html> element\'s font size. "em" is relative to the parent.'
                },
                {
                    question: 'Which CSS property controls the space INSIDE an element\'s border?',
                    options: ['margin', 'padding', 'border-spacing', 'gap'],
                    answer: 1,
                    explanation: '"padding" controls the space inside the border. "margin" controls the space outside.'
                },
                {
                    question: 'Which value of "display" enables Flexbox layout?',
                    options: ['block', 'inline-block', 'grid', 'flex'],
                    answer: 3,
                    explanation: 'Setting "display: flex" on a container enables Flexbox for its children.'
                },
                {
                    question: 'Which CSS pseudo-class applies styles when hovering over an element?',
                    options: [':focus', ':active', ':hover', ':visited'],
                    answer: 2,
                    explanation: 'The ":hover" pseudo-class applies styles when the mouse cursor is over the element.'
                }
            ]
        },
        {
            title: 'JavaScript Basics',
            description: 'Test your JavaScript fundamentals and ES6+ knowledge',
            questions: [
                {
                    question: 'Which keyword declares a block-scoped variable in modern JavaScript?',
                    options: ['var', 'let', 'def', 'int'],
                    answer: 1,
                    explanation: '"let" declares a block-scoped variable. "var" is function-scoped and should be avoided in modern code.'
                },
                {
                    question: 'What does "===" check in JavaScript?',
                    options: ['Value only', 'Type only', 'Value AND type', 'Neither'],
                    answer: 2,
                    explanation: '"===" (strict equality) checks both value AND type. "==" only checks value after type coercion.'
                },
                {
                    question: 'Which method adds an element to the END of an array?',
                    options: ['unshift()', 'push()', 'append()', 'add()'],
                    answer: 1,
                    explanation: '"push()" adds one or more elements to the end of an array and returns the new length.'
                },
                {
                    question: 'What does "DOM" stand for?',
                    options: ['Document Object Model', 'Data Object Map', 'Design Output Method', 'Dynamic Object Module'],
                    answer: 0,
                    explanation: 'DOM stands for Document Object Model — a tree representation of the HTML page in memory.'
                },
                {
                    question: 'Which of these is the correct way to write an arrow function?',
                    options: ['function => (x) { return x; }', 'const f = (x) => x;', 'const f = function(x) => x;', 'arrow f(x) { return x; }'],
                    answer: 1,
                    explanation: 'Arrow functions are written as: const f = (params) => expression; or (params) => { block; }'
                }
            ]
        }
    ],
    'design': [
        {
            title: 'UI/UX Design Principles',
            description: 'Test your interface design and user experience knowledge',
            questions: [
                {
                    question: 'What does "UX" stand for?',
                    options: ['User Exploration', 'User Experience', 'Unified Exchange', 'User Interface'],
                    answer: 1,
                    explanation: 'UX stands for User Experience — it focuses on the overall feel and usability of a product.'
                },
                {
                    question: 'What is the purpose of a wireframe?',
                    options: ['Final visual design with colors', 'A low-fidelity layout blueprint', 'A working prototype', 'A brand style guide'],
                    answer: 1,
                    explanation: 'A wireframe is a low-fidelity sketch that shows the layout and structure of a page without styling.'
                },
                {
                    question: 'Which design tool is most commonly used for UI prototyping in 2024?',
                    options: ['MS Paint', 'Figma', 'Notepad', 'Excel'],
                    answer: 1,
                    explanation: 'Figma is the industry-standard collaborative UI/UX design tool.'
                },
                {
                    question: 'What does "white space" in design refer to?',
                    options: ['Using a white background', 'Empty space between elements', 'White-colored text', 'A blank page'],
                    answer: 1,
                    explanation: 'White space (negative space) is the empty area between design elements — it improves readability and focus.'
                },
                {
                    question: 'What is "visual hierarchy" in UI design?',
                    options: ['Making everything the same size', 'Arranging elements by importance', 'Using many colors', 'Hiding secondary content'],
                    answer: 1,
                    explanation: 'Visual hierarchy guides the user\'s eye by making important elements larger, bolder, or more prominent.'
                }
            ]
        }
    ],
    'marketing': [
        {
            title: 'Digital Marketing',
            description: 'Test your digital marketing and SEO knowledge',
            questions: [
                {
                    question: 'What does SEO stand for?',
                    options: ['Social Email Optimization', 'Search Engine Optimization', 'Site Enhancement Option', 'Search Event Operation'],
                    answer: 1,
                    explanation: 'SEO stands for Search Engine Optimization — improving a website\'s visibility in organic search results.'
                },
                {
                    question: 'What does "CTR" mean in digital marketing?',
                    options: ['Click-Through Rate', 'Content Transfer Ratio', 'Customer Total Revenue', 'Cost Transfer Rate'],
                    answer: 0,
                    explanation: 'CTR (Click-Through Rate) = (Clicks / Impressions) × 100. It measures how often people click your ad or link.'
                },
                {
                    question: 'Which metric measures the percentage of visitors who complete a desired action?',
                    options: ['Bounce Rate', 'Conversion Rate', 'Impression Rate', 'Engagement Rate'],
                    answer: 1,
                    explanation: 'Conversion Rate = (Conversions / Total Visitors) × 100. It measures successful actions like purchases or sign-ups.'
                },
                {
                    question: 'What is "A/B testing" in marketing?',
                    options: ['Testing two different audiences', 'Comparing two versions of content to see which performs better', 'Running ads on two platforms', 'Testing a budget of $A vs $B'],
                    answer: 1,
                    explanation: 'A/B testing shows version A to one group and version B to another, then compares the results to pick the winner.'
                },
                {
                    question: 'What does KPI stand for?',
                    options: ['Known Product Index', 'Key Performance Indicator', 'Keyword Priority Index', 'Key Page Interaction'],
                    answer: 1,
                    explanation: 'KPI (Key Performance Indicator) is a measurable value that shows how effectively a company is achieving its goals.'
                }
            ]
        }
    ],
    'gestion-projet': [
        {
            title: 'Agile & Scrum',
            description: 'Test your agile methodology and project management knowledge',
            questions: [
                {
                    question: 'What is a "Sprint" in Scrum?',
                    options: ['A final delivery phase', 'A time-boxed iteration (usually 1–4 weeks)', 'A bug-fixing session', 'A type of meeting'],
                    answer: 1,
                    explanation: 'A Sprint is a time-boxed period (typically 2 weeks) during which the team creates a potentially shippable product increment.'
                },
                {
                    question: 'Who is responsible for managing the Product Backlog in Scrum?',
                    options: ['Scrum Master', 'Development Team', 'Product Owner', 'Project Manager'],
                    answer: 2,
                    explanation: 'The Product Owner owns and prioritizes the Product Backlog, ensuring the team works on the highest-value items.'
                },
                {
                    question: 'Which Scrum event is a daily 15-minute synchronization meeting?',
                    options: ['Sprint Planning', 'Sprint Review', 'Daily Scrum (Stand-up)', 'Sprint Retrospective'],
                    answer: 2,
                    explanation: 'The Daily Scrum (or Daily Stand-up) is a 15-minute event for the team to synchronize activities and plan for the next 24 hours.'
                },
                {
                    question: 'What is the purpose of a Sprint Retrospective?',
                    options: ['Plan the next sprint backlog', 'Review the product with stakeholders', 'Inspect the team\'s process and improve it', 'Estimate story points'],
                    answer: 2,
                    explanation: 'The Sprint Retrospective is held after each sprint to reflect on the process, identify improvements and create an action plan.'
                },
                {
                    question: 'What does "Definition of Done" (DoD) mean in Scrum?',
                    options: ['The sprint end date', 'A shared checklist of criteria a work item must meet to be considered complete', 'The final project delivery', 'A list of rejected features'],
                    answer: 1,
                    explanation: 'The Definition of Done is an agreed-upon checklist of quality criteria that must be met before a backlog item is considered done.'
                }
            ]
        }
    ],
    'bureautique': [
        {
            title: 'Excel & Office Tools',
            description: 'Test your spreadsheet and office productivity knowledge',
            questions: [
                {
                    question: 'Which Excel function calculates the total of a range of cells?',
                    options: ['AVERAGE()', 'COUNT()', 'SUM()', 'TOTAL()'],
                    answer: 2,
                    explanation: 'SUM() adds up all numeric values in a specified range. e.g., =SUM(A1:A10)'
                },
                {
                    question: 'How do you start a formula in Excel?',
                    options: ['With a #', 'With a =', 'With a +', 'With a @'],
                    answer: 1,
                    explanation: 'All Excel formulas must start with the "=" (equals) sign, e.g., =A1+B1 or =SUM(A1:A5).'
                },
                {
                    question: 'Which function returns the highest value in a range?',
                    options: ['HIGH()', 'TOP()', 'MAX()', 'LARGE()'],
                    answer: 2,
                    explanation: 'MAX() returns the largest numeric value in a range. e.g., =MAX(A1:A20)'
                },
                {
                    question: 'What is a "pivot table" used for?',
                    options: ['Creating charts only', 'Summarizing and analysing large datasets quickly', 'Printing reports', 'Password protection'],
                    answer: 1,
                    explanation: 'Pivot tables allow you to quickly summarize, group, sort and analyze large datasets without writing formulas.'
                },
                {
                    question: 'Which keyboard shortcut saves a file in most Office applications?',
                    options: ['Ctrl + P', 'Ctrl + Z', 'Ctrl + S', 'Ctrl + X'],
                    answer: 2,
                    explanation: 'Ctrl + S saves the current file. Ctrl + P prints, Ctrl + Z undoes the last action, Ctrl + X cuts.'
                }
            ]
        }
    ]
};

/* ══════════════════════════════════════════════════════
   STATE
══════════════════════════════════════════════════════ */
let currentCategory = '';
let currentQuiz     = null;
let userAnswers     = [];

/* ══════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════ */
function show(id) { document.getElementById(id).style.display = 'block'; }
function hide(id) { document.getElementById(id).style.display = 'none'; }

function getCategoryName(cat) {
    const map = {
        'developpement-web': 'Web Development',
        'design':            'Design',
        'marketing':         'Marketing',
        'gestion-projet':    'Project Management',
        'bureautique':       'Office Tools'
    };
    return map[cat] || cat;
}

/* ══════════════════════════════════════════════════════
   NAVIGATION
══════════════════════════════════════════════════════ */
function init() {
    const cat = new URLSearchParams(window.location.search).get('category');
    if (cat && cat !== 'tous' && quizzes[cat]) {
        selectCategory(cat);
    } else {
        document.getElementById('view-categories').style.display = 'block';
        document.getElementById('view-quizlist').style.display = 'none';
        document.getElementById('view-taking').style.display = 'none';
        document.getElementById('view-results').style.display = 'none';
    }
}

function selectCategory(cat) {
    currentCategory = cat;
    hide('view-categories');
    const titleEl = document.getElementById('quizlist-title');
    titleEl.textContent = '📝 ' + getCategoryName(cat) + ' — Quizzes';
    renderQuizList(cat);
    show('view-quizlist');
}

function renderQuizList(cat) {
    const list = document.getElementById('quiz-list');
    list.innerHTML = '';
    (quizzes[cat] || []).forEach((q, i) => {
        const card = document.createElement('div');
        card.className = 'quiz-card';
        card.onclick = () => startQuiz(i);
        card.innerHTML = `
            <div class="quiz-card-info">
                <div class="quiz-card-title">${q.title}</div>
                <div class="quiz-card-desc">${q.description}</div>
            </div>
            <div class="quiz-card-meta">
                <span class="q-count">📝 ${q.questions.length} questions</span>
            </div>`;
        list.appendChild(card);
    });
}

function backToCategories() {
    hide('view-quizlist');
    show('view-categories');
}

function backToQuizzes() {
    hide('view-results');
    document.getElementById('certificate-card').classList.remove('active');
    renderQuizList(currentCategory);
    show('view-quizlist');
}

/* ══════════════════════════════════════════════════════
   START QUIZ
══════════════════════════════════════════════════════ */
function startQuiz(idx) {
    currentQuiz = quizzes[currentCategory][idx];
    userAnswers = new Array(currentQuiz.questions.length).fill(-1);
    hide('view-quizlist');
    document.getElementById('taking-title').textContent = '📝 ' + currentQuiz.title;
    hide('warning-unanswered');
    renderQuestions();
    updateProgress();
    show('view-taking');
}

function retryQuiz() {
    userAnswers = new Array(currentQuiz.questions.length).fill(-1);
    hide('view-results');
    document.getElementById('certificate-card').classList.remove('active');
    hide('warning-unanswered');
    renderQuestions();
    updateProgress();
    show('view-taking');
}

/* ══════════════════════════════════════════════════════
   HTML ESCAPE  (fixes options like <a>, <img>, etc.)
══════════════════════════════════════════════════════ */
function esc(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/* ══════════════════════════════════════════════════════
   RENDER QUESTIONS
══════════════════════════════════════════════════════ */
function renderQuestions() {
    const container = document.getElementById('questions-container');
    container.innerHTML = '';

    currentQuiz.questions.forEach((q, qi) => {
        const block = document.createElement('div');
        block.className = 'question-block';
        block.id = `qblock-${qi}`;

        const optsHtml = q.options.map((opt, oi) => `
            <label class="option-label" id="opt-${qi}-${oi}" onclick="selectAnswer(${qi},${oi})">
                <input type="radio" name="q${qi}" value="${oi}" style="pointer-events:none;">
                <span>${esc(opt)}</span>
            </label>`).join('');

        block.innerHTML = `
            <h3>${qi + 1}. ${esc(q.question)}</h3>
            <div class="options" id="opts-${qi}">${optsHtml}</div>`;
        container.appendChild(block);
    });
}

/* ══════════════════════════════════════════════════════
   SELECT ANSWER
══════════════════════════════════════════════════════ */
function selectAnswer(qi, oi) {
    userAnswers[qi] = oi;
    const radios = document.querySelectorAll(`input[name="q${qi}"]`);
    radios.forEach((r, i) => r.checked = (i === oi));
    const opts = document.querySelectorAll(`#opts-${qi} .option-label`);
    opts.forEach((lbl, i) => {
        lbl.classList.toggle('selected', i === oi);
    });
    updateProgress();
    hide('warning-unanswered');
}

function updateProgress() {
    const total    = currentQuiz.questions.length;
    const answered = userAnswers.filter(a => a !== -1).length;
    const pct      = Math.round((answered / total) * 100);
    document.getElementById('progress-fill').style.width = pct + '%';
    document.getElementById('q-counter').textContent = `${answered} / ${total} answered`;
}

/* ══════════════════════════════════════════════════════
   SUBMIT & SCORE
══════════════════════════════════════════════════════ */
function submitQuiz() {
    const unanswered = userAnswers.filter(a => a === -1).length;
    if (unanswered > 0) {
        const w = document.getElementById('warning-unanswered');
        w.style.display = 'block';
        w.textContent = `⚠️ You have ${unanswered} unanswered question${unanswered > 1 ? 's' : ''}. Please answer all questions before submitting.`;
        w.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }

    const total   = currentQuiz.questions.length;
    let correct   = 0;
    let wrong     = 0;
    let skipped   = 0;

    userAnswers.forEach((sel, i) => {
        if (sel === -1) skipped++;
        else if (sel === currentQuiz.questions[i].answer) correct++;
        else wrong++;
    });

    const pct = Math.round((correct / total) * 100);

    const circle = document.getElementById('score-circle');
    const pass   = pct >= 60;
    circle.className = 'score-circle ' + (pass ? 'pass' : 'fail');
    document.getElementById('score-pct').textContent = pct + '%';
    document.getElementById('score-pct').style.color  = pass ? '#00a852' : '#dc3545';
    document.getElementById('score-raw').textContent  = `${correct} / ${total} correct`;

    const badge = document.getElementById('feedback-badge');
    const text  = document.getElementById('feedback-text');
    if (pct >= 80) {
        badge.textContent = '🌟 Excellent!';
        badge.className   = 'feedback-badge badge-excellent';
        text.textContent  = 'Outstanding performance! You have a strong grasp of this topic.';
    } else if (pct >= 60) {
        badge.textContent = '👍 Good Job!';
        badge.className   = 'feedback-badge badge-good';
        text.textContent  = 'Nice work! Review the incorrect answers to improve further.';
    } else {
        badge.textContent = '💡 Keep Practicing';
        badge.className   = 'feedback-badge badge-retry';
        text.textContent  = 'Don\'t give up — study the corrections below and try again!';
    }

    document.getElementById('rs-correct').textContent = correct;
    document.getElementById('rs-wrong').textContent   = wrong;
    document.getElementById('rs-skip').textContent    = skipped;

    document.getElementById('cert-btn').style.display = 'inline-block';
    const bottomCertBtn = document.getElementById('cert-btn-bottom');
    if (bottomCertBtn) bottomCertBtn.style.display = 'inline-block';

    buildCorrections();

    hide('view-taking');
    show('view-results');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ══════════════════════════════════════════════════════
   CORRECTIONS
══════════════════════════════════════════════════════ */
function buildCorrections() {
    const container = document.getElementById('corrections-container');
    container.innerHTML = '';

    currentQuiz.questions.forEach((q, qi) => {
        const selected   = userAnswers[qi];
        const correctIdx = q.answer;
        const isCorrect  = selected === correctIdx;
        const isSkipped  = selected === -1;

        const block = document.createElement('div');
        block.className = 'question-block show-correction ' +
            (isSkipped ? '' : isCorrect ? 'answered-correct' : 'answered-wrong');

        const optsHtml = q.options.map((opt, oi) => {
            let cls = '';
            if (oi === correctIdx)                cls = 'correct-answer';
            else if (oi === selected && !isCorrect) cls = 'wrong-answer';
            const checked = (oi === selected) ? 'checked' : '';
            return `<label class="option-label ${cls}">
                        <input type="radio" ${checked} disabled>
                        <span>${esc(opt)}</span>
                    </label>`;
        }).join('');

        const icon = isSkipped ? '⬜ Skipped' : isCorrect ? '✅ Correct' : '❌ Incorrect';

        block.innerHTML = `
            <h3><span style="margin-right:8px;">${icon}</span>${qi + 1}. ${esc(q.question)}</h3>
            <div class="options">${optsHtml}</div>
            <div class="correction-note">
                💡 <strong>Explanation:</strong> ${esc(q.explanation)}
            </div>`;
        container.appendChild(block);
    });
}

/* ══════════════════════════════════════════════════════
   CERTIFICATE
══════════════════════════════════════════════════════ */
function showCertificate() {
    const scoreText = document.getElementById('score-pct').textContent;
    const score     = parseInt(scoreText, 10) || 0;
    const raw       = document.getElementById('score-raw').textContent;
    const fullName  = prompt('Entrez votre nom et prénom pour le certificat :', localStorage.getItem('quizLearnerName') || '');

    if (!fullName || !fullName.trim()) {
        alert('Le nom et prénom sont obligatoires pour générer le certificat.');
        return;
    }

    localStorage.setItem('quizLearnerName', fullName.trim());
    sessionStorage.setItem('certificateData', JSON.stringify({
        fullName: fullName.trim(),
        category: getCategoryName(currentCategory),
        quizTitle: currentQuiz ? currentQuiz.title : '',
        score: score,
        scoreText: scoreText,
        rawScore: raw,
        level: getCertificateLevel(score),
        badge: getCertificateBadge(score),
        date: new Date().toISOString()
    }));

    window.location.href = 'certificat.html';
}

function getCertificateLevel(score) {
    if (score >= 80) return 'Expert';
    if (score >= 50) return 'Intermédiaire';
    return 'Débutant';
}

function getCertificateBadge(score) {
    if (score >= 80) {
        return {
            icon: '🥇',
            title: 'Gold Badge',
            desc: 'Excellent ! Maîtrise parfaite du cours.',
            stars: '⭐⭐⭐',
            cls: 'badge-gold'
        };
    }
    if (score >= 50) {
        return {
            icon: '🥈',
            title: 'Silver Badge',
            desc: 'Bien joué ! Continue à progresser.',
            stars: '⭐⭐',
            cls: 'badge-silver'
        };
    }
    return {
        icon: '🥉',
        title: 'Bronze Badge',
        desc: 'Bon début ! Révise et réessaie.',
        stars: '⭐',
        cls: 'badge-bronze'
    };
}

function printCertificate() {
    const content = document.getElementById('certificate-card').innerHTML;
    const win = window.open('', '_blank', 'width=900,height=700');
    win.document.write(`<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8">
<title>Certificate - ${currentQuiz.title}</title>
<style>
  body { font-family: 'Segoe UI', sans-serif; padding: 40px; background: #f5f5f5; }
  .certificate-card {
    border: 8px solid #00a852; border-radius: 20px; padding: 40px;
    background: white; box-shadow: 0 10px 30px rgba(0,0,0,.1); text-align: center;
  }
  .cert-badge { font-size: 54px; }
  .cert-header { font-size: 30px; font-weight: 800; color: #00a852; margin: 12px 0 6px; }
  .cert-sub { font-size: 15px; color: #888; margin-bottom: 20px; }
  .cert-body { font-size: 16px; line-height: 2; color: #444; }
  .cert-score { font-size: 28px; font-weight: 800; color: #00a852; margin: 16px 0; }
  .btn-print { display: none; }
</style></head><body><div class="certificate-card">${content}</div></body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 400);
}

window.onload = init;
