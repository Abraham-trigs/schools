"use client";

import { motion } from "framer-motion";
import { useInView, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import Navbar from "@/app/components/home/NavBar.tsx";
import ScrollingCards from "@/app/components/home/ScrollingCards.tsx";
import Logo from "./components/home/Logo.tsx";
import Image from "next/image";
import CareerAndClassSection from "./components/home/CareerAndClassSection.tsx";
import InspiringLeadersSection from "./components/home/InspiringLeadersSection.tsx";
import QualitiesSection from "./components/home/QualitiesSection.tsx";
import ProprietorSection from "./components/home/ProprietorSection.tsx";
import SchoolStaffSection from "./components/home/SchoolStaffSection.tsx";
import GalleryPage from "./components/gallery/GalleryPage.tsx";
import AboutSection from "./components/about/AboutSection.tsx";
import ContactSection from "./components/home/ContactSection.tsx";

// --- Data Definitions ---
const testimonials = [
  {
    id: 1,
    name: "Jane Doe",
    role: "Parent",
    feedback: "Ford School has transformed my child's learning experience!",
  },
  {
    id: 2,
    name: "John Smith",
    role: "Teacher",
    feedback: "The management system makes daily tasks seamless and efficient.",
  },
  {
    id: 3,
    name: "Alice Johnson",
    role: "Student",
    feedback:
      "I love how organized everything is — it's easy to track assignments!",
  },
];

const faqs = [
  {
    id: 1,
    question: "How do I enroll my child?",
    answer:
      "You can click the 'Enroll Now' button at the top of the homepage and follow the registration process.",
  },
  {
    id: 2,
    question: "Does Ford School offer online classes?",
    answer:
      "Yes, we provide online learning modules for students who cannot attend in person.",
  },
  {
    id: 3,
    question: "Can parents track academic progress?",
    answer:
      "Absolutely! Our platform allows parents to monitor grades, attendance, and reports.",
  },
];

// --- Animation Variants ---
const sectionVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0 },
};

