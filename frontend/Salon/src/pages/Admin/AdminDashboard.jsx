import { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import SalonForm from './SalonForm';
import StylistForm from './StylistForm';
import ServiceForm from './ServiceForm';
import { FaUserCog, FaUserSlash, FaUserCheck, FaSpinner } from 'react-icons/fa';
import { toast } from 'react-toastify';
import StylistList from './Stylists';
import ServiceList from './ShowServices';

export default function AdminDashboard() {
  const { user, logout } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('users');
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
  }, [activeTab]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://127.0.0.1:5000/api/customer/admin/customers', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        withCredentials: true
      });
      setUsers(res.data);
    } catch (err) {
      if (err.response?.status === 401) {
        toast.error('Session expired, please login again');
        logout();
      } else {
        toast.error('Failed to fetch users');
      }
    } finally {
      setLoading(false);
    }
  };
console.log(users)
  const toggleUserStatus = async (id, isBlocked) => {
    try {
      await axios.patch(
        `http://127.0.0.1:5000/api/customer/admin/customers/${id}`,
        { is_blocked: !isBlocked },
        {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          withCredentials: true
        }
      );
      toast.success(`User ${isBlocked ? 'unblocked' : 'blocked'} successfully`);
      fetchUsers();
    } catch (err) {
      if (err.response?.status === 401) {
        toast.error('Session expired, please login again');
        logout();
      } else {
        toast.error(err.response?.data?.message || 'Failed to update user status');
      }
    }
  };

  const handleLogout = async () => {
    try {
      await axios.delete('http://127.0.0.1:5000/api/auth/logout', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        withCredentials: true
      });
      logout();
      toast.success('Logged out successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Logout failed');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-pink-50 p-6">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-50 to-pink-50 shadow-lg rounded-lg mb-8 p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div className="mr-3 text-pink-500">
              <FaUserCog className="text-3xl" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
                LUXE SALON ADMIN
              </h1>
              <p className="text-sm text-gray-500 italic">Admin Dashboard</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-white rounded-full px-4 py-2 shadow">
              <div className="bg-purple-100 rounded-full p-2">
                <FaUserCog className="text-purple-600" />
              </div>
              <span className="font-medium text-gray-700">{user?.username}</span>
            </div>
            
            <button 
              onClick={handleLogout}
              className="flex items-center space-x-1 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 transition-all duration-300 shadow-md hover:shadow-lg"
            >
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        {/* Tab Navigation */}
        <div className="flex space-x-2 mb-6 border-b border-gray-200 pb-4">
          {['users', 'stylist', 'service'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-t-lg font-medium capitalize transition-all ${
                activeTab === tab 
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md'
                  : 'text-gray-600 hover:bg-purple-50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'users' && (
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <FaSpinner className="animate-spin text-4xl text-purple-500" />
              </div>
            ) : (
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gradient-to-r from-purple-100 to-pink-100 text-gray-700">
                    <th className="p-3 text-left">ID</th>
                    <th className="p-3 text-left">Username</th>
                    <th className="p-3 text-left">Email</th>
                    <th className="p-3 text-left">Admin</th>
                    <th className="p-3 text-left">Status</th>
                    <th className="p-3 text-left">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} className="border-b border-gray-200 hover:bg-purple-50">
                      <td className="p-3">{u.id}</td>
                      <td className="p-3 font-medium">{u.username}</td>
                      <td className="p-3">{u.email}</td>
                      <td className="p-3">{u.is_admin ? 'Yes' : 'No'}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          u.is_blocked ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {u.is_blocked ? 'Blocked' : 'Active'}
                        </span>
                      </td>
                      <td className="p-3">
                        <button 
                          onClick={() => toggleUserStatus(u.id, u.is_blocked)}
                          className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm ${
                            u.is_blocked 
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-red-100 text-red-700 hover:bg-red-200'
                          }`}
                        >
                          {u.is_blocked ? (
                            <>
                              <FaUserCheck /> <span>Unblock</span>
                            </>
                          ) : (
                            <>
                              <FaUserSlash /> <span>Block</span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

     

        {activeTab === 'stylist' && (
          <>
  <StylistForm />
   <StylistList/>
          </>
        
        )}
        {activeTab === 'service' && (<>
        <ServiceForm />
         <ServiceList/>
        </>)}
      </div>
    </div>
  );
}