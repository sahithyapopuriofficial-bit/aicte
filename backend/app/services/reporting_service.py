# backend/app/services/reporting_service.py
import csv
import io
from typing import Any, Iterable, List


def sanitize_csv_cell(value: Any) -> str:
    """
    Prevent Spreadsheet Formula Injection (CSV Injection).
    If a cell value starts with dangerous characters (=, +, -, @, \\t, \\r),
    prepend a single quote (') so spreadsheet engines treat it strictly as text.
    """
    if value is None:
        return ""
    str_val = str(value).strip()
    if str_val and str_val[0] in ("=", "+", "-", "@", "\t", "\r"):
        return f"'{str_val}"
    return str_val


def generate_csv_stream(headers: List[str], rows: Iterable[List[Any]]) -> Iterable[str]:
    """
    Stream rows as formatted, sanitized CSV strings line by line.
    """
    buffer = io.StringIO()
    writer = csv.writer(buffer)

    # Write sanitized header
    writer.writerow([sanitize_csv_cell(h) for h in headers])
    yield buffer.getvalue()
    buffer.seek(0)
    buffer.truncate(0)

    for row in rows:
        writer.writerow([sanitize_csv_cell(cell) for cell in row])
        yield buffer.getvalue()
        buffer.seek(0)
        buffer.truncate(0)