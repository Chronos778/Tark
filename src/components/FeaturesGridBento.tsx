import { motion } from 'framer-motion';

const FeaturesGridBento = () => {
  const features = [
    {
      title: 'IPC vs BNS Comparison',
      description: 'Side-by-side analysis of Indian Penal Code and Bharatiya Nyaya Sanhita with instant diff highlighting',
      icon: '⚖️',
      size: 'col-span-2 row-span-1',
      // gradient: 'from-blue-500/20 to-purple-500/20'
    },
    {
      title: 'AI Legal Assistant',
      description: 'Ask questions in natural language and get precise answers with case law citations',
      icon: '💬',
      size: 'col-span-1 row-span-2',
      // gradient: 'from-green-500/20 to-blue-500/20'
    },
    {
      title: 'Document Summarizer',
      description: 'Condense lengthy legal documents into actionable insights in seconds',
      icon: '📄',
      size: 'col-span-1 row-span-1',
      // gradient: 'from-orange-500/20 to-red-500/20'
    },
    {
      title: 'Neutral Analysis',
      description: 'Unbiased AI-powered interpretation of legal changes and implications',
      icon: '🔍',
      size: 'col-span-1 row-span-1',
      // gradient: 'from-purple-500/20 to-pink-500/20'
    },
    {
      title: 'Case Law Search',
      description: 'Instantly search through landmark Supreme Court judgments and precedents',
      icon: '📚',
      size: 'col-span-1 row-span-1',
      // gradient: 'from-cyan-500/20 to-blue-500/20'
    },
    {
      title: 'Secure & Private',
      description: 'Enterprise-grade security with full data privacy compliance for all queries',
      icon: '🔒',
      size: 'col-span-2 row-span-1',
      // gradient: 'from-red-500/20 to-orange-500/20'
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  };

  return (
    <section id="features" className="py-20 px-4">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-[#f8f8f8]">
            Powerful Features
          </h2>
          <p className="text-xl max-w-2xl mx-auto text-[#f8f8f8]/70">
            Everything you need to navigate the transition from IPC to BNS with confidence
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 md:grid-rows-3 gap-4 md:h-[600px]"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ 
                scale: 1.02,
                transition: { duration: 0.2 }
              }}
              className={`
                ${feature.size} p-6 rounded-2xl cursor-pointer group
                bg-[#09090B] border border-[#f8f8f8]/20 hover:border-[#f8f8f8]/40
                relative overflow-hidden transition-all duration-300
              `}
            >
              {/* Background Gradient */}
              {/* Background Gradient - Removed */}
              {/* <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} /> */}
              
              <div className="relative z-10 h-full flex flex-col">
                <div className="text-3xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold mb-3 text-[#f8f8f8]">
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-[#f8f8f8]/70">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturesGridBento;
