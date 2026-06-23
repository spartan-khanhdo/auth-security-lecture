# Kịch bản trình bày — Section 4 · 5 · 6 (Khanh)

**Người trình bày:** Khanh · **Thời lượng:** ~27 phút (11 + 9 + 7)
**Vị trí:** Nối tiếp ngay sau phần OIDC + Session/MFA đã trình bày hôm trước.

> ⚠️ OIDC đã được nói kỹ rồi → trong Section 6, phần OIDC **đã được gỡ bỏ**. Giờ Section 6 chỉ còn **CSRF + RBAC/ABAC**. Nếu khán giả hỏi OIDC, chỉ cần nhắc lại 1 câu và trỏ về phần cũ.

> Cách dùng: **NÓI** = lời thoại đọc gần như nguyên văn · **CHỈ** = chỉ tay vào màn hình · **CHUYỂN Ý** = câu nối · **In đậm** = câu chốt, nói chậm.

---

## MỞ ĐẦU TOÀN PHẦN (~20 giây)

**NÓI:**
- "Phần trước mình đã nói **danh tính của con người** — đăng nhập, session, MFA, OIDC. Ba phần tiếp theo mình đi xuống tầng sâu hơn: **(1)** khi không còn con người nào cả — service tự xác thực với service; **(2)** những lỗ hổng bảo mật kinh điển phải tránh; **(3)** ba mảnh ghép hay bị bỏ quên: CSRF và mô hình phân quyền RBAC/ABAC."

---

# ════════════════════════════════════════
# SECTION 4 — SERVICE-TO-SERVICE AUTH (~11 phút)
# ════════════════════════════════════════

## PHẦN A — Kiến thức nền PHẢI nắm cứng

**5 ý cốt lõi:**

1. **Vấn đề:** Traffic nội bộ giữa các microservice là **east-west, tự động, không có session người dùng**. Không thể hỏi "user là ai". Câu hỏi đổi thành: **"service nào đang gọi, và nó được phép làm gì?"**

2. **Anti-pattern chí mạng:** *"API nội bộ = API tin được."* Sai. **Ranh giới mạng chỉ kiểm soát "ai chạm tới được", không kiểm soát "ai là ai".** Một pod bị chiếm là gọi thẳng được Payments nếu chỉ tin theo vị trí mạng.

3. **Lời giải — Client Credentials grant:** Service "đăng nhập như chính nó". Nó cầm `client_id` + `client_secret` (= username/password của **app**, không phải của người), gửi tới token endpoint của Auth Server, nhận về **access token ngắn hạn (JWT)**. Không redirect, không browser, vì không có user.

4. **JWT cho M2M — Service B validate LOCAL (stateless):**
   - `sub` = service gọi (vd `service-a`)
   - `iss` = Auth Server phát token
   - `aud` = service nào được nhận token này (vd `service-b`)
   - `exp` = hết hạn ngắn (5–15 phút)
   - `scope`/`scp` = quyền được cấp
   - → Service B kiểm chữ ký bằng **JWKS** (public key của Auth Server), không gọi ngược lại Auth Server mỗi request.

5. **Validation ≠ Authorization (2 việc khác nhau, cả hai phải pass):**
   - **Validation** = "token này thật và dành cho tôi không?" → kiểm **chữ ký** (JWKS), `exp`, `iss`, `aud`.
   - **Authorization** = "caller này được làm việc này không?" → map `scope` → endpoint/action, ép **least privilege** theo route.

**Mental model vàng (nói thuộc lòng):**
> **OAuth 2.0 nói *cách lấy token* · JWT nói *token trông như thế nào* · policy của Service B nói *caller được làm gì*.**

---

## PHẦN B — Kịch bản từng slide

### SLIDE 4.1 — "Who Is the Caller?" (vấn đề) `~1.5 phút`
**MÀN HÌNH:** prose vấn đề + sơ đồ "compromised pod" gọi thẳng Payments.

