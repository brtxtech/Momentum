import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SocialApi } from './social-api.service';
/** Auth navigation guard; Supabase RLS remains the actual access-control boundary. */
export const accountGuard: CanActivateFn = async () => {
 const api=inject(SocialApi);
 const router=inject(Router);
 if (!api.ready) return router.parseUrl('/cloud');
 try { return (await api.user()) ? true : router.parseUrl('/cloud'); }
 catch { return router.parseUrl('/cloud'); }
};
