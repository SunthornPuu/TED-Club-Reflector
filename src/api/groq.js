const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';

const LEADER_CONTEXT = `Context: The user you are interviewing is a "Leader for Youth" (facilitator/coach) running a TED Club under TEDxBangkok Youth. 
Their role is to create a "Safe Space" and "Creative Space" for youth (aged 6-25) to practice deep listening and public speaking without the pressure of academic grading or fear of judgment. 
Key rules for their role: 
1. They act purely as a coach/guide, not a dictator of ideas. The ideas must come from the students' own passions.
2. The club must be entirely free and not tied to any academic scores or rewards. 
3. They use Design Thinking principles (Curiosity -> Collaboration -> Try) to stimulate engagement. 
Your goal as a reflection coach is to help this Leader reflect on how well they are facilitating this safe, creative space, how effectively they are guiding (rather than dictating) the students, and their personal growth as a facilitator.`;

/**
 * Generate the 3rd reflection question based on Q1 and Q2.
 * @param {string} q1Answer - Answer to "What activity have you hosted"
 * @param {string} q2Answer - Answer to "How was your activity"
 * @returns {Promise<{q_en: string, q_th: string}>}
 */
export async function generateQuestion3(q1Answer, q2Answer) {
  const systemPrompt = `You are a thoughtful reflection coach for a student club. ${LEADER_CONTEXT}

Based on the student's answers about their club activity, generate exactly 1 follow-up question that encourages deeper reflection on their leadership and hosting experience.

The student's club activity context:
- Q1 (What activity they hosted): Will be provided
- Q2 (How the activity went): Will be provided

You MUST return your response as a valid JSON object with exactly these 2 keys:
- "q_en": The question in English
- "q_th": The question translated accurately into Thai

Make the question specific to what the student described. The Thai translation must be natural.

Return ONLY the JSON object, no other text.`;

  const userMessage = `Here are my answers about my club activity:

Q1: What activity have you hosted?
A1: ${q1Answer}

Q2: How was your activity?
A2: ${q2Answer}

Please generate 1 follow-up reflection question with Thai translation.`;

  const response = await fetch(GROQ_ENDPOINT, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.7,
      max_tokens: 512,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Groq API error: ${error.error?.message || response.status}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;
  
  try {
    const parsed = JSON.parse(content);
    if (!parsed.q_en || !parsed.q_th) throw new Error('Missing required fields');
    return parsed;
  } catch (e) {
    throw new Error(`Failed to parse Groq response: ${e.message}`);
  }
}

/**
 * Generate the 4th reflection question based on Q1, Q2, and Q3.
 * @param {string} q1Answer 
 * @param {string} q2Answer 
 * @param {string} q3Question 
 * @param {string} q3Answer 
 * @returns {Promise<{q_en: string, q_th: string}>}
 */
export async function generateQuestion4(q1Answer, q2Answer, q3Question, q3Answer) {
  const systemPrompt = `You are a thoughtful reflection coach for a student club. ${LEADER_CONTEXT}

Based on the student's previous answers, generate exactly 1 final follow-up question that challenges them to think about future applications or core leadership takeaways as a Club Host.

The student's club activity context:
- Q1 (Activity hosted): Will be provided
- Q2 (How it went): Will be provided
- Q3 (Previous follow-up): Will be provided
- A3 (Their answer): Will be provided

You MUST return your response as a valid JSON object with exactly these 2 keys:
- "q_en": The final question in English
- "q_th": The final question translated accurately into Thai

Make it specific and distinct from Q3. Return ONLY the JSON object, no other text.`;

  const userMessage = `Here is our conversation so far:

Q1: What activity have you hosted?
A1: ${q1Answer}

Q2: How was your activity?
A2: ${q2Answer}

Q3: ${q3Question}
A3: ${q3Answer}

Please generate 1 final reflection question with Thai translation.`;

  const response = await fetch(GROQ_ENDPOINT, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.7,
      max_tokens: 512,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Groq API error: ${error.error?.message || response.status}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;
  
  try {
    const parsed = JSON.parse(content);
    if (!parsed.q_en || !parsed.q_th) throw new Error('Missing required fields');
    return parsed;
  } catch (e) {
    throw new Error(`Failed to parse Groq response: ${e.message}`);
  }
}

/**
 * Summarize the entire reflection into a single Thai paragraph.
 * @param {Array<{question: string, answer: string}>} transcript 
 * @returns {Promise<string>}
 */
export async function generateActivitySummary(transcript) {
  const systemPrompt = `You are an assistant that summarizes student club reflections. ${LEADER_CONTEXT}
You will be provided with a transcript of a 4-question reflection.
Your task is to write a single, cohesive, professional summary paragraph in Thai. 
The summary should highlight their specific actions as a leader, what they learned, and how they managed the activity.
Do NOT use bullet points. Do NOT include greetings or closing remarks.
Just output the summary paragraph directly.`;

  const formattedTranscript = transcript.map(t => `Q: ${t.question}\nA: ${t.answer}`).join('\n\n');
  
  const userMessage = `Please summarize the following reflection into a single Thai paragraph:\n\n${formattedTranscript}`;

  const response = await fetch(GROQ_ENDPOINT, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.5,
      max_tokens: 1024,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Groq Summary API error: ${error.error?.message || response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
}