**NÓI:**
- "Đây là bài toán: Service A gọi Service B, **không có user nào đăng nhập cả**. Service B vẫn phải biết *ai đang gọi* và *được làm gì*."
- "Traffic nội bộ có 3 đặc điểm: **east-west** (service tới service), **tự động** (không có người bấm nút), **sessionless** (không có phiên đăng nhập)."
- **CHỈ vào pod đỏ:** "Nếu Service B tin 'cứ trong cluster là tin được', thì **một pod bị chiếm là gọi thẳng được Payments**."
- **Câu chốt (nói chậm):** "**Ranh giới mạng kiểm soát *chạm tới được*, không kiểm soát *là ai*.** Đây là tư duy zero-trust."

**CHUYỂN Ý:** "Vậy sửa thế nào? Đặt một Auth Server vào giữa."

### SLIDE 4.2 — "Auth Server Issues the Tokens" (kiến trúc nền) `~1.5 phút`
**MÀN HÌNH:** 3 vai (Service A / Auth Server / Service B) + sơ đồ 3 bước.

**NÓI:**
- "Lời giải: **không ai được tin theo vị trí — ai cũng phải cầm token do Auth Server phát.**"
- **CHỈ 3 vai:** "**Service A** là caller. **Auth Server** xác minh và phát token. **Service B** validate token rồi phục vụ."
- **CHỈ 4 bước:** "A xác thực với Auth Server → nhận access token (JWT) → gọi B kèm `Authorization: Bearer` → B validate."
- **Câu chốt:** "**Service B validate JWT *local* — không phải gọi ngược về Auth Server mỗi request.** Đó là cái hay của JWT stateless."

**CHUYỂN Ý:** "Service 'đăng nhập' kiểu gì khi không có người? Đó là Client Credentials."

### SLIDE 4.3 — "How a Service Logs In as Itself" (Client Credentials) `~2 phút`
**MÀN HÌNH:** prose + ví dụ `POST /oauth/token` + sơ đồ 3 cổng (active? → secret? → scope?).

**NÓI:**
- "Client Credentials = service **đăng nhập như chính nó**. Nó giữ `client_id` + `client_secret` — **username/password của app, không phải của người**."
- **CHỈ đoạn POST:** "Nó gửi id + secret + `scope` muốn xin tới token endpoint, nhận về **access token ngắn hạn**."
- **CHỈ 3 cổng:** "Auth Server kiểm 3 cổng: **client còn active không → secret đúng không (kiểm bằng bcrypt) → scope có được cấp không**. Sai bất kỳ cái nào là từ chối."
- **Lưu ý nhỏ:** "Lỗi luôn trả mơ hồ `invalid_client` để **chặn dò client-id**."
- **Câu chốt:** "**Đưa secret vào, nhận token có scope ra.** Nhờ vậy Service B *không bao giờ phải kiểm secret* — nó chỉ kiểm một token tự chứa, ngắn hạn."

**CHUYỂN Ý:** "Token đó nên chứa gì?"

### SLIDE 4.4 — "What the Token Should Contain" (JWT claims) `~1.5 phút`
**MÀN HÌNH:** danh sách claim `sub/iss/aud/exp/scope` + callout.

**NÓI:**
- **CHỈ từng claim:** "`sub` = service nào gọi · `iss` = Auth Server của mình · `aud` = service nào được nhận · `exp` = hết hạn 5–15 phút · `scope` = quyền."
- "Đây đúng là những gì Service B đọc mỗi request: **danh tính (`sub`), độ tin (`iss`/`aud`), độ tươi (`exp`), quyền (`scope`).**"
- **Câu chốt (cảnh báo):** "**Để hint phân quyền (scope/role) vào token — nhưng TUYỆT ĐỐI không để secret hay PII.** Ai chặn được JWT là đọc được payload — **Base64 là encoding, không phải mã hóa.**"

**CHUYỂN Ý:** "Service B nhận token rồi quyết định ra sao?"

