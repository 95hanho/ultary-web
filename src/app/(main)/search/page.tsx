import type { Metadata } from 'next';

export const metadata: Metadata = { title: '검색 - Ultary', robots: { index: false, follow: false } };

import SearchClient from './SearchClient';

export default function SearchPage() {
  return <SearchClient />;
}
