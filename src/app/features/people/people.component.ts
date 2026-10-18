import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StudioStore } from '../../core/store.service';
import { PeoplePremiumComponent } from '../../ui/extra/people-view.component';
import { UiPerson } from '../../ui/extra/view-models';
import { Post } from '../../core/models';
@Component({ standalone: true, imports: [CommonModule, PeoplePremiumComponent], template: `<ms-people-premium [people]="people" [followRequests]="followRequests" [loading]="false" [busy]="false" [error]="''" (peopleSearch)="onSearch($event)" (followToggle)="toggle($event)" (requestApprove)="approve($event)" (requestReject)="reject($event)" (userOpen)="openUser($event)" (tabChange)="changeTab($event)"></ms-people-premium>` })
export class PeopleComponent {
    private requests: UiPerson[] = [{ id: 'follow-1', username: 'clairemoments', displayName: 'Claire Morgan', avatarUrl: this.store.image(9), bio: 'Wedding storyteller', verified: true, requested: true, followers: 1420 }, { id: 'follow-2', username: 'lucaslight', displayName: 'Lucas Gray', avatarUrl: this.store.image(10), bio: 'Travel diary creator', verified: false, requested: true, followers: 860 }];
    constructor(public store: StudioStore) { }
    get people(): UiPerson[] { return this.store.posts().map((post: Post) => ({ id: post.id, username: post.handle, displayName: post.author, avatarUrl: this.store.image(post.avatar), bio: `From ${post.event}.`, verified: post.author.includes('Moments') || post.author.includes('Studio'), isPrivate: false, following: false, followers: Math.max(120, post.likes % 4000) })); }
    get followRequests(): UiPerson[] { return this.requests; }
    onSearch(value: string) { this.store.search.set(value); }
    changeTab(_tab: 'suggested' | 'followers' | 'following' | 'requests') { }
    openUser(id: string) { this.store.announce(`Viewing ${id}`); }
    toggle(id: string) { const next = this.people.find((person: UiPerson) => person.id === id); if (!next) return; next.following = !next.following; this.store.announce(next.following ? 'Following this creator' : 'Unfollowed'); }
    approve(id: string) { this.requests = this.requests.filter((item: UiPerson) => item.id !== id); this.store.announce('Follow request approved'); }
    reject(id: string) { this.requests = this.requests.filter((item: UiPerson) => item.id !== id); this.store.announce('Follow request deleted'); }
}
