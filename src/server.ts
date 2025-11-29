import express, { Application, Request, Response } from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken'; 

// Import Models
import User from './models/User';
import Activity from './models/Activity';
import Booking from './models/Booking';
import MarketItem from './models/MarketItem'; // <--- Import MarketItem
import Comment from './models/Comment';
import BadWord from './models/BadWord';

// Import Middleware
import { protect } from './middleware/auth';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors()); 
app.use(express.json());

// Connect Database
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI as string);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Error: ${(error as Error).message}`);
    process.exit(1);
  }
};

// ===================== AUTH ROUTES =====================
app.post('/api/login', async (req: Request, res: Response) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET as string, { expiresIn: '1d' });
    res.json({ token, role: user.role });
  } catch (error) {
    res.status(500).send("Server error");
  }
});

app.post('/api/register', async (req: Request, res: Response) => {
  const { username, password, phone } = req.body;
  try {
    const userExists = await User.findOne({ username });
    if (userExists) return res.status(400).json({ message: "ชื่อผู้ใช้นี้มีคนใช้แล้ว" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await User.create({ username, password: hashedPassword, role: 'user', phone });
    res.status(201).json({ message: "สมัครสมาชิกสำเร็จ" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// ===================== ACTIVITY ROUTES =====================
app.get('/api/activities', async (req: Request, res: Response) => {
  try {
    const activities = await Activity.find().sort({ date: 1 });
    res.json(activities);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});

app.get('/api/activities/:id', async (req: Request, res: Response) => {
  try {
    const activity = await Activity.findById(req.params.id);
    if (!activity) return res.status(404).json({ message: "ไม่พบกิจกรรมนี้" });
    res.json(activity);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});

app.post('/api/activities', protect, async (req: Request, res: Response) => {
  try {
    const newActivity = new Activity(req.body);
    await newActivity.save();
    res.status(201).json(newActivity);
  } catch (error) {
    res.status(400).json({ message: "บันทึกไม่สำเร็จ" });
  }
});

app.put('/api/activities/:id', protect, async (req: Request, res: Response) => {
  try {
    const updatedActivity = await Activity.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedActivity) return res.status(404).json({ message: "ไม่พบกิจกรรม" });
    res.json(updatedActivity);
  } catch (error) {
    res.status(400).json({ message: "แก้ไขไม่สำเร็จ" });
  }
});

app.delete('/api/activities/:id', protect, async (req: Request, res: Response) => {
  try {
    const deletedActivity = await Activity.findByIdAndDelete(req.params.id);
    if (!deletedActivity) return res.status(404).json({ message: "ไม่พบกิจกรรม" });
    res.json({ message: "ลบกิจกรรมเรียบร้อยแล้ว" });
  } catch (error) {
    res.status(500).json({ message: "ลบไม่สำเร็จ" });
  }
});

// ===================== BOOKING ROUTES =====================
app.post('/api/activities/:id/join', protect, async (req: Request, res: Response) => {
  const activityId = req.params.id;
  const userId = req.user.id;
  try {
    const activity = await Activity.findById(activityId);
    if (!activity) return res.status(404).json({ message: "ไม่พบกิจกรรม" });
    if (activity.currentParticipants >= activity.maxParticipants) return res.status(400).json({ message: "เต็มแล้ว" });

    const existingBooking = await Booking.findOne({ user: userId, activity: activityId });
    if (existingBooking) return res.status(400).json({ message: "จองไปแล้ว" });

    await Booking.create({ user: userId, activity: activityId });
    activity.currentParticipants += 1;
    await activity.save();
    res.status(200).json({ message: "จองสำเร็จ" });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});

app.delete('/api/activities/:id/join', protect, async (req: Request, res: Response) => {
  const activityId = req.params.id;
  const userId = req.user.id;
  try {
    const booking = await Booking.findOneAndDelete({ user: userId, activity: activityId });
    if (!booking) return res.status(400).json({ message: "ยังไม่ได้จอง" });

    const activity = await Activity.findById(activityId);
    if (activity) {
      activity.currentParticipants = Math.max(0, activity.currentParticipants - 1);
      await activity.save();
    }
    res.json({ message: "ยกเลิกจองสำเร็จ" });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});

app.get('/api/my-bookings', protect, async (req: Request, res: Response) => {
  try {
    const bookings = await Booking.find({ user: req.user.id }).populate('activity').sort({ bookedAt: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});

// ===================== 🛍️ MARKETPLACE ROUTES (Admin Updated) =====================

// 1. GET: ดูสินค้าทั้งหมด
app.get('/api/market', async (req: Request, res: Response) => {
  try {
    const items = await MarketItem.find()
      .populate('seller', 'username phone')
      .sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});

// 2. GET: ดูสินค้าชิ้นเดียว (สำหรับเอาไปโชว์ตอนกดแก้ไข)
app.get('/api/market/:id', async (req: Request, res: Response) => {
  try {
    const item = await MarketItem.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "ไม่พบสินค้า" });
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});

// 3. POST: ลงขายสินค้า
app.post('/api/market', protect, async (req: Request, res: Response) => {
  try {
    const newItem = await MarketItem.create({
      ...req.body,
      seller: req.user.id
    });
    res.status(201).json(newItem);
  } catch (error) {
    res.status(400).json({ message: "ข้อมูลไม่ครบถ้วน" });
  }
});

// 4. PUT: แก้ไขสินค้า (เจ้าของ หรือ Admin)
app.put('/api/market/:id', protect, async (req: Request, res: Response) => {
  try {
    const item = await MarketItem.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "ไม่พบสินค้า" });

    // เช็คสิทธิ์
    const isAdmin = req.user.role === 'admin';
    const isOwner = item.seller.toString() === req.user.id;

    if (!isAdmin && !isOwner) {
      return res.status(401).json({ message: "ไม่มีสิทธิ์แก้ไขสินค้านี้" });
    }

    // อัปเดตข้อมูล
    const updatedItem = await MarketItem.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedItem);

  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});

// 5. DELETE: ลบสินค้า (เจ้าของ หรือ Admin)
app.delete('/api/market/:id', protect, async (req: Request, res: Response) => {
  try {
    const item = await MarketItem.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "ไม่พบสินค้า" });

    const isAdmin = req.user.role === 'admin';
    const isOwner = item.seller.toString() === req.user.id;

    if (!isAdmin && !isOwner) {
      return res.status(401).json({ message: "ไม่มีสิทธิ์ลบสินค้านี้" });
    }

    await item.deleteOne();
    res.json({ message: "ลบสินค้าเรียบร้อย" });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});
// ===================== COMMENT ROUTES (Filter) =====================

// 1. GET: ดึงคอมเมนต์ของกิจกรรมนั้นๆ
app.get('/api/activities/:id/comments', async (req: Request, res: Response) => {
  try {
    const comments = await Comment.find({ activity: req.params.id })
      .populate('user', 'username') // ดึงชื่อคนเม้นมาด้วย
      .sort({ createdAt: -1 });     // ใหม่สุดขึ้นก่อน
    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});
// 2. POST: คอมเมนต์ (พร้อมระบบกรองคำจาก DB)
app.post('/api/activities/:id/comments', protect, async (req: Request, res: Response) => {
  const { text } = req.body;
  const activityId = req.params.id;
  const userId = req.user.id;

  try {
    const allBadWords = await BadWord.find().select('word'); // ดึงมาเฉพาะ field word
    
    // วนลูปเช็คว่าข้อความมีคำหยาบไหม
    const foundBadWord = allBadWords.find(b => text.includes(b.word));
    
    if (foundBadWord) {
      return res.status(400).json({ 
        message: `⚠️ ข้อความของคุณมีคำไม่สุภาพ ("${foundBadWord.word}") กรุณาแก้ไขครับ` 
      });
    }

    // ถ้าผ่าน บันทึกลง DB
    const newComment = await Comment.create({
      user: userId,
      activity: activityId,
      text: text
    });

    await newComment.populate('user', 'username');
    res.status(201).json(newComment);

  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});
// 3. PUT: แก้ไขคอมเมนต์
app.put('/api/comments/:id', protect, async (req: Request, res: Response) => {
  const { text } = req.body;
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: "ไม่พบคอมเมนต์" });

    if (comment.user.toString() !== req.user.id) {
      return res.status(401).json({ message: "คุณไม่มีสิทธิ์แก้ไข" });
    }

    // เช็คคำหยาบ (เหมือนเดิม)
    const allBadWords = await BadWord.find().select('word');
    const foundBadWord = allBadWords.find(b => text.includes(b.word));
    if (foundBadWord) {
      return res.status(400).json({ message: `⚠️ มีคำไม่สุภาพ ("${foundBadWord.word}")` });
    }

    comment.text = text;
    comment.isEdited = true; // <--- ✅ เพิ่มบรรทัดนี้: แปะป้ายว่าแก้แล้ว
    
    await comment.save();
    res.json(comment);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});

// 4. DELETE: ลบคอมเมนต์ (Admin หรือ เจ้าของ) -> แบบ Soft Delete
app.delete('/api/comments/:id', protect, async (req: Request, res: Response) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: "ไม่พบคอมเมนต์" });

    // เช็คสิทธิ์: เป็นเจ้าของ หรือ เป็น Admin (ผ่าน Middleware protect มาแล้ว user จะมี role)
    const isAdmin = req.user.role === 'admin';
    const isOwner = comment.user.toString() === req.user.id;

    if (!isAdmin && !isOwner) {
      return res.status(401).json({ message: "คุณไม่มีสิทธิ์ลบ" });
    }

    // Soft Delete: แค่เปลี่ยนสถานะ ไม่ได้ลบจริง
    comment.isDeleted = true;
    await comment.save();

    res.json({ message: "ลบข้อความแล้ว" });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});
// ===================== 👤 USER MANAGEMENT ROUTES (Admin) =====================

// 1. GET: ดูรายชื่อสมาชิกทั้งหมด
app.get('/api/users', protect, async (req: Request, res: Response) => {
  try {
    // เช็คว่าเป็น Admin ไหม?
    if (req.user.role !== 'admin') return res.status(403).json({ message: "Forbidden" });

    const users = await User.find().select('-password').sort({ joinedAt: -1 }); // ไม่ดึง password มา
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});

// 2. GET: ดูสมาชิกคนเดียว (เอาไว้โชว์ในหน้าแก้ไข)
app.get('/api/users/:id', protect, async (req: Request, res: Response) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: "Forbidden" });
    
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: "ไม่พบผู้ใช้นี้" });
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});

// 3. PUT: แก้ไขข้อมูลสมาชิก (เช่น เปลี่ยน Role, แก้ชื่อ)
app.put('/api/users/:id', protect, async (req: Request, res: Response) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: "Forbidden" });

    // ห้ามแก้ Password ผ่าน API นี้เพื่อความปลอดภัย (ควรมี API แยก)
    const { password, ...updateData } = req.body;

    const updatedUser = await User.findByIdAndUpdate(req.params.id, updateData, { new: true }).select('-password');
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});

// 4. DELETE: ลบสมาชิก (แบน)
app.delete('/api/users/:id', protect, async (req: Request, res: Response) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: "Forbidden" });

    // ป้องกันการลบตัวเอง
    if (req.params.id === req.user.id) {
      return res.status(400).json({ message: "คุณไม่สามารถลบตัวเองได้" });
    }

    await User.findByIdAndDelete(req.params.id);
    // ลบข้อมูลที่เกี่ยวข้องด้วย (เช่น การจอง, คอมเมนต์, ตลาด) เพื่อไม่ให้เป็นขยะ
    await Booking.deleteMany({ user: req.params.id });
    await MarketItem.deleteMany({ seller: req.params.id });
    await Comment.deleteMany({ user: req.params.id });

    res.json({ message: "ลบผู้ใช้และข้อมูลที่เกี่ยวข้องเรียบร้อย" });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});
// =================================================================

// Start Server (บรรทัดสุดท้าย)
app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  await connectDB();
});