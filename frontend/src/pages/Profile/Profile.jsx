import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Edit2, Shield, Bell, Moon, LogOut } from 'lucide-react';
import { useUser } from '../../context/UserContext';
import './Profile.css';

const Profile = () => {
    const { user, updateUser } = useUser();
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState(user);

    // Update formData when user from context changes or when editing starts/stops
    useEffect(() => {
        setFormData(user);
    }, [user, isEditing]); // Added isEditing to dependency array to reset formData on cancel

    const handleSave = () => {
        updateUser(formData);
        setIsEditing(false);
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleMedicalUpdate = (field, value) => {
        const updated = { ...formData, [field]: value };
        setFormData(updated);
        updateUser(updated);
    };

    return (
        <div className="profile-container fade-in">
            {/* Profile Header Card */}
            <div className="profile-header-card">
                <div className="header-cover-gradient"></div>
                <div className="header-info-bar">
                    <div className="header-content-wrapper">
                        <div className="profile-avatar-container">
                            <div className="big-avatar">
                                {user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                            </div>
                        </div>

                        <div className="profile-text-info">
                            <h1>{user.name}</h1>
                            <p>Premium Member</p>
                        </div>

                        <button className="edit-profile-btn" onClick={() => setIsEditing(true)}>
                            <Edit2 size={16} /> Edit Profile
                        </button>
                    </div>
                </div>
            </div>

            {/* Edit Profile Modal */}
            {isEditing && (
                <div className="modal-overlay fade-in">
                    <div className="edit-modal glass-panel slide-up">
                        <div className="modal-header">
                            <h2>Edit Profile</h2>
                            <button className="close-btn" onClick={() => setIsEditing(false)}>
                                <LogOut size={20} style={{ transform: 'rotate(180deg)' }} />
                            </button>
                        </div>

                        <div className="modal-scroll-content">
                            <div className="form-section">
                                <h3>Personal Details</h3>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>Full Name</label>
                                        <input name="name" value={formData.name} onChange={handleChange} />
                                    </div>
                                    <div className="form-group">
                                        <label>Email</label>
                                        <input name="email" value={formData.email} disabled className="disabled" />
                                    </div>
                                    <div className="form-group">
                                        <label>Phone</label>
                                        <input name="phone" value={formData.phone} onChange={handleChange} />
                                    </div>
                                    <div className="form-group">
                                        <label>Address</label>
                                        <input name="address" value={formData.address} onChange={handleChange} />
                                    </div>
                                </div>
                            </div>

                            <div className="form-section">
                                <h3>Health Metrics</h3>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>Age</label>
                                        <input name="age" type="number" value={formData.age} onChange={handleChange} />
                                    </div>
                                    <div className="form-group">
                                        <label>Blood Group</label>
                                        <select name="bloodGroup" value={formData.bloodGroup} onChange={handleChange}>
                                            <option value="A+">A+</option>
                                            <option value="A-">A-</option>
                                            <option value="B+">B+</option>
                                            <option value="B-">B-</option>
                                            <option value="O+">O+</option>
                                            <option value="O-">O-</option>
                                            <option value="AB+">AB+</option>
                                            <option value="AB-">AB-</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Height (cm)</label>
                                        <input name="height" value={formData.height} onChange={handleChange} />
                                    </div>
                                    <div className="form-group">
                                        <label>Weight (kg)</label>
                                        <input name="weight" value={formData.weight} onChange={handleChange} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button className="secondary-btn" onClick={() => setIsEditing(false)}>Cancel</button>
                            <button className="primary-btn" onClick={handleSave}>Save Changes</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="profile-content">
                {/* Left Column: Personal Info */}
                <div className="info-column">
                    <div className="section-card glass-panel">
                        <div className="section-header">
                            <h3>Personal Information</h3>
                        </div>

                        <div className="info-list">
                            <div className="info-item">
                                <label><User size={16} /> Full Name</label>
                                <p>{user.name}</p>
                            </div>

                            <div className="info-item">
                                <label><Mail size={16} /> Email</label>
                                <p>{user.email}</p>
                            </div>

                            <div className="info-item">
                                <label><Phone size={16} /> Phone</label>
                                <p>{user.phone}</p>
                            </div>

                            <div className="info-item">
                                <label><MapPin size={16} /> Address</label>
                                <p>{user.address}</p>
                            </div>
                        </div>
                    </div>

                    <div className="section-card glass-panel">
                        <h3>Medical Essentials</h3>
                        <div className="medical-stats">
                            <div className="stat-box stat-input">
                                <span className="label">Age</span>
                                <input
                                    type="number"
                                    placeholder="Age"
                                    value={formData.age}
                                    onChange={(e) => handleMedicalUpdate('age', e.target.value)}
                                />
                            </div>
                            <div className="stat-box stat-input">
                                <span className="label">Blood</span>
                                <select
                                    name="bloodGroup"
                                    value={formData.bloodGroup}
                                    onChange={(e) => handleMedicalUpdate('bloodGroup', e.target.value)}
                                >
                                    <option value="">Select</option>
                                    <option value="A+">A+</option>
                                    <option value="A-">A-</option>
                                    <option value="B+">B+</option>
                                    <option value="B-">B-</option>
                                    <option value="O+">O+</option>
                                    <option value="O-">O-</option>
                                    <option value="AB+">AB+</option>
                                    <option value="AB-">AB-</option>
                                </select>
                            </div>
                            <div className="stat-box stat-input">
                                <span className="label">Height</span>
                                <input
                                    type="text"
                                    placeholder="Height (cm)"
                                    value={formData.height}
                                    onChange={(e) => handleMedicalUpdate('height', e.target.value)}
                                />
                            </div>
                            <div className="stat-box stat-input">
                                <span className="label">Weight</span>
                                <input
                                    type="text"
                                    placeholder="Weight (kg)"
                                    value={formData.weight}
                                    onChange={(e) => handleMedicalUpdate('weight', e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Settings */}
                <div className="settings-column">
                    <div className="section-card glass-panel">
                        <h3>App Settings</h3>

                        <div className="setting-item">
                            <div className="setting-info">
                                <Bell size={20} />
                                <div>
                                    <h4>Notifications</h4>
                                    <p>Receive health reminders</p>
                                </div>
                            </div>
                            <label className="switch">
                                <input type="checkbox" defaultChecked />
                                <span className="slider round"></span>
                            </label>
                        </div>

                        <div className="setting-item">
                            <div className="setting-info">
                                <Moon size={20} />
                                <div>
                                    <h4>Dark Mode</h4>
                                    <p>Easier on the eyes</p>
                                </div>
                            </div>
                            <label className="switch">
                                <input type="checkbox" defaultChecked />
                                <span className="slider round"></span>
                            </label>
                        </div>

                        <div className="setting-item">
                            <div className="setting-info">
                                <Shield size={20} />
                                <div>
                                    <h4>Privacy Mode</h4>
                                    <p>Blur sensitive data</p>
                                </div>
                            </div>
                            <label className="switch">
                                <input type="checkbox" />
                                <span className="slider round"></span>
                            </label>
                        </div>

                        <button className="logout-btn">
                            <LogOut size={18} /> Log Out
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
