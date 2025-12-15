
export enum PathwayType {
  NEWCOMER = 'Newcomer',
  NEW_BELIEVER = 'New Believer'
}

export enum MemberStatus {
  ACTIVE = 'Active',
  INTEGRATED = 'Integrated',
  INACTIVE = 'Inactive'
}

export enum TaskPriority {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High'
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'Admin' | 'Volunteer';
  avatar: string;
  // Extended Profile Fields
  firstName: string;
  lastName: string;
  gender: 'Male' | 'Female';
  address: string;
  location: string;
  postalCode: string;
  dateOfBirth: string;
}

export interface Stage {
  id: string;
  name: string;
  order: number;
  description?: string;
}

export interface ServiceTime {
  id: string;
  day: string;
  time: string;
  name: string;
}

export interface ChurchSettings {
  name: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  denomination: string;
  weeklyAttendance: string;
  timezone: string;
  autoWelcome: boolean;
  serviceTimes: ServiceTime[];
}

export interface MessageLog {
  id: string;
  channel: 'SMS' | 'EMAIL';
  direction: 'INBOUND' | 'OUTBOUND';
  timestamp: string;
  content: string;
  sentBy: string;
}

export interface Resource {
  id: string;
  title: string;
  url: string;
  type: 'PDF' | 'VIDEO' | 'LINK' | 'DOC';
  dateAdded: string;
}

export interface Member {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  photoUrl: string;
  pathway: PathwayType;
  currentStageId: string;
  status: MemberStatus;
  joinedDate: string;
  assignedToId: string;
  tags: string[];
  notes: string[];
  messageLog: MessageLog[];
  resources: Resource[];
}

export interface Task {
  id: string;
  memberId: string;
  description: string;
  dueDate: string;
  completed: boolean;
  priority: TaskPriority;
  assignedToId: string;
}

export interface AutomationRule {
  id: string;
  stageId: string;
  taskDescription: string;
  daysDue: number;
  priority: TaskPriority;
  enabled: boolean;
}

export interface IntegrationConfig {
  id: string;
  sourceName: string; // e.g. "Newcomers Lunch Signup"
  sheetUrl: string;
  targetPathway: PathwayType;
  targetStageId: string;
  autoCreateTask: boolean;
  taskDescription: string;
  autoWelcome: boolean;
  lastSync: string | null;
  status: 'ACTIVE' | 'ERROR' | 'PAUSED';
}

export type ViewState = 'DASHBOARD' | 'PEOPLE' | 'PATHWAYS' | 'TASKS' | 'PROFILE' | 'SETTINGS';