### SLIDE 4.5 — "How Service B Decides" (validation + authz) `~1.5 phút`
**MÀN HÌNH:** 2 cột Validation/Authorization + sơ đồ scope → endpoint.

**NÓI:**
- "**Hai việc tách biệt, cả hai phải pass.**"
- **CHỈ Validation:** "**'Token thật và dành cho tôi không?'** → kiểm **chữ ký** qua JWKS, `exp`, `iss`, `aud`."
- **CHỈ Authorization:** "**'Caller được làm việc này không?'** → map `scope` sang endpoint, ép **least privilege**."
- **CHỈ sơ đồ:** "Token chỉ mang `orders.read` thì **không bao giờ ghi được** — least privilege gói trong một bức tranh."

**CHUYỂN Ý:** "Client Credentials là mặc định, nhưng không phải lựa chọn duy nhất."

### SLIDE 4.6 — "Beyond Client Credentials" (các phương án khác) `~1.5 phút`
**MÀN HÌNH:** mTLS · service mesh · API keys · private_key_jwt.

**NÓI:**
- "**mTLS (mutual TLS):** danh tính mạnh ở **tầng transport** — hai bên cùng trình chứng chỉ, handshake fail nếu cái nào sai/hết hạn. Hợp zero-trust / service mesh."
- "**Service mesh (Istio/Linkerd):** sidecar tự lo xoay vòng cert + áp policy → **code ứng dụng không cầm credential.**"
- "**API keys:** dễ làm nhất nhưng quản trị yếu (xoay vòng, scope, audit) trừ khi tự xây nhiều."
- "**`private_key_jwt`:** client **ký JWT bằng private key** thay vì gửi `client_secret` dùng chung — an toàn hơn cho client nhạy cảm."

**CHUYỂN Ý:** "Để thấy mTLS chạy thật, xem demo handshake."

### SLIDE 4.7 — DEMO: mTLS Handshake `~1 phút`
**NÓI:** "Cả hai bên trình cert. Mỗi bên kiểm cert bên kia ký bởi CA tin cậy. **Một bên sai cert là handshake gãy — danh tính khóa ngay ở tầng kết nối, trước cả khi có dữ liệu.**"

### SLIDE 4.8 — "Putting It All Together" (best practices) `~1 phút`
**MÀN HÌNH:** checklist + sơ đồ kiến trúc đầy đủ (Auth layer + Services + Mesh).

**NÓI (đọc nhanh checklist):**
- "**Token ngắn hạn 5–15 phút · luôn kiểm `iss`/`aud`/chữ ký/`exp` · secret trong Vault/KMS không để trong code · xoay vòng credential + signing key · mỗi service một identity riêng · log `jti`/`sub` chứ không log full token.**"
- **Câu chốt:** "**Token identity (client credentials + JWKS) và transport identity (mTLS qua mesh) có thể xếp chồng** trong zero-trust — không loại trừ nhau."

**HANDOFF Section 5:** "Đó là cách máy tin máy. Giờ ta nhìn những lỗ hổng làm sập app trong thực tế."

---

## PHẦN C — Q&A Section 4

