import {ChangeDetectionStrategy,Component,EventEmitter,Input,Output,OnChanges,SimpleChanges} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {UiSettings} from './view-models';
type SettingsSection='account'|'privacy'|'notifications'|'appearance'|'security';
@Component({selector:'ms-settings-premium',standalone:true,imports:[CommonModule,FormsModule],templateUrl:'./settings-view.component.html',changeDetection:ChangeDetectionStrategy.OnPush})
export class SettingsPremiumComponent implements OnChanges {
  @Input() value:UiSettings|null=null;@Input() busy=false;@Input() error='';@Input() success='';
  @Output() preferencesSave=new EventEmitter<UiSettings>();
  @Output() passwordChange=new EventEmitter<string>();
  @Output() logout=new EventEmitter<void>();
  @Output() accountExport=new EventEmitter<void>();
  @Output() accountDeletionRequest=new EventEmitter<void>();
  @Output() blockedAccountsOpen=new EventEmitter<void>();
  @Output() sessionManagementOpen=new EventEmitter<void>();
  @Output() mfaManage=new EventEmitter<void>();
  section:SettingsSection='account'; draft:UiSettings|null=null;password='';passwordConfirm='';
  sections:{id:SettingsSection;label:string;icon:string}[]=[{id:'account',label:'Edit profile',icon:'♙'},{id:'privacy',label:'Privacy',icon:'◇'},{id:'notifications',label:'Notifications',icon:'♡'},{id:'appearance',label:'Appearance',icon:'◐'},{id:'security',label:'Security',icon:'⚿'}];
  ngOnChanges(changes:SimpleChanges){if(changes['value'] && this.value) this.draft={...this.value};}
  save(){if(this.draft && !this.busy)this.preferencesSave.emit({...this.draft});}
  changePassword(){if(this.password.length<12||this.password!==this.passwordConfirm)return;this.passwordChange.emit(this.password);}
}
