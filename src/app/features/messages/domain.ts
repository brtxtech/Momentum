/** Message domain rules. Pure and testable; not a substitute for server-side authorization. */
export type MessageStatus = 'draft' | 'sent' | 'delivered' | 'read';
export interface MessageRecord {
  id: string;
  ownerId: string;
  body: string;
  status: MessageStatus;
  createdAt: string;
  updatedAt: string;
  revision: number;
}
export interface MessagePage { items: MessageRecord[]; nextCursor: string | null; }
export interface MessageValidation { valid: boolean; errors: string[]; }
export const MESSAGE_TEXT_LIMIT = 4000;
export const MESSAGE_STATES: readonly MessageStatus[] = ["draft", "sent", "delivered", "read"];
export const MESSAGE_MIME_TYPES: readonly string[] = [];
export function normalizeMessageText(input: string): string {
  return input.normalize('NFC').replace(/\r\n?/g, '\n').trim();
}
export function validateMessageText(input: unknown): MessageValidation {
  const errors: string[] = [];
  if (typeof input !== 'string') return {valid: false, errors: ['Text must be a string']};
  const value = normalizeMessageText(input);
  if (!value) errors.push('Text is required');
  if (value.length > MESSAGE_TEXT_LIMIT) errors.push('Text exceeds 4000 characters');
  if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)) errors.push('Text contains control characters');
  return {valid: errors.length === 0, errors};
}
export function validateMessageFile(file: {type:string;size:number}, maxBytes=20*1024*1024): MessageValidation {
  const errors: string[] = [];
  if (!Number.isFinite(file.size) || file.size <= 0) errors.push('File is empty');
  if (file.size > maxBytes) errors.push('File is too large');
  if (MESSAGE_MIME_TYPES.length && !MESSAGE_MIME_TYPES.includes(file.type)) errors.push('Unsupported media format');
  return {valid: errors.length === 0, errors};
}
export function createMessageDraft(ownerId:string, text:string, id:string, now=new Date()): MessageRecord {
  if (!ownerId || !id) throw new Error('Owner and record identifier required');
  const check=validateMessageText(text);
  if (!check.valid) throw new Error(check.errors.join('; '));
  return {id,ownerId,body:normalizeMessageText(text),status:'draft',createdAt:now.toISOString(),updatedAt:now.toISOString(),revision:1};
}
export function transitionMessage(record:MessageRecord, next:MessageStatus, actorId:string, now=new Date()):MessageRecord {
  if (record.ownerId !== actorId) throw new Error('Only the owner can edit this record');
  if (!MESSAGE_STATES.includes(next)) throw new Error('Unknown status');
  if (record.status === next) return record;
  return {...record,status:next,updatedAt:now.toISOString(),revision:record.revision+1};
}
export function editMessage(record:MessageRecord, text:string, actorId:string, now=new Date()):MessageRecord {
  if (record.ownerId !== actorId) throw new Error('Only the owner can edit this record');
  const check=validateMessageText(text);
  if (!check.valid) throw new Error(check.errors.join('; '));
  return {...record,body:normalizeMessageText(text),updatedAt:now.toISOString(),revision:record.revision+1};
}
export function sortMessageNewest(items:readonly MessageRecord[]):MessageRecord[] {
  return [...items].sort((a,b)=>b.createdAt.localeCompare(a.createdAt)||b.id.localeCompare(a.id));
}
export function pageMessage(items:readonly MessageRecord[],cursor:string|null,pageSize=20):MessagePage {
  if (!Number.isInteger(pageSize)||pageSize<1||pageSize>100) throw new Error('Invalid page size');
  const sorted=sortMessageNewest(items);
  const start=cursor ? sorted.findIndex(item=>item.id===cursor)+1 : 0;
  if(cursor && start===0) throw new Error('Invalid cursor');
  const page=sorted.slice(start,start+pageSize);
  return {items:page,nextCursor:start+pageSize<sorted.length?page[page.length-1]?.id??null:null};
}
export function filterMessage(items:readonly MessageRecord[],term:string,status?:MessageStatus):MessageRecord[] {
  const q=term.trim().toLocaleLowerCase();
  return items.filter(item=>(!status||item.status===status)&&(!q||item.body.toLocaleLowerCase().includes(q)));
}
export function mergeMessageUpdates(current:readonly MessageRecord[],incoming:readonly MessageRecord[]):MessageRecord[] {
  const merged=new Map(current.map(item=>[item.id,item]));
  for(const item of incoming){
    const existing=merged.get(item.id);
    if(!existing||item.revision>existing.revision||(item.revision===existing.revision&&item.updatedAt>existing.updatedAt))merged.set(item.id,item);
  }
  return sortMessageNewest([...merged.values()]);
}
export function groupMessageByOwner(items:readonly MessageRecord[]):Record<string,MessageRecord[]> {
  const groups:Record<string,MessageRecord[]>={};
  for(const item of items)(groups[item.ownerId]??=[]).push(item);
  for(const owner of Object.keys(groups))groups[owner]=sortMessageNewest(groups[owner]);
  return groups;
}
export function countMessageByStatus(items:readonly MessageRecord[]):Record<MessageStatus,number> {
  const counts=Object.fromEntries(MESSAGE_STATES.map(status=>[status,0])) as Record<MessageStatus,number>;
  for(const item of items)counts[item.status]++;
  return counts;
}
export function isMessageOwner(item:MessageRecord,userId:string|null):boolean {
  return !!userId && item.ownerId===userId;
}
export function assertMessageRevision(item:MessageRecord,expected:number):void {
  if(item.revision!==expected)throw new Error('Record changed since last edit');
}
