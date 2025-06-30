import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaSpinner } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = 'http://127.0.0.1:5000/api';

export default function StylistForm() {
const [formData, setFormData] = useState({
  name: '',
  salon_id: '',
  specialization: '',
  bio: '',
  phone: '',     
  email: '',       
  service_ids: []
});

  const [salons, setSalons] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Create axios instance with interceptors
  const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true
  });

  // Add request interceptor
  api.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      config.headers['Content-Type'] = 'application/json';
    }
    return config;
  });

  // Add response interceptor
  api.interceptors.response.use(
    response => response,
    error => {
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        localStorage.removeItem('token');
        navigate('/login');
      }
      return Promise.reject(error);
    }
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [salonsRes, servicesRes] = await Promise.all([
          api.get('/salon/salons'),
          api.get('/salon/services')
        ]);
        setSalons(salonsRes.data);
        setServices(servicesRes.data);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleServiceToggle = (serviceId) => {
    setFormData(prev => ({
      ...prev,
      service_ids: prev.service_ids.includes(serviceId)
        ? prev.service_ids.filter(id => id !== serviceId)
        : [...prev.service_ids, serviceId]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.post('/stylist/stylists', formData);
      toast.success('Stylist created successfully!');
      setFormData({
        name: '',
        salon_id: '',
        specialization: '',
        bio: '',
        service_ids: []
      });
    } catch (err) {
      if (err.response?.status !== 401) { // Skip if already handled by interceptor
        toast.error(err.response?.data?.message || 'Failed to create stylist');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };


  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-pink-50 p-6">
      <div className="bg-white rounded-xl shadow-lg p-6 max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent mb-6">
          Add New Stylist
        </h2>
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <FaSpinner className="animate-spin text-4xl text-purple-500" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-700 mb-2">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>
<div>
  <label className="block text-gray-700 mb-2">Phone</label>
  <input
    type="text"
    name="phone"
    value={formData.phone}
    onChange={handleChange}
    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
    required
  />
</div>

<div>
  <label className="block text-gray-700 mb-2">Email</label>
  <input
    type="email"
    name="email"
    value={formData.email}
    onChange={handleChange}
    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
    required
  />
</div>

              <div>
                <label className="block text-gray-700 mb-2">Salon</label>
                <select
                  name="salon_id"
                  value={formData.salon_id}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Salon</option>
                  {salons.map(salon => (
                    <option key={salon.id} value={salon.id}>
                      {salon.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-700 mb-2">Specialization</label>
                <input
                  type="text"
                  name="specialization"
                  value={formData.specialization}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2">Bio</label>
                <input
                  type="text"
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-700 mb-2">Services Offered</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {services.map(service => (
                  <div key={service.id} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`service-${service.id}`}
                      checked={formData.service_ids.includes(service.id)}
                      onChange={() => handleServiceToggle(service.id)}
                      className="h-5 w-5 text-purple-600 rounded focus:ring-purple-500"
                    />
                    <label htmlFor={`service-${service.id}`} className="ml-2 text-gray-700">
                      {service.name} ({service.category})
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg shadow-md hover:from-purple-600 hover:to-pink-600 transition-all duration-300 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Stylist'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}