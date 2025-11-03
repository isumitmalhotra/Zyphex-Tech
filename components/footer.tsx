import { Button } from "@/components/ui/button"
import { Mail, Phone, MapPin, Facebook, Twitter, Linkedin, Github } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function Footer() {
  return (
    <footer className="zyphex-section-bg text-gray-50 border-t border-gray-800/50 mt-auto">
      <div className="container mx-auto container-padding">
        {/* Main Footer Content */}
        <div className="section-padding">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Company Info */}
            <div className="space-y-6">
              <div className="flex items-center space-x-3">
                <div className="relative w-10 h-10 animate-zyphex-glow">
                  <Image src="/zyphex-logo.png" alt="Zyphex Tech" width={40} height={40} className="object-contain" />
                </div>
                <span className="font-bold text-xl zyphex-heading">Zyphex Tech</span>
              </div>
              <p className="zyphex-subheading leading-relaxed text-sm md:text-base">
                Transforming businesses through innovative remote technology solutions. Zyphex Tech delivers
                cutting-edge IT services that drive growth and success through remote collaboration and advanced
                technical expertise.
              </p>
              <div className="flex space-x-4">
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white hover-zyphex-glow">
                  <Facebook className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white hover-zyphex-glow">
                  <Twitter className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white hover-zyphex-glow">
                  <Linkedin className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white hover-zyphex-glow">
                  <Github className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Services */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold zyphex-accent-text">Services</h3>
              <ul className="space-y-3">
                <li>
                  <Link
                    href="/services"
                    className="zyphex-subheading hover:text-white transition-all duration-300 hover:translate-x-1 inline-block hover-zyphex-glow"
                  >
                    Custom Software Development
                  </Link>
                </li>
                <li>
                  <Link
                    href="/services"
                    className="zyphex-subheading hover:text-white transition-all duration-300 hover:translate-x-1 inline-block hover-zyphex-glow"
                  >
                    Cloud Solutions & Migration
                  </Link>
                </li>
                <li>
                  <Link
                    href="/services"
                    className="zyphex-subheading hover:text-white transition-all duration-300 hover:translate-x-1 inline-block hover-zyphex-glow"
                  >
                    Mobile App Development
                  </Link>
                </li>
                <li>
                  <Link
                    href="/services"
                    className="zyphex-subheading hover:text-white transition-all duration-300 hover:translate-x-1 inline-block hover-zyphex-glow"
                  >
                    Data Analytics & BI
                  </Link>
                </li>
                <li>
                  <Link
                    href="/services"
                    className="zyphex-subheading hover:text-white transition-all duration-300 hover:translate-x-1 inline-block hover-zyphex-glow"
                  >
                    IT Consulting & Strategy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/services"
                    className="zyphex-subheading hover:text-white transition-all duration-300 hover:translate-x-1 inline-block hover-zyphex-glow"
                  >
                    Dedicated Development Teams
                  </Link>
                </li>
              </ul>
            </div>

            {/* Company */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold zyphex-accent-text">Company</h3>
              <ul className="space-y-3">
                <li>
                  <Link
                    href="/about"
                    className="zyphex-subheading hover:text-white transition-all duration-300 hover:translate-x-1 inline-block hover-zyphex-glow"
                  >
                    About Us
                  </Link>
                </li>
                <li>
                  <Link
                    href="/about"
                    className="zyphex-subheading hover:text-white transition-all duration-300 hover:translate-x-1 inline-block hover-zyphex-glow"
                  >
                    Our Team
                  </Link>
                </li>
                <li>
                  <Link
                    href="/updates"
                    className="zyphex-subheading hover:text-white transition-all duration-300 hover:translate-x-1 inline-block hover-zyphex-glow"
                  >
                    Blog & Updates
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="zyphex-subheading hover:text-white transition-all duration-300 hover:translate-x-1 inline-block hover-zyphex-glow"
                  >
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link
                    href="/careers"
                    className="zyphex-subheading hover:text-white transition-all duration-300 hover:translate-x-1 inline-block hover-zyphex-glow"
                  >
                    Careers
                  </Link>
                </li>
                <li>
                  <Link
                    href="/privacy"
                    className="zyphex-subheading hover:text-white transition-all duration-300 hover:translate-x-1 inline-block hover-zyphex-glow"
                  >
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact & Newsletter */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold zyphex-accent-text">Get In Touch</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3 hover-zyphex-glow transition-all duration-300">
                  <Phone className="h-5 w-5 zyphex-accent-text" />
                  <div className="flex flex-col">
                    <span className="zyphex-subheading">+91 7777010114</span>
                    <span className="zyphex-subheading text-xs">+91 8901717173</span>
                  </div>
                </div>
                <div className="flex items-center space-x-3 hover-zyphex-glow transition-all duration-300">
                  <Mail className="h-5 w-5 zyphex-accent-text" />
                  <span className="zyphex-subheading">info@zyphextech.com</span>
                </div>
                <div className="flex items-start space-x-3 hover-zyphex-glow transition-all duration-300">
                  <MapPin className="h-5 w-5 zyphex-accent-text mt-1" />
                  <span className="zyphex-subheading">
                    Sector 115, Mohali
                    <br />
                    Punjab, India
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-gray-200">Business Hours</h4>
                <div className="text-sm zyphex-subheading space-y-1">
                  <p>Mon - Fri: 9:00 AM - 10:00 PM IST</p>
                  <p>Sat - Sun: 11:00 AM - 10:00 PM IST</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="border-t border-gray-800/50 py-6 md:py-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="zyphex-subheading text-sm text-center md:text-left">
              © {new Date().getFullYear()} Zyphex Tech. All rights reserved.
            </div>
            <div className="flex flex-wrap justify-center md:justify-end space-x-4 md:space-x-6 text-sm">
              <Link
                href="/privacy"
                className="zyphex-subheading hover:text-white transition-colors duration-300 hover-zyphex-glow"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="zyphex-subheading hover:text-white transition-colors duration-300 hover-zyphex-glow"
              >
                Terms of Service
              </Link>
              <Link
                href="/cookies"
                className="zyphex-subheading hover:text-white transition-colors duration-300 hover-zyphex-glow"
              >
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
