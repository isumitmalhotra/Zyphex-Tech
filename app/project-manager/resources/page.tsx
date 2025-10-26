"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { PermissionGuard } from "@/components/auth/permission-guard"
import { Permission } from "@/lib/auth/permissions"
import {
  Users,
  Clock,
  Target,
  AlertTriangle,
  RefreshCw,
  UserPlus,
  Calendar,
  BarChart3,
} from "lucide-react"
import { SubtleBackground } from "@/components/subtle-background"
import Link from "next/link"

interface Resource {
  id: string;
  projectId: string;
  userId: string;
  role: string | null;
  allocationPercentage: number;
  hourlyRate: number | null;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
  skills: unknown;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    role: string;
  };
  project: {
    id: string;
    name: string;
    status: string;
  };
}

interface Statistics {
  total: number;
  active: number;
  inactive: number;
  avgAllocationPercentage: number;
  userUtilization: {
    overallocated: number;
    optimal: number;
    underutilized: number;
    data: Array<{
      userId: string;
      userName: string;
      totalAllocation: number;
      projects: number;
      isOverallocated: boolean;
    }>;
  };
}

function ResourceAllocationContent() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [statistics, setStatistics] = useState<Statistics>({
    total: 0,
    active: 0,
    inactive: 0,
    avgAllocationPercentage: 0,
    userUtilization: {
      overallocated: 0,
      optimal: 0,
      underutilized: 0,
      data: [],
    },
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/project-manager/resources?isActive=true");
      if (!response.ok) throw new Error("Failed to fetch resources");

      const data = await response.json();
      setResources(data.resources);
      setStatistics(data.statistics);
    } catch (error) {
      console.error("Error fetching resources:", error);
    } finally {
      setLoading(false);
    }
  };

  const getAvailabilityStatus = (allocation: number): string => {
    if (allocation > 100) return "Overallocated";
    if (allocation >= 80) return "Busy";
    return "Available";
  };

  const getAvailabilityVariant = (allocation: number): "default" | "secondary" | "destructive" => {
    if (allocation > 100) return "destructive";
    if (allocation >= 80) return "secondary";
    return "default";
  };

  // Get unique projects
  const uniqueProjects = new Set(resources.map(r => r.project.name)).size;

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0 zyphex-gradient-bg relative min-h-screen">
        <SubtleBackground />
        <div className="flex flex-1 flex-col gap-4 p-4 relative z-10">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Clock className="h-12 w-12 mx-auto mb-3 animate-spin text-blue-600" />
              <p className="zyphex-subheading">Loading resources...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0 zyphex-gradient-bg relative min-h-screen">
      <SubtleBackground />
      <div className="flex flex-1 flex-col gap-4 p-4 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold zyphex-heading">Resource Allocation</h1>
            <p className="zyphex-subheading">Manage team resources and project assignments</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="zyphex-button" onClick={fetchResources}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button size="sm" className="zyphex-button">
              <UserPlus className="h-4 w-4 mr-2" />
              Assign Resource
            </Button>
          </div>
        </div>

        {/* Resource Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="zyphex-card hover-zyphex-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium zyphex-subheading">Total Resources</CardTitle>
              <Users className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold zyphex-heading">{resources.length}</div>
              <p className="text-xs zyphex-subheading">Active team members</p>
            </CardContent>
          </Card>

          <Card className="zyphex-card hover-zyphex-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium zyphex-subheading">Available</CardTitle>
              <Target className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold zyphex-heading">
                {statistics.userUtilization.underutilized}
              </div>
              <p className="text-xs zyphex-subheading">Ready for assignment</p>
            </CardContent>
          </Card>

          <Card className="zyphex-card hover-zyphex-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium zyphex-subheading">Avg. Allocation</CardTitle>
              <BarChart3 className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold zyphex-heading">
                {Math.round(statistics.avgAllocationPercentage)}%
              </div>
              <p className="text-xs zyphex-subheading">Team utilization</p>
            </CardContent>
          </Card>

          <Card className="zyphex-card hover-zyphex-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium zyphex-subheading">Active Projects</CardTitle>
              <Clock className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold zyphex-heading">
                {uniqueProjects}
              </div>
              <p className="text-xs zyphex-subheading">With assigned resources</p>
            </CardContent>
          </Card>
        </div>

        {/* Resource Allocation Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="zyphex-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 zyphex-heading">
                <BarChart3 className="h-5 w-5" />
                Resource Utilization
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {statistics.userUtilization.data.map((user) => (
                <div key={user.userId} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium zyphex-heading">{user.userName}</span>
                    <span className="text-sm zyphex-subheading">{Math.round(user.totalAllocation)}%</span>
                  </div>
                  <Progress value={user.totalAllocation} className="h-2" />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="zyphex-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 zyphex-heading">
                <Users className="h-5 w-5" />
                Team Availability
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {statistics.userUtilization.data.map((user) => (
                <div key={user.userId} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                      {user.userName.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium zyphex-heading">{user.userName}</p>
                      <p className="text-sm zyphex-subheading">{user.projects} projects</p>
                    </div>
                  </div>
                  <Badge variant={getAvailabilityVariant(user.totalAllocation)}>
                    {getAvailabilityStatus(user.totalAllocation)}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Detailed Resource List */}
        <Card className="zyphex-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 zyphex-heading">
              <Users className="h-5 w-5" />
              Resource Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {statistics.userUtilization.data.map((user) => {
                // Get all allocations for this user
                const userAllocations = resources.filter(r => r.userId === user.userId);
                const projects = userAllocations.map(r => r.project.name);
                const roles = [...new Set(userAllocations.map(r => r.role).filter(Boolean))];
                // Parse skills from JSON
                const allSkills = userAllocations
                  .map(r => {
                    try {
                      return Array.isArray(r.skills) ? r.skills : JSON.parse(r.skills as string || '[]');
                    } catch {
                      return [];
                    }
                  })
                  .flat()
                  .filter((skill): skill is string => typeof skill === 'string');
                const uniqueSkills = [...new Set(allSkills)];

                return (
                  <div key={user.userId} className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold zyphex-heading">{user.userName}</h3>
                          {roles.length > 0 && <Badge variant="outline">{roles[0]}</Badge>}
                          <Badge variant={getAvailabilityVariant(user.totalAllocation)}>
                            {getAvailabilityStatus(user.totalAllocation)}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <p className="text-sm font-medium zyphex-subheading mb-1">Projects</p>
                            <div className="flex flex-wrap gap-1">
                              {projects.map((project, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {project}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-medium zyphex-subheading mb-1">Skills</p>
                            <div className="flex flex-wrap gap-1">
                              {uniqueSkills.length > 0 ? (
                                uniqueSkills.map((skill, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs">
                                    {skill}
                                  </Badge>
                                ))
                              ) : (
                                <span className="text-xs zyphex-subheading">No skills listed</span>
                              )}
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-medium zyphex-subheading mb-1">Allocation</p>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-slate-700 rounded-full">
                                <div 
                                  className={`h-full rounded-full ${
                                    user.totalAllocation > 100 ? 'bg-red-500' : 
                                    user.totalAllocation >= 80 ? 'bg-yellow-500' : 
                                    'bg-blue-500'
                                  }`}
                                  style={{ width: `${Math.min(user.totalAllocation, 100)}%` }}
                                />
                              </div>
                              <span className="text-sm zyphex-heading">{Math.round(user.totalAllocation)}%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="zyphex-card">
          <CardHeader>
            <CardTitle className="zyphex-heading">Resource Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Button className="zyphex-button h-auto p-4 flex-col gap-2" asChild>
                <Link href="/project-manager/team">
                  <Users className="h-6 w-6" />
                  <span>Manage Team</span>
                </Link>
              </Button>
              <Button className="zyphex-button h-auto p-4 flex-col gap-2" asChild>
                <Link href="/project-manager/workload">
                  <Clock className="h-6 w-6" />
                  <span>Workload</span>
                </Link>
              </Button>
              <Button className="zyphex-button h-auto p-4 flex-col gap-2" asChild>
                <Link href="/project-manager/projects">
                  <Target className="h-6 w-6" />
                  <span>Projects</span>
                </Link>
              </Button>
              <Button className="zyphex-button h-auto p-4 flex-col gap-2" asChild>
                <Link href="/project-manager/planning">
                  <Calendar className="h-6 w-6" />
                  <span>Planning</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function ResourceAllocation() {
  return (
    <PermissionGuard 
      permission={Permission.MANAGE_PROJECT_TEAM}
      fallback={
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0 zyphex-gradient-bg relative min-h-screen">
          <div className="flex flex-1 flex-col gap-4 p-4 relative z-10">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                You don&apos;t have permission to manage resource allocation.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      }
    >
      <ResourceAllocationContent />
    </PermissionGuard>
  )
}