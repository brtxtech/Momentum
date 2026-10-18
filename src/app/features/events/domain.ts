/** Event domain rules. Pure and testable; not a substitute for server-side authorization. */
export type EventStatus = 'draft' | 'published' | 'cancelled' | 'completed';
export interface EventRecord {
  id: string;
  ownerId: string;
  title: string;
  status: EventStatus;
  createdAt: string;
  updatedAt: string;
  revision: number;
}
export interface EventPage { items: EventRecord[]; nextCursor: string | null; }
export interface EventValidation { valid: boolean; errors: string[]; }
export const EVENT_TEXT_LIMIT = 120;
export const EVENT_STATES: readonly EventStatus[] = ["draft", "published", "cancelled", "completed"];
export const EVENT_MIME_TYPES: readonly string[] = ["image/jpeg", "image/png", "image/webp"];
export function normalizeEventText(input: string): string {
  return input.normalize('NFC').replace(/\r\n?/g, '\n').trim();
}
export function validateEventText(input: unknown): EventValidation {
  const errors: string[] = [];
  if (typeof input !== 'string') return {valid: false, errors: ['Text must be a string']};
  const value = normalizeEventText(input);
  if (!value) errors.push('Text is required');
  if (value.length > EVENT_TEXT_LIMIT) errors.push('Text exceeds 120 characters');
  if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)) errors.push('Text contains control characters');
  return {valid: errors.length === 0, errors};
}
export function validateEventFile(file: {type:string;size:number}, maxBytes=20*1024*1024): EventValidation {
  const errors: string[] = [];
  if (!Number.isFinite(file.size) || file.size <= 0) errors.push('File is empty');
  if (file.size > maxBytes) errors.push('File is too large');
  if (EVENT_MIME_TYPES.length && !EVENT_MIME_TYPES.includes(file.type)) errors.push('Unsupported media format');
  return {valid: errors.length === 0, errors};
}
export function createEventDraft(ownerId:string, text:string, id:string, now=new Date()): EventRecord {
  if (!ownerId || !id) throw new Error('Owner and record identifier required');
  const check=validateEventText(text);
  if (!check.valid) throw new Error(check.errors.join('; '));
  return {id,ownerId,title:normalizeEventText(text),status:'draft',createdAt:now.toISOString(),updatedAt:now.toISOString(),revision:1};
}
export function transitionEvent(record:EventRecord, next:EventStatus, actorId:string, now=new Date()):EventRecord {
  if (record.ownerId !== actorId) throw new Error('Only the owner can edit this record');
  if (!EVENT_STATES.includes(next)) throw new Error('Unknown status');
  if (record.status === next) return record;
  return {...record,status:next,updatedAt:now.toISOString(),revision:record.revision+1};
}
export function editEvent(record:EventRecord, text:string, actorId:string, now=new Date()):EventRecord {
  if (record.ownerId !== actorId) throw new Error('Only the owner can edit this record');
  const check=validateEventText(text);
  if (!check.valid) throw new Error(check.errors.join('; '));
  return {...record,title:normalizeEventText(text),updatedAt:now.toISOString(),revision:record.revision+1};
}
export function sortEventNewest(items:readonly EventRecord[]):EventRecord[] {
  return [...items].sort((a,b)=>b.createdAt.localeCompare(a.createdAt)||b.id.localeCompare(a.id));
}
export function pageEvent(items:readonly EventRecord[],cursor:string|null,pageSize=20):EventPage {
  if (!Number.isInteger(pageSize)||pageSize<1||pageSize>100) throw new Error('Invalid page size');
  const sorted=sortEventNewest(items);
  const start=cursor ? sorted.findIndex(item=>item.id===cursor)+1 : 0;
  if(cursor && start===0) throw new Error('Invalid cursor');
  const page=sorted.slice(start,start+pageSize);
  return {items:page,nextCursor:start+pageSize<sorted.length?page[page.length-1]?.id??null:null};
}
export function filterEvent(items:readonly EventRecord[],term:string,status?:EventStatus):EventRecord[] {
  const q=term.trim().toLocaleLowerCase();
  return items.filter(item=>(!status||item.status===status)&&(!q||item.title.toLocaleLowerCase().includes(q)));
}
export function mergeEventUpdates(current:readonly EventRecord[],incoming:readonly EventRecord[]):EventRecord[] {
  const merged=new Map(current.map(item=>[item.id,item]));
  for(const item of incoming){
    const existing=merged.get(item.id);
    if(!existing||item.revision>existing.revision||(item.revision===existing.revision&&item.updatedAt>existing.updatedAt))merged.set(item.id,item);
  }
  return sortEventNewest([...merged.values()]);
}
export function groupEventByOwner(items:readonly EventRecord[]):Record<string,EventRecord[]> {
  const groups:Record<string,EventRecord[]>={};
  for(const item of items)(groups[item.ownerId]??=[]).push(item);
  for(const owner of Object.keys(groups))groups[owner]=sortEventNewest(groups[owner]);
  return groups;
}
export function countEventByStatus(items:readonly EventRecord[]):Record<EventStatus,number> {
  const counts=Object.fromEntries(EVENT_STATES.map(status=>[status,0])) as Record<EventStatus,number>;
  for(const item of items)counts[item.status]++;
  return counts;
}
export function isEventOwner(item:EventRecord,userId:string|null):boolean {
  return !!userId && item.ownerId===userId;
}
export function assertEventRevision(item:EventRecord,expected:number):void {
  if(item.revision!==expected)throw new Error('Record changed since last edit');
}
