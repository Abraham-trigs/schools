"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

interface AppBackgroundProps {
  children?: React.ReactNode;
  parallaxFactor?: number;
}

export default function AppBackground({
  children,
  parallaxFactor = 0.2,
}: AppBackgroundProps) {
  const [offsetY, setOffsetY] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();

    window.addEventListener("resize", checkMobile);

    const handleScroll = () =>
      setOffsetY(
        window.scrollY * (isMobile ? parallaxFactor * 0.05 : parallaxFactor)
      );

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", checkMobile);
    };
  }, [parallaxFactor, isMobile]);

  return (
    <div className="relative w-screen min-h-screen overflow-hidden">
      {/* Full-width background image */}
      <motion.div
        style={{ y: -offsetY }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{
          duration: isMobile ? 0.6 : 1.2,
          ease: isMobile ? "easeInOut" : "easeOut",
        }}
        className="absolute inset-0"
      >
        <Image
          src="/background-1920x2880.webp"
          alt="App Background"
          fill
          className="object-cover object-center"
          priority
        />
      </motion.div>

      {/* Foreground content */}
      <div className="relative z-10 min-h-screen flex flex-col">{children}</div>
    </div>
  );
}
