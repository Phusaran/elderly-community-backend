import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import type { MarketItem } from '../types';

const Marketplace = () => {
  const [items, setItems] = useState<MarketItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  const token = localStorage.getItem('token');
  let currentUserId = '';
  if (token) {
    try { currentUserId = JSON.parse(atob(token.split('.')[1])).id; } catch (e) {}
  }

  const fetchItems = async () => {
    try {
      // ✅ เรียก /market เฉยๆ (Axios จะเติม /api ให้เอง)
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
    if (!confirm('ยืนยันการลบ?')) return;
    try {
      // ✅ เรียก DELETE /market/:id
      await api.delete(`/market/${id}`);
      fetchItems(); 
    } catch (error) {
      alert('ลบไม่ได้ (คุณอาจไม่ใช่เจ้าของ)');
    }
  };

  if (loading) return <div className="text-center mt-20">Loading...</div>;

  return (
    <div className="min-h-screen bg-base-200 py-10 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">🛍️ ตลาดนัดชุมชน</h1>
          <Link to="/market/new" className="btn btn-primary text-white">+ ลงขายสินค้า</Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {items.map((item) => (
            <div key={item._id} className="card bg-white shadow-md border border-gray-100">
              <figure className="h-48 bg-gray-100">
                <img src={item.image_url || "https://via.placeholder.com/300"} alt={item.title} className="h-full w-full object-cover"/>
              </figure>
              <div className="card-body p-4">
                <h2 className="font-bold text-lg truncate">{item.title}</h2>
                <div className="flex justify-between items-center">
                  <span className="badge badge-warning">{item.price} ฿</span>
                  <span className="text-xs text-gray-400">ผู้ขาย: {item.seller?.username}</span>
                </div>
                <p className="text-sm text-gray-500 line-clamp-2 mt-2">{item.description}</p>
                <div className="mt-2 text-sm font-bold text-primary">📞 {item.contact_info}</div>
                
                {currentUserId === item.seller?._id && (
                  <button onClick={() => handleDelete(item._id)} className="btn btn-xs btn-error btn-outline mt-3 w-full">
                    ลบประกาศ
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Marketplace;