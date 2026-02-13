
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

export type ViewState = 'DASHBOARD' | 'PEOPLE' | 'MEMBERS' | 'PATHWAYS' | 'TASKS' | 'PROFILE' | 'SETTINGS' | 'SUPER_ADMIN' | 'FORMS' | 'INTEGRATIONS' | 'SERVE_TEAM' | 'ACADEMY';

// ========== Academy Types ==========

export interface AcademyTrack {
  id: string;
  tenantId: string;
  title: string;
  description?: string;
  imageUrl?: string;
  order: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  modules?: AcademyModule[];
  _count?: { modules: number; enrollments: number };
}

export interface AcademyModule {
  id: string;
  tenantId: string;
  trackId: string;
  title: string;
  description?: string;
  videoUrl: string;
  order: number;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  requiredModuleId?: string | null;
  createdAt: string;
  updatedAt: string;
  quiz?: AcademyQuiz | null;
  requiredModule?: { id: string; title: string } | null;
  track?: { id: string; title: string };
}

export interface AcademyQuiz {
  id: string;
  moduleId: string;
  passingScore: number;
  questions: AcademyQuestion[];
}

export interface AcademyQuestion {
  id: string;
  questionText: string;
  questionType: 'MULTIPLE_CHOICE' | 'TRUE_FALSE';
  options: Array<{ id: string; text: string }>;
  correctOptionId?: string;
  order: number;
}

export interface AcademyEnrollment {
  id: string;
  tenantId: string;
  userId: string;
  trackId: string;
  enrolledAt: string;
  completedAt?: string | null;
  track?: AcademyTrack;
}

export interface AcademyModuleProgress {
  id: string;
  tenantId: string;
  userId: string;
  moduleId: string;
  status: 'LOCKED' | 'STARTED' | 'COMPLETED';
  videoWatched: boolean;
  quizScore?: number | null;
  quizPassed: boolean;
  attempts: number;
  startedAt?: string | null;
  completedAt?: string | null;
  module?: AcademyModule;
}

export interface AcademyHuddleComment {
  id: string;
  tenantId: string;
  moduleId: string;
  userId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  user?: { id: string; firstName: string; lastName: string; avatar?: string };
}

export interface QuizSubmissionResult {
  score: number;
  passed: boolean;
  correctCount: number;
  totalQuestions: number;
  trackCompleted: boolean;
}

export interface AcademyPipelineStats {
  totalTracks: number;
  totalEnrolled: number;
  totalCompleted: number;
  readyForScheduling: number;
  trackBreakdown: Array<{
    trackId: string;
    trackTitle: string;
    enrolled: number;
    completed: number;
  }>;
}

// ========== Serve Team Types ==========

export type TeamMemberRole = 'LEADER' | 'MEMBER' | 'TRAINEE';
export type TeamApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface ServeTeam {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  teamImage?: string;
  requiredTrackId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  requiredTrack?: { id: string; title: string } | null;
  memberships?: TeamMembership[];
  _count?: { memberships: number; resources: number; events: number; applications?: number };
}

export interface TeamMembership {
  id: string;
  tenantId: string;
  teamId: string;
  userId: string;
  role: TeamMemberRole;
  joinedAt: string;
  user?: { id: string; firstName: string; lastName: string; avatar?: string; email?: string };
  team?: ServeTeam;
}

export interface TeamApplication {
  id: string;
  tenantId: string;
  teamId: string;
  userId: string;
  status: TeamApplicationStatus;
  message?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
  user?: { id: string; firstName: string; lastName: string; email?: string; avatar?: string };
  team?: { id: string; name: string };
}

export interface TeamResource {
  id: string;
  tenantId: string;
  teamId: string;
  title: string;
  description?: string;
  fileUrl: string;
  fileType: 'PDF' | 'VIDEO' | 'LINK' | 'DOC';
  uploadedById: string;
  createdAt: string;
  uploadedBy?: { id: string; firstName: string; lastName: string };
}

export interface TeamEvent {
  id: string;
  tenantId: string;
  teamId: string;
  title: string;
  description?: string;
  location?: string;
  startTime: string;
  endTime?: string;
  createdById: string;
  createdAt: string;
  createdBy?: { id: string; firstName: string; lastName: string };
  _count?: { attendance: number };
}

export interface TeamEventAttendance {
  id: string;
  eventId: string;
  userId: string;
  present: boolean;
  user?: { id: string; firstName: string; lastName: string; avatar?: string };
}
