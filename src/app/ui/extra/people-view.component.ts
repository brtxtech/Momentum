import {ChangeDetectionStrategy,Component,EventEmitter,Input,Output} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {UiPerson,UI_AVATAR_FALLBACK} from './view-models';
type PeopleTab='suggested'|'followers'|'following'|'requests';
@Component({selector:'ms-people-premium',standalone:true,imports:[CommonModule,FormsModule],templateUrl:'./people-view.component.html',changeDetection:ChangeDetectionStrategy.OnPush})
export class PeoplePremiumComponent {
  @Input() people:UiPerson[]=[];
  @Input() followRequests:UiPerson[]=[];
  @Input() loading=false;
  @Input() busy=false;
  @Input() error='';
  @Output() peopleSearch=new EventEmitter<string>();
  @Output() followToggle=new EventEmitter<string>();
  @Output() requestApprove=new EventEmitter<string>();
  @Output() requestReject=new EventEmitter<string>();
  @Output() userOpen=new EventEmitter<string>();
  @Output() tabChange=new EventEmitter<PeopleTab>();
  term='';tab:PeopleTab='suggested'; avatar=UI_AVATAR_FALLBACK;
  tabs:{id:PeopleTab;label:string}[]=[{id:'suggested',label:'For you'},{id:'followers',label:'Followers'},{id:'following',label:'Following'},{id:'requests',label:'Requests'}];
  get results(){const q=this.term.toLocaleLowerCase().trim();const records=this.tab==='requests'?this.followRequests:this.tab==='following'?this.people.filter(p=>p.following):this.people;return q?records.filter(p=>`${p.username} ${p.displayName??''}`.toLowerCase().includes(q)):records;}
  changeTab(id:PeopleTab){this.tab=id;this.tabChange.emit(id);}
  onSearch(q:string){this.term=q;this.peopleSearch.emit(q.trim());}
  id=(_:number,p:UiPerson)=>p.id;
}
