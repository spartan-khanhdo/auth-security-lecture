# Tài liệu học — Auth & Security (Phần 1, 2, 3)

> Dành cho người mới bắt đầu. Mỗi mục: **Hiểu nôm na** → **Cách hoạt động** → **Vì sao quan trọng** → **Câu hỏi hay gặp (Q&A)**.
> Thuật ngữ kỹ thuật (JWT, token, OAuth, cookie…) giữ nguyên tiếng Anh vì lúc nói cũng dùng tiếng Anh.

---

# PHẦN 0 — Bức tranh tổng thể (đọc cái này trước)

Toàn bộ chủ đề auth chỉ xoay quanh 2 câu hỏi:

1. **Authentication (AuthN) — "Bạn là ai?"** → đăng nhập, chứng minh danh tính.
2. **Authorization (AuthZ) — "Bạn được làm gì?"** → quyền hạn, vào được trang nào, gọi được API nào.

> **Ví dụ sân bay:** AuthN = kiểm hộ chiếu xem bạn có đúng là người này không. AuthZ = tấm vé hạng ghế quyết định bạn được vào phòng chờ VIP hay không. Hai cái **khác nhau** và luôn tách riêng.

**Một lần đăng nhập điển hình diễn ra thế nào (nhớ cái này là hiểu 80%):**

```
1. User nhập username + password
2. Server kiểm password (so với hash trong DB)  ← AuthN
3. Server phát ra "tấm vé" (token hoặc session) để lần sau khỏi nhập lại
4. Mỗi request sau, client đính kèm tấm vé đó
5. Server kiểm vé → biết bạn là ai → quyết định cho làm gì  ← AuthZ
```

3 phần học sẽ lần lượt trả lời:
- **Phần 1:** Tấm vé đó là gì (session vs token/JWT), password lưu sao cho an toàn, làm sao thu hồi vé.
- **Phần 2 (OAuth):** Làm sao cho **app khác** mượn quyền của bạn mà không cần đưa password (vd "Login with Google").
- **Phần 3:** Quản lý phiên đăng nhập (session/cookie), **xác thực nhiều lớp** (MFA, OTP, passkey), và **đăng nhập một lần dùng nhiều app** (SSO/OIDC).

---

# PHẦN 1 — Nền tảng: Session, Password, JWT

## 1.1 Stateful (Session) vs Stateless (Token)

**Hiểu nôm na:** Sau khi bạn đăng nhập, server phải nhớ "thằng này đã đăng nhập rồi". Có 2 cách nhớ:

- **Stateful (session):** Server ghi vào sổ của nó: "phiên #abc123 = user Khanh". Client chỉ cầm cái mã `abc123` (trong cookie). Mỗi request, server tra sổ.
  - *Ví dụ:* gửi đồ ở quầy, bạn cầm cái **vé số** — thông tin nằm ở quầy, bạn chỉ cầm số.
- **Stateless (token/JWT):** Server không ghi sổ gì cả. Nó đưa cho bạn một **tấm vé tự chứa đủ thông tin** (tên, quyền, hạn dùng) và **ký tên** lên đó. Lần sau bạn đưa vé, server chỉ cần kiểm chữ ký là tin, khỏi tra sổ.
  - *Ví dụ:* tấm **vé máy bay** in sẵn tên + ghế + chuyến — nhân viên nhìn vé là biết, không cần gọi về tổng đài.

**So sánh:**

| | Stateful (session) | Stateless (JWT) |
|---|---|---|
| Server lưu gì | Có (sổ phiên, vd Redis) | Không |
| Thu hồi (logout) | **Dễ** — xóa dòng trong sổ là xong | **Khó** — vé vẫn hợp lệ tới khi hết hạn |
| Mở rộng nhiều server | Cần sổ chung (Redis) | **Dễ** — server nào cũng tự kiểm được |

**Vì sao quan trọng:** Đây là đánh đổi cốt lõi. Thực tế hay dùng **hybrid**: access token JWT ngắn hạn (để scale) + refresh token có lưu trong DB (để thu hồi được).

**Q&A:**
- *Khi nào chọn stateful, khi nào stateless?* → Cần "logout là chết phiên ngay lập tức" (ngân hàng, y tế) → stateful. Cần scale nhiều server, không muốn sổ chung → stateless. Đa số đi hybrid.
- *JWT scale tốt hơn sao không dùng luôn cho mọi thứ?* → Vì chính cái "không cần tra sổ" làm nó **khó thu hồi**. Stateless = nhanh nhưng mất quyền kiểm soát thu hồi.

