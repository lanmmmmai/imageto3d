<h1 align="center">3D Model Generator (Image-to-3D)</h1>

<p align="center">
  Ứng dụng tạo mô hình 3D từ ảnh & văn bản bằng AI (Hỗ trợ dán ảnh trực tiếp qua Ctrl+V)
</p>

<p align="center">
  <a href="https://colab.research.google.com/github/lanmmmmai/imageto3d/blob/main/colab_3d_backend.ipynb">
    <img src="https://colab.research.google.com/assets/colab-badge.svg" alt="Open In Colab (Free GPU Backend)" />
  </a>
  &nbsp;&nbsp;
  <a href="https://colab.research.google.com/github/lanmmmmai/imageto3d/blob/main/ai_game_character_pipeline_2d_to_3d.ipynb">
    <img src="https://colab.research.google.com/assets/colab-badge.svg" alt="Open In Colab (Game Character AI Research Notebook)" />
  </a>
</p>

---

## 🎓 Nghiên Cứu Khoa Học / Bài Báo: Pipeline AI Tạo Hình Nhân Vật Game (2D -> 3D)

Notebook thực nghiệm phục vụ viết báo cáo khoa học / đề tài tốt nghiệp: **"Ứng dụng Generative AI trong quy trình tạo hình nhân vật Game (Game Character Asset Generation: Text -> 2D Concept -> 3D Mesh)"**.

👉 **Chạy ngay trên Colab:** [ai_game_character_pipeline_2d_to_3d.ipynb](https://colab.research.google.com/github/lanmmmmai/imageto3d/blob/main/ai_game_character_pipeline_2d_to_3d.ipynb)

**Nội dung thực nghiệm trong Notebook:**
1. **Giai đoạn 1 (Text-to-2D Concept Art):** Ứng dụng Latent Diffusion (Stable Diffusion) tự động tạo concept nhân vật theo chuẩn game (T-pose / A-pose, orthographic front view, nền trắng sạch).
2. **Giai đoạn 2 (2D-to-3D Reconstruction):** Ứng dụng Feed-forward Triplane NeRF & Transformer (TripoSR) trích xuất lưới đa giác 3D (Mesh) định dạng `.glb` trong 1.5 - 2 giây.
3. **Giai đoạn 3 (Đo lường & Đánh giá khoa học - Benchmark):**
   - Thời gian suy luận (Inference Latency) so với quy trình dựng hình truyền thống 3D Artist (Blender / Maya / ZBrush).
   - Số lượng đỉnh (Vertices) và mặt đa giác (Polygons / Faces) phục vụ tối ưu hóa game (LOD - Level of Detail).
   - Dung lượng VRAM tiêu thụ và dung lượng file `.glb`.
4. **Giai đoạn 4 (Trực quan hóa WebUI tương tác):** Trình xem xoay 360° Gradio Model3D có link chia sẻ công khai.

---

---

## ⚡ 1. Sử dụng Google Colab GPU (Miễn Phí 100% - Không Cần Mua Key)

Bạn không cần tốn tiền mua API Key! Ứng dụng tích hợp sẵn backend chạy mô hình **TripoSR** trên card đồ họa NVIDIA T4 miễn phí của Google Colab:

1. Nhấp vào nút **Open In Colab** ở trên hoặc mở file `colab_3d_backend.ipynb`.
2. Trên Google Colab, chọn menu **Runtime** > **Change runtime type** > Chọn **T4 GPU**.
3. Nhấn **Run all** (chạy lần lượt 2 ô lệnh trong notebook).
4. Sao chép link `https://...trycloudflare.com` xuất hiện ở cuối ô số 2.
5. Mở web của bạn, nhấn vào icon **Cài đặt Engine** (hình thanh gạt cạnh nút gửi) > dán link vào ô **Google Colab Backend URL** > Bấm **Lưu cấu hình**.
6. Dán bất kỳ ảnh nào (`Ctrl + V`) và nhấn **Tạo 3D** (~1.5 giây là có file 3D `.glb` xoay 360°)!

---

## ✨ 2. Các tính năng nổi bật

- **Dán ảnh siêu tốc (`Ctrl + V`):** Nhấn chụp màn hình (`Win + Shift + S`) hoặc Copy ảnh trên mạng rồi bấm `Ctrl + V` trên web là ảnh tự động nạp vào.
- **Đa dạng AI Engine:**
  - ⚡ **Google Colab GPU (TripoSR):** Miễn phí 100%, tạo 3D cực nhanh trong 1.5s.
  - 🌍 **World Labs (Marble):** Tạo bối cảnh không gian thế giới 3D từ ảnh phong cảnh.
  - 🌟 **Meshy AI:** Tạo nhân vật và đồ vật 3D chi tiết có texture.
  - 🚀 **DeepSeek 3D:** Sinh code Three.js procedural từ prompt văn bản.
  - 🌐 **Hyper3D Rodin:** Tạo lưới 3D chi tiết cao.
- **Trình xem 3D tương tác (Three.js):** Xoay 360°, phóng to/thu nhỏ, đổ bóng thực tế.
- **Xuất file chuẩn:** Tải về định dạng **GLB** tương thích Blender, Unity, Unreal Engine, Web 3D.

---

## 🛠️ 3. Khởi chạy cục bộ (Local Development)

```bash
# 1. Cài đặt thư viện
npm install

# 2. Khởi chạy server phát triển
npm run dev
```

Truy cập: [http://localhost:3000](http://localhost:3000)
