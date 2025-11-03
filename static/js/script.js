document.addEventListener('DOMContentLoaded', () => {

    // Lấy các phần tử DOM
    const menuForm = document.getElementById('menu-form');
    const gameModeSelect = document.getElementById('game-mode');
    const boardContainer = document.getElementById('board-container');
    const statusEl = document.getElementById('status');

    // Tọa độ
    const rowCoords = document.getElementById('row-coords');
    const colCoords = document.getElementById('col-coords');

    // Các wrapper độ khó
    const diffPvc = document.getElementById('difficulty-pvc');
    const diffCvC1 = document.getElementById('difficulty-cvc1');
    const diffCvC2 = document.getElementById('difficulty-cvc2');
    const firstMovePvc = document.getElementById('first-move-pvc');

    // Cài đặt giao diện
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const boardThemeButtons = document.querySelectorAll('[data-theme]');
    
    // Toast
    const gameToastEl = document.getElementById('game-toast');
    const toastTitleEl = document.getElementById('toast-title');
    const toastBodyEl = document.getElementById('toast-body');
    const gameToast = new bootstrap.Toast(gameToastEl);

    // Biến trạng thái
    let boardSize = 10;
    let gameInProgress = false;
    let currentGameMode = 'pvc';
    let lastMoveCell = null;

    // --- 1. XỬ LÝ MENU VÀ BẮT ĐẦU GAME ---

    // Ẩn/hiện chọn độ khó
    function updateDifficultyVisibility() {
        const mode = gameModeSelect.value;
        diffPvc.style.display = 'none';
        diffCvC1.style.display = 'none';
        diffCvC2.style.display = 'none';
        firstMovePvc.style.display = 'none';

        if (mode === 'pvc') {
            diffPvc.style.display = 'block';
            firstMovePvc.style.display = 'block';
        }
        else if (mode === 'cvc') {
            diffCvC1.style.display = 'block';
            diffCvC2.style.display = 'block';
        }
    }
    gameModeSelect.addEventListener('change', updateDifficultyVisibility);
    updateDifficultyVisibility();

    // Bắt đầu game
    menuForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        currentGameMode = gameModeSelect.value;
        boardSize = parseInt(document.getElementById('board-size').value, 10);
        const firstMove = document.getElementById('first-move-select').value;
        const winCondition = parseInt(document.getElementById('win-condition').value, 10);
        const settings = {
            size: boardSize, 
            mode: currentGameMode,
            win_condition:winCondition,
            difficulty_pvc: document.getElementById('difficulty-pvc-select').value,
            difficulty_ai1: document.getElementById('difficulty-ai1-select').value,
            difficulty_ai2: document.getElementById('difficulty-ai2-select').value,
            first_move: firstMove
        };

        try {
            const response = await fetch('/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            });
            const data = await response.json();
            
            if (response.ok) {
                gameInProgress = true;
                createBoard(data.size);
                updateBoard(data.board);
                
                // Cập nhật status
                if (data.mode === 'pvc' && firstMove === 'ai') {
                    updateStatus(`Máy đi trước (X). Đang tính...`);
                } else {
                    updateStatus(`Bắt đầu! Lượt của ${data.player}`);
                }
                highlightLastMove(null);

                if (data.mode === 'cvc') {
                    boardContainer.style.pointerEvents = 'none';
                    runCvCGame();
                } else if (data.mode === 'pvc' && firstMove === 'ai') {
                    // Máy đi trước
                    boardContainer.style.pointerEvents = 'none';
                    await delay(500);
                    await makeAiFirstMove();
                } else {
                    boardContainer.style.pointerEvents = 'auto';
                }
            } else { throw new Error(data.error || 'Lỗi không xác định'); }
        } catch (error) { statusEl.textContent = `Lỗi: ${error.message}`; }
    });

    // --- 2. HÀM VẼ BÀN CỜ VÀ GIAO DIỆN ---

    // (CẬP NHẬT) Tạo bàn cờ (bao gồm cả tọa độ)
    function createBoard(size) {
        // Xóa nội dung cũ
        boardContainer.innerHTML = '';
        rowCoords.innerHTML = '';
        colCoords.innerHTML = '';

        // Đặt CSS Grid cho cả 3 container
        const gridTemplate = `repeat(${size}, 1fr)`;
        boardContainer.style.gridTemplateColumns = gridTemplate;
        boardContainer.style.gridTemplateRows = gridTemplate;
        rowCoords.style.gridTemplateColumns = gridTemplate;
        colCoords.style.gridTemplateRows = gridTemplate;

        // Tạo ô tọa độ (A, B, C...)
        for (let i = 0; i < size; i++) {
            const char = String.fromCharCode(65 + i); // 65 là mã ASCII của 'A'
            const coordCell = document.createElement('div');
            coordCell.classList.add('coord-cell');
            coordCell.textContent = char;
            rowCoords.appendChild(coordCell);
        }

        // Tạo ô tọa độ (1, 2, 3...)
        for (let i = 0; i < size; i++) {
            const coordCell = document.createElement('div');
            coordCell.classList.add('coord-cell');
            coordCell.textContent = i + 1;
            colCoords.appendChild(coordCell);
        }

        // Tạo các ô cờ
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                const cell = document.createElement('div');
                cell.classList.add('cell');
                cell.dataset.row = r;
                cell.dataset.col = c;
                boardContainer.appendChild(cell);
            }
        }
    }

    // Cập nhật giao diện bàn cờ (không đổi)
    function updateBoard(boardData) {
        const cells = boardContainer.querySelectorAll('.cell');
        cells.forEach(cell => {
            const r = cell.dataset.row;
            const c = cell.dataset.col;
            const player = boardData[r][c];
            cell.textContent = player;
            cell.classList.remove('X', 'O');
            if (player) cell.classList.add(player);
        });
    }

    // Cập nhật thanh trạng thái (không đổi)
    function updateStatus(message) {
        statusEl.textContent = message;
    }

    // (MỚI) Hiển thị thông báo toast
    function showGameToast(title, message) {
        toastTitleEl.textContent = title;
        toastBodyEl.textContent = message;
        gameToast.show();
    }

    // (MỚI) Hiển thị Game Tree
