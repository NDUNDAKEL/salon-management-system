import { useState, useEffect } from 'react';
import axios from '../../api/axios';

export default function ServiceForm() {
  const [name, setName] = useState('');
  const [salonId, setSalonId] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState('');
  const [salons, setSalons] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    axios.get('/admin/salons', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
      .then(res => setSalons(res.data));
  }, []);

  const submit = async e => {
    e.preventDefault();
    try {
      await axios.post('/admin/services', { name, salon_id: salonId, description, price, duration }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setMessage('Service created!');
      setName(''); setDescription(''); setPrice(''); setDuration(''); setSalonId('');
    } catch (err) {
      setMessage(err.response?.data?.error || 'Creation failed');
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Create Service</h2>
      {message && <p className="mb-2">{message}</p>}
      <form onSubmit={submit} className="space-y-4">
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Name" className="w-full border p-2" />
        <select value={salonId} onChange={e => setSalonId(e.target.value)} className="w-full border p-2">
          <option value="">Select Salon</option>
          {salons.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description" className="w-full border p-2" />
        <input value={price} onChange={e => setPrice(e.target.value)} placeholder="Price" type="number" className="w-full border p-2" />
        <input value={duration} onChange={e => setDuration(e.target.value)} placeholder="Duration (min)" type="number" className="w-full border p-2" />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2">Create Service</button>
      </form>
    </div>
  );
}
