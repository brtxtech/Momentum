import { Component, Input } from '@angular/core';
@Component({ selector: 'ms-page-header', standalone: true, template: `<header class="page-header"><div><p class="eyebrow">MOMENTS STUDIO / {{eyebrow}}</p><h1>{{title}}</h1><p class="muted">{{subtitle}}</p></div><ng-content/></header>` })
export class PageHeaderComponent {
    @Input()
    title = '';
    @Input()
    subtitle = '';
    @Input()
    eyebrow = 'COLLECTION';
}
