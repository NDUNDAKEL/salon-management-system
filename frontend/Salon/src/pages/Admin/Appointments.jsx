import { useEffect, useState } from 'react';
import axios from 'axios';
import { FaSpinner, FaTrashAlt, FaEdit } from 'react-icons/fa';
import { toast } from 'react-toastify';

export default function AdminAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
const token = localStorage.getItem('token');

  const loadAdminAppointments = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`https://salon-management-system-2.onrender.com/api/customer/customers/admin/appointments`, {
    
      });
      setAppointments(response.data);
    } catch (err) {
      toast.error('Failed to load appointments');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const deleteAppointment = async (appointmentId) => {
    try {
   await axios.delete(
  `https://salon-management-system-2.onrender.com/api/customer/admin/appointments/${appointmentId}`,
  {
    headers: {
      Authorization: `Bearer ${token}`
    },
    
  }
);

      toast.success('Appointment deleted');
      loadAdminAppointments(); // refresh
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete');
      console.error(err);
    }
  };

  useEffect(() => {
    loadAdminAppointments();
  }, []);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">All Appointments (Admin)</h2>

      {loading ? (
        <div className="flex justify-center py-10">
          <FaSpinner className="animate-spin text-3xl text-purple-600" />
        </div>
      ) : appointments.length === 0 ? (
        <div className="text-center text-gray-500 py-6">No appointments found.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stylist</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {appointments.map(app => {
                const date = app.appointment_date ? new Date(app.appointment_date) : null;
                const time = app.start_datetime ? new Date(app.start_datetime) : null;

                return (
                  <tr key={app.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{date ? date.toLocaleDateString() : '--'}</div>
                      <div className="text-sm text-gray-500">{time ? time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{app.service}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{app.stylist}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        app.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                        app.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => deleteAppointment(app.id)}
                        className="text-red-600 hover:text-red-800 mr-4"
                      >
                        <FaTrashAlt />
                      </button>
                      <button
                        onClick={() => openEditModal(app)} // implement this if needed
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <FaEdit />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
