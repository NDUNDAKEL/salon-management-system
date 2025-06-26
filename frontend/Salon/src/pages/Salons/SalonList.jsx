import { useEffect, useState } from 'react';
import axios from '../../api/axios';
import { Link } from 'react-router-dom';

const SalonList = () => {
  const [salons, setSalons] = useState([]);

  useEffect(() => {
    const fetchSalons = async () => {
      const res = await axios.get('/salon/salons');
      setSalons(res.data);
    };
    fetchSalons();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Available Salons</h1>
      <ul className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {salons.map((salon) => (
          <li key={salon.id} className="border p-4 rounded shadow">
            <h2 className="text-lg font-semibold">{salon.name}</h2>
            <p>{salon.location}</p>
            <p>{salon.contact}</p>
            <Link
              to={`/salons/${salon.id}`}
              className="text-blue-500 hover:underline mt-2 inline-block"
            >
              View Details
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SalonList;
