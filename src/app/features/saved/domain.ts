/** Bookmark domain rules. Pure and testable; not a substitute for server-side authorization. */
export type BookmarkStatus = 'active' | 'removed';
export interface BookmarkRecord {
  id: string;
  ownerId: string;
  note: string;
  status: BookmarkStatus;
  createdAt: string;
  updatedAt: string;
  revision: number;
}
export interface BookmarkPage { items: BookmarkRecord[]; nextCursor: string | null; }
export interface BookmarkValidation { valid: boolean; errors: string[]; }
export const BOOKMARK_TEXT_LIMIT = 300;
export const BOOKMARK_STATES: readonly BookmarkStatus[] = ["active", "removed"];
export const BOOKMARK_MIME_TYPES: readonly string[] = [];
export function normalizeBookmarkText(input: string): string {
  return input.normalize('NFC').replace(/\r\n?/g, '\n').trim();
}
export function validateBookmarkText(input: unknown): BookmarkValidation {
  const errors: string[] = [];
  if (typeof input !== 'string') return {valid: false, errors: ['Text must be a string']};
  const value = normalizeBookmarkText(input);
  if (!value) errors.push('Text is required');
  if (value.length > BOOKMARK_TEXT_LIMIT) errors.push('Text exceeds 300 characters');
  if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)) errors.push('Text contains control characters');
  return {valid: errors.length === 0, errors};
}
export function validateBookmarkFile(file: {type:string;size:number}, maxBytes=20*1024*1024): BookmarkValidation {
  const errors: string[] = [];
  if (!Number.isFinite(file.size) || file.size <= 0) errors.push('File is empty');
  if (file.size > maxBytes) errors.push('File is too large');
  if (BOOKMARK_MIME_TYPES.length && !BOOKMARK_MIME_TYPES.includes(file.type)) errors.push('Unsupported media format');
  return {valid: errors.length === 0, errors};
}
export function createBookmarkDraft(ownerId:string, text:string, id:string, now=new Date()): BookmarkRecord {
  if (!ownerId || !id) throw new Error('Owner and record identifier required');
  const check=validateBookmarkText(text);
  if (!check.valid) throw new Error(check.errors.join('; '));
  return {id,ownerId,note:normalizeBookmarkText(text),status:'active',createdAt:now.toISOString(),updatedAt:now.toISOString(),revision:1};
}
export function transitionBookmark(record:BookmarkRecord, next:BookmarkStatus, actorId:string, now=new Date()):BookmarkRecord {
  if (record.ownerId !== actorId) throw new Error('Only the owner can edit this record');
  if (!BOOKMARK_STATES.includes(next)) throw new Error('Unknown status');
  if (record.status === next) return record;
  return {...record,status:next,updatedAt:now.toISOString(),revision:record.revision+1};
}
export function editBookmark(record:BookmarkRecord, text:string, actorId:string, now=new Date()):BookmarkRecord {
  if (record.ownerId !== actorId) throw new Error('Only the owner can edit this record');
  const check=validateBookmarkText(text);
  if (!check.valid) throw new Error(check.errors.join('; '));
  return {...record,note:normalizeBookmarkText(text),updatedAt:now.toISOString(),revision:record.revision+1};
}
export function sortBookmarkNewest(items:readonly BookmarkRecord[]):BookmarkRecord[] {
  return [...items].sort((a,b)=>b.createdAt.localeCompare(a.createdAt)||b.id.localeCompare(a.id));
}
export function pageBookmark(items:readonly BookmarkRecord[],cursor:string|null,pageSize=20):BookmarkPage {
  if (!Number.isInteger(pageSize)||pageSize<1||pageSize>100) throw new Error('Invalid page size');
  const sorted=sortBookmarkNewest(items);
  const start=cursor ? sorted.findIndex(item=>item.id===cursor)+1 : 0;
  if(cursor && start===0) throw new Error('Invalid cursor');
  const page=sorted.slice(start,start+pageSize);
  return {items:page,nextCursor:start+pageSize<sorted.length?page[page.length-1]?.id??null:null};
}
export function filterBookmark(items:readonly BookmarkRecord[],term:string,status?:BookmarkStatus):BookmarkRecord[] {
  const q=term.trim().toLocaleLowerCase();
  return items.filter(item=>(!status||item.status===status)&&(!q||item.note.toLocaleLowerCase().includes(q)));
}
export function mergeBookmarkUpdates(current:readonly BookmarkRecord[],incoming:readonly BookmarkRecord[]):BookmarkRecord[] {
  const merged=new Map(current.map(item=>[item.id,item]));
  for(const item of incoming){
    const existing=merged.get(item.id);
    if(!existing||item.revision>existing.revision||(item.revision===existing.revision&&item.updatedAt>existing.updatedAt))merged.set(item.id,item);
  }
  return sortBookmarkNewest([...merged.values()]);
}
export function groupBookmarkByOwner(items:readonly BookmarkRecord[]):Record<string,BookmarkRecord[]> {
  const groups:Record<string,BookmarkRecord[]>={};
  for(const item of items)(groups[item.ownerId]??=[]).push(item);
  for(const owner of Object.keys(groups))groups[owner]=sortBookmarkNewest(groups[owner]);
  return groups;
}
export function countBookmarkByStatus(items:readonly BookmarkRecord[]):Record<BookmarkStatus,number> {
  const counts=Object.fromEntries(BOOKMARK_STATES.map(status=>[status,0])) as Record<BookmarkStatus,number>;
  for(const item of items)counts[item.status]++;
  return counts;
}
export function isBookmarkOwner(item:BookmarkRecord,userId:string|null):boolean {
  return !!userId && item.ownerId===userId;
}
export function assertBookmarkRevision(item:BookmarkRecord,expected:number):void {
  if(item.revision!==expected)throw new Error('Record changed since last edit');
}
