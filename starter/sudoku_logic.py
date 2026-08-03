import copy
import random

SIZE = 9
EMPTY = 0

def deep_copy(board):
    return copy.deepcopy(board)

def create_empty_board():
    return [[EMPTY for _ in range(SIZE)] for _ in range(SIZE)]

def is_safe(board, row, col, num):
    # Check row and column
    for x in range(SIZE):
        if board[row][x] == num or board[x][col] == num:
            return False
    # Check 3x3 box
    start_row = row - row % 3
    start_col = col - col % 3
    for i in range(3):
        for j in range(3):
            if board[start_row + i][start_col + j] == num:
                return False
    return True

def fill_board(board):
    for row in range(SIZE):
        for col in range(SIZE):
            if board[row][col] == EMPTY:
                possible = list(range(1, SIZE + 1))
                random.shuffle(possible)
                for candidate in possible:
                    if is_safe(board, row, col, candidate):
                        board[row][col] = candidate
                        if fill_board(board):
                            return True
                        board[row][col] = EMPTY
                return False
    return True

def count_solutions(board, limit=2):
    board_copy = deep_copy(board)
    count = 0

    def solve():
        nonlocal count
        if count >= limit:
            return
        # find first empty cell
        for i in range(SIZE):
            for j in range(SIZE):
                if board_copy[i][j] == EMPTY:
                    row, col = i, j
                    break
            else:
                continue
            break
        else:
            count += 1
            return

        for num in range(1, SIZE + 1):
            if is_safe(board_copy, row, col, num):
                board_copy[row][col] = num
                solve()
                board_copy[row][col] = EMPTY
                if count >= limit:
                    return

    solve()
    return count

def remove_cells(board, clues):
    removals = SIZE * SIZE - clues
    positions = [(r, c) for r in range(SIZE) for c in range(SIZE)]
    random.shuffle(positions)
    removed = 0
    made_progress = True
    while removed < removals and made_progress:
        made_progress = False
        for row, col in positions:
            if removed >= removals:
                break
            if board[row][col] == EMPTY:
                continue
            backup = board[row][col]
            board[row][col] = EMPTY
            sols = count_solutions(board, limit=2)
            if sols == 1:
                removed += 1
                made_progress = True
            else:
                board[row][col] = backup

def generate_puzzle(clues=35):
    board = create_empty_board()
    fill_board(board)
    solution = deep_copy(board)
    remove_cells(board, clues)
    puzzle = deep_copy(board)
    return puzzle, solution
