/**
 * srcdoc HTML strings for the CSRF sandbox iframes.
 *
 * Both iframes run with sandbox="allow-scripts" (no allow-same-origin)
 * which forces them to a unique null origin, so their JS cannot reach
 * window.parent directly. They communicate via postMessage to a specific
 * target origin check in the parent.
 *
 * Security note: Because there is no allow-same-origin, cookies set by
 * the parent page are not accessible inside the sandbox. We simulate
 * cookie behaviour via postMessage so the teaching point is preserved
 * even without real cookie mechanics.
 */

/** Unique message type to distinguish from other postMessage traffic. */
export const CSRF_MESSAGE_TYPE = "csrf-sandbox-result";

export interface CSRFMessage {
  type: typeof CSRF_MESSAGE_TYPE;
  iframeId: "same-origin" | "cross-site";
  cookieSent: boolean;
  sameSite: string;
}

/** Iframe A: same-origin form submit — cookie always sent */
export function makeSameOriginDoc(sameSite: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<style>
  body { font-family: system-ui, sans-serif; font-size: 13px; padding: 16px; background: #1a1a2e; color: #edecf4; margin: 0; }
  button { padding: 8px 16px; border-radius: 8px; border: none; cursor: pointer; font-weight: 600; font-size: 13px; }
  .btn-ok { background: #46d6a0; color: #0f0f18; }
  form { display: flex; flex-direction: column; gap: 10px; }
  input { padding: 6px 10px; border-radius: 6px; border: 1px solid #2e2f47; background: #25263a; color: #edecf4; font-size: 13px; }
  .tag { font-size: 11px; color: #6f7089; }
</style>
</head>
<body>
<div class="tag">Same-origin frame · bank.example</div>
<form id="form">
  <label>Transfer to:<input name="to" value="attacker" /></label>
  <label>Amount:<input name="amount" value="1000" /></label>
  <button type="submit" class="btn-ok">Transfer</button>
</form>
<script>
document.getElementById('form').addEventListener('submit', function(e) {
  e.preventDefault();
  // Same-origin: cookie always sent (SameSite doesn't restrict first-party)
  window.parent.postMessage(
    { type: '${CSRF_MESSAGE_TYPE}', iframeId: 'same-origin', cookieSent: true, sameSite: '${sameSite}' },
    '*'
  );
});
</script>
</body>
</html>`;
}

/** Iframe B: cross-site form submit — cookie sent depends on SameSite */
export function makeCrossSiteDoc(sameSite: string): string {
  // In a real browser: SameSite=Strict blocks cookie, Lax blocks for POST, None sends it.
  // We simulate this logic in JS since the iframe is sandboxed.
  const cookieSent = sameSite === "None";

  return `<!DOCTYPE html>
<html>
<head>
<style>
  body { font-family: system-ui, sans-serif; font-size: 13px; padding: 16px; background: #1a1a2e; color: #edecf4; margin: 0; }
  button { padding: 8px 16px; border-radius: 8px; border: none; cursor: pointer; font-weight: 600; font-size: 13px; }
  .btn-danger { background: #ff6b7a; color: #0f0f18; }
  form { display: flex; flex-direction: column; gap: 10px; }
  input { padding: 6px 10px; border-radius: 6px; border: 1px solid #2e2f47; background: #25263a; color: #edecf4; font-size: 13px; }
  .tag { font-size: 11px; color: #6f7089; }
</style>
</head>
<body>
<div class="tag">Cross-site attacker frame · evil.example</div>
<form id="form" action="https://bank.example/transfer" method="POST">
  <input type="hidden" name="to" value="attacker" />
  <input type="hidden" name="amount" value="1000" />
  <button type="submit" class="btn-danger">Click here to claim your prize!</button>
</form>
<script>
document.getElementById('form').addEventListener('submit', function(e) {
  e.preventDefault();
  var sent = ${cookieSent};
  window.parent.postMessage(
    { type: '${CSRF_MESSAGE_TYPE}', iframeId: 'cross-site', cookieSent: sent, sameSite: '${sameSite}' },
    '*'
  );
});
</script>
</body>
</html>`;
}
