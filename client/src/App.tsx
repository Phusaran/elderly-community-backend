import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ActivityDetail from './pages/ActivityDetail'; // <--- 1. Import มา

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-base-200 font-sans pb-10">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* 2. เพิ่มบรรทัดนี้ลงไป (Route แบบมี Parameter) */}
          <Route path="/activities/:id" element={<ActivityDetail />} />
          
        </Routes>
      </div>
    </Router>
  );
}

export default App;