import sys

def extract(filename, start_str, end_str):
    with open(filename, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    start_idx = -1
    end_idx = -1
    
    for i, line in enumerate(lines):
        if start_str in line and start_idx == -1:
            start_idx = i
        elif end_str in line and start_idx != -1 and end_idx == -1:
            end_idx = i
            
    if start_idx != -1 and end_idx != -1:
        return "".join(lines[start_idx:end_idx])
    return None

old_calc = extract('index_13dbc13.html', 'function calculateModel(', 'function getGrade(')
old_app = extract('index_13dbc13.html', 'function renderApp(', 'async function runBacktest()')
old_book = extract('index_13dbc13.html', 'function changeBook(', 'function formatDateStr(')

new_calc = extract('index.html', 'function calculateModel(', 'function getGrade(')
new_app = extract('index.html', 'function renderApp(', 'async function runBacktest()')
new_book = extract('index.html', 'function changeBook(', 'function formatDateStr(')

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

html = html.replace(new_calc, old_calc)
html = html.replace(new_app, old_app)
html = html.replace(new_book, old_book)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)

print("Replacement successful.")
