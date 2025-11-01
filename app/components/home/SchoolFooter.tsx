"use client";

import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaYoutube,
} from "react-icons/fa";

export default function SchoolFooter() {
  return (
    <footer className="bg-[var(--ford-primary)] text-white py-12">
      <div className="max-w-7xl mx-auto px-6 md:px-10 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Logo & About */}
        <div>
          <h2 className="text-2xl font-bold mb-4">FORD School</h2>
          <p className="text-sm text-white/80">
            Nurturing excellence, integrity, and purpose-driven education for
            every child.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="font-semibold mb-4">Quick Links</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <a href="/" className="hover:underline">
                Home
              </a>
            </li>
            <li>
              <a href="/about" className="hover:underline">
                About
              </a>
            </li>
            <li>
              <a href="/programs" className="hover:underline">
                Programs
              </a>
            </li>
            <li>
              <a href="/admissions" className="hover:underline">
                Admissions
              </a>
            </li>
            <li>
              <a href="/contact" className="hover:underline">
                Contact
              </a>
            </li>
          </ul>
        </div>

        {/* Contact Info */}
        <div>
          <h3 className="font-semibold mb-4">Contact Us</h3>
          <ul className="space-y-2 text-sm">
            <li>Address: 123 School Lane, Accra, Ghana</li>
            <li>Phone: +233 123 456 789</li>
            <li>Email: info@fordschool.com</li>
          </ul>
          {/* Embedded Google Map */}
          <div className="mt-4 w-full h-40 overflow-hidden rounded-lg shadow-lg">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3970.7727649217095!2d-0.1050236!3d5.6005516!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xfdf85ad10f34f7d%3A0xf7077b28504ce1f0!2sFord%20School!5e0!3m2!1sen!2sgh!4v1761013185863!5m2!1sen!2sgh"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="rounded-lg"
            ></iframe>
          </div>
        </div>

        {/* Newsletter & Socials */}
        <div>
          <h3 className="font-semibold mb-4">Stay Connected</h3>
          <form className="flex flex-col gap-2 mb-4">
            <input
              type="email"
              placeholder="Your email"
              className="px-3 py-2 rounded text-black text-sm"
            />
            <button
              type="submit"
              className="bg-[var(--success)] px-4 py-2 rounded text-white font-medium text-sm hover:bg-green-600 transition"
            >
              Subscribe
            </button>
          </form>
          <div className="flex gap-4 mt-2">
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
      </div>

      {/* Bottom Bar */}
      <div className="mt-12 border-t border-white/20 pt-6 text-center text-sm text-white/70">
        © 2025 FORD School Limited. All rights reserved.
      </div>
    </footer>
  );
}
