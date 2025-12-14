
import { ChurchSettings, Member, MemberStatus, PathwayType, Stage, Task, TaskPriority, User, AutomationRule } from './types';

export const CURRENT_USER: User = {
  id: 'u1',
  name: 'Sarah Shepard',
  firstName: 'Sarah',
  lastName: 'Shepard',
  email: 'sarah.shepard@church.org',
  phone: '(405) 555-0199',
  role: 'Admin',
  avatar: 'https://picsum.photos/id/64/200/200',
  gender: 'Female',
  address: '3605 Parker Rd.',
  location: 'Atlanta, USA',
  postalCode: '30301',
  dateOfBirth: '1995-02-01'
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
  serviceTimes: [
    { id: 'st1', day: 'Sunday', time: '09:00 AM', name: 'First Service' },
    { id: 'st2', day: 'Sunday', time: '11:00 AM', name: 'Second Service' },
    { id: 'st3', day: 'Wednesday', time: '07:00 PM', name: 'Youth Night' },
  ]
};

export const NEWCOMER_STAGES: Stage[] = [
  { id: 'nc1', name: 'Sunday Exp', order: 1 },
  { id: 'nc2', name: 'Tent', order: 2 },
  { id: 'nc3', name: 'Lunch', order: 3 },
  { id: 'nc4', name: 'Social', order: 4 },
  { id: 'nc5', name: 'Connect Grp', order: 5 },
  { id: 'nc6', name: 'Growth Track', order: 6 },
  { id: 'nc7', name: 'Serve', order: 7 },
];

export const NEW_BELIEVER_STAGES: Stage[] = [
  { id: 'nb1', name: 'Sunday Exp', order: 1 },
  { id: 'nb2', name: 'Salvation', order: 2 },
  { id: 'nb3', name: 'Next Steps', order: 3 },
  { id: 'nb4', name: 'Baptism', order: 4 },
  { id: 'nb5', name: 'Connect Grp', order: 5 },
  { id: 'nb6', name: 'Growth Track', order: 6 },
  { id: 'nb7', name: 'Serve', order: 7 },
];

export const DEFAULT_AUTOMATION_RULES: AutomationRule[] = [
  { id: 'ar1', stageId: 'nc3', taskDescription: 'Call to confirm Lunch attendance', daysDue: 2, priority: TaskPriority.MEDIUM, enabled: true },
  { id: 'ar2', stageId: 'nc5', taskDescription: 'Connect Group Introduction Email', daysDue: 3, priority: TaskPriority.HIGH, enabled: true },
  { id: 'ar3', stageId: 'nb3', taskDescription: 'Deliver "Next Steps" Bible Guide', daysDue: 1, priority: TaskPriority.HIGH, enabled: true },
  { id: 'ar4', stageId: 'nb4', taskDescription: 'Schedule Baptism Interview', daysDue: 5, priority: TaskPriority.HIGH, enabled: true },
];

// --- Data Generation Helpers ---

const FIRST_NAMES = [
  "Liam", "Noah", "Oliver", "Elijah", "James", "William", "Benjamin", "Lucas", "Henry", "Theodore",
  "Jack", "Levi", "Alexander", "Jackson", "Mateo", "Daniel", "Michael", "Mason", "Sebastian", "Ethan",
  "Logan", "Owen", "Samuel", "Jacob", "Asher", "Aiden", "John", "Joseph", "Wyatt", "David",
  "Olivia", "Emma", "Charlotte", "Amelia", "Sophia", "Isabella", "Ava", "Mia", "Evelyn", "Luna",
  "Harper", "Camila", "Sofia", "Scarlett", "Elizabeth", "Eleanor", "Emily", "Chloe", "Mila", "Violet",
  "Penelope", "Gianna", "Aria", "Abigail", "Ella", "Avery", "Hazel", "Nora", "Layla", "Lily",
  "Grace", "Zoey", "Riley", "Victoria", "Alice", "Willow", "Hannah", "Stella", "Addison", "Lucy"
];

const LAST_NAMES = [
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez",
  "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin",
  "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson",
  "Walker", "Young", "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores",
  "Green", "Adams", "Nelson", "Baker", "Hall", "Rivera", "Campbell", "Mitchell", "Carter", "Roberts",
  "Phillips", "Evans", "Turner", "Diaz", "Parker", "Cruz", "Edwards", "Collins", "Reyes", "Stewart"
];

const TAGS_POOL = [
  "Young Adult", "Parent", "Student", "Musician", "Tech", "Teacher", "Nurse", "Married", "Single", 
  "Youth", "Graphic Designer", "Introvert", "Extrovert", "Coffee Lover", "Prayer Team", "Greeter", 
  "Kids Ministry", "Small Group Leader", "Needs Ride", "Visitor"
];

const getRandomElement = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const getRandomSubset = <T>(arr: T[], count: number): T[] => {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};
const getRandomDate = (start: Date, end: Date) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString().split('T')[0];
};

