# Kịch bản thuyết trình — Phần 3: Service-to-Service Authentication

**Người trình bày:** Khanh Do
**Thời lượng:** ~14 phút · **10 step**
**Đường dẫn:** `/lecture/service-to-service`
**Nguồn:** Lecture 5 §3 (Notion / PDF)

> Cách dùng file: mỗi block là **một step** trong player. "MÀN HÌNH" = khán giả đang thấy gì;
> "NÓI" = lời thoại; "DEMO" = thao tác trực tiếp; "CHUYỂN Ý" = câu nối sang step sau.
> Những câu **in đậm** là câu chốt — nói rõ và chậm.
>
> Mỗi step có một header nhỏ phía trên tiêu đề (vd "§ 3.3 · CLIENT CREDENTIALS"). Phần lớn step
> là 2 cột: chữ bên trái, sơ đồ bên phải — nhớ dẫn cả hai bên.
>
> Thuật ngữ kỹ thuật (client_id, JWT, scope, bcrypt, JWKS, mTLS, Bearer…) giữ nguyên tiếng Anh.

---

## Step 1 — § 3.1 · The Problem: Who Is the Caller? `(2 cột, ~2 phút)`

**MÀN HÌNH:** Trái — callout Goal, 3 đặc điểm traffic, threat model, callout cảnh báo anti-pattern. Phải — sơ đồ cluster với "Compromised Pod" màu đỏ trỏ thẳng vào Payments.

**NÓI:**
- "Từ đầu khóa tới giờ, mọi luồng đều có **con người** ở điểm bắt đầu. Giờ thì không — Service A gọi thẳng Service B. Cả phần này chỉ xoay quanh một câu hỏi: **ai đang gọi, và họ được phép làm gì?**"
- Điểm qua 3 đặc điểm: "Traffic nội bộ thường là **east-west** (service gọi service qua mạng nội bộ), **tự động** (không ai bấm nút), và **không gắn với session người dùng** nào cả."
- Chỉ vào sơ đồ: "Đây là mối đe dọa. Một pod bị chiếm. Nếu Payments tin **bất cứ thứ gì trong mạng nội bộ**, thì mũi tên đỏ đó chạy ngon lành — **không kiểm tra danh tính, chỉ cần ở trong mạng.**"
- Chốt: "**Mạng nội bộ không phải là danh tính.** Đó chính là lỗ hổng ta sẽ bịt."

**CHUYỂN Ý:** "Cách sửa là đặt một Auth Server vào giữa."

---

## Step 2 — § 3.2 · Baseline Architecture `(2 cột, ~1.5 phút)`

**MÀN HÌNH:** Trái — danh sách participants + luồng 4 bước. Phải — sơ đồ Service A → Auth Server → Service B.

**NÓI:**
- "Ba vai trò: **Service A** là bên gọi, **Auth Server** phát token, **Service B** kiểm token."
- Dẫn theo sơ đồ: "A xác thực với Auth Server, nhận token, rồi gắn token đó vào lời gọi sang B."
- Chốt: "**Service B kiểm JWT cục bộ — không cần gọi ngược về Auth Server cho mỗi request.** Đó chính là điểm hay của JWT, lát nữa §3.4–3.5 sẽ nói kỹ."

**CHUYỂN Ý:** "Bước 1 của luồng — 'xin token' — là grant gì? Với máy-gọi-máy, đó là Client Credentials."

---

## Step 3 — § 3.3 · Client Credentials: How a Service Logs In as Itself `(2 cột, ~2 phút)`

**MÀN HÌNH:** Trái — ví von, 4 bước trao đổi, request `POST /oauth/token`, callout. Phải — sơ đồ quyết định của Auth Server (active? → bcrypt? → scope? → phát JWT).

