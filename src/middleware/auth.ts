import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// ขยาย Type ของ Request ให้รองรับ user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const protect = (req: Request, res: Response, next: NextFunction) => {
  // 1. ดึง Token จาก Header
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  try {
    // 2. ตรวจสอบ Token ว่าถูกต้องไหม
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    req.user = decoded;
    next(); // ผ่านไปทำคำสั่งถัดไปได้
  } catch (error) {
    res.status(401).json({ message: "Token is not valid" });
  }
};