"use client";

import { motion } from "framer-motion";
import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaYoutube,
} from "react-icons/fa";
import Logo from "./Logo.tsx";

interface ContactSectionProps {
  onClose?: () => void;
}

export default function ContactSection({ onClose }: ContactSectionProps) {
  const bubbleColors = ["#32CD32", "#FF69B4", "#1E90FF"];

  return (
    <motion.section
      key="contact"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      className="min-h-screen mt-12 text-[var(--typo)] px-6 md:px-12 py-16 relative"
    >
      <Logo />
      <div className="max-w-6xl  mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 relative">
        {/* Title with Bubble Background */}
        <div className="relative mb-8 md:mb-0 flex items-center">
          {/* Floating Bubbles */}

          {bubbleColors.map((color, idx) => (
            <motion.div
              key={idx}
              className="absolute rounded-full opacity-30 z-0"
              style={{
                width: 24 + idx * 12,
                height: 24 + idx * 12,
                backgroundColor: color,
                top: `${Math.random() * 40}%`,
                left: `${Math.random() * 40}%`,
              }}
              animate={{
                y: [0, -12, 0],
                x: [0, 8, -8, 0],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 6 + idx,
                repeat: Infinity,
                repeatType: "loop",
                ease: "easeInOut",
                delay: idx,
              }}
            />
          ))}

          <h2 className="relative text-3xl md:text-4xl font-bold px-6 py-3 rounded-2xl text-white z-10 bg-gradient-to-r from-[#32CD32]/70 via-[#FF69B4]/70 to-[#1E90FF]/70">
            Contact Us
          </h2>
        </div>

        {/* Contact Info & Form */}
        <div className="space-y-6 md:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Contact Info */}
            <div className="space-y-4 text-[var(--ford-primary)] text-2xl font-bold">
              <p>
                We’d love to hear from you! Reach out with questions, feedback,
                or inquiries.
              </p>
              <ul className="space-y-2 text-sm">
                <li>
                  <strong>Address:</strong> 123 School Lane, Accra, Ghana
                </li>
                <li>
                  <strong>Phone:</strong> +233 123 456 789
                </li>
                <li>
                  <strong>Email:</strong> info@fordschool.com
                </li>
              </ul>

              <div className="flex gap-4 mt-2 text-xl">
                <a href="#" className="hover:text-[var(--success)]">
                  <FaFacebookF />
                </a>
                <a href="#" className="hover:text-[var(--success)]">
                  <FaInstagram />
                </a>
                <a href="#" className="hover:text-[var(--success)]">
                  <FaLinkedinIn />
                </a>
                <a href="#" className="hover:text-[var(--success)]">
                  <FaYoutube />
                </a>
              </div>
            </div>

            {/* Contact Form */}
            <form className="flex flex-col gap-4 bg-[var(--ford-card)] p-6 rounded-2xl shadow-lg">
              <input
                type="text"
                placeholder="Your Name"
                className="px-3 py-2 rounded text-sm"
              />
              <input
                type="email"
                placeholder="Your Email"
                className="px-3 py-2 rounded text-sm"
              />
              <textarea
                placeholder="Your Message"
                className="px-3 py-2 rounded text-sm resize-none"
                rows={4}
              />
              <button
                type="submit"
                className="bg-[var(--success)] px-4 py-2 rounded text-white font-medium hover:bg-green-600 transition"
              >
                Send Message
              </button>
            </form>
          </div>

          {/* Google Map */}
          <div className="w-full h-64 overflow-hidden rounded-2xl shadow-lg">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3970.7727649217095!2d-0.1050236!3d5.6005516!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xfdf85ad10f34f7d%3A0xf7077b28504ce1f0!2sFord%20School!5e0!3m2!1sen!2sgh!4v1761013185863!5m2!1sen!2sgh"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="rounded-2xl"
            />
          </div>
        </div>
      </div>
    </motion.section>
  );
}
