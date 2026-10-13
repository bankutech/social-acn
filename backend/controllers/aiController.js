const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini AI (as fallback since Claude API isn't available in the environment)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'fallback_key');
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

exports.askQuestion = async (req, res) => {
    try {
        const { question } = req.body;
        
        if (!question) {
            return res.status(400).json({ message: 'Question is required' });
        }

        const prompt = `As a helpful study assistant, please answer this question clearly and concisely: ${question}`;
        
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        res.json({ answer: text });
    } catch (error) {
        console.error('AI Error:', error);
        res.status(500).json({ message: 'Failed to get AI response' });
    }
};

exports.summarizeNotes = async (req, res) => {
    try {
        const { notes } = req.body;
        
        if (!notes) {
            return res.status(400).json({ message: 'Notes are required' });
        }

        const prompt = `Please summarize these study notes in a clear, organized way with key points: ${notes}`;
        
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const summary = response.text();

        res.json({ summary });
    } catch (error) {
        console.error('AI Error:', error);
        res.status(500).json({ message: 'Failed to summarize notes' });
    }
};

exports.generateMCQs = async (req, res) => {
    try {
        const { topic, count = 5 } = req.body;
        
        if (!topic) {
            return res.status(400).json({ message: 'Topic is required' });
        }

        const prompt = `Generate ${count} multiple choice questions about ${topic}. Format each question with:
1. The question
2. Four options (A, B, C, D)
3. The correct answer
Make them educational and clear.`;
        
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const mcqs = response.text();

        res.json({ mcqs });
    } catch (error) {
        console.error('AI Error:', error);
        res.status(500).json({ message: 'Failed to generate MCQs' });
    }
};

exports.generateCaption = async (req, res) => {
    try {
        const { content, type = 'post' } = req.body;
        
        if (!content) {
            return res.status(400).json({ message: 'Content is required' });
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
        const response = await result.response;
        const caption = response.text();

        res.json({ caption });
    } catch (error) {
        console.error('AI Error:', error);
        res.status(500).json({ message: 'Failed to generate caption' });
    }
};
