/**
 * SkipToContent — accessibility skip link.
 *
 * This is the first focusable element in <body>. Keyboard users can press Tab
 * on fresh page load and then Enter to jump past the nav directly to <main>.
 *
 * Styled via .skip-link in globals.css: visually hidden until :focus, then
 * pinned top-left with high contrast.
 *
 * Server Component — no "use client" needed.
 */
export default function SkipToContent() {
  return (
    <a href="#main" className="skip-link">
      Skip to content
    </a>
  );
}
