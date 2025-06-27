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
  <div className="p-8 max-w-2xl mx-auto bg-white rounded-xl shadow-lg transition-all hover:shadow-xl">
  <div className="mb-6">
    <h2 className="text-3xl font-bold text-purple-800 mb-2">Add New Service</h2>
    <p className="text-gray-600">Fill in the details to create a new salon service</p>
  </div>

  <form onSubmit={handleSubmit} className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">Service Name *</label>
        <input
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="e.g. Blowout, Manicure"
          required
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
        />
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">Unique Slug *</label>
        <input
          name="slug"
          value={formData.slug}
          onChange={handleChange}
          placeholder="e.g. blowout-treatment"
          required
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
        />
      </div>
    </div>

    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">Category</label>
      <input
        name="category"
        value={formData.category}
        onChange={handleChange}
        placeholder="e.g. Hair, Nails, Facial"
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
      />
    </div>

    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">Description</label>
      <textarea
        name="description"
        value={formData.description}
        onChange={handleChange}
        placeholder="Detailed service description..."
        rows={3}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
      />
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">Price (KSh) *</label>
        <div className="relative">
          <span className="absolute left-3 top-3 text-gray-500">KSh</span>
          <input
            name="price"
            type="number"
            value={formData.price}
            onChange={handleChange}
            required
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">Duration *</label>
        <div className="relative">
          <input
            name="duration"
            type="number"
            value={formData.duration}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
          />
          <span className="absolute right-3 top-3 text-gray-500">mins</span>
        </div>
      </div>

      <div className="flex items-end">
        <label className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg w-full h-[52px]">
          <input
            type="checkbox"
            name="is_active"
            checked={formData.is_active}
            onChange={handleChange}
            className="h-5 w-5 text-purple-600 rounded focus:ring-purple-500"
          />
          <span className="text-sm font-medium text-gray-700">Active Service</span>
        </label>
      </div>
    </div>

    <button
      type="submit"
      disabled={loading}
      className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-all ${
        loading 
          ? 'bg-purple-400 cursor-not-allowed'
          : 'bg-purple-600 hover:bg-purple-700 shadow-md hover:shadow-lg'
      }`}
    >
      {loading ? (
        <span className="flex items-center justify-center">
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Creating...
        </span>
      ) : (
        'Create Service'
      )}
    </button>
  </form>
</div>
  );
}
