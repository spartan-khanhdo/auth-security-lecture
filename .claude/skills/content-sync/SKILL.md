---
name: content-sync
description: Sync, brainstorm, and verify lecture content between .planning/contents/ (markdown specs) and src/content/lectures/ (TypeScript implementations). Use this skill when you want to audit content gaps, check for missing illustrations, unclear explanations, wrong technical facts, or verify the planning specs match what's actually rendered in the course player. Delegates review work to the lecture-content-reviewer agent.
allowed_tools:
  - Read
  - Glob
  - Grep
  - Agent
---

# Content Sync & Review Skill

Audit and sync course content between the planning specs and the TypeScript lecture files. Also brainstorm whether content is easy to understand, well-illustrated, and presentation-friendly.

## When to Use

- After writing or editing `.planning/contents/*.md` files (spec layer)
- After an agent updates `src/content/lectures/*.ts` files (implementation layer)
- When content feels unclear, too dense, or lacks visuals
- When you suspect a planning spec and its TypeScript implementation have drifted
- Before a lecture review or demo session

## Lecture Mapping

| Planning spec | TypeScript implementation | Slug |
|---|---|---|
| `.planning/contents/lecture-1-oauth-authn.md` | `src/content/lectures/oauth-authn.ts` | `oauth-authn` |
| `.planning/contents/lecture-2-jwt-best-practices.md` | `src/content/lectures/jwt-best-practices.ts` | `jwt-best-practices` |
| `.planning/contents/lecture-3-sessions-mfa-modern-authn.md` | `src/content/lectures/sessions-mfa-modern-authn.ts` | `sessions-mfa-modern-authn` |
| `.planning/contents/lecture-4-service-to-service.md` | `src/content/lectures/service-to-service.ts` | `service-to-service` |
| `.planning/contents/lecture-5-security-fundamentals.md` | `src/content/lectures/security-fundamentals.ts` | `security-fundamentals` |
| `.planning/contents/lecture-6-gaps.md` | `src/content/lectures/gaps.ts` | `gaps` |

## What This Skill Does

### 1. Sync Check
Compare each `.planning/contents/lecture-N-*.md` against its paired `src/content/lectures/*.ts`:
- Count units in each (prose/diagram/code/demo/quiz)
- Flag any unit that exists in the spec but has no TS equivalent
- Flag any unit in the TS file that isn't described in the spec
- Note missing `learnMore` links on prose units that reference external concepts

### 2. Content Quality Brainstorm
For each lecture, evaluate:
- **Illustration ratio**: Are there enough diagrams and demos relative to prose units? Aim for at least 1 diagram or demo per 3–4 prose units.
- **Complexity curve**: Does complexity ramp smoothly? Flag if advanced concepts appear before foundations.
- **Clarity**: Are key terms defined before use? Flag jargon without explanation.
- **Presentation pacing**: Would this lecture feel too long or too dense to present live? Flag if a lecture exceeds ~25 units.
- **Demo coverage**: Do all major concepts have a matching interactive demo where one exists in the demo registry?

### 3. Technical Accuracy Flags
- Check that Mermaid diagram labels do NOT contain `{`, `}`, or `;` (these break the Mermaid parser)
- Verify quiz answers match the prose explanations in the same lecture
- Flag any claim that contradicts well-known auth standards (OAuth 2.0, OIDC, JWT RFC 7519, etc.)

## Demo Registry (available keys)

```
OAuthFlowPlayer | PKCESimulator | JWTDecoder | JWTForger |
DecisionTracer | HashingPlayground | OWASPAttackSimulator |
RBACPlayground | MTLSVisualizer
```

## How to Run

When the user invokes `/content-sync`, do the following:

1. **Ask scope**: Which lecture(s) to review? (default: all 6)
2. **Read both files** for each in-scope lecture (spec + TS)
3. **Produce a gap report** in this format:

```
## Lecture N — <Title>

### Sync Status
- Spec units: X | TS units: Y
- Missing in TS: [list]
- Extra in TS (not in spec): [list]

### Quality Flags
- Illustration ratio: OK / LOW (X diagrams for Y prose units)
- Pacing: OK / DENSE (N units — consider splitting)
- Missing demos: [concepts that could use a demo]
- Unclear sections: [specific prose unit titles]
- Mermaid risks: [any label containing { } ;]

### Recommendations
- [Concrete, actionable suggestions]
```

4. **Delegate updates** to `lecture-content-reviewer` agent for any content that needs rewriting, new units, or `learnMore` links added.

## Agent Delegation

When updates are needed, invoke `lecture-content-reviewer` with this brief:

```
Review and update [lecture name].
Planning spec: .planning/contents/[filename].md
TS implementation: src/content/lectures/[filename].ts

Issues found:
[paste the gap report section for this lecture]

Task:
- Update the TS file to match the spec (or update both if content is wrong)
- Add missing diagrams / demo units where flagged
- Fix any Mermaid syntax issues
- Add learnMore links where missing
```

## Rules

- Never modify TS content files directly in this skill — always delegate to `lecture-content-reviewer`
- Never modify planning specs without showing the user the proposed changes first
- Always present the gap report to the user before triggering any agent
- If a lecture looks good, say so explicitly — don't manufacture issues
