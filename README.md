## Tac-Toe-python-webapp

An final project of Artificial Intelligence App in Ho Chi Minh City of University and Trade (HUIT), represent the appliance of Minimax Algorithm in Tic-Tac-Toe Game totally created by Group 3, using Flask for Python Framework, with D3.js for visualize game tree though it is not compeleted yet.
----
<img width="207" height="207" alt="image" src="https://github.com/user-attachments/assets/cdf0e826-4d3d-4743-bc66-260fbd6611bd" />

-----

## ✨ Tính năng nổi bật

Dự án này tập trung vào việc cung cấp một trải nghiệm chơi game linh hoạt, có thể tùy chỉnh cao và tích hợp Trí tuệ Nhân tạo (AI) mạnh mẽ.

  * **Đa dạng Chế độ chơi:**
      * Người vs Máy (PvC).
      * Người vs Người (PvP).
      * Máy vs Máy (CvC) (Tự động chạy game giữa hai AI).
  * **AI Mạnh mẽ và Linh hoạt:**
      * Sử dụng thuật toán **Minimax** với cắt tỉa Alpha-Beta để tìm nước đi tối ưu.
      * Hỗ trợ 3 cấp độ khó: **Dễ** (Easy), **Thường** (Normal - Depth 3), và **Khó** (Hard - Depth 5).
      * AI có thể đi nước đầu tiên khi được yêu cầu (trong chế độ PvC).
  * **Tùy chỉnh Ván đấu:**
      * Thiết lập **Kích thước bàn cờ** tùy ý (tối thiểu 7x7).
      * Thiết lập **Số điểm thắng** (Ví dụ: 3, 4, 5,...).
  * **Giao diện Người dùng Hiện đại (UI/UX):**
      * Hỗ trợ **Chế độ tối (Dark Mode)** và **Lưu cài đặt giao diện** bằng Local Storage.
      * Nhiều chủ đề màu sắc cho bàn cờ (Mặc định, Màu Gỗ, Mát mẻ, Màu Tối).
      * Hiển thị **Trực quan hóa Cây Trò chơi (Game Tree Visualization)** (dùng D3.js) để phân tích chiến lược của AI.

## 💻 Công nghệ sử dụng

  * **Backend:** Python, Flask.
  * **Logic Game:** Python (Class `CaroGame` trong `game_logic.py`).
  * **Frontend:** HTML5, CSS3, JavaScript (ES6+).
  * **Thư viện:** Bootstrap 5, D3.js (cho visualization).
  * **Quản lý trạng thái:** Flask Session.

## 📁 Cấu trúc Project

```
/caro-game-project
├── app.py              # Ứng dụng Flask: định tuyến, quản lý game session, xử lý HTTP requests
├── game_logic.py       # Logic game cốt lõi, kiểm tra thắng/hòa, thuật toán AI (Minimax, Alpha-Beta Pruning)
├── templates/
│   └── index.html      # Giao diện chính: menu tùy chọn, bàn cờ, khu vực hiển thị Game Tree
└── static/
    ├── css/
    │   └── style.css   # CSS: định nghĩa biến màu sắc (Dark Mode, Board Themes) và style cho bàn cờ
    ├── js/
    │   └── script.js   # JavaScript: xử lý DOM, tương tác game, gọi API, hiển thị Game Tree (D3.js)
    └── images/
        └── ...         # Các tệp hình ảnh, icon
```

## 🚀 Cài đặt và Chạy ứng dụng

Để chạy ứng dụng trên máy cục bộ, bạn cần cài đặt Python 3 và Flask.

1.  **Cài đặt Flask:**

    ```bash
    pip install Flask
    ```

2.  **Khởi chạy Ứng dụng:**

    Chạy file `app.py` trong terminal:

    ```bash
    python app.py
    ```

3.  **Truy cập Game:**

    Mở trình duyệt web của bạn và truy cập vào địa chỉ:

    `http://127.0.0.1:5000/`
    Sẽ có bản web trong tương lai!

4. **Hình ảnh trong web:**

  Trang chủ(giao diện sáng):
     <img width="1827" height="970" alt="image" src="https://github.com/user-attachments/assets/4ae5834b-0bd1-4c9c-bb08-069e4927eab1" />

  Trang chủ (giao diện tối):
    <img width="1832" height="961" alt="image" src="https://github.com/user-attachments/assets/675c3e04-470a-460d-bf5b-b3be46a1376c" />

  Các giao diện bàn cờ:
  ----
  Mặc định:
    <div><img width="546" height="547" alt="image" src="https://github.com/user-attachments/assets/1f2b5813-11a8-4742-9f8e-1616e7cd843a" /></div>
  Màu gỗ:
    <div><img width="547" height="543" alt="image" src="https://github.com/user-attachments/assets/46b3df3e-e886-482c-a1fc-e26149498753" /></div>
  Xanh nhạt (mát mẻ):
    <div><img width="545" height="547" alt="image" src="https://github.com/user-attachments/assets/4b03ad7d-f68e-4f94-9c97-f8314ce84cd9" /></div>
  Màu tối (dark mode):
    <div><img width="542" height="542" alt="image" src="https://github.com/user-attachments/assets/343a6678-bc39-4f81-ab53-fee372daf9d1" /><div>

## 🕹️ Hướng dẫn sử dụng

1.  **Thiết lập Ván đấu:** Trên giao diện chính, chọn các tùy chọn mong muốn:
      * `Chế độ chơi` (Người vs Máy, Người vs Người, Máy vs Máy).
      * `Kích thước` bàn cờ.
      * `Số điểm thắng`.
      * `Độ khó` (nếu có AI tham gia).
2.  **Bắt đầu:** Nhấn nút "Bắt đầu ván đấu mới".
3.  **Chơi Game:**
      * Ở chế độ PvC/PvP, nhấp vào ô trống để đi nước cờ.
      * Ở chế độ CvC, game sẽ tự động thực hiện các nước đi giữa hai AI.
4.  **Phân tích AI:** Theo dõi khu vực **Game Tree Visualization** để xem cây quyết định của AI, các nước đi tốt nhất và các nhánh đã bị cắt tỉa (pruned).