- **Vì sao đổi secret lấy token chứ không gửi secret thẳng?** → Để Service B không bao giờ phải biết/kiểm secret. Nó chỉ kiểm một token tự chứa, ngắn hạn, hết hạn nhanh nếu lộ.
- **JWKS (JSON Web Key Set) là gì?** → Danh sách **public key** Auth Server công bố công khai (file JSON ở `/.well-known/jwks.json`). JWT ký bằng **private key** (chỉ Auth Server giữ); Service B fetch **public key** từ JWKS để **kiểm chữ ký** — verify được nhưng không ký giả được. Mỗi key có `kid`; header JWT cũng ghi `kid` → Service B chọn đúng key. **Lợi ích:** Auth Server **xoay vòng (rotate) key** mà không service nào phải hardcode key hay deploy lại. *(Chính là `jwks_uri` mình đã nói ở phần OIDC — cùng một ý tưởng, dùng lại cho M2M.)*
- **Least privilege (đặc quyền tối thiểu) là gì?** → Nguyên tắc: **cấp đúng quyền tối thiểu cần để làm việc, không hơn.** Vd token chỉ mang `scope: orders.read` thì **không bao giờ ghi/xóa được** — lộ cũng chỉ đọc. Mục tiêu: **giảm "blast radius"** — bị chiếm thì thiệt hại bị giới hạn đúng trong quyền được cấp. Áp khắp nơi: scope của token, DB user read-only (chống SQLi), role trong RBAC/ABAC, IAM role khóa đúng resource (như `sub` khóa repo+branch ở OIDC→AWS).
- **Sao token ngắn hạn 5–15 phút?** → Không có refresh phức tạp cho M2M; lộ token thì hết hạn nhanh, và service xin token mới rẻ.
- **mTLS thay được JWT không?** → mTLS chứng minh *danh tính kết nối*, JWT mang *scope/quyền*. Thường **kết hợp**: mTLS cho ai-là-ai, JWT cho được-làm-gì.
- **API key vs Client Credentials?** → API key tĩnh, khó scope/xoay vòng. Client Credentials cho token ngắn hạn có scope, chuẩn OAuth → governance tốt hơn.
- **`aud` để làm gì?** → Chống token "dùng nhầm chỗ": token đúc cho `service-b` mà gửi tới `service-c` thì `service-c` từ chối vì `aud` sai.

---

# ════════════════════════════════════════
# SECTION 5 — SECURITY FUNDAMENTALS (~9 phút)
# ════════════════════════════════════════

## PHẦN A — Kiến thức nền PHẢI nắm cứng

1. **CIA triad** — mọi control rốt cuộc bảo vệ 3 thứ:
   - **Confidentiality** = không rò rỉ (PII, token, secret)
   - **Integrity** = không bị sửa trộm (số dư, quyền)
   - **Availability** = vẫn dùng được (chống DDoS/cạn tài nguyên)
   - Mọi vụ breach đi cùng một đường: **Vulnerability → Exploit → Impact → mất CIA.**

2. **Hashing ≠ Encryption (đừng lẫn):**
   - **Hashing = một chiều** → dùng cho **password**. Lưu cái *verify được* nhưng *không khôi phục được*. Dùng **bcrypt/Argon2** (cố tình chậm) + **salt** riêng mỗi user.
   - **Encryption = hai chiều** → dùng cho **dữ liệu nhạy cảm cần lấy lại**. Dùng **AES-256-GCM**, key để trong **KMS/Vault**.
   - ⛔ **KHÔNG dùng MD5/SHA-1/SHA-256 trần cho password** — quá nhanh, GPU bẻ hàng tỉ/giây.

3. **3 lỗ hổng OWASP kinh điển — chung một công thức: *input không tin được chạm tới sink nhạy cảm*:**
   - **SQL Injection** — input nối thẳng vào SQL. `' OR '1'='1` trả mọi user; `'; DROP TABLE users; --` xóa bảng. **Fix: parameterized query**, validate identifier theo allowlist, DB user least-privilege.
   - **XSS** — JS của attacker chạy trong browser nạn nhân → trộm token, hành động thay user. **Fix: output encoding, CSP, KHÔNG để token trong `localStorage`.**
   - **Broken Access Control / IDOR** — đổi `/orders/1234` → `/5678` lấy được đơn người khác vì server không kiểm sở hữu. **Fix: authz server-side mọi request, không tin role/id từ client, default deny.**

4. **4 thói quen cốt lõi:** never trust client input · least privilege · **defense in depth** (xếp lớp authn+authz+validation+logging+rate limit) · secure secrets (KMS/Vault, xoay vòng, audit).

**Câu chốt vàng:**
> **Security = correctness under attack (đúng đắn dưới input thù địch) — secure defaults, xếp lớp.**

