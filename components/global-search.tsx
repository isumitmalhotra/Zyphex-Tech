"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Search, X, Clock, TrendingUp, FileText, Briefcase, Newspaper, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

interface SearchResult {
  id: string
  title: string
  description: string
  url: string
  category: "page" | "blog" | "service" | "project"
  icon: React.ReactNode
}

const POPULAR_SEARCHES = [
  "Web Development",
  "Mobile Apps",
  "AI Solutions",
  "Cloud Services",
  "Contact Us"
]

const QUICK_LINKS: SearchResult[] = [
  {
    id: "services",
    title: "Our Services",
    description: "Explore our comprehensive technology solutions",
    url: "/services",
    category: "page",
    icon: <Briefcase className="w-4 h-4" />
  },
  {
    id: "updates",
    title: "Latest Updates",
    description: "Stay informed with our latest news and insights",
    url: "/updates",
    category: "blog",
    icon: <Newspaper className="w-4 h-4" />
  },
  {
    id: "contact",
    title: "Start a Project",
    description: "Get in touch to begin your digital transformation",
    url: "/contact",
    category: "page",
    icon: <FileText className="w-4 h-4" />
  }
]

export function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isSearching, setIsSearching] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('zyphex-recent-searches')
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to parse recent searches:', e)
      }
    }
  }, [])

  // Save search to recent searches
  const saveSearch = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) return
    
    const updated = [
      searchQuery,
      ...recentSearches.filter(s => s !== searchQuery)
    ].slice(0, 5)
    
    setRecentSearches(updated)
    localStorage.setItem('zyphex-recent-searches', JSON.stringify(updated))
  }, [recentSearches])

  // Keyboard shortcut (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(true)
      }
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }

    setIsSearching(true)
    const timer = setTimeout(() => {
      performSearch(query)
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  const performSearch = async (searchQuery: string) => {
    // Mock search results - in production, this would call an API
    const mockResults: SearchResult[] = [
      {
        id: "web-dev",
        title: "Web Development Services",
        description: "Custom web applications built with modern technologies",
        url: "/services#web-development",
        category: "service",
        icon: <Briefcase className="w-4 h-4" />
      },
      {
        id: "mobile-dev",
        title: "Mobile App Development",
        description: "Native and cross-platform mobile solutions",
        url: "/services#mobile-development",
        category: "service",
        icon: <Briefcase className="w-4 h-4" />
      },
      {
        id: "ai-blog",
        title: "The Future of AI in Business",
        description: "Exploring how AI is transforming industries",
        url: "/updates/ai-future",
        category: "blog",
        icon: <Newspaper className="w-4 h-4" />
      },
      {
        id: "contact-page",
        title: "Contact Us",
        description: "Get in touch with our team",
        url: "/contact",
        category: "page",
        icon: <FileText className="w-4 h-4" />
      }
    ]

    // Filter results based on query
    const filtered = mockResults.filter(result =>
      result.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      result.description.toLowerCase().includes(searchQuery.toLowerCase())
    )

    setResults(filtered)
    setIsSearching(false)
    setSelectedIndex(0)
  }

  const handleSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) return
    
    saveSearch(searchQuery)
    setIsOpen(false)
    setQuery("")
    router.push(`/updates?search=${encodeURIComponent(searchQuery)}`)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (results.length > 0) {
        const selected = results[selectedIndex]
        saveSearch(query)
        setIsOpen(false)
        setQuery("")
        router.push(selected.url)
      } else {
        handleSearch(query)
      }
    }
  }

  const clearRecentSearches = () => {
    setRecentSearches([])
    localStorage.removeItem('zyphex-recent-searches')
  }

  if (!isOpen) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="relative text-gray-400 hover:text-white hover-zyphex-glow transition-all duration-300 hidden md:flex items-center gap-2 px-3"
      >
        <Search className="h-4 w-4" />
        <span className="text-sm">Search</span>
        <kbd className="hidden lg:inline-flex h-5 select-none items-center gap-1 rounded border border-gray-700 bg-gray-900/50 px-1.5 font-mono text-[10px] font-medium text-gray-400">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
    )
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 animate-in fade-in duration-300"
        onClick={() => setIsOpen(false)}
      />

      {/* Search Modal */}
      <div className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-2xl z-50 px-4 animate-in slide-in-from-top-4 fade-in duration-300">
        <div className="zyphex-glass-effect border border-gray-800/50 rounded-2xl shadow-2xl shadow-blue-500/10 overflow-hidden">
          {/* Search Input */}
          <div className="flex items-center gap-3 p-4 border-b border-gray-800/50">
            <Search className="h-5 w-5 text-gray-400" />
            <Input
              ref={inputRef}
              type="text"
              placeholder="Search for services, blog posts, or pages..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 text-white placeholder:text-gray-500"
            />
            {query && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setQuery("")}
                className="h-8 w-8 p-0 hover:bg-white/5"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 p-0 hover:bg-white/5"
            >
              <kbd className="text-xs text-gray-400">ESC</kbd>
            </Button>
          </div>

          {/* Search Results */}
          <div className="max-h-[60vh] overflow-y-auto">
            {query && results.length > 0 && (
              <div className="p-2">
                <div className="text-xs text-gray-400 px-3 py-2 flex items-center gap-2">
                  <TrendingUp className="h-3 w-3" />
                  Results
                </div>
                {results.map((result, index) => (
                  <Link
                    key={result.id}
                    href={result.url}
                    onClick={() => {
                      saveSearch(query)
                      setIsOpen(false)
                      setQuery("")
                    }}
                    className={cn(
                      "block p-3 rounded-lg transition-all duration-200 group",
                      selectedIndex === index
                        ? "bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30"
                        : "hover:bg-white/5"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-transform duration-200",
                        selectedIndex === index ? "bg-blue-500/20 scale-110" : "bg-white/5",
                        "group-hover:scale-110"
                      )}>
                        {result.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-white truncate group-hover:text-blue-400 transition-colors">
                            {result.title}
                          </p>
                          <span className="text-xs text-gray-500 capitalize">{result.category}</span>
                        </div>
                        <p className="text-xs text-gray-400 truncate mt-1">
                          {result.description}
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {query && results.length === 0 && !isSearching && (
              <div className="p-8 text-center">
                <Search className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 mb-2">No results found for &ldquo;{query}&rdquo;</p>
                <p className="text-sm text-gray-500">Try different keywords or browse our quick links below</p>
              </div>
            )}

            {!query && (
              <div className="p-2">
                {/* Recent Searches */}
                {recentSearches.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between px-3 py-2">
                      <div className="text-xs text-gray-400 flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        Recent
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearRecentSearches}
                        className="h-6 text-xs text-gray-500 hover:text-gray-300"
                      >
                        Clear
                      </Button>
                    </div>
                    {recentSearches.map((search, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setQuery(search)
                          performSearch(search)
                        }}
                        className="w-full text-left p-3 rounded-lg hover:bg-white/5 transition-colors group flex items-center gap-3"
                      >
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-300 group-hover:text-white flex-1">
                          {search}
                        </span>
                        <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-gray-400 group-hover:translate-x-1 transition-all" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Quick Links */}
                <div>
                  <div className="text-xs text-gray-400 px-3 py-2 flex items-center gap-2">
                    <TrendingUp className="h-3 w-3" />
                    Quick Links
                  </div>
                  {QUICK_LINKS.map((link) => (
                    <Link
                      key={link.id}
                      href={link.url}
                      onClick={() => {
                        setIsOpen(false)
                        setQuery("")
                      }}
                      className="block p-3 rounded-lg hover:bg-white/5 transition-all duration-200 group"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-blue-500/20 group-hover:scale-110 transition-all duration-200">
                          {link.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate group-hover:text-blue-400 transition-colors">
                            {link.title}
                          </p>
                          <p className="text-xs text-gray-400 truncate mt-1">
                            {link.description}
                          </p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Popular Searches */}
                <div className="p-3 border-t border-gray-800/50 mt-2">
                  <div className="text-xs text-gray-400 mb-3">Popular searches</div>
                  <div className="flex flex-wrap gap-2">
                    {POPULAR_SEARCHES.map((search) => (
                      <button
                        key={search}
                        onClick={() => {
                          setQuery(search)
                          performSearch(search)
                        }}
                        className="px-3 py-1.5 text-xs rounded-full bg-white/5 text-gray-300 hover:bg-blue-500/20 hover:text-blue-400 hover:border-blue-500/30 border border-transparent transition-all duration-200 hover:scale-105"
                      >
                        {search}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-800/50 p-3 flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-gray-900/50 border border-gray-700">↑↓</kbd>
                <span>Navigate</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-gray-900/50 border border-gray-700">↵</kbd>
                <span>Select</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-gray-900/50 border border-gray-700">ESC</kbd>
                <span>Close</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
