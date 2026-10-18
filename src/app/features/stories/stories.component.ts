import { Component, HostListener, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { StudioStore } from '../../core/store.service';

@Component({
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="ms-story-backdrop" role="dialog" aria-modal="true" aria-label="Story viewer">
      <button class="ms-story-close" type="button" aria-label="Close story" (click)="close()">×</button>
      <button class="ms-story-arrow" type="button" aria-label="Previous story" (click)="move(-1)">‹</button>

      <article class="ms-story-stage" *ngIf="story" [class.story-next]="transitionState() === 'next'" [class.story-prev]="transitionState() === 'prev'">
        <div class="ms-story-progress" aria-label="Story progress">
          <span [style.width.%]="100"></span>
        </div>

        <div class="ms-story-user">
          <img class="ms-avatar" [src]="store.image(story.image)" [alt]="story.author" />
          <strong>{{ story.author }}</strong>
          <small>now</small>
          <button class="ms-push" type="button" (click)="togglePause()" [attr.aria-label]="paused ? 'Resume story' : 'Pause story'">
            {{ paused ? '▶' : 'Ⅱ' }}
          </button>
        </div>

        <img class="ms-story-content" [src]="store.image(story.image)" [alt]="story.author + ' story'" />

        <div class="ms-story-reply">
          <input type="text" placeholder="Reply to story…" aria-label="Reply to story" />
          <button type="button">Send</button>
          <button type="button" aria-label="React to story">♡</button>
        </div>
      </article>

      <button class="ms-story-arrow" type="button" aria-label="Next story" (click)="move(1)">›</button>
    </div>
  `,
    styles: [`
      .ms-story-stage {
        opacity: 1;
        transform: translateX(0) scale(1);
        transition: transform 220ms ease, opacity 220ms ease;
      }

      .ms-story-stage.story-next {
        animation: story-next 220ms ease;
      }

      .ms-story-stage.story-prev {
        animation: story-prev 220ms ease;
      }

      @keyframes story-next {
        from {
          opacity: 0;
          transform: translateX(18px) scale(0.98);
        }
        to {
          opacity: 1;
          transform: translateX(0) scale(1);
        }
      }

      @keyframes story-prev {
        from {
          opacity: 0;
          transform: translateX(-18px) scale(0.98);
        }
        to {
          opacity: 1;
          transform: translateX(0) scale(1);
        }
      }
    `]
})
export class StoriesComponent implements OnDestroy {
    index = signal(0);
    paused = false;
    transitionState = signal<'next' | 'prev' | 'idle'>('idle');
    private timerId?: ReturnType<typeof setTimeout>;
    private transitionId?: ReturnType<typeof setTimeout>;

    constructor(public store: StudioStore, private router: Router) {
        this.restartTimer();
    }

    @HostListener('window:keydown', ['$event'])
    handleKeyboard(event: KeyboardEvent) {
        if (event.key === 'Escape') {
            this.close();
        }
        if (event.key === 'ArrowRight') {
            this.move(1);
        }
        if (event.key === 'ArrowLeft') {
            this.move(-1);
        }
    }

    ngOnDestroy() {
        if (this.timerId) clearTimeout(this.timerId);
        if (this.transitionId) clearTimeout(this.transitionId);
    }

    get story() {
        return this.store.stories()[this.index()];
    }

    close() {
        this.router.navigateByUrl('/feed');
    }

    togglePause() {
        this.paused = !this.paused;
        this.restartTimer();
    }

    private restartTimer() {
        if (this.timerId) clearTimeout(this.timerId);
        if (this.paused) { return; }

        this.timerId = setTimeout(() => {
            const total = this.store.stories().length;
            const lastIndex = total - 1;

            if (this.index() >= lastIndex) {
                this.close();
                return;
            }

            this.move(1);
        }, 4000);
    }

    move(delta: number) {
        const total = this.store.stories().length;
        const nextValue = (this.index() + delta + total) % total;
        const direction = delta >= 0 ? 'next' : 'prev';

        this.transitionState.set(direction);
        this.index.set(nextValue);
        this.restartTimer();

        if (this.transitionId) clearTimeout(this.transitionId);
        this.transitionId = setTimeout(() => this.transitionState.set('idle'), 220);
    }
}