const generateAdditionalMembers = (count: number, startId: number): Member[] => {
  const members: Member[] = [];
  
  for (let i = 0; i < count; i++) {
    const isNewcomer = Math.random() > 0.35; // 65% Newcomers, 35% New Believers
    const pathway = isNewcomer ? PathwayType.NEWCOMER : PathwayType.NEW_BELIEVER;
    const stages = isNewcomer ? NEWCOMER_STAGES : NEW_BELIEVER_STAGES;
    
    // Distribute stages somewhat evenly but weighted towards earlier stages
    const stageIndex = Math.floor(Math.random() * stages.length); 
    const currentStage = stages[stageIndex];

    const firstName = getRandomElement(FIRST_NAMES);
    const lastName = getRandomElement(LAST_NAMES);
    
    // Status logic
    let status = MemberStatus.ACTIVE;
    if (stageIndex === stages.length - 1) status = MemberStatus.INTEGRATED;
    if (Math.random() < 0.1) status = MemberStatus.INACTIVE;

    members.push({
      id: `m${startId + i}`,
      firstName,
      lastName,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
      phone: `555-01${(startId + i).toString().padStart(2, '0')}`,
      photoUrl: `https://picsum.photos/id/${(startId + i) * 2}/200/200`, // Pseudo-random consistent ID
      pathway,
      currentStageId: currentStage.id,
      status,
      joinedDate: getRandomDate(new Date('2023-01-01'), new Date('2023-11-01')),
      assignedToId: Math.random() > 0.3 ? 'u1' : '', // Most assigned to current user
      tags: getRandomSubset(TAGS_POOL, Math.floor(Math.random() * 3) + 1),
      notes: [
        `System: Added to ${pathway} pathway.`,
        `Entered stage: ${currentStage.name}`
      ],
      messageLog: [],
      resources: []
    });
  }
  return members;
};

// Original mock members preserved for task consistency
const INITIAL_MOCK_MEMBERS: Member[] = [
  {
    id: 'm1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '555-0101',
    photoUrl: 'https://picsum.photos/id/1005/200/200',
    pathway: PathwayType.NEWCOMER,
    currentStageId: 'nc2',
    status: MemberStatus.ACTIVE,
    joinedDate: '2023-10-15',
    assignedToId: 'u1',
    tags: ['Young Adult', 'Musician'],
    notes: ['Visited 10/15, seemed interested in guitar.', 'Attended Lunch on 10/22.'],
    messageLog: [],
    resources: []
  },
  {
    id: 'm2',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@example.com',
    phone: '555-0102',
    photoUrl: 'https://picsum.photos/id/1011/200/200',
    pathway: PathwayType.NEW_BELIEVER,
    currentStageId: 'nb3',
    status: MemberStatus.ACTIVE,
    joinedDate: '2023-10-20',
    assignedToId: 'u1',
    tags: ['Parent', 'Baptism Candidate'],
    notes: ['Raised hand for salvation 10/20.', 'Scheduled for Next Steps class next Tuesday.'],
    messageLog: [],
    resources: [
        { id: 'r1', title: 'Gospel of John Guide', url: 'https://example.com/john', type: 'PDF', dateAdded: '2023-10-21'}
    ]
  },
  {
    id: 'm3',
    firstName: 'Robert',
    lastName: 'Brown',
    email: 'bob.brown@test.com',
    phone: '555-0103',
    photoUrl: 'https://picsum.photos/id/1025/200/200',
    pathway: PathwayType.NEWCOMER,
    currentStageId: 'nc5',
    status: MemberStatus.ACTIVE,
    joinedDate: '2023-09-01',
    assignedToId: 'u1',
    tags: ['Married'],
    notes: ['Joined North Connect Group.'],
    messageLog: [],
    resources: []
  },
  {
    id: 'm4',
    firstName: 'Emily',
    lastName: 'Davis',
    email: 'emily.d@test.com',
    phone: '555-0104',
    photoUrl: 'https://picsum.photos/id/1027/200/200',
    pathway: PathwayType.NEWCOMER,
    currentStageId: 'nc1',
    status: MemberStatus.ACTIVE,
    joinedDate: '2023-10-27',
    assignedToId: 'u1',
    tags: ['Student'],
    notes: ['First time guest card filled out.'],
    messageLog: [],
    resources: []
  }
];

// Combine initial with 56 generated members to reach ~60
export const MOCK_MEMBERS: Member[] = [
  ...INITIAL_MOCK_MEMBERS,
  ...generateAdditionalMembers(56, 5)
];

export const MOCK_TASKS: Task[] = [
  {
    id: 't1',
    memberId: 'm1',
    description: 'Invite to Newcomers Lunch',
    dueDate: '2023-10-20',
    completed: true,
    priority: TaskPriority.MEDIUM,
    assignedToId: 'u1'
  },
  {
    id: 't2',
    memberId: 'm2',
    description: 'Confirm Next Steps attendance',
    dueDate: '2023-10-28',
    completed: false,
    priority: TaskPriority.HIGH,
    assignedToId: 'u1'
  },
  {
    id: 't3',
    memberId: 'm4',
    description: 'Send Welcome SMS',
    dueDate: '2023-10-29',
    completed: false,
    priority: TaskPriority.HIGH,
    assignedToId: 'u1'
  },
  // Add a few more tasks for the generated users
  {
    id: 't4',
    memberId: 'm5',
    description: 'Follow up on prayer request',
    dueDate: '2023-11-05',
    completed: false,
    priority: TaskPriority.MEDIUM,
    assignedToId: 'u1'
  },
  {
    id: 't5',
    memberId: 'm12',
    description: 'Schedule Baptism interview',
    dueDate: '2023-11-10',
    completed: false,
    priority: TaskPriority.HIGH,
    assignedToId: 'u1'
  }
];
