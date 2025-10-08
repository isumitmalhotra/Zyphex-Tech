"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "sonner"
import { Plus, Loader2 } from "lucide-react"

interface ProjectRequestFormProps {
  onSuccess?: () => void
}

export function ProjectRequestForm({ onSuccess }: ProjectRequestFormProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    budget: "",
    timeline: "",
    requirements: ""
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/user/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        throw new Error("Failed to submit project request")
      }

      toast.success("Project request submitted successfully! We'll review it shortly.")
      setFormData({
        name: "",
        description: "",
        budget: "",
        timeline: "",
        requirements: ""
      })
      setOpen(false)
      onSuccess?.()
    } catch (error) {
      toast.error("Failed to submit project request")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="zyphex-button-primary hover-zyphex-lift">
          <Plus className="mr-2 h-4 w-4" />
          Request New Project
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] zyphex-glass-effect border-gray-800/50">
        <DialogHeader>
          <DialogTitle className="zyphex-heading">Request New Project</DialogTitle>
          <DialogDescription className="zyphex-subheading">
            Tell us about your project requirements and we&apos;ll get back to you with a proposal.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="name" className="zyphex-subheading">Project Name *</Label>
              <Input
                id="name"
                placeholder="e.g., E-commerce Website"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="zyphex-input"
              />
            </div>
            
            <div>
              <Label htmlFor="description" className="zyphex-subheading">Project Description *</Label>
              <Textarea
                id="description"
                placeholder="Detailed description of your project..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                rows={4}
                className="zyphex-input"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="budget" className="zyphex-subheading">Budget Range</Label>
                <Select value={formData.budget} onValueChange={(value) => setFormData({ ...formData, budget: value })}>
                  <SelectTrigger className="zyphex-input">
                    <SelectValue placeholder="Select budget range" />
                  </SelectTrigger>
                  <SelectContent className="zyphex-glass-effect border-gray-800/50">
                    <SelectItem value="5000">$5,000 - $10,000</SelectItem>
                    <SelectItem value="10000">$10,000 - $25,000</SelectItem>
                    <SelectItem value="25000">$25,000 - $50,000</SelectItem>
                    <SelectItem value="50000">$50,000+</SelectItem>
                    <SelectItem value="custom">Custom/Discuss</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="timeline" className="zyphex-subheading">Timeline</Label>
                <Select value={formData.timeline} onValueChange={(value) => setFormData({ ...formData, timeline: value })}>
                  <SelectTrigger className="zyphex-input">
                    <SelectValue placeholder="Project timeline" />
                  </SelectTrigger>
                  <SelectContent className="zyphex-glass-effect border-gray-800/50">
                    <SelectItem value="1-2 months">1-2 months</SelectItem>
                    <SelectItem value="3-4 months">3-4 months</SelectItem>
                    <SelectItem value="6+ months">6+ months</SelectItem>
                    <SelectItem value="flexible">Flexible</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="requirements" className="zyphex-subheading">Specific Requirements</Label>
              <Textarea
                id="requirements"
                placeholder="Any specific technologies, features, or requirements..."
                value={formData.requirements}
                onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                rows={3}
                className="zyphex-input"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="zyphex-button-secondary bg-transparent"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="zyphex-button-primary"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Request
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}