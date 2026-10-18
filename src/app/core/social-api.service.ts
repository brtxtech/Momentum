import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
export type TableName = 'profiles'|'posts'|'post_likes'|'post_comments'|'saved_posts'|'follows'|'stories'|'conversations'|'conversation_members'|'messages'|'notifications'|'events'|'event_members'|'event_media'|'invitations'|'support_tickets';
@Injectable({providedIn:'root'})
export class SocialApi {
 constructor(){ try{const config=sessionStorage.getItem('moments-cloud-config');if(config){const {url,key}=JSON.parse(config);this.configure(url,key,false)}}catch{/* Session data may be unavailable; user can reconnect. */} }
 private db:SupabaseClient|null=null;
 get ready(){return !!this.db}
 configure(url:string,key:string,remember=true){if(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url)||!key||key.startsWith('sb_secret_'))throw Error('Use a valid Supabase URL and publishable key');this.db=createClient(url,key,{auth:{persistSession:true,autoRefreshToken:true}});if(remember)try{sessionStorage.setItem('moments-cloud-config',JSON.stringify({url,key}))}catch{/* Optional browser storage */}}
 private client(){if(!this.db)throw Error('Connect Supabase in the Cloud setup page first');return this.db}
 async user(){const {data,error}=await this.client().auth.getUser();if(error)throw error;return data.user}
 async login(email:string,password:string){const {error}=await this.client().auth.signInWithPassword({email,password});if(error)throw error}
 async register(email:string,password:string){const {error}=await this.client().auth.signUp({email,password});if(error)throw error}
 async logout(){const {error}=await this.client().auth.signOut();if(error)throw error}
 private async uid(){const u=await this.user();if(!u)throw Error('Sign in first');return u.id}
 private async run<T>(promise:PromiseLike<{data:T|null,error:any}>):Promise<T>{const {data,error}=await promise;if(error)throw error;return data as T}
 list(table:TableName,limit=30){return this.run(this.client().from(table).select('*').order('created_at',{ascending:false}).limit(limit))}
 async feed(page=0,pageSize=12){return this.run(this.client().from('posts').select('*,profiles(username,display_name,avatar_path),post_likes(user_id),post_comments(id,body,user_id,created_at)').order('created_at',{ascending:false}).range(page*pageSize,(page+1)*pageSize-1))}
 async reels(page=0,pageSize=12){return this.run(this.client().from('posts').select('*,profiles(username,display_name,avatar_path),post_likes(user_id),post_comments(id,body,user_id,created_at)').eq('kind','video').order('created_at',{ascending:false}).range(page*pageSize,(page+1)*pageSize-1))}
 async createPost(caption:string,file?:File,eventId?:string){const userId=await this.uid();if(!caption.trim()&&!file)throw Error('Add text or media');let media_path:string|null=null;let kind='text';if(file){kind=file.type.startsWith('video/')?'video':'image';media_path=await this.upload('social-media',file,userId,kind==='video'?100:15)}try{return await this.run(this.client().from('posts').insert({user_id:userId,caption:caption.trim().slice(0,2200),media_path,kind,event_id:eventId||null}).select().single())}catch(e){if(media_path)await this.client().storage.from('social-media').remove([media_path]);throw e}}
 async editPost(id:string,caption:string){
  const text=caption.trim();if(!text||text.length>2200)throw Error('Caption must contain 1–2200 characters');
  return this.run(this.client().from('posts').update({caption:text}).eq('id',id).eq('user_id',await this.uid()).select().single());
 }
 async editComment(id:string,body:string){
  const text=body.trim();if(!text||text.length>1000)throw Error('Comment must contain 1–1000 characters');
  return this.run(this.client().from('post_comments').update({body:text}).eq('id',id).eq('user_id',await this.uid()).select().single());
 }
 async markAllNotificationsRead(){
  const userId=await this.uid();
  const {error}=await this.client().from('notifications').update({read:true}).eq('user_id',userId).eq('read',false);
  if(error)throw error;
 }
 async deleteMyAccountData(){
  // Deliberately not a self-service auth.users deletion: requires privileged audited backend.
  throw Error('Account deletion requires a configured server-side identity verification workflow.');
 }
 async deletePost(id:string){const userId=await this.uid();const post=await this.run<any>(this.client().from('posts').select('media_path').eq('id',id).eq('user_id',userId).single());await this.run(this.client().from('posts').delete().eq('id',id).eq('user_id',userId).select('id'));if(post?.media_path)await this.client().storage.from('social-media').remove([post.media_path])}
 async toggleRelation(table:'post_likes'|'saved_posts',postId:string){const userId=await this.uid();const existing=await this.run<any[]>(this.client().from(table).select('post_id').eq('post_id',postId).eq('user_id',userId));if(existing.length)await this.run(this.client().from(table).delete().eq('post_id',postId).eq('user_id',userId).select());else await this.run(this.client().from(table).insert({post_id:postId,user_id:userId}).select());return !existing.length}
 async comment(postId:string,body:string){if(!body.trim())throw Error('Comment required');return this.run(this.client().from('post_comments').insert({post_id:postId,user_id:await this.uid(),body:body.trim().slice(0,1000)}).select().single())}
 async explore(term:string,kind:'posts'|'profiles'|'events'){const q=term.trim().slice(0,100).replace(/[%_,]/g,'');const col=kind==='posts'?'caption':kind==='profiles'?'username':'title';return this.run(this.client().from(kind).select('*').ilike(col,`%${q}%`).limit(40))}
 async follow(target:string){const uid=await this.uid();if(uid===target)throw Error('Cannot follow yourself');const found=await this.run<any[]>(this.client().from('follows').select('following_id').eq('follower_id',uid).eq('following_id',target));if(found.length)await this.run(this.client().from('follows').delete().eq('follower_id',uid).eq('following_id',target).select());else await this.run(this.client().from('follows').insert({follower_id:uid,following_id:target,status:'pending'}).select());return !found.length}
 async profile(){return this.run(this.client().from('profiles').select('*').eq('id',await this.uid()).single())}
 async updateProfile(patch:{display_name?:string;bio?:string;is_private?:boolean}){return this.run(this.client().from('profiles').update(patch).eq('id',await this.uid()).select().single())}
 async upload(bucket:'social-media'|'event-private',file:File,owner:string,maxMb:number){const allowed=['image/jpeg','image/png','image/webp','video/mp4','video/webm'];if(!allowed.includes(file.type)||file.size>maxMb*1024*1024||file.size===0)throw Error('Unsupported file or size');const ext=({'image/jpeg':'jpg','image/png':'png','image/webp':'webp','video/mp4':'mp4','video/webm':'webm'} as Record<string,string>)[file.type];const path=`${owner}/${crypto.randomUUID()}.${ext}`;const {error}=await this.client().storage.from(bucket).upload(path,file,{upsert:false,contentType:file.type});if(error)throw error;return path}
 async signedUrl(bucket:'social-media'|'event-private',path:string){const {data,error}=await this.client().storage.from(bucket).createSignedUrl(path,120);if(error)throw error;return data.signedUrl}
 async createStory(file:File){const uid=await this.uid();const media_path=await this.upload('social-media',file,uid,30);return this.run(this.client().from('stories').insert({user_id:uid,media_path,expires_at:new Date(Date.now()+86400000).toISOString()}).select().single())}
 async stories(){return this.run(this.client().from('stories').select('*').gt('expires_at',new Date().toISOString()).order('created_at',{ascending:false}).limit(80))}
 async messages(conversationId:string){return this.run(this.client().from('messages').select('*').eq('conversation_id',conversationId).order('created_at',{ascending:true}).limit(100))}
 async sendMessage(conversationId:string,body:string){if(!body.trim())throw Error('Message required');return this.run(this.client().from('messages').insert({conversation_id:conversationId,sender_id:await this.uid(),body:body.trim().slice(0,4000)}).select().single())}
 watchMessages(conversationId:string,callback:()=>void):RealtimeChannel{return this.client().channel('chat-'+conversationId).on('postgres_changes',{event:'INSERT',schema:'public',table:'messages',filter:`conversation_id=eq.${conversationId}`},callback).subscribe()}
 stop(channel:RealtimeChannel){return this.client().removeChannel(channel)}
 async markRead(id:string){return this.run(this.client().from('notifications').update({read:true}).eq('id',id).eq('user_id',await this.uid()).select().single())}
 async createEvent(title:string,date:string,privacy:'public'|'private'){const uid=await this.uid();return this.run(this.client().from('events').insert({owner_id:uid,title:title.slice(0,120),event_date:date,privacy}).select().single())}
 async pendingEventInvites(){const userId=await this.uid();return this.run<any[]>(this.client().from('event_members').select('event_id,status,role,created_at').eq('user_id',userId).eq('status','invited').order('created_at',{ascending:false}))}
 async invite(eventId:string,guestId:string){return this.run(this.client().from('event_members').insert({event_id:eventId,user_id:guestId,role:'guest',status:'invited'}).select().single())}
 async uploadEvent(eventId:string,file:File){const uid=await this.uid();const media_path=await this.upload('event-private',file,uid,15);return this.run(this.client().from('event_media').insert({event_id:eventId,user_id:uid,storage_path:media_path}).select().single())}
 async saveInvitation(eventId:string,design:object){return this.run(this.client().from('invitations').insert({event_id:eventId,owner_id:await this.uid(),design}).select().single())}
 async issueGuestQr(eventId:string,guestId:string,validHours=24){
  if(!globalThis.crypto?.subtle)throw Error('Secure context required for QR generation (HTTPS or localhost)');
  if(!eventId||!guestId)throw Error('Select a registered event and guest');
  if(!Number.isFinite(validHours)||validHours<=0||validHours>168)throw Error('QR expiry must be 1 hour to 7 days');
  const bytes=new Uint8Array(32);crypto.getRandomValues(bytes);
  const token=Array.from(bytes,v=>v.toString(16).padStart(2,'0')).join('');
  const digest=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token)));
  const hash=Array.from(digest,v=>v.toString(16).padStart(2,'0')).join('');
  const expires=new Date(Date.now()+validHours*3600000).toISOString();
  const {data,error}=await this.client().rpc('issue_event_checkin_token',{p_event_id:eventId,p_guest_id:guestId,p_hash:hash,p_expires_at:expires});
  if(error)throw error;
  return {id:data,token,url:window.location.origin+'/qr?token='+encodeURIComponent(token),expires};
 }
 async redeemGuestQr(value:string){
  const token=value.trim().includes('token=')?new URL(value).searchParams.get('token')||'':value.trim();
  if(!/^[0-9a-f]{64}$/.test(token))throw Error('Invalid QR token');
  const {data,error}=await this.client().rpc('redeem_event_checkin_token',{p_token:token});
  if(error)throw error;
  return {eventId:data};
 }
 async support(subject:string,body:string){return this.run(this.client().from('support_tickets').insert({user_id:await this.uid(),subject:subject.slice(0,150),body:body.slice(0,5000)}).select().single())}
 async insights(){
  const uid=await this.uid();
  const [postResult,followerResult,eventResult]=await Promise.all([
   this.client().from('posts').select('id',{count:'exact',head:true}).eq('user_id',uid),
   this.client().from('follows').select('follower_id',{count:'exact',head:true}).eq('following_id',uid).eq('status','approved'),
   this.client().from('events').select('id',{count:'exact',head:true}).eq('owner_id',uid)
  ]);
  const errors=[postResult.error,followerResult.error,eventResult.error].filter(Boolean);
  if(errors.length)throw errors[0];
  return {posts:postResult.count??0,followers:followerResult.count??0,events:eventResult.count??0};
 }
 /** Pending requests addressed to the authenticated user; the server RLS policy must enforce membership visibility. */
 async followersPending(){
  const userId=await this.uid();
  return this.run<any[]>(this.client().from('follows')
   .select('follower_id,following_id,status,created_at,profiles!follows_follower_id_fkey(username,display_name,avatar_path)')
   .eq('following_id',userId)
   .eq('status','pending')
   .order('created_at',{ascending:false})
   .limit(100));
 }
 async approveFollower(followerId:string){return this.run(this.client().from('follows').update({status:'approved'}).eq('following_id',await this.uid()).eq('follower_id',followerId).select().single())}
 async acceptEventInvite(eventId:string){const {error}=await this.client().rpc('accept_event_invite',{p_event_id:eventId});if(error)throw error}
 async conversations(){const uid=await this.uid();const memberships=await this.run<any[]>(this.client().from('conversation_members').select('conversation_id').eq('user_id',uid));const ids=memberships.map(x=>x.conversation_id);if(!ids.length)return [];return this.run<any[]>(this.client().from('conversations').select('*').in('id',ids).order('created_at',{ascending:false}))}
 async createConversation(otherId:string){const {data,error}=await this.client().rpc('start_conversation',{other_user:otherId});if(error)throw error;return {id:data}}
 async notifications(){return this.run<any[]>(this.client().from('notifications').select('*').order('created_at',{ascending:false}).limit(100))}
 async saved(){const uid=await this.uid();return this.run<any[]>(this.client().from('saved_posts').select('post_id,posts(*)').eq('user_id',uid).limit(100))}
 async events(){return this.run<any[]>(this.client().from('events').select('*').order('created_at',{ascending:false}).limit(100))}
 async eventMedia(eventId:string){return this.run<any[]>(this.client().from('event_media').select('*').eq('event_id',eventId).order('created_at',{ascending:false}))}
 async invitations(eventId:string){return this.run<any[]>(this.client().from('invitations').select('*').eq('event_id',eventId).order('created_at',{ascending:false}))}
 async updateInvitation(id:string,design:object){return this.run(this.client().from('invitations').update({design}).eq('id',id).eq('owner_id',await this.uid()).select().single())}
 async deleteEventMedia(id:string,_untrustedPath:string){const record=await this.run<any>(this.client().from('event_media').select('storage_path').eq('id',id).single());await this.run(this.client().from('event_media').delete().eq('id',id).select('id'));const {error}=await this.client().storage.from('event-private').remove([record.storage_path]);if(error)throw new Error('Record deleted but storage cleanup failed: '+error.message)}
 async updateAvatar(file:File){const uid=await this.uid();const avatar_path=await this.upload('social-media',file,uid,5);return this.run(this.client().from('profiles').update({avatar_path}).eq('id',uid).select().single())}
 async preferences(){const uid=await this.uid();return this.run<any>(this.client().from('user_preferences').select('*').eq('user_id',uid).maybeSingle())}
 async savePreferences(theme:'light'|'dark'|'system',reducedMotion:boolean){const uid=await this.uid();return this.run(this.client().from('user_preferences').upsert({user_id:uid,theme,reduced_motion:reducedMotion}).select().single())}
 async deleteStory(id:string){return this.run(this.client().from('stories').delete().eq('id',id).eq('user_id',await this.uid()).select('id'))}
 async deleteMessage(id:string){return this.run(this.client().from('messages').delete().eq('id',id).eq('sender_id',await this.uid()).select('id'))}
 async deleteComment(id:string){return this.run(this.client().from('post_comments').delete().eq('id',id).eq('user_id',await this.uid()).select('id'))}
 async requestPasswordReset(email:string){const {error}=await this.client().auth.resetPasswordForEmail(email);if(error)throw error}
 async changePassword(password:string){if(password.length<12)throw Error('Use at least 12 characters');const {error}=await this.client().auth.updateUser({password});if(error)throw error}
 async listSupport(){return this.run<any[]>(this.client().from('support_tickets').select('*').order('created_at',{ascending:false}))}

}
