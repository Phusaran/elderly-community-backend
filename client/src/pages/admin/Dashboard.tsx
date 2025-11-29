import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import type { Activity, User } from '../../types';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState<'activities' | 'users'>('activities');
  const [activities, setActivities] = useState<Activity[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // ฟังก์ชันโหลดข้อมูล (โหลดตาม Tab ที่เลือก)
  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'activities') {
        const res = await api.get('/activities');
        setActivities(res.data);
      } else {
        const res = await api.get('/users');
        setUsers(res.data);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  // ลบกิจกรรม
  const handleDeleteActivity = async (id: string) => {
    if (!confirm('⚠️ ยืนยันการลบกิจกรรมนี้?')) return;
    try {
      await api.delete(`/activities/${id}`);
      fetchData();
    } catch (error) { alert('ลบไม่สำเร็จ'); }
  };

  // ลบ User
  const handleDeleteUser = async (id: string) => {
    if (!confirm('⛔ ยืนยันการ "แบน" สมาชิกนี้? (ข้อมูลทุกอย่างของเขาจะหายไป)')) return;
    try {
      await api.delete(`/users/${id}`);
      alert('ลบสมาชิกเรียบร้อย');
      fetchData();
    } catch (error: any) { alert(error.response?.data?.message || 'ลบไม่สำเร็จ'); }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">🛠️ แผงควบคุมผู้ดูแลระบบ</h1>
      </div>

      {/* Tabs */}
      <div className="tabs tabs-boxed bg-white p-2 mb-6 shadow-sm border border-gray-100 inline-block">
        <a 
          className={`tab tab-lg ${activeTab === 'activities' ? 'tab-active bg-[#38a89d] text-white' : ''}`}
          onClick={() => setActiveTab('activities')}
        >
          📅 จัดการกิจกรรม
        </a>
        <a 
          className={`tab tab-lg ${activeTab === 'users' ? 'tab-active bg-[#f77a45] text-white' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          👤 จัดการสมาชิก
        </a>
      </div>

      {loading ? (
        <div className="text-center py-20">Loading...</div>
      ) : (
        <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
          
          {/* --- TAB 1: กิจกรรม --- */}
          {activeTab === 'activities' && (
            <>
              <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
                <h3 className="font-bold text-gray-500">รายการกิจกรรมทั้งหมด ({activities.length})</h3>
                <Link to="/admin/activity/new" className="btn btn-sm btn-primary">+ เพิ่มกิจกรรม</Link>
              </div>
              <div className="overflow-x-auto">
                <table className="table w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th>ชื่อกิจกรรม</th>
                      <th>วันที่</th>
                      <th>ผู้ลงทะเบียน</th>
                      <th className="text-center">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activities.map((item) => (
                      <tr key={item._id} className="hover">
                        <td>
                          <div className="font-bold">{item.title}</div>
                          <div className="text-xs text-gray-400">{item.location}</div>
                        </td>
                        <td>{new Date(item.date).toLocaleDateString('th-TH')}</td>
                        <td>{item.currentParticipants}/{item.maxParticipants}</td>
                        <td className="flex gap-2 justify-center">
                          <Link to={`/admin/activity/edit/${item._id}`} className="btn btn-xs btn-warning">แก้ไข</Link>
                          <button onClick={() => handleDeleteActivity(item._id)} className="btn btn-xs btn-error text-white">ลบ</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* --- TAB 2: สมาชิก --- */}
          {activeTab === 'users' && (
            <>
              <div className="p-4 bg-gray-50 border-b">
                <h3 className="font-bold text-gray-500">รายชื่อสมาชิกทั้งหมด ({users.length})</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="table w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th>Username</th>
                      <th>เบอร์โทร</th>
                      <th>สถานะ (Role)</th>
                      <th>วันที่สมัคร</th>
                      <th className="text-center">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u._id} className="hover">
                        <td className="font-bold flex items-center gap-2">
                          <div className="avatar placeholder">
                            <div className="bg-neutral-focus text-neutral-content rounded-full w-8">
                              <span className="text-xs">{u.username[0].toUpperCase()}</span>
                            </div>
                          </div>
                          {u.username}
                        </td>
                        <td>{u.phone || '-'}</td>
                        <td>
                          {u.role === 'admin' ? (
                            <span className="badge badge-warning font-bold">Admin</span>
                          ) : (
                            <span className="badge badge-ghost">User</span>
                          )}
                        </td>
                        <td>{new Date(u.joinedAt).toLocaleDateString('th-TH')}</td>
                        <td className="flex gap-2 justify-center">
                          <Link to={`/admin/user/edit/${u._id}`} className="btn btn-xs btn-outline">
                            แก้ไข
                          </Link>
                          <button 
                            onClick={() => handleDeleteUser(u._id)} 
                            className="btn btn-xs btn-error text-white"
                            disabled={u.role === 'admin'} // ห้ามลบ Admin (ป้องกันตัวเอง)
                          >
                            ลบ
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

        </div>
      )}
    </div>
  );
};

export default AdminDashboard;