import { useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { motion, useReducedMotion, useMotionValue } from "framer-motion";
import { useQuery } from "@tanstack/react-query";

import {
  Clock,
  TrendingUp,
  BookOpen,
  Users,
  Sparkles,
  ArrowRight,
  Infinity as InfinityIcon,
  Compass,
  Volume2,
  Eye,
  Flower2,
  Feather,
  Sun,
  Music,
  Zap,
} from "lucide-react";
import { mantraApi } from "../../api/mantra.api";
import { categoryApi } from "../../api/category.api";
import {
  setFeaturedMantras,
  setPopularMantras,
  setDailyMantra,
} from "../../store/mantraSlice";
import { setCategories } from "../../store/categorySlice";
import SearchBar from "../../components/common/SearchBar";

const DEITY_ICONS = ["🕉️", "🔱", "🪔", "🌺", "☸️", "🐚", "🌸", "🙏"];
const sacredSyllables = [
  "ॐ",
  "न",
  "राम्",
  "म",
  "शि",
  "वा",
  "य",
  "हरि",
  "कृष्ण",
  "गो",
  "वि",
  "न्द",
];

// ─── Helper: build absolute image URL ───
const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
  return `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
};

// ─── Helper: get category image or icon ───
const getCategoryImageOrIcon = (categoryId, categoriesList, defaultIcon = "🕉️") => {
  const category = categoriesList.find(c => c._id === categoryId);
  if (category?.image) {
    return { type: "image", src: getImageUrl(category.image) };
  }
  // fallback to a deity icon based on category name
  if (category?.name) {
    const name = category.name.toLowerCase();
    let icon = defaultIcon;
    if (name.includes('ganesh') || name.includes('ganapati')) icon = '🔱';
    else if (name.includes('shiva') || name.includes('mahadev')) icon = '🕉️';
    else if (name.includes('durga') || name.includes('devi') || name.includes('goddess')) icon = '🌺';
    else if (name.includes('vishnu') || name.includes('narayan')) icon = '☸️';
    else if (name.includes('lakshmi')) icon = '🌸';
    else if (name.includes('saraswati')) icon = '📖';
    else if (name.includes('hanuman')) icon = '🙏';
    else if (name.includes('rama')) icon = '🏹';
    else if (name.includes('krishna')) icon = '🪔';
    else if (name.includes('gayatri')) icon = '🕊️';
    return { type: "icon", icon };
  }
  return { type: "icon", icon: defaultIcon };
};

const Home = () => {
  const shouldReduce = useReducedMotion();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const {
    featuredMantras = [],
    popularMantras = [],
    dailyMantra,
  } = useSelector((s) => s.mantras || {});
  const { categories = [] } = useSelector((s) => s.categories || {});
  const { isAuthenticated } = useSelector((state) => state.auth);
  const heroRef = useRef(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // ─── Scroll to top on page load ───
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      const { clientX, clientY } = e;
      const x = (clientX / window.innerWidth - 0.5) * 20;
      const y = (clientY / window.innerHeight - 0.5) * 20;
      mouseX.set(x);
      mouseY.set(y);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  const handleProtectedNavigation = (path) => {
    if (!isAuthenticated) {
      navigate(`/login?redirect=${encodeURIComponent(path)}`);
    } else {
      navigate(path);
    }
  };

  // Data fetching
  useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const data = await categoryApi.getAll({ limit: 8 });
      if (data?.categories) dispatch(setCategories(data.categories));
      else if (data?.data) dispatch(setCategories(data.data));
      return data;
    },
  });
useQuery({
    queryKey: ["featured-mantras"],
    staleTime: 0,
    queryFn: async () => {
      const data = await mantraApi.getFeatured();
      if (Array.isArray(data)) dispatch(setFeaturedMantras(data));
      return data;
    },
  });
  useQuery({
    queryKey: ["popular-mantras"],
    queryFn: async () => {
      const data = await mantraApi.getPopular();
      if (Array.isArray(data)) dispatch(setPopularMantras(data));
      return data;
    },
  });
  const { isLoading: dailyLoading } = useQuery({
    queryKey: ["daily-mantra"],
    queryFn: async () => {
      const data = await mantraApi.getDaily();
      if (data) dispatch(setDailyMantra(data));
      return data;
    },
  });

  const safeCategories = Array.isArray(categories) ? categories : [];
  const safeFeaturedMantras = Array.isArray(featuredMantras)
    ? featuredMantras
    : [];
  const safePopularMantras = Array.isArray(popularMantras)
    ? popularMantras
    : [];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  // ─── Helper to get category display for a mantra ───
  const getCategoryDisplay = (mantra) => {
    const catId = mantra.category?._id || mantra.category;
    if (!catId) return { type: "icon", icon: "🕉️" };
    return getCategoryImageOrIcon(catId, safeCategories);
  };

  return (
    <div className="bg-gradient-to-b from-[#FDFAF5] to-[#FFFDF7] dark:from-gray-950 dark:to-gray-900 font-sans overflow-x-hidden">
      {/* ─── HERO ─── (unchanged) */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[#FFFDF7] via-[#FDF3E0] to-[#FEF5E8] dark:from-gray-950 dark:via-[#1F132E] dark:to-gray-950" />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
          <div
            className="w-[500px] h-[500px] md:w-[700px] md:h-[700px] lg:w-[900px] lg:h-[900px]"
            style={{
              animation: shouldReduce
                ? "none"
                : "spin-slow 40s linear infinite",
            }}
          >
            <svg
              viewBox="0 0 200 200"
              className="w-full h-full opacity-25 dark:opacity-15"
              fill="none"
            >
              <circle
                cx="100"
                cy="100"
                r="90"
                stroke="#E8890A"
                strokeWidth="1.2"
                strokeOpacity="0.8"
              />
              <circle
                cx="100"
                cy="100"
                r="80"
                stroke="#E8890A"
                strokeWidth="0.8"
                strokeOpacity="0.5"
              />
              <circle
                cx="100"
                cy="100"
                r="70"
                stroke="#E8890A"
                strokeWidth="0.5"
                strokeOpacity="0.3"
                strokeDasharray="4 4"
              />
              <circle
                cx="100"
                cy="100"
                r="18"
                fill="#E8890A"
                fillOpacity="0.2"
                stroke="#E8890A"
                strokeWidth="1"
                strokeOpacity="0.7"
              />
              <circle
                cx="100"
                cy="100"
                r="8"
                fill="#E8890A"
                fillOpacity="0.4"
              />
              {[...Array(24)].map((_, i) => {
                const angle = (i * 360) / 24;
                const rad = (angle * Math.PI) / 180;
                const x1 = 100 + 20 * Math.cos(rad);
                const y1 = 100 + 20 * Math.sin(rad);
                const x2 = 100 + 85 * Math.cos(rad);
                const y2 = 100 + 85 * Math.sin(rad);
                return (
                  <line
                    key={i}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="#E8890A"
                    strokeWidth="0.7"
                    strokeOpacity="0.6"
                  />
                );
              })}
              {[...Array(24)].map((_, i) => {
                const angle = (i * 360) / 24;
                const rad = (angle * Math.PI) / 180;
                const cx = 100 + 93 * Math.cos(rad);
                const cy = 100 + 93 * Math.sin(rad);
                return (
                  <circle
                    key={`dot-${i}`}
                    cx={cx}
                    cy={cy}
                    r="1.8"
                    fill="#E8890A"
                    fillOpacity="0.7"
                  />
                );
              })}
              {sacredSyllables.map((syllable, idx) => {
                const angle = (idx * 360) / sacredSyllables.length;
                const rad = (angle * Math.PI) / 180;
                const radius = 62;
                const x = 100 + radius * Math.cos(rad);
                const y = 100 + radius * Math.sin(rad);
                return (
                  <text
                    key={idx}
                    x={x}
                    y={y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#E8890A"
                    fillOpacity="0.65"
                    fontSize="7"
                    fontWeight="bold"
                    fontFamily="serif"
                  >
                    {syllable}
                  </text>
                );
              })}
            </svg>
          </div>
        </div>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-amber-300/20 dark:bg-amber-500/10 blur-3xl"
            animate={{ scale: [1, 1.2, 1], x: [0, 30, 0], y: [0, -20, 0] }}
            transition={{ duration: 15, repeat: Infinity }}
          />
          <motion.div
            className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-amber-400/20 dark:bg-amber-600/10 blur-3xl"
            animate={{ scale: [1, 1.3, 1], x: [0, -40, 0], y: [0, 30, 0] }}
            transition={{ duration: 18, repeat: Infinity }}
          />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", bounce: 0.4, duration: 0.8 }}
            style={{ x: mouseX, y: mouseY }}
            className="inline-flex items-center justify-center w-28 h-28 rounded-full bg-white/40 dark:bg-gray-800/40 backdrop-blur-md border border-amber-400/50 shadow-xl mb-6"
          >
            <motion.span
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="text-6xl text-amber-700 dark:text-amber-400"
            >
              ॐ
            </motion.span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.7 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold tracking-tight leading-tight"
          >
            <span className="bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              Solapur
            </span>
            <br className="block sm:hidden" />
            <span className="bg-gradient-to-r from-[#E8890A] to-[#F5A623] bg-clip-text text-transparent whitespace-nowrap">
              Gurukulam
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mt-4 md:mt-5 leading-relaxed"
          >
            Sacred mantras, ancient wisdom, and a path to inner peace.
          </motion.p>
          {isAuthenticated && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="max-w-xl mx-auto mt-8"
            >
              <SearchBar />
            </motion.div>
          )}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="flex justify-center mt-8"
          >
            <motion.button
              onClick={() => handleProtectedNavigation("/categories")}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              animate={{
                boxShadow: [
                  "0px 0px 0px rgba(245,166,35,0)",
                  "0px 0px 15px rgba(245,166,35,0.6)",
                  "0px 0px 0px rgba(245,166,35,0)",
                ],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="px-6 py-3 sm:px-8 sm:py-3 rounded-full border-2 border-amber-500 text-amber-700 dark:text-amber-400 font-semibold hover:bg-amber-50 dark:hover:bg-white/10 transition-all duration-300"
            >
              Browse Mantras
            </motion.button>
          </motion.div>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-wrap justify-center gap-6 sm:gap-8 mt-12 sm:mt-16 pt-6 sm:pt-8 border-t border-amber-200/40 dark:border-gray-800"
          >
            {[
              { IconComponent: Music, label: "Mantras", value: "500+" },
              { IconComponent: Users, label: "Seekers", value: "10K+" },
              { IconComponent: Compass, label: "Categories", value: "20+" },
            ].map(({ IconComponent, label, value }) => (
              <motion.div
                key={label}
                variants={itemVariants}
                whileHover={{ scale: 1.05 }}
                className="text-center"
              >
                <IconComponent className="h-5 w-5 text-amber-600 mx-auto mb-1" />
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  {value}
                </p>
                <p className="text-[11px] sm:text-xs uppercase tracking-wide text-gray-500">
                  {label}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
        <motion.div
          className="absolute bottom-6 left-1/2 transform -translate-x-1/2"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <div className="w-5 h-8 rounded-full border border-amber-400 flex justify-center">
            <div className="w-0.5 h-1.5 bg-amber-400 rounded-full mt-2" />
          </div>
        </motion.div>
      </section>

      {/* ─── DAILY MANTRA ─── with category image/icon, no rotating OM ─── */}
      {dailyMantra && !dailyLoading && (
        <section className="py-20 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-amber-50/30 to-transparent dark:from-amber-950/10" />
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-8"
            >
              <span className="inline-flex items-center gap-1.5 bg-white dark:bg-gray-800 shadow-sm border border-amber-200/40 text-amber-800 dark:text-amber-300 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider">
                <Sun className="h-3.5 w-3.5" /> Daily Inspiration
              </span>
              <h2 className="text-3xl md:text-4xl font-bold mt-4 text-gray-900 dark:text-white">
                Mantra of the Day
              </h2>
            </motion.div>

            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.01 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-amber-200/40 overflow-hidden transition-colors duration-300 hover:bg-amber-50/70 dark:hover:bg-gray-800/90"
            >
              {/* ✅ Removed the rotating OM background element */}
              {/* <div className="absolute inset-0 flex items-center justify-center pointer-events-none"> ... </div> */}

              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />

              <div className="relative z-10 p-8 md:p-10 text-center">
                {/* ── Category Image / Icon ── */}
                <div className="flex justify-center mb-5">
                  <motion.div
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 4, repeat: Infinity }}
                    className="relative w-20 h-20 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/40 dark:to-amber-800/40 flex items-center justify-center shadow-inner overflow-hidden"
                  >
                    {(() => {
                      const display = getCategoryDisplay(dailyMantra);
                      if (display.type === "image") {
                        return (
                          <img
                            src={display.src}
                            alt={dailyMantra.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = "none";
                              const parent = e.target.parentElement;
                              parent.innerHTML = `<span class="text-3xl text-amber-700">🕉️</span>`;
                            }}
                          />
                        );
                      } else {
                        return <span className="text-3xl text-amber-700">{display.icon}</span>;
                      }
                    })()}
                  </motion.div>
                </div>

                <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                  {dailyMantra.name || "Sacred Chant"}
                </h3>

                <p className="text-gray-600 dark:text-gray-300 text-base md:text-lg mt-3 max-w-lg mx-auto leading-relaxed">
                  {dailyMantra.benefits ||
                    "Chant this mantra to align with universal peace"}
                </p>

                <div className="flex flex-wrap justify-center gap-3 mt-6">
                  <span className="inline-flex items-center gap-1.5 bg-amber-50 dark:bg-gray-700/60 px-4 py-2 rounded-full text-sm text-gray-600 dark:text-gray-300 border border-amber-200/40">
                    <Clock className="h-4 w-4 text-amber-500" />
                    {dailyMantra.bestTime || "Sunrise"}
                  </span>
                  <span className="inline-flex items-center gap-1.5 bg-amber-50 dark:bg-gray-700/60 px-4 py-2 rounded-full text-sm text-gray-600 dark:text-gray-300 border border-amber-200/40">
                    <TrendingUp className="h-4 w-4 text-amber-500" />
                    {dailyMantra.recommendedCount || 108} times
                  </span>
                </div>

                <div className="mt-8">
                  <motion.button
                    onClick={() =>
                      handleProtectedNavigation(
                        `/mantra/${dailyMantra.slug || "#"}`
                      )
                    }
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold shadow-md hover:shadow-lg transition-all"
                  >
                    Start Chanting <Volume2 className="h-4 w-4" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* ─── CATEGORIES ─── (unchanged) */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col md:flex-row md:items-end md:justify-between mb-12"
          >
            <div>
              <h2 className="text-3xl md:text-4xl font-bold">
                Explore <span className="text-amber-600">Sacred Categories</span>
              </h2>
              <p className="text-gray-500 mt-2">
                Find mantras by deity, purpose, or tradition
              </p>
            </div>
            <button
              onClick={() => handleProtectedNavigation("/categories")}
              className="mt-4 md:mt-0 inline-flex items-center gap-2 text-amber-600 hover:text-amber-700 font-medium text-sm group transition-all"
            >
              Explore More
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>

          {safeCategories.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Sparkles className="mx-auto h-10 w-10 opacity-40" />
              <p>Loading categories...</p>
            </div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {safeCategories.slice(0, 8).map((cat, idx) => {
                const imageUrl = getImageUrl(cat.image);
                const icon = DEITY_ICONS[idx % DEITY_ICONS.length];
                return (
                  <motion.div
                    key={cat._id || idx}
                    variants={itemVariants}
                    whileHover={{ y: -6 }}
                    className="group cursor-pointer"
                  >
                    <div
                      onClick={() =>
                        handleProtectedNavigation(`/category/${cat.slug || "#"}`)
                      }
                      className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-xl group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={cat.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.style.display = "none";
                                const parent = e.target.parentElement;
                                const iconSpan = document.createElement("span");
                                iconSpan.className = "text-xl";
                                iconSpan.textContent = icon;
                                parent.appendChild(iconSpan);
                              }}
                            />
                          ) : (
                            <span className="text-xl">{icon}</span>
                          )}
                        </div>
                        <h3 className="text-base font-bold text-gray-800 dark:text-white group-hover:text-amber-600 transition-colors line-clamp-1">
                          {cat.name}
                        </h3>
                      </div>
                      <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-2 leading-relaxed">
                        {cat.description ||
                          "Explore mantras in this category"}
                      </p>
                      <div className="mt-3 flex items-center gap-2 text-amber-600 font-medium text-xs group-hover:gap-3 transition-all">
                        <span>Browse</span>
                        <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>
      </section>

      {/* ─── FEATURED MANTRAS ─── (unchanged) */}
      <section className="py-20 bg-[#FDFAF5] dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold">
              Featured <span className="text-amber-600">Mantras</span>
            </h2>
            <p className="text-gray-500 mt-2">
              Powerful chants for daily practice
            </p>
          </motion.div>
          {safeFeaturedMantras.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              No featured mantras yet
            </div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {safeFeaturedMantras.slice(0, 6).map((mantra, idx) => {
                const display = getCategoryDisplay(mantra);
                return (
                  <motion.div
                    key={mantra._id || idx}
                    variants={itemVariants}
                    whileHover={{ y: -6 }}
                    onClick={() =>
                     handleProtectedNavigation(`/mantra/${mantra.slug}`)
                    }
                    className="group relative bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 cursor-pointer transition-all duration-300 hover:shadow-xl overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-amber-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/40 dark:to-amber-800/40 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-300">
                          {display.type === "image" ? (
                            <img
                              src={display.src}
                              alt={mantra.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.style.display = "none";
                                const parent = e.target.parentElement;
                                parent.innerHTML = `<span class="text-xl text-amber-700">🕉️</span>`;
                              }}
                            />
                          ) : (
                            <span className="text-xl text-amber-700">{display.icon}</span>
                          )}
                        </div>
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white group-hover:text-amber-600 transition-colors">
                          {mantra.name}
                        </h3>
                      </div>
                      <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-2 leading-relaxed">
                        {mantra.benefits ||
                          "Recite this mantra for inner peace and strength"}
                      </p>
                      <div className="flex justify-between items-center mt-4 text-xs text-gray-400">
                        <span>{mantra.totalShlokas || 0} shlokas</span>
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" /> {mantra.views || 0} chants
                        </span>
                      </div>
                      <div className="mt-4 flex justify-end">
                        <span className="inline-flex items-center gap-1 text-amber-600 font-medium text-sm opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                          Explore <ArrowRight className="h-4 w-4" />
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>
      </section>

      {/* ─── POPULAR MANTRAS ─── (unchanged) */}
      <section className="py-20 bg-white dark:bg-gray-900 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2 className="text-3xl md:text-4xl font-bold">
              Most <span className="text-amber-600">Chanted</span> Mantras
            </h2>
            <p className="text-gray-500 mt-2">
              Beloved by spiritual seekers worldwide
            </p>
          </motion.div>
          {safePopularMantras.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              No popular mantras yet
            </div>
          ) : (
            <div className="relative overflow-hidden">
              <motion.div
                className="flex gap-5"
                style={{ width: "max-content" }}
                animate={{
                  x: ["0%", "-50%"],
                }}
                transition={{
                  duration: 25,
                  repeat: Infinity,
                  ease: "linear",
                }}
                whileHover={{ animationPlayState: "paused" }}
              >
                {[...safePopularMantras, ...safePopularMantras].map(
                  (mantra, idx) => {
                    const display = getCategoryDisplay(mantra);
                    return (
                      <motion.div
                        key={`${mantra._id || idx}-${idx}`}
                        whileHover={{ scale: 1.04, y: -6 }}
                        onClick={() =>
                          handleProtectedNavigation(`/mantra/${mantra.slug}`)
                        }
                        className="flex-shrink-0 w-64 snap-start cursor-pointer"
                      >
                        <div className="relative bg-gradient-to-br from-white to-amber-50/30 dark:from-gray-800 dark:to-gray-800/80 rounded-2xl p-5 shadow-md border border-amber-200/40 h-full transition-all duration-300 hover:shadow-2xl overflow-hidden group">
                          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                          <div className="flex items-start justify-between">
                            <div
                              className={`text-4xl font-bold ${idx < 3 ? "text-amber-500" : "text-gray-300 dark:text-gray-600"} group-hover:scale-110 transition-transform duration-300`}
                            >
                              #{idx + 1}
                            </div>
                            <div className="flex items-center gap-1 bg-amber-500/10 dark:bg-amber-400/10 px-2 py-0.5 rounded-full text-xs font-medium text-amber-700 dark:text-amber-300">
                              <Zap className="h-3 w-3" /> Popular
                            </div>
                          </div>
                          <div className="flex items-center gap-3 mt-2">
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/40 dark:to-amber-800/40 flex items-center justify-center shadow-inner flex-shrink-0">
                              {display.type === "image" ? (
                                <img
                                  src={display.src}
                                  alt={mantra.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.style.display = "none";
                                    const parent = e.target.parentElement;
                                    parent.innerHTML = `<span class="text-xl text-amber-700">🕉️</span>`;
                                  }}
                                />
                              ) : (
                                <span className="text-xl text-amber-700">{display.icon}</span>
                              )}
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-amber-600 transition-colors truncate">
                              {mantra.name}
                            </h3>
                          </div>
                          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 line-clamp-2">
                            {mantra.benefits || "Popular chant"}
                          </p>
                          <div className="mt-4 flex justify-between items-center text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />{" "}
                              {mantra.views || 0} chants
                            </span>
                            <span className="text-amber-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              Chant Now →
                            </span>
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </div>
                      </motion.div>
                    );
                  }
                )}
              </motion.div>
            </div>
          )}
        </div>
      </section>

      {/* ─── TESTIMONIAL ─── (unchanged) */}
      <section className="py-20 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-gray-800 dark:to-gray-900">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            <Feather className="h-8 w-8 text-amber-600 mx-auto" />
            <p className="text-lg md:text-xl italic text-gray-700 dark:text-gray-200">
              "ॐ सह नाववतु । सह नौ भुनक्तु । सह वीर्यं करवावहै ।"
            </p>
            <p className="text-sm text-amber-600">— Taittiriya Upanishad</p>
          </motion.div>
        </div>
      </section>

      {/* ─── FINAL CTA ─── (unchanged) */}
      {!isAuthenticated && (
        <section className="py-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#E8890A] to-[#B85C00]" />
          <div className="absolute inset-0 opacity-20 bg-[url('data:image/svg+xml,%3Csvg...')] bg-repeat" />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center text-white px-4 relative z-10"
          >
            <InfinityIcon className="h-12 w-12 mx-auto mb-4 opacity-90" />
            <h2 className="text-3xl md:text-5xl font-bold mb-3">
              Begin Your Spiritual Journey
            </h2>
            <p className="text-base text-amber-100 mb-6">
              Create an account to access all mantras, save your favourites, and
              track your progress.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                to="/register"
                className="px-6 py-2 rounded-full bg-white text-amber-700 font-semibold shadow hover:shadow-lg transition hover:scale-105"
              >
                Create Account
              </Link>
              <Link
                to="/login"
                className="px-6 py-2 rounded-full border-2 border-white text-white hover:bg-white/20 transition hover:scale-105"
              >
                Sign In
              </Link>
            </div>
          </motion.div>
        </section>
      )}

      <style>{`
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};

export default Home;
