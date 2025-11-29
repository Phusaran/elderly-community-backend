import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const MarketForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '', description: '', price: '', category: 'อาหาร', contact_info: '', image_url: ''
  });

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/market', formData);
      alert('ลงขายสำเร็จ!');
      navigate('/marketplace');
    } catch (error) {
      alert('เกิดข้อผิดพลาด');
    }
  };

  return (
    <div className="flex justify-center p-10 bg-base-200 min-h-screen">
      <form onSubmit={handleSubmit} className="card w-full max-w-lg bg-white shadow-xl p-8 space-y-4">
        <h2 className="text-2xl font-bold text-center">ลงขายสินค้า</h2>
        <input name="title" placeholder="ชื่อสินค้า" className="input input-bordered w-full" onChange={handleChange} required />
        <textarea name="description" placeholder="รายละเอียด" className="textarea textarea-bordered w-full" onChange={handleChange} required />
        <div className="flex gap-2">
          <input type="number" name="price" placeholder="ราคา (บาท)" className="input input-bordered w-full" onChange={handleChange} required />
          <select name="category" className="select select-bordered w-full" onChange={handleChange}>
            <option value="อาหาร">อาหาร</option>
            <option value="งานฝีมือ">งานฝีมือ</option>
            <option value="อื่นๆ">อื่นๆ</option>
          </select>
        </div>
        <input name="contact_info" placeholder="เบอร์โทร/Line" className="input input-bordered w-full" onChange={handleChange} required />
        <input name="image_url" placeholder="URL รูปภาพ (ถ้ามี)" className="input input-bordered w-full" onChange={handleChange} />
        <button type="submit" className="btn btn-primary w-full">ลงขายทันที</button>
      </form>
    </div>
  );
};

export default MarketForm;