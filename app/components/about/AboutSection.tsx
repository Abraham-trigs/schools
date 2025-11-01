"use client";

import { motion, useAnimation } from "framer-motion";
import { useInView } from "react-intersection-observer";
import Image from "next/image";

interface AboutSectionProps {}

const sectionVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const topics = [
  {
    title: "Curriculum & Academics",
    description:
      "Our curriculum blends core academics with innovative STEAM programs, digital literacy, and global perspectives. Small class sizes and personalized attention help every student reach their full potential.",
    image: "/curriculum.webp",
    clip: "polygon(50% 0%, 100% 20%, 80% 100%, 20% 80%, 0% 20%)",
    bubbleColors: ["#FFD700", "#FF6347", "#00CED1"],
  },
  {
    title: "Sports & Extracurriculars",
    description:
      "We offer a variety of sports and extracurricular programs to promote teamwork, leadership, and physical wellness. From football and athletics to arts and clubs, students explore their passions beyond the classroom.",
    image: "/sports.webp",
    clip: "polygon(40% 0%, 100% 20%, 80% 100%, 10% 80%, 0% 10%)",
    bubbleColors: ["#32CD32", "#FF69B4", "#1E90FF"],
  },
  {
    title: "Nutrition & Meals",
    description:
      "Our cafeteria serves balanced, nutritious meals designed to fuel active minds and bodies. Special attention is given to dietary needs and wholesome, fresh ingredients, ensuring students thrive throughout the day.",
    image: "/nutrition.webp",
    clip: "polygon(50% 0%, 90% 10%, 100% 80%, 60% 100%, 20% 70%, 0% 20%)",
    bubbleColors: ["#FFA500", "#ADFF2F", "#FF4500"],
  },
  {
    title: "Exposure & Experiences",
    description:
      "Students at Ford School regularly engage with state officials, industry leaders, and community influencers, gaining real-world insights. Our immersive excursions and educational trips spark curiosity, broaden perspectives, and create unforgettable experiences that extend learning beyond the classroom.",
    image: "/exposure.webp",
    clip: "polygon(45% 0%, 95% 15%, 85% 100%, 15% 85%, 0% 15%)",
    bubbleColors: ["#FF1493", "#00FA9A", "#1E90FF"],
  },
  {
    title: "Why Choose Ford School",
    description:
      "Ford School is committed to excellence, innovation, and holistic development. Our integrated approach ensures students excel academically, socially, and emotionally while developing character, resilience, and a lifelong love of learning.",
    image: "/FORD-SCHOOL-LOGO.webp",
    clip: "polygon(60% 0%, 100% 30%, 80% 100%, 30% 90%, 0% 40%)",
    bubbleColors: ["#FFD700", "#FF4500", "#00CED1"],
  },
];

// Function to lighten hex color
function lightenColor(hex: string, percent: number) {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, ((num >> 16) & 0xff) + 255 * (percent / 100));
  const g = Math.min(255, ((num >> 8) & 0xff) + 255 * (percent / 100));
  const b = Math.min(255, (num & 0xff) + 255 * (percent / 100));
  return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
}

export default function AboutSection({}: AboutSectionProps) {
  return (
    <motion.div
      key="about"
      className="relative min-h-screen text-[var(--typo)] px-6 md:px-12 py-12 mt-15"
      initial="hidden"
      animate="visible"
      exit={{ opacity: 0 }}
    >
      {/* Hero / Mission */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={sectionVariants}
        transition={{ duration: 0.6 }}
        className="max-w-5xl mx-auto text-center mb-16"
      >
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-[var(--ford-primary)]">
          About Ford School
        </h1>
        <p className="text-lg md:text-xl text-[var(--neutral-dark)] leading-relaxed">
          Ford School Limited is dedicated to nurturing curiosity, creativity,
          and excellence in every student. With a comprehensive curriculum,
          nutritious meals, vibrant sports programs, immersive exposures, and a
          nurturing environment, we prepare learners to thrive academically,
          socially, and emotionally. Every corner of our school reflects
          innovation, collaboration, and a commitment to lifelong learning.
        </p>
      </motion.section>

      {/* Topics Section */}
      <motion.section className="max-w-5xl mx-auto space-y-12 relative">
        {topics.map((topic, i) => {
          const controls = useAnimation();
          const [ref, inView] = useInView({
            triggerOnce: true,
            margin: "-100px",
          });

          if (inView) controls.start("visible");

          return (
            <motion.div
              ref={ref}
              key={i}
              initial="hidden"
              animate={controls}
              variants={sectionVariants}
              transition={{ duration: 0.8, delay: i * 0.15 }}
              className="flex flex-col md:flex-row items-start relative group"
            >
              {/* Topic Image */}
              <motion.div
                className="w-32 h-32 overflow-hidden shadow-lg flex-shrink-0 mb-4 md:mb-0 md:mr-6 relative z-10"
                style={{ clipPath: topic.clip }}
                animate={{
                  y: [0, -8, 0],
                  rotate: [0, 2, -2, 0],
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  repeatType: "loop",
                  ease: "easeInOut",
                }}
              >
                <Image
                  src={topic.image}
                  alt={topic.title}
                  width={128}
                  height={128}
                  className="object-cover w-full h-full"
                />
              </motion.div>

              <div className="flex-1 relative z-10">
                {/* Title + Highlight Background */}
                <div className="relative  flex items-center mb-2">
                  <div
                    className="absolute inset-0 rounded-2xl z-0"
                    style={{
                      backgroundColor: [
                        lightenColor(topic.bubbleColors[0], 20),
                      ],
                    }}
                  />
                  <h3 className="relative text-xl font-extrabold text-[var(--ford-primary)] px-4 py-2 z-10">
                    {topic.title}
                  </h3>
                </div>

                {/* Description */}
                <p className="text-[var(--ford-primary)] bg-[#8ea3c4]/20 font-bold rounded-b-4xl p-3.5 leading-relaxed">
                  {topic.description}
                </p>
              </div>

              {/* Optional Floating Bubbles */}
              {topic.bubbleColors.map((color, idx) => (
                <motion.div
                  key={idx}
                  className="absolute rounded-full opacity-30 z-0"
                  style={{
                    width: 24 + idx * 12,
                    height: 24 + idx * 12,
                    backgroundColor: color,
                    top: Math.random() * 80 - 20 + "%",
                    left: Math.random() * 80 - 20 + "%",
                  }}
                  animate={{ y: [0, -12, 0], x: [0, 8, -8, 0] }}
                  transition={{
                    duration: 6 + idx,
                    repeat: Infinity,
                    repeatType: "loop",
                    ease: "easeInOut",
                    delay: idx,
                  }}
                />
              ))}
            </motion.div>
          );
        })}
      </motion.section>
    </motion.div>
  );
}
