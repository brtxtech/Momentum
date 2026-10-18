import { Entity } from './feature-lab';
export type QueueOperation = 'create' | 'update' | 'delete' | 'upload' | 'mark_read';
export type QueueStatus = 'waiting' | 'running' | 'succeeded' | 'failed' | 'cancelled';
export interface Job<T = Entity> {
    id: string;
    operation: QueueOperation;
    payload: T;
    status: QueueStatus;
    attempts: number;
    maxAttempts: number;
    nextAt: number;
    createdAt: number;
    result?: unknown;
    error?: string;
    key?: string;
}
export interface QueueStats {
    waiting: number;
    running: number;
    succeeded: number;
    failed: number;
    cancelled: number;
    total: number;
}
export interface QueueEvent<T = Entity> {
    job: Job<T>;
    from: QueueStatus;
    to: QueueStatus;
    at: number;
}
export type QueueHandler<T = Entity> = (job: Job<T>) => Promise<unknown>;
export type QueueListener<T = Entity> = (jobs: readonly Job<T>[], event: QueueEvent<T>) => void;
export function retryDelay(attempt: number, base = 500, max = 30000): number {
    return Math.min(max, Math.max(0, base) * Math.pow(2, Math.min(attempt, 10)));
}
export function jobId(prefix = 'job'): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
export function validOperation(value: string): value is QueueOperation {
    return ['create', 'update', 'delete', 'upload', 'mark_read'].includes(value);
}
export function validStatus(value: string): value is QueueStatus {
    return ['waiting', 'running', 'succeeded', 'failed', 'cancelled'].includes(value);
}
export function mayTransition(from: QueueStatus, to: QueueStatus): boolean {
    const allowed: Record<QueueStatus, QueueStatus[]> = {
        waiting: ['running', 'cancelled'],
        running: ['succeeded', 'failed', 'waiting'],
        succeeded: [],
        failed: ['waiting', 'cancelled'],
        cancelled: ['waiting']
    };
    return allowed[from].includes(to);
}
export class FeatureQueue<T = Entity> {
    private jobs = new Map<string, Job<T>>();
    private listeners = new Set<QueueListener<T>>();
    private inFlight = new Set<string>();
    private stopped = false;
    constructor(private concurrency = 2) {
        if (!Number.isSafeInteger(concurrency) || concurrency < 1 || concurrency > 10)
            throw Error('Concurrency must be 1–10');
    }
    subscribe(listener: QueueListener<T>): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }
    private change(job: Job<T>, status: QueueStatus): void {
        if (!mayTransition(job.status, status))
            throw Error('Illegal queue transition');
        const before = job.status;
        job.status = status;
        const event = { job: { ...job }, from: before, to: status, at: Date.now() };
        for (const listener of this.listeners)
            listener(this.list(), event);
    }
    enqueue(operation: QueueOperation, payload: T, options: {
        key?: string;
        maxAttempts?: number;
        id?: string;
    } = {}): Job<T> {
        if (this.stopped)
            throw Error('Queue is stopped');
        if (options.key) {
            const existing = this.list().find(job => job.key === options.key && !['failed', 'cancelled'].includes(job.status));
            if (existing)
                return existing;
        }
        const id = options.id ?? jobId();
        if (this.jobs.has(id))
            throw Error('Duplicate job ID');
        const maxAttempts = options.maxAttempts ?? 3;
        if (!Number.isInteger(maxAttempts) || maxAttempts < 1 || maxAttempts > 10)
            throw Error('Invalid retry limit');
        const now = Date.now();
        const job: Job<T> = { id, operation, payload, status: 'waiting', attempts: 0, maxAttempts, nextAt: now, createdAt: now, key: options.key };
        this.jobs.set(id, job);
        return { ...job };
    }
    list(): Job<T>[] { return [...this.jobs.values()].map(job => ({ ...job })); }
    get(id: string): Job<T> | undefined {
        const record = this.jobs.get(id);
        return record ? { ...record } : undefined;
    }
    count(): number { return this.jobs.size; }
    stats(): QueueStats {
        const s: QueueStats = { waiting: 0, running: 0, succeeded: 0, failed: 0, cancelled: 0, total: 0 };
        for (const job of this.jobs.values()) {
            s[job.status]++;
            s.total++;
        }
        return s;
    }
    pending(now = Date.now()): Job<T>[] {
        return this.list().filter(job => job.status === 'waiting' && job.nextAt <= now).sort((a, b) => a.nextAt - b.nextAt || a.createdAt - b.createdAt);
    }
    cancel(id: string): boolean {
        const job = this.jobs.get(id);
        if (!job || this.inFlight.has(id) || !['waiting', 'failed'].includes(job.status))
            return false;
        this.change(job, 'cancelled');
        return true;
    }
    retry(id: string): boolean {
        const job = this.jobs.get(id);
        if (!job || !['failed', 'cancelled'].includes(job.status))
            return false;
        this.change(job, 'waiting');
        job.nextAt = Date.now();
        job.error = undefined;
        return true;
    }
    remove(id: string): boolean {
        if (this.inFlight.has(id))
            return false;
        return this.jobs.delete(id);
    }
    clearCompleted(): number {
        let removed = 0;
        for (const job of this.jobs.values()) {
            if (['succeeded', 'cancelled'].includes(job.status)) {
                this.jobs.delete(job.id);
                removed++;
            }
        }
        return removed;
    }
    async execute(handler: QueueHandler<T>, now = Date.now()): Promise<number> {
        if (this.stopped)
            return 0;
        const capacity = Math.max(0, this.concurrency - this.inFlight.size);
        const ready = this.pending(now).slice(0, capacity);
        await Promise.all(ready.map(async (snapshot) => {
            const job = this.jobs.get(snapshot.id);
            if (!job || job.status !== 'waiting')
                return;
            this.inFlight.add(job.id);
            job.attempts++;
            this.change(job, 'running');
            try {
                job.result = await handler({ ...job });
                this.change(job, 'succeeded');
            }
            catch (e) {
                job.error = e instanceof Error ? e.message : String(e);
                if (job.attempts < job.maxAttempts) {
                    job.nextAt = Date.now() + retryDelay(job.attempts);
                    this.change(job, 'waiting');
                }
                else {
                    this.change(job, 'failed');
                }
            }
            finally {
                this.inFlight.delete(job.id);
            }
        }));
        return ready.length;
    }
    async drain(handler: QueueHandler<T>, maxPasses = 10): Promise<QueueStats> {
        if (maxPasses < 1 || maxPasses > 100)
            throw Error('Invalid pass limit');
        for (let pass = 0; pass < maxPasses; pass++) {
            const count = await this.execute(handler);
            if (!count)
                break;
        }
        return this.stats();
    }
    pause() { this.stopped = true; }
    resume() { this.stopped = false; }
    isPaused(): boolean { return this.stopped; }
    export(): string { return JSON.stringify(this.list()); }
    import(payload: string): number {
        const array: unknown = JSON.parse(payload);
        if (!Array.isArray(array))
            throw Error('Invalid queue document');
        let added = 0;
        for (const entry of array) {
            if (!entry || typeof entry !== 'object')
                continue;
            const candidate = entry as Job<T>;
            if (!candidate.id || !validOperation(candidate.operation) || !validStatus(candidate.status) || this.jobs.has(candidate.id))
                continue;
            if (candidate.status === 'running')
                candidate.status = 'waiting';
            this.jobs.set(candidate.id, { ...candidate });
            added++;
        }
        return added;
    }
}
