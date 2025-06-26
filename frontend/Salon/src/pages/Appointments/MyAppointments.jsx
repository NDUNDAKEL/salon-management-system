import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';
import axios from '../../api/axios';

const MyAppointments = () => {
  const { user } = useContext(AuthContext);
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    const fetch = async () => {
      const res = await axios.get(`/customer/customers/${user.id}/appointments`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setAppointments(res.data);
    };
    if (user) fetch();
  }, [user]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">My Appointments</h1>
      <ul className="space-y-3">
        {appointments.map((a) => (
          <li key={a.id} className="p-4 border rounded shadow">
            <p><strong>Salon:</strong> {a.salon}</p>
            <p><strong>Stylist:</strong> {a.stylist}</p>
            <p><strong>Service:</strong> {a.service}</p>
            <p><strong>Date:</strong> {new Date(a.appointment_date).toLocaleString()}</p>
            <p><strong>Status:</strong> {a.status}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default MyAppointments;
