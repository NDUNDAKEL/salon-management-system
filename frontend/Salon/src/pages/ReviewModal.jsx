import { useState } from 'react';

export default function ReviewModal({ show, onClose, onSubmit, appointment }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const handleSubmit = () => {
    console.log('appointment',appointment)
    console.log(rating)
     console.log(comment)
    if (rating < 1 || rating > 5) return alert("Rating must be between 1 and 5");
    onSubmit({
      rating,
      comment,
      stylist_id: appointment.stylist_id,
      appointment_id: appointment.id
    });
    onClose();
  };

  if (!show || !appointment) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-lg">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Leave a Review</h2>
        <p className="mb-2 text-gray-600">Stylist: <strong>{appointment.stylist}</strong></p>

        <label className="block text-sm mb-1 text-gray-700">Rating (1–5)</label>
        <input
          type="number"
          min="1"
          max="5"
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
          className="w-full border p-2 rounded mb-4"
        />

        <label className="block text-sm mb-1 text-gray-700">Comment</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="w-full border p-2 rounded mb-4"
          placeholder="Write your feedback..."
        />

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}
