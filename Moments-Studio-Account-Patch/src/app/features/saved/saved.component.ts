import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SocialApi } from '../../core/social-api.service';
import { AccountMedia, withMedia, friendlyError } from '../../shared/account/account-helpers';
type SavedRow={post_id:string;created_at:string;posts:AccountMedia & {profiles?:{username:string;display_name:string}|null}};
@Component({standalone:true,imports:[CommonModule,FormsModule,RouterLink],templateUrl:'./saved.component.html'})
export class SavedComponent implements OnInit {
 loading=signal(true);busy=signal(false);error=signal('');
 items=signal<SavedRow[]>([]);filter=signal<'all'|'image'|'video'|'text'>('all');term='';
 page=0;more=signal(false);
 constructor(public api:SocialApi){}
 async ngOnInit(){await this.load(true);}
 async load(reset=false){if(reset){this.page=0;this.items.set([]);}this.loading.set(true);this.error.set('');
  try{const rows=await this.api.savedPage(this.page,18) as SavedRow[];
   const posts=await withMedia(this.api,rows.filter(x=>x.posts).map(x=>x.posts));
   const urlById=new Map(posts.map(p=>[p.id,p.url]));
   const visible=rows.filter(x=>x.posts).map(x=>({...x,posts:{...x.posts,url:urlById.get(x.posts.id)}}));
   this.items.update(old=>reset?visible:[...old,...visible]);this.more.set(rows.length===18);this.page++;
  }catch(e){this.error.set(friendlyError(e));}finally{this.loading.set(false);}
 }
 filtered(){return this.items().filter(row=>{
  const p=row.posts;return (this.filter()==='all'||p.kind===this.filter())&&
  (!this.term.trim()||(p.caption||'').toLowerCase().includes(this.term.toLowerCase())||(p.profiles?.username||'').toLowerCase().includes(this.term.toLowerCase()));
 });}
 async remove(id:string){if(this.busy())return;this.busy.set(true);this.error.set('');
  try{await this.api.unsavePost(id);this.items.update(rows=>rows.filter(r=>r.post_id!==id));}
  catch(e){this.error.set(friendlyError(e));}finally{this.busy.set(false);}
 }
}
