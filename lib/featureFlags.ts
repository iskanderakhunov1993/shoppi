// Paused while creator and shopper flows are still being finished —
// the brand role, dashboard, and API routes stay fully working (an
// existing brand account can still log in and use everything), this
// only hides the entry points that would bring in new ones: signup,
// nav, footer, and the demo login shortcut.
export const BRANDS_ENABLED = false;

// One-click demo logins skip the password check entirely, so they exist
// only outside production. In prod the demo accounts stay as read-only
// showcases (their storefronts are linked from the landing page) but
// nobody can sign in as them.
export const DEMO_LOGIN_ENABLED = process.env.NODE_ENV !== "production";
