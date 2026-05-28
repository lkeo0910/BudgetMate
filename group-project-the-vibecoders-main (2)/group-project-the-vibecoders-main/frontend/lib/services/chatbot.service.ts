import api from '../api/axios';
import { 
  ChatRequest, 
  ChatResponse, 
  SectionSummary, 
  SectionDetail 
} from '@/types/chatbot';

const chatbotService = {
  async createSection(): Promise<SectionSummary> {
    const response = await api.post<SectionSummary>('/chatbot/sections');
    return response.data;
  },

  async getSections(): Promise<SectionSummary[]> {
    const response = await api.get<SectionSummary[]>('/chatbot/sections');
    return response.data;
  },

  async getSectionDetail(sectionId: string): Promise<SectionDetail> {
    const response = await api.get<SectionDetail>(`/chatbot/sections/${sectionId}`);
    return response.data;
  },

  async sendChatMessage(data: ChatRequest): Promise<ChatResponse> {
    const response = await api.post<ChatResponse>('/chatbot/chat', data);
    return response.data;
  },

  async deleteSection(sectionId: string): Promise<void> {
    await api.delete(`/chatbot/sections/${sectionId}`);
  },

  async updateSectionName(sectionId: string, name: string): Promise<SectionSummary> {
    const response = await api.put<SectionSummary>(`/chatbot/sections/${sectionId}`, { name });
    return response.data;
  }
};

export default chatbotService;
