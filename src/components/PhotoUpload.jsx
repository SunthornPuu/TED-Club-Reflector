import { useState } from 'react';

export default function PhotoUpload({ onSubmit, isUploading }) {
  const [photoLink, setPhotoLink] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(photoLink.trim());
  };

  return (
    <div className="animate-slide-up bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Activity Photos</h2>
        <p className="text-gray-500 text-sm mt-1">ลิงก์สำหรับรูปภาพของคุณ</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Google Drive Link (Optional)</label>
          <label className="block text-xs text-gray-400 mb-2">วางลิงก์โฟลเดอร์รูปภาพ (ไม่บังคับ)</label>
          <input
            type="url"
            value={photoLink}
            onChange={(e) => setPhotoLink(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-ted-red/20 focus:border-ted-red transition-all"
            placeholder="https://drive.google.com/..."
            disabled={isUploading}
          />
        </div>

        <button
          type="submit"
          disabled={isUploading}
          className="w-full py-3.5 rounded-full bg-ted-red text-white font-medium hover:bg-ted-red-dark active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
        >
          {isUploading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Submitting...
            </span>
          ) : (
            'Finish & Submit · ส่งข้อมูล'
          )}
        </button>
      </form>
    </div>
  );
}
