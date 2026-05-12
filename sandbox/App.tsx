import { useState } from 'react';

import { FeedCreatePage } from './FeedCreatePage';
import { SandboxHome } from './SandboxHome';

export default function App() {
  const [page, setPage] = useState<'home' | 'feed-create'>('home');

  if (page === 'feed-create') {
    return <FeedCreatePage onBack={() => setPage('home')} />;
  }

  return <SandboxHome onOpenFeedCreate={() => setPage('feed-create')} />;
}
