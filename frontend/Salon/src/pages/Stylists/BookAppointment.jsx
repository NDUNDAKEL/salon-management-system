import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';
import axios from '../../api/axios';
import { useNavigate, useParams } from 'react-router-dom';

const BookAppointment = () => {
  const { stylistId } = useParams();
  const [stylist, setStylist] = useState(null);
  const [serviceId, setServiceId] = useState('');
  const [dateTime, setDateTime] = useState('');
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStylist = async () => {
      const res = await axios.get(`/salon/stylists/${stylistId}`);
      setStylist(res.data);
    };
    fetchStylist();
  }, [stylistId]);

  const book = async () => {
    try {
      await axios.post(
        `/customer/customers/${user.id}/appointments`,
        {
          stylist_id: stylistId,
          service_id: serviceId,
          appointment_date: dateTime,
        },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      alert('Appointment booked!');
      navigate('/appointments');
    } catch (err) {
      alert(err.response?.data?.error || 'Booking failed');
    }
  };

  if (!stylist) return <p className="p-6">Loading stylist...</p>;

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Book with {stylist.name}</h1>
      <select
        className="border p-2 mb-2 w-full"
        value={serviceId}
        onChange={(e) => setServiceId(e.target.value)}
      >
        <option value="">Select a service</option>
        {stylist.services.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
      <input
        type="datetime-local"
        className="border p-2 w-full mb-2"
        value={dateTime}
        onChange={(e) => setDateTime(e.target.value)}
      />
      <button onClick={book} className="bg-blue-500 text-white px-4 py-2">
        Book
      </button>
    </div>
  );
};

export default BookAppointment;
