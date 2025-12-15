'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Instagram, Music } from 'lucide-react';

export function Footer() {
  const t = useTranslations('footer');
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-b from-gray-50 to-white border-t border-gray-200">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Brand Section */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-2">VISKORY</h2>
            <p className="text-muted-foreground">{t('tagline')}</p>
          </div>

          {/* Social Links */}
          <div className="flex flex-wrap justify-center gap-6 mb-8">
            <a
              href="https://www.instagram.com/viskory"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-foreground hover:text-pink-600 transition-colors"
            >
              <Instagram className="w-5 h-5" />
              <span className="font-medium">Instagram</span>
            </a>
            <a
              href="https://www.tiktok.com/@viskory"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-foreground hover:text-black transition-colors"
            >
              <Music className="w-5 h-5" />
              <span className="font-medium">TikTok</span>
            </a>
          </div>

          {/* Email Contact */}
          <div className="text-center mb-8">
            <p className="text-muted-foreground">
              {t('contact')}:{' '}
              <a
                href="mailto:viskory@gmail.com"
                className="text-foreground hover:underline font-medium"
              >
                viskory@gmail.com
              </a>
            </p>
          </div>

          {/* Copyright */}
          <div className="text-center pt-6 border-t border-gray-200">
            <p className="text-sm text-muted-foreground">
              © {currentYear} Viskory. {t('rights')}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
