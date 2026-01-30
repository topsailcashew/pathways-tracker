
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
  role: 'Admin' | 'Volunteer' | 'SuperAdmin';
  avatar: string;
  onboardingComplete: boolean;
  // Extended Profile Fields
  firstName: string;
  lastName: string;
  gender: 'Male' | 'Female';
  address: string;
  location: string;
  postalCode: string;
  dateOfBirth: string;
}

export interface AutoAdvanceRule {
  type: 'TASK_COMPLETED' | 'TIME_IN_STAGE';
  value: string | number; // Task description text to match OR days count
}

export interface Stage {
  id: string;
  name: string;
  order: number;
  description?: string;
  autoAdvanceRule?: AutoAdvanceRule;
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
  memberTerm?: string; // e.g. "Covenant Partner"
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
  lastStageChangeDate?: string; // ISO Date string tracking entry to current stage
  status: MemberStatus;
  joinedDate: string;
  assignedToId: string;
  tags: string[];
  notes: string[];
  messageLog: MessageLog[];
  resources: Resource[];
  
  // Extended Personal Details
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  dateOfBirth?: string;
  gender?: string; // 'Male' | 'Female' | 'Other'
  maritalStatus?: string; // 'Single' | 'Married' | 'Divorced' | 'Widowed'
  
  // Church Member Specifics
  isChurchMember: boolean;
  titheNumber?: string;
  nationality?: string;
  emergencyContact?: string;
  spouseName?: string;
  spouseDob?: string;
  
  // Family Linking
  familyId?: string; // Members with same familyId belong to same household
  familyRole?: 'Head' | 'Spouse' | 'Child' | 'Other';
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

// --- Super Admin Types ---

export interface Tenant {
  id: string;
  name: string;
  domain: string;
  adminEmail: string;
  plan: 'Free' | 'Pro' | 'Enterprise';
  status: 'Active' | 'Suspended' | 'Pending';
  memberCount: number;
  createdAt: string;
  lastLogin: string;
}

export interface SystemLog {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';
  module: string; // e.g., 'AUTH', 'API', 'DB', 'EMAIL'
  message: string;
  user?: string;
  ip?: string;
  latency?: number; // ms
}

// Forms
export type MemberMapField =
  | 'firstName' | 'lastName' | 'email' | 'phone'
  | 'dateOfBirth' | 'gender'
  | 'address' | 'city' | 'state' | 'zip' | 'nationality'
  | 'maritalStatus' | 'spouseName' | 'spouseDob' | 'emergencyContact'
  | 'isChurchMember' | 'titheNumber';

export interface FormField {
  id: string;
  label: string;
  type: 'text' | 'email' | 'phone' | 'number' | 'date' | 'select' | 'textarea' | 'checkbox';
  required: boolean;
  placeholder?: string;
  options?: string[];
  mapTo?: MemberMapField;
}

export interface Form {
  id: string;
  name: string;
  description?: string;
  fields: FormField[];
  slug: string;
  isActive: boolean;
  targetPathway?: 'NEWCOMER' | 'NEW_BELIEVER';
  targetStageId?: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  _count?: {
    submissions: number;
  };
}

export interface FormSubmission {
  id: string;
  formId: string;
  data: Record<string, any>;
  submittedAt: string;
}

export type ViewState = 'DASHBOARD' | 'PEOPLE' | 'MEMBERS' | 'PATHWAYS' | 'TASKS' | 'PROFILE' | 'SETTINGS' | 'SUPER_ADMIN' | 'FORMS' | 'INTEGRATIONS';
