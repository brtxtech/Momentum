import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiNotification, UI_AVATAR_FALLBACK } from './view-models';

type ActivityFilter = 'all'|'follows'|'comments'|'likes'|'mentions'|'events'|'security';
@Component({selector:'ms-activity-premium',standalone:true,imports:[CommonModule],templateUrl:'./notifications-view.component.html',changeDetection:ChangeDetectionStrategy.OnPush})
export class ActivityPremiumComponent {
  @Input() notices:UiNotification[]=[];
  @Input() busy=false;
  @Input() loading=false;
  @Input() error='';
  @Output() notificationOpen=new EventEmitter<UiNotification>();
  @Output() markRead=new EventEmitter<string>();
  @Output() markAllRead=new EventEmitter<void>();
  @Output() followApprove=new EventEmitter<string>();
  @Output() followReject=new EventEmitter<string>();
  @Output() filterChanged=new EventEmitter<ActivityFilter>();
  filter:ActivityFilter='all';
  filters:{id:ActivityFilter;label:string}[]=[{id:'all',label:'All'},{id:'follows',label:'Following'},{id:'comments',label:'Comments'},{id:'likes',label:'Likes'},{id:'mentions',label:'Mentions'},{id:'events',label:'Events'},{id:'security',label:'Security'}];
  avatar=UI_AVATAR_FALLBACK;
  get unread(){return this.notices.filter(n=>!n.read).length;}
  private allows(item:UiNotification) {
    return this.filter==='all' || (this.filter==='follows'&&['follow','request'].includes(item.kind)) || (this.filter==='comments'&&item.kind==='comment') || (this.filter==='likes'&&item.kind==='like') || (this.filter==='mentions'&&item.kind==='mention') || (this.filter==='events'&&item.kind==='event') || (this.filter==='security'&&item.kind==='security');
  }
  get filtered(){return this.notices.filter(n=>this.allows(n));}
  get today(){return this.filtered.filter(n=>this.daysOld(n.timestamp)<1);}
  get thisWeek(){return this.filtered.filter(n=>{const d=this.daysOld(n.timestamp);return d>=1&&d<7});}
  get earlier(){return this.filtered.filter(n=>this.daysOld(n.timestamp)>=7);}
  daysOld(timestamp:string){const time=Date.parse(timestamp);return Number.isFinite(time)?Math.max(0,(Date.now()-time)/86400000):Infinity;}
  choose(filter:ActivityFilter){this.filter=filter;this.filterChanged.emit(filter);}
  open(n:UiNotification){if(!n.read)this.markRead.emit(n.id);this.notificationOpen.emit(n);}
  id=(_:number,n:UiNotification)=>n.id;
}
