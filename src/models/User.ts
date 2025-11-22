import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // เก็บแบบ Hash (อ่านไม่ออก)
  role: { type: String, default: 'admin' },
  phone: { type: String }
});

export default mongoose.model('User', UserSchema);