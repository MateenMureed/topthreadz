'use client';

import { useEffect, useRef, useState } from 'react';

interface ScrollRevealProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  animation?: 'slide-up' | 'fade-in' | 'slide-left' | 'scale-up';
}

export default function ScrollReveal({ 
  children, 
  delay = 0, 
  className = '', 
  animation = 'slide-up' 
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.unobserve(el);
      }
    }, { 
      rootMargin: '0px 0px -50px 0px', 
      threshold: 0.1 
    });
    
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const getAnimationClass = () => {
    switch (animation) {
      case 'slide-up': return 'translate-y-[60px] opacity-0 data-[visible=true]:translate-y-0 data-[visible=true]:opacity-100';
      case 'fade-in': return 'opacity-0 data-[visible=true]:opacity-100';
      case 'scale-up': return 'scale-[0.9] opacity-0 data-[visible=true]:scale-100 data-[visible=true]:opacity-100';
      case 'slide-left': return 'translate-x-[60px] opacity-0 data-[visible=true]:translate-x-0 data-[visible=true]:opacity-100';
      default: return '';
    }
  };

  return (
    <div 
      ref={ref} 
      data-visible={isVisible}
      className={`transition-all duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${getAnimationClass()} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
