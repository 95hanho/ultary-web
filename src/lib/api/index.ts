export type * from './error';
export type * from './http';

export {
  bffDelete,
  bffGet,
  bffPatchJson,
  bffPostJson,
  bffPutJson,
} from './bffFetch';

export {
  springDelete,
  springDownload,
  springGet,
  springPatchJson,
  springPostForm,
  springPostFormData,
  springPostJson,
  springPostMultipart,
  springPutForm,
} from './springFetch';

export { bffEndpoints, endpoints, springEndpoints } from './endpoints';
