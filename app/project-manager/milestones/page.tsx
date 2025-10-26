"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { PermissionGuard } from "@/components/auth/permission-guard"
import { Permission } from "@/lib/auth/permissions"
import {
  Flag,
  Calendar,
  Target,
  AlertTriangle,
  RefreshCw,
  Plus,
  Clock,
  CheckCircle,
  CircleDot,
} from "lucide-react"
import { SubtleBackground } from "@/components/subtle-background"
import Link from "next/link"

interface Milestone {
  id: string;
  title: string;
  description: string | null;
  targetDate: string;
  actualDate: string | null;
  status: string;
  order: number;
  isKey: boolean;
  project: {
    id: string;
    name: string;
    status: string;
  };
}

function MilestonesContent() {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    delayed: 0,
    upcomingMilestones: 0,
  });

  useEffect(() => {
    fetchMilestones();
  }, []);

  const fetchMilestones = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/project-manager/milestones");
      if (!response.ok) throw new Error("Failed to fetch milestones");

      const data = await response.json();
      setMilestones(data.milestones);
      setStatistics(data.statistics);
    } catch (error) {
      console.error("Error fetching milestones:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toUpperCase()) {
      case "COMPLETED":
        return "default";
      case "IN_PROGRESS":
        return "secondary";
      case "DELAYED":
        return "destructive";
      default:
        return "outline";
    }
  };

  const calculateProgress = (milestone: Milestone): number => {
    if (milestone.status === "COMPLETED") return 100;
    if (milestone.status === "IN_PROGRESS") return 50;
    if (milestone.status === "PENDING") return 0;
    if (milestone.status === "DELAYED") return 75;
    return 0;
  };

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0 zyphex-gradient-bg relative min-h-screen">
        <SubtleBackground />
        <div className="flex flex-1 flex-col gap-4 p-4 relative z-10">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Clock className="h-12 w-12 mx-auto mb-3 animate-spin text-blue-600" />
              <p className="zyphex-subheading">Loading milestones...</p>
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
            <h1 className="text-3xl font-bold zyphex-heading">Project Milestones</h1>
            <p className="zyphex-subheading">Track and manage project milestones and deadlines</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="zyphex-button" onClick={fetchMilestones}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button size="sm" className="zyphex-button">
              <Plus className="h-4 w-4 mr-2" />
              Add Milestone
            </Button>
          </div>
        </div>

        {/* Milestone Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="zyphex-card hover-zyphex-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium zyphex-subheading">Total Milestones</CardTitle>
              <Flag className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold zyphex-heading">{statistics.total}</div>
              <p className="text-xs zyphex-subheading">All milestones</p>
            </CardContent>
          </Card>

          <Card className="zyphex-card hover-zyphex-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium zyphex-subheading">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold zyphex-heading">{statistics.completed}</div>
              <p className="text-xs zyphex-subheading">Finished milestones</p>
            </CardContent>
          </Card>

          <Card className="zyphex-card hover-zyphex-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium zyphex-subheading">In Progress</CardTitle>
              <CircleDot className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold zyphex-heading">{statistics.inProgress}</div>
              <p className="text-xs zyphex-subheading">Active milestones</p>
            </CardContent>
          </Card>

          <Card className="zyphex-card hover-zyphex-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium zyphex-subheading">Upcoming</CardTitle>
              <Clock className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold zyphex-heading">{statistics.upcomingMilestones}</div>
              <p className="text-xs zyphex-subheading">Next 30 days</p>
            </CardContent>
          </Card>
        </div>

        {/* Milestones List */}
        <Card className="zyphex-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 zyphex-heading">
              <Flag className="h-5 w-5" />
              All Milestones
            </CardTitle>
          </CardHeader>
          <CardContent>
            {milestones.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Flag className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No milestones found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {milestones.map((milestone) => (
                  <div key={milestone.id} className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold zyphex-heading">{milestone.title}</h3>
                          <Badge variant={getStatusBadgeVariant(milestone.status)}>
                            {milestone.status.replace('_', ' ')}
                          </Badge>
                          {milestone.isKey && (
                            <Badge variant="outline" className="text-yellow-400 border-yellow-400">
                              <Flag className="h-3 w-3 mr-1" />
                              Key
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm zyphex-subheading mb-2">{milestone.description || "No description"}</p>
                        <div className="flex items-center gap-4 text-sm zyphex-subheading">
                          <div className="flex items-center gap-1">
                            <Target className="h-4 w-4" />
                            <span>{milestone.project.name}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>{new Date(milestone.targetDate).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-sm font-medium zyphex-heading">{calculateProgress(milestone)}%</p>
                        <div className="w-20 h-2 bg-slate-700 rounded-full mt-1">
                          <div 
                            className="h-full bg-blue-500 rounded-full transition-all"
                            style={{ width: `${calculateProgress(milestone)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="zyphex-card">
          <CardHeader>
            <CardTitle className="zyphex-heading">Milestone Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button className="zyphex-button h-auto p-4 flex-col gap-2" asChild>
                <Link href="/project-manager/projects">
                  <Target className="h-6 w-6" />
                  <span>View Projects</span>
                </Link>
              </Button>
              <Button className="zyphex-button h-auto p-4 flex-col gap-2" asChild>
                <Link href="/project-manager/planning">
                  <Calendar className="h-6 w-6" />
                  <span>Project Planning</span>
                </Link>
              </Button>
              <Button className="zyphex-button h-auto p-4 flex-col gap-2" asChild>
                <Link href="/project-manager/reports">
                  <Flag className="h-6 w-6" />
                  <span>Milestone Reports</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function Milestones() {
  return (
    <PermissionGuard 
      permission={Permission.VIEW_PROJECTS}
      fallback={
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0 zyphex-gradient-bg relative min-h-screen">
          <div className="flex flex-1 flex-col gap-4 p-4 relative z-10">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                You don&apos;t have permission to view project milestones.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      }
    >
      <MilestonesContent />
    </PermissionGuard>
  )
}