'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  DollarSign, 
  Clock, 
  Target, 
  Calendar, 
  CreditCard, 
  Settings,
  Plus,
  Trash2
} from 'lucide-react'
import type { BillingModel, BillingConfiguration, MilestonePayment } from '@/lib/billing/billing-engine'

interface BillingConfigurationProps {
  projectId: string
  onSave: (config: { billingModel: BillingModel; configuration: BillingConfiguration }) => void
  initialData?: {
    billingModel?: BillingModel
    configuration?: BillingConfiguration
  }
}

export default function BillingConfigurationComponent({ 
  onSave, 
  initialData 
}: BillingConfigurationProps) {
  const [billingModel, setBillingModel] = useState<BillingModel>(
    initialData?.billingModel || {
      type: 'HOURLY',
      hourlyRate: 100,
      billingCycle: 'MONTHLY'
    }
  )

  const [configuration, setConfiguration] = useState<BillingConfiguration>(
    initialData?.configuration || {
      autoInvoice: true,
      billingCycle: 'MONTHLY',
      paymentTerms: 30,
      taxRate: 10,
      discountRate: 0,
      currency: 'USD'
    }
  )

  const [milestones, setMilestones] = useState<MilestonePayment[]>(
    billingModel.milestonePayments || []
  )

  const addMilestone = () => {
    setMilestones([...milestones, { milestoneId: '', amount: 0, percentage: 0 }])
  }

  const removeMilestone = (index: number) => {
    setMilestones(milestones.filter((_, i) => i !== index))
  }

  const updateMilestone = (index: number, field: keyof MilestonePayment, value: string | number) => {
    const updated = [...milestones]
    updated[index] = { ...updated[index], [field]: value }
    setMilestones(updated)
  }

  const handleSave = () => {
    const finalBillingModel = {
      ...billingModel,
      milestonePayments: billingModel.type === 'MILESTONE_BASED' ? milestones : undefined
    }
    
    onSave({
      billingModel: finalBillingModel,
      configuration
    })
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Billing Configuration</h1>
        <p className="text-muted-foreground">
          Configure billing models and payment settings for your project
        </p>
      </div>

      <Tabs defaultValue="billing-model" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="billing-model">Billing Model</TabsTrigger>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
        </TabsList>

        <TabsContent value="billing-model" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Billing Model
              </CardTitle>
              <CardDescription>
                Choose how you want to bill for this project
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Hourly Billing */}
                <Card 
                  className={`cursor-pointer transition-all ${
                    billingModel.type === 'HOURLY' 
                      ? 'ring-2 ring-primary' 
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setBillingModel({ ...billingModel, type: 'HOURLY' })}
                >
                  <CardContent className="p-4 text-center">
                    <Clock className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                    <h3 className="font-semibold">Hourly</h3>
                    <p className="text-sm text-muted-foreground">Bill based on time tracked</p>
                    {billingModel.type === 'HOURLY' && (
                      <Badge className="mt-2">Selected</Badge>
                    )}
                  </CardContent>
                </Card>

                {/* Fixed Fee */}
                <Card 
                  className={`cursor-pointer transition-all ${
                    billingModel.type === 'FIXED_FEE' 
                      ? 'ring-2 ring-primary' 
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setBillingModel({ ...billingModel, type: 'FIXED_FEE' })}
                >
                  <CardContent className="p-4 text-center">
                    <Target className="h-8 w-8 mx-auto mb-2 text-green-500" />
                    <h3 className="font-semibold">Fixed Fee</h3>
                    <p className="text-sm text-muted-foreground">One-time project fee</p>
                    {billingModel.type === 'FIXED_FEE' && (
                      <Badge className="mt-2">Selected</Badge>
                    )}
                  </CardContent>
                </Card>

                {/* Milestone Based */}
                <Card 
                  className={`cursor-pointer transition-all ${
                    billingModel.type === 'MILESTONE_BASED' 
                      ? 'ring-2 ring-primary' 
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setBillingModel({ ...billingModel, type: 'MILESTONE_BASED' })}
                >
                  <CardContent className="p-4 text-center">
                    <Target className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                    <h3 className="font-semibold">Milestone</h3>
                    <p className="text-sm text-muted-foreground">Pay per milestone</p>
                    {billingModel.type === 'MILESTONE_BASED' && (
                      <Badge className="mt-2">Selected</Badge>
                    )}
                  </CardContent>
                </Card>

                {/* Retainer */}
                <Card 
                  className={`cursor-pointer transition-all ${
                    billingModel.type === 'RETAINER' 
                      ? 'ring-2 ring-primary' 
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setBillingModel({ ...billingModel, type: 'RETAINER' })}
                >
                  <CardContent className="p-4 text-center">
                    <CreditCard className="h-8 w-8 mx-auto mb-2 text-orange-500" />
                    <h3 className="font-semibold">Retainer</h3>
                    <p className="text-sm text-muted-foreground">Prepaid service hours</p>
                    {billingModel.type === 'RETAINER' && (
                      <Badge className="mt-2">Selected</Badge>
                    )}
                  </CardContent>
                </Card>

                {/* Subscription */}
                <Card 
                  className={`cursor-pointer transition-all ${
                    billingModel.type === 'SUBSCRIPTION' 
                      ? 'ring-2 ring-primary' 
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setBillingModel({ ...billingModel, type: 'SUBSCRIPTION' })}
                >
                  <CardContent className="p-4 text-center">
                    <Calendar className="h-8 w-8 mx-auto mb-2 text-red-500" />
                    <h3 className="font-semibold">Subscription</h3>
                    <p className="text-sm text-muted-foreground">Recurring payments</p>
                    {billingModel.type === 'SUBSCRIPTION' && (
                      <Badge className="mt-2">Selected</Badge>
                    )}
                  </CardContent>
                </Card>

                {/* Mixed */}
                <Card 
                  className={`cursor-pointer transition-all ${
                    billingModel.type === 'MIXED' 
                      ? 'ring-2 ring-primary' 
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setBillingModel({ ...billingModel, type: 'MIXED' })}
                >
                  <CardContent className="p-4 text-center">
                    <Settings className="h-8 w-8 mx-auto mb-2 text-gray-500" />
                    <h3 className="font-semibold">Mixed</h3>
                    <p className="text-sm text-muted-foreground">Combine multiple models</p>
                    {billingModel.type === 'MIXED' && (
                      <Badge className="mt-2">Selected</Badge>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Separator />

              {/* Model-specific settings */}
              {billingModel.type === 'HOURLY' && (
                <div className="space-y-4">
                  <h4 className="font-semibold">Hourly Rate Settings</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
                      <Input
                        id="hourlyRate"
                        type="number"
                        value={billingModel.hourlyRate || 0}
                        onChange={(e) => setBillingModel({
                          ...billingModel,
                          hourlyRate: parseFloat(e.target.value) || 0
                        })}
                      />
                    </div>
                  </div>
                </div>
              )}

              {billingModel.type === 'FIXED_FEE' && (
                <div className="space-y-4">
                  <h4 className="font-semibold">Fixed Fee Settings</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fixedAmount">Project Amount ($)</Label>
                      <Input
                        id="fixedAmount"
                        type="number"
                        value={billingModel.fixedAmount || 0}
                        onChange={(e) => setBillingModel({
                          ...billingModel,
                          fixedAmount: parseFloat(e.target.value) || 0
                        })}
                      />
                    </div>
                  </div>
                </div>
              )}

              {billingModel.type === 'MILESTONE_BASED' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">Milestone Payments</h4>
                    <Button onClick={addMilestone} size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Milestone
                    </Button>
                  </div>
                  
                  {milestones.map((milestone, index) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label>Milestone ID</Label>
                            <Input
                              value={milestone.milestoneId}
                              onChange={(e) => updateMilestone(index, 'milestoneId', e.target.value)}
                              placeholder="Enter milestone ID"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Amount ($)</Label>
                            <Input
                              type="number"
                              value={milestone.amount}
                              onChange={(e) => updateMilestone(index, 'amount', parseFloat(e.target.value) || 0)}
                            />
                          </div>
                          <div className="space-y-2 flex items-end">
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => removeMilestone(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {billingModel.type === 'RETAINER' && (
                <div className="space-y-4">
                  <h4 className="font-semibold">Retainer Settings</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="retainerAmount">Retainer Amount ($)</Label>
                      <Input
                        id="retainerAmount"
                        type="number"
                        value={billingModel.retainerAmount || 0}
                        onChange={(e) => setBillingModel({
                          ...billingModel,
                          retainerAmount: parseFloat(e.target.value) || 0
                        })}
                      />
                    </div>
                  </div>
                </div>
              )}

              {billingModel.type === 'SUBSCRIPTION' && (
                <div className="space-y-4">
                  <h4 className="font-semibold">Subscription Settings</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="subscriptionAmount">Monthly Amount ($)</Label>
                      <Input
                        id="subscriptionAmount"
                        type="number"
                        value={billingModel.subscriptionAmount || 0}
                        onChange={(e) => setBillingModel({
                          ...billingModel,
                          subscriptionAmount: parseFloat(e.target.value) || 0
                        })}
                      />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="configuration" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Billing Configuration
              </CardTitle>
              <CardDescription>
                Set up payment terms and automatic billing settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="billingCycle">Billing Cycle</Label>
                    <Select
                      value={configuration.billingCycle}
                      onValueChange={(value: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'ONE_TIME') => setConfiguration({
                        ...configuration,
                        billingCycle: value
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="WEEKLY">Weekly</SelectItem>
                        <SelectItem value="MONTHLY">Monthly</SelectItem>
                        <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                        <SelectItem value="YEARLY">Yearly</SelectItem>
                        <SelectItem value="ONE_TIME">One Time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="paymentTerms">Payment Terms (Days)</Label>
                    <Input
                      id="paymentTerms"
                      type="number"
                      value={configuration.paymentTerms}
                      onChange={(e) => setConfiguration({
                        ...configuration,
                        paymentTerms: parseInt(e.target.value) || 30
                      })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Select
                      value={configuration.currency}
                      onValueChange={(value) => setConfiguration({
                        ...configuration,
                        currency: value
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD - US Dollar</SelectItem>
                        <SelectItem value="EUR">EUR - Euro</SelectItem>
                        <SelectItem value="GBP">GBP - British Pound</SelectItem>
                        <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="taxRate">Tax Rate (%)</Label>
                    <Input
                      id="taxRate"
                      type="number"
                      value={configuration.taxRate}
                      onChange={(e) => setConfiguration({
                        ...configuration,
                        taxRate: parseFloat(e.target.value) || 0
                      })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="discountRate">Discount Rate (%) - Optional</Label>
                    <Input
                      id="discountRate"
                      type="number"
                      value={configuration.discountRate || 0}
                      onChange={(e) => setConfiguration({
                        ...configuration,
                        discountRate: parseFloat(e.target.value) || 0
                      })}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="autoInvoice"
                      checked={configuration.autoInvoice}
                      onCheckedChange={(checked) => setConfiguration({
                        ...configuration,
                        autoInvoice: checked as boolean
                      })}
                    />
                    <Label htmlFor="autoInvoice">Enable automatic invoicing</Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end space-x-4">
        <Button variant="outline">Cancel</Button>
        <Button onClick={handleSave}>Save Configuration</Button>
      </div>
    </div>
  )
}