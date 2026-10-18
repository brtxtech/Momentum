import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, HostListener, OnDestroy, ViewChild } from '@angular/core';
import { StudioStore } from '../../core/store.service';

@Component({
    standalone: true,
    imports: [CommonModule],
    template: `
    <section class="ms-reels-shell" aria-label="Reels">
      <div class="ms-reels-list" #reelsList (scroll)="onScroll()">
        <article
          *ngFor="let reel of reels; let i = index"
          class="ms-reel-item"
          [class.active]="activeIndex === i"
          [attr.data-index]="i"
        >
          <div class="ms-reel-video-wrap">
            <div class="ms-reel-video">
              <video
                #videoEl
                [attr.data-index]="i"
                [poster]="store.image(reel.image)"
                [src]="store.image(reel.image)"
                [muted]="isMuted"
                playsinline
                loop
                preload="metadata"
                webkit-playsinline
                (click)="togglePlayback(i)"
                (loadedmetadata)="onMediaReady(i)"
                (error)="onMediaError(i)"
              ></video>

              <button
                type="button"
                class="ms-reel-mute"
                aria-label="Toggle mute"
                (click)="toggleMute(); $event.stopPropagation()"
              >
                {{ isMuted ? '🔇' : '🔊' }}
              </button>

              <div class="ms-play-indicator" *ngIf="playIndicatorIndex === i && !mediaFailed[i]">
                {{ isVideoPaused(i) ? '▶' : '❚❚' }}
              </div>

              <div class="ms-media-fallback" *ngIf="mediaFailed[i]">
                Preview unavailable
              </div>
            </div>
          </div>

          <aside class="ms-reel-sidebar" aria-label="Reel actions">
            <button type="button" class="ms-action-btn like" [class.liked]="reel.liked" (click)="store.toggleLike(reel.id)">
              <span class="ms-action-icon">{{ reel.liked ? '♥' : '♡' }}</span>
              <span class="ms-action-count">{{ reel.likes }}</span>
            </button>

            <button type="button" class="ms-action-btn" aria-label="Open comments">
              <span class="ms-action-icon">◌</span>
              <span class="ms-action-count">{{ reel.comments.length }}</span>
            </button>

            <button type="button" class="ms-action-btn" aria-label="Share reel" (click)="shareReel(reel)">
              <span class="ms-action-icon">↗</span>
              <span class="ms-action-count">Share</span>
            </button>

            <button type="button" class="ms-action-btn" [class.saved]="reel.saved" (click)="store.toggleSave(reel.id)">
              <span class="ms-action-icon">{{ reel.saved ? '✓' : '▣' }}</span>
              <span class="ms-action-count">Save</span>
            </button>

            <button type="button" class="ms-action-btn" aria-label="More reel options">
              <span class="ms-action-icon">⋯</span>
            </button>
          </aside>

          <div class="ms-reel-overlay">
            <div class="ms-reel-user-row">
              <div class="ms-avatar-wrap">
                <img [src]="store.image(reel.avatar)" [alt]="reel.author + ' avatar'" />
              </div>
              <strong>{{ reel.author }}</strong>
              <button type="button" class="ms-follow-btn">Follow</button>
            </div>

            <p class="ms-reel-caption" [class.expanded]="expandedCaptions[reel.id]">
              {{ reel.caption }}
            </p>
            <button
              *ngIf="reel.caption.length > 86"
              type="button"
              class="ms-caption-toggle"
              (click)="toggleCaption(reel.id)"
            >
              {{ expandedCaptions[reel.id] ? 'Show less' : 'More' }}
            </button>

            <div class="ms-audio-row">🎵 {{ reel.handle }} audio</div>
          </div>

          <button
            *ngIf="i > 0"
            type="button"
            class="ms-reel-arrow prev"
            aria-label="Previous reel"
            (click)="goToIndex(i - 1)"
          >
            ‹
          </button>

          <button
            *ngIf="i < reels.length - 1"
            type="button"
            class="ms-reel-arrow next"
            aria-label="Next reel"
            (click)="goToIndex(i + 1)"
          >
            ›
          </button>
        </article>

        <div *ngIf="!reels.length" class="ms-empty-state">
          <h3>No reels yet</h3>
          <p>Publish a short video to start the feed.</p>
        </div>
      </div>
    </section>
  `
})
export class ReelsComponent implements AfterViewInit, OnDestroy {
    @ViewChild('reelsList') private reelsList?: ElementRef<HTMLDivElement>;

