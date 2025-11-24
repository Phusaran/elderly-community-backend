import express, { Application, Request, Response } from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors'; // ต้องลง npm install cors ก่อนนะ
import Activity from './models/Activity'; // เรียก Model ที่เราสร้างไว้
import bcrypt from 'bcryptjs'; //สำหรับเข้ารหัส ของรหัสผ่าน
import jwt from 'jsonwebtoken'; 
import User from './models/User'; //เรียก Model ที่เราสร้างไว้
import { protect } from './middleware/auth'; //อันนี้เป็นยามสำหรับการ Authentication
import Booking from './models/Booking'; //เรียก Model ที่เราสร้างไว้


dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors()); 
app.use(express.json()); // อ่านข้อมูล JSON ที่ส่งมาได้

// เชื่อมต่อ Database
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI as string);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Error: ${(error as Error).message}`);
    process.exit(1);
  }
};

// ===================== ROUTES (API) =====================
    // login Route
app.post('/api/login', async (req: Request, res: Response) => {
  const { username, password } = req.body;

  try {
    // 1. เช็คว่ามี User นี้ไหม
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    // 2. เช็ค Password (เอามาเทียบกับ Hash)
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    // 3. ถ้าถูก สร้าง Token ส่งกลับไป
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET as string, {
      expiresIn: '1d' // Token อายุ 1 วัน
    });

    res.json({ token, role: user.role });
  } catch (error) {
    res.status(500).send("Server error");
  }
});
    // register route
app.post('/api/register', async (req: Request, res: Response) => {
  const { username, password, phone } = req.body; // รับเบอร์โทรด้วยก็ได้ เผื่อติดต่อ

  try {
    // 1. เช็คว่าชื่อซ้ำไหม
    const userExists = await User.findOne({ username });
    if (userExists) return res.status(400).json({ message: "ชื่อผู้ใช้นี้มีคนใช้แล้ว" });

    // 2. เข้ารหัสรหัสผ่าน
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. สร้าง User (Role เป็น 'user' โดยอัตโนมัติ)
    const user = await User.create({
      username,
      password: hashedPassword,
      role: 'user', // <--- สำคัญ!
      phone
    });

    res.status(201).json({ message: "สมัครสมาชิกสำเร็จ" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});
// 1. GET: ดึงกิจกรรมทั้งหมด (Read)
// ใช้ตอน: หน้าแรกที่แสดงรายการกิจกรรมทั้งหมดและโชว์ใน Homepage ไรงี้
app.get('/api/activities', async (req: Request, res: Response) => {
  try {
    // find() คือดึงหมด, sort คือเรียงเอาอันใหม่ล่าสุดขึ้นก่อน (-1)
    const activities = await Activity.find().sort({ date: 1 });
    res.json(activities);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});

// 2. GET: ดึงกิจกรรมเดียว (Read One)
// ใช้ตอน: กดเข้าไปดูรายละเอียดกิจกรรม (Detail Page)
app.get('/api/activities/:id', async (req: Request, res: Response) => {
  try {
    const activity = await Activity.findById(req.params.id);
    if (!activity) {
      return res.status(404).json({ message: "ไม่พบกิจกรรมนี้" });
    }
    res.json(activity);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});

// 3. POST: เพิ่มกิจกรรมใหม่ (Create)
// ใช้ตอน: ฟอร์ม "สร้างกิจกรรม"
app.post('/api/activities', protect, async (req: Request, res: Response) => {
  try {
    // รับข้อมูลจากหน้าบ้าน (req.body) แล้วสร้างลง DB
    const newActivity = new Activity(req.body);
    const savedActivity = await newActivity.save();
    res.status(201).json(savedActivity); // ส่งตัวที่สร้างเสร็จกลับไป
  } catch (error) {
    res.status(400).json({ message: "บันทึกไม่สำเร็จ ตรวจสอบข้อมูลให้ถูกต้อง" });
  }
});
// POST: จองกิจกรรม (ต้อง Login ก่อน)
app.post('/api/activities/:id/join', protect, async (req: Request, res: Response) => {
  const activityId = req.params.id;
  const userId = req.user.id; // ได้มาจาก protect middleware

  try {
    // 1. หา Activity ที่จะจอง
    const activity = await Activity.findById(activityId);
    if (!activity) return res.status(404).json({ message: "ไม่พบกิจกรรม" });

    // 2. เช็คว่า "เต็มหรือยัง"
    if (activity.currentParticipants >= activity.maxParticipants) {
      return res.status(400).json({ message: "กิจกรรมนี้คนเต็มแล้วครับ/ค่ะ" });
    }

    // 3. เช็คว่า "เคยจองไปหรือยัง"
    const existingBooking = await Booking.findOne({ user: userId, activity: activityId });
    if (existingBooking) {
      return res.status(400).json({ message: "คุณจองกิจกรรมนี้ไปแล้ว" });
    }

    // 4. สร้างใบจอง (Booking)
    await Booking.create({
      user: userId,
      activity: activityId
    });

    // 5. อัปเดตจำนวนคนใน Activity (+1)
    activity.currentParticipants += 1;
    await activity.save();

    res.status(200).json({ message: "จองกิจกรรมสำเร็จ! เตรียมตัวมาร่วมงานได้เลย" });

  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});

// GET: ดูกิจกรรมที่ "ฉัน" จองไว้ (My History)
app.get('/api/my-bookings', protect, async (req: Request, res: Response) => {
  try {
    // หาใบจองของฉัน และ "populate" (ดึงไส้ใน) ข้อมูล Activity มาโชว์ด้วย
    const bookings = await Booking.find({ user: req.user.id })
                                  .populate('activity') // เชื่อมไปเอาข้อมูลกิจกรรมมา
                                  .sort({ bookedAt: -1 }); // เอาอันที่จองล่าสุดขึ้นก่อน

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});

// 4. PUT: แก้ไขกิจกรรม (Update)
// ใช้ตอน: แก้ไขข้อมูลกิจกรรม
app.put('/api/activities/:id', protect, async (req: Request, res: Response) => {
  try {
    // ค้นหาด้วย ID แล้วแก้ข้อมูลตาม req.body
    const updatedActivity = await Activity.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true } // option นี้บอกว่าให้ส่งข้อมูลใหม่ที่แก้แล้วกลับมา
    );
    
    if (!updatedActivity) {
      return res.status(404).json({ message: "ไม่พบกิจกรรมที่จะแก้ไข" });
    }
    res.json(updatedActivity);
  } catch (error) {
    res.status(400).json({ message: "แก้ไขไม่สำเร็จ" });
  }
});

// 5. DELETE: ลบกิจกรรม (Delete)
// ใช้ตอน: กดปุ่มลบกิจกรรม
app.delete('/api/activities/:id', protect, async (req: Request, res: Response) => {
  try {
    const deletedActivity = await Activity.findByIdAndDelete(req.params.id);
    
    if (!deletedActivity) {
      return res.status(404).json({ message: "ไม่พบกิจกรรมที่จะลบ" });
    }
    res.json({ message: "ลบกิจกรรมเรียบร้อยแล้ว" });
  } catch (error) {
    res.status(500).json({ message: "ลบไม่สำเร็จ" });
  }
});
app.delete('/api/activities/:id/join', protect, async (req: Request, res: Response) => {
  const activityId = req.params.id;
  const userId = req.user.id;

  try {
    // 1. หาและลบใบจอง (Booking)
    const booking = await Booking.findOneAndDelete({ user: userId, activity: activityId });
    
    if (!booking) {
      return res.status(400).json({ message: "คุณยังไม่ได้จองกิจกรรมนี้ครับ" });
    }

    // 2. ลดจำนวนคนลง 1 (แต่ห้ามต่ำกว่า 0)
    const activity = await Activity.findById(activityId);
    if (activity) {
      activity.currentParticipants = Math.max(0, activity.currentParticipants - 1);
      await activity.save();
    }

    res.json({ message: "ยกเลิกการจองสำเร็จครับ" });

  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});

// =======================================================

// Start Server
app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  await connectDB();
});