import { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import ServiceList from './ShowServices';

const API_URL = 'http://127.0.0.1:5000/api';

export default function ServiceForm() {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    category: '',
    description: '',
    duration: '',
    price: '',
    salon_id: 1,         // Default to salon with ID 1
    is_active: true
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API_URL}/salon/services`, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      toast.success('Service added successfully');
      setFormData({
        name: '',
        slug: '',
        category: '',
        description: '',
        duration: '',
        price: '',
        salon_id: 1,
        is_active: true
      });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Creation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto bg-white rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-purple-700">Add New Service</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Service Name"
          required
          className="w-full border px-4 py-2 rounded"
        />
        <input
          name="slug"
          value={formData.slug}
          onChange={handleChange}
          placeholder="Unique Slug"
          required
          className="w-full border px-4 py-2 rounded"
        />
        <input
          name="category"
          value={formData.category}
          onChange={handleChange}
          placeholder="Category (e.g., Hair, Nails)"
          className="w-full border px-4 py-2 rounded"
        />
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Description"
          className="w-full border px-4 py-2 rounded"
        />
        <input
          name="price"
          type="number"
          value={formData.price}
          onChange={handleChange}
          placeholder="Price (KSh)"
          className="w-full border px-4 py-2 rounded"
        />
        <input
          name="duration"
          type="number"
          value={formData.duration}
          onChange={handleChange}
          placeholder="Duration (minutes)"
          className="w-full border px-4 py-2 rounded"
        />

        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            name="is_active"
            checked={formData.is_active}
            onChange={handleChange}
          />
          <span>Active</span>
        </label>

        <button
          type="submit"
          disabled={loading}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded w-full"
        >
          {loading ? 'Creating...' : 'Create Service'}
        </button>
      </form>
     
    </div>
  );
}
