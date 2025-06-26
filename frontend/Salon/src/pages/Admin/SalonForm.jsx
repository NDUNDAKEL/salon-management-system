import { useState } from 'react';
import axios from '../../api/axios';

export default function SalonForm() {
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [contact, setContact] = useState('');
  const [message, setMessage] = useState('');

  const submit = async e => {
    e.preventDefault();
    try {
      await axios.post('/admin/salons', { name, location, contact }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setMessage('Salon created!');
      setName(''); setLocation(''); setContact('');
    } catch (err) {
      setMessage(err.response?.data?.error || 'Creation failed');
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Create New Salon</h2>
      {message && <p className="mb-2">{message}</p>}
      <form onSubmit={submit} className="space-y-4">
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Name" className="w-full border p-2" />
        <input value={location} onChange={e => setLocation(e.target.value)} placeholder="Location" className="w-full border p-2" />
        <input value={contact} onChange={e => setContact(e.target.value)} placeholder="Contact" className="w-full border p-2" />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2">Create Salon</button>
      </form>
    </div>
  );
}
