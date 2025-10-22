import { OpenAI } from 'openai';
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const generateInterviewQuestions = async (jdText) => {
    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                { role: 'system', content: 'You are an expert interview coach. Generate 3 challenging but fair technical interview questions based on the job description.' },
                { role: 'user', content: `Generate 3 interview questions based on this job description:\n\n${jdText}\n\nFormat: Return only 3 questions, numbered 1-3, one per line.` }
            ],
            temperature: 0.7,
            max_tokens: 500
        });
        const text = response.choices[0].message.content;
        const questions = text.split('\n').filter(q => q.trim()).slice(0, 3);
        return questions;
    } catch (error) {
        console.error('AI error:', error);
        throw new Error('Failed to generate questions');
    }
};

export const evaluateAnswer = async (question, answer, resumeChunks, jdChunks) => {
    try {
        const context = [...resumeChunks.map(c => `Resume: ${c.text}`), ...jdChunks.map(c => `JD: ${c.text}`)].join('\n\n');
        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                { role: 'system', content: 'You are an expert interviewer. Evaluate the candidate answer based on the question, resume, and job description. Provide a score (1-10) and concise feedback.' },
                { role: 'user', content: `Question: ${question}\n\nCandidate Answer: ${answer}\n\nContext:\n${context}\n\nProvide evaluation in format:\nScore: [1-10]\nFeedback: [max 100 words]` }
            ],
            temperature: 0.5,
            max_tokens: 300
        });
        const evalText = response.choices[0].message.content;
        const scoreMatch = evalText.match(/Score:\s*(\d+)/);
        const score = scoreMatch ? parseInt(scoreMatch[1]) : 5;
        const feedback = evalText.replace(/Score:\s*\d+\n?/i, '').trim();
        return { score, feedback };
    } catch (error) {
        console.error('Evaluation error:', error);
        throw new Error('Failed to evaluate answer');
    }
};