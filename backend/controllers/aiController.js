const { GoogleGenerativeAI } = require('@google/generative-ai');

const getModel = () => {
    const key = process.env.GEMINI_API_KEY;
    if (!key || key === 'your_gemini_api_key' || key === 'fallback_key') {
        return null;
    }
    const genAI = new GoogleGenerativeAI(key);
    return genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
};

exports.askQuestion = async (req, res) => {
    try {
        const { question } = req.body;
        if (!question) {
            return res.status(400).json({ message: 'Question is required' });
        }

        const model = getModel();
        if (!model) {
            return res.json({ 
                answer: `Study Assistant: Here is a quick breakdown for your question: "${question}". Remember to break difficult concepts into core principles, practice active recall, and discuss tricky points with study partners!` 
            });
        }

        const prompt = `As a helpful study assistant for students, please answer this question clearly, accurately, and concisely: ${question}`;
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        res.json({ answer: text });
    } catch (error) {
        console.error('AI Error:', error.message);
        res.json({ 
            answer: `Study Assistant: Key concept for "${req.body.question}": Focus on the fundamentals, review relevant lecture slides, and work through example problems step-by-step.` 
        });
    }
};

exports.summarizeNotes = async (req, res) => {
    try {
        const { notes } = req.body;
        if (!notes) {
            return res.status(400).json({ message: 'Notes are required' });
        }

        const model = getModel();
        if (!model) {
            const lines = notes.split('\n').filter(Boolean);
            const bullets = lines.slice(0, 4).map(l => `• ${l.trim()}`).join('\n');
            return res.json({ 
                summary: `### Quick Summary\n${bullets || '• Key concepts captured from notes.'}\n\n**Takeaway:** Review these bullet points before tackling practice problems.` 
            });
        }

        const prompt = `Please summarize these study notes in a clear, organized way with key bullet points and conclusions: ${notes}`;
        const result = await model.generateContent(prompt);
        res.json({ summary: result.response.text() });
    } catch (error) {
        console.error('AI Error:', error.message);
        res.status(500).json({ message: 'Failed to summarize notes' });
    }
};

exports.generateMCQs = async (req, res) => {
    try {
        const { topic, count = 5 } = req.body;
        if (!topic) {
            return res.status(400).json({ message: 'Topic is required' });
        }

        const model = getModel();
        if (!model) {
            return res.json({
                mcqs: `1. What is the fundamental concept behind ${topic}?\n   A) Concept Alpha\n   B) Concept Beta\n   C) Concept Gamma\n   D) All of the above\n   Answer: D\n\n2. Why is studying ${topic} important in modern coursework?\n   A) Foundation for advanced topics\n   B) Practical real-world applications\n   C) Core academic prerequisite\n   D) All of the above\n   Answer: D`
            });
        }

        const prompt = `Generate ${count} multiple choice questions about ${topic}. Format each question with:
1. The question
2. Four options (A, B, C, D)
3. The correct answer
Make them educational and clear.`;
        const result = await model.generateContent(prompt);
        res.json({ mcqs: result.response.text() });
    } catch (error) {
        console.error('AI Error:', error.message);
        res.status(500).json({ message: 'Failed to generate MCQs' });
    }
};

exports.generateCaption = async (req, res) => {
    try {
        const { content, type = 'post' } = req.body;
        if (!content) {
            return res.status(400).json({ message: 'Content is required' });
        }

        const model = getModel();
        if (!model) {
            return res.json({ 
                caption: `Sharing my latest work on ${content.slice(0, 50)}... 📚💡 Let's collaborate and learn together! #StudyGroup #ACNPlus #StudentLife` 
            });
        }

        let prompt;
        if (type === 'reel') {
            prompt = `Generate an engaging caption and hashtags for a 60-second educational reel about: ${content}. Include relevant hashtags.`;
        } else if (type === 'story') {
            prompt = `Generate a brief, engaging caption for a story about: ${content}. Keep it short and impactful.`;
        } else {
            prompt = `Generate an engaging social media caption for a post about: ${content}. Make it educational and engaging.`;
        }
        
        const result = await model.generateContent(prompt);
        res.json({ caption: result.response.text() });
    } catch (error) {
        console.error('AI Error:', error.message);
        res.status(500).json({ message: 'Failed to generate caption' });
    }
};