---

## 1.2 Lưu password sao cho an toàn

**Hiểu nôm na:** Tuyệt đối **không lưu password thật** trong DB. Nếu DB bị lộ là lộ hết. Thay vào đó lưu **hash** — kết quả băm một chiều, từ hash không suy ngược ra password được.

**Cách hoạt động:**
```
Lúc đăng ký:  password → hash(password + salt) → lưu hash
Lúc đăng nhập: hash(password nhập vào + salt) → so với hash đã lưu
```
- **Salt** = chuỗi ngẫu nhiên riêng cho mỗi user, trộn vào trước khi băm. Nhờ salt mà 2 người cùng password "123456" lại ra 2 hash khác nhau → chống "rainbow table" (bảng tra hash dựng sẵn).
- Dùng **bcrypt** hoặc **Argon2id** (OWASP khuyên Argon2id). Mấy hàm này **cố tình chạy chậm** (vài trăm ms) → attacker không thử hàng tỉ password/giây được.

**Vì sao KHÔNG dùng MD5/SHA-256 cho password:** Mấy hàm đó thiết kế để **nhanh** → GPU thử **hàng tỉ lần/giây** → crack dễ. Password cần hàm **chậm + tốn bộ nhớ** (bcrypt/Argon2).

**Q&A:**
- *Hash với encrypt khác gì?* → **Hash = một chiều** (không giải ngược, dùng để *xác minh* — password). **Encrypt = hai chiều** (giải ngược được bằng key, dùng để *lấy lại* — vd số thẻ, PII).
- *Tại sao bcrypt/Argon2 mà không SHA-256?* → SHA-256 quá nhanh; password cần hàm chậm chống brute-force.
- *Salt để làm gì?* → Chống rainbow table + làm 2 password giống nhau ra hash khác nhau. Bcrypt/Argon2 tự sinh và nhúng salt.

---

## 1.3 JWT (JSON Web Token) — RFC 7519

**Hiểu nôm na:** JWT là "tấm vé tự chứa thông tin + có chữ ký". Gồm 3 phần ngăn bởi dấu chấm:

```
xxxxx.yyyyy.zzzzz
header.payload.signature
```
- **Header:** thuật toán ký (vd `RS256`).
- **Payload:** dữ liệu (claims) — vd `sub` (user id), `exp` (hết hạn), `role`. **Đọc được bằng mắt** (chỉ là Base64, không mã hóa!).
- **Signature:** chữ ký trên `header.payload`. Đây là phần chống giả mạo.

**Điểm CỰC KỲ hay nhầm:**
- **Base64 ≠ mã hóa.** Ai cầm JWT cũng decode đọc được payload. → **Đừng bao giờ để password/PII/số thẻ trong payload.** Để `role`, `user id` thì OK (không phải bí mật).
- Chữ ký đảm bảo **toàn vẹn** (integrity — không sửa được mà không bị phát hiện), **không** đảm bảo **bí mật** (confidentiality).

**Ký & kiểm chữ ký — 2 kiểu:**
- **HS256 (đối xứng):** 1 secret dùng cho cả ký lẫn kiểm. Ai kiểm được cũng **giả** được. Hợp với 1 service duy nhất.
- **RS256 / ES256 (bất đối xứng):** server ký bằng **private key**, các service khác kiểm bằng **public key** (lấy qua endpoint `JWKS`). Verifier không giả token được. → Dùng cái này khi nhiều service.

**Q&A:**
- *JWT ký cái gì?* → Ký `base64url(header) + "." + base64url(payload)`. Đổi 1 ký tự payload → chữ ký không khớp → bị từ chối.
- *Payload không mã hóa, để role có nguy hiểm không?* → Không. Role không phải bí mật. Chỉ cấm dữ liệu mà *lộ ra là hại* (password, PII).
- *HS256 hay RS256?* → Một service: HS256 OK. Nhiều service verify: RS256/ES256 + JWKS (verifier chỉ giữ public key).
- *Attack "alg: none"?* → JWT cho phép `alg=none` (không chữ ký). Server ngu ngốc tin header của token → attacker bỏ chữ ký, chế claim tùy ý. **Fix:** server phải **cố định** thuật toán mong đợi, không tin `alg` trong token.

---

## 1.4 Access token + Refresh token