**NÓI:**
- Mở đầu bằng ví von: "Client Credentials là cách một service **'đăng nhập' với tư cách là chính nó.** Cặp `client_id` + `client_secret` giống như **username + password nhưng thuộc về *ứng dụng*, không phải con người.**"
- "Nó gửi cặp đó tới token endpoint và nhận lại một token sống ngắn. **Không user, không redirect, không trình duyệt** — vì không có con người nào ở đây."
- Dẫn sơ đồ quyết định bên phải: "Ba cổng kiểm — client còn active không, secret có đúng không, scope có được phép không."
- Nối lại Phần 1: "**Secret được kiểm bằng `bcrypt.verify`, không phải `==`** — y hệt lý do ta hash mật khẩu. Và thông báo lỗi cố tình mơ hồ — `invalid_client` — để kẻ tấn công không dò được client ID nào tồn tại."
- Chốt: "**Đưa secret vào một lần, nhận về token đã giới hạn scope.**"

**CHUYỂN Ý:** "Qua cổng rồi thì có một JWT. Bên trong nó chứa gì mới là điều quan trọng."

---

## Step 4 — § 3.4 · JWT Claims: What the Token Should Contain `(prose, ~1.5 phút)`

**MÀN HÌNH:** Danh sách claim (sub/iss/aud/exp/scope) + callout.

**NÓI:**
- "Với M2M, ý nghĩa các claim đổi đi. **`sub` không còn là con người — mà là *service* đang gọi.** `aud` là service nào được phép nhận token. `scope` là những gì nó được làm."
- Chốt callout: "**Base64 là mã hóa-định-dạng chứ không phải mã hóa-bảo-mật (encoding ≠ encryption).** Ai chặn được token đều đọc được payload — nên chỉ nhét gợi ý phân quyền (scope/role) vào, tuyệt đối không nhét secret hay PII."

**CHUYỂN Ý:** "Đừng tin lời tôi — ta giải mã thử một cái."

---

## Step 5 — § 3.4 · Decode an M2M Token `(demo: JWTDecoder, ~1.5 phút)`

**DEMO:** Bấm mẫu **"RS256 (service)"**. Mở phần **payload**. Chỉ vào `sub` / `aud` / `exp` / `scope`. Tùy chọn: sửa một claim → phần signature sẽ không còn khớp.

**NÓI:** "Header = thuật toán. Payload = các claim, đọc được hoàn toàn. Chỉ có signature mới cần key. **Đây đúng là những gì Service B sẽ đọc để ra quyết định.**"

**CHUYỂN Ý:** "Vậy Service B nhận được token này. Nó làm gì tiếp?"

---

## Step 6 — § 3.5 · Validation & Authorization: How Service B Decides `(2 cột, ~1.5 phút)`

**MÀN HÌNH:** Trái — danh sách validation vs authorization. Phải — sơ đồ scope → endpoint.

**NÓI:**
- "Hai việc tách bạch mà người ta hay gộp. **Validation = 'token này có thật và có dành cho mình không?'** Authorization = 'caller này có được phép làm *việc cụ thể này* không?'"
- "Validation là: kiểm **signature** bằng JWKS/public key, kiểm `exp`/`nbf`, kiểm `iss` và `aud`, tùy chọn kiểm `typ`."
- Chỉ vào sơ đồ: "`orders.read` cho phép GET; `orders.write` cho phép POST và PATCH. **Token chỉ có orders.read thì không bao giờ ghi được — least privilege gói gọn trong một hình.**"

**CHUYỂN Ý:** "Để tôi cho phần validation thành tương tác được."

---

## Step 7 — § 3.5 · Trace Service B's Decision `(demo: DecisionTracer, ~1.5 phút)`

**DEMO:** Mặc định tất cả check xanh → **"Accept"**. Tắt **sig** → bị từ chối ngay. Tắt **exp** → token hết hạn. Tắt **aud** → token dành cho service khác. Tắt **scope** → đã xác thực nhưng không đủ quyền. Bấm Reset.

**NÓI:** "Mỗi công tắc là một bước kiểm thật của Service B. Điểm mấu chốt: **request chỉ thành công khi *mọi* cổng đều qua — gặp lỗi đầu tiên là dừng.**"

