import {ChangeDetectionStrategy,Component,EventEmitter,Input,Output} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {UiQrCode,UiEvent} from './view-models';
export interface QrRequest {kind:'profile'|'post'|'event'|'invite';targetId:string;}
@Component({selector:'ms-qr-premium',standalone:true,imports:[CommonModule,FormsModule],templateUrl:'./qr-view.component.html',changeDetection:ChangeDetectionStrategy.OnPush})
export class QrPremiumComponent {
  @Input() codes:UiQrCode[]=[]; @Input() events:UiEvent[]=[];
  @Input() qrImageUrl=''; @Input() validatedResult=''; @Input() busy=false; @Input() scanning=false; @Input() error='';
  @Output() generate=new EventEmitter<QrRequest>(); @Output() scanToggle=new EventEmitter<boolean>();
  @Output() qrValidate=new EventEmitter<string>(); @Output() qrDownload=new EventEmitter<void>(); @Output() qrShare=new EventEmitter<void>();
  @Output() qrSelect=new EventEmitter<string>();
  kind:QrRequest['kind']='event'; targetId='';inputToken='';
  get targetOptions(){return this.kind==='event'||this.kind==='invite'?this.events:[];}
  request(){if(this.targetId.trim())this.generate.emit({kind:this.kind,targetId:this.targetId.trim()});}
  validate(){if(this.inputToken.trim())this.qrValidate.emit(this.inputToken.trim());}
  id=(_:number,c:UiQrCode)=>c.id;
}
