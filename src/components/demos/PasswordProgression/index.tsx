"use client"; // uses SyntaxHighlighter (browser-only rendering)

import SyntaxHighlighter from "react-syntax-highlighter/dist/esm/prism-light";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import pyLang from "react-syntax-highlighter/dist/esm/languages/prism/python";
import { markdownToHtml } from "@/lib/markdownToHtml";

SyntaxHighlighter.registerLanguage("python", pyLang);

// ── Content ────────────────────────────────────────────────────────────────

interface Block {
  prose: string;
  code: string;
}

const BLOCKS: Block[] = [
  {
    prose: `**Step 1 — Plain text ❌ Never do this**\n\nOne DB breach exposes every password immediately. No cracking needed — the attacker just reads the column.`,
    code: `db.store("password", "hunter2")\n# One DB breach → every password exposed immediately`,
  },
  {
    prose: `**Step 2 — SHA-256 ❌ Looks smart, still wrong**\n\nSHA-256 is a *fast* hash — designed for speed. That's the problem. Attackers can test **billions of guesses per second** on a GPU.\n\nWorse: the same password always produces the same hash. Crack one → crack every account using the same password (rainbow table attack).`,
    code: `db.store("password_hash", sha256("hunter2"))\n# Fast hash → rainbow table attack → cracked in milliseconds\n# Same password always produces the same hash\n# → one crack = many accounts`,
  },
  {
    prose: `**Step 3 — bcrypt ✅ The minimum standard**\n\nbcrypt is *slow by design*. The cost factor controls how slow. At rounds=12, each attempt takes ~250ms — fine for a login form, brutal for a GPU cracking billions per second.\n\nBuilt-in random salt means the same password produces a *different* hash every time, making pre-computed rainbow tables useless.`,
    code: `db.store("password_hash", bcrypt.hash("hunter2", rounds=12))\n# Slow by design — cost factor 12 ≈ 250ms per attempt\n# Built-in random salt → same password = different hash every time\n# At 10B guesses/sec: SHA-256 ≈ 0.1ms  vs  bcrypt ≈ 350 years`,
  },
  {
    prose: `**Production note:** Argon2id (winner of the Password Hashing Competition, 2015) is now preferred over bcrypt — stronger memory-hardness prevents GPU/ASIC attacks. bcrypt is still acceptable and battle-tested.\n\n**The timing attack — always use constant-time comparison:**\n\n\`==\` short-circuits on the first non-matching character. An attacker can measure how long the comparison takes and infer how many characters match — leaking the hash byte by byte.`,
    code: `# ❌ Leaks timing — attacker measures character matches\nif password == stored_password:\n    ...\n\n# ✅ Constant-time — safe\nif bcrypt.verify(password, stored_hash):\n    ...`,
  },
];

// ── Component ──────────────────────────────────────────────────────────────

export default function PasswordProgression() {
  return (
    <div className="space-y-2">
      {/* Intro line */}
      <p className="text-base text-[var(--text-dim)] leading-relaxed">
        Before tokens, before OAuth — your app needs to store and verify
        passwords safely. <strong className="text-[var(--text)]">The
        progression (and why each step matters):</strong>
      </p>

      {/* Four blocks */}
      <div className="divide-y divide-[var(--border-subtle)]">
        {BLOCKS.map((block, i) => (
          <div
            key={i}
            className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 py-6"
          >
            {/* Prose column */}
            <div
              className="prose dark:prose-invert max-w-none text-sm leading-relaxed"
              dangerouslySetInnerHTML={{ __html: markdownToHtml(block.prose) }}
            />

            {/* Code column */}
            <div className="min-w-0 code-block-wrap">
              <SyntaxHighlighter
                language="python"
                style={vscDarkPlus}
                customStyle={{
                  borderRadius: "0.5rem",
                  fontSize: "1rem",
                  margin: 0,
                }}
                showLineNumbers
              >
                {block.code}
              </SyntaxHighlighter>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
