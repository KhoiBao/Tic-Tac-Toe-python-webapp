from flask import Flask, render_template, request, jsonify, session
from game_logic import CaroGame
import os

app = Flask(__name__)
app.secret_key = os.urandom(24) 

def load_game_from_session():
    if 'game_board' not in session:
        return None
    win_condition = session.get('win_condition', 5)
    game = CaroGame(len(session['game_board']),win=win_condition)
    game.board = session['game_board']
    game.current_player = session['game_player']
    game.winner = session['game_winner']
    game.game_mode = session['game_mode']
    game.move_count = session['game_move_count']
    
    game.difficulty_pvc = session.get('game_diff_pvc', 'normal')
    game.difficulty_ai1 = session.get('game_diff_ai1', 'normal')
    game.difficulty_ai2 = session.get('game_diff_ai2', 'normal')
    
    return game

def save_game_to_session(game):
    session['game_board'] = game.board
    session['game_player'] = game.current_player
    session['game_winner'] = game.winner
    session['game_mode'] = game.game_mode
    session['game_move_count'] = game.move_count
    
    session['game_diff_pvc'] = game.difficulty_pvc
    session['game_diff_ai1'] = game.difficulty_ai1
    session['game_diff_ai2'] = game.difficulty_ai2
    session['game_winning_line'] = game.winning_line

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/start', methods=['POST'])
def start_game():
    data = request.json
    try:
        size = int(data.get('size', 7))
        if size < 7: size = 7

        win_condition = int(data.get('win_condition', 5))
        if win_condition < 3:
            win_condition = 3
        if win_condition > size:
            win_condition = size 

        game = CaroGame(size, win = win_condition)
        game.game_mode = data.get('mode', 'pvc')
        
        game.difficulty_pvc = data.get('difficulty_pvc', 'normal')
        game.difficulty_ai1 = data.get('difficulty_ai1', 'normal')
        game.difficulty_ai2 = data.get('difficulty_ai2', 'normal')
        
        first_move = data.get('first_move', 'human')
        session['first_move'] = first_move
        session['win_condition'] = win_condition
        
        save_game_to_session(game)
        
        return jsonify({
            'message': 'Bắt đầu ván mới!',
            'board': game.board,
            'size': game.size,
            'player': game.current_player,
            'mode': game.game_mode, 
            'win_condition': game.WIN_CONDITION
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/move', methods=['POST'])
def handle_move():
    
    game = load_game_from_session()
    if not game:
        return jsonify({'error': 'Game chưa bắt đầu.'}), 400

    if game.winner:
        return jsonify({'error': 'Game đã kết thúc.',
                        'winning_line': game.winning_line}), 400

    if game.game_mode == 'cvc':
        return jsonify({'error': 'Không thể click ở chế độ Máy vs Máy.'}), 400

    data = request.json
    r, c = data['row'], data['col']
    
    human_last_move = [r, c]
    ai_last_move = None

    if game.game_mode in ['pvp', 'pvc']:
        if not game.make_move(r, c):
            return jsonify({'error': 'Nước đi không hợp lệ.',
                            'winning_line': game.winning_line}), 400
        
        if game.winner:
            save_game_to_session(game)
            return jsonify({
                'board': game.board,
                'player': game.current_player,
                'winner': game.winner,
                'ai_calc': '',
                'winning_line': game.winning_line,
                'last_move': human_last_move
            })

    if game.game_mode == 'pvc' and not game.winner:
        first_move = session.get('first_move', 'human')
        
        ai_player = 'O' if first_move == 'human' else 'X'
        
        if game.current_player == ai_player:
            ai_last_move = game.ai_move_pvc()

    save_game_to_session(game)
    
    last_move_to_send = ai_last_move if ai_last_move else human_last_move

    return jsonify({
        'board': game.board,
        'player': game.current_player,
        'winner': game.winner,
        'ai_calc': game.ai_calculations,
        'winning_line': game.winning_line,
        'last_move': last_move_to_send
    })

@app.route('/request_ai_move', methods=['GET'])
def request_ai_move():
    game = load_game_from_session()
    if not game:
        return jsonify({'error': 'Game chưa bắt đầu.'}), 400
    if game.winner:
        return jsonify({'error': 'Game đã kết thúc.'}), 400
    if game.game_mode != 'cvc':
        return jsonify({'error': 'Chỉ dành cho chế độ CvC.'}), 400

    best_move = game.find_best_move()
    
    if best_move:
        game.make_move(best_move[0], best_move[1])

    save_game_to_session(game)
    return jsonify({
        'board': game.board, 
        'player': game.current_player,
        'winner': game.winner, 
        'ai_calc': game.ai_calculations,
        'winning_line': game.winning_line,
        'last_move': best_move
    })

@app.route('/ai_first_move', methods=['POST'])
def ai_first_move():
    game = load_game_from_session()
    if not game:
        return jsonify({'error': 'Game chưa bắt đầu.'}), 400
    
    if game.game_mode != 'pvc':
        return jsonify({'error': 'Chỉ dành cho chế độ PvC.'}), 400
    
    if game.move_count > 0:
        return jsonify({'error': 'Game đã bắt đầu.'}), 400
    
    ai_move = game.ai_move_pvc()
    
    save_game_to_session(game)
    
    return jsonify({
        'board': game.board,
        'player': game.current_player,
        'winner': game.winner,
        'ai_calc': game.ai_calculations,
        'winning_line': game.winning_line,
        'last_move': ai_move
    })

if __name__ == '__main__':
    app.run(debug=True)