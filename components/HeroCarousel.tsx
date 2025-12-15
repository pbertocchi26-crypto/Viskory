'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type HeroSlide = {
  id: string;
  imageUrl: string;
  title: string;
  subtitle: string;
  position: number;
};

interface HeroCarouselProps {
  slides: HeroSlide[];
}

export function HeroCarousel({ slides }: HeroCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  if (!slides || slides.length === 0) {
    return null;
  }

  const goToPrevious = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setActiveIndex((current) => (current === 0 ? slides.length - 1 : current - 1));
    setTimeout(() => setIsAnimating(false), 500);
  };

  const goToNext = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setActiveIndex((current) => (current === slides.length - 1 ? 0 : current + 1));
    setTimeout(() => setIsAnimating(false), 500);
  };

  const getSlideIndex = (offset: number): number => {
    const index = activeIndex + offset;
    if (index < 0) return slides.length + index;
    if (index >= slides.length) return index - slides.length;
    return index;
  };

  const getSlideStyle = (offset: number): React.CSSProperties => {
    const absOffset = Math.abs(offset);

    if (offset === 0) {
      return {
        transform: 'translateX(-50%) scale(1)',
        opacity: 1,
        zIndex: 50,
      };
    }

    const direction = offset > 0 ? 1 : -1;
    const translateX = -50 + (direction * (absOffset * 35));
    const scale = Math.max(0.7, 1 - (absOffset * 0.15));
    const opacity = Math.max(0.3, 1 - (absOffset * 0.3));

    return {
      transform: `translateX(${translateX}%) scale(${scale})`,
      opacity: opacity,
      zIndex: 50 - absOffset,
    };
  };

  const visibleOffsets = {
    desktop: [-2, -1, 0, 1, 2],
    mobile: [-1, 0, 1],
  };

  return (
    <div className="relative w-full overflow-hidden py-8 md:py-12">
      <div className="relative h-[300px] md:h-[450px] max-w-7xl mx-auto px-4">
        {/* Desktop: 5 slides visible */}
        <div className="hidden md:block relative h-full">
          {visibleOffsets.desktop.map((offset) => {
            const slideIndex = getSlideIndex(offset);
            const slide = slides[slideIndex];
            const style = getSlideStyle(offset);

            return (
              <div
                key={`${slide.id}-${offset}`}
                className="absolute left-1/2 top-0 h-full w-[500px] transition-all duration-500 ease-out cursor-pointer"
                style={style}
                onClick={() => {
                  if (offset !== 0 && !isAnimating) {
                    setIsAnimating(true);
                    setActiveIndex(slideIndex);
                    setTimeout(() => setIsAnimating(false), 500);
                  }
                }}
              >
                <div className="relative h-full w-full rounded-2xl overflow-hidden shadow-2xl">
                  <img
                    src={slide.imageUrl}
                    alt={slide.title}
                    className="w-full h-full object-cover"
                  />
                  {offset === 0 && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex flex-col justify-end p-8">
                      <h3 className="text-4xl font-bold text-white mb-2 drop-shadow-lg">
                        {slide.title}
                      </h3>
                      <p className="text-xl text-white/90 drop-shadow-md">
                        {slide.subtitle}
                      </p>
                    </div>
                  )}
                  {offset !== 0 && (
                    <div className="absolute inset-0 bg-black/40" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Mobile: 3 slides visible */}
        <div className="block md:hidden relative h-full">
          {visibleOffsets.mobile.map((offset) => {
            const slideIndex = getSlideIndex(offset);
            const slide = slides[slideIndex];
            const style = getSlideStyle(offset);

            return (
              <div
                key={`${slide.id}-${offset}-mobile`}
                className="absolute left-1/2 top-0 h-full w-[280px] transition-all duration-500 ease-out"
                style={style}
                onClick={() => {
                  if (offset !== 0 && !isAnimating) {
                    setIsAnimating(true);
                    setActiveIndex(slideIndex);
                    setTimeout(() => setIsAnimating(false), 500);
                  }
                }}
              >
                <div className="relative h-full w-full rounded-2xl overflow-hidden shadow-2xl">
                  <img
                    src={slide.imageUrl}
                    alt={slide.title}
                    className="w-full h-full object-cover"
                  />
                  {offset === 0 && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex flex-col justify-end p-6">
                      <h3 className="text-2xl font-bold text-white mb-1 drop-shadow-lg">
                        {slide.title}
                      </h3>
                      <p className="text-base text-white/90 drop-shadow-md">
                        {slide.subtitle}
                      </p>
                    </div>
                  )}
                  {offset !== 0 && (
                    <div className="absolute inset-0 bg-black/40" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Navigation Arrows */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-2 top-1/2 -translate-y-1/2 z-50 bg-white/80 hover:bg-white shadow-lg rounded-full w-12 h-12"
          onClick={goToPrevious}
          disabled={isAnimating}
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-1/2 -translate-y-1/2 z-50 bg-white/80 hover:bg-white shadow-lg rounded-full w-12 h-12"
          onClick={goToNext}
          disabled={isAnimating}
        >
          <ChevronRight className="w-6 h-6" />
        </Button>
      </div>

      {/* Dots indicator */}
      <div className="flex justify-center gap-2 mt-6">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              if (!isAnimating) {
                setIsAnimating(true);
                setActiveIndex(index);
                setTimeout(() => setIsAnimating(false), 500);
              }
            }}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === activeIndex
                ? 'bg-black w-8'
                : 'bg-gray-300 hover:bg-gray-400'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
