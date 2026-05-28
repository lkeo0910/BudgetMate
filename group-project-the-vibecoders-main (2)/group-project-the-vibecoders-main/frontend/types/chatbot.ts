export interface ChatRequest {
  message: string;
  section_id: string;
}

export interface MessageResponse {
  role: 'user' | 'ai';
  content: string;
  timestamp: string;
}

export interface ChatResponse {
  section_id: string;
  response: string;
}

export interface SectionSummary {
  section_id: string;
  name?: string;
  date: string;
}

export interface SectionDetail {
  section_id: string;
  user_id: string;
  name?: string;
  messages: MessageResponse[];
  created_at: string;
  updated_at: string;
}
