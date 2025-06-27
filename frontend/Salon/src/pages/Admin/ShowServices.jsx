import { useEffect, useState } from 'react';
import axios from 'axios';
import { FaEdit, FaTrash, FaSpinner } from 'react-icons/fa';
import { toast } from 'react-toastify';

const API = 'http://127.0.0.1:5000/api';

export default function ServiceList() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [editingService, setEditingService] = useState(null);
  const [modalData, setModalData] = useState({
    name: '',
    description: '',
    duration: '',
    price: '',
    category: '',
    is_active: true
  });

  const api = axios.create({
    baseURL: API,
    withCredentials: true,
  });

  api.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      config.headers['Content-Type'] = 'application/json';
    }
    return config;
  });

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const res = await api.get('/salon/services');
      setServices(res.data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this service?')) return;
    try {
      setDeletingId(id);
      await api.delete(`/salon/services/${id}`);
      toast.success('Service deleted');
      setServices(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Delete failed');
    } finally {
      setDeletingId(null);
    }
  };

  const handleEditClick = (service) => {
    setEditingService(service);
    setModalData({
      name: service.name,
      description: service.description || '',
      price: service.price || '',
      duration: service.duration || '',
      category: service.category || '',
      is_active: service.is_active
    });
  };

  const handleModalChange = (e) => {
    const { name, value, type, checked } = e.target;
    setModalData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    if (!editingService) return;
    try {
      await api.put(`/salon/services/${editingService.id}`, modalData);
      toast.success('Service updated');
      setEditingService(null);
      fetchServices();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Update failed');
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="bg-white shadow-xl rounded-xl p-6 max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold text-purple-700 mb-4">All Services</h2>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <FaSpinner className="animate-spin text-4xl text-purple-500" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-auto border border-gray-200">
              <thead className="bg-purple-100">
                <tr>
                  <th className="px-4 py-2">Name</th>
                  <th className="px-4 py-2">Category</th>
                  <th className="px-4 py-2">Price</th>
                  <th className="px-4 py-2">Duration</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {services.map(service => (
                  <tr key={service.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-2">{service.name}</td>
                    <td className="px-4 py-2">{service.category || '—'}</td>
                    <td className="px-4 py-2">{service.price}</td>
                    <td className="px-4 py-2">{service.duration} min</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${service.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {service.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-2 flex space-x-2">
                      <button
                        onClick={() => handleEditClick(service)}
                        className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDelete(service.id)}
                        disabled={deletingId === service.id}
                        className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
                      >
                        {deletingId === service.id ? <FaSpinner className="animate-spin" /> : <FaTrash />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {editingService && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-xl">
            <h3 className="text-xl font-semibold mb-4 text-purple-700">Edit Service</h3>
            <form onSubmit={handleModalSubmit} className="space-y-4">
              <input
                name="name"
                value={modalData.name}
                onChange={handleModalChange}
                placeholder="Name"
                required
                className="w-full border px-3 py-2 rounded"
              />
              <input
                name="category"
                value={modalData.category}
                onChange={handleModalChange}
                placeholder="Category"
                className="w-full border px-3 py-2 rounded"
              />
              <textarea
                name="description"
                value={modalData.description}
                onChange={handleModalChange}
                placeholder="Description"
                className="w-full border px-3 py-2 rounded"
              />
              <input
                name="price"
                type="number"
                value={modalData.price}
                onChange={handleModalChange}
                placeholder="Price"
                className="w-full border px-3 py-2 rounded"
              />
              <input
                name="duration"
                type="number"
                value={modalData.duration}
                onChange={handleModalChange}
                placeholder="Duration (min)"
                className="w-full border px-3 py-2 rounded"
              />
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={modalData.is_active}
                  onChange={handleModalChange}
                  className="mr-2"
                />
                Active
              </label>

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingService(null)}
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
