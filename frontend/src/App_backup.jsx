import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard/Dashboard';
import Chatbot from './pages/Chat/Chatbot';
import Appointments from './pages/Appointments/Appointments';
import SymptomChecker from './pages/Symptoms/SymptomChecker';
import DietPlanner from './pages/Diet/DietPlanner';
import ReportScanner from './pages/Reports/ReportScanner';
import Profile from './pages/Profile/Profile';

import { UserProvider } from './context/UserContext';

function App() {
  return (
    <UserProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="chat" element={<Chatbot />} />
            <Route path="appointments" element={<Appointments />} />
            <Route path="symptoms" element={<SymptomChecker />} />
            <Route path="diet" element={<DietPlanner />} />
            <Route path="reports" element={<ReportScanner />} />
            <Route path="profile" element={<Profile />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </UserProvider>
  );
}

export default App;
