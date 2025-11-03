import random
import math

class CaroGame:
    def __init__(self, size=7, win = 5):
        self.size = size
        self.board = [['' for _ in range(size)] for _ in range(size)]
        self.current_player = 'X'
        self.winner = None
        self.winning_line = []
        self.game_mode = 'pvc'
        
        self.difficulty_pvc = 'normal'
        self.difficulty_ai1 = 'normal'
        self.difficulty_ai2 = 'normal'
        
        self.move_count = 0
        self.ai_calculations = ""
        self.WIN_CONDITION = win
        
        # Cache để lưu kết quả đánh giá
        self.eval_cache = {}
        
        # Game tree data
        self.game_tree_data = []
        self.current_parent = None  # Track parent node for tree structure

    def make_move(self, r, c):
        if 0 <= r < self.size and 0 <= c < self.size and self.board[r][c] == '' and not self.winner:
            self.board[r][c] = self.current_player
            self.move_count += 1
            self.eval_cache.clear()  # Xóa cache khi có nước đi mới
            
            if self.check_win(self.current_player):
                self.winner = self.current_player
                return True

            if self.is_draw():
                self.winner = 'Draw'
                return True
                
            self.current_player = 'O' if self.current_player == 'X' else 'X'
            return True
        return False

    def is_draw(self):
        return self.move_count == self.size * self.size

    def check_win(self, player):
        self.winning_line = []
        
        for r in range(self.size):
            for c in range(self.size - self.WIN_CONDITION + 1):
                if all(self.board[r][c+i] == player for i in range(self.WIN_CONDITION)):
                    self.winning_line = [(r, c+i) for i in range(self.WIN_CONDITION)]
                    return True
        
        for c in range(self.size):
            for r in range(self.size - self.WIN_CONDITION + 1):
                if all(self.board[r+i][c] == player for i in range(self.WIN_CONDITION)):
                    self.winning_line = [(r+i, c) for i in range(self.WIN_CONDITION)]
                    return True
        
        for r in range(self.size - self.WIN_CONDITION + 1):
            for c in range(self.size - self.WIN_CONDITION + 1):
                if all(self.board[r+i][c+i] == player for i in range(self.WIN_CONDITION)):
                    self.winning_line = [(r+i, c+i) for i in range(self.WIN_CONDITION)]
                    return True
        
        for r in range(self.WIN_CONDITION - 1, self.size):
            for c in range(self.size - self.WIN_CONDITION + 1):
                if all(self.board[r-i][c+i] == player for i in range(self.WIN_CONDITION)):
                    self.winning_line = [(r-i, c+i) for i in range(self.WIN_CONDITION)]
                    return True
        return False

    def get_smart_moves(self, max_moves=10):
        """
        Lấy các nước đi thông minh nhất dựa trên phân tích nhanh.
        """
        if self.move_count == 0:
            return [(self.size // 2, self.size // 2)]
        
        move_scores = []
        center = self.size // 2
        
        # Tìm tất cả ô trống gần quân cờ đã đánh (bán kính 2)
        occupied = set() 
        for r in range(self.size):
            for c in range(self.size):
                if self.board[r][c] != '':
                    occupied.add((r, c))
        
        candidates = set()
        for r, c in occupied:
            for dr in range(-2, 3):
                for dc in range(-2, 3):
                    nr, nc = r + dr, c + dc
                    if (0 <= nr < self.size and 0 <= nc < self.size and 
                        self.board[nr][nc] == '' and (nr, nc) not in occupied):
                        candidates.add((nr, nc))
        
        if not candidates:
            candidates = {(r, c) for r in range(self.size) for c in range(self.size) 
                         if self.board[r][c] == ''}
        
        # Đánh giá nhanh từng ô
        for r, c in candidates:
            score = 0
            
            # Ưu tiên vị trí gần tâm
            dist_to_center = abs(r - center) + abs(c - center)
            score -= dist_to_center * 2
            
            # Đánh giá mức độ nguy hiểm/cơ hội của ô này
            for player in ['X', 'O']:
                player_score = self._evaluate_position(r, c, player)
                if player == self.current_player:
                    score += player_score * 1.2  # Ưu tiên tấn công
                else:
                    score += player_score  # Phòng thủ
            
            move_scores.append((score, (r, c)))
        
        # Sắp xếp và lấy top moves
        move_scores.sort(reverse=True)
        return [move for _, move in move_scores[:max_moves]]

    def _evaluate_position(self, r, c, player):
        """
        Đánh giá nhanh giá trị của một vị trí cho một người chơi.
        """
        score = 0
        directions = [(0, 1), (1, 0), (1, 1), (1, -1)]  # Ngang, dọc, chéo
        
        for dr, dc in directions:
            # Đếm quân liên tiếp theo cả 2 hướng
            count = 1
            spaces = 0
            
            # Hướng dương
            for i in range(1, 5):
                nr, nc = r + dr * i, c + dc * i
                if not (0 <= nr < self.size and 0 <= nc < self.size):
                    break
                if self.board[nr][nc] == player:
                    count += 1
                elif self.board[nr][nc] == '':
                    spaces += 1
                    break
                else:
                    break
            
            # Hướng âm
            for i in range(1, 5):
                nr, nc = r - dr * i, c - dc * i
                if not (0 <= nr < self.size and 0 <= nc < self.size):
                    break
                if self.board[nr][nc] == player:
                    count += 1
                elif self.board[nr][nc] == '':
                    spaces += 1
                    break
                else:
                    break
            
            # Tính điểm dựa trên số quân liên tiếp
            if count >= 4:
                score += 10000  # Thắng hoặc chặn thắng
            elif count == 3 and spaces >= 1:
                score += 1000   # 3 liên tiếp có thể mở rộng
            elif count == 2 and spaces >= 2:
                score += 100    # 2 liên tiếp có tiềm năng
            elif count == 1 and spaces >= 2:
                score += 10
        
        return score

    def _evaluate_line(self, line, player, opp):
        """Đánh giá một dòng 5 ô."""
        p_count = line.count(player)
        o_count = line.count(opp)
        empty = line.count('')

        if o_count == 0 and p_count > 0:
            if p_count == 5: return 100000
            if p_count == 4: return 10000
            if p_count == 3: return 1000
            if p_count == 2: return 100
            return 10
        elif p_count == 0 and o_count > 0:
            if o_count == 4: return -10000
            if o_count == 3: return -1000
            if o_count == 2: return -100
            return -10
        return 0

    def evaluate_board(self, player):
        """Đánh giá tổng thể bàn cờ với cache."""
        board_key = ''.join(''.join(row) for row in self.board) + player
        
        if board_key in self.eval_cache:
            return self.eval_cache[board_key]
        
        score = 0
        opp = 'O' if player == 'X' else 'X'
        win = self.WIN_CONDITION # Sử dụng WIN_CONDITION

        # Ngang
        for r in range(self.size):
            # Duyệt các vị trí bắt đầu
            for c in range(self.size - win + 1): 
                # Lấy đường có độ dài = win
                line = [self.board[r][c+i] for i in range(win)] 
                score += self._evaluate_line(line, player, opp)
        
        # Dọc
        for c in range(self.size):
            for r in range(self.size - win + 1):
                line = [self.board[r+i][c] for i in range(win)]
                score += self._evaluate_line(line, player, opp)
        
        # Chéo xuống (từ trên trái xuống dưới phải)
        for r in range(self.size - win + 1):
            for c in range(self.size - win + 1):
                line = [self.board[r+i][c+i] for i in range(win)]
                score += self._evaluate_line(line, player, opp)
        
        # Chéo lên (từ dưới trái lên trên phải)
        for r in range(win - 1, self.size):
            for c in range(self.size - win + 1):
                line = [self.board[r-i][c+i] for i in range(win)]
                score += self._evaluate_line(line, player, opp)
        
        self.eval_cache[board_key] = score
        return score

    def minimax(self, depth, alpha, beta, is_max, ai_player, difficulty='normal'):
        opp_player = 'O' if ai_player == 'X' else 'X'
        
        # Kiểm tra thắng/thua
        if self.check_win(opp_player):
            self.winner = None
            score = -100000 + depth
            self._add_tree_node(None, score, depth, False)
            return score, None
        if self.check_win(ai_player):
            self.winner = None
            score = 100000 - depth
            self._add_tree_node(None, score, depth, False)
            return score, None
        
        # Điều kiện dừng
        if depth == 0:
            self.winner = None
            score = self.evaluate_board(ai_player) - self.evaluate_board(opp_player)
            self._add_tree_node(None, score, depth, False)
            return score, None
        
        # Lấy các nước đi thông minh
        if difficulty == 'hard':
            moves = self.get_smart_moves(max_moves=12)
        else:
            moves = self.get_smart_moves(max_moves=8)
        
        if not moves:
            self.winner = None
            return 0, None
        
        best_move = moves[0]
        
        if is_max:
            best_score = -math.inf
            for i, (r, c) in enumerate(moves):
                self.board[r][c] = ai_player
                score, _ = self.minimax(depth - 1, alpha, beta, False, ai_player, difficulty)
                self.board[r][c] = ''
                
                if score > best_score:
                    best_score = score
                    best_move = (r, c)
                
                # Thêm vào game tree
                is_best = (score == best_score and (r, c) == best_move)
                pruned = False
                
                alpha = max(alpha, best_score)
                if beta <= alpha:
                    pruned = True
                    self._add_tree_node((r, c), score, depth, pruned)
                    break
                    
                self._add_tree_node((r, c), score, depth, pruned, is_best)
                
            return best_score, best_move
        else:
            best_score = math.inf
            for i, (r, c) in enumerate(moves):
                self.board[r][c] = opp_player
                score, _ = self.minimax(depth - 1, alpha, beta, True, ai_player, difficulty)
                self.board[r][c] = ''
                
                if score < best_score:
                    best_score = score
                    best_move = (r, c)
                
                # Thêm vào game tree
                is_best = (score == best_score and (r, c) == best_move)
                pruned = False
                
                beta = min(beta, best_score)
                if beta <= alpha:
                    pruned = True
                    self._add_tree_node((r, c), score, depth, pruned)
                    break
                    
                self._add_tree_node((r, c), score, depth, pruned, is_best)
                
            return best_score, best_move

    def _add_tree_node(self, move, score, depth, pruned=False, is_best=False):
        """Thêm một node vào game tree data"""
        self.game_tree_data.append({
            'move': move,
            'score': score,
            'depth': depth,
            'pruned': pruned,
            'is_best': is_best
        })

    def find_best_move(self):
        # Reset game tree data
        self.game_tree_data = []
        
        player = self.current_player
        difficulty = 'normal'

        if self.game_mode == 'pvc':
            difficulty = self.difficulty_pvc
        elif self.game_mode == 'cvc':
            difficulty = self.difficulty_ai1 if player == 'X' else self.difficulty_ai2

        self.ai_calculations = f"AI ({player}) đang tính (Độ khó: {difficulty})..."
        
        if self.move_count == 0:
            self.ai_calculations = f"AI ({player}) đi nước đầu tiên (giữa)."
            return (self.size // 2, self.size // 2)

        # Kiểm tra nước thắng ngay lập tức
        smart_moves = self.get_smart_moves(max_moves=20)
        for r, c in smart_moves:
            self.board[r][c] = player
            if self.check_win(player):
                self.board[r][c] = ''
                self.winner = None
                self.ai_calculations = f"AI ({player}) tìm thấy nước thắng!"
                return (r, c)
            self.board[r][c] = ''
            self.winner = None
        
        # Kiểm tra nước chặn
        opp = 'O' if player == 'X' else 'X'
        for r, c in smart_moves:
            self.board[r][c] = opp
            if self.check_win(opp):
                self.board[r][c] = ''
                self.winner = None
                self.ai_calculations = f"AI ({player}) chặn nước thắng đối thủ!"
                return (r, c)
            self.board[r][c] = ''
            self.winner = None

        if difficulty == 'easy':
            self.ai_calculations = f"Chế độ Dễ: AI ({player}) chọn ngẫu nhiên."
            return smart_moves[0] if smart_moves else (self.size // 2, self.size // 2)

        elif difficulty == 'normal':
            depth = 3
            self.ai_calculations += f" Minimax (độ sâu {depth})."
            try:
                self.winner = None
                score, move = self.minimax(depth, -math.inf, math.inf, True, player, 'normal')
                self.winner = None
                self.ai_calculations += f" Xong! (Score: {score})"
                return move if move else smart_moves[0]
            except:
                return smart_moves[0]
            
        elif difficulty == 'hard':
            depth = 5
            self.ai_calculations += f" Minimax (độ sâu {depth}, tối ưu)."
            try:
                self.winner = None
                score, move = self.minimax(depth, -math.inf, math.inf, True, player, 'hard')
                self.winner = None
                self.ai_calculations += f" Xong! (Score: {score})"
                return move if move else smart_moves[0]
            except:
                return smart_moves[0]
        
        return smart_moves[0]

    def ai_move_pvc(self):
        best_move = self.find_best_move()
        if best_move:
            self.make_move(best_move[0], best_move[1])
            return best_move
        return None