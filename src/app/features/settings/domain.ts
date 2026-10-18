/** Preference domain rules. Pure and testable; not a substitute for server-side authorization. */
export type PreferenceStatus = 'default' | 'custom' | 'managed';
export interface PreferenceRecord {
  id: string;
  ownerId: string;
  key: string;
  status: PreferenceStatus;
  createdAt: string;
  updatedAt: string;
  revision: number;
}
export interface PreferencePage { items: PreferenceRecord[]; nextCursor: string | null; }
export interface PreferenceValidation { valid: boolean; errors: string[]; }
export const PREFERENCE_TEXT_LIMIT = 120;
export const PREFERENCE_STATES: readonly PreferenceStatus[] = ["default", "custom", "managed"];
export const PREFERENCE_MIME_TYPES: readonly string[] = [];
export function normalizePreferenceText(input: string): string {
  return input.normalize('NFC').replace(/\r\n?/g, '\n').trim();
}
export function validatePreferenceText(input: unknown): PreferenceValidation {
  const errors: string[] = [];
  if (typeof input !== 'string') return {valid: false, errors: ['Text must be a string']};
  const value = normalizePreferenceText(input);
  if (!value) errors.push('Text is required');
  if (value.length > PREFERENCE_TEXT_LIMIT) errors.push('Text exceeds 120 characters');
  if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)) errors.push('Text contains control characters');
  return {valid: errors.length === 0, errors};
}
export function validatePreferenceFile(file: {type:string;size:number}, maxBytes=20*1024*1024): PreferenceValidation {
  const errors: string[] = [];
  if (!Number.isFinite(file.size) || file.size <= 0) errors.push('File is empty');
  if (file.size > maxBytes) errors.push('File is too large');
  if (PREFERENCE_MIME_TYPES.length && !PREFERENCE_MIME_TYPES.includes(file.type)) errors.push('Unsupported media format');
  return {valid: errors.length === 0, errors};
}
export function createPreferenceDraft(ownerId:string, text:string, id:string, now=new Date()): PreferenceRecord {
  if (!ownerId || !id) throw new Error('Owner and record identifier required');
  const check=validatePreferenceText(text);
  if (!check.valid) throw new Error(check.errors.join('; '));
  return {id,ownerId,key:normalizePreferenceText(text),status:'default',createdAt:now.toISOString(),updatedAt:now.toISOString(),revision:1};
}
export function transitionPreference(record:PreferenceRecord, next:PreferenceStatus, actorId:string, now=new Date()):PreferenceRecord {
  if (record.ownerId !== actorId) throw new Error('Only the owner can edit this record');
  if (!PREFERENCE_STATES.includes(next)) throw new Error('Unknown status');
  if (record.status === next) return record;
  return {...record,status:next,updatedAt:now.toISOString(),revision:record.revision+1};
}
export function editPreference(record:PreferenceRecord, text:string, actorId:string, now=new Date()):PreferenceRecord {
  if (record.ownerId !== actorId) throw new Error('Only the owner can edit this record');
  const check=validatePreferenceText(text);
  if (!check.valid) throw new Error(check.errors.join('; '));
  return {...record,key:normalizePreferenceText(text),updatedAt:now.toISOString(),revision:record.revision+1};
}
export function sortPreferenceNewest(items:readonly PreferenceRecord[]):PreferenceRecord[] {
  return [...items].sort((a,b)=>b.createdAt.localeCompare(a.createdAt)||b.id.localeCompare(a.id));
}
export function pagePreference(items:readonly PreferenceRecord[],cursor:string|null,pageSize=20):PreferencePage {
  if (!Number.isInteger(pageSize)||pageSize<1||pageSize>100) throw new Error('Invalid page size');
  const sorted=sortPreferenceNewest(items);
  const start=cursor ? sorted.findIndex(item=>item.id===cursor)+1 : 0;
  if(cursor && start===0) throw new Error('Invalid cursor');
  const page=sorted.slice(start,start+pageSize);
  return {items:page,nextCursor:start+pageSize<sorted.length?page[page.length-1]?.id??null:null};
}
export function filterPreference(items:readonly PreferenceRecord[],term:string,status?:PreferenceStatus):PreferenceRecord[] {
  const q=term.trim().toLocaleLowerCase();
  return items.filter(item=>(!status||item.status===status)&&(!q||item.key.toLocaleLowerCase().includes(q)));
}
export function mergePreferenceUpdates(current:readonly PreferenceRecord[],incoming:readonly PreferenceRecord[]):PreferenceRecord[] {
  const merged=new Map(current.map(item=>[item.id,item]));
  for(const item of incoming){
    const existing=merged.get(item.id);
    if(!existing||item.revision>existing.revision||(item.revision===existing.revision&&item.updatedAt>existing.updatedAt))merged.set(item.id,item);
  }
  return sortPreferenceNewest([...merged.values()]);
}
export function groupPreferenceByOwner(items:readonly PreferenceRecord[]):Record<string,PreferenceRecord[]> {
  const groups:Record<string,PreferenceRecord[]>={};
  for(const item of items)(groups[item.ownerId]??=[]).push(item);
  for(const owner of Object.keys(groups))groups[owner]=sortPreferenceNewest(groups[owner]);
  return groups;
}
export function countPreferenceByStatus(items:readonly PreferenceRecord[]):Record<PreferenceStatus,number> {
  const counts=Object.fromEntries(PREFERENCE_STATES.map(status=>[status,0])) as Record<PreferenceStatus,number>;
  for(const item of items)counts[item.status]++;
  return counts;
}
export function isPreferenceOwner(item:PreferenceRecord,userId:string|null):boolean {
  return !!userId && item.ownerId===userId;
}
export function assertPreferenceRevision(item:PreferenceRecord,expected:number):void {
  if(item.revision!==expected)throw new Error('Record changed since last edit');
}
