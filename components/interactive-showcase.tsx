"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Code,
  Cloud,
  BarChart3,
  Smartphone,
  Zap,
  Users,
  Play,
  Pause,
  RefreshCw,
  CheckCircle,
  TrendingUp,
  Server,
  Database,
  Shield,
  Cpu,
  Globe,
  ArrowRight,
  Send,
} from "lucide-react"

export default function InteractiveShowcase() {
  const [activeDemo, setActiveDemo] = useState("software")
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    project: "",
  })
  const [analyticsData, setAnalyticsData] = useState([
    { month: "Jan", revenue: 45000, users: 1200 },
    { month: "Feb", revenue: 52000, users: 1350 },
    { month: "Mar", revenue: 48000, users: 1280 },
    { month: "Apr", revenue: 61000, users: 1520 },
    { month: "May", revenue: 55000, users: 1400 },
    { month: "Jun", revenue: 67000, users: 1680 },
  ])

  const demos = [
    {
      id: "software",
      title: "Custom Software Development",
      icon: Code,
      description: "Interactive business application with real-time features",
    },
    {
      id: "cloud",
      title: "Cloud Architecture",
      icon: Cloud,
      description: "Scalable cloud infrastructure visualization",
    },
    {
      id: "analytics",
      title: "Data Analytics Dashboard",
      icon: BarChart3,
      description: "Real-time business intelligence and reporting",
    },
    {
      id: "mobile",
      title: "Mobile App Preview",
      icon: Smartphone,
      description: "Cross-platform mobile application interface",
    },
    {
      id: "consulting",
      title: "IT Assessment Tool",
      icon: Zap,
      description: "Interactive technology readiness evaluation",
    },
  ]

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Simulate form submission
    setTimeout(() => {
      alert("Demo form submitted successfully!")
    }, 500)
  }

  const simulateProgress = () => {
    setIsPlaying(true)
    setProgress(0)
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsPlaying(false)
          return 100
        }
        return prev + 2
      })
    }, 100)
  }

  const resetDemo = () => {
    setProgress(0)
    setIsPlaying(false)
  }

  return (
    <div className="max-w-6xl mx-auto">
      <Tabs value={activeDemo} onValueChange={setActiveDemo} className="w-full">
        {/* Demo Navigation */}
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 mb-8 h-auto p-1 bg-gray-900/80 backdrop-blur-sm border border-gray-700">
          {demos.map((demo) => (
            <TabsTrigger
              key={demo.id}
              value={demo.id}
              className="flex flex-col items-center gap-2 p-4 data-[state=active]:bg-slate-800 data-[state=active]:text-white data-[state=active]:shadow-sm text-gray-300 hover:text-white transition-colors"
            >
              <demo.icon className="h-5 w-5" />
              <span className="text-xs font-medium text-center leading-tight text-white">{demo.title}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Software Development Demo */}
        <TabsContent value="software" className="space-y-6">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-white mb-2">Custom Business Application</h3>
            <p className="text-gray-300">Experience a fully functional business management interface</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5 text-blue-600" />
                  Project Management Dashboard
                </CardTitle>
                <CardDescription>Real-time project tracking and team collaboration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">24</div>
                    <div className="text-sm text-gray-600">Active Projects</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">156</div>
                    <div className="text-sm text-gray-600">Tasks Completed</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">12</div>
                    <div className="text-sm text-gray-600">Team Members</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors duration-200">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="font-medium">Remote Team Dashboard</span>
                    </div>
                    <Badge variant="secondary">In Progress</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors duration-200">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse delay-200"></div>
                      <span className="font-medium">Cloud Migration Platform</span>
                    </div>
                    <Badge>Planning</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors duration-200">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse delay-400"></div>
                      <span className="font-medium">Mobile App Prototype</span>
                    </div>
                    <Badge variant="outline">Review</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Quick Project Setup</CardTitle>
                <CardDescription>Try our intuitive project creation interface</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleFormSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="project-name">Project Name</Label>
                    <Input
                      id="project-name"
                      placeholder="Enter project name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="project-type">Project Type</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select project type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="web">Web Application</SelectItem>
                        <SelectItem value="mobile">Mobile App</SelectItem>
                        <SelectItem value="desktop">Desktop Software</SelectItem>
                        <SelectItem value="api">API Development</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe your project requirements"
                      value={formData.project}
                      onChange={(e) => setFormData({ ...formData, project: e.target.value })}
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    <Send className="mr-2 h-4 w-4" />
                    Create Project
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Cloud Architecture Demo */}
        <TabsContent value="cloud" className="space-y-6">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-white mb-2">Cloud Infrastructure Visualization</h3>
            <p className="text-gray-300">Interactive cloud architecture with real-time monitoring</p>
          </div>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cloud className="h-5 w-5 text-blue-600" />
                AWS Cloud Architecture
              </CardTitle>
              <CardDescription>Scalable, secure, and cost-effective cloud solution</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid lg:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-300">Frontend Layer</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                      <Globe className="h-5 w-5 text-blue-600" />
                      <div>
                        <div className="font-medium">CloudFront CDN</div>
                        <div className="text-sm text-gray-600">Global content delivery</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                      <Server className="h-5 w-5 text-green-600" />
                      <div>
                        <div className="font-medium">Load Balancer</div>
                        <div className="text-sm text-gray-600">High availability</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-300">Application Layer</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                      <Cpu className="h-5 w-5 text-purple-600" />
                      <div>
                        <div className="font-medium">EC2 Instances</div>
                        <div className="text-sm text-gray-600">Auto-scaling compute</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                      <Shield className="h-5 w-5 text-orange-600" />
                      <div>
                        <div className="font-medium">Security Groups</div>
                        <div className="text-sm text-gray-600">Network security</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-300">Data Layer</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                      <Database className="h-5 w-5 text-red-600" />
                      <div>
                        <div className="font-medium">RDS Database</div>
                        <div className="text-sm text-gray-600">Managed database</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                      <Server className="h-5 w-5 text-yellow-600" />
                      <div>
                        <div className="font-medium">S3 Storage</div>
                        <div className="text-sm text-gray-600">Object storage</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-gray-300">Migration Progress</h4>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={simulateProgress}
                      disabled={isPlaying}
                      className="flex items-center gap-2"
                    >
                      {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      {isPlaying ? "Running" : "Start Migration"}
                    </Button>
                    <Button size="sm" variant="outline" onClick={resetDemo}>
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <Progress value={progress} className="mb-2" />
                <div className="text-sm text-gray-600">{progress}% Complete</div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Dashboard Demo */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-white mb-2">Business Intelligence Dashboard</h3>
            <p className="text-gray-300">Real-time analytics and data visualization</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  Revenue Analytics
                </CardTitle>
                <CardDescription>Monthly performance tracking</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">$67K</div>
                      <div className="text-sm text-gray-600">This Month</div>
                      <div className="flex items-center justify-center gap-1 text-green-600 text-xs mt-1">
                        <TrendingUp className="h-3 w-3" />
                        +12.5%
                      </div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">1,680</div>
                      <div className="text-sm text-gray-600">Active Users</div>
                      <div className="flex items-center justify-center gap-1 text-blue-600 text-xs mt-1">
                        <TrendingUp className="h-3 w-3" />
                        +8.3%
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {analyticsData.map((data, index) => (
                      <div key={data.month} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                        <span className="font-medium">{data.month}</span>
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-gray-600">${data.revenue.toLocaleString()}</span>
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-1000"
                              style={{ width: `${(data.revenue / 70000) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Key Performance Indicators</CardTitle>
                <CardDescription>Real-time business metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Conversion Rate</span>
                    <span className="text-sm text-gray-600">3.2%</span>
                  </div>
                  <Progress value={32} className="h-2" />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Customer Satisfaction</span>
                    <span className="text-sm text-gray-600">94%</span>
                  </div>
                  <Progress value={94} className="h-2" />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">System Uptime</span>
                    <span className="text-sm text-gray-600">99.9%</span>
                  </div>
                  <Progress value={99.9} className="h-2" />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Response Time</span>
                    <span className="text-sm text-gray-600">120ms</span>
                  </div>
                  <Progress value={85} className="h-2" />
                </div>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-gray-900">All Systems Operational</span>
                  </div>
                  <p className="text-sm text-gray-600">Last updated: 2 minutes ago</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Mobile App Demo */}
        <TabsContent value="mobile" className="space-y-6">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-white mb-2">Mobile App Interface</h3>
            <p className="text-gray-300">Cross-platform mobile application preview</p>
          </div>

          <div className="flex justify-center">
            <div className="relative">
              <div className="w-80 h-[600px] bg-gray-900 rounded-[3rem] p-2 shadow-2xl">
                <div className="w-full h-full bg-white rounded-[2.5rem] overflow-hidden">
                  {/* Mobile App Header */}
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 flex items-center justify-between">
                    <h4 className="font-semibold">RemotixLabs</h4>
                    <div className="flex gap-2">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse delay-200"></div>
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse delay-400"></div>
                    </div>
                  </div>

                  {/* Mobile App Content */}
                  <div className="p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-blue-50 p-4 rounded-lg text-center">
                        <BarChart3 className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                        <div className="text-sm font-medium">Analytics</div>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg text-center">
                        <Users className="h-6 w-6 text-green-600 mx-auto mb-2" />
                        <div className="text-sm font-medium">Team</div>
                      </div>
                      <div className="bg-purple-50 p-4 rounded-lg text-center">
                        <Code className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                        <div className="text-sm font-medium">Projects</div>
                      </div>
                      <div className="bg-orange-50 p-4 rounded-lg text-center">
                        <Zap className="h-6 w-6 text-orange-600 mx-auto mb-2" />
                        <div className="text-sm font-medium">Tasks</div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h5 className="font-semibold text-gray-300">Recent Activity</h5>
                      <div className="space-y-2">
                        <div className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm">Project completed</span>
                        </div>
                        <div className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="text-sm">New team member added</span>
                        </div>
                        <div className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                          <span className="text-sm">Task deadline approaching</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Feature Callouts */}
              <div className="absolute -left-20 top-20 bg-white p-3 rounded-lg shadow-lg animate-float">
                <div className="text-xs font-medium">Native Performance</div>
              </div>
              <div className="absolute -right-20 top-40 bg-white p-3 rounded-lg shadow-lg animate-float delay-1000">
                <div className="text-xs font-medium">Offline Support</div>
              </div>
              <div className="absolute -left-16 bottom-32 bg-white p-3 rounded-lg shadow-lg animate-float delay-2000">
                <div className="text-xs font-medium">Push Notifications</div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* IT Consulting Demo */}
        <TabsContent value="consulting" className="space-y-6">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-white mb-2">IT Readiness Assessment</h3>
            <p className="text-gray-300">Interactive tool to evaluate your technology infrastructure</p>
          </div>

          <Card className="border-0 shadow-lg max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-blue-600" />
                Technology Assessment Tool
              </CardTitle>
              <CardDescription>Answer a few questions to get personalized recommendations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium">What's your current technology stack?</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {["Legacy Systems", "Modern Web", "Cloud-Native", "Hybrid"].map((option) => (
                      <Button key={option} variant="outline" size="sm" className="justify-start bg-transparent">
                        {option}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-base font-medium">Primary business challenge?</Label>
                  <div className="grid grid-cols-1 gap-2 mt-2">
                    {["Scalability Issues", "Security Concerns", "Performance Problems", "Integration Challenges"].map(
                      (option) => (
                        <Button key={option} variant="outline" size="sm" className="justify-start bg-transparent">
                          {option}
                        </Button>
                      ),
                    )}
                  </div>
                </div>

                <div>
                  <Label className="text-base font-medium">Team size?</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select team size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">1-10 employees</SelectItem>
                      <SelectItem value="medium">11-50 employees</SelectItem>
                      <SelectItem value="large">51-200 employees</SelectItem>
                      <SelectItem value="enterprise">200+ employees</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-gray-300 mb-2">Preliminary Assessment</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Technology Maturity</span>
                    <Badge variant="secondary">Moderate</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Security Posture</span>
                    <Badge>Good</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Scalability Readiness</span>
                    <Badge variant="outline">Needs Improvement</Badge>
                  </div>
                </div>
              </div>

              <Button className="w-full">
                Get Detailed Assessment Report
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
