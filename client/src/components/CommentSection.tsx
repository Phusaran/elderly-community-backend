import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

interface CommentSectionProps {
  activityId: string;
}

const CommentSection = ({ activityId }: CommentSectionProps) => {
  const [comments, setComments] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem('token');

  // ดึงคอมเมนต์
  const fetchComments = async () => {
    try {
      const res = await api.get(`/activities/${activityId}/comments`);
      setComments(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [activityId]);

  // ส่งคอมเมนต์
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    setLoading(true);
    try {
      await api.post(`/activities/${activityId}/comments`, { text });
      setText(''); // ล้างช่องพิมพ์
      fetchComments(); // โหลดใหม่ทันที
      alert('ส่งความคิดเห็นเรียบร้อย ✅');
    } catch (error: any) {
      // แจ้งเตือนถ้าเจอคำหยาบ
      alert(error.response?.data?.message || 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card bg-base-100 shadow-sm border border-gray-200 mt-8 p-6">
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
        💬 ความคิดเห็นชุมชน <span className="badge badge-neutral">{comments.length}</span>
      </h3>

      {/* ช่องพิมพ์ (ต้อง Login ก่อน) */}
      {token ? (
        <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
          <input
            type="text"
            placeholder="แสดงความคิดเห็น หรือสอบถามข้อมูล..."
            className="input input-bordered w-full focus:input-primary"
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={loading}
          />
          <button 
            type="submit" 
            className="btn btn-primary text-white"
            disabled={loading}
          >
            {loading ? 'กำลังส่ง...' : 'ส่งเลย 🚀'}
          </button>
        </form>
      ) : (
        <div className="alert bg-gray-50 mb-6 text-sm">
          <span>🔒 กรุณา <Link to="/login" className="link link-primary font-bold">เข้าสู่ระบบ</Link> เพื่อแสดงความคิดเห็น</span>
        </div>
      )}

      {/* รายการคอมเมนต์ */}
      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
        {comments.length === 0 ? (
          <p className="text-gray-400 text-center py-4">ยังไม่มีความคิดเห็น เป็นคนแรกเลยสิ!</p>
        ) : (
          comments.map((c) => (
            <div key={c._id} className="chat chat-start">
              <div className="chat-image avatar">
                <div className="w-10 rounded-full bg-neutral-focus text-neutral-content flex items-center justify-center bg-gray-200">
                  <span className="text-xl">👤</span>
                </div>
              </div>
              <div className="chat-header text-xs text-gray-500 mb-1">
                {c.user?.username || 'สมาชิก'} • {new Date(c.createdAt).toLocaleDateString('th-TH', { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div className="chat-bubble bg-gray-100 text-gray-800 shadow-sm">
                {c.text}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CommentSection;