'use client';

import AnimatedButton from '@/components/ui/AnimatedButton';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

interface ServiceContentLabelProps {
  title: string;
  description: string;
  buttonText?: string;
  onButtonClick?: () => void;
}

export default function ServiceContentLabel({
  title,
  description,
  buttonText = 'Learn More',
  onButtonClick,
}: ServiceContentLabelProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: rootRef,
    offset: ['start 80%', 'end 35%'],
  });

  const titleX = useTransform(scrollYProgress, [0, 0.55, 1], [-72, -14, 0]);
  const lineX = useTransform(scrollYProgress, [0, 0.7, 1], [-72, -10, 0]);
  const descriptionX = useTransform(scrollYProgress, [0, 0.85, 1], [-72, -6, 0]);
  const buttonX = useTransform(scrollYProgress, [0, 1, 1], [-72, 0, 0]);

  return (
    <motion.div ref={rootRef} className="flex w-lg flex-col items-start justify-start">
      <motion.h2 style={{ x: titleX }} className="will-change-transform">
        {title}
      </motion.h2>

      <motion.div style={{ x: lineX }} className="mt-5 h-px w-full bg-white will-change-transform" />

      <motion.p style={{ x: descriptionX }} className="mt-8 max-w-md will-change-transform">
        {description}
      </motion.p>

      <motion.div style={{ x: buttonX }} className="mt-8 will-change-transform">
        <AnimatedButton onClick={onButtonClick}>{buttonText}</AnimatedButton>
      </motion.div>
    </motion.div>
  );
}