---

## PHẦN B — Kịch bản từng slide

### SLIDE 5.1 — "Protect the CIA Triad" `~1.5 phút`
**NÓI:**
- "Mọi biện pháp bảo mật cuối cùng bảo vệ 3 thứ: **Confidentiality** không rò rỉ, **Integrity** không bị sửa trộm, **Availability** vẫn sống."
- **Câu chốt:** "Mọi vụ breach đi cùng một đường: **lỗ hổng → khai thác → tác động → mất CIA. Bắt được lỗ hổng từ đầu là cả ván cờ.**"
- "Và nhớ: **bảo mật không phải 'tính năng thêm' — nó là *correctness dưới input thù địch*.**"

### SLIDE 5.2 — "One-Way vs Two-Way" (hashing vs encryption) `~2 phút`
**MÀN HÌNH:** sơ đồ hashing (mũi tên không quay lại) vs encryption (hai chiều).

**NÓI:**
- "**Hashing một chiều — dùng cho password.** Lưu thứ *verify được* nhưng *không lấy lại được*. Dùng **bcrypt/Argon2** — cố tình chậm — kèm **salt** riêng mỗi user."
- "**Encryption hai chiều — dùng cho dữ liệu phải lấy lại**: PII, token at-rest, secret trong DB. Dùng **AES-256-GCM**, key để trong **KMS/Vault, không để trong code.**"
- **Câu chốt (cảnh báo, nói chậm):** "**Tuyệt đối không dùng MD5/SHA-256 trần cho password — quá nhanh, GPU bẻ hàng tỉ mật khẩu mỗi giây.**"
- **CHỈ sơ đồ:** "Mũi tên nói hết: hash *không quay lại được*, encryption *quay lại được*."

### SLIDE 5.3 — "When Input Becomes Code" (SQL Injection) `~1.5 phút`
**NÓI:**
- "SQLi xảy ra khi **input bị nối thẳng vào câu SQL.**"
- **CHỈ ví dụ:** "Nhập `' OR '1'='1` → trả **mọi user**. Nhập `'; DROP TABLE users; --` → **xóa bảng.**"
- "**Fix: parameterized query / prepared statement** — tham số không bao giờ bị hiểu là code. Cộng thêm: validate tên bảng/cột theo allowlist, DB user least-privilege."
- **Câu chốt:** "Công thức OWASP: **hầu hết tấn công chỉ là 'input không tin được chạm tới một sink nhạy cảm'. Làm sạch ở giữa source và sink.**"

### SLIDE 5.4 — "Attacker JS Runs in the Victim's Browser" (XSS) `~1.5 phút` + DEMO
**NÓI:**
- "XSS = **JS của attacker chạy trong browser nạn nhân.** Hậu quả: trộm token, hành động thay user."
- "**Fix: output encoding/escaping** (cả server lẫn client), **CSP**, và **đừng để token trong `localStorage`** — XSS đọc sạch mọi thứ ở đó."
- **DEMO XSS Sandbox:** "Mình bắn payload vào, nó chạy; bật output-encoding lên → payload thành text vô hại."

> 🔗 **Cầu nối:** "Để token ở đâu cho an toàn — chính là phần token storage mình đã nói ở lecture JWT/session." (1 câu, không sa đà.)

### SLIDE 5.5 — "Change the ID, Get Someone Else's Data" (Broken Access Control / IDOR) `~1.5 phút`
**NÓI:**
- "Đổi `/api/orders/1234` thành `/5678` → server trả **đơn của người khác**, vì nó **không kiểm sở hữu.**"
- "**Fix: ép authorization *server-side* mọi request · không tin role/id từ client — suy lại từ session · test kịch bản 'đổi id trên URL' · default deny.**"
- **Câu chốt:** "**Thứ duy nhất chắn giữa dữ liệu của A và B là một check sở hữu phía server.**"

