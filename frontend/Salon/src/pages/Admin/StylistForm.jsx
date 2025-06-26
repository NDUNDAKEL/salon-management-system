import { useState, useEffect } from 'react';
import axios from '../../api/axios';

export default function StylistForm() {
  const [name, setName] = useState('');
  const [salonId, setSalonId] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [serviceIds, setServiceIds] = useState([]);
  const [salons, setSalons] = useState([]);
  const [services, setServices] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    axios.get('/admin/salons', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
      .then(res => setSalons(res.data));
    axios.get('/admin/services', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
      .then(res => setServices(res.data));
  }, []);

  const toggleService = id => {
    setServiceIds(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const submit = async e => {
    e.preventDefault();
    try {
      await axios.post('/admin/stylists', {
        name, salon_id: salonId, specialization, service_ids: serviceIds
      }, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      setMessage('Stylist created!');
      setName(''); setSpecialization(''); setServiceIds([]);
    } catch (err) {
      setMessage(err.response?.data?.error || 'Creation failed');
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Create Stylist</h2>
      {message && <p className="mb-2">{message}</p>}
      <form onSubmit={submit} className="space-y-4">
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Name" className="w-full border p-2" />
        <select value={salonId} onChange={e => setSalonId(e.target.value)} className="w-full border p-2">
          <option value="">Select Salon</option>
          {salons.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <input value={specialization} onChange={e => setSpecialization(e.target.value)} placeholder="Specialization" className="w-full border p-2" />
        <div>
          <p className="font-semibold mb-2">Services:</p>
          {services.map(s => (
            <label key={s.id} className="inline-flex items-center mr-2">
              <input type="checkbox" checked={serviceIds.includes(s.id)} onChange={() => toggleService(s.id)} className="mr-1" />
              {s.name}
            </label>
          ))}
        </div>
        <button type="submit" className="bg-blue-600 text-white px-4 py-2">Create Stylist</button>
      </form>
    </div>
  );
}
