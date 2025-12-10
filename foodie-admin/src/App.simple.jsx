// Version đơn giản để test
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function SimpleDashboard() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ color: '#FF4D4D', fontSize: '32px', marginBottom: '20px' }}>
        Foodie Admin Dashboard
      </h1>
      <p style={{ fontSize: '16px', color: '#333' }}>
        Nếu bạn thấy dòng này, React đang hoạt động!
      </p>
      <div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#f0f0f0', borderRadius: '8px' }}>
        <h2>Thông tin:</h2>
        <ul>
          <li>Backend: http://localhost:8080</li>
          <li>Frontend: http://localhost:5173</li>
          <li>Status: Đang kiểm tra...</li>
        </ul>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<SimpleDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;