**Hiểu nôm na:** Một tấm vé vừa sống lâu vừa quyền cao thì nguy hiểm nếu bị trộm. Nên tách 2 vé:
- **Access token (AT):** sống **ngắn** (~15 phút), dùng để gọi API. Hết hạn nhanh → trộm được cũng dùng được tí xíu.
- **Refresh token (RT):** sống **lâu** (ngày/tuần), chỉ dùng để **xin AT mới**. Lưu kỹ (hash trong DB, để trong HttpOnly cookie).

**Rotation (xoay vòng):** mỗi lần dùng RT để xin AT mới → server cấp RT mới và **hủy RT cũ**. 
**Reuse detection:** nếu một RT cũ (đã bị thay) bị dùng lại → coi như bị trộm → **hủy toàn bộ phiên của user đó**.

**Q&A:**
- *Lưu access token ở đâu trong trình duyệt?* → **Trong bộ nhớ JS (RAM)**, không phải `localStorage`. Vì `localStorage` bị XSS đọc sạch. Refresh trang mất AT → app tự gọi `/refresh` (cookie tự gửi) lấy AT mới.
- *RT để trong cookie thì dính CSRF không?* → Có nguy cơ → phải `SameSite=Strict/Lax` + `HttpOnly` + `Secure`. Đánh đổi: cookie chống XSS, header/RAM chống CSRF.
- *Refresh token rotation là gì?* → Mỗi lần refresh đổi RT mới, hủy cũ; nếu RT cũ xuất hiện lại → báo động trộm, hủy hết.

---

## 1.5 Thu hồi JWT (Revocation) — vấn đề của stateless

**Hiểu nôm na:** JWT đã phát ra thì **valid tới khi hết hạn**, dù user đã logout hay bị khóa. Xóa token ở client **không phải** thu hồi (server vẫn chấp nhận nếu ai đó còn giữ bản copy). 3 cách giải:

1. **TTL ngắn:** để AT sống ngắn (vài phút); logout chỉ cần hủy RT. Cửa sổ rủi ro nhỏ. Đơn giản nhất.
2. **Redis denylist:** lưu `jti` (id token) bị thu hồi vào Redis, TTL = thời gian còn lại. Mỗi request kiểm Redis. **Thu hồi từng token** (logout 1 thiết bị). Tốn ~1-2ms/request.
3. **Token versioning:** mỗi user có 1 số `jwt_version`; token mang claim `ver`. Tăng version → **mọi token cũ chết hết** (đổi password, bị hack, đổi quyền).

**Vì sao quan trọng:** thực tế kết hợp cả 3: TTL ngắn làm nền, denylist cho logout từng thiết bị, versioning cho sự kiện bảo mật.

**Q&A:**
- *Làm sao thu hồi JWT trước khi hết hạn?* → Không thu hồi "thật" được; dùng TTL ngắn + denylist + revoke refresh token.
- *Khi nào dùng versioning vs denylist?* → Versioning = giết tất cả phiên (đổi pass, bị hack). Denylist = giết 1 token (logout 1 máy).

---

# PHẦN 2 — OAuth: Ủy quyền cho app khác

## 2.1 Vì sao cần OAuth

**Hiểu nôm na:** App A (vd một app chỉnh ảnh) muốn truy cập ảnh Google Drive của bạn. Cách *sai* ngày xưa: bạn đưa luôn **username + password Google** cho app A. Nguy hiểm vì:
- App A thấy password thật của bạn.
- App A làm được **mọi thứ** với tài khoản bạn, không giới hạn.
- Muốn cắt quyền phải đổi password.

**OAuth** sinh ra để: cho app A một **tấm vé giới hạn** (access token, chỉ đọc ảnh, hết hạn được) mà **không hề thấy password** của bạn.

> Phân biệt: **"tự quản lý auth"** = xác thực user *của chính mình* (Phần 1). **OAuth** = cho **app bên ngoài** hành động *thay mặt user* mà không thấy credential.

## 2.2 OAuth 1.0 → 2.0

- **OAuth 1.0 (2010, RFC 5849):** mỗi API call phải **ký bằng HMAC-SHA1**. An toàn nhưng phức tạp, khó làm trên mobile → chết.
- **OAuth 2.0 (2012, RFC 6749):** bỏ ký từng request, dựa vào **HTTPS** cho an toàn đường truyền, thêm **scope** (giới hạn quyền) và **grant types** (nhiều kiểu lấy token).

## 2.3 Grant types (các kiểu lấy token)

- **Authorization Code (+ PKCE):** cho web/SPA/mobile có **người dùng**. Phổ biến nhất.
- **Client Credentials:** cho **máy-với-máy** (service gọi service, không có người). ← đây là phần 4 của bạn (Khanh) tuần sau.
- **Device Code:** cho TV/CLI (màn hình không tiện gõ).
- ⚠️ **Implicit** và **Password (ROPC)** đã **deprecated** — đừng dùng.

## 2.4 Authorization Code flow

**Hiểu nôm na:** Thay vì đưa token thẳng cho trình duyệt (dễ lộ), OAuth đưa một **"mã đổi quà" (code)** dùng-một-lần, rồi app **đổi code lấy token ở phía server** (kênh sau lưng, không qua URL).

```
1. App đẩy user sang trang login của Google (kèm state)
2. User đăng nhập + đồng ý → Google trả về 1 "code" (qua redirect)
3. App gửi code (+ secret) ở back-channel để đổi lấy access token
4. App dùng access token gọi API
```
- **`state`:** chuỗi ngẫu nhiên app tạo, kiểm lại khi quay về → **chống CSRF**.
- **Code** sống ngắn (RFC khuyến nghị **tối đa 10 phút**, thực tế hay 30–60s), **dùng một lần**.

## 2.5 PKCE — RFC 7636 (sẽ bị hỏi nhiều)

**Hiểu nôm na:** App mobile/SPA **không giữ được secret** (ai cũng mở code ra xem được). PKCE thay secret bằng một "câu đố dùng một lần":
```
1. App tạo code_verifier (chuỗi ngẫu nhiên, giữ bí mật trong máy)
2. App gửi code_challenge = SHA256(code_verifier) ở bước /authorize
3. Lúc đổi code lấy token, app phải đưa code_verifier gốc
4. Server băm lại, so với code_challenge đã lưu → khớp mới cấp token
```
**Tác dụng:** kẻ trộm chộp được `code` cũng vô dụng, vì không có `code_verifier` (cái này không bao giờ rời máy cho tới bước đổi token).

**Q&A:**
- *Không có secret sao PKCE chặn được?* → `code_challenge` chốt ở bước `/authorize` trước; đổi code phải kèm `code_verifier` đúng (SHA-256 khớp). Attacker chỉ có code → fail.
- *Confidential client đã có secret còn cần PKCE?* → Có (OAuth 2.1 khuyến nghị cho **mọi** client). Secret xác thực *app*; PKCE buộc *request ↔ exchange* (chống code injection).
- *Sao không dùng Implicit cho SPA?* → Implicit đã deprecated (trả token thẳng lên URL → lộ). Dùng Authorization Code + PKCE.

## 2.6 OAuth vs OIDC (myth-buster)

**Hiểu nôm na:** OAuth **không** nói cho app biết "user là ai" — nó chỉ cấp quyền truy cập. **OIDC (OpenID Connect)** là lớp mỏng đắp lên OAuth, thêm **ID token** để app biết danh tính user.

- OAuth = **ủy quyền** ("app được gọi API thay tôi").
- OIDC = **xác thực danh tính** ("ai vừa đăng nhập"), trả thêm `id_token` (JWT chứa `sub`, `email`, `name`).
- **"Login with Google"** = OIDC, không phải OAuth trần.

**Q&A:**
- *OAuth khác OIDC?* → OAuth ủy quyền; OIDC thêm danh tính (ID token).
- *Dùng JWT mà không OAuth được không?* → Được. OAuth = framework ủy quyền (token có thể là chuỗi opaque). JWT = định dạng token. Hai cái độc lập.

---

# PHẦN 3 — Session, MFA & Xác thực hiện đại

## 3.1 OIDC (sâu hơn)

**Hiểu nôm na:** OIDC chuẩn hóa "đăng nhập bằng nhà cung cấp danh tính" (Google, Microsoft…). App của bạn chỉ là **client**; đổi nhà cung cấp thì chỉ đổi **issuer URL**.
- **ID token** (JWT): "đây là ai vừa đăng nhập" → cho **app của bạn** đọc.
- **Access token**: để gọi API → gửi cho **resource server**.
- **Discovery endpoint** `/.well-known/openid-configuration`: app fetch một lần để lấy các URL + khóa công khai, khỏi hardcode.
- **OIDC trong DevOps:** GitHub Actions dùng OIDC để lấy credential AWS tạm thời (15 phút) thay vì lưu access key dài hạn.

