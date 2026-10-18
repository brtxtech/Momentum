import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {join} from "node:path";
test("feed: domain operations are implemented",()=>{
 const src=readFileSync(join("src/app/features/feed/domain.ts"),"utf8");
 for(const method of ["validatePostText","createPostDraft","transitionPost","editPost","pagePost","filterPost","mergePostUpdates","countPostByStatus"])assert.match(src,new RegExp("export function "+method+"\\("));
});
test("explore: domain operations are implemented",()=>{
 const src=readFileSync(join("src/app/features/explore/domain.ts"),"utf8");
 for(const method of ["validateSearchText","createSearchDraft","transitionSearch","editSearch","pageSearch","filterSearch","mergeSearchUpdates","countSearchByStatus"])assert.match(src,new RegExp("export function "+method+"\\("));
});
test("reels: domain operations are implemented",()=>{
 const src=readFileSync(join("src/app/features/reels/domain.ts"),"utf8");
 for(const method of ["validateReelText","createReelDraft","transitionReel","editReel","pageReel","filterReel","mergeReelUpdates","countReelByStatus"])assert.match(src,new RegExp("export function "+method+"\\("));
});
test("stories: domain operations are implemented",()=>{
 const src=readFileSync(join("src/app/features/stories/domain.ts"),"utf8");
 for(const method of ["validateStoryText","createStoryDraft","transitionStory","editStory","pageStory","filterStory","mergeStoryUpdates","countStoryByStatus"])assert.match(src,new RegExp("export function "+method+"\\("));
});
test("messages: domain operations are implemented",()=>{
 const src=readFileSync(join("src/app/features/messages/domain.ts"),"utf8");
 for(const method of ["validateMessageText","createMessageDraft","transitionMessage","editMessage","pageMessage","filterMessage","mergeMessageUpdates","countMessageByStatus"])assert.match(src,new RegExp("export function "+method+"\\("));
});
test("notifications: domain operations are implemented",()=>{
 const src=readFileSync(join("src/app/features/notifications/domain.ts"),"utf8");
 for(const method of ["validateNotificationText","createNotificationDraft","transitionNotification","editNotification","pageNotification","filterNotification","mergeNotificationUpdates","countNotificationByStatus"])assert.match(src,new RegExp("export function "+method+"\\("));
});
test("people: domain operations are implemented",()=>{
 const src=readFileSync(join("src/app/features/people/domain.ts"),"utf8");
 for(const method of ["validatePersonText","createPersonDraft","transitionPerson","editPerson","pagePerson","filterPerson","mergePersonUpdates","countPersonByStatus"])assert.match(src,new RegExp("export function "+method+"\\("));
});
test("events: domain operations are implemented",()=>{
 const src=readFileSync(join("src/app/features/events/domain.ts"),"utf8");
 for(const method of ["validateEventText","createEventDraft","transitionEvent","editEvent","pageEvent","filterEvent","mergeEventUpdates","countEventByStatus"])assert.match(src,new RegExp("export function "+method+"\\("));
});
test("gallery: domain operations are implemented",()=>{
 const src=readFileSync(join("src/app/features/gallery/domain.ts"),"utf8");
 for(const method of ["validateGalleryItemText","createGalleryItemDraft","transitionGalleryItem","editGalleryItem","pageGalleryItem","filterGalleryItem","mergeGalleryItemUpdates","countGalleryItemByStatus"])assert.match(src,new RegExp("export function "+method+"\\("));
});
test("invitations: domain operations are implemented",()=>{
 const src=readFileSync(join("src/app/features/invitations/domain.ts"),"utf8");
 for(const method of ["validateInvitationText","createInvitationDraft","transitionInvitation","editInvitation","pageInvitation","filterInvitation","mergeInvitationUpdates","countInvitationByStatus"])assert.match(src,new RegExp("export function "+method+"\\("));
});
test("qr: domain operations are implemented",()=>{
 const src=readFileSync(join("src/app/features/qr/domain.ts"),"utf8");
 for(const method of ["validateAccessCodeText","createAccessCodeDraft","transitionAccessCode","editAccessCode","pageAccessCode","filterAccessCode","mergeAccessCodeUpdates","countAccessCodeByStatus"])assert.match(src,new RegExp("export function "+method+"\\("));
});
test("create: domain operations are implemented",()=>{
 const src=readFileSync(join("src/app/features/create/domain.ts"),"utf8");
 for(const method of ["validatePublicationText","createPublicationDraft","transitionPublication","editPublication","pagePublication","filterPublication","mergePublicationUpdates","countPublicationByStatus"])assert.match(src,new RegExp("export function "+method+"\\("));
});
test("profile: domain operations are implemented",()=>{
 const src=readFileSync(join("src/app/features/profile/domain.ts"),"utf8");
 for(const method of ["validateProfileText","createProfileDraft","transitionProfile","editProfile","pageProfile","filterProfile","mergeProfileUpdates","countProfileByStatus"])assert.match(src,new RegExp("export function "+method+"\\("));
});
test("saved: domain operations are implemented",()=>{
 const src=readFileSync(join("src/app/features/saved/domain.ts"),"utf8");
 for(const method of ["validateBookmarkText","createBookmarkDraft","transitionBookmark","editBookmark","pageBookmark","filterBookmark","mergeBookmarkUpdates","countBookmarkByStatus"])assert.match(src,new RegExp("export function "+method+"\\("));
});
test("insights: domain operations are implemented",()=>{
 const src=readFileSync(join("src/app/features/insights/domain.ts"),"utf8");
 for(const method of ["validateMetricText","createMetricDraft","transitionMetric","editMetric","pageMetric","filterMetric","mergeMetricUpdates","countMetricByStatus"])assert.match(src,new RegExp("export function "+method+"\\("));
});
test("settings: domain operations are implemented",()=>{
 const src=readFileSync(join("src/app/features/settings/domain.ts"),"utf8");
 for(const method of ["validatePreferenceText","createPreferenceDraft","transitionPreference","editPreference","pagePreference","filterPreference","mergePreferenceUpdates","countPreferenceByStatus"])assert.match(src,new RegExp("export function "+method+"\\("));
});
test("help: domain operations are implemented",()=>{
 const src=readFileSync(join("src/app/features/help/domain.ts"),"utf8");
 for(const method of ["validateTicketText","createTicketDraft","transitionTicket","editTicket","pageTicket","filterTicket","mergeTicketUpdates","countTicketByStatus"])assert.match(src,new RegExp("export function "+method+"\\("));
});
