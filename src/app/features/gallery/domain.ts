/** GalleryItem domain rules. Pure and testable; not a substitute for server-side authorization. */
export type GalleryItemStatus = 'pending' | 'visible' | 'hidden' | 'deleted';
export interface GalleryItemRecord {
  id: string;
  ownerId: string;
  caption: string;
  status: GalleryItemStatus;
  createdAt: string;
  updatedAt: string;
  revision: number;
}
export interface GalleryItemPage { items: GalleryItemRecord[]; nextCursor: string | null; }
export interface GalleryItemValidation { valid: boolean; errors: string[]; }
export const GALLERYITEM_TEXT_LIMIT = 500;
export const GALLERYITEM_STATES: readonly GalleryItemStatus[] = ["pending", "visible", "hidden", "deleted"];
export const GALLERYITEM_MIME_TYPES: readonly string[] = ["image/jpeg", "image/png", "image/webp"];
export function normalizeGalleryItemText(input: string): string {
  return input.normalize('NFC').replace(/\r\n?/g, '\n').trim();
}
export function validateGalleryItemText(input: unknown): GalleryItemValidation {
  const errors: string[] = [];
  if (typeof input !== 'string') return {valid: false, errors: ['Text must be a string']};
  const value = normalizeGalleryItemText(input);
  if (!value) errors.push('Text is required');
  if (value.length > GALLERYITEM_TEXT_LIMIT) errors.push('Text exceeds 500 characters');
  if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)) errors.push('Text contains control characters');
  return {valid: errors.length === 0, errors};
}
export function validateGalleryItemFile(file: {type:string;size:number}, maxBytes=20*1024*1024): GalleryItemValidation {
  const errors: string[] = [];
  if (!Number.isFinite(file.size) || file.size <= 0) errors.push('File is empty');
  if (file.size > maxBytes) errors.push('File is too large');
  if (GALLERYITEM_MIME_TYPES.length && !GALLERYITEM_MIME_TYPES.includes(file.type)) errors.push('Unsupported media format');
  return {valid: errors.length === 0, errors};
}
export function createGalleryItemDraft(ownerId:string, text:string, id:string, now=new Date()): GalleryItemRecord {
  if (!ownerId || !id) throw new Error('Owner and record identifier required');
  const check=validateGalleryItemText(text);
  if (!check.valid) throw new Error(check.errors.join('; '));
  return {id,ownerId,caption:normalizeGalleryItemText(text),status:'pending',createdAt:now.toISOString(),updatedAt:now.toISOString(),revision:1};
}
export function transitionGalleryItem(record:GalleryItemRecord, next:GalleryItemStatus, actorId:string, now=new Date()):GalleryItemRecord {
  if (record.ownerId !== actorId) throw new Error('Only the owner can edit this record');
  if (!GALLERYITEM_STATES.includes(next)) throw new Error('Unknown status');
  if (record.status === next) return record;
  return {...record,status:next,updatedAt:now.toISOString(),revision:record.revision+1};
}
export function editGalleryItem(record:GalleryItemRecord, text:string, actorId:string, now=new Date()):GalleryItemRecord {
  if (record.ownerId !== actorId) throw new Error('Only the owner can edit this record');
  const check=validateGalleryItemText(text);
  if (!check.valid) throw new Error(check.errors.join('; '));
  return {...record,caption:normalizeGalleryItemText(text),updatedAt:now.toISOString(),revision:record.revision+1};
}
export function sortGalleryItemNewest(items:readonly GalleryItemRecord[]):GalleryItemRecord[] {
  return [...items].sort((a,b)=>b.createdAt.localeCompare(a.createdAt)||b.id.localeCompare(a.id));
}
export function pageGalleryItem(items:readonly GalleryItemRecord[],cursor:string|null,pageSize=20):GalleryItemPage {
  if (!Number.isInteger(pageSize)||pageSize<1||pageSize>100) throw new Error('Invalid page size');
  const sorted=sortGalleryItemNewest(items);
  const start=cursor ? sorted.findIndex(item=>item.id===cursor)+1 : 0;
  if(cursor && start===0) throw new Error('Invalid cursor');
  const page=sorted.slice(start,start+pageSize);
  return {items:page,nextCursor:start+pageSize<sorted.length?page[page.length-1]?.id??null:null};
}
export function filterGalleryItem(items:readonly GalleryItemRecord[],term:string,status?:GalleryItemStatus):GalleryItemRecord[] {
  const q=term.trim().toLocaleLowerCase();
  return items.filter(item=>(!status||item.status===status)&&(!q||item.caption.toLocaleLowerCase().includes(q)));
}
export function mergeGalleryItemUpdates(current:readonly GalleryItemRecord[],incoming:readonly GalleryItemRecord[]):GalleryItemRecord[] {
  const merged=new Map(current.map(item=>[item.id,item]));
  for(const item of incoming){
    const existing=merged.get(item.id);
    if(!existing||item.revision>existing.revision||(item.revision===existing.revision&&item.updatedAt>existing.updatedAt))merged.set(item.id,item);
  }
  return sortGalleryItemNewest([...merged.values()]);
}
export function groupGalleryItemByOwner(items:readonly GalleryItemRecord[]):Record<string,GalleryItemRecord[]> {
  const groups:Record<string,GalleryItemRecord[]>={};
  for(const item of items)(groups[item.ownerId]??=[]).push(item);
  for(const owner of Object.keys(groups))groups[owner]=sortGalleryItemNewest(groups[owner]);
  return groups;
}
export function countGalleryItemByStatus(items:readonly GalleryItemRecord[]):Record<GalleryItemStatus,number> {
  const counts=Object.fromEntries(GALLERYITEM_STATES.map(status=>[status,0])) as Record<GalleryItemStatus,number>;
  for(const item of items)counts[item.status]++;
  return counts;
}
export function isGalleryItemOwner(item:GalleryItemRecord,userId:string|null):boolean {
  return !!userId && item.ownerId===userId;
}
export function assertGalleryItemRevision(item:GalleryItemRecord,expected:number):void {
  if(item.revision!==expected)throw new Error('Record changed since last edit');
}
