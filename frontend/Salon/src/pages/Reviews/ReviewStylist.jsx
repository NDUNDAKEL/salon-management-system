import { useState, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';

export default function ReviewStylist() {
  const { stylistId } = useParams();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      await axios.post(
        '/salon/reviews/stylist',
        { stylist_id: stylistId, rating, comment },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      alert('Review submitted!');
      navigate('/');
    } catch (err) {
      alert(err.response?.data?.error || 'Review failed');
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Review Stylist</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <select
          className="border p-2 w-full"
          value={rating}
          onChange={e => setRating(e.target.value)}
        >
          {[5, 4, 3, 2, 1].map(v => (
            <option key={v} value={v}>{v} stars</option>
          ))}
        </select>
        <textarea
          className="w-full border p-2"
          placeholder="Your comments..."
          value={comment}
          onChange={e => setComment(e.target.value)}
        />
        <button className="bg-green-500 text-white px-4 py-2">Submit Review</button>
      </form>
    </div>
  );
}