**Q&A:**
- *Sao đừng dùng ID token để gọi API?* → `aud` (audience) của ID token là *app của bạn*, không phải resource server; nó không có scope. Access token mới đúng để gọi API.

## 3.2 Cookie-based Session & các tấn công

**Hiểu nôm na:** (xem lại 1.1) server giữ phiên, client giữ session-id trong cookie. Hai tấn công kinh điển:

1. **Session fixation:** attacker ép victim dùng một session-id mà attacker đã biết trước; sau khi victim login, id đó thành "đã xác thực" → attacker dùng chung. **Fix:** **đổi (regenerate) session-id ngay lúc login**.
2. **Session hijacking:** trộm cookie phiên (qua XSS hoặc sniff mạng). **Fix:** thuộc tính cookie + timeout + revoke.

**3 thuộc tính cookie — mỗi cái chống một thứ:**
- **`HttpOnly`:** JS không đọc được cookie → chống **XSS** trộm cookie.
- **`Secure`:** chỉ gửi qua HTTPS → chống sniff mạng.
- **`SameSite`:** kiểm soát gửi cookie khi request từ site khác → chống **CSRF**.
  - `Strict` = không gửi khi đến từ site khác (chặt nhất, nhưng làm gãy link từ email/OAuth callback → user bị "văng" đăng nhập lại).
  - `Lax` = mặc định của trình duyệt, gửi khi điều hướng GET cấp cao → **thực tế hay dùng cái này**.
  - `None` = luôn gửi, nhưng bắt buộc kèm `Secure`.

**Q&A:**
- *HttpOnly/Secure/SameSite mỗi cái chống gì?* → HttpOnly=XSS đọc cookie; Secure=HTTPS/sniff; SameSite=CSRF.
- *Sao đổi session-id lúc login?* → Chống session fixation.
- *Strict hay Lax?* → Strict chặt nhưng gãy nhiều luồng hợp lệ; thực tế dùng Lax, để Strict cho cookie nhạy cảm nhất.

## 3.3 MFA (Multi-Factor Authentication)

**Hiểu nôm na:** Dùng **≥2 trong 3 loại** yếu tố:
- **Cái bạn BIẾT** (know): password, PIN.
- **Cái bạn CÓ** (have): điện thoại (app authenticator), khóa cứng (YubiKey).
- **Cái bạn LÀ** (are): vân tay, khuôn mặt.

→ 2 password **không phải** MFA (cùng 1 loại). MFA là lớp **AuthN**, độc lập với OAuth/OIDC.

## 3.4 TOTP — RFC 6238 (app Authenticator)

**Hiểu nôm na:** Mã 6 số đổi mỗi 30 giây trong Google/Microsoft Authenticator. Server và app **cùng tính ra một số** từ:
```
code = truncate( HMAC-SHA1(shared_secret, floor(unix_time / 30)) )  → 6 số
```
- Lúc setup quét QR = trao **shared secret** một lần.
- Sau đó **không cần mạng** để tạo/kiểm mã (hai bên tự tính).
- Server chấp nhận **±1 bước (±30s)** để bù lệch đồng hồ.
- **Yếu điểm:** secret nằm ở server (server bị lộ → tạo được mã); và vẫn **phishing được** (trang giả hỏi mã, replay ngay).

**Q&A:**
- *Sao mã đổi mỗi 30s?* → Để giới hạn cửa sổ dùng lại nếu bị lộ. (Số mặc định 30s/6 chữ số, HMAC-SHA1 — RFC cho phép đổi.)
- *TOTP vs HOTP?* → HOTP đếm theo counter (phải đồng bộ counter); TOTP đếm theo thời gian (chỉ cần đồng bộ đồng hồ) → tiện hơn.

## 3.5 SMS OTP

**Hiểu nôm na:** Gửi mã qua tin nhắn. Tiện nhưng **yếu**:
- **SIM-swap:** lừa nhà mạng chuyển số bạn sang SIM của attacker.
- **SS7:** mạng viễn thông bị chặn tin nhắn.
- Vẫn **phishing** được như TOTP.

→ **NIST SP 800-63B** xếp SMS là **RESTRICTED** (cho phép nhưng cảnh báo, phải đánh giá rủi ro) — *không phải* "cấm" hay "khuyến cáo bỏ". Coi như phương án dự phòng yếu, không phải yếu tố mạnh.

**Q&A:**
- *SMS OTP yếu chỗ nào?* → SIM-swap, SS7, vẫn phishing được → NIST xếp RESTRICTED.

