import React, { useState } from 'react';
import axios from 'axios';
import { FaTimes } from 'react-icons/fa';
import { toast } from 'react-toastify';

const BookingModal = ({ 
  showBookingModal, 
  setShowBookingModal, 
  selectedService, 
  user, 
  token,
  loadAppointments 
}) => {
  const [bookingData, setBookingData] = useState({
    stylist_id: selectedService?.stylists[0]?.id || '',
    appointment_date: '',
    appointment_time: '09:00'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

 const handleBookingSubmit = async (e) => {
  e.preventDefault();
  setIsSubmitting(true);
  
  try {
    const payload = {
      service_id: selectedService.id,
      stylist_id: selectedService.stylists[0].id,
      appointment_date: bookingData.appointment_date,  // "YYYY-MM-DD"
      appointment_time: bookingData.appointment_time  // "HH:MM"
    };

    console.log('Sending payload:', payload);  // Debug log

    const response = await axios.post(
      `https://salon-management-system-2.onrender.com/api/customer/customers/${user.id}/appointments`,
      payload,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    toast.success('Appointment booked successfully!');
    setShowBookingModal(false);
    setBookingData({
      appointment_date: '',
      appointment_time: '09:00'
    });
    
    if (loadAppointments) await loadAppointments();
    
  } catch (err) {
    const errorMessage = err.response?.data?.error || 
                       'Failed to book appointment. Please try again.';
    toast.error(errorMessage);
    console.error('Booking error:', err.response?.data || err.message);
  } finally {
    setIsSubmitting(false);
  }
};

  if (!showBookingModal || !selectedService) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-purple-800">
            Book {selectedService.name}
          </h3>
          <button 
            onClick={() => setShowBookingModal(false)}
            className="text-gray-500 hover:text-gray-700"
            disabled={isSubmitting}
          >
            <FaTimes />
          </button>
        </div>
        
        <form onSubmit={handleBookingSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Service
              </label>
              <p className="text-gray-600">
                {selectedService.name} (KSh {selectedService.price.toFixed(2)})
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stylist
              </label>
          <p className="text-gray-600">
  {selectedService?.stylists?.[0]?.name || 'No stylist assigned'}
</p>

            </div>
            
            <div>
              <label htmlFor="appointment-date" className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <input
                type="date"
                id="appointment-date"
                value={bookingData.appointment_date}
                onChange={(e) => setBookingData({...bookingData, appointment_date: e.target.value})}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
                disabled={isSubmitting}
              />
            </div>
            
            <div>
              <label htmlFor="appointment-time" className="block text-sm font-medium text-gray-700 mb-1">
                Time
              </label>
              <select
                id="appointment-time"
                value={bookingData.appointment_time}
                onChange={(e) => setBookingData({...bookingData, appointment_time: e.target.value})}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
                disabled={isSubmitting}
              >
                <option value="09:00">09:00 AM</option>
                <option value="10:00">10:00 AM</option>
                <option value="11:00">11:00 AM</option>
                <option value="12:00">12:00 PM</option>
                <option value="13:00">01:00 PM</option>
                <option value="14:00">02:00 PM</option>
                <option value="15:00">03:00 PM</option>
                <option value="16:00">04:00 PM</option>
                <option value="17:00">05:00 PM</option>
              </select>
            </div>
            
            <div className="flex justify-end space-x-4 pt-4">
              <button
                type="button"
                onClick={() => setShowBookingModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Booking...' : 'Book Now'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingModal;