import 'server-only';
import { APP_URL } from '@/lib/env.server';
import { indexableOrigin } from './metadata';
export const SEO_ORIGIN = indexableOrigin(APP_URL);
