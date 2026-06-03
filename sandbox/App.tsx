import { useState } from 'react';

import { FeedCreatePage } from './FeedCreatePage';
import { SandboxHome } from './SandboxHome';
import { TablePreviewSandbox } from './TablePreviewSandbox';

export default function App() {
  const [page, setPage] = useState<'home' | 'feed-create' | 'table-preview'>(
    'home'
  );

  if (page === 'feed-create') {
    return <FeedCreatePage onBack={() => setPage('home')} />;
  }

  if (page === 'table-preview') {
    return <TablePreviewSandbox onBack={() => setPage('home')} />;
  }

  return (
    <SandboxHome
      onOpenFeedCreate={() => setPage('feed-create')}
      onOpenTablePreview={() => setPage('table-preview')}
    />
  );
}
