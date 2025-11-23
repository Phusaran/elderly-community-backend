import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom'; // อย่าลืม import Link
import api from '../api/axios';
import type { Activity } from '../types';

const Home = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [bookedIds, setBookedIds] = useState<string[]>([]); // <--- 1. เพิ่มตัวแปรเก็บ ID ที่จองแล้ว
  const [loading, setLoading] = useState(true);

  const getTagStyle = (category: string) => {
    switch (category.toLowerCase()) {
      case 'dance': return 'bg-[#ffe0b2] text-[#ff9800]';
      case 'fitness': return 'bg-[#c8e6c9] text-[#4caf50]';
      case 'religious': return 'bg-[#b3e5fc] text-[#03a9f4]';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 2. ดึงกิจกรรมทั้งหมด
        const activitiesRes = await api.get('/activities');
        setActivities(activitiesRes.data);

        // 3. เช็คว่าถ้า Login อยู่ ให้ดึงประวัติการจองมาด้วย
        const token = localStorage.getItem('token');
        if (token) {
          const bookingsRes = await api.get('/my-bookings');
          // ดึงเฉพาะ ID ของกิจกรรมที่จองไปแล้ว มาเก็บไว้ใน Array
          // (booking.activity อาจจะเป็น Object หรือ ID ขึ้นอยู่กับ populate)
          const myBookedIds = bookingsRes.data.map((b: any) => b.activity._id || b.activity);
          setBookedIds(myBookedIds);
        }

      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div className="flex justify-center mt-20"><span className="loading loading-spinner loading-lg text-[#f77a45]"></span></div>;

  return (
    <div>
      {/* Hero Section (เหมือนเดิม) */}
      <header 
        className="relative h-[400px] flex items-center justify-center text-center text-white bg-cover bg-center"
        style={{ backgroundImage: "url('/image_2317b7.png')" }}
      >
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="relative z-10 p-5 bg-black/40 rounded-lg max-w-2xl mx-4 backdrop-blur-sm">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 font-sans">Stay Active, Stay Connected</h1>
          <p className="text-lg mb-6">Discover local events and activities designed to bring our senior community together</p>
          <div className="flex justify-center gap-4 flex-wrap">
             {/* ปุ่มใน Hero ไม่ต้องแก้ก็ได้ หรือจะให้ลิ้งก์ไปส่วนล่าง */}
          </div>
        </div>
      </header>

      {/* Activities Section */}
      <section className="max-w-[1200px] mx-auto py-10 px-5">
        <h2 className="text-3xl font-bold text-center mb-8 text-gray-800">Upcoming Activities</h2>
        
        <div className="flex flex-wrap justify-center gap-3 mb-10">
          {['All Activities', 'Dance', 'Fitness', 'Religious', 'Crafts'].map((filter, index) => (
            <button 
              key={filter}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-colors
                ${index === 0 ? 'bg-[#f77a45] text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            >
              {filter}
            </button>
          ))}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {activities.map((item) => {
            // 4. เช็คว่ากิจกรรมนี้ เราจองไปหรือยัง?
            const isBooked = bookedIds.includes(item._id);

            return (
              <div key={item._id} className={`rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border flex flex-col p-6 
                ${isBooked ? 'bg-green-50 border-green-200' : 'bg-white border-gray-100'}`}>
                
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-xl font-bold text-gray-800 w-3/4">{item.title}</h3>
                  <span className={`text-xs px-3 py-1 rounded-full font-semibold whitespace-nowrap ${getTagStyle(item.category)}`}>
                    {item.category}
                  </span>
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-3 flex-grow">{item.description}</p>
                
                <ul className="text-sm text-gray-600 space-y-2 mb-6 bg-white/50 p-3 rounded-lg">
                  <li className="flex items-center gap-2">
                    <span>📆</span> 
                    <span>{new Date(item.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span>📍</span> 
                    <span>{item.location}</span>
                  </li>
                </ul>

                {/* 5. เปลี่ยนปุ่มตามสถานะการจอง */}
                {isBooked ? (
                  <Link 
                    to={`/activities/${item._id}`} 
                    className="btn border-none w-full bg-green-500 hover:bg-green-600 text-white mt-auto gap-2"
                  >
                    ✅ จองแล้ว (ดูรายละเอียด)
                  </Link>
                ) : (
                  <Link 
                    to={`/activities/${item._id}`} 
                    className="btn border-none w-full bg-[#f77a45] hover:bg-[#d66538] text-white mt-auto"
                  >
                    👉 ลงทะเบียนเข้าร่วม
                  </Link>
                )}
                
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default Home;