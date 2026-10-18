import {ChangeDetectionStrategy,Component,EventEmitter,Input,Output} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {UiEvent} from './view-models';
type EventTab='upcoming'|'attending'|'past';
@Component({selector:'ms-events-premium',standalone:true,imports:[CommonModule,FormsModule],templateUrl:'./events-view.component.html',changeDetection:ChangeDetectionStrategy.OnPush})
export class EventsPremiumComponent {
  @Input() events:UiEvent[]=[];
  @Input() loading=false;
  @Input() busy=false;
  @Input() error='';
  @Output() eventOpen=new EventEmitter<string>();
  @Output() eventCreate=new EventEmitter<{title:string;date:string;location:string;privacy:'private'|'public';description:string}>();
  @Output() eventRsvp=new EventEmitter<string>();
  @Output() eventInvite=new EventEmitter<string>();
  @Output() eventShare=new EventEmitter<string>();
  tab:EventTab='upcoming';search='';showCreate=false;title='';date='';location='';description='';privacy:'public'|'private'='private';
  get list(){const q=this.search.trim().toLowerCase();return this.events.filter(e=>{
    const state=e.status??(Date.parse(e.startsAt)<Date.now()?'past':'upcoming');
    return (this.tab==='attending'?e.going:this.tab===state) && (!q || `${e.title} ${e.location??''}`.toLowerCase().includes(q));
  });}
  create(){if(!this.title.trim()||!this.date)return;this.eventCreate.emit({title:this.title.trim(),date:this.date,location:this.location.trim(),privacy:this.privacy,description:this.description.trim()});}
  id=(_:number,e:UiEvent)=>e.id;
}