**CHUYỂN Ý:** "JWT + client credentials là mặc định. Nhưng không phải cách duy nhất để chứng minh danh tính."

---

## Step 8 — § 3.6 · Alternatives: Beyond Client Credentials `(prose, ~1.5 phút)`

**MÀN HÌNH:** mTLS / service mesh / API keys / private_key_jwt + blockquote mental model.

**NÓI:**
- **mTLS:** "danh tính ở **tầng transport** — hai bên đều trình certificate, sai/hết hạn là handshake fail."
- **Service mesh (Istio/Linkerd):** "mesh lo mTLS + xoay vòng cert giùm; code ứng dụng **không cần giữ credential**."
- **API keys:** "đơn giản nhất, nhưng quản trị yếu nhất (xoay vòng, giới hạn scope, audit)."
- **private_key_jwt:** "không có secret chia sẻ — client tự ký JWT bằng private key của nó."
- Chốt mental model: "**OAuth nói cho bạn *lấy token thế nào*; JWT nói *token trông ra sao*; policy của Service B nói *caller được làm gì*.**"

**CHUYỂN Ý:** "Để tôi cho xem một cái mTLS handshake thực sự diễn ra thế nào."

---

## Step 9 — § 3.6 · mTLS Handshake `(demo: MTLSVisualizer, ~1 phút)`

**DEMO:** Chọn tab **"Happy path"**, bấm **"Start handshake"**, đi từng bước tới khi handshake hoàn tất (CN=service-a verified). Sau đó thử **"Expired server cert"** hoặc **"Unknown CA"** → handshake **fail trước khi** bất kỳ dữ liệu ứng dụng nào được trao đổi.

**NÓI:** "Khác với bearer token, ở đây danh tính được kiểm ngay tại **kết nối** — request hỏng còn chưa kịp tới handler của bạn."

**CHUYỂN Ý:** "Chọn cơ chế nào thì vệ sinh bảo mật vẫn như nhau. Đây là toàn cảnh trên một slide."

---

## Step 10 — § 3.7 · Best Practices: Putting It All Together `(2 cột, ~1.5 phút)`

**MÀN HÌNH:** Trái — checklist vận hành. Phải — sơ đồ kiến trúc M2M đầy đủ (Auth Layer + Microservices + Service Mesh tùy chọn).

**NÓI:**
- Đọc nhanh checklist; nhấn 3 ý: "**Token sống ngắn** thu nhỏ vùng thiệt hại; **secret để trong Vault/KMS, không bao giờ trong code** — đây là lỗi số 1 ngoài thực tế; **mỗi service một danh tính riêng** để một chỗ rò không thiêu rụi tất cả."
- Dẫn sơ đồ: "client_credentials → JWT → Bearer → verify bằng JWKS, và có thể chồng thêm mTLS từ tầng mesh."
- **KẾT:** "Đó là service-to-service: **danh tính kiểm chứng được đi vào, phân quyền cưỡng chế được đi ra — không cần con người nào cả.**"

---

## Hỏi đáp — câu hay gặp

- **"Sao không xài API keys cho khỏe?"** → quản trị: xoay vòng, giới hạn scope, audit, thu hồi — API key chỉ là một secret phẳng, không có sẵn mấy thứ đó.
- **"Sao dùng JWT thay vì gọi Auth Server để kiểm?"** → validation cục bộ, stateless, không tốn round-trip mỗi request; JWKS cho public key một lần là đủ.
- **"mTLS *hay* JWT?"** → khác tầng. mTLS = ai đã kết nối (transport); scope trong JWT = họ được làm gì (application). Hai cái bổ trợ nhau, không loại trừ.
- **"Lỡ secret của service bị rò?"** → xoay vòng ngay, danh tính theo từng service giúp giới hạn vùng thiệt hại, TTL ngắn giới hạn cửa sổ tấn công.
- **"Service B có nên tin `iss` vô điều kiện không?"** → không — ghim cứng giá trị `iss`/`aud` kỳ vọng và verify signature bằng JWKS của issuer đó. Đừng để token tự khai ai đã ký nó.
