import { Component, Input } from '@angular/core';
@Component({ selector: 'ms-empty-state', standalone: true, template: `<div class="empty-state"><span class="empty-symbol">✧</span><h3>{{title}}</h3><p>{{description}}</p><ng-content/></div>` })
export class EmptyStateComponent {
    @Input()
    title = 'Nothing here yet';
    @Input()
    description = 'Your collection will appear here.';
}
