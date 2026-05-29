# Exercise — The Forger

## Unit 1 — Exercise Brief
**type:** prose

## 🛠️ Practical Exercise: "The Forger"

1. Implement a standard JWT login flow.
2. **Hack your own app:** Take a valid JWT → paste into [jwt.io](https://jwt.io/) → change `role` from `user` to `admin`.
3. Try to use this modified token against your API.
4. **Observe:** It should fail signature verification. If it succeeds, you failed the exercise!

**Other tasks:**

- Implement OAuth 2.0 with PKCE flow
- Build JWT authentication middleware
- Integrate with Microsoft OAuth (relevant to your work)

---

## Unit 2 — JWT Forger Interactive
**type:** demo
**demo_key:** JWTForger

Built-in version of the exercise. The site issues you a valid JWT with `role: user`. You edit the payload (change `role` to `admin`), the signature stays the same. Submit to the sandbox `/admin` endpoint and watch the server reject it on signature verification. Then flip a toggle to "accept `alg:none`" — and see the attack succeed against a misconfigured server.

---
