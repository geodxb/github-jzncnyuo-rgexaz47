import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/common/Button';
import { Eye, EyeOff, User, Lock } from 'lucide-react';

const AdminLogin = () => {
  const [isAffiliate, setIsAffiliate] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const success = await login(email, password);
      if (success) {
        navigate('/admin');
      }
    } catch (err) {
      console.error('Login error:', err);
      
      // Handle specific Firebase auth errors
      if (err && typeof err === 'object' && 'code' in err) {
        switch (err.code) {
          case 'auth/user-not-found':
            setError('No account found with this email address.');
            break;
          case 'auth/wrong-password':
            setError('Incorrect password. Please try again.');
            break;
          case 'auth/invalid-email':
            setError('Invalid email address format.');
            break;
          case 'auth/too-many-requests':
            setError('Too many failed attempts. Please try again later.');
            break;
          case 'auth/invalid-credential':
            setError('Invalid email or password. Please check your credentials.');
            break;
          default:
            setError('Login failed. Please check your email and password.');
        }
      } else {
        setError('An error occurred during login. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className={`min-h-screen ${isAffiliate ? 'bg-red-900' : 'bg-gray-100'} flex items-center justify-center p-4`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md border border-gray-200"
      >
        {/* Admin/Affiliate Toggle */}
        <div className="flex justify-center mb-6">
          <div className="bg-gray-100 p-1 rounded-lg flex">
            <button
              onClick={() => setIsAffiliate(false)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                !isAffiliate
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Admin
            </button>
            <button
              onClick={() => setIsAffiliate(true)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                isAffiliate
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Affiliate
            </button>
          </div>
        </div>

        {/* Interactive Brokers Logo and Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <img 
              src="/Screenshot 2025-06-07 024813.png" 
              alt="Interactive Brokers" 
              className="h-10 w-auto object-contain"
              style={{ 
                filter: 'none', 
                boxShadow: 'none', 
                background: 'transparent',
                mixBlendMode: 'normal',
                imageRendering: 'crisp-edges',
                WebkitImageRendering: 'crisp-edges',
                msInterpolationMode: 'nearest-neighbor'
              }}
            />
          </div>
          
          {/* Blue accent line */}
          <div className={`w-full h-1 ${isAffiliate ? 'bg-red-600' : 'bg-blue-600'} mb-6`}></div>
        </div>
        
        {error && (
          <div className={`${isAffiliate ? 'bg-red-100 border-red-300 text-red-800' : 'bg-red-50 border-red-200 text-red-700'} px-4 py-3 rounded-lg mb-6`}>
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Username Field */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <User size={20} className="text-gray-400" />
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full pl-12 pr-4 py-4 border border-gray-300 rounded-lg focus:ring-2 ${
                isAffiliate ? 'focus:ring-red-500 focus:border-red-500' : 'focus:ring-blue-500 focus:border-blue-500'
              } transition-colors text-lg bg-gray-50`}
              placeholder="Username"
              required
            />
          </div>
          
          {/* Password Field */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Lock size={20} className="text-gray-400" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full pl-12 pr-12 py-4 border border-gray-300 rounded-lg focus:ring-2 ${
                isAffiliate ? 'focus:ring-red-500 focus:border-red-500' : 'focus:ring-blue-500 focus:border-blue-500'
              } transition-colors text-lg bg-gray-50`}
              placeholder="Password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-4 flex items-center"
            >
              {showPassword ? (
                <EyeOff size={20} className="text-gray-400 hover:text-gray-600" />
              ) : (
                <Eye size={20} className="text-gray-400 hover:text-gray-600" />
              )}
            </button>
          </div>
          
          {/* Need help link */}
          <div className="text-right">
            <a href="#" className={`${isAffiliate ? 'text-red-600 hover:text-red-800' : 'text-blue-600 hover:text-blue-800'} text-sm`}>
              Need help?
            </a>
          </div>
          
          {/* Login Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full ${
              isAffiliate ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
            } text-white font-medium py-4 px-6 rounded-lg transition-colors text-lg disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Signing in...
              </div>
            ) : (
              'Login'
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default AdminLogin;