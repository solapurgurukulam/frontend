
import { useRef, useEffect } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { Mail, Phone, MapPin, User, Award, Sparkles } from 'lucide-react';

const ContactUs = () => {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const yParallax = useSpring(useTransform(scrollYProgress, [0, 1], [0, 100]), { stiffness: 100, damping: 30 });

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const fadeUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } }
  };
  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FDFAF5] to-[#FFFDF7] dark:from-gray-950 dark:to-gray-900 overflow-x-hidden">
      
      {/* Hero Section */}
      <section ref={heroRef} className="relative h-[60vh] md:h-[70vh] overflow-hidden">
        <motion.div style={{ y: yParallax }} className="absolute inset-0">
          <img
            src="/image/heroimg.jpeg"
            alt="Vedic temple background"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40" />
        </motion.div>

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white px-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="inline-flex items-center justify-center w-28 h-28 rounded-full bg-white/20 backdrop-blur-md border-2 border-white/50 shadow-xl mb-6"
          >
            <span className="text-6xl">ॐ</span>
          </motion.div>
          <motion.h1
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-5xl md:text-7xl font-bold drop-shadow-lg"
          >
            About Us
          </motion.h1>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="text-xl md:text-2xl max-w-3xl mt-4 drop-shadow-md text-amber-100"
          >
            Preserving Vedic wisdom and Shaiva Agama traditions for spiritual seekers worldwide.
          </motion.p>
          <motion.div
            className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <div className="w-5 h-8 rounded-full border-2 border-white/60 flex justify-center">
              <div className="w-1 h-2 bg-white/80 rounded-full mt-2" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Main Content with Animations - BIGGER IMAGE & TEXT */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
        className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10 pb-16"
      >
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-amber-200/40 p-8 md:p-12">
          <div className="flex flex-col lg:flex-row gap-12">
            {/* Left: About Text + Profile */}
            <div className="lg:w-2/3 space-y-6">
              <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center sm:items-start gap-8">
                <img
                  src="/image/image2.jpeg"
                  alt="Jangam Pradeep Shastri"
                  className="w-48 h-48 rounded-full border-4 border-amber-400/70 shadow-2xl object-cover"
                />
                <div className="text-center sm:text-left">
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Jangam Pradeep Shastri</h2>
                  <p className="text-xl text-amber-600 dark:text-amber-400 font-medium flex items-center justify-center sm:justify-start gap-2">
                    <Award className="h-5 w-5" /> Teacher, Solapur Veda Pathashala
                  </p>
                  <p className="text-base text-gray-500 dark:text-gray-400 mt-2 flex items-center justify-center sm:justify-start gap-2">
                    <MapPin className="h-4 w-4 text-amber-500" />
                    Pothangal, Kotagiri Mandal, Nizamabad District, Telangana
                  </p>
                </div>
              </motion.div>

              <motion.div variants={fadeUp} className="space-y-4 text-gray-700 dark:text-gray-300 leading-relaxed text-base">
                <p>
                  I am currently working as a <strong className="text-gray-900 dark:text-white">Teacher at Solapur Veda Pathashala</strong>.
                  Through my dedication to Vedic studies and scriptural knowledge, I have been honored with the title{' '}
                  <strong className="text-gray-900 dark:text-white">“Shastri”</strong>.
                </p>
                <p>
                  With a deep interest in Vedic rituals, Shaiva Agama traditions, and scriptural knowledge, I have created this
                  digital platform to share authentic spiritual knowledge with society in a simple and understandable way.
                </p>
              </motion.div>

              <motion.div
                variants={fadeUp}
                className="bg-amber-50/70 dark:bg-amber-900/20 rounded-xl p-6 border border-amber-200/50"
              >
                <p className="text-lg font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-2">
                  <Sparkles className="h-6 w-6" /> Through this platform, I aim to provide:
                </p>
                <ul className="list-disc list-inside mt-3 space-y-2 text-base text-gray-600 dark:text-gray-300">
                  <li><strong>Vedic rituals and Vedookta Pujas</strong></li>
                  <li><strong>Essence of Shaiva Agama</strong></li>
                  <li><strong>Scriptural methods and traditional practices</strong></li>
                </ul>
              </motion.div>

              <motion.div variants={fadeUp}>
                <p className="text-lg italic text-gray-500 dark:text-gray-400 border-l-4 border-amber-400 pl-5">
                  This is a humble effort to make Vedic and Agama knowledge accessible to everyone.
                </p>
                <p className="text-base text-gray-500 dark:text-gray-400 mt-3">
                  I sincerely thank <strong className="text-gray-700 dark:text-gray-300">Mr. Srikant</strong> and all
                  supporters who helped make this initiative possible.
                </p>
              </motion.div>
            </div>

            {/* Right: Contact Details - Also bigger */}
            <motion.div variants={fadeUp} className="lg:w-1/3">
              <div className="bg-white/60 dark:bg-gray-900/60 rounded-2xl p-7 border border-amber-200/30 shadow-inner h-full">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 flex items-center gap-2">
                  <Phone className="h-6 w-6 text-amber-500" /> Contact Details
                </h3>
                <div className="space-y-6 text-base text-gray-700 dark:text-gray-300">
                  <div className="flex items-start gap-4">
                    <User className="h-6 w-6 text-amber-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white text-lg">Name</p>
                      <p className="text-base">Jangam Pradeep Shastri</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <Award className="h-6 w-6 text-amber-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white text-lg">Position</p>
                      <p className="text-base">Teacher, Solapur Veda Pathashala</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <MapPin className="h-6 w-6 text-amber-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white text-lg">Address</p>
                      <a
                        href="https://www.google.com/maps/search/?api=1&query=Pothangal+Kotagiri+Mandal+Nizamabad+District+Telangana"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-base text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 transition-colors"
                      >
                        Pothangal, Kotagiri Mandal, Nizamabad District, Telangana
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <Phone className="h-6 w-6 text-amber-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white text-lg">Mobile</p>
                      <a
                        href="tel:+918978262883"
                        className="text-base text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 transition-colors"
                      >
                        8978262883
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <Mail className="h-6 w-6 text-amber-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white text-lg">Email</p>
                      <a
                        href="mailto:contact@solapurgurukulam.com"
                        className="text-base text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 transition-colors"
                      >
                        contact@solapurgurukulam.com
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ContactUs;

