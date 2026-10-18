/** UI contracts only. Fill these from authenticated API results, never mock private data. */
export interface UiPerson { id: string; username: string; displayName?: string; avatarUrl?: string; bio?: string; verified?: boolean; isPrivate?: boolean; following?: boolean; requested?: boolean; followers?: number; }
export interface UiConversation { id: string; title: string; avatarUrl?: string; subtitle?: string; latest?: string; updatedAt?: string; unread?: number; online?: boolean; muted?: boolean; group?: boolean; }
export interface UiMessage { id: string; conversationId: string; senderId: string; text?: string; attachmentUrl?: string; attachmentType?: 'image'|'video'|'file'; sentAt: string; read?: boolean; replyTo?: string; }
export interface UiNotification { id: string; kind: 'like'|'comment'|'follow'|'request'|'message'|'event'|'mention'|'security'|'other'; actor?: UiPerson; title: string; description?: string; timestamp: string; read: boolean; thumbnailUrl?: string; targetId?: string; actionable?: boolean; }
export interface UiEvent { id: string; title: string; description?: string; coverUrl?: string; startsAt: string; location?: string; privacy: 'public'|'private'; guests?: number; going?: boolean; owner?: UiPerson; status?: 'upcoming'|'past'|'draft'; }
export interface UiMedia { id: string; eventId?: string; url: string; thumbUrl?: string; type: 'image'|'video'; caption?: string; owner?: UiPerson; createdAt?: string; selected?: boolean; }
export interface UiInvitation { id: string; eventId: string; title: string; body: string; theme: string; updatedAt?: string; coverUrl?: string; }
export interface UiQrCode { id: string; title: string; target: string; imageUrl?: string; kind: 'profile'|'event'|'post'|'invite'; createdAt?: string; }
export interface UiProfile { id: string; username: string; displayName?: string; avatarUrl?: string; bio?: string; website?: string; private?: boolean; postCount: number; followerCount: number; followingCount: number; owner: boolean; verified?: boolean; highlights?: {id:string;title:string;coverUrl?:string}[]; }
export interface UiSavedPost { id: string; author: UiPerson; mediaUrl?: string; mediaType?: 'image'|'video'; caption?: string; savedAt?: string; collection?: string; }
export interface UiInsight { key: string; label: string; value: number; delta?: number; format?: 'number'|'percent'; }
export interface UiInsightPoint { label: string; value: number; }
export interface UiSettings { displayName: string; username: string; email: string; bio: string; isPrivate: boolean; theme: 'light'|'dark'|'system'; language: string; reducedMotion: boolean; activityEmails: boolean; messageEmails: boolean; pushEnabled: boolean; }
export interface UiHelpArticle { id: string; title: string; category: string; body: string; }
export const UI_AVATAR_FALLBACK = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"%3E%3Crect width="80" height="80" rx="40" fill="%23eef0f3"/%3E%3Ccircle cx="40" cy="30" r="14" fill="%23979fac"/%3E%3Cpath d="M12 80c0-38 56-38 56 0" fill="%23979fac"/%3E%3C/svg%3E';
