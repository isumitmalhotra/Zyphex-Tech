"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ArrowRight, Calendar, User, Search, Filter, Clock, Eye } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useScrollAnimation } from "@/components/scroll-animations"
import { SubtleBackground, MinimalParticles } from "@/components/subtle-background"

export default function UpdatesPage() {
  useScrollAnimation()

  const blogPosts = [
    {
      id: 1,
      title: "The Future of Remote Work: Technology Trends Shaping 2024",
      excerpt:
        "Exploring emerging trends in remote work technology including AI collaboration tools, virtual reality meetings, and advanced project management platforms that are transforming how distributed teams operate.",
      author: "Ishan Garg",
      date: "December 15, 2024",
      category: "Remote Work",
      readTime: "8 min read",
      views: "1.2k",
      image: "/placeholder.svg?height=300&width=600",
      featured: true,
    },
    {
      id: 2,
      title: "AI Integration in Business Applications: A Practical Guide",
      excerpt:
        "How artificial intelligence is transforming business processes and creating new opportunities for growth. Learn practical implementation strategies and real-world use cases.",
      author: "Sumit Malhotra",
      date: "December 10, 2024",
      category: "Artificial Intelligence",
      readTime: "12 min read",
      views: "2.1k",
      image: "/placeholder.svg?height=300&width=600",
      featured: true,
    },
    {
      id: 3,
      title: "Cybersecurity Best Practices for Remote Teams",
      excerpt:
        "Essential security measures every remote team should implement to protect their digital assets. A comprehensive guide covering everything from VPNs to zero-trust architecture.",
      author: "Security Team",
      date: "December 5, 2024",
      category: "Security",
      readTime: "10 min read",
      views: "1.8k",
      image: "/placeholder.svg?height=300&width=600",
      featured: false,
    },
    {
      id: 4,
      title: "Modern Web Development: React vs Vue vs Angular in 2024",
      excerpt:
        "A comprehensive comparison of the three leading frontend frameworks. Which one should you choose for your next project? We break down the pros, cons, and use cases.",
      author: "Development Team",
      date: "November 28, 2024",
      category: "Web Development",
      readTime: "15 min read",
      views: "3.2k",
      image: "/placeholder.svg?height=300&width=600",
      featured: false,
    },
    {
      id: 5,
      title: "Database Performance Optimization: Tips and Techniques",
      excerpt:
        "Learn how to optimize database performance for better application speed and user experience. Covering indexing strategies, query optimization, and scaling techniques.",
      author: "Ishan Garg",
      date: "November 20, 2024",
      category: "Database",
      readTime: "11 min read",
      views: "1.5k",
      image: "/placeholder.svg?height=300&width=600",
      featured: false,
    },
    {
      id: 6,
      title: "Mobile App Development Trends: Native vs Cross-Platform",
      excerpt:
        "Exploring the latest trends in mobile development. Should you go native or choose a cross-platform solution? We analyze the trade-offs and help you decide.",
      author: "Mobile Team",
      date: "November 15, 2024",
      category: "Mobile Development",
      readTime: "9 min read",
      views: "2.3k",
      image: "/placeholder.svg?height=300&width=600",
      featured: false,
    },
  ]

  const categories = [
    "All",
    "Remote Work",
    "Artificial Intelligence",
    "Security",
    "Web Development",
    "Database",
    "Mobile Development",
    "DevOps",
    "E-commerce",
  ]

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="zyphex-gradient-bg section-padding overflow-hidden relative">
        <SubtleBackground />
        <MinimalParticles />
        <div className="container mx-auto container-padding relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <Badge variant="secondary" className="w-fit mx-auto zyphex-blue-glow animate-zyphex-glow scroll-reveal">
              Latest Updates & Insights
            </Badge>
            <h1 className="text-4xl lg:text-5xl font-bold zyphex-heading scroll-reveal-scale">
              Stay Ahead with Technology Insights
            </h1>
            <p className="text-xl zyphex-subheading leading-relaxed scroll-reveal">
              Discover the latest trends, best practices, and expert insights in remote technology. Our team shares
              knowledge to help you make informed decisions for your business.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto scroll-reveal">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search articles..."
                  className="pl-10 zyphex-glass-effect border-gray-700 text-gray-200 placeholder:text-gray-400 hover:border-blue-500 transition-colors duration-200"
                />
              </div>
              <Button className="zyphex-button-primary hover-zyphex-lift">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="py-8 zyphex-section-bg border-b border-gray-800/50">
        <div className="container mx-auto container-padding">
          <div className="flex flex-wrap gap-2 justify-center">
            {categories.map((category, index) => (
              <Button
                key={index}
                variant={index === 0 ? "default" : "outline"}
                size="sm"
                className={`rounded-full hover-zyphex-lift ${index === 0 ? "zyphex-button-primary" : "zyphex-button-secondary bg-transparent"}`}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Posts */}
      <section className="section-padding bg-slate-900/50">
        <div className="container mx-auto container-padding">
          <div className="text-center space-y-4 mb-12 scroll-reveal">
            <h2 className="text-3xl lg:text-4xl font-bold zyphex-heading">Featured Articles</h2>
            <p className="text-lg zyphex-subheading max-w-2xl mx-auto">Our most popular and impactful articles</p>
          </div>
          <div className="grid lg:grid-cols-2 gap-8">
            {blogPosts
              .filter((post) => post.featured)
              .map((post, index) => (
                <Card
                  key={post.id}
                  className={`zyphex-card hover-zyphex-lift overflow-hidden scroll-reveal-scale`}
                  style={{ animationDelay: `${index * 200}ms` }}
                >
                  <div className="relative overflow-hidden">
                    <Image
                      src={post.image || "/placeholder.svg"}
                      alt={post.title}
                      width={600}
                      height={300}
                      className="w-full h-64 object-cover hover:scale-110 transition-transform duration-500"
                    />
                    <Badge className="absolute top-4 left-4 zyphex-gradient-primary animate-zyphex-glow">
                      {post.category}
                    </Badge>
                    <Badge variant="secondary" className="absolute top-4 right-4 zyphex-blue-glow">
                      Featured
                    </Badge>
                  </div>
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-4 text-sm zyphex-subheading mb-3">
                      <div className="flex items-center gap-1 hover:text-blue-400 transition-colors duration-200">
                        <User className="h-4 w-4" />
                        {post.author}
                      </div>
                      <div className="flex items-center gap-1 hover:text-blue-400 transition-colors duration-200">
                        <Calendar className="h-4 w-4" />
                        {post.date}
                      </div>
                      <div className="flex items-center gap-1 hover:text-blue-400 transition-colors duration-200">
                        <Clock className="h-4 w-4" />
                        {post.readTime}
                      </div>
                      <div className="flex items-center gap-1 hover:text-blue-400 transition-colors duration-200">
                        <Eye className="h-4 w-4" />
                        {post.views}
                      </div>
                    </div>
                    <CardTitle className="text-2xl zyphex-heading hover:text-blue-400 transition-colors duration-300 leading-tight">
                      {post.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <CardDescription className="zyphex-subheading leading-relaxed text-base">
                      {post.excerpt}
                    </CardDescription>
                    <Button
                      variant="ghost"
                      className="p-0 h-auto font-medium zyphex-accent-text hover:text-blue-300 hover:translate-x-1 transition-all duration-300"
                      asChild
                    >
                      <Link href={`/updates/${post.id}`}>
                        Read Full Article
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      </section>

      {/* All Articles */}
      <section className="section-padding zyphex-section-bg">
        <div className="container mx-auto container-padding">
          <div className="text-center space-y-4 mb-12 scroll-reveal">
            <h2 className="text-3xl lg:text-4xl font-bold zyphex-heading">All Articles</h2>
            <p className="text-lg zyphex-subheading max-w-2xl mx-auto">
              Explore our complete collection of technology insights and tutorials
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts
              .filter((post) => !post.featured)
              .map((post, index) => (
                <Card
                  key={post.id}
                  className={`zyphex-card hover-zyphex-lift overflow-hidden scroll-reveal-scale`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="relative overflow-hidden">
                    <Image
                      src={post.image || "/placeholder.svg"}
                      alt={post.title}
                      width={400}
                      height={200}
                      className="w-full h-48 object-cover hover:scale-110 transition-transform duration-500"
                    />
                    <Badge className="absolute top-4 left-4 zyphex-gradient-primary animate-zyphex-glow">
                      {post.category}
                    </Badge>
                  </div>
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-3 text-xs zyphex-subheading mb-3">
                      <div className="flex items-center gap-1 hover:text-blue-400 transition-colors duration-200">
                        <User className="h-3 w-3" />
                        {post.author}
                      </div>
                      <div className="flex items-center gap-1 hover:text-blue-400 transition-colors duration-200">
                        <Calendar className="h-3 w-3" />
                        {post.date}
                      </div>
                    </div>
                    <CardTitle className="text-lg zyphex-heading hover:text-blue-400 transition-colors duration-300 leading-tight">
                      {post.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <CardDescription className="zyphex-subheading leading-relaxed text-sm">
                      {post.excerpt}
                    </CardDescription>
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-3 text-xs zyphex-subheading">
                        <div className="flex items-center gap-1 hover:text-blue-400 transition-colors duration-200">
                          <Clock className="h-3 w-3" />
                          {post.readTime}
                        </div>
                        <div className="flex items-center gap-1 hover:text-blue-400 transition-colors duration-200">
                          <Eye className="h-3 w-3" />
                          {post.views}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-0 h-auto font-medium zyphex-accent-text hover:text-blue-300 hover:translate-x-1 transition-all duration-300"
                        asChild
                      >
                        <Link href={`/updates/${post.id}`}>
                          Read More
                          <ArrowRight className="ml-1 h-3 w-3" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>

          {/* Load More Button */}
          <div className="text-center mt-12 scroll-reveal">
            <Button variant="outline" size="lg" className="zyphex-button-secondary hover-zyphex-lift bg-transparent">
              Load More Articles
            </Button>
          </div>
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className="section-padding bg-slate-900/50">
        <div className="container mx-auto container-padding">
          <div className="max-w-2xl mx-auto text-center space-y-8 scroll-reveal">
            <div className="space-y-4">
              <h2 className="text-3xl lg:text-4xl font-bold zyphex-heading">Stay Updated with Our Newsletter</h2>
              <p className="text-lg zyphex-subheading">
                Get the latest technology insights, tutorials, and industry news delivered directly to your inbox.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <Input
                type="email"
                placeholder="Enter your email address"
                className="flex-1 zyphex-glass-effect border-gray-700 text-gray-200 placeholder:text-gray-400 hover:border-blue-500 transition-colors duration-200"
              />
              <Button className="zyphex-button-primary hover-zyphex-lift">
                Subscribe
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm zyphex-subheading">
              Join 5,000+ professionals who trust our insights. Unsubscribe anytime.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding zyphex-gradient-bg text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full animate-float-3d"></div>
          <div className="absolute bottom-10 right-10 w-24 h-24 bg-white rounded-full animate-float-3d"></div>
        </div>
        <div className="container mx-auto container-padding text-center relative z-10">
          <div className="max-w-3xl mx-auto space-y-8 scroll-reveal">
            <h2 className="text-3xl lg:text-4xl font-bold zyphex-heading">Ready to Implement These Ideas?</h2>
            <p className="text-xl zyphex-subheading">
              Our remote team can help you implement the strategies and technologies discussed in our articles. Let's
              turn insights into action for your business.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                variant="secondary"
                className="text-lg px-8 py-6 zyphex-button-secondary hover-zyphex-lift"
                asChild
              >
                <Link href="/contact">
                  Start Your Project
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 py-6 border-white text-white hover:bg-white hover:text-blue-600 bg-transparent zyphex-button-secondary hover-zyphex-lift"
                asChild
              >
                <Link href="/services">View Our Services</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
