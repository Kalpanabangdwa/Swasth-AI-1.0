import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Activity,
    Droplets,
    Moon,
    Flame,
    Calendar,
    ArrowRight,
    TrendingUp,
    AlertCircle
} from 'lucide-react';
import { useUser } from '../../context/UserContext';
import './Dashboard.css';

const Dashboard = () => {
    const { user } = useUser();
    const navigate = useNavigate();

    return (
        <div className="dashboard-container fade-in">
            {/* Welcome Section */}
            <section className="welcome-banner glass-panel">
                <div className="welcome-text">
                    <h1>Good Morning, {user.name.split(' ')[0]}! 👋</h1>
                    <p>Your health is looking great today. You've completed 75% of your weekly goals.</p>
                </div>
                <div className="health-score">
                    <svg viewBox="0 0 36 36" className="circular-chart">
                        <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        <path className="circle" strokeDasharray="85, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        <text x="18" y="20.35" className="percentage">85</text>
                    </svg>
                    <span>Health Score</span>
                </div>
            </section>

            {/* Vitals Grid Removed as per user request */}
            <div style={{ marginBottom: '2rem' }}></div>

            {/* Main Content Grid */}
            <div className="main-grid">
                {/* Upcoming Appointments */}
                <div className="section-card glass-panel">
                    <div className="section-header">
                        <h2>Upcoming Appointments</h2>
                        <button className="view-all" onClick={() => navigate('/appointments')}>View All</button>
                    </div>
                    <div className="appointment-list">
                        <div className="appointment-item" onClick={() => navigate('/appointments')} style={{ cursor: 'pointer' }}>
                            <div className="date-box">
                                <span className="day">12</span>
                                <span className="month">OCT</span>
                            </div>
                            <div className="appt-details">
                                <h4>Dr. Sarah Wilson</h4>
                                <p>Cardiologist • General Checkup</p>
                            </div>
                            <div className="time-badge">
                                10:00 AM
                            </div>
                        </div>

                        <div className="appointment-item" onClick={() => navigate('/appointments')} style={{ cursor: 'pointer' }}>
                            <div className="date-box">
                                <span className="day">18</span>
                                <span className="month">OCT</span>
                            </div>
                            <div className="appt-details">
                                <h4>Dr. Abebe Bikila</h4>
                                <p>Dentist • Cleaning</p>
                            </div>
                            <div className="time-badge">
                                2:30 PM
                            </div>
                        </div>
                    </div>
                    <button className="action-btn" onClick={() => navigate('/appointments')}>
                        <Calendar size={18} /> Schedule New
                    </button>
                </div>

                {/* Action Center */}
                <div className="section-card glass-panel">
                    <div className="section-header">
                        <h2>Quick Actions</h2>
                    </div>
                    <div className="actions-grid">
                        <div className="action-card" onClick={() => navigate('/symptoms')}>
                            <div className="action-icon symptoms">
                                <AlertCircle size={28} />
                            </div>
                            <h3>Check Symptoms</h3>
                            <p>Feeling unwell? Run a quick check.</p>
                            <ArrowRight className="arrow" size={20} />
                        </div>

                        <div className="action-card" onClick={() => navigate('/reports')}>
                            <div className="action-icon reports">
                                <Activity size={28} />
                            </div>
                            <h3>Scan Report</h3>
                            <p>Analyze medical records instantly.</p>
                            <ArrowRight className="arrow" size={20} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
