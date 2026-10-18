import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PageHeaderComponent } from '../../shared/page-header.component';
@Component({ standalone: true, imports: [CommonModule, FormsModule, PageHeaderComponent], template: `<ms-page-header title="Invitation atelier" subtitle="Craft a beautiful announcement with live preview and print-ready layout." eyebrow="CREATE"/><div class="editor-layout"><form class="panel form-stack" (ngSubmit)="print()"><h3>Design your invitation</h3><label>Names<input name="couple" [(ngModel)]="couple" maxlength="100"></label><label>Date<input name="date" [(ngModel)]="date" type="date"></label><label>Venue<input name="venue" [(ngModel)]="venue" maxlength="100"></label><label>Personal message<textarea name="message" [(ngModel)]="message" maxlength="350"></textarea></label><label>Design<select name="style" [(ngModel)]="style"><option *ngFor="let t of styles" [value]="t">{{t}}</option></select></label><button class="btn btn-primary" type="submit">Print / Save PDF</button></form><div class="invitation-preview" [attr.data-style]="style"><span class="ornament">✧</span><p>TOGETHER WITH THEIR FAMILIES</p><h2>{{couple||'Your names'}}</h2><p>{{message}}</p><div class="divider-ornament">✦</div><h3>{{date||'Your date'}}</h3><p>{{venue||'Your venue'}}</p><small>WE CAN'T WAIT TO CELEBRATE WITH YOU</small></div></div>` })
export class InvitationsComponent {
    couple = 'Olivia & James';
    date = '2027-06-14';
    venue = 'The Garden Estate';
    message = 'Joyfully invite you to celebrate their wedding';
    style = 'Editorial';
    styles = ['Editorial', 'Rose', 'Midnight', 'Minimal', 'Garden', 'Gold'];
    print() { window.print(); }
}
