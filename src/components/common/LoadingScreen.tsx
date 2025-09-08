import { motion } from 'framer-motion';

interface LoadingScreenProps {
  message?: string;
}

const LoadingScreen = ({ message = "We're preparing your dashboard" }: LoadingScreenProps) => {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center"
      >
        {/* Interactive Brokers Logo */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <img 
            src="/Screenshot 2025-06-07 024813.png" 
            alt="Interactive Brokers" 
            className="h-12 w-auto object-contain"
            style={{ filter: 'none', boxShadow: 'none', background: 'transparent' }}
          />
        </motion.div>
        
        {/* Loading Animation */}
        <motion.div
          animate={{
            width: ['0%', '100%', '0%']
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatType: "loop"
          }}
          className="h-1 bg-blue-600 rounded-full mb-6 w-32"
        />
        
        {/* Loading Message */}
        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-gray-700 font-medium text-center"
        >
          {message}
        </motion.p>
        
        {/* Subtitle */}
        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-gray-500 text-sm mt-2 text-center"
        >
          Initializing secure connection...
        </motion.p>
      </motion.div>
    </div>
  );
};

export default LoadingScreen;