// Chuyển danh sách phẳng (mỗi node có thuộc tính depth) thành cây phân cấp
function buildTreeFromFlat(flat) {
  if (!flat || flat.length === 0) return null;
  // Clone để tránh sửa dữ liệu gốc
  const arr = flat.map(n => ({ ...n, children: [] }));

  const root = arr[0];
  const stack = [root];

  for (let i = 1; i < arr.length; i++) {
    const node = arr[i];

    // Nếu depth tăng so với top -> child
    // Nếu depth <= top.depth -> pop until parent found
    while (stack.length && stack[stack.length - 1].depth >= node.depth) {
      stack.pop();
    }

    // Nếu stack rỗng: gán node thành con của root (fallback)
    const parent = stack.length ? stack[stack.length - 1] : root;
    parent.children.push(node);

    // push node vào stack để dùng cho node tiếp theo
    stack.push(node);
  }

  return root;
}

// Hiển thị game tree dùng D3 - ngang, có zoom/pan, phân biệt is_best và pruned
function displayGameTree(flatTree) {
  // Lấy svg
  const svgEl = document.getElementById('game-tree-svg');
  if (!svgEl) return;
  const svg = d3.select(svgEl);
  svg.selectAll("*").remove();

  if (!flatTree || flatTree.length === 0) {
    svg.append("text")
      .attr("x", 20)
      .attr("y", 40)
      .attr("fill", "#777")
      .text("Không có dữ liệu game tree");
    return;
  }

  // Chuyển sang cấu trúc phân cấp
  const rootData = buildTreeFromFlat(flatTree);
  if (!rootData) {
    svg.append("text")
      .attr("x", 20)
      .attr("y", 40)
      .attr("fill", "#777")
      .text("Không thể xây tree từ dữ liệu.");
    return;
  }

  const margin = { top: 20, right: 20, bottom: 20, left: 20 };
  const bbox = svgEl.getBoundingClientRect();
  const width = Math.max(800, bbox.width || 1000) - margin.left - margin.right;
  const height = Math.max(400, bbox.height || 600) - margin.top - margin.bottom;

  // D3 hierarchy + tree layout (horizontal)
  const root = d3.hierarchy(rootData, d => d.children);
  const treeLayout = d3.tree().nodeSize([80, 140]); // [vertical spacing, horizontal spacing]
  treeLayout(root);

  // Compute extents to center tree
  const minX = d3.min(root.descendants(), d => d.x);
  const maxX = d3.max(root.descendants(), d => d.x);
  const minY = d3.min(root.descendants(), d => d.y);
  const maxY = d3.max(root.descendants(), d => d.y);

  // Create a group that will be zoomed/panned
  const g = svg.append("g")
    .attr("transform", `translate(${margin.left + 40}, ${margin.top + 20})`);

  // Draw links
  g.selectAll(".link")
    .data(root.links())
    .enter()
    .append("path")
    .attr("class", "link")
    .attr("fill", "none")
    .attr("stroke", d => d.target.data.is_best ? "#1976d2" : (d.target.data.pruned ? "#999" : "#ccc"))
    .attr("stroke-width", d => d.target.data.is_best ? 3 : (d.target.data.pruned ? 1 : 1.5))
    .attr("stroke-dasharray", d => d.target.data.pruned ? "4 4" : "0")
    .attr("d", d => {
      // horizontal link: parent.y -> child.y (x is vertical)
      const sx = d.source.y;
      const sy = d.source.x;
      const tx = d.target.y;
      const ty = d.target.x;
      // smooth cubic path
      const midX = (sx + tx) / 2;
      return `M${sx},${sy} C${midX},${sy} ${midX},${ty} ${tx},${ty}`;
    });

  // Draw nodes
  const node = g.selectAll(".node")
    .data(root.descendants())
    .enter()
    .append("g")
    .attr("class", d => "node" + (d.data.is_best ? " chosen" : ""))
    .attr("transform", d => `translate(${d.y},${d.x})`);

  // Circle
  node.append("circle")
    .attr("r", d => d.data.is_best ? 22 : 18)
    .attr("fill", d => d.data.is_best ? "#ffeb3b" : "#fff")
    .attr("stroke", "#333")
    .attr("stroke-width", 1.5)
    .style("filter", d => d.data.is_best ? "drop-shadow(0 1px 4px rgba(0,0,0,0.2))" : null);

  // Move text (above)
  node.append("text")
    .attr("dy", "-0.9em")
    .attr("text-anchor", "middle")
    .attr("font-size", 12)
    .text(d => {
    if (!d.data.move) return "Root";
    const [row, col] = d.data.move;
    // Hàng ngang là chữ (A, B, C...) → col
    const letter = String.fromCharCode(65 + col);
    const number = row + 1;
    return `(${letter},${number})`;
    });


  // Score text (below)
  node.append("text")
    .attr("dy", "1.4em")
    .attr("text-anchor", "middle")
    .attr("font-size", 11)
    .attr("fill", d => d.data.score > 0 ? "#2e7d32" : (d.data.score < 0 ? "#c62828" : "#555"))
    .text(d => (d.data.score !== undefined && d.data.score !== null) ? d.data.score : "");

  // Tooltip (native title) + hover highlight
  node.append("title").text(d =>
    `Move: ${d.data.move ? d.data.move.join(", ") : "Root"}\nScore: ${d.data.score}\nPruned: ${!!d.data.pruned}`
  );

  node.on("mouseover", function () {
    d3.select(this).select("circle").transition().duration(120).attr("r", 24);
  }).on("mouseout", function (d) {
    d3.select(this).select("circle").transition().duration(120).attr("r", d.data.is_best ? 22 : 18);
  });

  // ---------------- Zoom & Pan ----------------
  const zoom = d3.zoom()
    .scaleExtent([0.2, 4])
    .on("zoom", (event) => {
      g.attr("transform", event.transform);
    });

  svg.call(zoom);

  // Center initial view: translate so root near left and vertical center
  const initialScale = 1;
  // compute translation to put root near left margin
  const translateX = 20;
  const centerY = (height / 2) - (minX + maxX) / 2;
  svg.call(zoom.transform, d3.zoomIdentity.translate(translateX + margin.left, centerY + margin.top).scale(initialScale));
}






    // Tô sáng đường thắng (không đổi)
    function highlightWin(winningLine) {
        if (!winningLine || winningLine.length === 0) return;
        for (const [r, c] of winningLine) {
            const cell = document.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`);
            if (cell) cell.classList.add('winning-cell');
        }
    }
    
    // Tô sáng nước đi cuối (không đổi)
    function highlightLastMove(moveCoords) {
        if (lastMoveCell) lastMoveCell.classList.remove('last-move');
        if (moveCoords && moveCoords.length === 2) {
            const [r, c] = moveCoords;
            const cell = document.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`);
            if (cell) {
                cell.classList.add('last-move');
                lastMoveCell = cell;
            }
        } else { lastMoveCell = null; }
    }

    // --- 3. LOGIC CHƠI GAME ---
    
    const delay = ms => new Promise(res => setTimeout(res, ms));

    // Hàm mới: Máy đi nước đầu tiên
    async function makeAiFirstMove() {
        try {
            const response = await fetch('/ai_first_move', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await response.json();
            
            if (response.ok) {
                updateBoard(data.board);
                highlightLastMove(data.last_move);
                
                // Hiển thị game tree nếu có
                if (data.game_tree) {
                    displayGameTree(data.game_tree);
                }
                
                updateStatus(`Lượt của ${data.player} (Bạn)`);
                boardContainer.style.pointerEvents = 'auto';
            } else {
                throw new Error(data.error || 'Lỗi AI');
            }
        } catch (error) {
            statusEl.textContent = `Lỗi: ${error.message}`;
            boardContainer.style.pointerEvents = 'auto';
        }
    }

    // Vòng lặp tự động cho CvC (CẬP NHẬT: Thêm toast)
    async function runCvCGame() {
        while (gameInProgress) {
            try {
                const response = await fetch('/request_ai_move');
                const data = await response.json();
                if (!response.ok) throw new Error(data.error || 'Lỗi server AI');

                updateBoard(data.board);
                highlightLastMove(data.last_move);
                
                // Hiển thị game tree nếu có
                if (data.game_tree) {
                    displayGameTree(data.game_tree);
                }
                
                if (data.winner) {
                    gameInProgress = false;
                    let msg = "";
                    if (data.winner === 'Draw') {
                        msg = "Ván đấu HÒA!";
                        showGameToast("Kết quả", msg);
                    } else {
                        msg = `Máy ${data.winner} THẮNG!`;
                        showGameToast("Kết thúc!", msg);
                    }
                    updateStatus(msg);
                    highlightWin(data.winning_line);
                    break;
                } else {
                    updateStatus(`Lượt của ${data.player}`);
                }
                
                await delay(500);
            } catch (error) {
                statusEl.textContent = `Lỗi CvC: ${error.message}`;
                gameInProgress = false;
                break;
            }
        }
    }

    // Xử lý Nước đi (PvP và PVC) (CẬP NHẬT: Thêm toast)
    boardContainer.addEventListener('click', async (e) => {
        if (currentGameMode === 'cvc' || !gameInProgress || !e.target.classList.contains('cell')) return;

        const cell = e.target;
        const row = parseInt(cell.dataset.row, 10);
        const col = parseInt(cell.dataset.col, 10);
        if (cell.textContent !== '') return;

        // Cập nhật giao diện ngay
        const currentPlayerMatch = statusEl.textContent.match(/Lượt của (X|O)/);
        if (!currentPlayerMatch) return;
        const currentPlayer = currentPlayerMatch[1];
        
        cell.textContent = currentPlayer;
        cell.classList.add(currentPlayer);
        highlightLastMove([row, col]); // Highlight nước đi người
        
        // Xác định người chơi tiếp theo
        const nextPlayer = (currentPlayer === 'X') ? 'O' : 'X';
        
        // Kiểm tra xem sau nước đi này có phải lượt máy không
        if (currentGameMode === 'pvc') {
            // Nếu người vừa đi X và máy là O, hoặc người vừa đi O và máy là X
            const firstMove = document.getElementById('first-move-select').value;
            const isAiTurn = (firstMove === 'human' && currentPlayer === 'X') || 
                           (firstMove === 'ai' && currentPlayer === 'O');
            
            if (isAiTurn) {
                updateStatus(`Máy (${nextPlayer}) đang suy nghĩ...`);
            } else {
                updateStatus(`Lượt của ${nextPlayer}`);
            }
        } else {
            updateStatus(`Lượt của ${nextPlayer}`);
        }
        
        boardContainer.style.pointerEvents = 'none';

        try {
            const response = await fetch('/move', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ row: row, col: col })
            });
            const data = await response.json();
            boardContainer.style.pointerEvents = 'auto';

            if (response.ok) {
                updateBoard(data.board);
                highlightLastMove(data.last_move); // Highlight nước đi máy

                // Hiển thị game tree nếu có
                if (data.game_tree) {
                    displayGameTree(data.game_tree);
                }

                if (data.winner) {
                    gameInProgress = false;
                    let msg = "";
                    if (data.winner === 'Draw') {
                        msg = "Ván đấu HÒA!";
                        showGameToast("Kết quả", msg);
                    } else {
                        msg = `Người chơi ${data.winner} THẮNG!`;
                        showGameToast("Chúc mừng!", msg);
                    }
                    updateStatus(msg);
                    highlightWin(data.winning_line);
                } else {
                    updateStatus(`Lượt của ${data.player}`);
                }
            } else {
                cell.textContent = ''; // Hoàn tác
                cell.classList.remove(currentPlayer);
                highlightLastMove(null); // Bỏ highlight
                updateStatus(`Lỗi: ${data.error || 'Nước đi không hợp lệ'}`);
            }
        } catch (error) {
            boardContainer.style.pointerEvents = 'auto';
            cell.textContent = ''; // Hoàn tác
            cell.classList.remove(currentPlayer);
            highlightLastMove(null); // Bỏ highlight
            updateStatus(`Lỗi kết nối: ${error.message}`);
        }
    });
    
    // --- 4. LOGIC CÀI ĐẶT GIAO DIỆN (MỚI) ---
    
    // Xử lý Dark Mode
    darkModeToggle.addEventListener('change', () => {
        if (darkModeToggle.checked) {
            document.documentElement.setAttribute('data-bs-theme', 'dark');
            localStorage.setItem('theme', 'dark'); // Lưu lựa chọn
        } else {
            document.documentElement.setAttribute('data-bs-theme', 'light');
            localStorage.setItem('theme', 'light');
        }
    });

    // Xử lý Đổi màu bàn cờ
    boardThemeButtons.forEach(button => {
        button.addEventListener('click', () => {
            const theme = button.dataset.theme;
            document.body.setAttribute('data-board-theme', theme);
            localStorage.setItem('boardTheme', theme); // Lưu lựa chọn
        });
    });

    // Khôi phục cài đặt đã lưu khi tải lại trang
    function loadSavedTheme() {
        const savedTheme = localStorage.getItem('theme');
        const savedBoardTheme = localStorage.getItem('boardTheme');
        
        if (savedTheme === 'dark') {
            document.documentElement.setAttribute('data-bs-theme', 'dark');
            darkModeToggle.checked = true;
        } else {
            document.documentElement.setAttribute('data-bs-theme', 'light');
            darkModeToggle.checked = false;
        }
        
        if (savedBoardTheme) {
            document.body.setAttribute('data-board-theme', savedBoardTheme);
        }
    }
    
    loadSavedTheme(); // Chạy khi tải trang

});