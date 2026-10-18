/** AccessCode domain rules. Pure and testable; not a substitute for server-side authorization. */
export type AccessCodeStatus = 'created' | 'active' | 'redeemed' | 'revoked';
export interface AccessCodeRecord {
  id: string;
  ownerId: string;
  label: string;
  status: AccessCodeStatus;
  createdAt: string;
  updatedAt: string;
  revision: number;
}
export interface AccessCodePage { items: AccessCodeRecord[]; nextCursor: string | null; }
export interface AccessCodeValidation { valid: boolean; errors: string[]; }
export const ACCESSCODE_TEXT_LIMIT = 120;
export const ACCESSCODE_STATES: readonly AccessCodeStatus[] = ["created", "active", "redeemed", "revoked"];
export const ACCESSCODE_MIME_TYPES: readonly string[] = [];
export function normalizeAccessCodeText(input: string): string {
  return input.normalize('NFC').replace(/\r\n?/g, '\n').trim();
}
export function validateAccessCodeText(input: unknown): AccessCodeValidation {
  const errors: string[] = [];
  if (typeof input !== 'string') return {valid: false, errors: ['Text must be a string']};
  const value = normalizeAccessCodeText(input);
  if (!value) errors.push('Text is required');
  if (value.length > ACCESSCODE_TEXT_LIMIT) errors.push('Text exceeds 120 characters');
  if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)) errors.push('Text contains control characters');
  return {valid: errors.length === 0, errors};
}
export function validateAccessCodeFile(file: {type:string;size:number}, maxBytes=20*1024*1024): AccessCodeValidation {
  const errors: string[] = [];
  if (!Number.isFinite(file.size) || file.size <= 0) errors.push('File is empty');
  if (file.size > maxBytes) errors.push('File is too large');
  if (ACCESSCODE_MIME_TYPES.length && !ACCESSCODE_MIME_TYPES.includes(file.type)) errors.push('Unsupported media format');
  return {valid: errors.length === 0, errors};
}
export function createAccessCodeDraft(ownerId:string, text:string, id:string, now=new Date()): AccessCodeRecord {
  if (!ownerId || !id) throw new Error('Owner and record identifier required');
  const check=validateAccessCodeText(text);
  if (!check.valid) throw new Error(check.errors.join('; '));
  return {id,ownerId,label:normalizeAccessCodeText(text),status:'created',createdAt:now.toISOString(),updatedAt:now.toISOString(),revision:1};
}
export function transitionAccessCode(record:AccessCodeRecord, next:AccessCodeStatus, actorId:string, now=new Date()):AccessCodeRecord {
  if (record.ownerId !== actorId) throw new Error('Only the owner can edit this record');
  if (!ACCESSCODE_STATES.includes(next)) throw new Error('Unknown status');
  if (record.status === next) return record;
  return {...record,status:next,updatedAt:now.toISOString(),revision:record.revision+1};
}
export function editAccessCode(record:AccessCodeRecord, text:string, actorId:string, now=new Date()):AccessCodeRecord {
  if (record.ownerId !== actorId) throw new Error('Only the owner can edit this record');
  const check=validateAccessCodeText(text);
  if (!check.valid) throw new Error(check.errors.join('; '));
  return {...record,label:normalizeAccessCodeText(text),updatedAt:now.toISOString(),revision:record.revision+1};
}
export function sortAccessCodeNewest(items:readonly AccessCodeRecord[]):AccessCodeRecord[] {
  return [...items].sort((a,b)=>b.createdAt.localeCompare(a.createdAt)||b.id.localeCompare(a.id));
}
export function pageAccessCode(items:readonly AccessCodeRecord[],cursor:string|null,pageSize=20):AccessCodePage {
  if (!Number.isInteger(pageSize)||pageSize<1||pageSize>100) throw new Error('Invalid page size');
  const sorted=sortAccessCodeNewest(items);
  const start=cursor ? sorted.findIndex(item=>item.id===cursor)+1 : 0;
  if(cursor && start===0) throw new Error('Invalid cursor');
  const page=sorted.slice(start,start+pageSize);
  return {items:page,nextCursor:start+pageSize<sorted.length?page[page.length-1]?.id??null:null};
}
export function filterAccessCode(items:readonly AccessCodeRecord[],term:string,status?:AccessCodeStatus):AccessCodeRecord[] {
  const q=term.trim().toLocaleLowerCase();
  return items.filter(item=>(!status||item.status===status)&&(!q||item.label.toLocaleLowerCase().includes(q)));
}
export function mergeAccessCodeUpdates(current:readonly AccessCodeRecord[],incoming:readonly AccessCodeRecord[]):AccessCodeRecord[] {
  const merged=new Map(current.map(item=>[item.id,item]));
  for(const item of incoming){
    const existing=merged.get(item.id);
    if(!existing||item.revision>existing.revision||(item.revision===existing.revision&&item.updatedAt>existing.updatedAt))merged.set(item.id,item);
  }
  return sortAccessCodeNewest([...merged.values()]);
}
export function groupAccessCodeByOwner(items:readonly AccessCodeRecord[]):Record<string,AccessCodeRecord[]> {
  const groups:Record<string,AccessCodeRecord[]>={};
  for(const item of items)(groups[item.ownerId]??=[]).push(item);
  for(const owner of Object.keys(groups))groups[owner]=sortAccessCodeNewest(groups[owner]);
  return groups;
}
export function countAccessCodeByStatus(items:readonly AccessCodeRecord[]):Record<AccessCodeStatus,number> {
  const counts=Object.fromEntries(ACCESSCODE_STATES.map(status=>[status,0])) as Record<AccessCodeStatus,number>;
  for(const item of items)counts[item.status]++;
  return counts;
}
export function isAccessCodeOwner(item:AccessCodeRecord,userId:string|null):boolean {
  return !!userId && item.ownerId===userId;
}
export function assertAccessCodeRevision(item:AccessCodeRecord,expected:number):void {
  if(item.revision!==expected)throw new Error('Record changed since last edit');
}
