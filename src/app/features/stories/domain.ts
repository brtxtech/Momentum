/** Story domain rules. Pure and testable; not a substitute for server-side authorization. */
export type StoryStatus = 'draft' | 'active' | 'expired';
export interface StoryRecord {
  id: string;
  ownerId: string;
  caption: string;
  status: StoryStatus;
  createdAt: string;
  updatedAt: string;
  revision: number;
}
export interface StoryPage { items: StoryRecord[]; nextCursor: string | null; }
export interface StoryValidation { valid: boolean; errors: string[]; }
export const STORY_TEXT_LIMIT = 500;
export const STORY_STATES: readonly StoryStatus[] = ["draft", "active", "expired"];
export const STORY_MIME_TYPES: readonly string[] = ["image/jpeg", "image/png", "image/webp", "video/mp4", "video/webm"];
export function normalizeStoryText(input: string): string {
  return input.normalize('NFC').replace(/\r\n?/g, '\n').trim();
}
export function validateStoryText(input: unknown): StoryValidation {
  const errors: string[] = [];
  if (typeof input !== 'string') return {valid: false, errors: ['Text must be a string']};
  const value = normalizeStoryText(input);
  if (!value) errors.push('Text is required');
  if (value.length > STORY_TEXT_LIMIT) errors.push('Text exceeds 500 characters');
  if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)) errors.push('Text contains control characters');
  return {valid: errors.length === 0, errors};
}
export function validateStoryFile(file: {type:string;size:number}, maxBytes=20*1024*1024): StoryValidation {
  const errors: string[] = [];
  if (!Number.isFinite(file.size) || file.size <= 0) errors.push('File is empty');
  if (file.size > maxBytes) errors.push('File is too large');
  if (STORY_MIME_TYPES.length && !STORY_MIME_TYPES.includes(file.type)) errors.push('Unsupported media format');
  return {valid: errors.length === 0, errors};
}
export function createStoryDraft(ownerId:string, text:string, id:string, now=new Date()): StoryRecord {
  if (!ownerId || !id) throw new Error('Owner and record identifier required');
  const check=validateStoryText(text);
  if (!check.valid) throw new Error(check.errors.join('; '));
  return {id,ownerId,caption:normalizeStoryText(text),status:'draft',createdAt:now.toISOString(),updatedAt:now.toISOString(),revision:1};
}
export function transitionStory(record:StoryRecord, next:StoryStatus, actorId:string, now=new Date()):StoryRecord {
  if (record.ownerId !== actorId) throw new Error('Only the owner can edit this record');
  if (!STORY_STATES.includes(next)) throw new Error('Unknown status');
  if (record.status === next) return record;
  return {...record,status:next,updatedAt:now.toISOString(),revision:record.revision+1};
}
export function editStory(record:StoryRecord, text:string, actorId:string, now=new Date()):StoryRecord {
  if (record.ownerId !== actorId) throw new Error('Only the owner can edit this record');
  const check=validateStoryText(text);
  if (!check.valid) throw new Error(check.errors.join('; '));
  return {...record,caption:normalizeStoryText(text),updatedAt:now.toISOString(),revision:record.revision+1};
}
export function sortStoryNewest(items:readonly StoryRecord[]):StoryRecord[] {
  return [...items].sort((a,b)=>b.createdAt.localeCompare(a.createdAt)||b.id.localeCompare(a.id));
}
export function pageStory(items:readonly StoryRecord[],cursor:string|null,pageSize=20):StoryPage {
  if (!Number.isInteger(pageSize)||pageSize<1||pageSize>100) throw new Error('Invalid page size');
  const sorted=sortStoryNewest(items);
  const start=cursor ? sorted.findIndex(item=>item.id===cursor)+1 : 0;
  if(cursor && start===0) throw new Error('Invalid cursor');
  const page=sorted.slice(start,start+pageSize);
  return {items:page,nextCursor:start+pageSize<sorted.length?page[page.length-1]?.id??null:null};
}
export function filterStory(items:readonly StoryRecord[],term:string,status?:StoryStatus):StoryRecord[] {
  const q=term.trim().toLocaleLowerCase();
  return items.filter(item=>(!status||item.status===status)&&(!q||item.caption.toLocaleLowerCase().includes(q)));
}
export function mergeStoryUpdates(current:readonly StoryRecord[],incoming:readonly StoryRecord[]):StoryRecord[] {
  const merged=new Map(current.map(item=>[item.id,item]));
  for(const item of incoming){
    const existing=merged.get(item.id);
    if(!existing||item.revision>existing.revision||(item.revision===existing.revision&&item.updatedAt>existing.updatedAt))merged.set(item.id,item);
  }
  return sortStoryNewest([...merged.values()]);
}
export function groupStoryByOwner(items:readonly StoryRecord[]):Record<string,StoryRecord[]> {
  const groups:Record<string,StoryRecord[]>={};
  for(const item of items)(groups[item.ownerId]??=[]).push(item);
  for(const owner of Object.keys(groups))groups[owner]=sortStoryNewest(groups[owner]);
  return groups;
}
export function countStoryByStatus(items:readonly StoryRecord[]):Record<StoryStatus,number> {
  const counts=Object.fromEntries(STORY_STATES.map(status=>[status,0])) as Record<StoryStatus,number>;
  for(const item of items)counts[item.status]++;
  return counts;
}
export function isStoryOwner(item:StoryRecord,userId:string|null):boolean {
  return !!userId && item.ownerId===userId;
}
export function assertStoryRevision(item:StoryRecord,expected:number):void {
  if(item.revision!==expected)throw new Error('Record changed since last edit');
}
