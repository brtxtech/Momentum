export interface Post {
    id: string;
    author: string;
    handle: string;
    image: number;
    avatar: number;
    caption: string;
    likes: number;
    liked: boolean;
    saved: boolean;
    comments: CommentItem[];
    createdAt: string;
    event: string;
}
export interface CommentItem {
    id: string;
    author: string;
    body: string;
    createdAt: string;
}
export interface Story {
    id: string;
    author: string;
    image: number;
    viewed: boolean;
}
export interface EventItem {
    id: string;
    title: string;
    date: string;
    location: string;
    description: string;
    cover: number;
    privacy: 'private' | 'public';
}
export interface Conversation {
    id: string;
    name: string;
    avatar: number;
    messages: Message[];
}
export interface Message {
    id: string;
    mine: boolean;
    body: string;
    createdAt: string;
}
export interface NotificationItem {
    id: string;
    message: string;
    createdAt: string;
    read: boolean;
}
export interface Preferences {
    theme: 'dark' | 'light' | 'system';
    accent: 'rose' | 'violet' | 'emerald' | 'gold';
    density: 'comfortable' | 'compact';
    motion: boolean;
    privateProfile: boolean;
}
