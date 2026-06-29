import { useState, useCallback } from 'react';
import { requestAccessToken } from './api/auth';
import { authenticateUser, appendReflection, updateMasterSheetCount } from './api/sheets';
import { generateQuestion3, generateQuestion4, generateActivitySummary } from './api/groq';

import LoginScreen from './components/LoginScreen';
import QuestionCard from './components/QuestionCard';
import PhotoUpload from './components/PhotoUpload';

/*
 * Step machine (One by one flow):
 *   0 = login
 *   1 = Q1 (Static)
 *   2 = Q2 (Static)
 *   3 = Q3 (AI generated from Q1,Q2)
 *   4 = Q4 (AI generated from Q1,Q2,Q3)
 *   5 = photo link upload
 *   6 = thank you
 */

export default function App() {
  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // User data
  const [user, setUser] = useState(null); 

  // Answers
  const [q1Answer, setQ1Answer] = useState('');
  const [q2Answer, setQ2Answer] = useState('');
  const [q3Answer, setQ3Answer] = useState('');
  const [q4Answer, setQ4Answer] = useState('');

  // AI Generated Questions
  const [q3Question, setQ3Question] = useState(null); // { q_en, q_th }
  const [q4Question, setQ4Question] = useState(null); // { q_en, q_th }

  // === Handlers ===
  const handleLogin = useCallback(async (username, buddyName) => {
    setIsLoading(true);
    setError('');
    try {
      const token = await requestAccessToken();
      const result = await authenticateUser(username, buddyName, token);
      if (result) {
        setUser(result);
        setStep(1); // Proceed to Q1
      } else {
        setError('Username or Buddy Name is incorrect. Please try again.');
      }
    } catch (err) {
      setError(`Connection error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleQ1Submit = () => {
    setStep(2); // Proceed to Q2
  };

  const handleQ2Submit = async () => {
    // Generate Q3 based on Q1 and Q2
    setIsLoading(true);
    setError('');
    try {
      const q3 = await generateQuestion3(q1Answer, q2Answer);
      setQ3Question(q3);
      setStep(3); // Proceed to Q3
    } catch (err) {
      setError(`Generation failed: ${err.message}. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQ3Submit = async () => {
    // Generate Q4 based on Q1, Q2, and Q3
    setIsLoading(true);
    setError('');
    try {
      const q4 = await generateQuestion4(q1Answer, q2Answer, q3Question.q_en, q3Answer);
      setQ4Question(q4);
      setStep(4); // Proceed to Q4
    } catch (err) {
      setError(`Generation failed: ${err.message}. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQ4Submit = () => {
    setStep(5); // Proceed to Photo upload
  };

  const handleFinalSubmit = async (photoLink) => {
    setIsLoading(true);
    setError('');

    try {
      const token = await requestAccessToken();
      const nextCount = user.reflectionCount + 1;

      // 1. Construct transcript
      const transcript = [
        { question: 'What activity have you hosted?', answer: q1Answer },
        { question: 'How was your activity?', answer: q2Answer },
        { question: q3Question.q_en, answer: q3Answer },
        { question: q4Question.q_en, answer: q4Answer },
      ];

      // 2. Generate summary
      const aiSummary = await generateActivitySummary(transcript);

      // 3. Append to user tab
      const rowData = [
        nextCount,
        q1Answer,
        aiSummary,
        photoLink || ''
      ];
      await appendReflection(user.sheetId, token, rowData);

      // 4. Update count in Master Sheet
      await updateMasterSheetCount(user.rowIndex, nextCount, token);

      setStep(6); // Thank You
    } catch (err) {
      setError(`Submission failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // === Render ===
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-4 py-8 bg-gray-50">
      <div className="w-full max-w-2xl">
        
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold tracking-tight text-ted-black">
            TED <span className="text-ted-red">Club</span>
          </h1>
          <p className="text-gray-500 font-medium tracking-widest uppercase text-xs mt-2">Reflect</p>
        </div>

        {/* Error */}
        {error && step !== 0 && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-center animate-fade-in">
            <p className="text-red-600 text-sm">{error}</p>
            <button onClick={() => setError('')} className="text-red-500 text-xs mt-2 underline">
              Dismiss
            </button>
          </div>
        )}

        {/* Steps */}
        {step === 0 && (
          <LoginScreen onLogin={handleLogin} error={error} isLoading={isLoading} />
        )}

        {step === 1 && (
          <QuestionCard
            questionEn="1. What activity have you hosted?"
            questionTh="คุณได้จัดกิจกรรมอะไรไปบ้าง?"
            value={q1Answer}
            onChange={setQ1Answer}
            onSubmit={handleQ1Submit}
            isLoading={isLoading}
          />
        )}

        {step === 2 && (
          <QuestionCard
            questionEn="2. How was your activity?"
            questionTh="กิจกรรมของคุณเป็นอย่างไรบ้าง?"
            value={q2Answer}
            onChange={setQ2Answer}
            onSubmit={handleQ2Submit}
            isLoading={isLoading}
          />
        )}

        {step === 3 && q3Question && (
          <QuestionCard
            questionEn={`3. ${q3Question.q_en}`}
            questionTh={q3Question.q_th}
            value={q3Answer}
            onChange={setQ3Answer}
            onSubmit={handleQ3Submit}
            isLoading={isLoading}
          />
        )}

        {step === 4 && q4Question && (
          <QuestionCard
            questionEn={`4. ${q4Question.q_en}`}
            questionTh={q4Question.q_th}
            value={q4Answer}
            onChange={setQ4Answer}
            onSubmit={handleQ4Submit}
            isLoading={isLoading}
          />
        )}

        {step === 5 && (
          <PhotoUpload
            onSubmit={handleFinalSubmit}
            isUploading={isLoading}
          />
        )}

        {step === 6 && (
          <div className="animate-slide-up bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center w-full max-w-lg mx-auto">
            <div className="w-16 h-16 bg-ted-red rounded-full flex items-center justify-center mx-auto mb-6 text-white">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Reflection Complete</h2>
            <p className="text-gray-500">Thank you for sharing your experience!</p>
            <p className="text-gray-400 text-sm mt-1">บันทึกการสะท้อนคิดของคุณเรียบร้อยแล้ว</p>
            
            <button
              onClick={() => window.location.reload()}
              className="mt-8 px-6 py-2.5 rounded-full text-ted-red font-medium border border-ted-red/20 hover:bg-ted-red hover:text-white transition-all duration-200"
            >
              Start Over
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
