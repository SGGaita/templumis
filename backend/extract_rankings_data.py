import openpyxl
import json

# Load the Excel file
wb = openpyxl.load_workbook('/app/data/templumis_university.xlsx', data_only=True)
ws = wb['Rankings Dashboard']

print("Full Rankings Dashboard Data:")
print("="*80)

all_rows = []
for idx, row in enumerate(ws.iter_rows(min_row=1, max_row=77, values_only=True), 1):
    if any(cell is not None for cell in row):
        all_rows.append({
            'row_num': idx,
            'data': row
        })
        print(f"Row {idx}: {row}")

print("\n" + "="*80)
print(f"Total rows with data: {len(all_rows)}")
