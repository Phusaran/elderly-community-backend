import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import type { MarketItem } from '../types';

const Marketplace = () => {
  const [items, setItems] = useState<MarketItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // ดึง User ID และ Role
  const token = localStorage.getItem('token');
  let currentUserId = '';
  let currentUserRole = '';
  if (token) {
    try { 
      const payload = JSON.parse(atob(token.split('.')[1]));
      currentUserId = payload.id;
      // ดึง Role จาก localStorage ที่เราเก็บไว้ตอน Login
      currentUserRole = localStorage.getItem('role') || ''; 
    } catch (e) {}
  }

  const fetchItems = async () => {
    try {
      const res = await api.get('/market'); 
      setItems(res.data);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('ต้องการลบสินค้านี้ใช่ไหม? 🗑️')) return;
    try {
      await api.delete(`/market/${id}`);
      fetchItems(); 
    } catch (error) {
      alert('ลบไม่สำเร็จ');
    }
  };

  if (loading) return <div className="text-center mt-20">Loading...</div>;

  return (
    <div className="min-h-screen bg-base-200 py-10 px-4">
      <div className="container mx-auto max-w-6xl">
        
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-800">🛍️ ตลาดนัดชุมชน</h1>
            <p className="text-gray-500 mt-2">ซื้อขาย-แลกเปลี่ยน สินค้าและฝีมือจากคนในชุมชน</p>
          </div>
          <Link to="/market/new" className="btn btn-primary text-white shadow-lg border-none bg-[#38a89d] hover:bg-[#2b857c] px-6">
            + ลงขายสินค้า
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {items.map((item) => {
            // เช็คสิทธิ์: เป็นเจ้าของ หรือ เป็น Admin
            const canManage = currentUserId === item.seller?._id || currentUserRole === 'admin';

            return (
              <div key={item._id} className="card bg-white shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 group">
                <figure className="h-48 bg-gray-100 relative overflow-hidden">
                  <img 
                    src={item.image_url || "https://via.placeholder.com/400x300?text=No+Image"} 
                    alt={item.title} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    onError={(e) => { e.currentTarget.src = "https://via.placeholder.com/400x300?text=No+Image"; }}
                  />
                  <div className="absolute top-2 right-2 badge badge-warning shadow-sm font-bold text-lg px-3 py-3">
                    {item.price.toLocaleString()} ฿
                  </div>
                  <div className="absolute bottom-2 left-2 badge badge-ghost bg-white/80 backdrop-blur-sm text-xs">
                    {item.category}
                  </div>
                </figure>

                <div className="card-body p-5">
                  <h2 className="card-title text-lg font-bold text-gray-800 line-clamp-1" title={item.title}>
                    {item.title}
                  </h2>
                  <div className="text-xs text-gray-400 mb-2 flex items-center gap-1">
                    👤 ผู้ขาย: {item.seller?.username || 'สมาชิกชุมชน'}
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2 h-10">{item.description}</p>
                  
                  <div className="bg-orange-50 p-2 rounded-lg mt-3 text-sm flex items-center gap-2 text-gray-700">
                    📞 <span className="font-semibold select-all">{item.contact_info}</span>
                  </div>

                  {/* โซนปุ่มจัดการ (โชว์ถ้ามีสิทธิ์) */}
                  {canManage && (
                    <div className="card-actions justify-end mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-2">
                      <Link 
                        to={`/market/edit/${item._id}`} 
                        className="btn btn-sm btn-outline btn-warning w-full"
                      >
                        แก้ไข
                      </Link>
                      <button 
                        onClick={() => handleDelete(item._id)} 
                        className="btn btn-sm btn-outline btn-error w-full"
                      >
                        ลบ
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {items.length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl border-dashed border-2 border-gray-300">
            <div className="text-6xl mb-4 grayscale opacity-50">🛒</div>
            <h3 className="text-xl font-bold text-gray-500">ยังไม่มีสินค้าวางขาย</h3>
            <p className="text-gray-400 mb-6">เป็นคนแรกที่ลงขายสินค้าน่าสนใจสิ!</p>
            <Link to="/market/new" className="btn btn-outline btn-primary">เริ่มลงขายเลย</Link>
          </div>
        )}

      </div>
    </div>
  );
};

export default Marketplace;