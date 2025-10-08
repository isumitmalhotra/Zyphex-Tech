import { 
  Meeting, 
  MeetingAttendee, 
  MeetingActionItem,
  MeetingType,
  MeetingStatus,
  AttendeeStatus,
  RecurrenceFrequency,
  Priority,
  User,
  Client,
  Project
} from '@prisma/client';

// Extended meeting type with relations
export interface MeetingWithRelations extends Meeting {
  organizer: User;
  attendees: (MeetingAttendee & {
    user?: User | null;
    client?: Client | null;
  })[];
  actionItems?: MeetingActionItem[];
  project?: Project | null;
  client?: Client | null;
}

// Meeting form data
export interface MeetingFormData {
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  type: MeetingType;
  location?: string;
  timezone: string;
  projectId?: string;
  clientId?: string;
  isRecurring: boolean;
  recurrenceFreq?: RecurrenceFrequency;
  recurrenceEnd?: Date;
  agenda?: AgendaItem[];
  attendees: AttendeeInput[];
}

// Agenda item
export interface AgendaItem {
  id: string;
  title: string;
  duration?: number;
  presenter?: string;
  notes?: string;
}

// Attendee input
export interface AttendeeInput {
  userId?: string;
  clientId?: string;
  email?: string;
  name?: string;
  isRequired: boolean;
}

// Calendar event for display
export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: MeetingType;
  status: MeetingStatus;
  color: string;
  meeting: MeetingWithRelations;
}

// Meeting filter options
export interface MeetingFilters {
  status?: MeetingStatus[];
  type?: MeetingType[];
  projectId?: string;
  clientId?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  search?: string;
}

// Meeting statistics
export interface MeetingStats {
  total: number;
  upcoming: number;
  today: number;
  thisWeek: number;
  completed: number;
  cancelled: number;
  averageDuration: number;
  totalHours: number;
}

// Calendar view modes
export type CalendarView = 'month' | 'week' | 'day' | 'list';

// Time slot for scheduling
export interface TimeSlot {
  start: Date;
  end: Date;
  available: boolean;
  meetings?: MeetingWithRelations[];
}

// Meeting conflict
export interface MeetingConflict {
  meeting: MeetingWithRelations;
  conflictType: 'overlap' | 'double_booked' | 'back_to_back';
  severity: 'high' | 'medium' | 'low';
}

// Notification types
export type MeetingNotificationType = 
  | 'invitation'
  | 'reminder'
  | 'cancellation'
  | 'reschedule'
  | 'update'
  | 'summary';

// Email template data
export interface MeetingEmailData {
  meeting: MeetingWithRelations;
  recipient: {
    email: string;
    name: string;
  };
  type: MeetingNotificationType;
  customMessage?: string;
}

// Action item form data
export interface ActionItemFormData {
  title: string;
  description?: string;
  assigneeId?: string;
  dueDate?: Date;
  priority: Priority;
}

// Meeting notes data
export interface MeetingNotesData {
  meetingId: string;
  notes: string;
  attendanceRecords: {
    attendeeId: string;
    attended: boolean;
    joinedAt?: Date;
    leftAt?: Date;
  }[];
  actionItems: ActionItemFormData[];
  attachments?: string[];
  recordingUrl?: string;
}

// Recurrence rule (simplified)
export interface RecurrenceRule {
  frequency: RecurrenceFrequency;
  interval: number;
  endDate?: Date;
  count?: number;
  daysOfWeek?: number[]; // 0-6 (Sunday-Saturday)
  dayOfMonth?: number;
}

// Export types from Prisma
export type {
  Meeting,
  MeetingAttendee,
  MeetingActionItem,
  MeetingType,
  MeetingStatus,
  AttendeeStatus,
  RecurrenceFrequency,
  Priority,
};
