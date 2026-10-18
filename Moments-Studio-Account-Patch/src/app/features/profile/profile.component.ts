import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SocialApi } from '../../core/social-api.service';
import { AccountMedia, withMedia, friendlyError } from '../../shared/account/account-helpers';

type Profile = {id:string;username:string;display_name:string;bio:string;avatar_path?:string|null;is_private:boolean};
@Component({standalone:true,imports:[CommonModule,RouterLink,FormsModule],templateUrl:'./profile.component.html'})
export class ProfileComponent implements OnInit {
 loading=signal(true); busy=signal(false); error=signal(''); notice=signal('');
 profile=signal<Profile|null>(null); counts=signal({posts:0,followers:0,following:0,saved:0,events:0});
 media=signal<AccountMedia[]>([]); selected=signal<AccountMedia|null>(null); avatar=signal(''); tab=signal<'posts'|'reels'>('posts');
 page=0; more=signal(false); editing=signal(false); editUsername=''; editName=''; editBio='';
 constructor(public api:SocialApi){}
 async ngOnInit(){await this.refresh();}
 async refresh(){
  this.loading.set(true);this.error.set('');
  try{
   const [p,c]=await Promise.all([this.api.profile(),this.api.accountCounts()]);
   this.profile.set(p as Profile);this.counts.set(c);this.editUsername=p.username;this.editName=p.display_name;this.editBio=p.bio;
   this.avatar.set(p.avatar_path?await this.api.signedUrl('social-media',p.avatar_path,900).catch(()=>''):'');
   await this.load(true);
  }catch(e){this.error.set(friendlyError(e));}finally{this.loading.set(false);}
 }
 async load(reset=false){
  if(reset){this.page=0;this.media.set([]);}this.busy.set(true);
  try{
   const rows=await this.api.ownPosts(this.page,18,this.tab()==='reels'?'video':undefined);
   const mapped=await withMedia(this.api,rows);this.media.update(prev=>reset?mapped:[...prev,...mapped]);
   this.more.set(rows.length===18);this.page++;
  }catch(e){this.error.set(friendlyError(e));}finally{this.busy.set(false);}
 }
 async changeTab(t:'posts'|'reels'){this.tab.set(t);this.selected.set(null);await this.load(true);}
 async deleteSelected(){const post=this.selected();if(!post||this.busy())return;
  if(!confirm('Delete this post? This cannot be undone.'))return;
  this.busy.set(true);this.error.set('');
  try{await this.api.deletePost(post.id);this.selected.set(null);this.media.update(rows=>rows.filter(r=>r.id!==post.id));
   this.counts.update(c=>({...c,posts:Math.max(0,c.posts-1)}));this.notice.set('Post deleted.');}
  catch(e){this.error.set(friendlyError(e));}finally{this.busy.set(false);}
 }
 async save(){if(this.busy())return;this.busy.set(true);this.error.set('');
  try{const p=await this.api.updateAccountProfile({username:this.editUsername.trim().toLowerCase(),display_name:this.editName.trim(),bio:this.editBio.trim()});
   this.profile.set(p as Profile);this.editing.set(false);this.notice.set('Profile updated.');
  }catch(e){this.error.set(friendlyError(e));}finally{this.busy.set(false);}
 }
 async uploadAvatar(e:Event){const file=(e.target as HTMLInputElement).files?.[0];if(!file)return;
  if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>5*1024*1024){this.error.set('Choose a JPG, PNG or WebP image up to 5 MB.');return;}
  this.busy.set(true);this.error.set('');
  try{const p=await this.api.updateAvatar(file);this.profile.set(p as Profile);
   this.avatar.set(await this.api.signedUrl('social-media',p.avatar_path,900));this.notice.set('Avatar updated.');
  }catch(err){this.error.set(friendlyError(err));}finally{this.busy.set(false);(e.target as HTMLInputElement).value='';}
 }
}
