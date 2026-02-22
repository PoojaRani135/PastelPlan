
export interface Task {
  id: string;
  title: string;
  completed: boolean;
  date?: string; // ISO string format YYYY-MM-DD
  time?: string; // HH:mm format
  link?: string;
  notes?: string;
  category: 'general' | 'scheduled';
  createdAt: number;
}

export interface Note {
  id: string;
  content: string;
  title: string;
  color: string;
  updatedAt: number;
}

export interface WaterLog {
  date: string; // YYYY-MM-DD
  count: number;
}