## 3.6 SSO & SAML vs OIDC

- **SSO (Single Sign-On):** đăng nhập 1 lần ở **IdP** (Identity Provider), vào được nhiều app. IdP nhớ bạn bằng **cookie phiên trên domain của IdP** → app sau khỏi hỏi lại. Đánh đổi: IdP là điểm chết duy nhất.
- **SAML (≈2005, XML):** chuẩn cũ, vẫn thống trị enterprise. **OIDC (2014, JSON/JWT):** chuẩn hiện đại, thân thiện mobile/API.
- **Rule of thumb:** bị vendor ép → SAML; cái gì bạn tự kiểm soát → OIDC.

## 3.7 Passkeys / WebAuthn (phần "wow")

**Hiểu nôm na:** Thay password bằng **cặp khóa công khai/bí mật**:
- Lúc đăng ký: thiết bị tạo **cặp khóa**; gửi **public key** lên server, **private key ở lại trong thiết bị** (không bao giờ rời đi).
- Lúc đăng nhập: server gửi một "thử thách" (challenge); thiết bị **ký** challenge bằng private key (sau khi bạn mở khóa bằng vân tay/Face ID); server kiểm bằng public key.
- **Domain binding:** chữ ký gắn với **origin (tên miền thật)**.

**Vì sao "không phishing được":** passkey của `bank.com` **không tạo được chữ ký hợp lệ cho `bank.evil.com`** — origin không khớp. Không có mã/secret nào để bạn gõ hay bị lừa đưa.

**Thuật ngữ:** **FIDO2** = WebAuthn (API trình duyệt) + CTAP2 (giao thức với khóa cứng). **Passkey** = credential WebAuthn, thường **đồng bộ** qua iCloud/Google.

**Q&A:**
- *Sao passkey không phishing được?* → Chữ ký gắn origin; site giả không lấy được chữ ký hợp lệ. Không có gì để gõ/đưa.
- *DB bị lộ thì sao?* → Server chỉ giữ **public key** → vô dụng với attacker (không ký được bằng public key).
- *WebAuthn / FIDO2 / passkey khác gì?* → FIDO2 = chuẩn ô dù; WebAuthn = API; passkey = credential (thường sync nhiều thiết bị).
- *MFA fatigue / push-bombing?* → Spam prompt tới khi user bấm approve (vụ Uber). Chống: number-matching, rate-limit. TOTP/push vẫn phishing được → đó là lý do có passkey.

---

# PHẦN 4 — 3 chỗ trong slide hơi yếu (thủ sẵn để đỡ nếu bị soi)

1. **Auth code "< 60 giây"** → RFC 6749 khuyến nghị **tối đa 10 phút** (provider hay 30–60s). Nói: *"ý đúng, chính xác là RFC cho tối đa 10 phút, thực tế thường 30–60s, dùng một lần."*
2. **SMS OTP "NIST không khuyến nghị"** → đúng hơn là **RESTRICTED** (cho phép, có cảnh báo); link đang là bản 2017, bản mới là **800-63B-4 (2025)**.
3. **Cookie `SameSite=Strict` dạy như fix mặc định** → bổ sung: thực tế hay dùng **`Lax`** (Strict làm gãy OAuth callback / link từ email).

---

# PHẦN 5 — Bản đồ "câu hỏi này thuộc phần nào"

Khi khán giả hỏi, nhớ chủ đề nằm đâu để trả lời / hoặc nói "cái đó phần sau":

| Hỏi về… | Thuộc phần |
|---|---|
| Session vs token, password hashing, JWT, revocation | **Phần 1** |
| OAuth, grant types, PKCE, "Login with Google" cơ bản | **Phần 2** |
| OIDC chi tiết, cookie/CSRF, MFA/TOTP/SMS, SSO, passkey | **Phần 3** |
| Service-to-service, mTLS, client credentials | Phần 4 (tuần sau — Khanh) |
| OWASP (SQLi/XSS), hashing vs encryption sâu | Phần 5 (tuần sau — Khanh) |
| CSRF chi tiết, RBAC vs ABAC | Phần 6 (tuần sau — Khanh) |

---

> **Mẹo cuối:** đọc hiểu **Phần 0** + thuộc phần **Q&A** của từng mục là đủ tự tin đỡ Trúc. Không cần nhớ hết chi tiết — nhớ **bản chất + ví dụ đời thường** là giải thích lại được.
