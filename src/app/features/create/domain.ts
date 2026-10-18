/** Publication domain rules. Pure and testable; not a substitute for server-side authorization. */
export type PublicationStatus = 'draft' | 'validating' | 'uploading' | 'published' | 'failed';
export interface PublicationRecord {
  id: string;
  ownerId: string;
  caption: string;
  status: PublicationStatus;
  createdAt: string;
  updatedAt: string;
  revision: number;
}
export interface PublicationPage { items: PublicationRecord[]; nextCursor: string | null; }
export interface PublicationValidation { valid: boolean; errors: string[]; }
export const PUBLICATION_TEXT_LIMIT = 2200;
export const PUBLICATION_STATES: readonly PublicationStatus[] = ["draft", "validating", "uploading", "published", "failed"];
export const PUBLICATION_MIME_TYPES: readonly string[] = ["image/jpeg", "image/png", "image/webp", "video/mp4", "video/webm"];
export function normalizePublicationText(input: string): string {
  return input.normalize('NFC').replace(/\r\n?/g, '\n').trim();
}
export function validatePublicationText(input: unknown): PublicationValidation {
  const errors: string[] = [];
  if (typeof input !== 'string') return {valid: false, errors: ['Text must be a string']};
  const value = normalizePublicationText(input);
  if (!value) errors.push('Text is required');
  if (value.length > PUBLICATION_TEXT_LIMIT) errors.push('Text exceeds 2200 characters');
  if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)) errors.push('Text contains control characters');
  return {valid: errors.length === 0, errors};
}
export function validatePublicationFile(file: {type:string;size:number}, maxBytes=20*1024*1024): PublicationValidation {
  const errors: string[] = [];
  if (!Number.isFinite(file.size) || file.size <= 0) errors.push('File is empty');
  if (file.size > maxBytes) errors.push('File is too large');
  if (PUBLICATION_MIME_TYPES.length && !PUBLICATION_MIME_TYPES.includes(file.type)) errors.push('Unsupported media format');
  return {valid: errors.length === 0, errors};
}
export function createPublicationDraft(ownerId:string, text:string, id:string, now=new Date()): PublicationRecord {
  if (!ownerId || !id) throw new Error('Owner and record identifier required');
  const check=validatePublicationText(text);
  if (!check.valid) throw new Error(check.errors.join('; '));
  return {id,ownerId,caption:normalizePublicationText(text),status:'draft',createdAt:now.toISOString(),updatedAt:now.toISOString(),revision:1};
}
export function transitionPublication(record:PublicationRecord, next:PublicationStatus, actorId:string, now=new Date()):PublicationRecord {
  if (record.ownerId !== actorId) throw new Error('Only the owner can edit this record');
  if (!PUBLICATION_STATES.includes(next)) throw new Error('Unknown status');
  if (record.status === next) return record;
  return {...record,status:next,updatedAt:now.toISOString(),revision:record.revision+1};
}
export function editPublication(record:PublicationRecord, text:string, actorId:string, now=new Date()):PublicationRecord {
  if (record.ownerId !== actorId) throw new Error('Only the owner can edit this record');
  const check=validatePublicationText(text);
  if (!check.valid) throw new Error(check.errors.join('; '));
  return {...record,caption:normalizePublicationText(text),updatedAt:now.toISOString(),revision:record.revision+1};
}
export function sortPublicationNewest(items:readonly PublicationRecord[]):PublicationRecord[] {
  return [...items].sort((a,b)=>b.createdAt.localeCompare(a.createdAt)||b.id.localeCompare(a.id));
}
export function pagePublication(items:readonly PublicationRecord[],cursor:string|null,pageSize=20):PublicationPage {
  if (!Number.isInteger(pageSize)||pageSize<1||pageSize>100) throw new Error('Invalid page size');
  const sorted=sortPublicationNewest(items);
  const start=cursor ? sorted.findIndex(item=>item.id===cursor)+1 : 0;
  if(cursor && start===0) throw new Error('Invalid cursor');
  const page=sorted.slice(start,start+pageSize);
  return {items:page,nextCursor:start+pageSize<sorted.length?page[page.length-1]?.id??null:null};
}
export function filterPublication(items:readonly PublicationRecord[],term:string,status?:PublicationStatus):PublicationRecord[] {
  const q=term.trim().toLocaleLowerCase();
  return items.filter(item=>(!status||item.status===status)&&(!q||item.caption.toLocaleLowerCase().includes(q)));
}
export function mergePublicationUpdates(current:readonly PublicationRecord[],incoming:readonly PublicationRecord[]):PublicationRecord[] {
  const merged=new Map(current.map(item=>[item.id,item]));
  for(const item of incoming){
    const existing=merged.get(item.id);
    if(!existing||item.revision>existing.revision||(item.revision===existing.revision&&item.updatedAt>existing.updatedAt))merged.set(item.id,item);
  }
  return sortPublicationNewest([...merged.values()]);
}
export function groupPublicationByOwner(items:readonly PublicationRecord[]):Record<string,PublicationRecord[]> {
  const groups:Record<string,PublicationRecord[]>={};
  for(const item of items)(groups[item.ownerId]??=[]).push(item);
  for(const owner of Object.keys(groups))groups[owner]=sortPublicationNewest(groups[owner]);
  return groups;
}
export function countPublicationByStatus(items:readonly PublicationRecord[]):Record<PublicationStatus,number> {
  const counts=Object.fromEntries(PUBLICATION_STATES.map(status=>[status,0])) as Record<PublicationStatus,number>;
  for(const item of items)counts[item.status]++;
  return counts;
}
export function isPublicationOwner(item:PublicationRecord,userId:string|null):boolean {
  return !!userId && item.ownerId===userId;
}
export function assertPublicationRevision(item:PublicationRecord,expected:number):void {
  if(item.revision!==expected)throw new Error('Record changed since last edit');
}
