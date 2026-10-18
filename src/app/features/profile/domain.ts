/** Profile domain rules. Pure and testable; not a substitute for server-side authorization. */
export type ProfileStatus = 'public' | 'private' | 'disabled';
export interface ProfileRecord {
  id: string;
  ownerId: string;
  bio: string;
  status: ProfileStatus;
  createdAt: string;
  updatedAt: string;
  revision: number;
}
export interface ProfilePage { items: ProfileRecord[]; nextCursor: string | null; }
export interface ProfileValidation { valid: boolean; errors: string[]; }
export const PROFILE_TEXT_LIMIT = 500;
export const PROFILE_STATES: readonly ProfileStatus[] = ["public", "private", "disabled"];
export const PROFILE_MIME_TYPES: readonly string[] = ["image/jpeg", "image/png", "image/webp"];
export function normalizeProfileText(input: string): string {
  return input.normalize('NFC').replace(/\r\n?/g, '\n').trim();
}
export function validateProfileText(input: unknown): ProfileValidation {
  const errors: string[] = [];
  if (typeof input !== 'string') return {valid: false, errors: ['Text must be a string']};
  const value = normalizeProfileText(input);
  if (!value) errors.push('Text is required');
  if (value.length > PROFILE_TEXT_LIMIT) errors.push('Text exceeds 500 characters');
  if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)) errors.push('Text contains control characters');
  return {valid: errors.length === 0, errors};
}
export function validateProfileFile(file: {type:string;size:number}, maxBytes=20*1024*1024): ProfileValidation {
  const errors: string[] = [];
  if (!Number.isFinite(file.size) || file.size <= 0) errors.push('File is empty');
  if (file.size > maxBytes) errors.push('File is too large');
  if (PROFILE_MIME_TYPES.length && !PROFILE_MIME_TYPES.includes(file.type)) errors.push('Unsupported media format');
  return {valid: errors.length === 0, errors};
}
export function createProfileDraft(ownerId:string, text:string, id:string, now=new Date()): ProfileRecord {
  if (!ownerId || !id) throw new Error('Owner and record identifier required');
  const check=validateProfileText(text);
  if (!check.valid) throw new Error(check.errors.join('; '));
  return {id,ownerId,bio:normalizeProfileText(text),status:'public',createdAt:now.toISOString(),updatedAt:now.toISOString(),revision:1};
}
export function transitionProfile(record:ProfileRecord, next:ProfileStatus, actorId:string, now=new Date()):ProfileRecord {
  if (record.ownerId !== actorId) throw new Error('Only the owner can edit this record');
  if (!PROFILE_STATES.includes(next)) throw new Error('Unknown status');
  if (record.status === next) return record;
  return {...record,status:next,updatedAt:now.toISOString(),revision:record.revision+1};
}
export function editProfile(record:ProfileRecord, text:string, actorId:string, now=new Date()):ProfileRecord {
  if (record.ownerId !== actorId) throw new Error('Only the owner can edit this record');
  const check=validateProfileText(text);
  if (!check.valid) throw new Error(check.errors.join('; '));
  return {...record,bio:normalizeProfileText(text),updatedAt:now.toISOString(),revision:record.revision+1};
}
export function sortProfileNewest(items:readonly ProfileRecord[]):ProfileRecord[] {
  return [...items].sort((a,b)=>b.createdAt.localeCompare(a.createdAt)||b.id.localeCompare(a.id));
}
export function pageProfile(items:readonly ProfileRecord[],cursor:string|null,pageSize=20):ProfilePage {
  if (!Number.isInteger(pageSize)||pageSize<1||pageSize>100) throw new Error('Invalid page size');
  const sorted=sortProfileNewest(items);
  const start=cursor ? sorted.findIndex(item=>item.id===cursor)+1 : 0;
  if(cursor && start===0) throw new Error('Invalid cursor');
  const page=sorted.slice(start,start+pageSize);
  return {items:page,nextCursor:start+pageSize<sorted.length?page[page.length-1]?.id??null:null};
}
export function filterProfile(items:readonly ProfileRecord[],term:string,status?:ProfileStatus):ProfileRecord[] {
  const q=term.trim().toLocaleLowerCase();
  return items.filter(item=>(!status||item.status===status)&&(!q||item.bio.toLocaleLowerCase().includes(q)));
}
export function mergeProfileUpdates(current:readonly ProfileRecord[],incoming:readonly ProfileRecord[]):ProfileRecord[] {
  const merged=new Map(current.map(item=>[item.id,item]));
  for(const item of incoming){
    const existing=merged.get(item.id);
    if(!existing||item.revision>existing.revision||(item.revision===existing.revision&&item.updatedAt>existing.updatedAt))merged.set(item.id,item);
  }
  return sortProfileNewest([...merged.values()]);
}
export function groupProfileByOwner(items:readonly ProfileRecord[]):Record<string,ProfileRecord[]> {
  const groups:Record<string,ProfileRecord[]>={};
  for(const item of items)(groups[item.ownerId]??=[]).push(item);
  for(const owner of Object.keys(groups))groups[owner]=sortProfileNewest(groups[owner]);
  return groups;
}
export function countProfileByStatus(items:readonly ProfileRecord[]):Record<ProfileStatus,number> {
  const counts=Object.fromEntries(PROFILE_STATES.map(status=>[status,0])) as Record<ProfileStatus,number>;
  for(const item of items)counts[item.status]++;
  return counts;
}
export function isProfileOwner(item:ProfileRecord,userId:string|null):boolean {
  return !!userId && item.ownerId===userId;
}
export function assertProfileRevision(item:ProfileRecord,expected:number):void {
  if(item.revision!==expected)throw new Error('Record changed since last edit');
}
