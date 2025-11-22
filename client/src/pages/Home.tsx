import { useEffect, useState } from 'react';
import api from '../api/axios';
import type { Activity } from '../types';

const Home = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ฟังก์ชันดึงข้อมูล
    const fetchActivities = async () => {
      try {
        const response = await api.get('/activities');
        setActivities(response.data);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, []);

  // ถ้าโหลดอยู่ ให้หมุนติ้วๆ
  if (loading) return <div className="flex justify-center mt-20"><span className="loading loading-spinner loading-lg text-primary"></span></div>;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold text-center mb-10 text-primary">📅 กิจกรรมชุมชนของเรา</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activities.map((item) => (
          <div key={item._id} className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all border border-base-200">
            <div className="card-body">
              <div className="flex justify-between items-start">
                <h2 className="card-title text-lg font-bold truncate w-3/4">{item.title}</h2>
                <div className="badge badge-secondary badge-outline text-xs">{item.category}</div>
              </div>
              
              <p className="text-gray-500 text-sm line-clamp-2 mt-2">{item.description}</p>
              
              <div className="mt-4 space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  📅 <span>{new Date(item.date).toLocaleDateString('th-TH')}</span>
                </div>
                <div className="flex items-center gap-2">
                  📍 <span>{item.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  👥 <span>ที่ว่าง: {item.maxParticipants - item.currentParticipants} / {item.maxParticipants}</span>
                </div>
              </div>

              <div className="card-actions justify-end mt-4">
                <button className="btn btn-primary btn-sm w-full">ดูรายละเอียด</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Home;