import { SocialApi } from '../../core/social-api.service';
export type AccountMedia = {id:string; caption:string; kind:string; media_path?:string|null; url?:string; created_at:string; user_id?:string};
/** Signed URLs are short-lived; request new URLs whenever the page is loaded. */
export async function withMedia(api:SocialApi,rows:AccountMedia[]):Promise<AccountMedia[]> {
 return Promise.all(rows.map(async row=>{
  if(!row.media_path)return {...row,url:undefined};
  try {return {...row,url:await api.signedUrl('social-media',row.media_path,900)};}
  catch {return {...row,url:undefined};}
 }));
}
export function friendlyError(e:unknown):string {return e instanceof Error?e.message:'The request failed. Please try again.';}
export function chartHeight(n:number,max:number):number {return max>0?Math.round(n/max*100):0;}
