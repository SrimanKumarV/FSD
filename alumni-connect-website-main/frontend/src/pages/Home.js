import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Users, 
  Briefcase, 
  Calendar, 
  MessageSquare, 
  Code, 
  Award,
  ArrowRight,
  CheckCircle,
  Star,
  Globe,
  Shield,
  Zap
} from 'lucide-react';

const Home = () => {
  const features = [
    {
      icon: <Users className="w-8 h-8 text-alumni-500" />,
      title: 'Mentorship Program',
      description: 'Connect with experienced alumni for career guidance and personal development.',
      color: 'alumni'
    },
    {
      icon: <Briefcase className="w-8 h-8 text-student-500" />,
      title: 'Job Opportunities',
      description: 'Discover internships and job openings posted by successful alumni.',
      color: 'student'
    },
    {
      icon: <Calendar className="w-8 h-8 text-primary-500" />,
      title: 'Events & Webinars',
      description: 'Attend industry events, workshops, and networking sessions.',
      color: 'primary'
    },
    {
      icon: <MessageSquare className="w-8 h-8 text-success-500" />,
      title: 'Discussion Forum',
      description: 'Engage in meaningful discussions about career, skills, and industry trends.',
      color: 'success'
    },
    {
      icon: <Code className="w-8 h-8 text-warning-500" />,
      title: 'Coding Contests',
      description: 'Participate in competitive programming challenges and hackathons.',
      color: 'warning'
    },
    {
      icon: <Award className="w-8 h-8 text-error-500" />,
      title: 'Success Stories',
      description: 'Learn from alumni career journeys and achievements.',
      color: 'error'
    }
  ];

  const stats = [
    { number: '1000+', label: 'Active Students' },
    { number: '500+', label: 'Alumni Mentors' },
    { number: '200+', label: 'Job Opportunities' },
    { number: '50+', label: 'Events Hosted' }
  ];

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Software Engineer at Google',
      content: 'Alumnex Connect helped me find my dream job through alumni networking. The mentorship program was invaluable.',
      avatar: '/avatars/sarah.jpg'
    },
    {
      name: 'Michael Chen',
      role: 'Data Scientist at Microsoft',
      content: 'As an alumni, I love giving back to students. The platform makes it easy to share knowledge and opportunities.',
      avatar: '/avatars/michael.jpg'
    },
    {
      name: 'Emily Rodriguez',
      role: 'Product Manager at Amazon',
      content: 'The coding contests helped me improve my technical skills and connect with like-minded professionals.',
      avatar: '/avatars/emily.jpg'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Navigation */}
      <nav className="glass-card bg-white/80 dark:bg-gray-900/80 sticky top-0 z-50 border-b-0 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center gap-3">
                <img src="/logo.png" alt="Logo" className="w-10 h-10 rounded-full shadow-md" />
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-alumni-600 bg-clip-text text-transparent">
                  Alumnex Connect
                </h1>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <Link to="/login" className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 px-3 py-2 rounded-xl text-sm font-bold transition-colors">
                  Login
                </Link>
                <Link to="/register" className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-32">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-primary-400/20 to-transparent dark:from-primary-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-alumni-400/20 to-transparent dark:from-alumni-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-5xl md:text-7xl font-bold text-gray-900 dark:text-white mb-6 drop-shadow-sm"
            >
              Connect. Learn.{' '}
              <span className="bg-gradient-to-r from-primary-600 to-alumni-600 bg-clip-text text-transparent">
                Grow.
              </span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 mb-12 max-w-3xl mx-auto font-medium"
            >
              The ultimate platform connecting current students with successful alumni for mentorship, 
              career guidance, job opportunities, and professional networking.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link 
                to="/register"
                className="inline-flex items-center px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl text-lg transition-all duration-300 transform hover:-translate-y-1 shadow-lg hover:shadow-xl hover:shadow-primary-500/30"
              >
                Start Your Journey
                <ArrowRight className="ml-2 w-6 h-6" />
              </Link>
              <Link 
                to="/login"
                className="inline-flex items-center px-8 py-4 glass-card bg-white/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800 text-gray-900 dark:text-white font-bold rounded-xl text-lg transition-all duration-300 transform hover:-translate-y-1 shadow-md hover:shadow-lg"
              >
                Sign In
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white dark:bg-gray-900 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-50/50 to-white dark:from-gray-900/50 dark:to-gray-900"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-4xl font-bold text-gray-900 dark:text-white mb-4"
            >
              Everything You Need to Succeed
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto font-medium"
            >
              Our comprehensive platform provides all the tools and connections you need 
              to advance your career and build meaningful professional relationships.
            </motion.p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className="glass-card bg-white/50 dark:bg-gray-800/50 rounded-2xl p-8 transition-all duration-300 relative group overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent dark:from-gray-700/40 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative z-10">
                  <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl inline-block shadow-sm">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 font-medium leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-700 to-primary-900 dark:from-gray-800 dark:to-gray-900"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                className="text-white glass-card bg-white/10 border-white/20 p-8 rounded-2xl"
              >
                <div className="text-4xl md:text-5xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-300">
                  {stat.number}
                </div>
                <div className="text-primary-100 font-medium text-lg">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-4xl font-bold text-gray-900 dark:text-white mb-4"
            >
              What Our Community Says
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto font-medium"
            >
              Hear from students and alumni who have transformed their careers through our platform.
            </motion.p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                whileHover={{ y: -5 }}
                className="glass-card bg-white/80 dark:bg-gray-800/80 rounded-3xl p-8 text-center relative"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary-400/10 dark:bg-primary-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="flex justify-center mb-8 relative z-10">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-alumni-500 rounded-2xl rotate-12 flex items-center justify-center shadow-lg">
                    <Star className="w-8 h-8 text-white -rotate-12" />
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-8 italic font-medium leading-relaxed relative z-10">
                  "{testimonial.content}"
                </p>
                <div className="relative z-10">
                  <div className="font-bold text-gray-900 dark:text-white text-lg">
                    {testimonial.name}
                  </div>
                  <div className="text-primary-600 dark:text-primary-400 font-semibold text-sm">
                    {testimonial.role}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gray-900"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-alumni-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-4xl md:text-5xl font-bold text-white mb-6"
          >
            Ready to Transform Your Career?
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto font-medium"
          >
            Join thousands of students and alumni who are already building their future 
            through meaningful connections and opportunities.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <Link 
              to="/register"
              className="inline-flex items-center px-10 py-5 bg-gradient-to-r from-primary-600 to-alumni-600 hover:from-primary-500 hover:to-alumni-500 text-white font-bold rounded-xl text-xl transition-all duration-300 transform hover:-translate-y-1 shadow-xl hover:shadow-2xl shadow-primary-500/20"
            >
              Get Started Today
              <ArrowRight className="ml-3 w-6 h-6" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-950 text-gray-400 py-16 relative z-10 border-t border-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <img src="/logo.png" alt="Logo" className="w-10 h-10 rounded-full shadow-md" />
                <h3 className="text-2xl font-bold bg-gradient-to-r from-primary-500 to-alumni-500 bg-clip-text text-transparent">Alumnex Connect</h3>
              </div>
              <p className="text-sm font-medium leading-relaxed">
                Connecting students with alumni for mentorship, career guidance, and professional growth.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-gray-200 mb-6 uppercase tracking-wider text-sm">Platform</h4>
              <ul className="space-y-4 text-sm font-medium">
                <li><Link to="/mentorship" className="hover:text-primary-400 transition-colors">Mentorship</Link></li>
                <li><Link to="/jobs" className="hover:text-primary-400 transition-colors">Jobs</Link></li>
                <li><Link to="/events" className="hover:text-primary-400 transition-colors">Events</Link></li>
                <li><Link to="/forum" className="hover:text-primary-400 transition-colors">Forum</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-gray-200 mb-6 uppercase tracking-wider text-sm">Support</h4>
              <ul className="space-y-4 text-sm font-medium">
                <li><Link to="/help" className="hover:text-primary-400 transition-colors">Help Center</Link></li>
                <li><Link to="/contact" className="hover:text-primary-400 transition-colors">Contact Us</Link></li>
                <li><Link to="/faq" className="hover:text-primary-400 transition-colors">FAQ</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-gray-200 mb-6 uppercase tracking-wider text-sm">Legal</h4>
              <ul className="space-y-4 text-sm font-medium">
                <li><Link to="/privacy" className="hover:text-primary-400 transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-primary-400 transition-colors">Terms of Service</Link></li>
                <li><Link to="/cookies" className="hover:text-primary-400 transition-colors">Cookie Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-900 mt-16 pt-8 text-center text-sm font-medium">
            <p>&copy; {new Date().getFullYear()} Alumnex Connect. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
