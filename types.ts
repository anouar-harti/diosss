export interface Coordinates {
  lat: number;
  lng: number;
}

export interface JobData {
  id: string;
  startTime: Date | null;
  endTime: Date | null;
  description: string;
  materials: string;
  price: string;
  location: Coordinates | null;
  manualAddress: string;
  locationAddress?: string;
  clientSignature: string | null;
  clientName: string;
  workerName: string;
  workerSignature: string | null;
}

export enum AppStep {
  IDLE = 'IDLE',
  WORKING = 'WORKING',
  DETAILS = 'DETAILS',
  PHOTOS = 'PHOTOS',
  SIGNATURE = 'SIGNATURE',
  REVIEW = 'REVIEW',
}

export enum ChecklistStep {
  INSTALLER = 'INSTALLER',
  FORM = 'FORM',
  SIGNATURE = 'SIGNATURE',
  REVIEW = 'REVIEW',
}

// New Types for Auth and Tasks
export type UserRole = 'ADMIN' | 'WORKER';

export interface User {
  username: string;
  password?: string; // Only used for auth check, not stored in clear text in real apps (simulated here)
  role: UserRole;
  fullName: string;
}

export interface Task {
  id: string;
  title: string;
  location: string;
  description: string;
  assignedTo: string; // username
  createdBy: string;
  isCompleted: boolean;
  createdAt: number;
}

export enum AppView {
  LOGIN = 'LOGIN',
  DASHBOARD = 'DASHBOARD',
  JOB_REPORT = 'JOB_REPORT', // The original app flow
  CHECKLIST_REPORT = 'CHECKLIST_REPORT', // New checklist flow
  TASK_LIST = 'TASK_LIST',   // For workers to see tasks
  ADMIN_USERS = 'ADMIN_USERS', // For admin to create users
  ADMIN_TASKS = 'ADMIN_TASKS', // For admin to assign tasks
}