import React, { useState } from 'react';
import { Calendar, Clock, MapPin, Video, Trash2, Plus, CalendarX } from 'lucide-react';
import { useUser } from '../../context/UserContext';
import './Appointments.css';

const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];

const Appointments = () => {
    const { appointments, addAppointment, deleteAppointment } = useUser();
    const [filter, setFilter] = useState('upcoming');
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ doctor: '', specialty: '', date: '', time: '', type: 'In-Person', location: '' });

    const today = new Date().toISOString().split('T')[0];

    const sorted = [...appointments].sort((a, b) => new Date(a.date) - new Date(b.date));
    const filtered = sorted.filter(a => {
        if (filter === 'upcoming') return a.date >= today;
        return a.date < today;
    });

    const handleAdd = () => {
        if (!form.doctor || !form.date) return;
        addAppointment({
            doctor: form.doctor,
            specialty: form.specialty || 'General Physician',
            date: form.date,
            time: form.time || '09:00 AM',
            type: form.type,
            location: form.type === 'Video Call' ? 'Online' : (form.location || 'City Clinic'),
        });
        setShowModal(false);
        setForm({ doctor: '', specialty: '', date: '', time: '', type: 'In-Person', location: '' });
    };

    const formatTime = (t) => {
        if (!t) return '';
        const [h, m] = t.split(':');
        const hr = parseInt(h);
        return `${hr > 12 ? hr - 12 : hr || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;
    };

    const getDateParts = (dateStr) => {
        const d = new Date(dateStr + 'T00:00:00');
        return { day: d.getDate(), month: MONTHS[d.getMonth()], year: d.getFullYear() };
    };

    return (
        <div className="appointments-container fade-in">
            {/* Header */}
            <div className="appts-header">
                <div>
                    <h1>Appointments</h1>
                    <p>Manage your doctor visits and consultations.</p>
                </div>
                <button className="primary-btn" onClick={() => setShowModal(true)}>
                    <Plus size={20} /> Add Appointment
                </button>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay fade-in" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
                    <div className="date-picker-modal glass-panel">
                        <h3>Schedule Appointment</h3>
                        <div className="modal-form-grid">
                            <div className="form-group">
                                <label>Doctor Name *</label>
                                <input type="text" placeholder="e.g. Dr. Smith" value={form.doctor}
                                    onChange={e => setForm({ ...form, doctor: e.target.value })} className="text-input" />
                            </div>
                            <div className="form-group">
                                <label>Specialty</label>
                                <input type="text" placeholder="e.g. Cardiologist" value={form.specialty}
                                    onChange={e => setForm({ ...form, specialty: e.target.value })} className="text-input" />
                            </div>
                            <div className="form-group">
                                <label>Date *</label>
                                <input type="date" min={today} value={form.date}
                                    onChange={e => setForm({ ...form, date: e.target.value })} className="date-input" />
                            </div>
                            <div className="form-group">
                                <label>Time</label>
                                <input type="time" value={form.time}
                                    onChange={e => setForm({ ...form, time: e.target.value })} className="date-input" />
                            </div>
                            <div className="form-group">
                                <label>Type</label>
                                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="select-input">
                                    <option value="In-Person">In-Person</option>
                                    <option value="Video Call">Video Call</option>
                                </select>
                            </div>
                            {form.type !== 'Video Call' && (
                                <div className="form-group">
                                    <label>Clinic / Location</label>
                                    <input type="text" placeholder="e.g. City Heart Center" value={form.location}
                                        onChange={e => setForm({ ...form, location: e.target.value })} className="text-input" />
                                </div>
                            )}
                        </div>
                        <div className="modal-actions">
                            <button className="secondary-btn" onClick={() => setShowModal(false)}>Cancel</button>
                            <button className="primary-btn" onClick={handleAdd} disabled={!form.date || !form.doctor}>
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="appt-tabs-wrap">
                {['upcoming', 'past'].map(tab => (
                    <button
                        key={tab}
                        className={`appt-tab ${filter === tab ? 'appt-tab--active' : ''}`}
                        onClick={() => setFilter(tab)}
                    >
                        {tab === 'upcoming' ? '🗓️ Upcoming' : '📋 Past'}
                        <span className="tab-count">
                            {tab === 'upcoming'
                                ? sorted.filter(a => a.date >= today).length
                                : sorted.filter(a => a.date < today).length}
                        </span>
                    </button>
                ))}
            </div>

            {/* List */}
            <div className="appointments-list">
                {filtered.length > 0 ? (
                    filtered.map(appt => {
                        const { day, month } = getDateParts(appt.date);
                        const isPast = appt.date < today;
                        return (
                            <div key={appt.id} className={`appt-card glass-panel fade-in ${isPast ? 'appt-past' : ''}`}>
                                <div className="appt-date-box">
                                    <span className="day">{day}</span>
                                    <span className="month">{month}</span>
                                </div>
                                <div className="appt-info">
                                    <div className="appt-main-info">
                                        <h3>{appt.doctor}</h3>
                                        <span className="specialty">{appt.specialty}</span>
                                    </div>
                                    <div className="appt-meta">
                                        <div className="meta-item">
                                            <Clock size={14} /> {formatTime(appt.time) || appt.time}
                                        </div>
                                        <div className="meta-item">
                                            {appt.type === 'Video Call' ? <Video size={14} /> : <MapPin size={14} />}
                                            {appt.location}
                                        </div>
                                    </div>
                                </div>
                                <div className="appt-actions">
                                    <span className={`status-pill ${isPast ? 'completed' : 'upcoming'}`}>
                                        {isPast ? 'Completed' : 'Upcoming'}
                                    </span>
                                    <button className="more-btn delete-btn" onClick={() => deleteAppointment(appt.id)} title="Delete">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="empty-state glass-panel">
                        <CalendarX size={48} style={{ color: '#34d399', marginBottom: '1rem' }} />
                        <h3>No {filter} appointments</h3>
                        <p>{filter === 'upcoming'
                            ? 'Click "Add Appointment" to schedule your first visit.'
                            : 'Your past appointments will appear here.'}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Appointments;
