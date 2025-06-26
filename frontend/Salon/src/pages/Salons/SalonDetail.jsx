import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from '../../api/axios';

const SalonDetail = () => {
  const { salonId } = useParams();
  const [salon, setSalon] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      const res = await axios.get(`/salon/salons/${salonId}`);
      setSalon(res.data);
    };
    fetch();
  }, [salonId]);

  if (!salon) return <p className="p-6">Loading...</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-2">{salon.name}</h1>
      <p>{salon.description}</p>
      <p><strong>Contact:</strong> {salon.contact}</p>

      <h2 className="mt-6 text-xl font-semibold">Stylists</h2>
      <ul className="grid gap-4 sm:grid-cols-2">
        {salon.stylists.map((stylist) => (
          <li key={stylist.id} className="p-3 border rounded">
            <p><strong>{stylist.name}</strong></p>
            <p>{stylist.specialization}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SalonDetail;
