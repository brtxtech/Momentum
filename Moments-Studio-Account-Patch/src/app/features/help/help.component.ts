import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SocialApi } from '../../core/social-api.service';
import { friendlyError } from '../../shared/account/account-helpers';
type Article={title:string;answer:string;category:string};
@Component({standalone:true,imports:[CommonModule,FormsModule,RouterLink],templateUrl:'./help.component.html'})
export class HelpComponent implements OnInit {
 readonly articles:Article[]=[
  {category:'Privacy',title:'Who can see my posts?',answer:'Public profiles may be visible to signed-in accounts; private profiles require approved followers. Event access is separately checked by Supabase RLS. Always verify your database policies.'},
  {category:'Privacy',title:'Are event galleries private?',answer:'Event images live in private storage. A server authorization rule must confirm event membership before access; a client-side toggle alone is insufficient.'},
  {category:'Account',title:'How can I edit my profile?',answer:'Open Profile and choose Edit profile. You can change your username, name, biography and avatar.'},
  {category:'Account',title:'How do I change my password?',answer:'Open Settings, enter and confirm a new password of at least 12 characters, and save.'},
  {category:'Social',title:'How do I unsave a post?',answer:'Open Saved and select Remove on the post. It will be removed from your private saved collection.'},
  {category:'Safety',title:'How do I report a concern?',answer:'Use the support form below, include the relevant post or profile link and describe the concern. Do not include passwords or other secrets.'},
  {category:'Safety',title:'What should I do about a suspicious login?',answer:'Change your password and review your authentication provider settings. Contact the platform operator if you cannot access your account.'},
  {category:'Media',title:'Why does a photo stop loading?',answer:'Private media uses short-lived signed URLs. Reload the page to request a fresh authorized URL.'}
 ];
 term='';category=signal('All');expanded=signal<string|null>(null);subject='';body='';
 sending=signal(false);loading=signal(true);error=signal('');notice=signal('');
 tickets=signal<Array<{id:string;subject:string;created_at:string}>>([]);signedIn=signal(false);
 constructor(public api:SocialApi){}
 filtered(){const term=this.term.trim().toLowerCase();return this.articles.filter(a=>(this.category()==='All'||a.category===this.category())&&(!term||(a.title+' '+a.answer).toLowerCase().includes(term)));}
 async ngOnInit(){if(this.api.ready){try{this.signedIn.set(!!(await this.api.user()));}catch{this.signedIn.set(false);}}
  if(this.signedIn())await this.refreshTickets();else this.loading.set(false);}
 async refreshTickets(){this.loading.set(true);try{this.tickets.set(await this.api.recentSupportTickets());}
  catch(e){this.error.set(friendlyError(e));}finally{this.loading.set(false);}}
 async send(){this.error.set('');this.notice.set('');
  const title=this.subject.trim(),message=this.body.trim();
  if(!title||title.length>150||message.length<10||message.length>5000){this.error.set('Add a subject (up to 150 characters) and a message of 10–5000 characters.');return;}
  this.sending.set(true);try{await this.api.support(title,message);this.subject='';this.body='';this.notice.set('Your support request was submitted.');await this.refreshTickets();}
  catch(e){this.error.set(friendlyError(e));}finally{this.sending.set(false);}}
}
