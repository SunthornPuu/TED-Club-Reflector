import { useState } from 'react';

export default function LoginScreen({ onLogin, error, isLoading }) {
  const [username, setUsername] = useState('');
  const [buddyName, setBuddyName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username.trim() && buddyName.trim()) {
      onLogin(username.trim(), buddyName.trim());
    }
  };

  return (
    <div className="animate-slide-up bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-sm mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Welcome Back</h2>
        <p className="text-gray-500 text-sm mt-1">เข้าสู่ระบบเพื่อสะท้อนกิจกรรม</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Leader Name</label>
          <label className="block text-xs text-gray-400 mb-2">ชื่อเล่นของคุณ</label>
          <input
            type="text"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-ted-red/20 focus:border-ted-red transition-all"
            placeholder="e.g. John"
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Buddy Name</label>
          <label className="block text-xs text-gray-400 mb-2">ชื่อบัดดี้ของคุณ</label>
          <input
            type="text"
            required
            value={buddyName}
            onChange={(e) => setBuddyName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-ted-red/20 focus:border-ted-red transition-all"
            placeholder="e.g. Jane"
            disabled={isLoading}
          />
        </div>

        <button
          type="submit"
          disabled={!username.trim() || !buddyName.trim() || isLoading}
          className="w-full py-3.5 mt-4 rounded-full bg-ted-red text-white font-medium hover:bg-ted-red-dark active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
        >
          {isLoading ? (
            <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            'Continue · ดำเนินการต่อ'
          )}
        </button>
      </form>
    </div>
  );
}
