/** Metric domain rules. Pure and testable; not a substitute for server-side authorization. */
export type MetricStatus = 'pending' | 'computed' | 'stale';
export interface MetricRecord {
  id: string;
  ownerId: string;
  label: string;
  status: MetricStatus;
  createdAt: string;
  updatedAt: string;
  revision: number;
}
export interface MetricPage { items: MetricRecord[]; nextCursor: string | null; }
export interface MetricValidation { valid: boolean; errors: string[]; }
export const METRIC_TEXT_LIMIT = 120;
export const METRIC_STATES: readonly MetricStatus[] = ["pending", "computed", "stale"];
export const METRIC_MIME_TYPES: readonly string[] = [];
export function normalizeMetricText(input: string): string {
  return input.normalize('NFC').replace(/\r\n?/g, '\n').trim();
}
export function validateMetricText(input: unknown): MetricValidation {
  const errors: string[] = [];
  if (typeof input !== 'string') return {valid: false, errors: ['Text must be a string']};
  const value = normalizeMetricText(input);
  if (!value) errors.push('Text is required');
  if (value.length > METRIC_TEXT_LIMIT) errors.push('Text exceeds 120 characters');
  if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)) errors.push('Text contains control characters');
  return {valid: errors.length === 0, errors};
}
export function validateMetricFile(file: {type:string;size:number}, maxBytes=20*1024*1024): MetricValidation {
  const errors: string[] = [];
  if (!Number.isFinite(file.size) || file.size <= 0) errors.push('File is empty');
  if (file.size > maxBytes) errors.push('File is too large');
  if (METRIC_MIME_TYPES.length && !METRIC_MIME_TYPES.includes(file.type)) errors.push('Unsupported media format');
  return {valid: errors.length === 0, errors};
}
export function createMetricDraft(ownerId:string, text:string, id:string, now=new Date()): MetricRecord {
  if (!ownerId || !id) throw new Error('Owner and record identifier required');
  const check=validateMetricText(text);
  if (!check.valid) throw new Error(check.errors.join('; '));
  return {id,ownerId,label:normalizeMetricText(text),status:'pending',createdAt:now.toISOString(),updatedAt:now.toISOString(),revision:1};
}
export function transitionMetric(record:MetricRecord, next:MetricStatus, actorId:string, now=new Date()):MetricRecord {
  if (record.ownerId !== actorId) throw new Error('Only the owner can edit this record');
  if (!METRIC_STATES.includes(next)) throw new Error('Unknown status');
  if (record.status === next) return record;
  return {...record,status:next,updatedAt:now.toISOString(),revision:record.revision+1};
}
export function editMetric(record:MetricRecord, text:string, actorId:string, now=new Date()):MetricRecord {
  if (record.ownerId !== actorId) throw new Error('Only the owner can edit this record');
  const check=validateMetricText(text);
  if (!check.valid) throw new Error(check.errors.join('; '));
  return {...record,label:normalizeMetricText(text),updatedAt:now.toISOString(),revision:record.revision+1};
}
export function sortMetricNewest(items:readonly MetricRecord[]):MetricRecord[] {
  return [...items].sort((a,b)=>b.createdAt.localeCompare(a.createdAt)||b.id.localeCompare(a.id));
}
export function pageMetric(items:readonly MetricRecord[],cursor:string|null,pageSize=20):MetricPage {
  if (!Number.isInteger(pageSize)||pageSize<1||pageSize>100) throw new Error('Invalid page size');
  const sorted=sortMetricNewest(items);
  const start=cursor ? sorted.findIndex(item=>item.id===cursor)+1 : 0;
  if(cursor && start===0) throw new Error('Invalid cursor');
  const page=sorted.slice(start,start+pageSize);
  return {items:page,nextCursor:start+pageSize<sorted.length?page[page.length-1]?.id??null:null};
}
export function filterMetric(items:readonly MetricRecord[],term:string,status?:MetricStatus):MetricRecord[] {
  const q=term.trim().toLocaleLowerCase();
  return items.filter(item=>(!status||item.status===status)&&(!q||item.label.toLocaleLowerCase().includes(q)));
}
export function mergeMetricUpdates(current:readonly MetricRecord[],incoming:readonly MetricRecord[]):MetricRecord[] {
  const merged=new Map(current.map(item=>[item.id,item]));
  for(const item of incoming){
    const existing=merged.get(item.id);
    if(!existing||item.revision>existing.revision||(item.revision===existing.revision&&item.updatedAt>existing.updatedAt))merged.set(item.id,item);
  }
  return sortMetricNewest([...merged.values()]);
}
export function groupMetricByOwner(items:readonly MetricRecord[]):Record<string,MetricRecord[]> {
  const groups:Record<string,MetricRecord[]>={};
  for(const item of items)(groups[item.ownerId]??=[]).push(item);
  for(const owner of Object.keys(groups))groups[owner]=sortMetricNewest(groups[owner]);
  return groups;
}
export function countMetricByStatus(items:readonly MetricRecord[]):Record<MetricStatus,number> {
  const counts=Object.fromEntries(METRIC_STATES.map(status=>[status,0])) as Record<MetricStatus,number>;
  for(const item of items)counts[item.status]++;
  return counts;
}
export function isMetricOwner(item:MetricRecord,userId:string|null):boolean {
  return !!userId && item.ownerId===userId;
}
export function assertMetricRevision(item:MetricRecord,expected:number):void {
  if(item.revision!==expected)throw new Error('Record changed since last edit');
}
