import {ChangeDetectionStrategy,Component,EventEmitter,Input,Output} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {UiProfile,UiMedia,UI_AVATAR_FALLBACK} from './view-models';
type ProfileTab='posts'|'reels'|'tagged'|'saved';
@Component({selector:'ms-account-profile-premium',standalone:true,imports:[CommonModule,FormsModule],templateUrl:'./profile-view.component.html',changeDetection:ChangeDetectionStrategy.OnPush})
export class ProfilePremiumComponent {
  @Input() profile:UiProfile|null=null; @Input() media:UiMedia[]=[]; @Input() taggedMedia:UiMedia[]=[]; @Input() savedMedia:UiMedia[]=[];
  @Input() loading=false; @Input() busy=false; @Input() error='';
  @Output() editProfile=new EventEmitter<void>(); @Output() avatarUpload=new EventEmitter<File>();
  @Output() highlightOpen=new EventEmitter<string>(); @Output() highlightCreate=new EventEmitter<void>();
  @Output() postOpen=new EventEmitter<string>(); @Output() followToggle=new EventEmitter<string>();
  @Output() messageOpen=new EventEmitter<string>(); @Output() profileShare=new EventEmitter<string>();
  @Output() profileTabChange=new EventEmitter<ProfileTab>(); @Output() followersOpen=new EventEmitter<void>(); @Output() followingOpen=new EventEmitter<void>();
  tab:ProfileTab='posts';avatar=UI_AVATAR_FALLBACK;
  get displayedMedia(){return this.tab==='reels'?this.media.filter(m=>m.type==='video'):this.tab==='tagged'?this.taggedMedia:this.tab==='saved'?this.savedMedia:this.media;}
  chooseTab(tab:ProfileTab){this.tab=tab;this.profileTabChange.emit(tab);}
  pickAvatar(event:Event){const input=event.target as HTMLInputElement;const file=input.files?.[0];if(file)this.avatarUpload.emit(file);input.value='';}
  id=(_:number,item:{id:string})=>item.id;
}
