import { useLayoutEffect, useRef, useCallback, useState } from 'react';
import Lenis from 'lenis';
import styles from './ScrollStack.module.css';

export const ScrollStackItem = ({ children, itemClassName = '' }) => (
  <div className={`scroll-stack-card ${styles.scrollStackCard} ${itemClassName}`.trim()}>{children}</div>
);

const ScrollStack = ({
  children,
  className = '',
  itemStackDistance = 30,
  baseScale = 0.85,
  rotationAmount = 2,
  blurAmount = 2,
  useWindowScroll = true,
  revealScrollDistance = 150
}) => {
  const scrollerRef = useRef(null);
  const animationFrameRef = useRef(null);
  const lenisRef = useRef(null);
  const cardsRef = useRef([]);
  const [revealedCards, setRevealedCards] = useState([0]); // Start with first card visible
  const containerRef = useRef(null);

  const getScrollData = useCallback(() => {
    return {
      scrollTop: window.scrollY,
      containerHeight: window.innerHeight,
    };
  }, []);

  const getContainerPosition = useCallback(() => {
    if (!containerRef.current) return { top: 0, bottom: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    return {
      top: rect.top + window.scrollY,
      bottom: rect.bottom + window.scrollY,
      height: rect.height
    };
  }, []);

  const updateCardTransforms = useCallback(() => {
    if (!cardsRef.current.length) return;

    const { scrollTop } = getScrollData();
    const containerPos = getContainerPosition();
    
    if (!containerPos.top || containerPos.height === 0) return;

    // Calculate how many cards should be revealed based on scroll position
    // Trigger when container is 40% from top of viewport
    const triggerPoint = containerPos.top - window.innerHeight * 0.6;
    const relativeScroll = scrollTop - triggerPoint;
    
    // Only start revealing when container is in view
    if (relativeScroll < 0) {
      // Show only first card
      cardsRef.current.forEach((card, i) => {
        if (i === 0) {
          card.style.opacity = '1';
          card.style.visibility = 'visible';
          card.style.transform = `translate3d(0, 0, 0) scale(1) rotate(0deg)`;
          card.style.filter = '';
        } else {
          card.style.opacity = '0';
          card.style.visibility = 'hidden';
          card.style.pointerEvents = 'none';
        }
      });
      return;
    }

    const cardIndex = Math.floor(relativeScroll / revealScrollDistance);
    const maxRevealed = Math.min(cardIndex + 1, cardsRef.current.length);
    
    // Update revealed cards state
    setRevealedCards(prev => {
      if (maxRevealed > prev.length) {
        const newRevealed = [];
        for (let i = 0; i < maxRevealed; i++) {
          newRevealed.push(i);
        }
        return newRevealed;
      }
      return prev;
    });

    // Update card transforms and visibility
    cardsRef.current.forEach((card, i) => {
      if (!card) return;

      const isRevealed = i < maxRevealed;
      
      if (isRevealed) {
        // Calculate stack offset - cards stack on top of each other
        const stackIndex = maxRevealed - 1 - i; // Reverse so first card is on top
        const offsetY = stackIndex * itemStackDistance;
        const scale = 1 - stackIndex * 0.05;
        const rotation = rotationAmount * stackIndex;
        
        // Fade in and slide up animation for newly revealed card
        let opacity = 1;
        let slideUp = 0;
        
        // Check if this is the card currently being revealed
        if (i === maxRevealed - 1) {
          const cardRevealProgress = (relativeScroll - i * revealScrollDistance) / revealScrollDistance;
          opacity = Math.max(0, Math.min(1, cardRevealProgress));
          slideUp = (1 - cardRevealProgress) * 40; // Slide up from 40px below
        }

        // Apply transforms
        const transform = `translate3d(0, ${offsetY + slideUp}px, 0) scale(${scale}) rotate(${rotation}deg)`;
        card.style.transform = transform;
        card.style.opacity = opacity;
        card.style.visibility = opacity > 0.1 ? 'visible' : 'hidden';
        card.style.pointerEvents = opacity > 0.5 ? 'auto' : 'none';

        // Apply blur to cards below the top one
        if (stackIndex > 0) {
          card.style.filter = `blur(${stackIndex * blurAmount}px)`;
        } else {
          card.style.filter = '';
        }
      } else {
        // Hide unrevealed cards
        card.style.opacity = '0';
        card.style.visibility = 'hidden';
        card.style.pointerEvents = 'none';
        card.style.transform = `translate3d(0, 0, 0) scale(${baseScale}) rotate(0deg)`;
        card.style.filter = '';
      }
    });
  }, [itemStackDistance, baseScale, rotationAmount, blurAmount, revealScrollDistance, getScrollData, getContainerPosition]);

  const handleScroll = useCallback(() => {
    updateCardTransforms();
  }, [updateCardTransforms]);

  const setupLenis = useCallback(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 2,
      infinite: false,
      wheelMultiplier: 1,
      lerp: 0.1,
      syncTouch: true,
      syncTouchLerp: 0.075
    });

    lenis.on('scroll', handleScroll);

    const raf = time => {
      lenis.raf(time);
      animationFrameRef.current = requestAnimationFrame(raf);
    };

    animationFrameRef.current = requestAnimationFrame(raf);
    lenisRef.current = lenis;

    return lenis;
  }, [handleScroll]);

  useLayoutEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const inner = scroller.querySelector('.scroll-stack-inner');
    const cards = Array.from(inner?.querySelectorAll('.scroll-stack-card') || []);
    cardsRef.current = cards;

    // Initialize all cards as hidden except first
    cards.forEach((card, i) => {
      card.style.willChange = 'transform, filter, opacity';
      card.style.transformOrigin = 'top center';
      card.style.backfaceVisibility = 'hidden';
      card.style.transition = 'opacity 0.4s ease-out, transform 0.4s ease-out';
      
      if (i === 0) {
        card.style.opacity = '1';
        card.style.visibility = 'visible';
        card.style.transform = `translate3d(0, 0, 0) scale(1) rotate(0deg)`;
      } else {
        card.style.opacity = '0';
        card.style.visibility = 'hidden';
        card.style.transform = `translate3d(0, 0, 0) scale(${baseScale}) rotate(0deg)`;
      }
    });

    setupLenis();
    updateCardTransforms();

    // Also update on scroll events for immediate feedback
    const handleWindowScroll = () => {
      updateCardTransforms();
    };
    window.addEventListener('scroll', handleWindowScroll, { passive: true });
    window.addEventListener('resize', handleWindowScroll, { passive: true });

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (lenisRef.current) {
        lenisRef.current.destroy();
      }
      window.removeEventListener('scroll', handleWindowScroll);
      window.removeEventListener('resize', handleWindowScroll);
      cardsRef.current = [];
    };
  }, [setupLenis, updateCardTransforms, baseScale]);

  return (
    <div 
      ref={containerRef}
      className={`scroll-stack-container ${styles.scrollStackContainer} ${className}`.trim()}
    >
      <div className={`scroll-stack-scroller ${styles.scrollStackScroller}`} ref={scrollerRef}>
        <div className={`scroll-stack-inner ${styles.scrollStackInner}`}>
          {children}
          <div className={`scroll-stack-end ${styles.scrollStackEnd}`} />
        </div>
      </div>
    </div>
  );
};

export default ScrollStack;