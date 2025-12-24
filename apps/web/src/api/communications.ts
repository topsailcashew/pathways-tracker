import { apiClient } from './client';

export interface Message {
    id: string;
    channel: 'EMAIL' | 'SMS';
    direction: 'INBOUND' | 'OUTBOUND';
    content: string;
    subject?: string;
    status: 'QUEUED' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
    errorMessage?: string;
    sentAt: string;
    deliveredAt?: string;
    member: {
        firstName: string;
        lastName: string;
        email?: string;
        phone?: string;
    };
}

export interface SendEmailData {
    memberId: string;
    subject: string;
    content: string;
}

export interface SendSMSData {
    memberId: string;
    content: string;
}

export interface CommunicationStats {
    total: number;
    emailsSent: number;
    smsSent: number;
    failed: number;
    byChannel: any[];
    servicesEnabled: {
        sendgrid: boolean;
        twilio: boolean;
    };
}

/**
 * Send email to a member
 */
export const sendEmail = async (data: SendEmailData): Promise<Message> => {
    const response = await apiClient.post<{ data: Message }>('/api/communications/email', data);
    return response.data.data;
};

/**
 * Send SMS to a member
 */
export const sendSMS = async (data: SendSMSData): Promise<Message> => {
    const response = await apiClient.post<{ data: Message }>('/api/communications/sms', data);
    return response.data.data;
};

/**
 * Get message history
 */
export const getMessageHistory = async (
    memberId?: string,
    channel?: 'EMAIL' | 'SMS'
): Promise<Message[]> => {
    const params = new URLSearchParams();
    if (memberId) params.append('memberId', memberId);
    if (channel) params.append('channel', channel);

    const response = await apiClient.get<{ data: Message[] }>(
        `/api/communications/history${params.toString() ? `?${params.toString()}` : ''}`
    );
    return response.data.data;
};

/**
 * Get communication statistics
 */
export const getCommunicationStats = async (): Promise<CommunicationStats> => {
    const response = await apiClient.get<{ data: CommunicationStats }>(
        '/api/communications/stats'
    );
    return response.data.data;
};
