
import { ChurchSettings, Stage, TaskPriority, User, AutomationRule } from './types';

export const CURRENT_USER: User = {
  id: 'u1',
  name: 'Sarah Shepard',
  firstName: 'Sarah',
  lastName: 'Shepard',
  email: 'sarah.shepard@church.org',
  phone: '(405) 555-0199',
  role: 'SuperAdmin', // Updated for Demo
  avatar: 'https://picsum.photos/id/64/200/200',
  gender: 'Female',
  address: '3605 Parker Rd.',
  location: 'Atlanta, USA',
  postalCode: '30301',
  dateOfBirth: '1995-02-01',
  onboardingComplete: true
};

export const DEFAULT_CHURCH_SETTINGS: ChurchSettings = {
  name: 'Grace Community Church',
  email: 'info@gracecc.org',
  phone: '(404) 555-0199',
  website: 'https://gracecommunity.org',
  address: '100 Grace Blvd',
  city: 'Atlanta',
  state: 'GA',
  zip: '30303',
  country: 'USA',
  denomination: 'Non-Denominational',
  weeklyAttendance: '500-1000',
  timezone: 'America/New_York',
  autoWelcome: true,
  memberTerm: 'Church Member',
  serviceTimes: [
    { id: 'st1', day: 'Sunday', time: '09:00 AM', name: 'First Service' },
    { id: 'st2', day: 'Sunday', time: '11:00 AM', name: 'Second Service' },
    { id: 'st3', day: 'Wednesday', time: '07:00 PM', name: 'Youth Night' },
  ]
};

// ... existing stages and rules ...
export const NEWCOMER_STAGES: Stage[] = [
  { id: 'nc1', name: 'Sunday Exp', order: 1, description: 'First time visit or contact card filled out.' },
  { id: 'nc2', name: 'Tent', order: 2, description: 'Visited the welcome tent or info desk.' },
  { id: 'nc3', name: 'Lunch', order: 3, description: 'Attended Newcomers Lunch to meet pastors.', autoAdvanceRule: { type: 'TASK_COMPLETED', value: 'Lunch' } },
  { id: 'nc4', name: 'Social', order: 4, description: 'Attended a church social event.' },
  { id: 'nc5', name: 'Connect Grp', order: 5, description: 'Joined a small group or bible study.' },
  { id: 'nc6', name: 'Growth Track', order: 6, description: 'Completed membership class.' },
  { id: 'nc7', name: 'Serve', order: 7, description: 'Joined a serving team.' },
];

export const NEW_BELIEVER_STAGES: Stage[] = [
  { id: 'nb1', name: 'Sunday Exp', order: 1, description: 'Attended service and heard the Gospel.' },
  { id: 'nb2', name: 'Salvation', order: 2, description: 'Made a decision for Christ.' },
  { id: 'nb3', name: 'Next Steps', order: 3, description: 'Received Bible and starter guide.' },
  { id: 'nb4', name: 'Baptism', order: 4, description: 'Scheduled or completed water baptism.' },
  { id: 'nb5', name: 'Connect Grp', order: 5, description: 'Plugged into community for discipleship.' },
  { id: 'nb6', name: 'Growth Track', order: 6, description: 'Learning spiritual gifts and purpose.' },
  { id: 'nb7', name: 'Serve', order: 7, description: 'Actively serving in ministry.' },
];

export const DEFAULT_AUTOMATION_RULES: AutomationRule[] = [
  { id: 'ar1', stageId: 'nc3', taskDescription: 'Call to confirm Lunch attendance', daysDue: 2, priority: TaskPriority.MEDIUM, enabled: true },
  { id: 'ar2', stageId: 'nc5', taskDescription: 'Connect Group Introduction Email', daysDue: 3, priority: TaskPriority.HIGH, enabled: true },
  { id: 'ar3', stageId: 'nb3', taskDescription: 'Deliver "Next Steps" Bible Guide', daysDue: 1, priority: TaskPriority.HIGH, enabled: true },
  { id: 'ar4', stageId: 'nb4', taskDescription: 'Schedule Baptism Interview', daysDue: 5, priority: TaskPriority.HIGH, enabled: true },
];
