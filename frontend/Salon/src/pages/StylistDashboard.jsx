import { useState, useEffect } from 'react';
import axios from 'axios';
import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

import { 
  FaCalendarAlt, 
  FaUser, 
  FaStar, 
  FaSpinner, 
  FaCut, 
  FaTimes,
  
} from 'react-icons/fa';
import { FiLogOut } from 'react-icons/fi';
import { toast } from 'react-toastify';

export default function StylistDashboard() {
  const [activeTab, setActiveTab] = useState('');


    const { user, logout } = useContext(AuthContext); // Use context user
  const [services, setServices] = useState([]);
  const [appointments, setAppointments] = useState([]);
const [reviews, setReviews] = useState({
  stylist: [],
  salon: []
});

  const [loading, setLoading] = useState({
    user: false,
    services: false,
    appointments: false,
    reviews: false
  });

const [profileForm, setProfileForm] = useState({
  username: user.username || '',
  email: user.email || '',
  current_password: '',
  new_password: '',
  confirm_password: ''
});
const [isUpdating, setIsUpdating] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const navigate = useNavigate();
  const token = localStorage.getItem('token');
console.log(token);

  // Fetch user data on component mount


console.log('User Data',user)

 useEffect(() => {
    const loadUser = async () => {
      try {
        await fetchUser();
      } catch (error) {
        // Error already handled in fetchUser
      }
    };

    loadUser();
  }, [token, navigate]);
  // Load data based on active tab
useEffect(() => {
    if (!user) return;

    const loadTabData = async () => {
      try {
        switch (activeTab) {
          case 'services':
            await loadServices();
            break;
          case 'appointments':
            await loadAppointments();
            break;
          case 'reviews':
            await loadReviews();
            break;
          default:
            break;
        }
      } catch (error) {
        console.error(`Failed to load ${activeTab} data:`, error);
        toast.error(`Failed to load ${activeTab} data`);
      }
    };

    loadTabData();
  }, [activeTab, user]);


  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);
const loadServices = async () => {
  setLoading(prev => ({ ...prev, services: true }));
  try {
    const response = await axios.get('http://127.0.0.1:5000/api/salon/services'); // Adjust baseURL if needed
    setServices(response.data);
  } catch (err) {
    toast.error('Failed to load services');
    console.error(err);
  } finally {
    setLoading(prev => ({ ...prev, services: false }));
  }
};

