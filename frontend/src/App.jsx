import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard/Dashboard';
import Chatbot from './pages/Chat/Chatbot';
import Appointments from './pages/Appointments/Appointments';
import SymptomChecker from './pages/Symptoms/SymptomChecker';
import DietPlanner from './pages/Diet/DietPlanner';
import ReportScanner from './pages/Reports/ReportScanner';
import Profile from './pages/Profile/Profile';
import MentalHealth from './pages/MentalHealth/MentalHealth';
import Login from './pages/Auth/Login';

import { UserProvider, useUser } from './context/UserContext';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useUser();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <UserProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="chat" element={<Chatbot />} />
            <Route path="appointments" element={<Appointments />} />
            <Route path="symptoms" element={<SymptomChecker />} />
            <Route path="diet" element={<DietPlanner />} />
            <Route path="reports" element={<ReportScanner />} />
            <Route path="scan-report" element={<ReportScanner />} />
            <Route path="profile" element={<Profile />} />
            <Route path="mental-health" element={<MentalHealth />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </UserProvider>
  );
}

export default App;