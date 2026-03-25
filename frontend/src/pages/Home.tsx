import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, Stars } from 'lucide-react';

const Home: React.FC = () => {
  const [days, setDays] = useState(0);
  const startDate = new Date('2024-01-01'); // Hãy thay đổi ngày bắt đầu tại đây

  useEffect(() => {
    const calculateDays = () => {
      const diff = Math.abs(new Date().getTime() - startDate.getTime());
      setDays(Math.ceil(diff / (1000 * 60 * 60 * 24)));
    };
    calculateDays();
  }, []);

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 text-center">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="flex justify-center mb-6">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <Heart size={60} className="text-primary fill-primary" />
          </motion.div>
        </div>
        
        <h1 className="text-5xl font-bold mb-4 text-gray-800">Chúng ta đã bên nhau</h1>
        
        <div className="relative inline-block my-8">
          <Stars className="absolute -top-6 -left-6 text-yellow-400" />
          <span className="text-8xl font-black text-primary romantic-font leading-tight">
            {days}
          </span>
          <Stars className="absolute -bottom-6 -right-6 text-yellow-400" />
        </div>
        
        <p className="text-2xl font-semibold text-gray-600">Ngày hạnh phúc</p>
        
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          <FeatureCard 
            title="Ghi dấu kỷ niệm" 
            desc="Lưu lại những khoảnh khắc đáng nhớ nhất của chúng mình."
            color="bg-pink-100"
          />
          <FeatureCard 
            title="Sổ tay ẩm thực" 
            desc="Đi ăn ở đâu, món gì ngon nhất đều ở đây cả."
            color="bg-orange-100"
          />
          <FeatureCard 
            title="Lén chuẩn bị" 
            desc="Những bất ngờ dành riêng cho em mà em chưa hề biết."
            color="bg-red-100"
          />
        </div>
      </motion.div>
    </div>
  );
};

const FeatureCard: React.FC<{ title: string, desc: string, color: string }> = ({ title, desc, color }) => (
  <div className={`${color} p-6 rounded-3xl text-left border-2 border-transparent hover:border-white shadow-sm card-hover transition-all`}>
    <h3 className="text-xl font-bold mb-2 text-gray-800">{title}</h3>
    <p className="text-gray-600 text-sm leading-relaxed">{desc}</p>
  </div>
);

export default Home;
