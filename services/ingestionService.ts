
import { Member, IntegrationConfig, Task, PathwayType, MemberStatus, TaskPriority } from '../types';

/**
 * Robust CSV Line Splitter
 * Handles quoted fields containing commas (e.g., "Doe, John").
 */
const splitCSVLine = (str: string): string[] => {
  const arr: string[] = [];
  let quote = false;
  let col = '';
  for (let i = 0; i < str.length; i++) {
    const c = str[i];
    if (c === '"') { 
      quote = !quote; 
      continue; 
    }
    if (c === ',' && !quote) { 
      arr.push(col); 
      col = ''; 
      continue; 
    }
    col += c;
  }
  arr.push(col);
  return arr;
};

/**
 * Parses raw CSV text into an array of objects.
 * Uses heuristics to identify common columns (Name, Email, Phone, Pathway).
 */
export const parseCSV = (text: string) => {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];

  // Parse Headers
  const headers = splitCSVLine(lines[0]).map(h => h.trim().toLowerCase().replace(/['"]+/g, ''));
  
  // Column Mapping Helpers
  const findCol = (terms: string[]) => headers.findIndex(h => terms.some(t => h.includes(t)));

  const idxFirst = findCol(['first name', 'firstname', 'given name', 'f_name']);
  const idxLast = findCol(['last name', 'lastname', 'surname', 'family name', 'l_name']);
  const idxFull = findCol(['name', 'full name', 'fullname', 'who']);
  const idxEmail = findCol(['email', 'e-mail', 'mail', 'address']);
  const idxPhone = findCol(['phone', 'mobile', 'cell', 'contact']);
  const idxPathway = findCol(['pathway', 'path', 'type', 'track']);
  
  // Parse Data Rows
  return lines.slice(1).map(line => {
      const values = splitCSVLine(line).map(v => v.trim());

      let firstName = '';
      let lastName = '';
      const email = idxEmail > -1 ? values[idxEmail] : '';
      const phone = idxPhone > -1 ? values[idxPhone] : '';
      const pathwayRaw = idxPathway > -1 ? values[idxPathway] : '';

      // Name Extraction Strategy
      if (idxFirst > -1 && values[idxFirst]) {
          firstName = values[idxFirst];
          if (idxLast > -1) lastName = values[idxLast];
      } else if (idxFull > -1 && values[idxFull]) {
          // Split full name if separate columns aren't found
          const parts = values[idxFull].split(' ');
          firstName = parts[0];
          lastName = parts.slice(1).join(' ');
      }

      // Fallback if we found data but no name (unlikely but possible)
      if (!firstName && email) {
          const nameFromEmail = email.split('@')[0];
          firstName = nameFromEmail;
      }

      // Skip empty rows
      if (!firstName && !email && !phone) return null;

      return {
          firstName: firstName || 'Unknown',
          lastName: lastName || '',
          email,
          phone,
          pathwayRaw,
          timestamp: new Date().toISOString()
      };
  }).filter(x => x !== null);
};

/**
 * Fetches data from a Google Sheet URL.
 * Supports standard /edit URLs by converting them to export URLs, 
 * but recommends Published CSV URLs for CORS compatibility.
 */
export const fetchSheetData = async (url: string) => {
  let fetchUrl = url;

  // Attempt to convert standard "Edit" URL to a CSV Export URL
  // Matches: docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit...
  const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (match && !url.includes('/pub') && !url.includes('output=csv')) {
      const id = match[1];
      fetchUrl = `https://docs.google.com/spreadsheets/d/${id}/export?format=csv`;
  }

  try {
    const response = await fetch(fetchUrl);
    
    if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}: Ensure the sheet is "Published to Web".`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
         throw new Error("Invalid content. The URL returned JSON, expected CSV.");
    }

    const text = await response.text();
    return parseCSV(text);

  } catch (error: any) {
    console.error("Sheet Fetch Error:", error);
    
    // Provide a user-friendly error message for the common CORS issue
    if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
        throw new Error("Access Denied (CORS). Please in Google Sheets go to: File > Share > Publish to web > Link > 'Comma-separated values (.csv)' and use that URL.");
    }
    
    throw error;
  }
};

export const processIngestion = (
  rawEntries: any[], 
  config: IntegrationConfig, 
  existingMembers: Member[]
): { newMembers: Member[], newTasks: Task[] } => {
  
  const newMembers: Member[] = [];
  const newTasks: Task[] = [];

  rawEntries.forEach(entry => {
    if (!entry) return;

    // 1. Deduplication Check (by Email)
    const isDuplicate = existingMembers.some(m => 
        (m.email && entry.email && m.email.toLowerCase() === entry.email.toLowerCase())
    );

    if (isDuplicate) return;

    // 2. Create Member
    const memberId = `imp-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newMember: Member = {
      id: memberId,
      firstName: entry.firstName,
      lastName: entry.lastName,
      email: entry.email,
      phone: entry.phone,
      photoUrl: `https://ui-avatars.com/api/?name=${entry.firstName}+${entry.lastName}&background=random`,
      pathway: config.targetPathway,
      currentStageId: config.targetStageId,
      status: MemberStatus.ACTIVE,
      joinedDate: new Date().toISOString().split('T')[0],
      assignedToId: '',
      tags: ['Sheet Import', config.sourceName],
      notes: [`[System] Imported from "${config.sourceName}" Google Sheet on ${new Date().toLocaleString()}`],
      messageLog: [],
      resources: []
    };

    // 3. Auto-Welcome Logic (Mock implementation of sending)
    if (config.autoWelcome && entry.email) {
        newMember.messageLog.push({
            id: `wel-${Date.now()}`,
            channel: 'EMAIL',
            direction: 'OUTBOUND',
            timestamp: new Date().toISOString(),
            content: `Hi ${entry.firstName}, thanks for signing up for ${config.sourceName}! We're excited to see you.`,
            sentBy: 'System (Auto-Welcome)'
        });
        newMember.notes.push(`[${new Date().toLocaleString()}] Auto-Welcome Email Sent`);
    }

    newMembers.push(newMember);

    // 4. Create Task
    if (config.autoCreateTask) {
        newTasks.push({
            id: `task-${Date.now()}-${Math.random()}`,
            memberId: memberId,
            description: config.taskDescription.replace('[Member Name]', `${entry.firstName} ${entry.lastName}`) || `Follow up with ${entry.firstName}`,
            dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Due tomorrow
            completed: false,
            priority: TaskPriority.HIGH,
            assignedToId: 'u1' // Default admin
        });
    }
  });

  return { newMembers, newTasks };
};
