import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import api from '../api/axios';

// ---------------------------------------------------------
// 🛠️ ส่วนที่ 1: วันหยุดคงที่ (Fixed) - ใช้ได้ทุกปีตลอดไป
// ---------------------------------------------------------
const FIXED_HOLIDAYS = [
  { month: '01', day: '01', localName: 'วันขึ้นปีใหม่ 🎉' },
  { month: '02', day: '14', localName: 'วันวาเลนไทน์ 🌹' }, 
  { month: '04', day: '01', localName: 'April Fool\'s Day 🤡' }, 
  { month: '04', day: '06', localName: 'วันจักรี' },
  { month: '04', day: '13', localName: 'วันสงกรานต์ 💦' },
  { month: '04', day: '14', localName: 'วันสงกรานต์ 💦' },
  { month: '04', day: '15', localName: 'วันสงกรานต์ 💦' },
  { month: '04', day: '22', localName: 'วันคุ้มครองโลก (Earth Day) 🌍' }, 
  { month: '05', day: '01', localName: 'วันแรงงานแห่งชาติ' },
  { month: '05', day: '04', localName: 'วันฉัตรมงคล' },
  { month: '06', day: '03', localName: 'วันเฉลิมฯ พระราชินี' },
  { month: '07', day: '28', localName: 'วันเฉลิมฯ ร.10' },
  { month: '08', day: '12', localName: 'วันแม่แห่งชาติ 💙' },
  { month: '10', day: '13', localName: 'วันนวมินทรมหาราช' },
  { month: '10', day: '23', localName: 'วันปิยมหาราช' },
  { month: '10', day: '31', localName: 'วันฮาโลวีน 🎃' }, 
  { month: '12', day: '05', localName: 'วันพ่อแห่งชาติ 💛' },
  { month: '12', day: '10', localName: 'วันรัฐธรรมนูญ' },
  { month: '12', day: '24', localName: 'Christmas Eve 🎅' }, 
  { month: '12', day: '25', localName: 'วันคริสต์มาส 🎄' }, 
  { month: '12', day: '31', localName: 'วันสิ้นปี 🎉' },
];

// ---------------------------------------------------------
// 🛠️ ส่วนที่ 2: วันสำคัญที่ไม่ตรงกันทุกปี (ปี 2568/2025)
// (รวมวันพระใหญ่ + ตรุษจีน + สารทจีน)
// ---------------------------------------------------------
const LUNAR_HOLIDAYS_2025 = [
  { date: '2025-01-29', localName: 'วันตรุษจีน 🧧' }, 
  { date: '2025-02-12', localName: 'วันมาฆบูชา 🙏' },
  { date: '2025-05-11', localName: 'วันวิสาขบูชา 🙏' },
  { date: '2025-07-10', localName: 'วันอาสาฬหบูชา 🙏' },
  { date: '2025-07-11', localName: 'วันเข้าพรรษา 🙏' },
  { date: '2025-09-07', localName: 'วันไหว้พระจันทร์ 🥮' }, 
  { date: '2025-11-06', localName: 'วันลอยกระทง 🕯️' }, 
];

