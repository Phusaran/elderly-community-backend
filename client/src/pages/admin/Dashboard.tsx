import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import type { Activity } from '../../types';

const AdminDashboard = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  // ฟังก์ชันโหลดข้อมูล
  const fetchActivities = async () => {
    try {
      const res = await api.get('/activities');
      setActivities(res.data);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  // ฟังก์ชันลบกิจกรรม
  const handleDelete = async (id: string) => {
    if (!confirm('⚠️ ยืนยันการลบกิจกรรมนี้? (ข้อมูลการจองทั้งหมดจะหายไปด้วย)')) return;
    
    try {
      await api.delete(`/activities/${id}`);
      alert('ลบกิจกรรมเรียบร้อย ✅');
      fetchActivities(); // โหลดตารางใหม่
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการลบ');
    }
  };

  if (loading) return <div className="text-center mt-20">Loading...</div>;

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">🛠️ จัดการกิจกรรม (Admin)</h1>
        <Link to="/admin/activity/new" className="btn btn-primary text-white shadow-lg">
          + เพิ่มกิจกรรมใหม่
        </Link>
      </div>

      <div className="overflow-x-auto bg-white rounded-xl shadow-md border border-gray-100">
        <table className="table w-full">
          {/* หัวตาราง */}
          <thead className="bg-gray-100 text-gray-600">
            <tr>
              <th>ชื่อกิจกรรม</th>
              <th>วันที่จัด</th>
              <th>หมวดหมู่</th>
              <th>ผู้ลงทะเบียน</th>
              <th className="text-center">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {activities.map((item) => (
              <tr key={item._id} className="hover">
                <td>
                  <div className="font-bold">{item.title}</div>
                  <div className="text-sm opacity-50 truncate w-48">{item.location}</div>
                </td>
                <td>
                  {new Date(item.date).toLocaleDateString('th-TH')}
                </td>
                <td>
                  <span className="badge badge-ghost badge-sm">{item.category}</span>
                </td>
                <td>
                  {item.currentParticipants} / {item.maxParticipants}
                </td>
                <td className="flex gap-2 justify-center">
                  <Link to={`/admin/activity/edit/${item._id}`} className="btn btn-sm btn-warning btn-outline">
                    ✏️ แก้ไข
                  </Link>
                  <button onClick={() => handleDelete(item._id)} className="btn btn-sm btn-error btn-outline">
                    🗑️ ลบ
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {activities.length === 0 && (
          <div className="text-center py-10 text-gray-400">
            ยังไม่มีกิจกรรมในระบบ
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;