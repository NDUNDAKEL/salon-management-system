import { useEffect, useState } from 'react';
import axios from '../api/axios';
import { Link } from 'react-router-dom';
import { FaScissors } from 'react-icons/fa6';
import { FiCalendar, FiUser, FiMenu, FiX } from 'react-icons/fi';
import { FaMapMarkerAlt, FaPhone, FaInstagram, FaFacebook, FaTwitter } from 'react-icons/fa';

const NavBar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          <div className="flex items-center">
            <FaScissors className="text-purple-600 text-2xl mr-2" />
            <span className="text-xl font-bold text-gray-800">LUXE SALON</span>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-8">
            <Link to="/" className="text-gray-700 hover:text-purple-600 font-medium">Home</Link>
            <Link to="/salons" className="text-gray-700 hover:text-purple-600 font-medium">Salons</Link>
            <Link to="/services" className="text-gray-700 hover:text-purple-600 font-medium">Services</Link>
            <Link to="/stylists" className="text-gray-700 hover:text-purple-600 font-medium">Stylists</Link>
            <Link to="/about" className="text-gray-700 hover:text-purple-600 font-medium">About</Link>
          </div>
          
          <div className="hidden md:flex items-center space-x-4">
            <Link to="/login" className="px-4 py-2 text-purple-600 font-medium hover:bg-purple-50 rounded-lg">Login</Link>
            <Link to="/register" className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-pink-700">Sign Up</Link>
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden">
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-700 hover:text-purple-600"
            >
              {mobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white pb-4 px-4">
          <Link to="/" className="block py-2 text-gray-700 hover:text-purple-600">Home</Link>
          <Link to="/salons" className="block py-2 text-gray-700 hover:text-purple-600">Salons</Link>
          <Link to="/services" className="block py-2 text-gray-700 hover:text-purple-600">Services</Link>
          <Link to="/stylists" className="block py-2 text-gray-700 hover:text-purple-600">Stylists</Link>
          <Link to="/about" className="block py-2 text-gray-700 hover:text-purple-600">About</Link>
          <div className="mt-4 space-y-2">
            <Link to="/login" className="block w-full text-center py-2 text-purple-600 font-medium border border-purple-600 rounded-lg">Login</Link>
            <Link to="/register" className="block w-full text-center py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-lg">Sign Up</Link>
          </div>
        </div>
      )}
    </nav>
  );
};

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white pt-12 pb-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center mb-4">
              <FaScissors className="text-purple-400 text-xl mr-2" />
              <span className="text-xl font-bold">LUXE SALON</span>
            </div>
            <p className="text-gray-400">Your premier destination for luxury hair and beauty services.</p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link to="/" className="text-gray-400 hover:text-purple-400">Home</Link></li>
              <li><Link to="/salons" className="text-gray-400 hover:text-purple-400">Salons</Link></li>
              <li><Link to="/services" className="text-gray-400 hover:text-purple-400">Services</Link></li>
              <li><Link to="/stylists" className="text-gray-400 hover:text-purple-400">Stylists</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
            <div className="space-y-2 text-gray-400">
              <div className="flex items-center">
                <FaMapMarkerAlt className="mr-2 text-purple-400" />
                <span>123 Beauty St, Glamour City</span>
              </div>
              <div className="flex items-center">
                <FaPhone className="mr-2 text-purple-400" />
                <span>(123) 456-7890</span>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Follow Us</h3>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-purple-400"><FaInstagram size={20} /></a>
              <a href="#" className="text-gray-400 hover:text-purple-400"><FaFacebook size={20} /></a>
              <a href="#" className="text-gray-400 hover:text-purple-400"><FaTwitter size={20} /></a>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-8 pt-6 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} Luxe Salon. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default function Home() {
  const [salons, setSalons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get('/salon/salons');
        setSalons(res.data);
      } catch (err) {
        console.error('Error fetching salons:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-purple-50 to-pink-50 py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
              Discover Your Perfect Salon Experience
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Book appointments with the best stylists in town and transform your look today
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link 
                to="/salons" 
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-pink-700 shadow-md"
              >
                Browse Salons
              </Link>
              <Link 
                to="/register" 
                className="px-6 py-3 border border-purple-600 text-purple-600 font-medium rounded-lg hover:bg-purple-50 shadow-sm"
              >
                Join Now
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">Why Choose Luxe Salon?</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center p-6 rounded-lg hover:bg-purple-50 transition-colors">
                <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaScissors className="text-purple-600 text-2xl" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Expert Stylists</h3>
                <p className="text-gray-600">Our professionals are trained in the latest techniques and trends.</p>
              </div>
              <div className="text-center p-6 rounded-lg hover:bg-purple-50 transition-colors">
                <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiCalendar className="text-purple-600 text-2xl" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Easy Booking</h3>
                <p className="text-gray-600">Schedule appointments 24/7 with our convenient online system.</p>
              </div>
              <div className="text-center p-6 rounded-lg hover:bg-purple-50 transition-colors">
                <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiUser className="text-purple-600 text-2xl" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Personalized Service</h3>
                <p className="text-gray-600">Customized treatments tailored to your unique needs.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Salons Section */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">Our Featured Salons</h2>
            
            {loading ? (
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
              </div>
            ) : salons.length === 0 ? (
              <p className="text-center text-gray-600">No salons available at the moment.</p>
            ) : (
              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {salons.map(salon => (
                  <div key={salon.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="h-48 bg-purple-100 flex items-center justify-center">
                      <FaScissors className="text-purple-600 text-4xl" />
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-semibold mb-2">{salon.name}</h3>
                      <p className="text-gray-600 mb-4">{salon.location}</p>
                      <Link
                        to={`/salons/${salon.id}`}
                        className="inline-block px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold mb-6">Ready to Transform Your Look?</h2>
            <p className="text-xl mb-8 max-w-3xl mx-auto">
              Join thousands of satisfied clients who trust Luxe Salon for their beauty needs.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link 
                to="/register" 
                className="px-6 py-3 bg-white text-purple-600 font-medium rounded-lg hover:bg-gray-100 shadow-md"
              >
                Sign Up Now
              </Link>
              <Link 
                to="/login" 
                className="px-6 py-3 border border-white text-white font-medium rounded-lg hover:bg-white hover:text-blue-500 hover:bg-opacity-10 shadow-sm"
              >
                Existing Member? Login
              </Link>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}