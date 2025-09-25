import { CacheManagement } from '@/components/admin/cache-management'
import { PerformanceMonitoring } from '@/components/admin/performance-monitoring'

export default function CacheManagementPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Cache Management</h1>
        <p className="text-muted-foreground mt-2">
          Monitor and manage caching system performance
        </p>
      </div>
      
      <CacheManagement />
      
      <PerformanceMonitoring />
    </div>
  )
}