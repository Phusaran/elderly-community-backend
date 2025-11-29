import mongoose, { Schema, Document } from 'mongoose';

export interface IMarketItem extends Document {
  seller: mongoose.Types.ObjectId; // ใครขาย (Ref User)
  title: string;                   // ชื่อสินค้า
  description: string;             // รายละเอียด
  price: number;                   // ราคา
  category: string;                // หมวดหมู่ (เช่น อาหาร, งานฝีมือ, ของมือสอง)
  image_url: string;               // รูปสินค้า
  contact_info: string;            // เบอร์โทร/ไลน์ติดต่อ
  createdAt: Date;
}

const MarketItemSchema: Schema = new Schema({
  seller: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  category: { 
    type: String, 
    required: true,
    enum: ['อาหาร', 'งานฝีมือ', 'ของมือสอง', 'บริการ', 'อื่นๆ'] 
  },
  image_url: { type: String, default: "" }, 
  contact_info: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IMarketItem>('MarketItem', MarketItemSchema);