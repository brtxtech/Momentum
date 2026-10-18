import {ChangeDetectionStrategy,Component,EventEmitter,Input,Output} from '@angular/core';
import {CommonModule} from '@angular/common';
import {UiInsight,UiInsightPoint} from './view-models';
type Range='7d'|'30d'|'90d';
@Component({selector:'ms-insights-premium',standalone:true,imports:[CommonModule],templateUrl:'./insights-view.component.html',changeDetection:ChangeDetectionStrategy.OnPush})
export class InsightsPremiumComponent {
  @Input() metrics:UiInsight[]=[];@Input() series:UiInsightPoint[]=[];
  @Input() loading=false;@Input() error='';@Input() topContent:{id:string;title:string;views:number}[]=[];
  @Output() rangeChange=new EventEmitter<Range>();@Output() exportRequested=new EventEmitter<void>();@Output() contentOpen=new EventEmitter<string>();
  range:Range='30d';
  get max(){return Math.max(1,...this.series.map(x=>Math.max(0,x.value)));}
  barHeight(value:number){return `${Math.max(2,100*Math.max(0,value)/this.max)}%`;}
  change(v:Range){this.range=v;this.rangeChange.emit(v);}
  id=(_:number,p:{id:string})=>p.id;
}
