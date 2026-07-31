import openpyxl

wb = openpyxl.load_workbook('/app/data/templumis_university.xlsx', data_only=True)
ws = wb['Journey Tracker']

print('Journey Tracker Sheet Data:')
print('='*80)

for idx, row in enumerate(ws.iter_rows(min_row=1, max_row=20, values_only=True), 1):
    if any(cell is not None for cell in row):
        print(f'Row {idx}: {row}')

print('\n' + '='*80)
print(f'Sheet dimensions: {ws.dimensions}')
