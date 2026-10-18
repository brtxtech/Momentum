import {ChangeDetectionStrategy,Component,EventEmitter,Input,Output} from '@angular/core';
import {CommonModule} from '@angular/common';
import {UiMedia,UiEvent} from './view-models';
@Component({selector:'ms-gallery-premium',standalone:true,imports:[CommonModule],templateUrl:'./gallery-view.component.html',changeDetection:ChangeDetectionStrategy.OnPush})
export class GalleryPremiumComponent {
  @Input() media:UiMedia[]=[];
  @Input() events:UiEvent[]=[];
  @Input() activeEventId='';
  @Input() canUpload=false;
  @Input() loading=false;
  @Input() busy=false;
  @Input() error='';
  @Output() eventChange=new EventEmitter<string>();
  @Output() galleryOpen=new EventEmitter<string>();
  @Output() galleryDownload=new EventEmitter<string>();
  @Output() galleryDelete=new EventEmitter<string>();
  @Output() uploadRequested=new EventEmitter<File[]>();
  filter:'all'|'image'|'video'='all'; selection=false;selected=new Set<string>();
  get filtered(){return this.media.filter(m=>(this.filter==='all'||m.type===this.filter)&&(!this.activeEventId||m.eventId===this.activeEventId));}
  toggle(id:string){const next=new Set(this.selected);next.has(id)?next.delete(id):next.add(id);this.selected=next;}
  open(m:UiMedia){this.selection?this.toggle(m.id):this.galleryOpen.emit(m.id);}
  upload(event:Event){const input=event.target as HTMLInputElement;const files=Array.from(input.files||[]);if(files.length)this.uploadRequested.emit(files);input.value='';}
  id=(_:number,m:{id:string})=>m.id;
}