export default function HomePage() {
  const [showGallery, setShowGallery] = useState(false);
  const [activePage, setActivePage] = useState<
    "home" | "gallery" | "about" | "contact"
  >("home");

  const testimonialsRef = useRef(null);
  const faqRef = useRef(null);
  const videoRef = useRef(null);

  const isTestimonialsInView = useInView(testimonialsRef, {
    once: true,
    margin: "-100px",
  });
  const isVideoInView = useInView(videoRef, { once: true, margin: "-100px" });
  const isFaqInView = useInView(faqRef, { once: true, margin: "-100px" });

  // --- Load state from localStorage ---
  useEffect(() => {
    const savedPage = localStorage.getItem("activePage");
    if (savedPage === "gallery") {
      setShowGallery(true);
      setActivePage("gallery");
    } else if (savedPage === "about") {
      setShowGallery(false);
      setActivePage("about");
    } else if (savedPage === "contact") {
      setShowGallery(false);
      setActivePage("contact");
    } else {
      setShowGallery(false);
      setActivePage("home");
    }
  }, []);

  // --- Save state to localStorage whenever activePage changes ---
  useEffect(() => {
    localStorage.setItem("activePage", activePage);
  }, [activePage]);

  const handleGalleryClick = () => {
    setShowGallery(true);
    setActivePage("gallery");
  };

  const handleHomeClick = () => {
    setShowGallery(false);
    setActivePage("home");
  };

  const handleAboutClick = () => {
    setShowGallery(false);
    setActivePage("about");
  };

  const handleContactClick = () => {
    setShowGallery(false);
    setActivePage("contact");
  };

  return (
    <main className="min-h-screen flex flex-col text-[var(--typo)]">
      <Navbar
        onGalleryClick={handleGalleryClick}
        onHomeClick={handleHomeClick}
        onAboutClick={handleAboutClick}
        onContactClick={handleContactClick}
        activePage={activePage}
      />

      <AnimatePresence mode="wait">
        {!showGallery && activePage !== "about" && activePage !== "contact" ? (
          <motion.div
            key="homepage"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Hero Section */}
            <section className="relative w-full h-[70vh] md:h-[100vh] flex flex-col items-center justify-center overflow-hidden">
              <Image
                src="/main-9.webp"
                alt="Ford School Campus"
                width={1920}
                height={1444}
                priority
                className="absolute inset-0 object-cover object-center w-full h-full"
              />

              <motion.div
                initial={{ opacity: 0, y: -90 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1 }}
                className="relative z-20 flex flex-col items-center justify-center -mt-52 sm:-mt-38 md:-mt-68"
              >
                <Logo />
              </motion.div>

              <div className="absolute  from-[var(--background)]/90 via-transparent to-transparent" />

              <div className="absolute bottom-6 left-0 right-0 text-center">
                <div className="mt-92 relative z-20">
                  <ScrollingCards />
                </div>
                {/* <h2 className="text-2xl md:text-3xl font-semibold drop-shadow-md">
                  Where learning meets innovation */}
                {/* </h2> */}
              </div>
            </section>

            {/* Main Sections */}
            <CareerAndClassSection />
            <QualitiesSection />
            <InspiringLeadersSection />
            <ProprietorSection />
            <SchoolStaffSection />

            {/* Testimonials Section */}
            <motion.section
              ref={testimonialsRef}
              initial="hidden"
              animate={isTestimonialsInView ? "visible" : "hidden"}
              variants={sectionVariants}
              transition={{ duration: 0.6 }}
              className="py-16 px-6 md:px-12 "
            >
              <div className="max-w-6xl mx-auto text-center">
                <h2 className="text-3xl md:text-4xl font-bold mb-12 text-[var(--ford-primary)]">
                  Comments from Stakeholder
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {testimonials.map((t) => (
                    <motion.div
                      key={t.id}
                      whileHover={{ scale: 1.03 }}
                      className="p-6 bg-[var(--ford-card)] rounded-2xl shadow-md"
                    >
                      <p className="text-sm mb-4">&quot;{t.feedback}&quot;</p>
                      <h4 className="font-semibold">{t.name}</h4>
                      <span className="text-xs text-[var(--warning)]">
                        {t.role}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.section>

            {/* FAQ Section */}
            <motion.section
              ref={faqRef}
              initial="hidden"
              animate={isFaqInView ? "visible" : "hidden"}
              variants={sectionVariants}
              transition={{ duration: 0.6 }}
              className="py-16 px-6 md:px-12  max-w-6xl mx-auto"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center text-[var(--ford-primary)]">
                Frequently Asked Questions
              </h2>
              <div className="space-y-4">
                {faqs.map((f) => (
                  <details
                    key={f.id}
                    className="p-6 bg-[var(--ford-card)] rounded-2xl shadow-md"
                  >
                    <summary className="font-semibold text-lg">
                      {f.question}
                    </summary>
                    <p className="mt-2 text-[var(--warning)]">{f.answer}</p>
                  </details>
                ))}
              </div>
            </motion.section>
          </motion.div>
        ) : activePage === "gallery" ? (
          <motion.div
            key="gallery"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <GalleryPage onClose={handleHomeClick} />
          </motion.div>
        ) : activePage === "about" ? (
          <motion.div
            key="about"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <AboutSection onClose={handleHomeClick} />
          </motion.div>
        ) : activePage === "contact" ? (
          <motion.div
            key="contact"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <ContactSection onClose={handleHomeClick} />
          </motion.div>
        ) : null}

        <div className="w-full relative">
          <Image
            src="/main-6.webp"
            alt="Ford School Campus"
            width={1920}
            height={1444}
            priority
            className="w-full h-auto object-contain object-top"
          />
        </div>
      </AnimatePresence>
    </main>
  );
}
