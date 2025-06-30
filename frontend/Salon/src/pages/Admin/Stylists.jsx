import { useEffect, useState } from 'react';
import axios from 'axios';
import { FaTrash, FaEdit, FaSpinner } from 'react-icons/fa';
import { toast } from 'react-toastify';

const API_URL = 'http://127.0.0.1:5000/api';

export default function StylistListWithModal() {
  const [stylists, setStylists] = useState([]);
  const [services, setServices] = useState([]);

  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [editingStylist, setEditingStylist] = useState(null);
  const [modalData, setModalData] = useState({
    name: '',
    email: '',
    phone: '',
    specialization: '',
    bio: '',
    salon_id: '',
    service_ids: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const api = axios.create({
    baseURL: API_URL,
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
  fetchStylists();
  fetchServices();
}, []);

const fetchServices = async () => {
  try {
    const res = await api.get('/salon/services'); // Adjust to your real endpoint
    setServices(res.data);
  } catch (err) {
    toast.error('Failed to load services');
  }
};


  const fetchStylists = async () => {
    try {
      setLoading(true);
      const res = await api.get('/stylist/stylists');
      setStylists(res.data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to load stylists');
    } finally {
      setLoading(false);
    }
  };
const toggleService = (id) => {
  setModalData(prev => ({
    ...prev,
    service_ids: prev.service_ids.includes(id)
      ? prev.service_ids.filter(sid => sid !== id)
      : [...prev.service_ids, id]
  }));
};

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this stylist?')) return;
    try {
      setDeletingId(id);
      await api.delete(`/stylist/stylists/${id}`);
      toast.success('Stylist deleted');
      setStylists(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete stylist');
    } finally {
      setDeletingId(null);
    }
  };

const handleEditClick = (stylist) => {
  setEditingStylist(stylist);
  setModalData({
    name: stylist.name,
    email: stylist.email || '',
    phone: stylist.phone || '',
    specialization: stylist.specialization || '',
    bio: stylist.bio || '',
    salon_id: stylist.salon_id,
    service_ids: stylist.services?.map(s => s.id) || []
  });
};

const handleModalSubmit = async (e) => {
  e.preventDefault();
  if (!editingStylist) return;
  
  try {
    setIsSubmitting(true);
    const response = await api.put(`/stylist/stylists/${editingStylist.id}`, modalData);
    
    if (response.status === 200) {
      toast.success('Stylist updated successfully');
      setEditingStylist(null);
      fetchStylists(); // Refresh the list
    } else {
      throw new Error('Failed to update stylist');
    }
  } catch (err) {
    console.error('Update error:', err);
    toast.error(err.response?.data?.error || 'Update failed. Please try again.');
  } finally {
    setIsSubmitting(false);
  }
};
  const handleModalChange = (e) => {
    const { name, value } = e.target;
    setModalData(prev => ({ ...prev, [name]: value }));
  };



  return (
    <div className="p-6 min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto bg-white shadow-xl rounded-xl p-6">
        <h1 className="text-2xl font-bold mb-6 text-purple-700">All Stylists</h1>
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <FaSpinner className="animate-spin text-4xl text-purple-500" />
          </div>
        ) : stylists.length === 0 ? (
          <p className="text-center text-gray-500">No stylists available.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto border border-gray-200">
              <thead className="bg-purple-100">
                <tr>
                  <th className="px-4 py-2">Name</th>
                  <th className="px-4 py-2">Email</th>
                  <th className="px-4 py-2">Phone</th>
                  <th className="px-4 py-2">Specialization</th>
                  <th className="px-4 py-2">Salon</th>
                  <th className="px-4 py-2">Services</th>
                  <th className="px-4 py-2">Rating</th>
                  <th className="px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {stylists.map(stylist => (
                  <tr key={stylist.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-2">{stylist.name}</td>
                    <td className="px-4 py-2">{stylist.email || 'N/A'}</td>
                    <td className="px-4 py-2">{stylist.phone || 'N/A'}</td>
                    <td className="px-4 py-2">{stylist.specialization || '—'}</td>
                    <td className="px-4 py-2">{stylist.salon_name}</td>
                    <td className="px-4 py-2">{stylist.services?.map(s => s.name).join(', ') || '—'}</td>
                    <td className="px-4 py-2">{stylist.average_rating || '—'}</td>
                    <td className="px-4 py-2 flex space-x-2">
                      <button
                        onClick={() => handleEditClick(stylist)}
                        className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded flex items-center space-x-1"
                      >
                        <FaEdit /> <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDelete(stylist.id)}
                        disabled={deletingId === stylist.id}
                        className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded flex items-center space-x-1 disabled:opacity-50"
                      >
                        {deletingId === stylist.id ? <FaSpinner className="animate-spin" /> : <FaTrash />}
                        <span>Delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingStylist && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-lg font-bold mb-4 text-purple-700">Edit Stylist</h2>
            
            <form onSubmit={handleModalSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    name="name"
                    value={modalData.name}
                    onChange={handleModalChange}
                    required
                    className="w-full border px-3 py-2 rounded"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={modalData.email}
                    onChange={handleModalChange}
                    className="w-full border px-3 py-2 rounded"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={modalData.phone}
                    onChange={handleModalChange}
                    className="w-full border px-3 py-2 rounded"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
                  <input
                    name="specialization"
                    value={modalData.specialization}
                    onChange={handleModalChange}
                    className="w-full border px-3 py-2 rounded"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                  <textarea
                    name="bio"
                    value={modalData.bio}
                    onChange={handleModalChange}
                    rows={3}
                    className="w-full border px-3 py-2 rounded"
                  />
                </div>
              </div>
<div>
  <label className="block text-sm font-medium text-gray-700 mb-1">Services</label>
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto border p-2 rounded">
    {services.map(service => (
      <div key={service.id} className="flex items-center">
        <input
          type="checkbox"
          checked={modalData.service_ids.includes(service.id)}
          onChange={() => toggleService(service.id)}
          className="mr-2"
        />
        <label>{service.name}</label>
      </div>
    ))}
  </div>
</div>

              <div className="flex justify-end space-x-2 mt-6">
                <button 
                  type="button"
                  onClick={() => setEditingStylist(null)} 
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
                >
                  {isSubmitting ? <FaSpinner className="animate-spin inline mr-2" /> : null}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}