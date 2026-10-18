import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { SocialApi } from '../../core/social-api.service';
@Component({
  standalone:true,imports:[CommonModule,FormsModule,RouterLink],
  styles:[`:host{display:block;max-width:800px;margin:auto}.form{padding:24px;border:1px solid #8884;border-radius:18px;display:grid;gap:18px}label{display:grid;gap:8px}textarea,input,select{padding:12px;border-radius:10px;width:100%;border:1px solid #8888;background:var(--surface,#fff);color:inherit}textarea{min-height:140px}.actions{display:flex;gap:12px;flex-wrap:wrap}button{padding:12px 22px;border:0;border-radius:10px;background:#7660d4;color:white;cursor:pointer}button:disabled{opacity:.55;cursor:wait}.preview{max-width:100%;max-height:320px;object-fit:contain;border-radius:10px}.errors{color:#d1495b}.foot{font-size:12px;opacity:.75}`],
  template:`<section class="form"><header><h1>Publish a moment</h1><p>Create a real post with optional image or video. Private posts remain subject to database permissions.</p></header>
  <label for="caption">Caption <span>{{caption.length}} / 2200</span><textarea id="caption" [(ngModel)]="caption" maxlength="2200" placeholder="What would you like to share?"></textarea></label>
  <label for="file">Photo or video (JPEG, PNG, WebP, MP4, WebM)<input id="file" type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" (change)="pick($event)"></label>
  <img *ngIf="preview() && kind()==='image'" [src]="preview()" class="preview" alt="Selected image preview">
  <video *ngIf="preview() && kind()==='video'" [src]="preview()" class="preview" controls playsinline></video>
  <div class="actions"><button (click)="publish()" [disabled]="busy() || (!caption.trim()&&!file)">{{busy()?'Uploading and publishing…':'Publish post'}}</button><a routerLink="/feed">Back to feed</a></div>
  <p role="status" [class.errors]="error()">{{status()}}</p><small class="foot">Your upload runs only while this page remains open. Video streaming/transcoding is not provided.</small></section>`
})
export class CreateComponent {
  caption=''; file?:File; preview=signal(''); kind=signal<'image'|'video'|''>(''); busy=signal(false);error=signal(false);status=signal('');
  constructor(private api:SocialApi,private router:Router){}
  pick(event:Event){const candidate=(event.target as HTMLInputElement).files?.[0];if(this.preview())URL.revokeObjectURL(this.preview());this.file=candidate;this.preview.set(candidate?URL.createObjectURL(candidate):'');this.kind.set(candidate?.type.startsWith('video/')?'video':candidate?'image':'')}
  async publish(){if(this.busy())return;this.busy.set(true);this.error.set(false);this.status.set('');try{if(!this.api.ready)throw Error('Configure Supabase first via Cloud setup.');await this.api.createPost(this.caption,this.file);this.status.set('Published successfully.');this.caption='';if(this.preview())URL.revokeObjectURL(this.preview());this.preview.set('');this.file=undefined;await this.router.navigateByUrl('/feed')}catch(e){this.error.set(true);this.status.set(e instanceof Error?e.message:String(e))}finally{this.busy.set(false)}}
}
