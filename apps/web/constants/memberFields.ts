import { MemberMapField, FormField } from '../types';

export interface MemberFieldDef {
  key: MemberMapField;
  label: string;
  type: FormField['type'];
  required?: boolean;
  locked?: boolean;
  category: string;
  options?: string[];
}

export const MEMBER_FIELDS: MemberFieldDef[] = [
  // Personal (firstName/lastName always included)
  { key: 'firstName', label: 'First Name', type: 'text', required: true, locked: true, category: 'Personal' },
  { key: 'lastName', label: 'Last Name', type: 'text', required: true, locked: true, category: 'Personal' },
  { key: 'email', label: 'Email', type: 'email', category: 'Personal' },
  { key: 'phone', label: 'Phone', type: 'phone', category: 'Personal' },
  { key: 'dateOfBirth', label: 'Date of Birth', type: 'date', category: 'Personal' },
  { key: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female', 'Other'], category: 'Personal' },
  // Address
  { key: 'address', label: 'Address', type: 'text', category: 'Address' },
  { key: 'city', label: 'City', type: 'text', category: 'Address' },
  { key: 'state', label: 'State/Province', type: 'text', category: 'Address' },
  { key: 'zip', label: 'Postal Code', type: 'text', category: 'Address' },
  { key: 'nationality', label: 'Nationality', type: 'text', category: 'Address' },
  // Marital & Family
  { key: 'maritalStatus', label: 'Marital Status', type: 'select', options: ['Single', 'Married', 'Divorced', 'Widowed', 'Other'], category: 'Family' },
  { key: 'spouseName', label: 'Spouse Name', type: 'text', category: 'Family' },
  { key: 'spouseDob', label: 'Spouse Date of Birth', type: 'date', category: 'Family' },
  { key: 'emergencyContact', label: 'Emergency Contact', type: 'text', category: 'Family' },
  // Church
  { key: 'isChurchMember', label: 'Church Member', type: 'checkbox', category: 'Church' },
  { key: 'titheNumber', label: 'Tithe Number', type: 'text', category: 'Church' },
];

export const MEMBER_FIELD_CATEGORIES = ['Personal', 'Address', 'Family', 'Church'];
