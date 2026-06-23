# Kịch bản trình bày — Khối OIDC (nửa Section 3)

**Người trình bày:** Khanh · **Thời lượng:** ~7–8 phút · **4 slide**
**Vị trí:** mở đầu Section 3, nối ngay sau khi Trúc kết Section 2 ("Login with Google là OIDC, không phải OAuth trần").

> ⚠️ **Cập nhật:** Trúc vừa chèn thêm 1 slide **sơ đồ luồng (ảnh)** ngay sau slide OIDC text. Khối OIDC giờ là **4 slide**: (1) OIDC text → (1b) **sơ đồ luồng** → (2) Providers → (3) GitHub→AWS.

> Cách dùng: **NÓI** = lời thoại, đọc gần như nguyên văn được. **CHỈ** = chỉ tay vào đâu trên màn hình. **CHUYỂN Ý** = câu nối. **In đậm** = câu chốt, nói chậm + rõ.

---

# PHẦN A — Kiến thức nền PHẢI nắm cứng (đọc kỹ trước khi lên)

Anh chỉ cần hiểu chắc **5 ý** này là nói trôi và đỡ được mọi câu hỏi:

### 1. OIDC là gì, sinh ra để làm gì
- **OAuth 2.0 chỉ trả lời "app này được phép làm gì"** (authorization) — nó *cố tình* không nói "user là ai".
- Ngày xưa mỗi provider tự chế cách lấy thông tin user → loạn, không chuẩn.
- **OIDC (OpenID Connect, 2014)** = lớp mỏng đắp lên OAuth 2.0, **chuẩn hóa phần danh tính**. Vẫn dùng đúng luồng Authorization Code của OAuth, chỉ thêm vài thứ.

### 2. OIDC thêm đúng 3 thứ vào OAuth
- **ID token** — một JWT chứa "user là ai" (`sub`, `email`, `name`…).
- **`/userinfo` endpoint** — gọi để lấy thêm profile.
- **Discovery** (`/.well-known/openid-configuration`) — tự động tìm mọi endpoint.

### 3. ID token ≠ Access token (đây là ý QUAN TRỌNG NHẤT, chắc chắn bị hỏi)
| | ID token | Access token |
|---|---|---|
| Trả lời | "User là ai" | "Được gọi API nào" |
| `aud` (audience) gửi cho | **App của bạn** | **API / resource server** |
| App của bạn làm gì với nó | Đọc → biết user → tạo session | Đính kèm khi gọi API |
| Có scope không | Không | Có |
> **Quy tắc vàng:** ID token để *đăng nhập user vào app của bạn*; access token để *gọi API*. **Tuyệt đối không dùng ID token làm bearer token gọi API.** (Vì `aud` sai + không có scope + lộ thông tin danh tính.)

### 4. Discovery + JWKS làm "đổi provider = đổi 1 dòng config"
- App chỉ cần cấu hình **issuer URL** (vd `accounts.google.com`).
- App fetch `{issuer}/.well-known/openid-configuration` → nhận về mọi endpoint (`token`, `userinfo`, `jwks_uri`).
- `jwks_uri` = nơi lấy **public key** của provider để **kiểm chữ ký** ID token.
- Đổi Google sang Okta? Chỉ đổi issuer, code y nguyên.

### 5. Cùng giao thức đó làm cả "máy xác thực máy"
- GitHub Actions cũng là một **OIDC provider**. Mỗi lần chạy workflow, GitHub cấp một JWT có chữ ký, `sub` ghi rõ `repo:org/repo:ref:refs/heads/main`.
- AWS đã đăng ký GitHub là OIDC provider → validate JWT đó qua JWKS của GitHub → cấp credential tạm 15 phút (`AssumeRoleWithWebIdentity`).
- → **Không cần lưu AWS access key dài hạn.** Cùng giao thức OIDC, chỉ khác `sub` là một workflow chứ không phải con người.

### Sơ đồ luồng OIDC login (vẽ tay được nếu cần)
```
User → [bấm Login with Google]
App  → đẩy user sang Google (scope=openid email profile, kèm nonce)
User → đăng nhập + đồng ý ở Google
Google → trả "code" về App (redirect)
App  → đổi code ở /token  →  nhận về { access_token, ID token }
App  → kiểm ID token (chữ ký qua JWKS, iss, aud, exp, nonce) → biết user là ai → tạo session
App  → (khi cần gọi API) dùng access_token, KHÔNG dùng ID token
```

---

# PHẦN B — Kịch bản từng slide

## MỞ ĐẦU (nối từ Section 2 của Trúc) — ~20 giây

