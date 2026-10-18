/** UI-level checks are advisory. Database RLS is the actual trust boundary. */
export type Audience='public'|'followers'|'event-members'|'owner';
export type MemberRole='owner'|'admin'|'member'|'guest';
export interface AccessContext {userId:string|null;ownerId:string;audience:Audience;isFollower:boolean;isEventMember:boolean;blocked:boolean;}
export function mayView(context:AccessContext):boolean {
 if(context.blocked)return false;
 if(context.userId!==null&&context.userId===context.ownerId)return true;
 switch(context.audience){
  case 'public':return true;
  case 'followers':return !!context.userId&&context.isFollower;
  case 'event-members':return !!context.userId&&context.isEventMember;
  case 'owner':return false;
 }
}
export function mayModify(actorId:string|null,ownerId:string):boolean{return !!actorId&&actorId===ownerId;}
export function mayManageEvent(role:MemberRole|null):boolean{return role==='owner'||role==='admin';}
export function safeRedirectPath(input:string):string {
 if(!input.startsWith('/')||input.startsWith('//')||input.includes('\\')||/[\r\n]/.test(input))return '/feed';
 return input;
}
export function clampPageSize(value:number,max=50):number{
 if(!Number.isFinite(value))return 20;
 return Math.max(1,Math.min(max,Math.floor(value)));
}
export function normalizeUploadName(name:string):string{
 return name.normalize('NFC').replace(/[^a-zA-Z0-9._-]/g,'_').slice(0,100);
}
