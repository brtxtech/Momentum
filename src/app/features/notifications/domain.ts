/** Notification domain rules. Pure and testable; not a substitute for server-side authorization. */
export type NotificationStatus = 'unread' | 'read' | 'dismissed';
export interface NotificationRecord {
  id: string;
  ownerId: string;
  body: string;
  status: NotificationStatus;
  createdAt: string;
  updatedAt: string;
  revision: number;
}
export interface NotificationPage { items: NotificationRecord[]; nextCursor: string | null; }
export interface NotificationValidation { valid: boolean; errors: string[]; }
export const NOTIFICATION_TEXT_LIMIT = 500;
export const NOTIFICATION_STATES: readonly NotificationStatus[] = ["unread", "read", "dismissed"];
export const NOTIFICATION_MIME_TYPES: readonly string[] = [];
export function normalizeNotificationText(input: string): string {
  return input.normalize('NFC').replace(/\r\n?/g, '\n').trim();
}
export function validateNotificationText(input: unknown): NotificationValidation {
  const errors: string[] = [];
  if (typeof input !== 'string') return {valid: false, errors: ['Text must be a string']};
  const value = normalizeNotificationText(input);
  if (!value) errors.push('Text is required');
  if (value.length > NOTIFICATION_TEXT_LIMIT) errors.push('Text exceeds 500 characters');
  if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)) errors.push('Text contains control characters');
  return {valid: errors.length === 0, errors};
}
export function validateNotificationFile(file: {type:string;size:number}, maxBytes=20*1024*1024): NotificationValidation {
  const errors: string[] = [];
  if (!Number.isFinite(file.size) || file.size <= 0) errors.push('File is empty');
  if (file.size > maxBytes) errors.push('File is too large');
  if (NOTIFICATION_MIME_TYPES.length && !NOTIFICATION_MIME_TYPES.includes(file.type)) errors.push('Unsupported media format');
  return {valid: errors.length === 0, errors};
}
export function createNotificationDraft(ownerId:string, text:string, id:string, now=new Date()): NotificationRecord {
  if (!ownerId || !id) throw new Error('Owner and record identifier required');
  const check=validateNotificationText(text);
  if (!check.valid) throw new Error(check.errors.join('; '));
  return {id,ownerId,body:normalizeNotificationText(text),status:'unread',createdAt:now.toISOString(),updatedAt:now.toISOString(),revision:1};
}
export function transitionNotification(record:NotificationRecord, next:NotificationStatus, actorId:string, now=new Date()):NotificationRecord {
  if (record.ownerId !== actorId) throw new Error('Only the owner can edit this record');
  if (!NOTIFICATION_STATES.includes(next)) throw new Error('Unknown status');
  if (record.status === next) return record;
  return {...record,status:next,updatedAt:now.toISOString(),revision:record.revision+1};
}
export function editNotification(record:NotificationRecord, text:string, actorId:string, now=new Date()):NotificationRecord {
  if (record.ownerId !== actorId) throw new Error('Only the owner can edit this record');
  const check=validateNotificationText(text);
  if (!check.valid) throw new Error(check.errors.join('; '));
  return {...record,body:normalizeNotificationText(text),updatedAt:now.toISOString(),revision:record.revision+1};
}
export function sortNotificationNewest(items:readonly NotificationRecord[]):NotificationRecord[] {
  return [...items].sort((a,b)=>b.createdAt.localeCompare(a.createdAt)||b.id.localeCompare(a.id));
}
export function pageNotification(items:readonly NotificationRecord[],cursor:string|null,pageSize=20):NotificationPage {
  if (!Number.isInteger(pageSize)||pageSize<1||pageSize>100) throw new Error('Invalid page size');
  const sorted=sortNotificationNewest(items);
  const start=cursor ? sorted.findIndex(item=>item.id===cursor)+1 : 0;
  if(cursor && start===0) throw new Error('Invalid cursor');
  const page=sorted.slice(start,start+pageSize);
  return {items:page,nextCursor:start+pageSize<sorted.length?page[page.length-1]?.id??null:null};
}
export function filterNotification(items:readonly NotificationRecord[],term:string,status?:NotificationStatus):NotificationRecord[] {
  const q=term.trim().toLocaleLowerCase();
  return items.filter(item=>(!status||item.status===status)&&(!q||item.body.toLocaleLowerCase().includes(q)));
}
export function mergeNotificationUpdates(current:readonly NotificationRecord[],incoming:readonly NotificationRecord[]):NotificationRecord[] {
  const merged=new Map(current.map(item=>[item.id,item]));
  for(const item of incoming){
    const existing=merged.get(item.id);
    if(!existing||item.revision>existing.revision||(item.revision===existing.revision&&item.updatedAt>existing.updatedAt))merged.set(item.id,item);
  }
  return sortNotificationNewest([...merged.values()]);
}
export function groupNotificationByOwner(items:readonly NotificationRecord[]):Record<string,NotificationRecord[]> {
  const groups:Record<string,NotificationRecord[]>={};
  for(const item of items)(groups[item.ownerId]??=[]).push(item);
  for(const owner of Object.keys(groups))groups[owner]=sortNotificationNewest(groups[owner]);
  return groups;
}
export function countNotificationByStatus(items:readonly NotificationRecord[]):Record<NotificationStatus,number> {
  const counts=Object.fromEntries(NOTIFICATION_STATES.map(status=>[status,0])) as Record<NotificationStatus,number>;
  for(const item of items)counts[item.status]++;
  return counts;
}
export function isNotificationOwner(item:NotificationRecord,userId:string|null):boolean {
  return !!userId && item.ownerId===userId;
}
export function assertNotificationRevision(item:NotificationRecord,expected:number):void {
  if(item.revision!==expected)throw new Error('Record changed since last edit');
}