    activeIndex = 0;
    isMuted = true;
    playIndicatorIndex: number | null = null;
    expandedCaptions: Record<string, boolean> = {};
    mediaFailed: Record<string, boolean> = {};
    private observer?: IntersectionObserver;
    private initialized = false;

    constructor(public store: StudioStore) { }

    get reels() {
        return this.store.posts().slice(0, 5);
    }

    ngAfterViewInit(): void {
        this.initialized = true;
        this.setupObserver();
        this.syncActiveFromScroll();
        this.startVideoForIndex(this.activeIndex);
        document.addEventListener('visibilitychange', this.onVisibilityChange);
    }

    ngOnDestroy(): void {
        this.observer?.disconnect();
        this.pauseAllVideos();
        document.removeEventListener('visibilitychange', this.onVisibilityChange);
    }

    @HostListener('window:keydown', ['$event'])
    handleKeydown(event: KeyboardEvent): void {
        if (event.key === 'ArrowDown') {
            event.preventDefault();
            this.goToIndex(Math.min(this.activeIndex + 1, this.reels.length - 1));
        }

        if (event.key === 'ArrowUp') {
            event.preventDefault();
            this.goToIndex(Math.max(this.activeIndex - 1, 0));
        }
    }

    onScroll(): void {
        if (!this.initialized) {
            return;
        }

        requestAnimationFrame(() => this.syncActiveFromScroll());
    }

    goToIndex(index: number): void {
        const reelList = this.reelsList?.nativeElement;
        if (!reelList || index < 0 || index >= this.reels.length) {
            return;
        }

        const reelItems = reelList.querySelectorAll('.ms-reel-item');
        const target = reelItems[index] as HTMLElement | undefined;
        if (!target) {
            return;
        }

        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        this.setActiveIndex(index);
    }

    toggleMute(): void {
        this.isMuted = !this.isMuted;
        this.syncVideoMuteState();
    }

    togglePlayback(index: number): void {
        const video = this.getVideoByIndex(index);
        if (!video) {
            return;
        }

        if (video.paused) {
            void video.play();
            this.playIndicatorIndex = index;
            this.flashPlaybackIndicator(index, true);
        } else {
            video.pause();
            this.playIndicatorIndex = index;
            this.flashPlaybackIndicator(index, false);
        }
    }

    toggleCaption(id: string): void {
        this.expandedCaptions[id] = !this.expandedCaptions[id];
    }

    shareReel(reel: { id: string; caption: string }): void {
        const shareUrl = `${location.origin}/reels#${reel.id}`;
        const text = reel.caption || 'Moments Studio reel';

        if (navigator.share) {
            void navigator.share({ title: 'Moments Studio', text, url: shareUrl }).catch(() => undefined);
            return;
        }

        if (navigator.clipboard) {
            void navigator.clipboard.writeText(shareUrl).then(() => {
                this.store.announce('Reel link copied');
            }).catch(() => this.store.announce('Share unavailable'));
            return;
        }

        this.store.announce('Share available on supported browsers');
    }

    onMediaReady(index: number): void {
        this.mediaFailed[index] = false;
        if (this.activeIndex === index) {
            this.startVideoForIndex(index);
        }
    }

    onMediaError(index: number): void {
        this.mediaFailed[index] = true;
        this.pauseSingleVideo(index);
    }

    private onVisibilityChange = (): void => {
        if (document.hidden) {
            this.pauseAllVideos();
            return;
        }

        if (this.activeIndex >= 0) {
            this.startVideoForIndex(this.activeIndex);
        }
    };

