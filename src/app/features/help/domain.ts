/** Ticket domain rules. Pure and testable; not a substitute for server-side authorization. */
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export interface TicketRecord {
  id: string;
  ownerId: string;
  body: string;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
  revision: number;
}
export interface TicketPage { items: TicketRecord[]; nextCursor: string | null; }
export interface TicketValidation { valid: boolean; errors: string[]; }
export const TICKET_TEXT_LIMIT = 5000;
export const TICKET_STATES: readonly TicketStatus[] = ["open", "in_progress", "resolved", "closed"];
export const TICKET_MIME_TYPES: readonly string[] = [];
export function normalizeTicketText(input: string): string {
  return input.normalize('NFC').replace(/\r\n?/g, '\n').trim();
}
export function validateTicketText(input: unknown): TicketValidation {
  const errors: string[] = [];
  if (typeof input !== 'string') return {valid: false, errors: ['Text must be a string']};
  const value = normalizeTicketText(input);
  if (!value) errors.push('Text is required');
  if (value.length > TICKET_TEXT_LIMIT) errors.push('Text exceeds 5000 characters');
  if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)) errors.push('Text contains control characters');
  return {valid: errors.length === 0, errors};
}
export function validateTicketFile(file: {type:string;size:number}, maxBytes=20*1024*1024): TicketValidation {
  const errors: string[] = [];
  if (!Number.isFinite(file.size) || file.size <= 0) errors.push('File is empty');
  if (file.size > maxBytes) errors.push('File is too large');
  if (TICKET_MIME_TYPES.length && !TICKET_MIME_TYPES.includes(file.type)) errors.push('Unsupported media format');
  return {valid: errors.length === 0, errors};
}
export function createTicketDraft(ownerId:string, text:string, id:string, now=new Date()): TicketRecord {
  if (!ownerId || !id) throw new Error('Owner and record identifier required');
  const check=validateTicketText(text);
  if (!check.valid) throw new Error(check.errors.join('; '));
  return {id,ownerId,body:normalizeTicketText(text),status:'open',createdAt:now.toISOString(),updatedAt:now.toISOString(),revision:1};
}
export function transitionTicket(record:TicketRecord, next:TicketStatus, actorId:string, now=new Date()):TicketRecord {
  if (record.ownerId !== actorId) throw new Error('Only the owner can edit this record');
  if (!TICKET_STATES.includes(next)) throw new Error('Unknown status');
  if (record.status === next) return record;
  return {...record,status:next,updatedAt:now.toISOString(),revision:record.revision+1};
}
export function editTicket(record:TicketRecord, text:string, actorId:string, now=new Date()):TicketRecord {
  if (record.ownerId !== actorId) throw new Error('Only the owner can edit this record');
  const check=validateTicketText(text);
  if (!check.valid) throw new Error(check.errors.join('; '));
  return {...record,body:normalizeTicketText(text),updatedAt:now.toISOString(),revision:record.revision+1};
}
export function sortTicketNewest(items:readonly TicketRecord[]):TicketRecord[] {
  return [...items].sort((a,b)=>b.createdAt.localeCompare(a.createdAt)||b.id.localeCompare(a.id));
}
export function pageTicket(items:readonly TicketRecord[],cursor:string|null,pageSize=20):TicketPage {
  if (!Number.isInteger(pageSize)||pageSize<1||pageSize>100) throw new Error('Invalid page size');
  const sorted=sortTicketNewest(items);
  const start=cursor ? sorted.findIndex(item=>item.id===cursor)+1 : 0;
  if(cursor && start===0) throw new Error('Invalid cursor');
  const page=sorted.slice(start,start+pageSize);
  return {items:page,nextCursor:start+pageSize<sorted.length?page[page.length-1]?.id??null:null};
}
export function filterTicket(items:readonly TicketRecord[],term:string,status?:TicketStatus):TicketRecord[] {
  const q=term.trim().toLocaleLowerCase();
  return items.filter(item=>(!status||item.status===status)&&(!q||item.body.toLocaleLowerCase().includes(q)));
}
export function mergeTicketUpdates(current:readonly TicketRecord[],incoming:readonly TicketRecord[]):TicketRecord[] {
  const merged=new Map(current.map(item=>[item.id,item]));
  for(const item of incoming){
    const existing=merged.get(item.id);
    if(!existing||item.revision>existing.revision||(item.revision===existing.revision&&item.updatedAt>existing.updatedAt))merged.set(item.id,item);
  }
  return sortTicketNewest([...merged.values()]);
}
export function groupTicketByOwner(items:readonly TicketRecord[]):Record<string,TicketRecord[]> {
  const groups:Record<string,TicketRecord[]>={};
  for(const item of items)(groups[item.ownerId]??=[]).push(item);
  for(const owner of Object.keys(groups))groups[owner]=sortTicketNewest(groups[owner]);
  return groups;
}
export function countTicketByStatus(items:readonly TicketRecord[]):Record<TicketStatus,number> {
  const counts=Object.fromEntries(TICKET_STATES.map(status=>[status,0])) as Record<TicketStatus,number>;
  for(const item of items)counts[item.status]++;
  return counts;
}
export function isTicketOwner(item:TicketRecord,userId:string|null):boolean {
  return !!userId && item.ownerId===userId;
}
export function assertTicketRevision(item:TicketRecord,expected:number):void {
  if(item.revision!==expected)throw new Error('Record changed since last edit');
}
