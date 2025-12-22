/**
 * TypeScript types for Firestore data models
 */

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  VOLUNTEER = 'VOLUNTEER',
}

export interface User {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  name: string;
  phone?: string;
  role: UserRole;
  avatar?: string;
  gender?: string;
  address?: string;
  location?: string;
  postalCode?: string;
  dateOfBirth?: string;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
  refreshToken?: string;
}

export enum PathwayType {
  NEWCOMER = 'NEWCOMER',
  NEW_BELIEVER = 'NEW_BELIEVER',
}

export enum MemberStatus {
  ACTIVE = 'ACTIVE',
  INTEGRATED = 'INTEGRATED',
  INACTIVE = 'INACTIVE',
}

export interface Member {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  photoUrl?: string;
  pathway: PathwayType;
  currentStageId: string;
  lastStageChangeDate?: string;
  status: MemberStatus;
  joinedDate: string;
  assignedToId: string;

  // Extended fields
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  dateOfBirth?: string;
  gender?: string;
  maritalStatus?: string;
  isChurchMember: boolean;
  titheNumber?: string;
  nationality?: string;
  emergencyContact?: string;
  spouseName?: string;
  spouseDob?: string;

  // Family linking
  familyId?: string;
  familyRole?: string;

  // Arrays stored as subcollections or array fields
  tags: string[];

  createdAt: string;
  updatedAt: string;
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export interface Task {
  id: string;
  description: string;
  dueDate: string;
  completed: boolean;
  priority: TaskPriority;
  memberId: string;
  assignedToId: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface Note {
  id: string;
  content: string;
  memberId: string;
  createdAt: string;
}

export enum MessageChannel {
  SMS = 'SMS',
  EMAIL = 'EMAIL',
}

export enum MessageDirection {
  INBOUND = 'INBOUND',
  OUTBOUND = 'OUTBOUND',
}

export interface Message {
  id: string;
  channel: MessageChannel;
  direction: MessageDirection;
  content: string;
  sentBy: string;
  memberId: string;
  createdAt: string;
}

export enum ResourceType {
  PDF = 'PDF',
  VIDEO = 'VIDEO',
  LINK = 'LINK',
  DOC = 'DOC',
}

export interface Resource {
  id: string;
  title: string;
  url: string;
  type: ResourceType;
  memberId: string;
  createdAt: string;
}

export interface Tag {
  id: string;
  name: string;
  createdAt: string;
}

export interface ChurchSettings {
  id: string;
  name: string;
  email: string;
  phone: string;
  website?: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  denomination?: string;
  weeklyAttendance?: string;
  timezone: string;
  autoWelcome: boolean;
  memberTerm?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceTime {
  id: string;
  day: string;
  time: string;
  name: string;
  churchId: string;
}

export interface Stage {
  id: string;
  name: string;
  order: number;
  description?: string;
  pathway: PathwayType;
  autoAdvanceType?: string;
  autoAdvanceValue?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AutomationRule {
  id: string;
  stageId: string;
  taskDescription: string;
  daysDue: number;
  priority: TaskPriority;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export enum IntegrationStatus {
  ACTIVE = 'ACTIVE',
  ERROR = 'ERROR',
  PAUSED = 'PAUSED',
}

export interface IntegrationConfig {
  id: string;
  sourceName: string;
  sheetUrl: string;
  targetPathway: PathwayType;
  targetStageId: string;
  autoCreateTask: boolean;
  taskDescription?: string;
  autoWelcome: boolean;
  lastSync?: string;
  status: IntegrationStatus;
  createdAt: string;
  updatedAt: string;
}