### SLIDE 5.6 — "Principles & In Our System" (defense in depth) `~1 phút`
**MÀN HÌNH:** sơ đồ nhiều lớp: rate limit → authn → authz → validation → logging → resource.

**NÓI:**
- "4 thói quen: **never trust client input · least privilege · defense in depth · secure secrets.**"
- "Trong hệ của mình: **password hash bcrypt/Argon2 · JWT validate ở API · HTTPS mọi nơi · authz ép ở backend route.**"
- **Câu chốt:** "**Không lớp nào được tin một mình — lọt lớp này thì lớp sau bắt.**"

**Checkpoint (nếu có time):** câu hỏi password hashing — đáp án **bcrypt/Argon2** vì cố tình chậm.

**HANDOFF Section 6:** "Đó là nền tảng. Cuối cùng, ba mảnh ghép hay bị bỏ quên."

---

## PHẦN C — Q&A Section 5

- **Salt để làm gì?** → Chuỗi ngẫu nhiên riêng mỗi user thêm vào trước khi hash → hai người cùng mật khẩu vẫn ra hash khác nhau → vô hiệu **rainbow table**.
- **bcrypt vs Argon2?** → Cùng "chậm có chủ đích". Argon2 mới hơn, chống cả tấn công GPU/ASIC bằng tham số memory-hard. Cả hai đều ổn; Argon2id được khuyến nghị hiện đại.
- **Sao SHA-256 nhanh lại là điểm yếu cho password?** → Nhanh = attacker thử được nhiều hơn. Password hashing cần *chậm* để brute-force trở nên đắt.
- **Parameterized query khác escaping thế nào?** → Parameterized tách hẳn *code* và *data* ở tầng driver/DB — input không bao giờ được parse như SQL. Escaping thủ công dễ sót.
- **CSP là gì?** → Content-Security-Policy: header bảo browser chỉ chạy script từ nguồn cho phép → giảm mạnh tác động XSS.
- **IDOR khác broken access control thế nào?** → IDOR là một dạng cụ thể của broken access control (truy cập trực tiếp object qua id không kiểm quyền).

---

# ════════════════════════════════════════
# SECTION 6 — GAPS: CSRF + RBAC/ABAC (~7 phút)
# ════════════════════════════════════════

> ✂️ Phần OIDC đã gỡ (đã nói hôm trước). Nếu bị hỏi: *"OIDC mình đã đi kỹ ở phần danh tính rồi — tóm lại nó thêm ID token cho biết user là ai; access token mới để gọi API."* Rồi quay lại CSRF.

## PHẦN A — Kiến thức nền PHẢI nắm cứng

1. **CSRF (Cross-Site Request Forgery):** Site độc dụ **browser nạn nhân** gửi một request **có credential** tới API của bạn. **Browser tự đính kèm cookie**, nên server tưởng là hợp lệ.
   - Ví dụ: đang đăng nhập bank, trang độc có `<img src="https://bank.com/transfer?to=attacker&amount=1000">` → browser bắn request **kèm session cookie** → bank xử lý.
   - **Fix:** `SameSite=Strict` trên cookie (không gửi khi cross-site) · **CSRF token** (secret mỗi session, mọi request mutating phải echo lại) · **`Authorization: Bearer` tự nhiên miễn nhiễm CSRF** vì trang cross-site *không set được custom header* — browser chỉ tự đính kèm **cookie**, không tự đính kèm header.
   - 🔗 Đây đúng là lý do lecture JWT để `SameSite=Strict` cho refresh cookie.

