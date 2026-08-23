import Link from 'next/link';
import { FiMail, FiPhone, FiMapPin } from 'react-icons/fi';

export default function Footer() {
  return (
    <footer className="hidden md:block bg-surface-900 text-surface-300 mt-20">
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <h2 className="font-display text-2xl font-bold text-white mb-4">Top Threadz</h2>
            <p className="text-sm leading-relaxed text-surface-400">
              Premium fashion curated for modern Pakistani style.
              Quality, comfort, and confidence delivered to your doorstep.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              {[
                { label: 'All Products', href: '/products' },
                { label: 'Shalwar Kameez', href: '/products?category=Shalwar+Kameez' },
                { label: 'Formal Wear', href: '/products?category=Shirts' },
                { label: 'Footwear', href: '/products?category=Footwear' },
              ].map(link => (
                <li key={link.label}>
                  <Link href={link.href} className="hover:text-brand-400 transition-colors">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="text-white font-semibold mb-4">Customer Care</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/orders" className="hover:text-brand-400 transition-colors">Track Order</Link></li>
              <li><Link href="/returns" className="hover:text-brand-400 transition-colors">Returns & Exchanges</Link></li>
              <li><Link href="/size-guide" className="hover:text-brand-400 transition-colors">Size Guide</Link></li>
              <li><Link href="/faq" className="hover:text-brand-400 transition-colors">FAQ</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <FiPhone className="w-4 h-4 text-brand-400" />
                <span>+92 300 1234567</span>
              </li>
              <li className="flex items-center gap-2">
                <FiMail className="w-4 h-4 text-brand-400" />
                <span>support@topthreadz.pk</span>
              </li>
              <li className="flex items-start gap-2">
                <FiMapPin className="w-4 h-4 text-brand-400 mt-0.5" />
                <span>F-8 Markaz, Islamabad, Pakistan</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-surface-700 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-surface-500">&copy; {new Date().getFullYear()} Top Threadz — All rights reserved.</p>
          <div className="flex gap-6 text-xs text-surface-500">
            <Link href="/privacy" className="hover:text-surface-300">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-surface-300">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
