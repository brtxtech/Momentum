import {ChangeDetectionStrategy,Component,EventEmitter,Input,Output} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {UiEvent,UiInvitation} from './view-models';
export interface InvitationSave {id?:string;eventId:string;title:string;body:string;theme:string;names:string;dateLine:string;venue:string;}
@Component({selector:'ms-invitations-premium',standalone:true,imports:[CommonModule,FormsModule],templateUrl:'./invitations-view.component.html',changeDetection:ChangeDetectionStrategy.OnPush})
export class InvitationsPremiumComponent {
  @Input() invitations:UiInvitation[]=[];
  @Input() events:UiEvent[]=[];
  @Input() loading=false;
  @Input() busy=false;
  @Input() error='';
  @Output() invitationSave=new EventEmitter<InvitationSave>();
  @Output() invitationSelect=new EventEmitter<string>();
  @Output() invitationPrint=new EventEmitter<InvitationSave>();
  @Output() invitationDelete=new EventEmitter<string>();
  @Output() invitationShare=new EventEmitter<string>();
  themes=[{id:'ivory',label:'Ivory',description:'Modern minimal'},{id:'rose',label:'Blush',description:'Romantic florals'},{id:'midnight',label:'Midnight',description:'Elegant evening'},{id:'sage',label:'Sage',description:'Garden party'},{id:'classic',label:'Classic',description:'Timeless editorial'},{id:'gold',label:'Gilded',description:'Luxury celebration'}];
  eventId='';selectedId='';title='The Celebration';names='';body='Together with their families, request the pleasure of your company';dateLine='';venue='';theme='ivory';activeTab:'design'|'saved'='design';
  get draft():InvitationSave {return {id:this.selectedId||undefined,eventId:this.eventId,title:this.title.trim(),body:this.body.trim(),theme:this.theme,names:this.names.trim(),dateLine:this.dateLine.trim(),venue:this.venue.trim()};}
  edit(item:UiInvitation){this.selectedId=item.id;this.eventId=item.eventId;this.title=item.title;this.body=item.body;this.theme=item.theme;this.activeTab='design';this.invitationSelect.emit(item.id);}
  save(){if(!this.eventId||!this.title.trim())return;this.invitationSave.emit(this.draft);}
  id=(_:number,i:{id:string})=>i.id;
}
