export interface Macro {
  id: string;
  summary: string;
  response: string;
  dateAdded: string;
  userId?: string;
  isFavorite?: boolean;
}

export type Sentiment = 'Angry' | 'Neutral' | 'Happy' | 'Confused' | 'Urgent';

export interface DraftResult {
  sentiment: Sentiment;
  summary: string;
  responses: string[];
  driverResponses?: string[];
}

export interface CaptainRequestResult {
  ticketLink: string;
  summary: string;
  validation: string;
  needsFromCaptain: string;
}

export interface GrammarChange {
  original: string;
  corrected: string;
  explanation: string;
}

export interface GrammarCheckResult {
  correctedText: string;
  changes: GrammarChange[];
}

export interface LinkItem {
  id: string;
  url: string;
  description: string;
  dateAdded: string;
  userId?: string;
  isFavorite?: boolean;
}

export interface TemplateField {
  id: string;
  label: string;
  type: 'text' | 'dropdown';
  options?: string[];
}

export interface Template {
  id: string;
  name: string;
  fields: TemplateField[];
  dateAdded: number;
  userId?: string;
  isFavorite?: boolean;
}

export type Severity = 'Low' | 'Medium' | 'High' | 'Critical';

export interface UpdateItem {
  id: string;
  title: string;
  content: string;
  dateAdded: string;
  severity?: Severity;
  link?: string;
  imageUrl?: string;
  userId?: string;
}

