/** Post domain rules. Pure and testable; not a substitute for server-side authorization. */
export type PostStatus = 'draft' | 'published' | 'archived';
export interface PostRecord {
  id: string;
  ownerId: string;
  caption: string;
  status: PostStatus;
  createdAt: string;
  updatedAt: string;
  revision: number;
}
export interface PostPage { items: PostRecord[]; nextCursor: string | null; }
export interface PostValidation { valid: boolean; errors: string[]; }
export const POST_TEXT_LIMIT = 2200;
export const POST_STATES: readonly PostStatus[] = ["draft", "published", "archived"];
export const POST_MIME_TYPES: readonly string[] = ["image/jpeg", "image/png", "image/webp", "video/mp4", "video/webm"];
export function normalizePostText(input: string): string {
  return input.normalize('NFC').replace(/\r\n?/g, '\n').trim();
}
export function validatePostText(input: unknown): PostValidation {
  const errors: string[] = [];
  if (typeof input !== 'string') return {valid: false, errors: ['Text must be a string']};
  const value = normalizePostText(input);
  if (!value) errors.push('Text is required');
  if (value.length > POST_TEXT_LIMIT) errors.push('Text exceeds 2200 characters');
  if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)) errors.push('Text contains control characters');
  return {valid: errors.length === 0, errors};
}
export function validatePostFile(file: {type:string;size:number}, maxBytes=20*1024*1024): PostValidation {
  const errors: string[] = [];
  if (!Number.isFinite(file.size) || file.size <= 0) errors.push('File is empty');
  if (file.size > maxBytes) errors.push('File is too large');
  if (POST_MIME_TYPES.length && !POST_MIME_TYPES.includes(file.type)) errors.push('Unsupported media format');
  return {valid: errors.length === 0, errors};
}
export function createPostDraft(ownerId:string, text:string, id:string, now=new Date()): PostRecord {
  if (!ownerId || !id) throw new Error('Owner and record identifier required');
  const check=validatePostText(text);
  if (!check.valid) throw new Error(check.errors.join('; '));
  return {id,ownerId,caption:normalizePostText(text),status:'draft',createdAt:now.toISOString(),updatedAt:now.toISOString(),revision:1};
}
export function transitionPost(record:PostRecord, next:PostStatus, actorId:string, now=new Date()):PostRecord {
  if (record.ownerId !== actorId) throw new Error('Only the owner can edit this record');
  if (!POST_STATES.includes(next)) throw new Error('Unknown status');
  if (record.status === next) return record;
  return {...record,status:next,updatedAt:now.toISOString(),revision:record.revision+1};
}
export function editPost(record:PostRecord, text:string, actorId:string, now=new Date()):PostRecord {
  if (record.ownerId !== actorId) throw new Error('Only the owner can edit this record');
  const check=validatePostText(text);
  if (!check.valid) throw new Error(check.errors.join('; '));
  return {...record,caption:normalizePostText(text),updatedAt:now.toISOString(),revision:record.revision+1};
}
export function sortPostNewest(items:readonly PostRecord[]):PostRecord[] {
  return [...items].sort((a,b)=>b.createdAt.localeCompare(a.createdAt)||b.id.localeCompare(a.id));
}
export function pagePost(items:readonly PostRecord[],cursor:string|null,pageSize=20):PostPage {
  if (!Number.isInteger(pageSize)||pageSize<1||pageSize>100) throw new Error('Invalid page size');
  const sorted=sortPostNewest(items);
  const start=cursor ? sorted.findIndex(item=>item.id===cursor)+1 : 0;
  if(cursor && start===0) throw new Error('Invalid cursor');
  const page=sorted.slice(start,start+pageSize);
  return {items:page,nextCursor:start+pageSize<sorted.length?page[page.length-1]?.id??null:null};
}
export function filterPost(items:readonly PostRecord[],term:string,status?:PostStatus):PostRecord[] {
  const q=term.trim().toLocaleLowerCase();
  return items.filter(item=>(!status||item.status===status)&&(!q||item.caption.toLocaleLowerCase().includes(q)));
}
export function mergePostUpdates(current:readonly PostRecord[],incoming:readonly PostRecord[]):PostRecord[] {
  const merged=new Map(current.map(item=>[item.id,item]));
  for(const item of incoming){
    const existing=merged.get(item.id);
    if(!existing||item.revision>existing.revision||(item.revision===existing.revision&&item.updatedAt>existing.updatedAt))merged.set(item.id,item);
  }
  return sortPostNewest([...merged.values()]);
}
export function groupPostByOwner(items:readonly PostRecord[]):Record<string,PostRecord[]> {
  const groups:Record<string,PostRecord[]>={};
  for(const item of items)(groups[item.ownerId]??=[]).push(item);
  for(const owner of Object.keys(groups))groups[owner]=sortPostNewest(groups[owner]);
  return groups;
}
export function countPostByStatus(items:readonly PostRecord[]):Record<PostStatus,number> {
  const counts=Object.fromEntries(POST_STATES.map(status=>[status,0])) as Record<PostStatus,number>;
  for(const item of items)counts[item.status]++;
  return counts;
}
export function isPostOwner(item:PostRecord,userId:string|null):boolean {
  return !!userId && item.ownerId===userId;
}
export function assertPostRevision(item:PostRecord,expected:number):void {
  if(item.revision!==expected)throw new Error('Record changed since last edit');
}
