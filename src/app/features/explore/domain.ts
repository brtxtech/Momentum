/** Search domain rules. Pure and testable; not a substitute for server-side authorization. */
export type SearchStatus = 'all' | 'people' | 'posts' | 'events';
export interface SearchRecord {
  id: string;
  ownerId: string;
  query: string;
  status: SearchStatus;
  createdAt: string;
  updatedAt: string;
  revision: number;
}
export interface SearchPage { items: SearchRecord[]; nextCursor: string | null; }
export interface SearchValidation { valid: boolean; errors: string[]; }
export const SEARCH_TEXT_LIMIT = 120;
export const SEARCH_STATES: readonly SearchStatus[] = ["all", "people", "posts", "events"];
export const SEARCH_MIME_TYPES: readonly string[] = [];
export function normalizeSearchText(input: string): string {
  return input.normalize('NFC').replace(/\r\n?/g, '\n').trim();
}
export function validateSearchText(input: unknown): SearchValidation {
  const errors: string[] = [];
  if (typeof input !== 'string') return {valid: false, errors: ['Text must be a string']};
  const value = normalizeSearchText(input);
  if (!value) errors.push('Text is required');
  if (value.length > SEARCH_TEXT_LIMIT) errors.push('Text exceeds 120 characters');
  if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)) errors.push('Text contains control characters');
  return {valid: errors.length === 0, errors};
}
export function validateSearchFile(file: {type:string;size:number}, maxBytes=20*1024*1024): SearchValidation {
  const errors: string[] = [];
  if (!Number.isFinite(file.size) || file.size <= 0) errors.push('File is empty');
  if (file.size > maxBytes) errors.push('File is too large');
  if (SEARCH_MIME_TYPES.length && !SEARCH_MIME_TYPES.includes(file.type)) errors.push('Unsupported media format');
  return {valid: errors.length === 0, errors};
}
export function createSearchDraft(ownerId:string, text:string, id:string, now=new Date()): SearchRecord {
  if (!ownerId || !id) throw new Error('Owner and record identifier required');
  const check=validateSearchText(text);
  if (!check.valid) throw new Error(check.errors.join('; '));
  return {id,ownerId,query:normalizeSearchText(text),status:'all',createdAt:now.toISOString(),updatedAt:now.toISOString(),revision:1};
}
export function transitionSearch(record:SearchRecord, next:SearchStatus, actorId:string, now=new Date()):SearchRecord {
  if (record.ownerId !== actorId) throw new Error('Only the owner can edit this record');
  if (!SEARCH_STATES.includes(next)) throw new Error('Unknown status');
  if (record.status === next) return record;
  return {...record,status:next,updatedAt:now.toISOString(),revision:record.revision+1};
}
export function editSearch(record:SearchRecord, text:string, actorId:string, now=new Date()):SearchRecord {
  if (record.ownerId !== actorId) throw new Error('Only the owner can edit this record');
  const check=validateSearchText(text);
  if (!check.valid) throw new Error(check.errors.join('; '));
  return {...record,query:normalizeSearchText(text),updatedAt:now.toISOString(),revision:record.revision+1};
}
export function sortSearchNewest(items:readonly SearchRecord[]):SearchRecord[] {
  return [...items].sort((a,b)=>b.createdAt.localeCompare(a.createdAt)||b.id.localeCompare(a.id));
}
export function pageSearch(items:readonly SearchRecord[],cursor:string|null,pageSize=20):SearchPage {
  if (!Number.isInteger(pageSize)||pageSize<1||pageSize>100) throw new Error('Invalid page size');
  const sorted=sortSearchNewest(items);
  const start=cursor ? sorted.findIndex(item=>item.id===cursor)+1 : 0;
  if(cursor && start===0) throw new Error('Invalid cursor');
  const page=sorted.slice(start,start+pageSize);
  return {items:page,nextCursor:start+pageSize<sorted.length?page[page.length-1]?.id??null:null};
}
export function filterSearch(items:readonly SearchRecord[],term:string,status?:SearchStatus):SearchRecord[] {
  const q=term.trim().toLocaleLowerCase();
  return items.filter(item=>(!status||item.status===status)&&(!q||item.query.toLocaleLowerCase().includes(q)));
}
export function mergeSearchUpdates(current:readonly SearchRecord[],incoming:readonly SearchRecord[]):SearchRecord[] {
  const merged=new Map(current.map(item=>[item.id,item]));
  for(const item of incoming){
    const existing=merged.get(item.id);
    if(!existing||item.revision>existing.revision||(item.revision===existing.revision&&item.updatedAt>existing.updatedAt))merged.set(item.id,item);
  }
  return sortSearchNewest([...merged.values()]);
}
export function groupSearchByOwner(items:readonly SearchRecord[]):Record<string,SearchRecord[]> {
  const groups:Record<string,SearchRecord[]>={};
  for(const item of items)(groups[item.ownerId]??=[]).push(item);
  for(const owner of Object.keys(groups))groups[owner]=sortSearchNewest(groups[owner]);
  return groups;
}
export function countSearchByStatus(items:readonly SearchRecord[]):Record<SearchStatus,number> {
  const counts=Object.fromEntries(SEARCH_STATES.map(status=>[status,0])) as Record<SearchStatus,number>;
  for(const item of items)counts[item.status]++;
  return counts;
}
export function isSearchOwner(item:SearchRecord,userId:string|null):boolean {
  return !!userId && item.ownerId===userId;
}
export function assertSearchRevision(item:SearchRecord,expected:number):void {
  if(item.revision!==expected)throw new Error('Record changed since last edit');
}
