import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import api from '../api/axios';

// ---------------------------------------------------------
// 🛠️ ฐานข้อมูลวันหยุด (ฝังไว้เลย กันเหนียว + ใช้ได้ทุกปี)
// ---------------------------------------------------------
const FIXED_HOLIDAYS = [
  // --- เดือน 1 ---
  { month: '01', day: '01', localName: 'วันขึ้นปีใหม่ 🎉' },
  // --- เดือน 2 ---
  { month: '02', day: '14', localName: 'วันวาเลนไทน์ 🌹' },
  // --- เดือน 4 ---
  { month: '04', day: '06', localName: 'วันจักรี' },
  { month: '04', day: '13', localName: 'วันสงกรานต์ 💦' },
  { month: '04', day: '14', localName: 'วันสงกรานต์ 💦' },
  { month: '04', day: '15', localName: 'วันสงกรานต์ 💦' },
  // --- เดือน 5 ---
  { month: '05', day: '01', localName: 'วันแรงงานแห่งชาติ' },
  { month: '05', day: '04', localName: 'วันฉัตรมงคล' },
  // --- เดือน 6 ---
  { month: '06', day: '03', localName: 'วันเฉลิมฯ พระราชินี' },
  // --- เดือน 7 ---
  { month: '07', day: '28', localName: 'วันเฉลิมฯ ร.10' },
  // --- เดือน 8 ---
  { month: '08', day: '12', localName: 'วันแม่แห่งชาติ 💙' },
  // --- เดือน 10 ---
  { month: '10', day: '13', localName: 'วันนวมินทรมหาราช' },
  { month: '10', day: '23', localName: 'วันปิยมหาราช' },
  { month: '10', day: '31', localName: 'วันฮาโลวีน 🎃' },
  // --- เดือน 12 ---
  { month: '12', day: '05', localName: 'วันพ่อแห่งชาติ 💛' },
  { month: '12', day: '10', localName: 'วันรัฐธรรมนูญ' },
  { month: '12', day: '25', localName: 'วันคริสต์มาส 🎄' },
  { month: '12', day: '31', localName: 'วันสิ้นปี 🎉' },
];

// วันหยุดตามจันทรคติ (เฉพาะปี 2568/2025)
const LUNAR_HOLIDAYS_2025 = [
  { date: '2025-02-12', localName: 'วันมาฆบูชา 🙏' },
  { date: '2025-05-11', localName: 'วันวิสาขบูชา 🙏' },
  { date: '2025-07-10', localName: 'วันอาสาฬหบูชา 🙏' },
  { date: '2025-07-11', localName: 'วันเข้าพรรษา 🙏' },
  { date: '2025-11-06', localName: 'วันลอยกระทง 🕯️' },
];

