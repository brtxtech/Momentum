import {ChangeDetectionStrategy,Component,EventEmitter,Input,Output} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {UiSavedPost} from './view-models';
@Component({selector:'ms-saved-premium',standalone:true,imports:[CommonModule,FormsModule],templateUrl:'./saved-view.component.html',changeDetection:ChangeDetectionStrategy.OnPush})
export class SavedPremiumComponent {
  @Input() saved:UiSavedPost[]=[]; @Input() loading=false; @Input() busy=false; @Input() error='';
  @Output() savedOpen=new EventEmitter<string>(); @Output() savedRemove=new EventEmitter<string>();
  @Output() collectionCreate=new EventEmitter<string>(); @Output() collectionChange=new EventEmitter<string>();
  showNew=false;newName='';search='';selected='all';
  get collections(){return [...new Set(this.saved.map(p=>p.collection).filter((v):v is string=>!!v))];}
  get filtered(){const q=this.search.trim().toLowerCase();return this.saved.filter(p=>(this.selected==='all'||p.collection===this.selected)&&(!q||`${p.caption??''} ${p.author.username}`.toLowerCase().includes(q)));}
  create(){const s=this.newName.trim();if(s){this.collectionCreate.emit(s);this.showNew=false;this.newName='';}}
  choose(v:string){this.selected=v;this.collectionChange.emit(v);}
  id=(_:number,p:UiSavedPost)=>p.id;
}
