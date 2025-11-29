import { Link, useNavigate } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();
  // เช็คว่ามี Token ในเครื่องไหม (แปลว่า Login อยู่หรือเปล่า)
  const token = localStorage.getItem('token'); 
  const role = localStorage.getItem('role');
  const handleLogout = () => {
    // ลบกุญแจทิ้งเพื่อออกจากระบบ
    localStorage.removeItem('token'); 
    localStorage.removeItem('role');
    // ดีดกลับไปหน้า Login
    navigate('/login'); 
    // รีเฟรชหน้าเว็บ 1 ทีเพื่อให้ Navbar อัปเดตสถานะ
    window.location.reload(); 
  };

  return (
    <div className="navbar bg-base-100 shadow-md px-4 sticky top-0 z-50">
      <div className="flex-1">
        {/* กดโลโก้แล้วกลับหน้าแรก */}
        <Link to="/" className="btn btn-ghost normal-case text-xl text-[#f77a45] gap-2">
          👴👵 <span className="hidden sm:inline">คอมมูนิตี้วัยเก๋า</span>
        </Link>
        <Link to="/marketplace" className="btn btn-ghost btn-sm ml-16">
        🛍️ ตลาดนัด
        </Link>
      </div>
      <div className="flex-none gap-3">
        {role === 'admin' && (
        <Link to="/admin/dashboard" className="btn btn-warning btn-sm text-white">
        🛠️ จัดการระบบ
        </Link>
        )}
        {token ? (
          // --- กรณี Login แล้ว โชว์ปุ่มเหล่านี้ ---
          <>
            <Link to="/my-bookings" className="btn btn-ghost btn-sm">
              🎫 การจองของฉัน
            </Link>
            <button onClick={handleLogout} className="btn btn-outline btn-error btn-sm">
              ออกจากระบบ
            </button>
          </>
        ) : (
          // --- กรณี "ยังไม่" Login โชว์ปุ่มเหล่านี้ ---
          <>
            <Link to="/login" className="btn btn-ghost btn-sm">
              เข้าสู่ระบบ
            </Link>
            <Link to="/register" className="btn bg-[#38a89d] hover:bg-[#2b857c] border-none text-white btn-sm">
              สมัครสมาชิก
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

export default Navbar;