**NÓI:**
- "Cảm ơn Trúc. Như cuối phần nãy bạn vừa nhắc — **'Login with Google' thật ra là OIDC, không phải OAuth trần.** Phần này mình sẽ làm rõ tại sao, và OIDC khác OAuth ở chỗ nào."
- "Ý chính một câu: **OAuth trả lời 'app được làm gì', còn OIDC trả lời 'user là ai'.**"

**CHUYỂN Ý:** "Cụ thể OIDC thêm gì vào OAuth, mình xem slide này."

---

## SLIDE 1 — "OpenID Connect (OIDC)" `(~3 phút)`

**MÀN HÌNH:** Bảng "OAuth 2.0 alone vs OIDC adds" · 3 endpoint (`/.well-known`, `/token`, `/userinfo`) · ví dụ JSON ID token · quy tắc "ID token vs access token" · phần discovery · phần machine identity.

**NÓI:**
- "OIDC là **một lớp danh tính mỏng đắp lên OAuth 2.0**. Nó chuẩn hóa đúng cái phần mà OAuth 2.0 cố tình bỏ trống: *user là ai*."
- **CHỈ vào bảng:** "OAuth trần chỉ cho mình **access token** để truy cập tài nguyên. OIDC thêm 3 thứ: thứ nhất là **ID token** — một JWT chứa thông tin danh tính; thứ hai là endpoint **`/userinfo`** để lấy profile; thứ ba là **discovery** để tự dò mọi endpoint."
- **CHỈ vào JSON ID token:** "Đây là ruột một ID token. Để ý mấy claim: `iss` là ai phát ra — Google; `sub` là id duy nhất của user; `email`, `name` là thông tin; `aud` — **cái này quan trọng** — là **client id của app mình**, nghĩa là token này **dành cho app mình đọc**, không phải để gửi đi đâu cả."
- **Câu chốt (nói chậm):** "**Quy tắc vàng: ID token để biết user là ai và đăng nhập họ vào app của mình; access token mới để gọi API. Đừng bao giờ lấy ID token đi gọi API.** Vì `aud` của nó là app mình chứ không phải API, và nó không mang scope."
- **CHỈ vào discovery:** "Còn cái hay nhất về vận hành: mỗi provider publish một file JSON ở `issuer/.well-known/openid-configuration`. App chỉ cần biết **issuer URL**, mọi endpoint còn lại tự fetch lúc chạy. Nên **đổi từ Google sang Okta chỉ là đổi một dòng config** — code giữ nguyên."
- **CHỈ vào phần machine identity (chốt, dẫn sang sau):** "Và OIDC không chỉ cho user đăng nhập — nó còn làm **máy xác thực máy**. GitHub Actions cấp ID token cho mỗi lần chạy, AWS validate rồi trả credential tạm. Mình quay lại cái này ở slide thứ 3."

**CHUYỂN Ý:** "Để thấy mấy bước này thật ra chạy ra sao, mình nhìn sơ đồ luồng."

**Q&A thủ sẵn cho slide này:**
- *Vì sao đừng dùng ID token gọi API?* → `aud` của ID token là app mình, không phải resource server; nó không có scope. Resource server đúng chuẩn sẽ từ chối. Access token mới đúng vai.
- *App kiểm ID token thế nào?* → Kiểm **chữ ký** (lấy public key qua `jwks_uri`), `iss` đúng provider, `aud` == client id của mình, `exp` chưa hết hạn, và `nonce` khớp (chống replay).
- *`nonce` là gì?* → Chuỗi ngẫu nhiên app gửi lúc redirect; provider nhét lại vào ID token; app so khớp → chống kẻ xấu phát lại ID token cũ.
- *OIDC có phải thay OAuth không?* → Không, nó **đắp lên** OAuth. Vẫn là luồng Authorization Code, chỉ thêm scope `openid` và trả thêm ID token.

---

## SLIDE 1b — Sơ đồ luồng OIDC/OAuth (ảnh) `(~1.5 phút)`

**MÀN HÌNH:** Sequence diagram. 5 cột: **User · Desktop/Mobile App · Embedded Browser · Authorization Server · Resource Server**. Các bước đánh số: Start App → Launch Browser → Request Login → Authenticate User → Redirect → **Extract Auth Code → Get Access Token → Return Access/Refresh Token → Save Refresh Token** → Get Data → Check Access Token → Return Data.

**NÓI:**
- "Đây là luồng thật khi user bấm đăng nhập — mình đi nhanh từ trái qua phải."
- **CHỈ theo các bước (trái → phải):**
  - "App mở **browser** cho user đăng nhập ở **Authorization Server** — app **không bao giờ thấy mật khẩu**, user gõ thẳng vào trang của provider."
  - "Đăng nhập xong, server **redirect kèm một `auth code`**. App **chộp code** đó."
  - **CHỈ vào bước Get Access Token (nói chậm):** "App **đổi code lấy token** ở back-channel — và đây chính là bước OIDC trả về **cả access token lẫn ID token**. Access token để gọi API; **ID token để biết user là ai**."
  - "App **lưu refresh token**, rồi mới đi **gọi Resource Server lấy dữ liệu** bằng access token. Resource Server **check access token** rồi trả data."
