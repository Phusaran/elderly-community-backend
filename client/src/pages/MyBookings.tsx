import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

const MyBookings = () => {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // ฟังก์ชันโหลดข้อมูล
  const fetchBookings = async () => {
    try {
      // API นี้ Backend กรองมาให้แล้วเฉพาะของ User คนนี้
      const res = await api.get('/my-bookings'); 
      setBookings(res.data);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  // ฟังก์ชันกดยกเลิก (ตรงจากหน้านี้เลย)
  const handleCancel = async (activityId: string) => {
    if (!confirm('ต้องการยกเลิกการจองรายการนี้ใช่ไหมครับ? 🗑️')) return;

    try {
      await api.delete(`/activities/${activityId}/join`);
      alert('ยกเลิกเรียบร้อยครับ');
      fetchBookings(); // โหลดข้อมูลใหม่ รายการที่ลบจะหายไปทันที
    } catch (error: any) {
      alert(error.response?.data?.message || 'เกิดข้อผิดพลาด');
    }
  };

  if (loading) return <div className="flex justify-center mt-20"><span className="loading loading-spinner loading-lg text-[#f77a45]"></span></div>;

  return (
    <div className="min-h-screen bg-base-200 py-10 px-4">
      <div className="container mx-auto max-w-5xl">
        
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          🎫 รายการจองของฉัน <span className="text-[#38a89d]">({bookings.length})</span>
        </h1>

        {bookings.length === 0 ? (
          // ถ้าไม่มีข้อมูล โชว์หน้าว่างๆ
          <div className="text-center py-20 bg-white rounded-xl shadow-sm">
            <div className="text-6xl mb-4">🍃</div>
            <h2 className="text-xl font-bold text-gray-600">คุณยังไม่มีการจองกิจกรรมครับ</h2>
            <p className="text-gray-500 mb-6">ลองไปดูกิจกรรมที่น่าสนใจกันไหม?</p>
            <Link to="/" className="btn bg-[#f77a45] hover:bg-[#d66538] text-white border-none">
              ดูกิจกรรมทั้งหมด
            </Link>
          </div>
        ) : (
          // ถ้ามีข้อมูล โชว์เป็น Grid
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bookings.map((item) => {
              // ป้องกัน error กรณี activity ถูกลบไปแล้วแต่ booking ยังอยู่
              const activity = item.activity;
              if (!activity) return null;

              return (
                <div key={item._id} className="card bg-white shadow-md hover:shadow-lg transition-all border border-gray-100">
                  <div className="card-body">
                    
                    {/* วันที่จัดงาน (Badge) */}
                    <div className="flex justify-between items-start mb-2">
                       <div className="badge badge-primary badge-outline">
                          {new Date(activity.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                       </div>
                       <div className="badge badge-ghost text-xs">จองเมื่อ: {new Date(item.bookedAt).toLocaleDateString('th-TH')}</div>
                    </div>

                    <h2 className="card-title text-lg mb-2 line-clamp-1">{activity.title}</h2>
                    
                    <div className="text-sm text-gray-600 space-y-2 mb-4">
                      <p className="flex items-center gap-2">
                        📍 <span className="truncate">{activity.location}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        ⏰ 10:00 - 11:30 น.
                      </p>
                    </div>

                    <div className="card-actions flex-col gap-2 mt-auto">
                      {/* ปุ่มดูรายละเอียด */}
                      <Link 
                        to={`/activities/${activity._id}`} 
                        className="btn btn-sm btn-outline btn-primary w-full"
                      >
                        ดูรายละเอียด
                      </Link>
                      
                      {/* ปุ่มยกเลิก */}
                      <button 
                        onClick={() => handleCancel(activity._id)}
                        className="btn btn-sm btn-ghost text-error w-full hover:bg-red-50"
                      >
                        ยกเลิกการจอง
                      </button>
                    </div>
s
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyBookings;