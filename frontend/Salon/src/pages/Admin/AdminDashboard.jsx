import { useContext, useEffect, useState } from 'react';
import axios from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';
import SalonForm from './SalonForm';
import StylistForm from './StylistForm';
import ServiceForm from './ServiceForm';
export default function AdminDashboard() {
  const { user } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('users');

  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
  }, [activeTab]);

  const fetchUsers = async () => {
    const res = await axios.get('/admin/users', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    });
    setUsers(res.data);
  };

  const blockUser = async id => {
    await axios.put(`/admin/users/${id}/block`, null, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    });
    fetchUsers();
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Admin Panel</h1>
      <div className="space-x-2 mb-4">
        <button onClick={() => setActiveTab('users')} className="px-3 py-1 bg-gray-200">Users</button>
      </div>

      {activeTab === 'users' && (
        <table className="w-full border">
          <thead>
            <tr>
              <th>ID</th>
              <th>Username</th>
              <th>Email</th>
              <th>Admin</th>
              <th>Blocked</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="text-center">
                <td>{u.id}</td>
                <td>{u.username}</td>
                <td>{u.email}</td>
                <td>{u.is_admin ? 'Yes' : 'No'}</td>
                <td>{u.is_blocked ? 'Yes' : 'No'}</td>
                <td>
                  {!u.is_blocked ? (
                    <button onClick={() => blockUser(u.id)} className="text-red-500">
                      Block
                    </button>
                  ) : (
                    <span>Blocked</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div className="space-x-2 mb-4">
  {['users','salon','stylist','service'].map(tab => (
    <button
      key={tab}
      onClick={() => setActiveTab(tab)}
      className={`px-3 py-1 ${activeTab===tab ? 'bg-blue-300' : 'bg-gray-200'}`}
    >
      {tab}
    </button>
  ))}
</div>

{activeTab==='salon' && <SalonForm />}
{activeTab==='stylist' && <StylistForm />}
{activeTab==='service' && <ServiceForm />}
    </div>
  );
}
