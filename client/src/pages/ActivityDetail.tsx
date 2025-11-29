import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import type { Activity } from '../types';
import CommentSection from '../components/CommentSection';

const ActivityDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false); // ใช้แทน joining (กันกดย้ำ)
  const [isBooked, setIsBooked] = useState(false); // <--- ตัวแปรเช็คสถานะจอง

  const token = localStorage.getItem('token');
  const isLoggedIn = !!token;

  // ฟังก์ชันโหลดข้อมูล (แยกออกมาเพื่อเรียกใช้ซ้ำตอนจอง/ยกเลิกเสร็จ)
  const fetchData = async () => {
    try {
      // 1. ดึงข้อมูลกิจกรรม
      const activityRes = await api.get(`/activities/${id}`);
      setActivity(activityRes.data);

      // 2. ถ้า Login แล้ว ให้เช็คว่าจองไปหรือยัง
      if (token) {
        const bookingsRes = await api.get('/my-bookings');
        // เช็คว่าในรายการจอง มี ID กิจกรรมนี้ไหม
        const booked = bookingsRes.data.some((b: any) => (b.activity._id || b.activity) === id);
        setIsBooked(booked);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  // ฟังก์ชันกดจอง
  const handleJoin = async () => {
    if (!isLoggedIn) return navigate('/login');
    if (!confirm('ยืนยันการจองกิจกรรมนี้ใช่ไหมครับ?')) return;

    setProcessing(true);
    try {
      await api.post(`/activities/${id}/join`);
      alert('✅ จองสำเร็จ! เตรียมตัวมาร่วมสนุกได้เลยครับ');
      await fetchData(); // โหลดข้อมูลใหม่ทันที (เลขจะเปลี่ยน ปุ่มจะเปลี่ยน)
    } catch (error: any) {
      alert(error.response?.data?.message || 'เกิดข้อผิดพลาด');
    } finally {
      setProcessing(false);
    }
  };

  // ฟังก์ชันกดยกเลิก (เพิ่มใหม่)
  const handleCancel = async () => {
    if (!confirm('⚠️ คุณต้องการ "ยกเลิก" การจองกิจกรรมนี้ใช่ไหมครับ?')) return;

    setProcessing(true);
    try {
      await api.delete(`/activities/${id}/join`); // ยิง API DELETE
      alert('ยกเลิกการจองเรียบร้อยแล้วครับ 🗑️');
      await fetchData(); // โหลดข้อมูลใหม่ทันที
    } catch (error: any) {
      alert(error.response?.data?.message || 'เกิดข้อผิดพลาด');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="flex justify-center mt-20"><span className="loading loading-spinner loading-lg text-[#f77a45]"></span></div>;
  if (!activity) return <div className="text-center mt-20 text-xl">ไม่พบกิจกรรมนี้ 😕</div>;

  const isFull = activity.currentParticipants >= activity.maxParticipants;

  return (
    <div className="min-h-screen bg-base-200 py-10 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
        
        {/* Header รูปภาพ */}
        <div className="h-64 bg-[#38a89d] relative flex items-center justify-center">
             <h1 className="text-3xl md:text-4xl font-bold text-white drop-shadow-md text-center px-4">{activity.title}</h1>
        </div>

        <div className="p-6 md:p-8">
          <button onClick={() => navigate(-1)} className="btn btn-ghost btn-sm mb-6 text-gray-500">← ย้อนกลับ</button>

          <div className="flex flex-col md:flex-row gap-8">
            
            {/* ข้อมูลฝั่งซ้าย */}
            <div className="flex-1 space-y-6">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="badge badge-lg bg-[#f77a45] text-white border-none">{activity.category}</span>
                <span className={`badge badge-lg badge-outline ${isFull ? 'text-error' : 'text-success'}`}>
                  {isFull && !isBooked ? 'ที่นั่งเต็มแล้ว ❌' : 'เปิดรับสมัคร ✅'}
                </span>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">รายละเอียดกิจกรรม</h2>
                <p className="text-gray-600 leading-relaxed text-lg">{activity.description}</p>
              </div>

              <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                 <h3 className="font-bold text-gray-700 mb-3">ข้อมูลการนัดหมาย</h3>
                 <ul className="space-y-3 text-gray-600">
                    <li className="flex items-center gap-3">📅 {new Date(activity.date).toLocaleDateString('th-TH', { dateStyle: 'long' })}</li>
                    <li className="flex items-center gap-3">📍 {activity.location}</li>
                    <li className="flex items-center gap-3">👥 ผู้เข้าร่วม: <b className="text-[#38a89d]">{activity.currentParticipants}</b> / {activity.maxParticipants} คน</li>
                 </ul>
                
              </div>
              <div className="mt-8">
                {activity && <CommentSection activityId={activity._id} />}
              </div>
            </div>

            {/* ฝั่งขวา: ปุ่ม Action (Sticky) */}
            <div className="md:w-80 flex flex-col gap-4">
              <div className="card bg-white shadow-lg p-6 rounded-xl border border-gray-100 h-fit sticky top-24">
                <h3 className="text-xl font-bold text-center mb-4">สถานะของคุณ</h3>
                
                {/* --- Logic การแสดงปุ่ม --- */}
                {isBooked ? (
                  // กรณี 1: จองไปแล้ว -> โชว์ปุ่มยกเลิก
                  <div className="text-center">
                    <div className="alert alert-success text-white mb-4 py-2 text-sm">
                      <span>✅ คุณลงทะเบียนแล้ว</span>
                    </div>
                    <button 
                      onClick={handleCancel}
                      disabled={processing}
                      className="btn btn-outline btn-error w-full"
                    >
                      {processing ? 'กำลังยกเลิก...' : 'ยกเลิกการจอง 🗑️'}
                    </button>
                  </div>

                ) : isFull ? (
                  // กรณี 2: เต็มแล้ว -> ปุ่มเทา
                  <button className="btn btn-disabled w-full">ที่นั่งเต็มแล้ว ❌</button>

                ) : (
                  // กรณี 3: ยังไม่จอง & ไม่เต็ม -> ปุ่มจอง
                  <button 
                    onClick={handleJoin} 
                    disabled={processing}
                    className="btn bg-[#38a89d] hover:bg-[#2b857c] text-white border-none w-full text-lg shadow-md"
                  >
                    {processing ? 'กำลังบันทึก...' : isLoggedIn ? 'ลงทะเบียนเข้าร่วม 👉' : 'เข้าสู่ระบบเพื่อจอง'}
                  </button>
                )}
                {/* ----------------------- */}

                {!isBooked && (
                  <p className="text-xs text-center text-gray-500 mt-3">*ระบบจะนับจำนวนคนทันทีที่กดจอง</p>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityDetail;