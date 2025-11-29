import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import type { Activity } from '../types';

const Home = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [bookedIds, setBookedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  // ✅ 1. สร้าง State สำหรับ Filter (ค่าเริ่มต้นคือ 'All')
  const [selectedCategory, setSelectedCategory] = useState('All');

  // ✅ 2. กำหนดรายการหมวดหมู่ (จับคู่ชื่อปุ่ม กับ ค่าใน Database)
  const CATEGORIES = [
    { label: 'ทั้งหมด', value: 'All' },
    { label: 'สุขภาพ', value: 'สุขภาพ' },   // Fitness -> สุขภาพ
    { label: 'นันทนาการ', value: 'นันทนาการ' }, // Dance -> นันทนาการ
    { label: 'ธรรมะ', value: 'ธรรมะ' },       // Religious -> ธรรมะ
    { label: 'งานฝีมือ', value: 'งานฝีมือ' },       // Crafts -> งานฝีมือ
    { label: 'อื่นๆ', value: 'อื่นๆ' }           // Others -> อื่นๆ
  ];

  // ✅ 3. อัปเกรดฟังก์ชันเลือกสีป้าย (ให้รองรับภาษาไทย)
  const getTagStyle = (category: string) => {
    switch (category) {
      case 'สุขภาพ': return 'bg-[#c8e6c9] text-[#2e7d32]';     // เขียว
      case 'นันทนาการ': return 'bg-[#ffe0b2] text-[#ef6c00]'; // ส้ม
      case 'ธรรมะ': return 'bg-[#b3e5fc] text-[#0277bd]';     // ฟ้า
      case 'งานฝีมือ': return 'bg-[#e1bee7] text-[#7b1fa2]';  // ม่วง
      default: return 'bg-gray-100 text-gray-600';            // เทา
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const activitiesRes = await api.get('/activities');
        setActivities(activitiesRes.data);

        const token = localStorage.getItem('token');
        if (token) {
          const bookingsRes = await api.get('/my-bookings');
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

  // ✅ 4. ตัวกรองข้อมูล (Filter Logic)
  const filteredActivities = selectedCategory === 'All' 
    ? activities 
    : activities.filter(item => item.category === selectedCategory);

  if (loading) return <div className="flex justify-center mt-20"><span className="loading loading-spinner loading-lg text-[#f77a45]"></span></div>;

  return (
    <div>
      {/* Hero Section */}
      <header 
        className="relative h-[400px] flex items-center justify-center text-center text-white bg-cover bg-center"
        style={{ backgroundImage: "url('/image_2317b7.png')" }}
      >
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="relative z-10 p-5 bg-black/40 rounded-lg max-w-2xl mx-4 backdrop-blur-sm">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 font-sans">ร่วมกิจกรรม สานสัมพันธ์</h1>
          <p className="text-lg mb-6">ค้นหากิจกรรมและงานอีเวนต์ในท้องถิ่น เพื่อส่งเสริมสังคมผู้สูงอายุให้เข้มแข็ง</p>
        </div>
      </header>

      {/* Activities Section */}
      <section className="max-w-[1200px] mx-auto py-10 px-5">
        <h2 className="text-3xl font-bold text-center mb-8 text-gray-800">กิจกรรมที่กำลังจะมาถึง</h2>
        
        {/* ✅ 5. ปุ่ม Filter ที่กดได้จริง */}
        <div className="flex flex-wrap justify-center gap-3 mb-10">
          {CATEGORIES.map((cat) => (
            <button 
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)} // กดแล้วเปลี่ยนค่า State
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 shadow-sm
                ${selectedCategory === cat.value 
                  ? 'bg-[#f77a45] text-white transform scale-105 shadow-md' // ปุ่มที่เลือก (สีส้ม)
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200' // ปุ่มปกติ (สีขาว)
                }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
        
        {/* Grid แสดงผล (ใช้ filteredActivities แทน activities) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredActivities.length > 0 ? (
            filteredActivities.map((item) => {
              const isBooked = bookedIds.includes(item._id);

              return (
                <div key={item._id} className={`rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border flex flex-col p-6 
                  ${isBooked ? 'bg-green-50 border-green-200' : 'bg-white border-gray-100'}`}>
                  
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-xl font-bold text-gray-800 w-3/4">{item.title}</h3>
                    {/* ใช้ฟังก์ชันเลือกสีป้ายอันใหม่ */}
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

                  {isBooked ? (
                    <Link 
                      to={`/activities/${item._id}`} 
                      className="btn border-none w-full bg-green-500 hover:bg-green-600 text-white mt-auto gap-2 text-lg"
                    >
                      ✅ จองแล้ว (ดูรายละเอียด)
                    </Link>
                  ) : (
                    <Link 
                      to={`/activities/${item._id}`} 
                      className="btn border-none w-full bg-[#f77a45] hover:bg-[#d66538] text-white mt-auto text-lg shadow-sm"
                    >
                      👉 ลงทะเบียนเข้าร่วม
                    </Link>
                  )}
                  
                </div>
              );
            })
          ) : (
            // กรณีหาไม่เจอ (Empty State)
            <div className="col-span-full text-center py-20 bg-gray-50 rounded-2xl border-dashed border-2 border-gray-200">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-xl font-bold text-gray-600">ไม่พบกิจกรรมในหมวดหมู่นี้</h3>
              <button 
                onClick={() => setSelectedCategory('All')} 
                className="btn btn-link text-[#f77a45] mt-2"
              >
                ดูทั้งหมด
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;