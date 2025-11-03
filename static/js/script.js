document.addEventListener('DOMContentLoaded', () => {

    const menuForm = document.getElementById('menu-form');
    const gameModeSelect = document.getElementById('game-mode');
    const boardContainer = document.getElementById('board-container');
    const statusEl = document.getElementById('status');

    const rowCoords = document.getElementById('row-coords');
    const colCoords = document.getElementById('col-coords');

    const diffPvc = document.getElementById('difficulty-pvc');
    const diffCvC1 = document.getElementById('difficulty-cvc1');
    const diffCvC2 = document.getElementById('difficulty-cvc2');
    const firstMovePvc = document.getElementById('first-move-pvc');

    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const boardThemeButtons = document.querySelectorAll('[data-theme]');
    
    const gameToastEl = document.getElementById('game-toast');
    const toastTitleEl = document.getElementById('toast-title');
    const toastBodyEl = document.getElementById('toast-body');
    const gameToast = new bootstrap.Toast(gameToastEl);

    let boardSize = 10;
    let gameInProgress = false;
    let currentGameMode = 'pvc';
    let lastMoveCell = null;

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
                    boardContainer.style.pointerEvents = 'none';
                    await delay(500);
                    await makeAiFirstMove();
                } else {
                    boardContainer.style.pointerEvents = 'auto';
                }
            } else { throw new Error(data.error || 'Lỗi không xác định'); }
        } catch (error) { statusEl.textContent = `Lỗi: ${error.message}`; }
    });

    function createBoard(size) {
        boardContainer.innerHTML = '';
        rowCoords.innerHTML = '';
        colCoords.innerHTML = '';

        const gridTemplate = `repeat(${size}, 1fr)`;
        boardContainer.style.gridTemplateColumns = gridTemplate;
        boardContainer.style.gridTemplateRows = gridTemplate;
        rowCoords.style.gridTemplateColumns = gridTemplate;
        colCoords.style.gridTemplateRows = gridTemplate;

        for (let i = 0; i < size; i++) {
            const char = String.fromCharCode(65 + i); 
            const coordCell = document.createElement('div');
            coordCell.classList.add('coord-cell');
            coordCell.textContent = char;
            rowCoords.appendChild(coordCell);
        }

        for (let i = 0; i < size; i++) {
            const coordCell = document.createElement('div');
            coordCell.classList.add('coord-cell');
            coordCell.textContent = i + 1;
            colCoords.appendChild(coordCell);
        }

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

    function updateStatus(message) {
        statusEl.textContent = message;
    }

    function showGameToast(title, message) {
        toastTitleEl.textContent = title;
        toastBodyEl.textContent = message;
        gameToast.show();
    }
    
    function highlightWin(winningLine) {
        if (!winningLine || winningLine.length === 0) return;
        for (const [r, c] of winningLine) {
            const cell = document.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`);
            if (cell) cell.classList.add('winning-cell');
        }
    }
    
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

    const delay = ms => new Promise(res => setTimeout(res, ms));

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

    async function runCvCGame() {
        while (gameInProgress) {
            try {
                const response = await fetch('/request_ai_move');
                const data = await response.json();
                if (!response.ok) throw new Error(data.error || 'Lỗi server AI');

                updateBoard(data.board);
                highlightLastMove(data.last_move);
                
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

    boardContainer.addEventListener('click', async (e) => {
        if (currentGameMode === 'cvc' || !gameInProgress || !e.target.classList.contains('cell')) return;

        const cell = e.target;
        const row = parseInt(cell.dataset.row, 10);
        const col = parseInt(cell.dataset.col, 10);
        if (cell.textContent !== '') return;

        const currentPlayerMatch = statusEl.textContent.match(/Lượt của (X|O)/);
        if (!currentPlayerMatch) return;
        const currentPlayer = currentPlayerMatch[1];
        
        cell.textContent = currentPlayer;
        cell.classList.add(currentPlayer);
        highlightLastMove([row, col]); 
        
        const nextPlayer = (currentPlayer === 'X') ? 'O' : 'X';
        
        if (currentGameMode === 'pvc') {
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
                highlightLastMove(data.last_move); 

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
                cell.textContent = ''; 
                cell.classList.remove(currentPlayer);
                highlightLastMove(null); 
                updateStatus(`Lỗi: ${data.error || 'Nước đi không hợp lệ'}`);
            }
        } catch (error) {
            boardContainer.style.pointerEvents = 'auto';
            cell.textContent = ''; 
            cell.classList.remove(currentPlayer);
            highlightLastMove(null); 
            updateStatus(`Lỗi kết nối: ${error.message}`);
        }
    });
    
    darkModeToggle.addEventListener('change', () => {
        if (darkModeToggle.checked) {
            document.documentElement.setAttribute('data-bs-theme', 'dark');
            localStorage.setItem('theme', 'dark'); 
        } else {
            document.documentElement.setAttribute('data-bs-theme', 'light');
            localStorage.setItem('theme', 'light');
        }
    });

    boardThemeButtons.forEach(button => {
        button.addEventListener('click', () => {
            const theme = button.dataset.theme;
            document.body.setAttribute('data-board-theme', theme);
            localStorage.setItem('boardTheme', theme); 
        });
    });

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
    
    loadSavedTheme(); 

});