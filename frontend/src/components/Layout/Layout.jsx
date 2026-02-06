import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
    LayoutDashboard,
    MessageSquare,
    Calendar,
    Activity,
    Utensils,
    FileText,
    User,
    Bell,
    Heart,
    Baby
} from 'lucide-react';
import { useUser } from '../../context/UserContext';
import './Layout.css';

const Layout = () => {
    const { user } = useUser();

    return (
        <div className="layout-container">
            {/* Sidebar */}
            <aside className="sidebar">
                <div className="logo-section">
                    <div className="logo-icon">
                        <Activity size={28} />
                    </div>
                    <h1>Swasth AI</h1>
                </div>

                <nav className="nav-menu">
                    <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <LayoutDashboard size={20} />
                        <span>Dashboard</span>
                    </NavLink>
                    <NavLink to="/chat" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <MessageSquare size={20} />
                        <span>Chat Assistant</span>
                    </NavLink>
                    <NavLink to="/appointments" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <Calendar size={20} />
                        <span>Appointments</span>
                    </NavLink>
                    <NavLink to="/symptoms" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <Activity size={20} />
                        <span>Symptom Checker</span>
                    </NavLink>
                    <NavLink to="/diet" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <Utensils size={20} />
                        <span>Diet Planner</span>
                    </NavLink>
                    <NavLink to="/reports" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <FileText size={20} />
                        <span>Report Scanner</span>
                    </NavLink>
                </nav>

                <div className="bottom-menu">
                    <NavLink to="/profile" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <User size={20} />
                        <span>Profile</span>
                    </NavLink>
                    <NavLink to="/maternity" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <Baby size={20} />
                        <span>Maternity</span>
                    </NavLink>
                    <NavLink to="/mental-health" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <Heart size={20} />
                        <span>Mental Health</span>
                    </NavLink>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="main-content">
                <header className="top-header">
                    <h2 className="page-title">Welcome Back, {user.name.split(' ')[0]}</h2>
                    <div className="header-actions">
                        {/* Notifications Toggle */}
                        <div className="notification-wrapper" style={{ position: 'relative' }}>
                            <button
                                className="icon-btn"
                                onClick={() => document.getElementById('notif-dropdown').classList.toggle('show')}
                            >
                                <Bell size={20} />
                                <span className="notification-dot"></span>
                            </button>

                            {/* Simple Inline Notification Dropdown */}
                            <div id="notif-dropdown" className="notification-dropdown glass-panel" style={{
                                position: 'absolute',
                                top: '120%',
                                right: 0,
                                width: '300px',
                                padding: '1rem',
                                display: 'none',
                                flexDirection: 'column',
                                gap: '0.5rem',
                                zIndex: 100
                            }}>
                                <h4>Notifications</h4>
                                <div className="notif-item" style={{ fontSize: '0.9rem', padding: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                    <strong>Appointment Reminder</strong><br />
                                    <span style={{ fontSize: '0.8rem', color: '#ccc' }}>Dr. Sarah in 1 hour</span>
                                </div>
                                <div className="notif-item" style={{ fontSize: '0.9rem', padding: '0.5rem' }}>
                                    <strong>Report Ready</strong><br />
                                    <span style={{ fontSize: '0.8rem', color: '#ccc' }}>Blood test results analyzed</span>
                                </div>
                            </div>
                        </div>

                        {/* Profile Link */}
                        <NavLink to="/profile" className="user-avatar-link">
                            <div className="user-avatar">
                                {user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                            </div>
                        </NavLink>
                    </div>
                </header>

                <div className="content-scroll">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default Layout;
