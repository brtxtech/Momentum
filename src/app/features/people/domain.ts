/** Person domain rules. Pure and testable; not a substitute for server-side authorization. */
export type PersonStatus = 'public' | 'private' | 'suspended';
export interface PersonRecord {
  id: string;
  ownerId: string;
  displayName: string;
  status: PersonStatus;
  createdAt: string;
  updatedAt: string;
  revision: number;
}
export interface PersonPage { items: PersonRecord[]; nextCursor: string | null; }
export interface PersonValidation { valid: boolean; errors: string[]; }
export const PERSON_TEXT_LIMIT = 80;
export const PERSON_STATES: readonly PersonStatus[] = ["public", "private", "suspended"];
export const PERSON_MIME_TYPES: readonly string[] = ["image/jpeg", "image/png", "image/webp"];
export function normalizePersonText(input: string): string {
  return input.normalize('NFC').replace(/\r\n?/g, '\n').trim();
}
export function validatePersonText(input: unknown): PersonValidation {
  const errors: string[] = [];
  if (typeof input !== 'string') return {valid: false, errors: ['Text must be a string']};
  const value = normalizePersonText(input);
  if (!value) errors.push('Text is required');
  if (value.length > PERSON_TEXT_LIMIT) errors.push('Text exceeds 80 characters');
  if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)) errors.push('Text contains control characters');
  return {valid: errors.length === 0, errors};
}
export function validatePersonFile(file: {type:string;size:number}, maxBytes=20*1024*1024): PersonValidation {
  const errors: string[] = [];
  if (!Number.isFinite(file.size) || file.size <= 0) errors.push('File is empty');
  if (file.size > maxBytes) errors.push('File is too large');
  if (PERSON_MIME_TYPES.length && !PERSON_MIME_TYPES.includes(file.type)) errors.push('Unsupported media format');
  return {valid: errors.length === 0, errors};
}
export function createPersonDraft(ownerId:string, text:string, id:string, now=new Date()): PersonRecord {
  if (!ownerId || !id) throw new Error('Owner and record identifier required');
  const check=validatePersonText(text);
  if (!check.valid) throw new Error(check.errors.join('; '));
  return {id,ownerId,displayName:normalizePersonText(text),status:'public',createdAt:now.toISOString(),updatedAt:now.toISOString(),revision:1};
}
export function transitionPerson(record:PersonRecord, next:PersonStatus, actorId:string, now=new Date()):PersonRecord {
  if (record.ownerId !== actorId) throw new Error('Only the owner can edit this record');
  if (!PERSON_STATES.includes(next)) throw new Error('Unknown status');
  if (record.status === next) return record;
  return {...record,status:next,updatedAt:now.toISOString(),revision:record.revision+1};
}
export function editPerson(record:PersonRecord, text:string, actorId:string, now=new Date()):PersonRecord {
  if (record.ownerId !== actorId) throw new Error('Only the owner can edit this record');
  const check=validatePersonText(text);
  if (!check.valid) throw new Error(check.errors.join('; '));
  return {...record,displayName:normalizePersonText(text),updatedAt:now.toISOString(),revision:record.revision+1};
}
export function sortPersonNewest(items:readonly PersonRecord[]):PersonRecord[] {
  return [...items].sort((a,b)=>b.createdAt.localeCompare(a.createdAt)||b.id.localeCompare(a.id));
}
export function pagePerson(items:readonly PersonRecord[],cursor:string|null,pageSize=20):PersonPage {
  if (!Number.isInteger(pageSize)||pageSize<1||pageSize>100) throw new Error('Invalid page size');
  const sorted=sortPersonNewest(items);
  const start=cursor ? sorted.findIndex(item=>item.id===cursor)+1 : 0;
  if(cursor && start===0) throw new Error('Invalid cursor');
  const page=sorted.slice(start,start+pageSize);
  return {items:page,nextCursor:start+pageSize<sorted.length?page[page.length-1]?.id??null:null};
}
export function filterPerson(items:readonly PersonRecord[],term:string,status?:PersonStatus):PersonRecord[] {
  const q=term.trim().toLocaleLowerCase();
  return items.filter(item=>(!status||item.status===status)&&(!q||item.displayName.toLocaleLowerCase().includes(q)));
}
export function mergePersonUpdates(current:readonly PersonRecord[],incoming:readonly PersonRecord[]):PersonRecord[] {
  const merged=new Map(current.map(item=>[item.id,item]));
  for(const item of incoming){
    const existing=merged.get(item.id);
    if(!existing||item.revision>existing.revision||(item.revision===existing.revision&&item.updatedAt>existing.updatedAt))merged.set(item.id,item);
  }
  return sortPersonNewest([...merged.values()]);
}
export function groupPersonByOwner(items:readonly PersonRecord[]):Record<string,PersonRecord[]> {
  const groups:Record<string,PersonRecord[]>={};
  for(const item of items)(groups[item.ownerId]??=[]).push(item);
  for(const owner of Object.keys(groups))groups[owner]=sortPersonNewest(groups[owner]);
  return groups;
}
export function countPersonByStatus(items:readonly PersonRecord[]):Record<PersonStatus,number> {
  const counts=Object.fromEntries(PERSON_STATES.map(status=>[status,0])) as Record<PersonStatus,number>;
  for(const item of items)counts[item.status]++;
  return counts;
}
export function isPersonOwner(item:PersonRecord,userId:string|null):boolean {
  return !!userId && item.ownerId===userId;
}
export function assertPersonRevision(item:PersonRecord,expected:number):void {
  if(item.revision!==expected)throw new Error('Record changed since last edit');
}
