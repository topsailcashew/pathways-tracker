
import { ChurchSettings, Member, MemberStatus, PathwayType, Stage, Task, TaskPriority, User, AutomationRule, Tenant, SystemLog } from './types';

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

// --- Mock Data for Multi-Tenancy ---

export const MOCK_TENANTS: Tenant[] = [
  { id: 't1', name: 'Grace Community', domain: 'gracecc', adminEmail: 'admin@gracecc.org', plan: 'Pro', status: 'Active', memberCount: 1420, createdAt: '2023-01-15', lastLogin: '2023-11-01T09:00:00Z' },
  { id: 't2', name: 'Lighthouse Chapel', domain: 'lighthouse', adminEmail: 'pastor@lighthouse.com', plan: 'Free', status: 'Active', memberCount: 85, createdAt: '2023-03-10', lastLogin: '2023-10-28T14:30:00Z' },
  { id: 't3', name: 'The Rock Church', domain: 'therock', adminEmail: 'info@therock.org', plan: 'Enterprise', status: 'Active', memberCount: 5200, createdAt: '2022-11-05', lastLogin: '2023-11-02T08:15:00Z' },
  { id: 't4', name: 'City Hill', domain: 'cityhill', adminEmail: 'contact@cityhill.com', plan: 'Pro', status: 'Suspended', memberCount: 300, createdAt: '2023-05-20', lastLogin: '2023-09-15T11:00:00Z' },
  { id: 't5', name: 'Valley Life', domain: 'valleylife', adminEmail: 'admin@valleylife.com', plan: 'Pro', status: 'Active', memberCount: 890, createdAt: '2023-02-01', lastLogin: '2023-11-02T10:00:00Z' },
];

export const MOCK_SYSTEM_LOGS: SystemLog[] = [];

// Generate fake logs
const LOG_LEVELS = ['INFO', 'INFO', 'INFO', 'WARN', 'ERROR'] as const;
const MODULES = ['AUTH', 'API', 'DB', 'EMAIL', 'BILLING'];
const MESSAGES = [
    'User logged in successfully',
    'Database backup completed',
    'API rate limit approaching',
    'Email delivery failed for user',
    'New tenant registered',
    'Payment processed',
    'Failed login attempt',
    'Report generated',
    'Connection timeout',
    'Cache invalidated'
];

for (let i = 0; i < 50; i++) {
    const level = LOG_LEVELS[Math.floor(Math.random() * LOG_LEVELS.length)];
    const date = new Date();
    date.setMinutes(date.getMinutes() - i * 15); // Spread over time
    
    MOCK_SYSTEM_LOGS.push({
        id: `log-${i}`,
        timestamp: date.toISOString(),
        level: level,
        module: MODULES[Math.floor(Math.random() * MODULES.length)],
        message: MESSAGES[Math.floor(Math.random() * MESSAGES.length)],
        user: Math.random() > 0.5 ? 'system' : `user-${Math.floor(Math.random()*100)}`,
        ip: `192.168.1.${Math.floor(Math.random() * 255)}`,
        latency: Math.floor(Math.random() * 200) + 20
    });
}


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