- **Câu chốt:** "Mấu chốt: **mật khẩu chỉ trao cho provider, app chỉ cầm token. Và token đổi qua code ở back-channel, không phơi lên URL.**"
- *(Lưu ý nói: sơ đồ này vẽ token nói chung; với OIDC thì bước 'Return Access/Refresh Token' có kèm luôn **ID token** — đó là điểm khác của OIDC.)*

**CHUYỂN Ý:** "Luồng là vậy. OIDC là chuẩn chung nên có sẵn rất nhiều nhà cung cấp — mình gần như không tự xây."

**Q&A thủ sẵn:**
- *Sao phải qua 'auth code' chứ không trả token thẳng?* → Code dùng-một-lần, đổi token ở back-channel phía server → token không phơi lên URL/lịch sử trình duyệt. (Kiểu trả thẳng = Implicit, đã deprecated.)
- *Embedded browser có an toàn không?* → Khuyến nghị hiện đại là dùng system browser / tab an toàn (RFC 8252) thay vì embedded webview, vì webview app có thể đọc được thao tác. Sơ đồ là minh hoạ chung.
- *ID token nằm ở bước nào?* → Ở bước "Return Access/Refresh Token" — với OIDC, response của `/token` có thêm `id_token`.

---

## SLIDE 2 — "OIDC Providers in the Wild" `(~1 phút)`

**MÀN HÌNH:** Các thẻ provider — Google, Azure/Entra, Okta, Auth0, AWS Cognito, GitHub, Keycloak.

**NÓI:**
- "OIDC là chuẩn chung, nên đây là mấy nhà cung cấp lớn — **mình chọn một cái và tích hợp ở vai client, gần như không tự xây provider.**"
- **CHỈ lướt qua thẻ:** "**Google** cho consumer 'Sign in with Google'. **Azure/Entra** và **Okta** cho enterprise SSO. **Auth0** thân thiện dev. **Cognito** cho app trên AWS. **Keycloak** là open-source self-host khi compliance không cho dùng dịch vụ ngoài."
- **CHỈ vào GitHub (dẫn sang slide 3):** "Để ý **GitHub** ở đây không phải để user đăng nhập — nó cấp OIDC token cho **workflow**, tức là máy xác thực máy. Đúng cái mình nói tiếp ngay sau đây."
- **Câu chốt:** "Điểm mấu chốt: **biết issuer URL là mọi endpoint khác tự dò ra — đổi provider chỉ là đổi issuer, code y nguyên.**"

**CHUYỂN Ý:** "Nói về máy xác thực máy — đây là ví dụ thực tế ai làm CI/CD cũng gặp."

**Q&A thủ sẵn:**
- *Tự xây OIDC provider được không?* → Được nhưng hiếm khi nên; dùng Keycloak (self-host) hoặc dịch vụ managed. Tự xây dễ sai bảo mật.
- *Khác nhau giữa các provider?* → Chủ yếu là tính năng quản trị/giá; phần giao thức OIDC giống nhau nên code tích hợp gần như không đổi.

---

## SLIDE 3 — "OIDC in DevOps — GitHub Actions → AWS" `(~2 phút)`

**MÀN HÌNH:** Đoạn YAML (`permissions: id-token: write` + `configure-aws-credentials`) · dòng `sub = "repo:org/repo:ref:refs/heads/main"` · sơ đồ 4 bước (flow-steps).

**NÓI:**
- "Cùng giao thức làm 'Login with Google' cũng dùng để **xóa sạch AWS key lưu cứng trong CI/CD**."
- **Nêu vấn đề:** "GitHub Actions cần quyền AWS để deploy. Cách làm ẩu là tạo IAM user, nhét access key dài hạn vào GitHub Secrets. Cái key đó **không bao giờ hết hạn, khó xoay vòng, và nếu repo bị lộ là lộ toàn bộ quyền AWS.**"
- **CHỈ vào sơ đồ 4 bước, đọc theo:**
  1. "**AWS đăng ký GitHub là OIDC provider** — tin issuer `token.actions.githubusercontent.com`."
  2. "Mỗi lần chạy, **GitHub ký một JWT ngắn hạn**; claim `sub` ghi rõ **repo và branch nào**."
  3. "**`AssumeRoleWithWebIdentity`** — AWS kiểm chữ ký JWT qua JWKS của GitHub, đối chiếu `aud`/`sub` với trust policy của IAM role."
  4. "**Trả credential tạm 15 phút.** Không có secret dài hạn ở đâu cả — không trong Secrets, không trên đĩa."