const MyBookings = () => {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date());
  const [allHolidays, setAllHolidays] = useState<any[]>([]);
  const [activeStartDate, setActiveStartDate] = useState(new Date()); 
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

  // ฟังก์ชันรวมร่างวันหยุด (Generate Holidays)
  const generateHolidays = (year: number) => {
    // 1. แปลง Fixed Holidays ให้เป็นปีปัจจุบัน
    const fixed = FIXED_HOLIDAYS.map(h => ({
      date: `${year}-${h.month}-${h.day}`,
      localName: h.localName
    }));

    // 2. เอามารวมกับ Lunar Holidays (ถ้าปีตรงกัน)
    let lunar: any[] = [];
    if (year === 2025) {
      lunar = LUNAR_HOLIDAYS_2025;
    } 
    // *ถ้าจะเพิ่มปี 2026 ก็มาใส่ตรงนี้เพิ่ม

    setAllHolidays([...fixed, ...lunar]);
  };

  useEffect(() => {
    fetchBookings();
    generateHolidays(new Date().getFullYear()); // สร้างวันหยุดของปีปัจจุบันทันที
  }, []);

  // เมื่อเปลี่ยนปีในปฏิทิน ให้สร้างวันหยุดใหม่ตามปีนั้น (รองรับการกดดูปีหน้า)
  const handleActiveStartDateChange = ({ activeStartDate }: any) => {
    if (activeStartDate) {
      generateHolidays(activeStartDate.getFullYear());
    }
  };

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
    setDate(today);            // เลือกวันที่วันนี้
    setActiveStartDate(today); // ดีดหน้าปฏิทินกลับมาเดือนนี้
    generateHolidays(today.getFullYear()); // โหลดวันหยุดของปีนี้ใหม่ (กันเหนียว)
  };
  // 🎨 แสดงผลในปฏิทิน
  const getTileContent = ({ date, view }: any) => {
    if (view === 'month') {
      const content = [];
      // แปลงวันที่ปฏิทินเป็น YYYY-MM-DD (ใช้ en-CA เพื่อฟอร์แมตที่ถูกต้อง)
      const dateString = date.toLocaleDateString('en-CA'); 

      // 1. เช็ควันหยุด
      const holiday = allHolidays.find(h => h.date === dateString);
      if (holiday) {
        content.push(
          <div key="holiday" className="text-[10px] text-red-500 font-bold truncate mt-1">
            {holiday.localName}
          </div>
        );
      }

      // 2. เช็คกิจกรรมที่จอง
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
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">🎫 ตารางกิจกรรมของฉัน</h1>

        <div className="flex flex-col lg:flex-row gap-8 mb-12">
          {/* ปฏิทิน */}
          <div className="lg:w-2/3">
            <div className="card bg-white shadow-lg p-6 rounded-2xl">
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
                
                // ✅ 3. เพิ่ม 2 บรรทัดนี้ (สำคัญมาก!)
                activeStartDate={activeStartDate} // บอกปฏิทินว่าให้โชว์เดือนไหน
                onActiveStartDateChange={({ activeStartDate }) => {
                  // เมื่อ user กดเลื่อนเดือนเอง ให้จำค่าใหม่ไว้
                  if (activeStartDate) {
                    setActiveStartDate(activeStartDate); 
                    generateHolidays(activeStartDate.getFullYear());
                  }
                }}

                tileContent={getTileContent}
                locale="th-TH"
                className="w-full border-none"
              />
            </div>
            <div className="flex gap-4 mt-2 text-sm justify-center text-gray-500 flex-wrap">
               <div className="flex items-center gap-1"><div className="w-2 h-2 bg-[#f77a45] rounded-full"></div> กิจกรรมที่จอง</div>
            </div>
          </div>

          {/* รายละเอียด */}
          <div className="lg:w-1/3">
            <div className="card bg-white shadow-lg p-6 rounded-2xl h-full border border-gray-100">
              <h3 className="text-xl font-bold mb-4">
                 📅 วันที่ <span className="text-[#38a89d]">{date.toLocaleDateString('th-TH', {dateStyle: 'long'})}</span>
              </h3>

              {selectedDateHoliday ? (
                <div className="alert alert-error bg-red-50 text-red-700 border-none mb-4 py-2 text-sm">
                  <span>🎉: <b>{selectedDateHoliday.localName}</b></span>
                </div>
              ) : (
                <div className="alert bg-gray-50 border-none mb-4 py-2 text-sm text-gray-500">
                  <span>วันนี้ไม่มีวันหยุดราชการ</span>
                </div>
              )}

              <h4 className="font-bold text-gray-500 mb-2 border-b pb-2">กิจกรรมที่คุณจอง:</h4>
              
              {selectedDateActivities.length > 0 ? (
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                  {selectedDateActivities.map((booking) => (
                    <div key={booking._id} className="bg-base-100 p-4 rounded-xl border-l-4 border-[#f77a45] shadow-sm flex justify-between items-center hover:bg-orange-50 transition-colors">
                      <div className="overflow-hidden">
                        <h4 className="font-bold text-lg truncate">{booking.activity.title}</h4>
                        <p className="text-sm text-gray-600 truncate">📍 {booking.activity.location}</p>
                      </div>
                      <Link to={`/activities/${booking.activity._id}`} className="btn btn-sm btn-circle btn-ghost text-[#38a89d]">➝</Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-gray-400 bg-gray-50 rounded-xl border-dashed border-2">
                  ไม่มีกิจกรรมที่จองไว้
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="divider text-gray-400">ประวัติการจองทั้งหมด</div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bookings.map((item) => (
                <div key={item._id} className="card bg-white shadow-md p-4 flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                      <h2 className="font-bold line-clamp-1" title={item.activity.title}>{item.activity.title}</h2>
                      <span className="badge badge-sm badge-outline">{new Date(item.activity.date).toLocaleDateString('th-TH')}</span>
                    </div>
                    <button onClick={() => handleCancel(item.activity._id)} className="btn btn-xs btn-outline btn-error self-end">ยกเลิก</button>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default MyBookings;