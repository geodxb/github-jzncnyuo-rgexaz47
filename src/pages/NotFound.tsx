import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Button from '../components/common/Button';
import { ShieldCheck } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <div className="mb-8">
          <span className="text-9xl font-bold text-purple-500">404</span>
          <h1 className="text-4xl font-bold text-gray-800 mt-4">Page Not Found</h1>
          <p className="text-gray-600 mt-2">The page you're looking for doesn't exist or has been moved.</p>
        </div>
        
        <div className="flex space-x-4">
          <Link to="/login">
            <Button variant="primary">
              Login
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default NotFound;