import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SocialApi } from '../../core/social-api.service';
import { friendlyError } from '../../shared/account/account-helpers';
type Theme='light'|'dark'|'system';type Lang='en'|'es'|'fr';
@Component({standalone:true,imports:[CommonModule,FormsModule],templateUrl:'./settings.component.html'})
export class SettingsComponent implements OnInit {
 loading=signal(true);saving=signal(false);error=signal('');notice=signal('');
 privateAccount=false;theme:Theme='system';reducedMotion=false;language:Lang='en';
 emailNotifications=true;messageNotifications=true;password='';confirmPassword='';
 constructor(public api:SocialApi,private router:Router){}
 async ngOnInit(){this.loading.set(true);this.error.set('');try{
  const [p,pref]=await Promise.all([this.api.profile(),this.api.preferences()]);
  this.privateAccount=!!p.is_private;this.theme=pref?.theme??'system';this.reducedMotion=!!pref?.reduced_motion;
  this.language=pref?.language??'en';this.emailNotifications=pref?.email_notifications??true;this.messageNotifications=pref?.message_notifications??true;
 this.applyAppearance();
 }catch(e){this.error.set(friendlyError(e));}finally{this.loading.set(false);}}
 private applyAppearance(){const root=document.documentElement;
  root.dataset['theme']=this.theme==='system'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):this.theme;
  root.dataset['motion']=this.reducedMotion?'reduced':'normal';
 }
 async save(){this.saving.set(true);this.error.set('');this.notice.set('');try{
  await this.api.updateAccountProfile({is_private:this.privateAccount});
  await this.api.saveAccountPreferences({theme:this.theme,reduced_motion:this.reducedMotion,language:this.language,email_notifications:this.emailNotifications,message_notifications:this.messageNotifications});
  this.applyAppearance();this.notice.set('Preferences saved to your account.');
 }catch(e){this.error.set(friendlyError(e));}finally{this.saving.set(false);}}
 async changePassword(){this.error.set('');this.notice.set('');
  if(this.password.length<12){this.error.set('Use at least 12 characters.');return;}
  if(this.password!==this.confirmPassword){this.error.set('Passwords do not match.');return;}
  this.saving.set(true);try{await this.api.changePassword(this.password);this.password='';this.confirmPassword='';this.notice.set('Password updated.');}
  catch(e){this.error.set(friendlyError(e));}finally{this.saving.set(false);}
 }
 async logout(){this.saving.set(true);try{await this.api.logout();await this.router.navigateByUrl('/cloud');}
  catch(e){this.error.set(friendlyError(e));}finally{this.saving.set(false);}}
}
