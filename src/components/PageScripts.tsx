'use client';
import { useEffect } from 'react';

export default function PageScripts() {
  useEffect(() => {
    // Smooth scrolling for anchor links
    const handleSmoothScroll = (e: Event) => {
      const target = e.target as HTMLAnchorElement;
      if (target.hash && target.hash.startsWith('#')) {
        e.preventDefault();
        const element = document.querySelector(target.hash);
        if (element) {
          element.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          });
        }
      }
    };

    // Add scroll effect to header
    const handleScroll = () => {
      const header = document.querySelector('header');
      if (!header) return;
      
      if (window.scrollY > 100) {
        header.style.boxShadow = '0 2px 20px rgba(0,0,0,0.15)';
      } else {
        header.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
      }
    };

    // Add scroll animations
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px',
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const target = entry.target as HTMLElement;
          target.style.opacity = '1';
          target.style.transform = 'translateY(0)';
        }
      });
    }, observerOptions);

    // Observe cards for animation
    document.querySelectorAll('.benefit-card, .survey-item, .blog-item').forEach((card) => {
      const element = card as HTMLElement;
      element.style.opacity = '0';
      element.style.transform = 'translateY(20px)';
      element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
      observer.observe(card);
    });

    // Attach event listeners
    document.addEventListener('click', handleSmoothScroll);
    window.addEventListener('scroll', handleScroll);

    return () => {
      document.removeEventListener('click', handleSmoothScroll);
      window.removeEventListener('scroll', handleScroll);
      observer.disconnect();
    };
  }, []);

  return null;
}

