import { Outlet } from 'react-router-dom';

import Page from 'pages/Page';

/**
 * Layout that keeps Page (and LeftSidebar) mounted across / and /thread/:id.
 * Only the Outlet content (Home vs Thread) swaps on navigation, so sidebar
 * state (collapse/expand) is preserved when clicking a thread from home.
 */
export default function MainLayout() {
  return (
    <Page>
      <Outlet />
    </Page>
  );
}
