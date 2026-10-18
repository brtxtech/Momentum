/** Invitation domain rules. Pure and testable; not a substitute for server-side authorization. */
export type InvitationStatus = 'draft' | 'sent' | 'accepted' | 'declined';
export interface InvitationRecord {
  id: string;
  ownerId: string;
  title: string;
  status: InvitationStatus;
  createdAt: string;
  updatedAt: string;
  revision: number;
}
export interface InvitationPage { items: InvitationRecord[]; nextCursor: string | null; }
export interface InvitationValidation { valid: boolean; errors: string[]; }
export const INVITATION_TEXT_LIMIT = 120;
export const INVITATION_STATES: readonly InvitationStatus[] = ["draft", "sent", "accepted", "declined"];
export const INVITATION_MIME_TYPES: readonly string[] = [];
export function normalizeInvitationText(input: string): string {
  return input.normalize('NFC').replace(/\r\n?/g, '\n').trim();
}
export function validateInvitationText(input: unknown): InvitationValidation {
  const errors: string[] = [];
  if (typeof input !== 'string') return {valid: false, errors: ['Text must be a string']};
  const value = normalizeInvitationText(input);
  if (!value) errors.push('Text is required');
  if (value.length > INVITATION_TEXT_LIMIT) errors.push('Text exceeds 120 characters');
  if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)) errors.push('Text contains control characters');
  return {valid: errors.length === 0, errors};
}
export function validateInvitationFile(file: {type:string;size:number}, maxBytes=20*1024*1024): InvitationValidation {
  const errors: string[] = [];
  if (!Number.isFinite(file.size) || file.size <= 0) errors.push('File is empty');
  if (file.size > maxBytes) errors.push('File is too large');
  if (INVITATION_MIME_TYPES.length && !INVITATION_MIME_TYPES.includes(file.type)) errors.push('Unsupported media format');
  return {valid: errors.length === 0, errors};
}
export function createInvitationDraft(ownerId:string, text:string, id:string, now=new Date()): InvitationRecord {
  if (!ownerId || !id) throw new Error('Owner and record identifier required');
  const check=validateInvitationText(text);
  if (!check.valid) throw new Error(check.errors.join('; '));
  return {id,ownerId,title:normalizeInvitationText(text),status:'draft',createdAt:now.toISOString(),updatedAt:now.toISOString(),revision:1};
}
export function transitionInvitation(record:InvitationRecord, next:InvitationStatus, actorId:string, now=new Date()):InvitationRecord {
  if (record.ownerId !== actorId) throw new Error('Only the owner can edit this record');
  if (!INVITATION_STATES.includes(next)) throw new Error('Unknown status');
  if (record.status === next) return record;
  return {...record,status:next,updatedAt:now.toISOString(),revision:record.revision+1};
}
export function editInvitation(record:InvitationRecord, text:string, actorId:string, now=new Date()):InvitationRecord {
  if (record.ownerId !== actorId) throw new Error('Only the owner can edit this record');
  const check=validateInvitationText(text);
  if (!check.valid) throw new Error(check.errors.join('; '));
  return {...record,title:normalizeInvitationText(text),updatedAt:now.toISOString(),revision:record.revision+1};
}
export function sortInvitationNewest(items:readonly InvitationRecord[]):InvitationRecord[] {
  return [...items].sort((a,b)=>b.createdAt.localeCompare(a.createdAt)||b.id.localeCompare(a.id));
}
export function pageInvitation(items:readonly InvitationRecord[],cursor:string|null,pageSize=20):InvitationPage {
  if (!Number.isInteger(pageSize)||pageSize<1||pageSize>100) throw new Error('Invalid page size');
  const sorted=sortInvitationNewest(items);
  const start=cursor ? sorted.findIndex(item=>item.id===cursor)+1 : 0;
  if(cursor && start===0) throw new Error('Invalid cursor');
  const page=sorted.slice(start,start+pageSize);
  return {items:page,nextCursor:start+pageSize<sorted.length?page[page.length-1]?.id??null:null};
}
export function filterInvitation(items:readonly InvitationRecord[],term:string,status?:InvitationStatus):InvitationRecord[] {
  const q=term.trim().toLocaleLowerCase();
  return items.filter(item=>(!status||item.status===status)&&(!q||item.title.toLocaleLowerCase().includes(q)));
}
export function mergeInvitationUpdates(current:readonly InvitationRecord[],incoming:readonly InvitationRecord[]):InvitationRecord[] {
  const merged=new Map(current.map(item=>[item.id,item]));
  for(const item of incoming){
    const existing=merged.get(item.id);
    if(!existing||item.revision>existing.revision||(item.revision===existing.revision&&item.updatedAt>existing.updatedAt))merged.set(item.id,item);
  }
  return sortInvitationNewest([...merged.values()]);
}
export function groupInvitationByOwner(items:readonly InvitationRecord[]):Record<string,InvitationRecord[]> {
  const groups:Record<string,InvitationRecord[]>={};
  for(const item of items)(groups[item.ownerId]??=[]).push(item);
  for(const owner of Object.keys(groups))groups[owner]=sortInvitationNewest(groups[owner]);
  return groups;
}
export function countInvitationByStatus(items:readonly InvitationRecord[]):Record<InvitationStatus,number> {
  const counts=Object.fromEntries(INVITATION_STATES.map(status=>[status,0])) as Record<InvitationStatus,number>;
  for(const item of items)counts[item.status]++;
  return counts;
}
export function isInvitationOwner(item:InvitationRecord,userId:string|null):boolean {
  return !!userId && item.ownerId===userId;
}
export function assertInvitationRevision(item:InvitationRecord,expected:number):void {
  if(item.revision!==expected)throw new Error('Record changed since last edit');
}