const loadAppointments = async () => {
  setLoading(prev => ({ ...prev, appointments: true }));
  try {
      
    const response = await axios.get(`http://127.0.0.1:5000/api/stylist/stylists/${user.stylist_id}/appointments`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    // Transform data if needed
    const transformedAppointments = response.data.map(app => ({
      ...app,
      // Ensure all date fields are strings
      appointment_date: app.appointment_date || null,
      appointment_time: app.appointment_time || null,
      start_datetime: app.start_datetime || null,
      end_datetime: app.end_datetime || null
    }));
    
    setAppointments(transformedAppointments);
  } catch (err) {
    toast.error('Failed to load appointments');
    console.error(err);
  } finally {
    setLoading(prev => ({ ...prev, appointments: false }));
  }
};

const loadReviews = async () => {
  setLoading(prev => ({ ...prev, reviews: true }));
  try {
    const response = await axios.get(`/customers/${user.id}/reviews`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    // ✅ Ensure reviews always has stylist and salon arrays
    if (Array.isArray(response.data.stylist) && Array.isArray(response.data.salon)) {
      setReviews(response.data);
    } else {
      setReviews({ stylist: [], salon: [] }); // fallback structure
    }

  } catch (err) {
    toast.error('Failed to load reviews');
    console.error(err);
  } finally {
    setLoading(prev => ({ ...prev, reviews: false }));
  }
};


  const handleServiceClick = (service) => {
    setSelectedService(service);
    setShowBookingModal(true);
  };

  const handleLogout = () => {
    logout(); 
  };

const handleProfileUpdate = async (e) => {
  e.preventDefault();

  if (profileForm.new_password && profileForm.new_password !== profileForm.confirm_password) {
    toast.error('New passwords do not match');
    return;
  }

  const payload = {
    username: profileForm.username,
    email: profileForm.email
  };

  if (profileForm.new_password) {
    payload.current_password = profileForm.current_password;
    payload.new_password = profileForm.new_password;
  }

  setIsUpdating(true);

  try {
    await toast.promise(
      axios.patch(
        `http://127.0.0.1:5000/api/customer/customers/${user.id}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      ),
      {
        pending: 'Updating profile...',
        success: {
          render: 'Profile updated successfully! Please log in again.',
          onClose: () => {
            localStorage.removeItem('token');
            navigate('/login');
          }
        },
        error: {
          render({data}) {
            return data.response?.data?.error || 'Failed to update profile';
          }
        }
      }
    );
  } catch (err) {
    console.error(err);
  } finally {
    setIsUpdating(false);
  }
};
  const handleDeleteAccount = async () => {
    try {
      await axios.delete(`http://127.0.0.1:5000/api/customer/customers/${user.id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      toast.success('Account deleted successfully');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete account');
      console.error(err);
    }
  };

const completeAppointment =  async (appointmentId) => {
  try {
    const response = await axios.patch(
      `http://127.0.0.1:5000/api/stylist/stylists/appointments/${appointmentId}`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    toast.success(`Appointment is now ${response.data.new_status}`);
    loadAppointments(); // Refresh the list
  } catch (err) {
    toast.error(err.response?.data?.error || 'Failed to toggle appointment status');
    console.error(err);
  }
};




  if (loading.user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <FaSpinner className="animate-spin text-4xl text-purple-600" />
      </div>
    );
  }
console.log("user",user)
  if (!user) {
    return null; // or redirect to login
  }
    const {
    id,
    email,
    username,
    is_admin,
    is_stylist,
    stylist_id,
    stylist_info
  } = user;

 console.log('services',services)
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      {/* Header */}
     <header className="bg-gradient-to-r from-green-50 to-orange-50 shadow-lg">
  <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
    <div className="flex items-center">
      <div className="mr-3 text-blue-500">
        <FaCut className="text-3xl" /> {/* Using a salon-related icon */}
      </div>
      <div>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
        LUXE SALON
        </h1>
        
      </div>
    </div>
    
    <div className="flex items-center space-x-6">
      <div className="flex items-center space-x-3">
        <div className="relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-300 to-pink-200 rounded-full blur opacity-75"></div>
          <div className="relative bg-white rounded-full p-2">
            <FaUser className="text-purple-600" />
          </div>
        </div>
        <span className="font-medium text-gray-700">{user.username}</span>
      </div>
      
      <button 
        onClick={handleLogout}
        className="flex items-center cursor-pointer space-x-1 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 transition-all duration-300 shadow-md hover:shadow-lg"
      >
        <span>Logout</span>
        <FiLogOut className="ml-1" />
      </button>
    </div>
  </div>
</header>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
              <div className="flex flex-col items-center mb-6">
                <div className="bg-purple-100 rounded-full w-24 h-24 flex items-center justify-center mb-4">
                  <FaUser className="text-purple-600 text-3xl" />
                </div>
                <h3 className="font-semibold text-lg">{user.username}</h3>
                <p className="text-gray-500 text-sm">{user.email}</p>
             
              </div>

              <nav className="space-y-2">
            
                <button
                  onClick={() => setActiveTab('appointments')}
                  className={`w-full text-left px-4 py-3 rounded-lg flex items-center ${activeTab === 'appointments' ? 'bg-purple-100 text-purple-700' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <FaCalendarAlt className="mr-3" />
                  My Appointments
                </button>
                <button
                  onClick={() => setActiveTab('reviews')}
                  className={`w-full text-left px-4 py-3 rounded-lg flex items-center ${activeTab === 'reviews' ? 'bg-purple-100 text-purple-700' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <FaStar className="mr-3" />
                  My Reviews
                </button>
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`w-full text-left px-4 py-3 rounded-lg flex items-center ${activeTab === 'profile' ? 'bg-purple-100 text-purple-700' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <FaUser className="mr-3" />
                  Profile Settings
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Services Tab */}
          {/* Initial Info Card */}
{activeTab === '' && (
  <div className="bg-white rounded-lg shadow-md p-6">
    <h2 className="text-2xl font-bold text-gray-800 mb-4">Welcome, {user.username}!</h2>
    <p className="text-gray-600 mb-2">Here’s your account overview:</p>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
      <div className="space-y-2">
        <p><span className="font-semibold text-gray-700">Email:</span> {user.email}</p>
        <p><span className="font-semibold text-gray-700">Username:</span> {user.username}</p>
        <p><span className="font-semibold text-gray-700">Account Type:</span> {user.is_admin ? 'Admin' : user.is_stylist ? 'Stylist' : 'Customer'}</p>
        {user.is_stylist && (
          <p><span className="font-semibold text-gray-700">Stylist ID:</span> {user.stylist_id}</p>
        )}
      </div>

      {user.is_stylist && user.stylist_info && (
        <div className="bg-purple-50 rounded-lg p-4">
          <h3 className="font-semibold text-purple-700 mb-2">Stylist Profile</h3>
          <p><strong>Name:</strong> {user.stylist_info.name}</p>
          <p><strong>Phone:</strong> {user.stylist_info.phone}</p>
          <p><strong>Salon ID:</strong> {user.stylist_info.salon_id}</p>
          <p><strong>Specialization:</strong> {user.stylist_info.specialization}</p>
          <p><strong>Bio:</strong> {user.stylist_info.bio}</p>
        </div>
      )}
    </div>
  </div>
)}


            {/* Appointments Tab */}
       {activeTab === 'appointments' && (
  <div className="bg-white rounded-lg shadow-md p-6">
    <h2 className="text-2xl font-bold text-gray-800 mb-6">My Appointments</h2>
    
    {loading.appointments ? (
      <div className="flex justify-center py-12">
        <FaSpinner className="animate-spin text-4xl text-purple-600" />
      </div>
    ) : appointments.length === 0 ? (
      <div className="text-center py-8 text-gray-500">
        You don't have any appointments yet.
      </div>
    ) : (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stylist</th>
               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Salon</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {appointments.map(appointment => {
              // Safely parse dates
              const dateObj = appointment.appointment_date ? new Date(appointment.appointment_date) : null;
              const startDateTimeObj = appointment.start_datetime ? new Date(appointment.start_datetime) : null;
              
              return (
                <tr key={appointment.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {dateObj ? (
                      <>
                        <div className="text-sm font-medium text-gray-900">
                          {dateObj.toLocaleDateString(undefined, {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </div>
                        <div className="text-sm text-gray-500">
                          {startDateTimeObj ? startDateTimeObj.toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          }) : appointment.appointment_time || '--:--'}
                        </div>
                      </>
                    ) : (
                      <div className="text-sm text-gray-500">Date not set</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{appointment.service}</div>
                    {appointment.service_duration && (
                      <div className="text-sm text-gray-500">
                        {appointment.service_duration} mins
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{appointment.stylist}</div>
                    {appointment.stylist_specialization && (
                      <div className="text-sm text-gray-500">
                        {appointment.stylist_specialization}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{appointment.salon}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${appointment.status === 'completed' ? 'bg-green-100 text-green-800' : 
                        appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-red-100 text-red-800'}`}
                    >
                      {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                 
                      <>
                        <button 
                          onClick={() => completeAppointment(appointment.id)}
                          className="mr-4"
                        >
                          <p className={`${appointment.status == 'completed' ? 'text-gray-500' : 'text-green-600'}`}>
                                {appointment.status == 'completed' ? 'set to pending' : 'set complete'}
                          </p>
                      
                        </button>
                        {/* <button 
                          onClick={() => openRescheduleModal(appointment)}
                          className="text-purple-600 hover:text-purple-900"
                        >
                          Reschedule
                        </button> */}
                      </>
                 
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    )}
  </div>
)}

            {/* Reviews Tab */}
            {activeTab === 'reviews' && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">My Reviews</h2>
                
                {loading.reviews ? (
                  <div className="flex justify-center py-12">
                    <FaSpinner className="animate-spin text-4xl text-purple-600" />
                  </div>
                ) : (
                  <div className="space-y-8">
                    <div>
                      <h3 className="text-xl font-semibold mb-4 text-purple-700">Stylist Reviews</h3>
{Array.isArray(reviews?.stylist) && reviews.stylist.length === 0 ? (
  <div className="text-center py-8 text-gray-500">
    You haven't reviewed any stylists yet.
  </div>
) : (
  <div className="space-y-4">
    {/* reviews.stylist.map... */}
  </div>
)}


                    </div>
                    
                    <div>
                      <h3 className="text-xl font-semibold mb-4 text-purple-700">Salon Reviews</h3>
                  {reviews.salon.length === 0 ? (
  <div className="text-center py-8 text-gray-500">
    You haven't reviewed the salon yet.
  </div>
) : (
  <div className="space-y-4">
    {reviews.salon.map(review => (
      <div key={review.id} className="bg-gray-50 p-4 rounded-lg">
        <div className="flex justify-between items-start mb-2">
          <h4 className="font-medium">{review.salon}</h4>
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <FaStar 
                key={i} 
                className={i < review.rating ? "text-yellow-400" : "text-gray-300"} 
              />
            ))}
          </div>
        </div>
        <p className="text-gray-700 mb-2">{review.comment || 'No comment provided'}</p>
        <p className="text-xs text-gray-500">
          Reviewed on {new Date(review.created_at).toLocaleDateString()}
        </p>
      </div>
    ))}
  </div>
)}

                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Profile Tab */}
           {activeTab === 'profile' && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Profile Settings</h2>
                
                <form onSubmit={handleProfileUpdate} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                        Username
                      </label>
                      <input
                        type="text"
                        id="username"
                        value={profileForm.username}
                        onChange={(e) => setProfileForm({...profileForm, username: e.target.value})}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        id="email"
                        value={profileForm.email}
                        onChange={(e) => setProfileForm({...profileForm, email: e.target.value})}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="current_password" className="block text-sm font-medium text-gray-700 mb-1">
                      Current Password (leave blank to keep unchanged)
                    </label>
                    <input
                      type="password"
                      id="current_password"
                      value={profileForm.current_password}
                      onChange={(e) => setProfileForm({...profileForm, current_password: e.target.value})}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="new_password" className="block text-sm font-medium text-gray-700 mb-1">
                        New Password
                      </label>
                      <input
                        type="password"
                        id="new_password"
                        value={profileForm.new_password}
                        onChange={(e) => setProfileForm({...profileForm, new_password: e.target.value})}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700 mb-1">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        id="confirm_password"
                        value={profileForm.confirm_password}
                        onChange={(e) => setProfileForm({...profileForm, confirm_password: e.target.value})}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-4 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition"
                    >
                      Delete Account
                    </button>
                <button
  type="submit"
  className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
  disabled={isUpdating}
>
  {isUpdating ? (
    <>
      <FaSpinner className="animate-spin mr-2" />
      Updating...
    </>
  ) : (
    'Update Profile'
  )}
</button>

                  </div>
                </form>
              </div>
            )} 
          </div>
        </div>
      </div>

  

      {/* Delete Account Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="bg-red-100 rounded-full p-3">
                  <FaTimes className="text-red-500 text-3xl" />
                </div>
              </div>
              <h3 className="text-xl font-bold mb-2">Confirm Account Deletion</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete your account? This action cannot be undone.
              </p>
              
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

