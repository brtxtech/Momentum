/** Reel domain rules. Pure and testable; not a substitute for server-side authorization. */
export type ReelStatus = 'draft' | 'processing' | 'published' | 'removed';
export interface ReelRecord {
  id: string;
  ownerId: string;
  caption: string;
  status: ReelStatus;
  createdAt: string;
  updatedAt: string;
  revision: number;
}
export interface ReelPage { items: ReelRecord[]; nextCursor: string | null; }
export interface ReelValidation { valid: boolean; errors: string[]; }
export const REEL_TEXT_LIMIT = 2200;
export const REEL_STATES: readonly ReelStatus[] = ["draft", "processing", "published", "removed"];
export const REEL_MIME_TYPES: readonly string[] = ["video/mp4", "video/webm"];
export function normalizeReelText(input: string): string {
  return input.normalize('NFC').replace(/\r\n?/g, '\n').trim();
}
export function validateReelText(input: unknown): ReelValidation {
  const errors: string[] = [];
  if (typeof input !== 'string') return {valid: false, errors: ['Text must be a string']};
  const value = normalizeReelText(input);
  if (!value) errors.push('Text is required');
  if (value.length > REEL_TEXT_LIMIT) errors.push('Text exceeds 2200 characters');
  if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)) errors.push('Text contains control characters');
  return {valid: errors.length === 0, errors};
}
export function validateReelFile(file: {type:string;size:number}, maxBytes=20*1024*1024): ReelValidation {
  const errors: string[] = [];
  if (!Number.isFinite(file.size) || file.size <= 0) errors.push('File is empty');
  if (file.size > maxBytes) errors.push('File is too large');
  if (REEL_MIME_TYPES.length && !REEL_MIME_TYPES.includes(file.type)) errors.push('Unsupported media format');
  return {valid: errors.length === 0, errors};
}
export function createReelDraft(ownerId:string, text:string, id:string, now=new Date()): ReelRecord {
  if (!ownerId || !id) throw new Error('Owner and record identifier required');
  const check=validateReelText(text);
  if (!check.valid) throw new Error(check.errors.join('; '));
  return {id,ownerId,caption:normalizeReelText(text),status:'draft',createdAt:now.toISOString(),updatedAt:now.toISOString(),revision:1};
}
export function transitionReel(record:ReelRecord, next:ReelStatus, actorId:string, now=new Date()):ReelRecord {
  if (record.ownerId !== actorId) throw new Error('Only the owner can edit this record');
  if (!REEL_STATES.includes(next)) throw new Error('Unknown status');
  if (record.status === next) return record;
  return {...record,status:next,updatedAt:now.toISOString(),revision:record.revision+1};
}
export function editReel(record:ReelRecord, text:string, actorId:string, now=new Date()):ReelRecord {
  if (record.ownerId !== actorId) throw new Error('Only the owner can edit this record');
  const check=validateReelText(text);
  if (!check.valid) throw new Error(check.errors.join('; '));
  return {...record,caption:normalizeReelText(text),updatedAt:now.toISOString(),revision:record.revision+1};
}
export function sortReelNewest(items:readonly ReelRecord[]):ReelRecord[] {
  return [...items].sort((a,b)=>b.createdAt.localeCompare(a.createdAt)||b.id.localeCompare(a.id));
}
export function pageReel(items:readonly ReelRecord[],cursor:string|null,pageSize=20):ReelPage {
  if (!Number.isInteger(pageSize)||pageSize<1||pageSize>100) throw new Error('Invalid page size');
  const sorted=sortReelNewest(items);
  const start=cursor ? sorted.findIndex(item=>item.id===cursor)+1 : 0;
  if(cursor && start===0) throw new Error('Invalid cursor');
  const page=sorted.slice(start,start+pageSize);
  return {items:page,nextCursor:start+pageSize<sorted.length?page[page.length-1]?.id??null:null};
}
export function filterReel(items:readonly ReelRecord[],term:string,status?:ReelStatus):ReelRecord[] {
  const q=term.trim().toLocaleLowerCase();
  return items.filter(item=>(!status||item.status===status)&&(!q||item.caption.toLocaleLowerCase().includes(q)));
}
export function mergeReelUpdates(current:readonly ReelRecord[],incoming:readonly ReelRecord[]):ReelRecord[] {
  const merged=new Map(current.map(item=>[item.id,item]));
  for(const item of incoming){
    const existing=merged.get(item.id);
    if(!existing||item.revision>existing.revision||(item.revision===existing.revision&&item.updatedAt>existing.updatedAt))merged.set(item.id,item);
  }
  return sortReelNewest([...merged.values()]);
}
export function groupReelByOwner(items:readonly ReelRecord[]):Record<string,ReelRecord[]> {
  const groups:Record<string,ReelRecord[]>={};
  for(const item of items)(groups[item.ownerId]??=[]).push(item);
  for(const owner of Object.keys(groups))groups[owner]=sortReelNewest(groups[owner]);
  return groups;
}
export function countReelByStatus(items:readonly ReelRecord[]):Record<ReelStatus,number> {
  const counts=Object.fromEntries(REEL_STATES.map(status=>[status,0])) as Record<ReelStatus,number>;
  for(const item of items)counts[item.status]++;
  return counts;
}
export function isReelOwner(item:ReelRecord,userId:string|null):boolean {
  return !!userId && item.ownerId===userId;
}
export function assertReelRevision(item:ReelRecord,expected:number):void {
  if(item.revision!==expected)throw new Error('Record changed since last edit');
}
