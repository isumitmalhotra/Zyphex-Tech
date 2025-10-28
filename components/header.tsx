"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, ArrowRight, LogIn, User, Settings, LogOut, LayoutDashboard, ChevronDown } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import Image from "next/image"
import { RealtimeNotifications } from "@/components/realtime/RealtimeNotifications"
import { cn } from "@/lib/utils"
import { GlobalSearch } from "@/components/global-search"

export default function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const pathname = usePathname()
  const { data: session } = useSession()

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const dropdown = document.getElementById('user-dropdown')
      const trigger = document.getElementById('user-dropdown-trigger')
      if (dropdown && trigger && !dropdown.contains(event.target as Node) && !trigger.contains(event.target as Node)) {
        dropdown.style.display = 'none'
        setDropdownOpen(false)
      }
    }

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [dropdownOpen])

  const navigation = [
    { name: "Home", href: "/" },
    { name: "About", href: "/about" },
    { name: "Services", href: "/services" },
    { name: "Updates", href: "/updates" },
    { name: "Contact", href: "/contact" },
  ]

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/"
    }
    return pathname?.startsWith(href) || false
  }

  const isAdminRoute = pathname?.startsWith("/admin") || false
  const isAuthRoute = pathname?.startsWith("/login") || pathname?.startsWith("/register") || false

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-800/50 zyphex-glass-effect">
      <div className="container mx-auto container-padding">
        <div className="flex h-16 items-center justify-between relative">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="relative w-10 h-10 hover-zyphex-glow transition-all duration-300 group-hover:scale-110">
              <Image src="/zyphex-logo.png" alt="Zyphex Tech" width={40} height={40} className="object-contain" />
            </div>
            <span className="font-bold text-xl zyphex-heading group-hover:scale-105 transition-transform duration-300">
              Zyphex Tech
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`text-sm font-medium transition-all duration-300 hover:scale-105 ${
                  isActive(item.href)
                    ? "zyphex-accent-text animate-zyphex-glow"
                    : "text-gray-300 hover:text-white hover-zyphex-glow"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center space-x-4">
            {session ? (
              <>
                {/* Real-time Notifications */}
                <RealtimeNotifications />
                
                {/* Global Search */}
                <GlobalSearch />
                
                <div className="relative">
                  <Button 
                    id="user-dropdown-trigger"
                    variant="outline" 
                    className="zyphex-button-secondary bg-transparent hover-zyphex-lift focus:ring-2 focus:ring-blue-500"
                    onClick={() => {
                      const dropdown = document.getElementById('user-dropdown')
                      if (dropdown) {
                        const isVisible = dropdown.style.display === 'block'
                        dropdown.style.display = isVisible ? 'none' : 'block'
                        setDropdownOpen(!isVisible)
                      }
                    }}
                  >
                    <div className="flex items-center space-x-2">
                      {session.user?.image ? (
                        <Image
                          src={session.user.image}
                          alt={session.user.name || 'User'}
                          width={24}
                          height={24}
                          className="w-6 h-6 rounded-full"
                        />
                      ) : (
                        <User className="w-4 h-4" />
                      )}
                      <span className="truncate max-w-[120px]">
                        {session.user?.name || 'User'}
                      </span>
                      <ChevronDown className="w-4 h-4 ml-1" />
                    </div>
                  </Button>
                  
                  {/* Custom Dropdown Menu */}
                  <div 
                    id="user-dropdown"
                    className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-[9999] hidden"
                    style={{ display: 'none' }}
                  >
                    {/* Role-specific Dashboard Links */}
                    {session.user?.role === 'SUPER_ADMIN' && (
                      <Link 
                        href="/super-admin" 
                        className="flex items-center px-4 py-3 text-sm text-purple-600 dark:text-purple-400 hover:bg-gray-100 dark:hover:bg-gray-800 first:rounded-t-md"
                        onClick={() => {
                          document.getElementById('user-dropdown')!.style.display = 'none'
                          setDropdownOpen(false)
                        }}
                      >
                        <LayoutDashboard className="mr-3 h-4 w-4" />
                        Super Admin Dashboard
                      </Link>
                    )}
                    
                    {session.user?.role === 'ADMIN' && (
                      <Link 
                        href="/admin" 
                        className="flex items-center px-4 py-3 text-sm text-blue-600 dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 first:rounded-t-md"
                        onClick={() => {
                          document.getElementById('user-dropdown')!.style.display = 'none'
                          setDropdownOpen(false)
                        }}
                      >
                        <LayoutDashboard className="mr-3 h-4 w-4" />
                        Admin Dashboard
                      </Link>
                    )}
                    
                    {session.user?.role === 'PROJECT_MANAGER' && (
                      <Link 
                        href="/project-manager" 
                        className="flex items-center px-4 py-3 text-sm text-green-600 dark:text-green-400 hover:bg-gray-100 dark:hover:bg-gray-800 first:rounded-t-md"
                        onClick={() => {
                          document.getElementById('user-dropdown')!.style.display = 'none'
                          setDropdownOpen(false)
                        }}
                      >
                        <LayoutDashboard className="mr-3 h-4 w-4" />
                        Project Manager Dashboard
                      </Link>
                    )}
                    
                    {session.user?.role === 'TEAM_MEMBER' && (
                      <Link 
                        href="/team-member" 
                        className="flex items-center px-4 py-3 text-sm text-orange-600 dark:text-orange-400 hover:bg-gray-100 dark:hover:bg-gray-800 first:rounded-t-md"
                        onClick={() => {
                          document.getElementById('user-dropdown')!.style.display = 'none'
                          setDropdownOpen(false)
                        }}
                      >
                        <LayoutDashboard className="mr-3 h-4 w-4" />
                        Team Member Dashboard
                      </Link>
                    )}
                    
                    {session.user?.role === 'CLIENT' && (
                      <Link 
                        href="/client" 
                        className="flex items-center px-4 py-3 text-sm text-cyan-600 dark:text-cyan-400 hover:bg-gray-100 dark:hover:bg-gray-800 first:rounded-t-md"
                        onClick={() => {
                          document.getElementById('user-dropdown')!.style.display = 'none'
                          setDropdownOpen(false)
                        }}
                      >
                        <LayoutDashboard className="mr-3 h-4 w-4" />
                        Client Dashboard
                      </Link>
                    )}
                    
                    {session.user?.role === 'USER' && (
                      <Link 
                        href="/user" 
                        className="flex items-center px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 first:rounded-t-md"
                        onClick={() => {
                          document.getElementById('user-dropdown')!.style.display = 'none'
                          setDropdownOpen(false)
                        }}
                      >
                        <LayoutDashboard className="mr-3 h-4 w-4" />
                        User Dashboard
                      </Link>
                    )}
                    
                    <hr className="border-gray-200 dark:border-gray-700" />
                    
                    <Link 
                      href="/user/profile" 
                      className="flex items-center px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                      onClick={() => {
                        document.getElementById('user-dropdown')!.style.display = 'none'
                        setDropdownOpen(false)
                      }}
                    >
                      <User className="mr-3 h-4 w-4" />
                      Profile
                    </Link>
                    
                    <Link 
                      href="/user/settings" 
                      className="flex items-center px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                      onClick={() => {
                        document.getElementById('user-dropdown')!.style.display = 'none'
                        setDropdownOpen(false)
                      }}
                    >
                      <Settings className="mr-3 h-4 w-4" />
                      Settings
                    </Link>
                    
                    <hr className="border-gray-200 dark:border-gray-700" />
                    
                    <button 
                      onClick={() => {
                        document.getElementById('user-dropdown')!.style.display = 'none'
                        setDropdownOpen(false)
                        signOut({ callbackUrl: '/login' })
                      }}
                      className="flex items-center w-full px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800 last:rounded-b-md"
                    >
                      <LogOut className="mr-3 h-4 w-4" />
                      Sign out
                    </button>
                  </div>
                </div>
                <Button className="zyphex-button-primary hover-zyphex-lift" asChild>
                  <Link href="/contact">
                    Start Project
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </>
            ) : (
              <>
                {/* Global Search */}
                <GlobalSearch />
                
                {!isAdminRoute && !isAuthRoute && (
                  <Button variant="outline" className="zyphex-button-secondary bg-transparent hover-zyphex-lift" asChild>
                    <Link href="/login">
                      <LogIn className="mr-2 h-4 w-4" />
                      Login / Sign Up
                    </Link>
                  </Button>
                )}
                <Button className="zyphex-button-primary hover-zyphex-lift" asChild>
                  <Link href="/contact">
                    Start Project
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-gray-300 hover:text-white hover-zyphex-glow transition-all duration-300 hover:scale-110 group"
              >
                <Menu className="h-6 w-6 transition-transform duration-300 group-hover:rotate-90" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent 
              side="right" 
              className="w-[85vw] sm:w-[400px] zyphex-glass-effect border-gray-800/50 backdrop-blur-xl"
            >
              <div className="flex flex-col space-y-4 mt-8 animate-in slide-in-from-right duration-300">
                <div className="flex items-center space-x-3 mb-8 animate-in fade-in zoom-in duration-500">
                  <div className="relative w-10 h-10 animate-zyphex-glow">
                    <Image src="/zyphex-logo.png" alt="Zyphex Tech" width={40} height={40} className="object-contain" />
                  </div>
                  <span className="font-bold text-xl zyphex-heading">Zyphex Tech</span>
                </div>

                <nav className="flex flex-col space-y-2">
                  {navigation.map((item, index) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        "text-lg font-medium px-4 py-3 rounded-lg transition-all duration-300 animate-in fade-in slide-in-from-right",
                        "hover:scale-[1.02] active:scale-[0.98] group flex items-center justify-between",
                        isActive(item.href) 
                          ? "zyphex-accent-text bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 shadow-lg shadow-blue-500/20" 
                          : "text-gray-300 hover:text-white hover:bg-white/5 hover-zyphex-glow"
                      )}
                      style={{ 
                        animationDelay: `${index * 50}ms`,
                        animationDuration: '400ms'
                      }}
                    >
                      <span>{item.name}</span>
                      <svg 
                        className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  ))}
                </nav>

                <div className="flex flex-col space-y-4 pt-8 border-t border-gray-800/50">
                  {session ? (
                    <>
                      <div className="flex items-center space-x-3 p-3 rounded-lg zyphex-card-bg animate-in fade-in slide-in-from-bottom duration-500" style={{ animationDelay: '250ms' }}>
                        {session.user?.image ? (
                          <Image
                            src={session.user.image}
                            alt={session.user.name || 'User'}
                            width={32}
                            height={32}
                            className="w-8 h-8 rounded-full ring-2 ring-blue-500/30"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full zyphex-gradient-primary flex items-center justify-center shadow-lg shadow-blue-500/30">
                            <User className="w-4 h-4 text-white" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium zyphex-heading truncate">
                            {session.user?.name || 'User'}
                          </p>
                          <p className="text-xs zyphex-subheading truncate">
                            {session.user?.email || 'No email'}
                          </p>
                        </div>
                      </div>
                      <Button 
                        className="zyphex-button-secondary bg-transparent hover:scale-[1.02] active:scale-[0.98] transition-transform animate-in fade-in slide-in-from-bottom duration-500 group" 
                        style={{ animationDelay: '300ms' }}
                        asChild 
                        onClick={() => setIsOpen(false)}
                      >
                        <Link href="/user">
                          <LayoutDashboard className="mr-2 h-4 w-4 transition-transform group-hover:rotate-12" />
                          Dashboard
                        </Link>
                      </Button>
                      <Button 
                        className="zyphex-button-primary hover:scale-[1.02] active:scale-[0.98] transition-transform animate-in fade-in slide-in-from-bottom duration-500 group" 
                        style={{ animationDelay: '350ms' }}
                        asChild 
                        onClick={() => setIsOpen(false)}
                      >
                        <Link href="/contact">
                          Start Project
                          <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </Link>
                      </Button>
                      <Button 
                        variant="outline" 
                        className="zyphex-button-secondary bg-transparent hover:scale-[1.02] active:scale-[0.98] transition-all animate-in fade-in slide-in-from-bottom duration-500 hover:border-red-500/50 hover:text-red-400 group" 
                        style={{ animationDelay: '400ms' }}
                        onClick={() => {
                          setIsOpen(false)
                          signOut({ callbackUrl: '/login' })
                        }}
                      >
                        <LogOut className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                        Sign out
                      </Button>
                    </>
                  ) : (
                    <>
                      {!isAdminRoute && !isAuthRoute && (
                        <Button 
                          className="zyphex-button-secondary bg-transparent hover:scale-[1.02] active:scale-[0.98] transition-transform animate-in fade-in slide-in-from-bottom duration-500 group" 
                          style={{ animationDelay: '250ms' }}
                          asChild 
                          onClick={() => setIsOpen(false)}
                        >
                          <Link href="/login">
                            <LogIn className="mr-2 h-4 w-4 transition-transform group-hover:translate-x-[-2px]" />
                            Login / Sign Up
                          </Link>
                        </Button>
                      )}
                      <Button 
                        className="zyphex-button-primary hover:scale-[1.02] active:scale-[0.98] transition-transform animate-in fade-in slide-in-from-bottom duration-500 group" 
                        style={{ animationDelay: '300ms' }}
                        asChild 
                        onClick={() => setIsOpen(false)}
                      >
                        <Link href="/contact">
                          Start Project
                          <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </Link>
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
