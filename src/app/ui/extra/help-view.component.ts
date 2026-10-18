import {ChangeDetectionStrategy,Component,EventEmitter,Input,Output} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {UiHelpArticle} from './view-models';
@Component({selector:'ms-help-premium',standalone:true,imports:[CommonModule,FormsModule],templateUrl:'./help-view.component.html',changeDetection:ChangeDetectionStrategy.OnPush})
export class HelpPremiumComponent {
  @Input() articles:UiHelpArticle[]=[]; @Input() loading=false; @Input() busy=false; @Input() error=''; @Input() success='';
  @Output() articleOpen=new EventEmitter<string>();
  @Output() supportSubmit=new EventEmitter<{subject:string;body:string}>();
  @Output() safetyReport=new EventEmitter<void>();
  @Output() privacyOpen=new EventEmitter<void>();
  search='';category='All';expanded=new Set<string>();showContact=false;subject='';body='';
  get categories(){return ['All',...new Set(this.articles.map(a=>a.category))];}
  get filtered(){const q=this.search.trim().toLowerCase();return this.articles.filter(a=>(this.category==='All'||a.category===this.category)&&(!q||`${a.title} ${a.body} ${a.category}`.toLowerCase().includes(q)));}
  toggle(article:UiHelpArticle){const s=new Set(this.expanded);s.has(article.id)?s.delete(article.id):s.add(article.id);this.expanded=s;this.articleOpen.emit(article.id);}
  submit(){if(this.subject.trim().length<3||this.body.trim().length<10||this.busy)return;this.supportSubmit.emit({subject:this.subject.trim(),body:this.body.trim()});}
  id=(_:number,a:UiHelpArticle)=>a.id;
}
