// Paused while creator and shopper flows are still being finished —
// the brand role, dashboard, and API routes stay fully working (an
// existing brand account can still log in and use everything), this
// only hides the entry points that would bring in new ones: signup,
// nav, footer, and the demo login shortcut.
export const BRANDS_ENABLED = false;

// One-click demo logins skip the password check entirely, so they exist
// only outside production — and so do the demo accounts themselves (see
// seedDemoAccounts): production shows only real creators.
export const DEMO_LOGIN_ENABLED = process.env.NODE_ENV !== "production";
