'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Clock, Mail, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ScheduleFollowUpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string;
  leadName: string;
  leadEmail: string;
}

export function ScheduleFollowUpDialog({
  open,
  onOpenChange,
  leadId,
  leadName,
  leadEmail,
}: ScheduleFollowUpDialogProps) {
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState('09:00');
  const [subject, setSubject] = useState(`Follow-up: ${leadName}`);
  const [message, setMessage] = useState(
    `Hi,\n\nI wanted to follow up regarding our previous conversation. Would you be available for a call on ${date ? format(date, 'PPP') : '[DATE]'} at ${time}?\n\nLooking forward to hearing from you.\n\nBest regards`
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sendEmail, setSendEmail] = useState(true);

  const handleSchedule = async () => {
    if (!date) {
      toast.error('Please select a date');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Here you would call your API to:
      // 1. Create a follow-up reminder in the database
      // 2. Send an email to the client (if sendEmail is true)
      
      const followUpData = {
        leadId,
        scheduledDate: date,
        scheduledTime: time,
        subject,
        message,
        sendEmail,
        recipientEmail: leadEmail,
        recipientName: leadName,
      };

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Follow-up scheduled:', followUpData);
      
      toast.success('Follow-up Scheduled!', {
        description: `Scheduled for ${format(date, 'PPP')} at ${time}${sendEmail ? '. Email sent to ' + leadEmail : ''}`,
      });
      
      onOpenChange(false);
      
      // Reset form
      setDate(undefined);
      setTime('09:00');
      setSubject(`Follow-up: ${leadName}`);
    } catch (error) {
      console.error('Error scheduling follow-up:', error);
      toast.error('Failed to schedule follow-up. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Schedule Follow-up</DialogTitle>
          <DialogDescription>
            Schedule a follow-up for {leadName} ({leadEmail})
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          {/* Date Selection */}
          <div className="grid gap-2">
            <Label htmlFor="date">Follow-up Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time Selection */}
          <div className="grid gap-2">
            <Label htmlFor="time">Time *</Label>
            <Select value={time} onValueChange={setTime}>
              <SelectTrigger>
                <Clock className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Select time" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 24 }, (_, i) => {
                  const hour = i.toString().padStart(2, '0');
                  return (
                    <SelectItem key={`${hour}:00`} value={`${hour}:00`}>
                      {hour}:00
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Send Email Checkbox */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="sendEmail"
              checked={sendEmail}
              onChange={(e) => setSendEmail(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="sendEmail" className="flex items-center gap-2 cursor-pointer">
              <Mail className="h-4 w-4" />
              Send email notification to client
            </Label>
          </div>

          {/* Email Subject (only show if sending email) */}
          {sendEmail && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="subject">Email Subject</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Follow-up email subject"
                />
              </div>

              {/* Email Message */}
              <div className="grid gap-2">
                <Label htmlFor="message">Email Message</Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Your follow-up message..."
                  rows={6}
                  className="resize-none"
                />
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSchedule} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Scheduling...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Schedule Follow-up
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
