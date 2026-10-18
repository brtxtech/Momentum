declare module '@angular/core' {
  export const ChangeDetectionStrategy: {OnPush: number};
  export function Component(config: Record<string, unknown>): ClassDecorator;
  export function Input(): PropertyDecorator;
  export function Output(): PropertyDecorator;
  export class EventEmitter<T=unknown> { emit(value?:T):void; }
  export interface SimpleChanges { [key:string]:unknown; }
  export interface OnChanges { ngOnChanges(changes:SimpleChanges):void; }
}
declare module '@angular/common' {export const CommonModule:object;}
declare module '@angular/forms' {export const FormsModule:object;}