const MyBookings = () => {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State สำหรับปฏิทิน
  const [date, setDate] = useState(new Date());
  const [activeStartDate, setActiveStartDate] = useState(new Date());
  const [allHolidays, setAllHolidays] = useState<any[]>([]);

  // 1. โหลดข้อมูลการจอง
  const fetchBookings = async () => {
    try {
      const res = await api.get('/my-bookings');
      const validBookings = res.data.filter((b: any) => b && b.activity);
      setBookings(validBookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  // 2. สร้างวันหยุดรวม
  const generateHolidays = (year: number) => {
    const fixed = FIXED_HOLIDAYS.map(h => ({
      date: `${year}-${h.month}-${h.day}`,
      localName: h.localName
    }));

    let lunar: any[] = [];
    if (year === 2025) {
      lunar = LUNAR_HOLIDAYS_2025;
    }

    setAllHolidays([...fixed, ...lunar]);
  };

  useEffect(() => {
    fetchBookings();
    generateHolidays(new Date().getFullYear());
  }, []);

  const handleCancel = async (activityId: string) => {
    if (!confirm('ต้องการยกเลิกการจองรายการนี้ใช่ไหมครับ? 🗑️')) return;
    try {
      await api.delete(`/activities/${activityId}/join`);
      alert('ยกเลิกเรียบร้อยครับ');
      fetchBookings();
    } catch (error: any) {
      alert(error.response?.data?.message || 'เกิดข้อผิดพลาด');
    }
  };

  const jumpToToday = () => {
    const today = new Date();
    setDate(today);
    setActiveStartDate(today);
    generateHolidays(today.getFullYear());
  };

  // 🎨 ปรับแต่งช่องวันที่ในปฏิทิน
  const getTileContent = ({ date, view }: any) => {
    if (view === 'month') {
      const content = [];
      const dateString = date.toLocaleDateString('en-CA');

      const holiday = allHolidays.find(h => h.date === dateString);
      if (holiday) {
        content.push(
          <div key="holiday" className="text-[10px] text-red-500 font-bold truncate mt-1">
            {holiday.localName}
          </div>
        );
      }

      const hasEvent = bookings.some(b => {
        if (!b?.activity?.date) return false;
        const d = new Date(b.activity.date);
        return d.toDateString() === date.toDateString();
      });
      if (hasEvent) content.push(<div key="event" className="event-dot"></div>);

      return <div>{content}</div>;
    }
    return null;
  };

  const selectedDateActivities = bookings.filter(b => {
    if (!b?.activity?.date) return false;
    return new Date(b.activity.date).toDateString() === date.toDateString();
  });

  const selectedDateHoliday = allHolidays.find(h => 
    h.date === date.toLocaleDateString('en-CA')
  );

  if (loading) return <div className="flex justify-center mt-20"><span className="loading loading-spinner loading-lg text-[#f77a45]"></span></div>;

  return (
    <div className="min-h-screen bg-base-200 py-10 px-4">
      <div className="container mx-auto max-w-6xl">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          🎫 ตารางกิจกรรมของฉัน
        </h1>

        <div className="flex flex-col lg:flex-row gap-8 mb-12">
          
          {/* ปฏิทิน (ซ้าย) */}
          <div className="lg:w-2/3">
            <div className="card bg-white shadow-xl p-4 md:p-8 rounded-3xl border border-gray-100 relative">
              <div className="flex justify-end mb-2">
                <button 
                  onClick={jumpToToday} 
                  className="btn btn-sm btn-outline border-none bg-gray-100 hover:bg-gray-200 text-gray-600 gap-2"
                >
                  📅 กลับมาวันนี้
                </button>
              </div>

              <Calendar 
                onChange={(value) => setDate(value as Date)} 
                value={date}
                activeStartDate={activeStartDate}
                onActiveStartDateChange={({ activeStartDate }) => {
                  if(activeStartDate) {
                    setActiveStartDate(activeStartDate);
                    generateHolidays(activeStartDate.getFullYear());
                  }
                }}
                tileContent={getTileContent}
                locale="th-TH"
                className="w-full border-none"
              />
            </div>
            
            <div className="flex gap-6 mt-4 text-base justify-center text-gray-500 flex-wrap font-medium">
               <div className="flex items-center gap-2">
                 <div className="w-3 h-3 bg-[#f77a45] rounded-full"></div> กิจกรรมที่จอง
               </div>
               <div className="flex items-center gap-2">
                 <span className="text-red-500 font-bold border border-red-200 px-1 rounded bg-red-50 text-xs">ตัวแดง</span> วันหยุด
               </div>
               <div className="flex items-center gap-2">
                 <div className="w-4 h-4 border-2 border-[#f77a45] bg-[#fff7ed] rounded"></div> วันนี้
               </div>
            </div>
          </div>

          {/* รายละเอียดรายวัน (ขวา) */}
          <div className="lg:w-1/3">
            <div className="card bg-white shadow-lg p-6 rounded-2xl h-full border border-gray-100">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                 📅 วันที่ <span className="text-[#38a89d]">{date.toLocaleDateString('th-TH', {dateStyle: 'long'})}</span>
              </h3>

              {selectedDateHoliday ? (
                <div className="alert alert-error bg-red-50 text-red-700 border-none mb-4 py-2 text-sm">
                  <span>🎉 : <b>{selectedDateHoliday.localName}</b></span>
                </div>
              ) : (
                <div className="alert bg-gray-50 border-none mb-4 py-2 text-sm text-gray-500">
                  <span>วันนี้ไม่มีวันหยุดราชการ</span>
                </div>
              )}

              <h4 className="font-bold text-gray-700 mb-3 border-b pb-2">
                กิจกรรมที่คุณจอง:
              </h4>
              
              {/* ✨✨ ส่วนที่ตกแต่งใหม่ ✨✨ */}
              {selectedDateActivities.length > 0 ? (
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                  {selectedDateActivities.map((booking) => (
                    <Link 
                      to={`/activities/${booking.activity._id}`} 
                      key={booking._id} 
                      className="group block relative pl-4 bg-white hover:bg-orange-50 transition-all duration-300 rounded-xl shadow-sm hover:shadow-md border border-gray-100 p-3"
                    >
                      {/* แถบสีตกแต่งด้านซ้าย */}
                      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-[#f77a45] to-[#ffb74d] rounded-l-xl"></div>
                      
                      <div className="flex justify-between items-center">
                        <div className="overflow-hidden">
                          <h4 className="font-bold text-gray-800 text-lg truncate group-hover:text-[#f77a45] transition-colors">
                            {booking.activity.title}
                          </h4>
                          <div className="flex flex-col gap-1 mt-1">
                            <p className="text-sm text-gray-500 flex items-center gap-1">
                              📍 {booking.activity.location}
                            </p>
                            <p className="text-xs text-[#38a89d] font-semibold flex items-center gap-1">
                              ⏰ 10:00 - 11:30 น.
                            </p>
                          </div>
                        </div>
                        
                        {/* ปุ่มลูกศร */}
                        <div className="btn btn-circle btn-sm bg-gray-50 border-none group-hover:bg-[#f77a45] group-hover:text-white transition-all shadow-sm">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                          </svg>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-xl border-dashed border-2 border-gray-200">
                  <div className="text-4xl mb-2 grayscale opacity-50">😴</div>
                  <p className="text-gray-400 font-medium">ว่างเปล่า...</p>
                  <p className="text-xs text-gray-400">ไม่มีกิจกรรมในช่วงเวลานี้</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="divider text-gray-400 mt-10">ประวัติการจองทั้งหมด</div>

        {/* 🎨 รายการทั้งหมด (แบบ Ticket Style) */}
        <div className="flex flex-col gap-4 mb-20">
            {bookings.length === 0 ? (
               <div className="text-center py-10">
                 <h2 className="text-xl font-bold text-gray-600">คุณยังไม่มีการจองกิจกรรมครับ</h2>
                 <Link to="/" className="btn bg-[#f77a45] text-white mt-4">ดูกิจกรรมทั้งหมด</Link>
               </div>
            ) : (
               bookings.map((item) => {
                const activity = item.activity;
                if (!activity) return null;
                const activityDate = new Date(activity.date);

                return (
                  <div key={item._id} className="card bg-white shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 overflow-hidden group">
                    <div className="flex flex-col md:flex-row">
                      
                      <div className="bg-[#38a89d] text-white p-4 md:w-32 flex flex-col justify-center items-center text-center">
                        <span className="text-3xl font-bold">{activityDate.getDate()}</span>
                        <span className="text-sm uppercase tracking-wide">
                          {activityDate.toLocaleDateString('th-TH', { month: 'short' })}
                        </span>
                        <span className="text-xs opacity-80">{activityDate.getFullYear() + 543}</span>
                      </div>

                      <div className="p-5 flex-grow flex flex-col justify-center">
                        <div className="flex items-center gap-2 mb-1">
                           <span className="badge badge-sm badge-outline text-gray-500">
                             {activity.category || 'กิจกรรม'}
                           </span>
                           <span className="text-xs text-gray-400">
                             จองเมื่อ: {new Date(item.bookedAt).toLocaleDateString('th-TH')}
                           </span>
                        </div>
                        
                        <h3 className="text-xl font-bold text-gray-800 group-hover:text-[#38a89d] transition-colors mb-2">
                          {activity.title}
                        </h3>
                        
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            ⏰ <span>10:00 - 11:30 น.</span>
                          </div>
                          <div className="flex items-center gap-1">
                            📍 <span>{activity.location}</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 md:w-48 flex flex-col justify-center gap-2 border-t md:border-t-0 md:border-l border-gray-100 bg-gray-50">
                        <Link 
                          to={`/activities/${activity._id}`} 
                          className="btn btn-sm btn-primary btn-outline w-full"
                        >
                          ดูรายละเอียด
                        </Link>
                        <button 
                          onClick={() => handleCancel(activity._id)} 
                          className="btn btn-sm bg-red-500 hover:bg-red-600 text-white border-none w-full"
                        >
                          ยกเลิกการจอง
                        </button>
                      </div>

                    </div>
                  </div>
                );
            }))}
        </div>

      </div>
    </div>
  );
};

export default MyBookings;