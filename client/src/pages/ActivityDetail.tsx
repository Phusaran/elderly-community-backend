import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import type { Activity } from '../types';

const ActivityDetail = () => {
  const { id } = useParams(); // ดึง ID จาก URL
  const navigate = useNavigate();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false); // สถานะตอนกดปุ่มจอง

  // เช็คว่า Login หรือยัง?
  const token = localStorage.getItem('token');
  const isLoggedIn = !!token;

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const res = await api.get(`/activities/${id}`);
        setActivity(res.data);
      } catch (error) {
        console.error("Error fetching activity:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchActivity();
  }, [id]);

  const handleJoin = async () => {
    if (!isLoggedIn) {
      alert('กรุณาเข้าสู่ระบบก่อนจองกิจกรรมครับ 👴👵');
      navigate('/login');
      return;
    }

    if (!confirm('ยืนยันการจองกิจกรรมนี้ใช่ไหมครับ?')) return;

    setJoining(true);
    try {
      await api.post(`/activities/${id}/join`);
      alert('จองสำเร็จ! เตรียมตัวมาร่วมสนุกได้เลยครับ 🎉');
      // รีโหลดข้อมูลใหม่เพื่ออัปเดตจำนวนคน
      window.location.reload();
    } catch (error: any) {
      alert(error.response?.data?.message || 'เกิดข้อผิดพลาดในการจอง');
    } finally {
      setJoining(false);
    }
  };

  if (loading) return <div className="flex justify-center mt-20"><span className="loading loading-spinner loading-lg text-primary"></span></div>;
  if (!activity) return <div className="text-center mt-20 text-xl">ไม่พบกิจกรรมนี้ 😕</div>;

  // คำนวณที่นั่งเหลือ
  const isFull = activity.currentParticipants >= activity.maxParticipants;

  return (
    <div className="min-h-screen bg-base-200 py-10 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
        
        {/* Header รูปภาพ */}
        <div className="h-64 bg-[#38a89d] relative flex items-center justify-center">
            {/* ใส่รูป Placeholder หรือรูปจริงถ้ามี */}
             <h1 className="text-4xl font-bold text-white drop-shadow-md text-center px-4">{activity.title}</h1>
        </div>

        <div className="p-8">
          {/* ปุ่มย้อนกลับ */}
          <button onClick={() => navigate(-1)} className="btn btn-ghost btn-sm mb-6 text-gray-500">
            ← ย้อนกลับ
          </button>

          <div className="flex flex-col md:flex-row gap-8">
            
            {/* ฝั่งซ้าย: ข้อมูลหลัก */}
            <div className="flex-1 space-y-6">
              <div className="flex items-center gap-3">
                <span className="badge badge-lg bg-[#f77a45] text-white border-none">{activity.category}</span>
                <span className={`badge badge-lg badge-outline ${isFull ? 'text-error' : 'text-success'}`}>
                  {isFull ? 'ที่นั่งเต็มแล้ว ❌' : 'ยังว่าง ✅'}
                </span>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">รายละเอียดกิจกรรม</h2>
                <p className="text-gray-600 leading-relaxed text-lg">{activity.description}</p>
              </div>

              <div className="card bg-base-100 border border-gray-200 p-4 rounded-xl">
                 <h3 className="font-bold text-gray-700 mb-3">ข้อมูลการนัดหมาย</h3>
                 <ul className="space-y-3 text-gray-600">
                    <li className="flex items-center gap-3">
                        📅 <span>{new Date(activity.date).toLocaleDateString('th-TH', { dateStyle: 'long' })}</span>
                    </li>
                    <li className="flex items-center gap-3">
                        📍 <span>{activity.location}</span>
                    </li>
                    <li className="flex items-center gap-3">
                        👥 <span>ผู้เข้าร่วมปัจจุบัน: <b className="text-primary">{activity.currentParticipants}</b> / {activity.maxParticipants} คน</span>
                    </li>
                 </ul>
              </div>
            </div>

            {/* ฝั่งขวา: ปุ่มกดจอง (Sticky) */}
            <div className="md:w-80 flex flex-col gap-4">
              <div className="card bg-gray-50 p-6 rounded-xl border border-gray-200 h-fit sticky top-24">
                <h3 className="text-xl font-bold text-center mb-4">สนใจเข้าร่วมไหม?</h3>
                
                {isFull ? (
                  <button className="btn btn-disabled w-full">ที่นั่งเต็มแล้ว</button>
                ) : (
                  <button 
                    onClick={handleJoin} 
                    disabled={joining}
                    className="btn bg-[#38a89d] hover:bg-[#2b857c] text-white border-none w-full text-lg shadow-md"
                  >
                    {joining ? 'กำลังจอง...' : isLoggedIn ? 'จองที่นั่งทันที 🎫' : 'เข้าสู่ระบบเพื่อจอง'}
                  </button>
                )}
                
                <p className="text-xs text-center text-gray-500 mt-3">
                  *กดจองแล้วระบบจะบันทึกชื่อของคุณทันที
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityDetail;