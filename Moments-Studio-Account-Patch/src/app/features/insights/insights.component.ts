import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SocialApi } from '../../core/social-api.service';
import { chartHeight, friendlyError } from '../../shared/account/account-helpers';
type Day={date:string;count:number};
@Component({standalone:true,imports:[CommonModule],templateUrl:'./insights.component.html'})
export class InsightsComponent implements OnInit {
 loading=signal(true);error=signal('');counts=signal({posts:0,followers:0,following:0,saved:0,events:0});
 days=signal<Day[]>([]);range=signal<7|14|30>(7);height=chartHeight;
 constructor(public api:SocialApi){}
 async ngOnInit(){await this.reload();}
 async reload(){this.loading.set(true);this.error.set('');try{
  const [counts,days]=await Promise.all([this.api.accountCounts(),this.api.ownDailyPostCounts(this.range())]);
  this.counts.set(counts);this.days.set(days);
 }catch(e){this.error.set(friendlyError(e));}finally{this.loading.set(false);}}
 max(){return Math.max(1,...this.days().map(d=>d.count));}
 total(){return this.days().reduce((a,b)=>a+b.count,0);}
 async choose(n:7|14|30){this.range.set(n);await this.reload();}
}