- **CHỈ vào dòng `sub`:** "Trust policy khóa cứng vào đúng repo + branch qua `sub`. Nên chỉ đúng repo đó, branch `main` mới assume được role — repo khác hay branch khác là không."
- **Câu chốt:** "**Zero secret lưu trữ, zero việc xoay vòng key, và least-privilege ngay tại tầng IAM.** Đây là OIDC làm machine identity — `sub` chỉ là một workflow thay vì một con người."

**CHUYỂN Ý (handoff lại cho Trúc):** "Vậy đó là tầng **danh tính** — OIDC trả lời 'ai vừa đăng nhập', cho cả người lẫn máy. Giờ mình chuyển sang tầng **phiên đăng nhập** và các yếu tố chứng minh danh tính — mời Trúc tiếp phần session và MFA."

**Q&A thủ sẵn:**
- *Sao credential chỉ 15 phút?* → Đó là mặc định của session tạm; ngắn để nếu lộ cũng hết hạn nhanh. Có thể chỉnh nhưng nên giữ ngắn.
- *`aud` trong token GitHub→AWS là gì?* → Mặc định là `sts.amazonaws.com`; AWS kiểm `aud` + `sub` khớp trust policy mới cho assume role.
- *Khác gì với access key IAM?* → Access key dài hạn, lưu cứng, lộ là toàn quyền. OIDC token ngắn hạn, không lưu, khóa theo repo/branch — an toàn hơn hẳn.

---

# PHẦN C — Q&A đào sâu (phòng câu khó)

**Q: OIDC với OAuth chính xác khác nhau ở đâu, một câu?**
→ OAuth 2.0 là *authorization* (cấp quyền truy cập tài nguyên); OIDC thêm *authentication* (danh tính) qua ID token. OIDC = OAuth + ID token + userinfo + discovery.

**Q: Tại sao 'Login with Google' phải là OIDC chứ không OAuth?**
→ Vì mục tiêu là biết *user là ai* để đăng nhập họ — đó là danh tính, chính là ID token, chính là OIDC. Nếu chỉ OAuth, mình có access token nhưng không có cách chuẩn để biết danh tính.

**Q: ID token có cần lưu/gửi đi không?**
→ Không gửi đi đâu. App đọc nó **một lần** lúc đăng nhập để xác lập "user là ai", rồi tự tạo session của app. Sau đó vòng đời session do app quản, ID token xong việc.

**Q: JWKS là gì và vì sao cần?**
→ Là tập **public key** provider publish (ở `jwks_uri`). App dùng nó để **kiểm chữ ký** ID token (thường RS256). Key xoay vòng được; app chọn đúng key theo `kid` trong header token.

**Q: OIDC vs SAML?**
→ Cùng giải quyết SSO/danh tính liên kết. SAML cũ (2005), dựa **XML**, thống trị enterprise. OIDC mới (2014), dựa **JSON/JWT**, thân thiện mobile/API. Bị vendor ép thì SAML, tự kiểm soát thì OIDC. (Trúc nói kỹ SAML ở slide sau.)

**Q: Discovery document có gì?**
→ JSON liệt kê `authorization_endpoint`, `token_endpoint`, `userinfo_endpoint`, `jwks_uri`, các thuật toán hỗ trợ… App fetch một lần, cấu hình chỉ cần issuer URL. (Mở thử link Google trong slide cho khán giả xem nếu có mạng.)

**Q: Token GitHub→AWS có phải ID token không?**
→ Đúng tinh thần là một OIDC JWT có chữ ký (id_token) cấp cho workflow; AWS validate y như validate ID token của user — cùng cơ chế JWKS + kiểm `iss`/`aud`/`sub`.

---

# PHẦN D — Checklist trước khi lên (1 phút chuẩn bị)

- [ ] Thuộc **quy tắc vàng**: ID token = biết user là ai; access token = gọi API; không dùng ID token gọi API.
- [ ] Thuộc **3 thứ OIDC thêm**: ID token · /userinfo · discovery.
- [ ] Nhớ **mạch mở bài**: nối từ cliffhanger "Login with Google là OIDC" của Trúc.
- [ ] Nhớ **câu handoff cuối**: "đó là tầng danh tính… mời Trúc tiếp session & MFA."
- [ ] (Nếu có mạng) thử mở link discovery của Google trong slide 1 để demo sống.
- [ ] Hít thở — **4 slide, ~7–8 phút**, nói chậm phần "ID token vs access token" (slide 1) và bước "đổi code lấy token" (slide sơ đồ).