    private setupObserver(): void {
        const reelList = this.reelsList?.nativeElement;
        if (!reelList) {
            return;
        }

        const items = reelList.querySelectorAll('.ms-reel-item');
        if (!items.length) {
            return;
        }

        this.observer = new IntersectionObserver((entries) => {
            const visible = entries
                .filter((entry) => entry.isIntersecting)
                .sort((a, b) => (b.intersectionRatio ?? 0) - (a.intersectionRatio ?? 0))[0];

            if (!visible) {
                return;
            }

            const nextIndex = Number((visible.target as HTMLElement).dataset.index ?? 0);
            this.setActiveIndex(nextIndex);
        }, { root: reelList, threshold: [0.6, 0.8] });

        items.forEach((item) => this.observer?.observe(item));
    }

    private setActiveIndex(index: number): void {
        if (index < 0 || index >= this.reels.length) {
            return;
        }

        this.activeIndex = index;
        this.pauseAllVideos(index);
        this.startVideoForIndex(index);
    }

    private syncActiveFromScroll(): void {
        const reelList = this.reelsList?.nativeElement;
        if (!reelList) {
            return;
        }

        const reelItems = Array.from(reelList.querySelectorAll('.ms-reel-item')) as HTMLElement[];
        if (!reelItems.length) {
            return;
        }

        const viewportMidpoint = reelList.scrollTop + reelList.clientHeight / 2;
        let closestIndex = 0;
        let closestDistance = Number.POSITIVE_INFINITY;

        reelItems.forEach((item, index) => {
            const itemMidpoint = item.offsetTop + item.offsetHeight / 2;
            const distance = Math.abs(itemMidpoint - viewportMidpoint);
            if (distance < closestDistance) {
                closestDistance = distance;
                closestIndex = index;
            }
        });

        if (closestIndex !== this.activeIndex) {
            this.setActiveIndex(closestIndex);
        }
    }

    private startVideoForIndex(index: number): void {
        const video = this.getVideoByIndex(index);
        if (!video || this.mediaFailed[index]) {
            return;
        }

        video.muted = this.isMuted;
        video.loop = true;
        video.playsInline = true;
        video.preload = 'metadata';

        if (video.paused) {
            void video.play().catch(() => undefined);
        }
    }

    private pauseAllVideos(exceptIndex?: number): void {
        const reelList = this.reelsList?.nativeElement;
        if (!reelList) {
            return;
        }

        const videos = reelList.querySelectorAll('video');
        videos.forEach((video: HTMLVideoElement) => {
            const index = Number(video.dataset.index ?? -1);
            if (index === exceptIndex) {
                return;
            }
            video.pause();
        });
    }

    private pauseSingleVideo(index: number): void {
        const video = this.getVideoByIndex(index);
        if (video) {
            video.pause();
        }
    }

    isVideoPaused(index: number): boolean {
        const video = this.getVideoByIndex(index);
        return !video || video.paused;
    }

    private flashPlaybackIndicator(index: number, playing: boolean): void {
        this.playIndicatorIndex = index;
        window.clearTimeout(this.playIndicatorTimer);
        this.playIndicatorTimer = window.setTimeout(() => {
            this.playIndicatorIndex = null;
        }, 500);
        if (playing) {
            this.store.announce('Playing reel');
        }
    }

    private playIndicatorTimer = 0;

    private getVideoByIndex(index: number): HTMLVideoElement | null {
        const reelList = this.reelsList?.nativeElement;
        if (!reelList) {
            return null;
        }

        const matched = reelList.querySelectorAll('video')[index] as HTMLVideoElement | undefined;
        return matched ?? null;
    }

    private syncVideoMuteState(): void {
        const reelList = this.reelsList?.nativeElement;
        if (!reelList) {
            return;
        }

        reelList.querySelectorAll('video').forEach((video: HTMLVideoElement) => {
            video.muted = this.isMuted;
        });
    }
}