2. **RBAC vs ABAC — hai cách quyết định "ai được làm gì":**
   - **RBAC (Role-Based):** quyền gắn vào **role**, role gán cho user. `admin → full · editor → read+write · viewer → read`. Đơn giản, dễ suy luận → **hầu hết app bắt đầu ở đây**. Nhược: **role phình nhanh** khi nhiều ca ngoại lệ.
   - **ABAC (Attribute-Based):** quyền tính từ **policy kết hợp thuộc tính** (user / resource / environment). Vd: `allow if user.dept == resource.dept AND action == 'read' AND hour < 18`. Linh hoạt, xử lý luật phức tạp, nhưng **khó debug/audit**.
   - **Quy tắc ngón cái:** *bắt đầu bằng RBAC; chuyển sang ABAC khi role không diễn đạt nổi policy* — vd kinh điển: **"editor chỉ được sửa bài CỦA CHÍNH MÌNH"** (ownership là thuộc tính của cặp user–resource, RBAC thuần không nắm được).

---

## PHẦN B — Kịch bản từng slide

### SLIDE 6.1 — "The Browser Sends Cookies for You" (CSRF) `~2 phút`
**MÀN HÌNH:** prose + sơ đồ tấn công (malicious page → browser auto cookie → bank → 💥 transfer).

**NÓI:**
- "CSRF: **một site độc dụ browser của bạn gửi request có credential tới API của bạn.** Mấu chốt: **browser TỰ đính kèm cookie**, nên server tưởng là chính chủ."
- **CHỈ ví dụ:** "Bạn đang đăng nhập bank. Trang độc nhúng `<img src=bank.com/transfer?...>`. Browser bắn request **kèm session cookie** — và bank xử lý."
- **CHỈ fix checklist:** "**`SameSite=Strict`** — cookie không gửi khi cross-site. **CSRF token** — secret mỗi session phải echo lại. Và **`Authorization: Bearer` tự nhiên an toàn** — trang cross-site **không set được custom header**, browser chỉ tự đính kèm cookie thôi."
- **Câu chốt (cầu nối):** "Đây chính là lý do ở lecture JWT mình để **`SameSite=Strict`** cho refresh cookie — không phải cho đẹp, mà là chống CSRF ngay trong cookie."

**CHUYỂN Ý:** "Xem nó sống động qua demo."

### SLIDE 6.2 — DEMO: CSRF Sandbox `~1 phút`
**NÓI:** "Mình giả lập một request cross-site giả mạo → nó lọt. Giờ bật **`SameSite=Strict`** hoặc gắn **CSRF token** → request bị chặn ngay. **Cùng một tấn công, một dòng phòng thủ là khác kết quả.**"

### SLIDE 6.3 — "Modeling Permissions" (RBAC vs ABAC) `~2 phút`
**NÓI:**
- "AuthZ nói *ai được làm gì* — nhưng **hệ thống quyết định bằng cách nào?** Đó là RBAC và ABAC."
- "**RBAC:** quyền gắn role, role gán user — `admin/editor/viewer`. **Đơn giản, hầu hết app bắt đầu ở đây.** Nhược: **role phình nhanh** theo ca ngoại lệ."
- "**ABAC:** quyền tính từ **policy trên thuộc tính** — `allow if user.dept == resource.dept AND hour < 18`. Linh hoạt hơn nhưng **khó debug/audit.**"
- **Câu chốt:** "**Quy tắc ngón cái: bắt đầu RBAC; chuyển ABAC khi role không diễn đạt nổi policy** — ví dụ kinh điển *'editor chỉ được sửa bài của chính mình'*."

### SLIDE 6.4 — "Two Ways to Decide" (sơ đồ) `~1 phút`
**MÀN HÌNH:** sơ đồ RBAC (user→role→permissions→allow/deny) vs ABAC (nhiều attrs→policy engine→allow/deny).

**NÓI:**
- **CHỈ RBAC:** "RBAC đi theo chuỗi cố định: **user → role → permissions.**"
- **CHỈ ABAC:** "ABAC nạp **nhiều thuộc tính** — user, resource, environment — vào **policy engine** quyết định **theo từng request.**"
- **Câu chốt:** "RBAC = chuỗi cố định, dễ hiểu. ABAC = quyết định theo ngữ cảnh, mạnh nhưng phức tạp hơn."

