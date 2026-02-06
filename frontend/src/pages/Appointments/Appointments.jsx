import React, { useState } from 'react';
import { Calendar, Clock, MapPin, Video, MoreVertical, Plus } from 'lucide-react';
import './Appointments.css';

const INITIAL_APPOINTMENTS = [
    {
        id: 1,
        doctor: "Dr. Sarah Wilson",
        specialty: "Cardiologist",
        date: "2026-10-12",
        time: "10:00 AM",
        type: "In-Person",
        location: "City Heart Center",
        status: "Upcoming"
    },
    {
        id: 2,
        doctor: "Dr. Abebe Bikila",
        specialty: "Dentist",
        date: "2026-10-18",
        time: "02:30 PM",
        type: "In-Person",
        location: "Smile Dental Clinic",
        status: "Upcoming"
    },
    {
        id: 3,
        doctor: "Dr. Emily Chen",
        specialty: "Dermatologist",
        date: "2026-10-05",
        time: "11:00 AM",
        type: "Video Call",
        location: "Online",
        status: "Completed"
    }
];

const Appointments = () => {
    const [filter, setFilter] = useState('upcoming');
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [selectedDate, setSelectedDate] = useState('');

    // New Form State
    const [newApptForm, setNewApptForm] = useState({
        doctor: '',
        specialty: '',
        time: '',
        type: 'In-Person'
    });

    const [appointments, setAppointments] = useState(INITIAL_APPOINTMENTS);

    const filteredAppointments = appointments.filter(appt => {
        if (filter === 'upcoming') return appt.status === 'Upcoming';
        if (filter === 'past') return appt.status === 'Completed';
        return true;
    });

    const handleAddAppointment = () => {
        if (!selectedDate || !newApptForm.doctor) return;

        const newAppt = {
            id: Date.now(),
            doctor: newApptForm.doctor,
            specialty: newApptForm.specialty || 'General Physician',
            date: selectedDate,
            time: newApptForm.time || '09:00 AM', // Default if empty
            type: newApptForm.type,
            location: newApptForm.type === 'Video Call' ? 'Online' : 'City Clinic',
            status: "Upcoming"
        };

        setAppointments([...appointments, newAppt]);
        setShowDatePicker(false);
        setSelectedDate('');

        // Reset Form
        setNewApptForm({
            doctor: '',
            specialty: '',
            time: '',
            type: 'In-Person'
        });
    };

    return (
        <div className="appointments-container fade-in">
            <div className="appts-header">
                <div>
                    <h1>Appointments</h1>
                    <p>Manage your doctor visits and consultations.</p>
                </div>
                <button
                    className="primary-btn"
                    onClick={() => setShowDatePicker(true)}
                >
                    <Plus size={20} /> Add Appointment
                </button>
            </div>

            {showDatePicker && (
                <div className="modal-overlay fade-in">
                    <div className="date-picker-modal glass-panel">
                        <h3>Schedule Appointment</h3>

                        <div className="modal-form-grid">
                            <div className="form-group">
                                <label>Date</label>
                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className="date-input"
                                />
                            </div>
                            <div className="form-group">
                                <label>Time</label>
                                <input
                                    type="time"
                                    value={newApptForm.time}
                                    onChange={(e) => setNewApptForm({ ...newApptForm, time: e.target.value })}
                                    className="date-input"
                                />
                            </div>
                            <div className="form-group">
                                <label>Doctor Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Dr. Smith"
                                    value={newApptForm.doctor}
                                    onChange={(e) => setNewApptForm({ ...newApptForm, doctor: e.target.value })}
                                    className="text-input"
                                />
                            </div>
                            <div className="form-group">
                                <label>Specialty</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Cardiologist"
                                    value={newApptForm.specialty}
                                    onChange={(e) => setNewApptForm({ ...newApptForm, specialty: e.target.value })}
                                    className="text-input"
                                />
                            </div>
                            <div className="form-group">
                                <label>Type</label>
                                <select
                                    value={newApptForm.type}
                                    onChange={(e) => setNewApptForm({ ...newApptForm, type: e.target.value })}
                                    className="select-input"
                                >
                                    <option value="In-Person">In-Person</option>
                                    <option value="Video Call">Video Call</option>
                                </select>
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button
                                className="secondary-btn"
                                onClick={() => setShowDatePicker(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className="primary-btn"
                                onClick={handleAddAppointment}
                                disabled={!selectedDate || !newApptForm.doctor}
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="tabs glass-panel">
                <button
                    className={`tab ${filter === 'upcoming' ? 'active' : ''}`}
                    onClick={() => setFilter('upcoming')}
                >
                    Upcoming
                </button>
                <button
                    className={`tab ${filter === 'past' ? 'active' : ''}`}
                    onClick={() => setFilter('past')}
                >
                    Past
                </button>
            </div>

            <div className="appointments-list">
                {filteredAppointments.length > 0 ? (
                    filteredAppointments.map(appt => (
                        <div key={appt.id} className="appt-card glass-panel fade-in">
                            <div className="appt-date-box">
                                <span className="day">{appt.date.split('-')[2]}</span>
                                <span className="month">OCT</span>
                            </div>

                            <div className="appt-info">
                                <div className="appt-main-info">
                                    <h3>{appt.doctor}</h3>
                                    <span className="specialty">{appt.specialty}</span>
                                </div>

                                <div className="appt-meta">
                                    <div className="meta-item">
                                        <Clock size={16} /> {appt.time}
                                    </div>
                                    <div className="meta-item">
                                        {appt.type === 'Video Call' ? <Video size={16} /> : <MapPin size={16} />}
                                        {appt.location}
                                    </div>
                                </div>
                            </div>

                            <div className="appt-actions">
                                <span className={`status-pill ${appt.status.toLowerCase()}`}>
                                    {appt.status}
                                </span>
                                <button className="more-btn">
                                    <MoreVertical size={20} />
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="empty-state glass-panel">
                        <Calendar size={48} />
                        <h3>No appointments found</h3>
                        <p>You don't have any appointments in this category.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Appointments;