const STREETS = ["Maple Ave", "Oak St", "Washington Blvd", "Park Ln", "Main St", "Cedar Dr", "Elm St", "Lakeview Dr", "Sunset Blvd"];
const CITIES = ["Atlanta", "Marietta", "Decatur", "Alpharetta", "Roswell", "Smyrna"];

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
    
    const stageIndex = Math.floor(Math.random() * stages.length); 
    const currentStage = stages[stageIndex];

    const firstName = getRandomElement(FIRST_NAMES);
    const lastName = getRandomElement(LAST_NAMES);
    
    let status = MemberStatus.ACTIVE;
    if (stageIndex === stages.length - 1) status = MemberStatus.INTEGRATED;
    if (Math.random() < 0.1) status = MemberStatus.INACTIVE;

    const gender = Math.random() > 0.5 ? 'Male' : 'Female';
    const maritalStatus = Math.random() > 0.6 ? 'Married' : 'Single';
    const birthYear = 1970 + Math.floor(Math.random() * 35);
    const birthMonth = Math.floor(Math.random() * 12) + 1;
    const birthDay = Math.floor(Math.random() * 28) + 1;
    
    const joined = getRandomDate(new Date('2023-01-01'), new Date('2023-11-01'));

    members.push({
      id: `m${startId + i}`,
      firstName,
      lastName,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
      phone: `555-01${(startId + i).toString().padStart(2, '0')}`,
      photoUrl: `https://picsum.photos/id/${(startId + i) * 2}/200/200`,
      pathway,
      currentStageId: currentStage.id,
      lastStageChangeDate: joined,
      status,
      joinedDate: joined,
      assignedToId: Math.random() > 0.3 ? 'u1' : '',
      tags: getRandomSubset(TAGS_POOL, Math.floor(Math.random() * 3) + 1),
      notes: [
        `System: Added to ${pathway} pathway.`,
        `Entered stage: ${currentStage.name}`
      ],
      messageLog: [],
      resources: [],
      address: `${Math.floor(Math.random() * 900) + 100} ${getRandomElement(STREETS)}`,
      city: getRandomElement(CITIES),
      state: 'GA',
      zip: '30000',
      dateOfBirth: `${birthYear}-${birthMonth.toString().padStart(2,'0')}-${birthDay.toString().padStart(2,'0')}`,
      gender,
      maritalStatus,
      isChurchMember: status === MemberStatus.INTEGRATED,
      nationality: 'USA',
      titheNumber: status === MemberStatus.INTEGRATED ? `T-${startId + i}` : undefined
    });
  }
  return members;
};

// Mock Family ID
const MOCK_FAMILY_ID = 'fam-123';

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
    lastStageChangeDate: '2023-10-15',
    status: MemberStatus.ACTIVE,
    joinedDate: '2023-10-15',
    assignedToId: 'u1',
    tags: ['Young Adult', 'Musician'],
    notes: ['Visited 10/15, seemed interested in guitar.', 'Attended Lunch on 10/22.'],
    messageLog: [],
    resources: [],
    address: '123 Maple Ave',
    city: 'Atlanta',
    state: 'GA',
    zip: '30303',
    gender: 'Male',
    maritalStatus: 'Single',
    dateOfBirth: '1998-05-15',
    isChurchMember: false,
    nationality: 'USA',
    emergencyContact: 'Mother: 555-9999'
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
    lastStageChangeDate: '2023-10-20',
    status: MemberStatus.ACTIVE,
    joinedDate: '2023-10-20',
    assignedToId: 'u1',
    tags: ['Parent', 'Baptism Candidate'],
    notes: ['Raised hand for salvation 10/20.', 'Scheduled for Next Steps class next Tuesday.'],
    messageLog: [],
    resources: [
        { id: 'r1', title: 'Gospel of John Guide', url: 'https://example.com/john', type: 'PDF', dateAdded: '2023-10-21'}
    ],
    address: '456 Oak St',
    city: 'Decatur',
    state: 'GA',
    zip: '30030',
    gender: 'Female',
    maritalStatus: 'Married',
    spouseName: 'Tom Smith',
    dateOfBirth: '1985-11-20',
    isChurchMember: false,
    familyId: MOCK_FAMILY_ID,
    familyRole: 'Spouse',
    nationality: 'USA'
  },
  {
    id: 'm99',
    firstName: 'Tom',
    lastName: 'Smith',
    email: 'tom.smith@example.com',
    phone: '555-0199',
    photoUrl: 'https://picsum.photos/id/1012/200/200',
    pathway: PathwayType.NEWCOMER,
    currentStageId: 'nc7',
    lastStageChangeDate: '2023-01-10',
    status: MemberStatus.INTEGRATED,
    joinedDate: '2023-01-10',
    assignedToId: '',
    tags: ['Parent', 'Usher'],
    notes: ['Faithful volunteer.'],
    messageLog: [],
    resources: [],
    address: '456 Oak St',
    city: 'Decatur',
    state: 'GA',
    zip: '30030',
    gender: 'Male',
    maritalStatus: 'Married',
    spouseName: 'Jane Smith',
    dateOfBirth: '1983-05-10',
    isChurchMember: true,
    familyId: MOCK_FAMILY_ID,
    familyRole: 'Head',
    nationality: 'USA',
    titheNumber: 'T-102'
  }
];

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
  }
];
