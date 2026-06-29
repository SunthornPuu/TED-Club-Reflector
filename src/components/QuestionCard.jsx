import { useState } from 'react';

export default function QuestionCard({ 
  questionEn, 
  questionTh, 
  value, 
  onChange, 
  onSubmit, 
  isLoading, 
  buttonText = 'Next' 
}) {
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (value.trim()) {
      onSubmit();
    }
  };

  return (
    <div className="animate-slide-up bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 w-full max-w-xl mx-auto">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 leading-tight">
        {questionEn}
      </h2>
      <p className="text-gray-500 text-sm mb-6">
        {questionTh}
      </p>

      <form onSubmit={handleSubmit}>
        <div className={`relative transition-all duration-300 rounded-xl border ${isFocused ? 'border-ted-red ring-1 ring-ted-red/20' : 'border-gray-200'} bg-gray-50`}>
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Type your answer here... / พิมพ์คำตอบของคุณที่นี่..."
            className="w-full h-32 px-4 py-3 bg-transparent text-gray-800 placeholder-gray-400 focus:outline-none resize-none"
            disabled={isLoading}
          />
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            disabled={!value.trim() || isLoading}
            className="px-8 py-3 rounded-full bg-ted-red text-white font-medium hover:bg-ted-red-dark active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[120px]"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing
              </span>
            ) : (
              buttonText
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