**Checkpoint (nếu có time):** ownership ('editor sửa bài của mình' → ABAC) · multi-tenant SaaS (role-per-org + tier → ABAC territory).

**KẾT TOÀN PHẦN:** "Vậy là từ *máy xác thực máy*, qua *các lỗ hổng kinh điển*, tới *CSRF và mô hình phân quyền*. Đây là những mảnh ghép khép lại bức tranh Authentication & Security. Cảm ơn cả nhà."

---

## PHẦN C — Q&A Section 6

- **CSRF khác XSS thế nào?** → XSS = chạy *code lạ* trong browser nạn nhân. CSRF = lợi dụng *phiên hợp lệ sẵn có* để gửi request giả mạo — không cần chạy code trong trang bạn. Khác nhau hoàn toàn.
- **Sao Bearer token miễn nhiễm CSRF còn cookie thì không?** → Browser **tự** đính kèm cookie theo origin đích; còn header `Authorization` phải do JS **chủ động set** trên cùng origin → trang độc không set được.
- **`SameSite=Lax` vs `Strict`?** → `Lax` vẫn gửi cookie với điều hướng top-level GET (đỡ vỡ UX), chặn phần lớn CSRF. `Strict` chặt hơn, không gửi với mọi cross-site. Refresh/critical cookie nên `Strict`.
- **CSRF token hoạt động sao?** → Server phát một secret ngẫu nhiên theo session, nhúng vào form/header; mọi request mutating phải gửi lại đúng token → trang độc không biết token → bị chặn.
- **API thuần Bearer có cần CSRF token không?** → Thường không, vì đã miễn nhiễm CSRF. CSRF token chủ yếu cho app dùng **cookie** session.
- **RBAC scale tới đâu thì gãy?** → Khi xuất hiện quyền theo *quan hệ* (sở hữu, cùng phòng ban, theo tier) — role bắt đầu nhân bản `editor-of-doc-1`, `editor-of-doc-2`… → đó là lúc cần ABAC (hoặc RBAC + attribute).
- **Multi-tenant SaaS nên dùng gì?** → ABAC territory (hoặc RBAC scoped theo org + attribute): quyền phụ thuộc org membership, role-trong-org, và tier gói — một bộ role phẳng không diễn đạt nổi.

---

# ════════════════════════════════════════
# CHECKLIST TRƯỚC KHI LÊN (2 phút)
# ════════════════════════════════════════

- [ ] **Section 4 — câu thuộc lòng:** *OAuth = cách lấy token · JWT = token trông thế nào · policy Service B = caller được làm gì.* Và: **ranh giới mạng ≠ danh tính.**
- [ ] **Section 4 — Validation vs Authorization** là hai việc khác nhau (chữ ký/iss/aud/exp ≠ scope→endpoint).
- [ ] **Section 5 — câu thuộc lòng:** *Hashing một chiều cho password (bcrypt/Argon2) · Encryption hai chiều cho dữ liệu (AES + KMS). Không MD5/SHA cho password.*
- [ ] **Section 5 — công thức OWASP:** *input không tin được chạm sink nhạy cảm → làm sạch ở giữa.* (SQLi/XSS/IDOR đều theo nó.)
- [ ] **Section 6 — câu thuộc lòng:** *CSRF = browser tự gửi cookie giùm bạn; Bearer header miễn nhiễm; SameSite=Strict là phòng thủ.* Và *RBAC trước, ABAC khi role không diễn đạt nổi (ownership).* 
- [ ] **OIDC đã gỡ khỏi Section 6** — nếu bị hỏi, nhắc 1 câu rồi quay lại. ĐỪNG nói lại slide.
- [ ] Thuộc 3 câu **handoff** giữa các section (4→5→6).
- [ ] Nói **chậm** ở: "Base64 là encoding không phải mã hóa" (4.4), "không MD5/SHA cho password" (5.2), "browser tự đính kèm cookie" (6.1).
