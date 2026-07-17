#!/usr/bin/env python3
"""Offline CSV profiling utility for MarketLens development and QA."""

from __future__ import annotations

import argparse
import csv
import json
import math
import sys
from collections import Counter
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any


@dataclass
class ColumnProfile:
    name: str
    missing: int = 0
    unique: int = 0
    inferred_type: str = 'unknown'
    min_value: float | None = None
    max_value: float | None = None
    mean_value: float | None = None
    examples: list[str] = field(default_factory=list)


@dataclass
class DatasetProfile:
    file_name: str
    row_count: int
    column_count: int
    duplicate_rows: int
    columns: list[ColumnProfile]


def is_missing(value: Any) -> bool:
    if value is None:
        return True
    return str(value).strip() == ''


def parse_number(value: Any) -> float | None:
    if is_missing(value):
        return None
    if isinstance(value, (int, float)) and not isinstance(value, bool):
        return float(value) if math.isfinite(float(value)) else None

    text = str(value).strip().replace(',', '')
    if text.endswith('%'):
        try:
            return float(text[:-1]) / 100
        except ValueError:
            return None

    if text.startswith('$'):
        text = text[1:]

    if text.startswith('(') and text.endswith(')'):
        inner = text[1:-1].lstrip('$')
        try:
            return -float(inner)
        except ValueError:
            return None

    try:
        return float(text)
    except ValueError:
        return None


def infer_type(values: list[Any]) -> str:
    present = [value for value in values if not is_missing(value)]
    if not present:
        return 'empty'

    numeric = sum(parse_number(value) is not None for value in present)
    if numeric / len(present) >= 0.9:
        return 'numeric'

    lowered = {str(value).strip().lower() for value in present}
    if len(lowered) == 2 and lowered <= {'yes', 'no', 'true', 'false', '1', '0', 'success', 'failure'}:
        return 'binary'

    return 'categorical'


def read_csv(path: Path) -> tuple[list[str], list[dict[str, Any]]]:
    if not path.exists():
        raise FileNotFoundError(f'File not found: {path}')

    if path.stat().st_size == 0:
        raise ValueError('File is empty.')

    encodings = ('utf-8-sig', 'utf-8', 'latin-1')
    last_error: Exception | None = None

    for encoding in encodings:
        try:
            with path.open('r', encoding=encoding, newline='') as handle:
                reader = csv.DictReader(handle)
                if not reader.fieldnames:
                    raise ValueError('CSV has no header row.')

                rows = list(reader)
                if not rows:
                    raise ValueError('CSV has no data rows.')

                return list(reader.fieldnames), rows
        except UnicodeDecodeError as error:
            last_error = error

    raise ValueError(f'Unable to read file with supported encodings: {last_error}')


def duplicate_count(rows: list[dict[str, Any]]) -> int:
    seen: set[str] = set()
    duplicates = 0

    for row in rows:
        key = json.dumps(row, sort_keys=True, default=str)
        if key in seen:
            duplicates += 1
        else:
            seen.add(key)

    return duplicates


def profile_column(name: str, rows: list[dict[str, Any]]) -> ColumnProfile:
    values = [row.get(name) for row in rows]
    present = [value for value in values if not is_missing(value)]
    unique_values = {str(value) for value in present}

    profile = ColumnProfile(
        name=name,
        missing=len(values) - len(present),
        unique=len(unique_values),
        inferred_type=infer_type(values),
        examples=sorted(unique_values)[:3],
    )

    numeric_values = [number for number in (parse_number(value) for value in present) if number is not None]
    if numeric_values:
        profile.min_value = min(numeric_values)
        profile.max_value = max(numeric_values)
        profile.mean_value = sum(numeric_values) / len(numeric_values)

    return profile


def profile_dataset(path: Path) -> DatasetProfile:
    headers, rows = read_csv(path)
    columns = [profile_column(header, rows) for header in headers]

    return DatasetProfile(
        file_name=path.name,
        row_count=len(rows),
        column_count=len(headers),
        duplicate_rows=duplicate_count(rows),
        columns=columns,
    )


def to_json(profile: DatasetProfile) -> str:
    payload = {
        'file_name': profile.file_name,
        'row_count': profile.row_count,
        'column_count': profile.column_count,
        'duplicate_rows': profile.duplicate_rows,
        'columns': [
            {
                'name': column.name,
                'missing': column.missing,
                'unique': column.unique,
                'inferred_type': column.inferred_type,
                'min': column.min_value,
                'max': column.max_value,
                'mean': column.mean_value,
                'examples': column.examples,
            }
            for column in profile.columns
        ],
    }
    return json.dumps(payload, indent=2)


def print_summary(profile: DatasetProfile) -> None:
    print(f'File: {profile.file_name}')
    print(f'Rows: {profile.row_count}')
    print(f'Columns: {profile.column_count}')
    print(f'Duplicate rows: {profile.duplicate_rows}')
    print('')
    print('Columns:')

    for column in profile.columns:
        print(f'  - {column.name}')
        print(f'      type: {column.inferred_type}')
        print(f'      missing: {column.missing}')
        print(f'      unique: {column.unique}')

        if column.min_value is not None:
            print(f'      min: {column.min_value:g}')
            print(f'      max: {column.max_value:g}')
            print(f'      mean: {column.mean_value:.4g}')

        if column.examples:
            print(f'      examples: {", ".join(column.examples)}')


def main() -> int:
    parser = argparse.ArgumentParser(
        description='Profile a CSV file for offline MarketLens QA. '
        'This utility is independent from the browser analytics engine.',
    )
    parser.add_argument('csv_path', type=Path, help='Path to a CSV file')
    parser.add_argument('--json', action='store_true', help='Print JSON output')
    args = parser.parse_args()

    try:
        profile = profile_dataset(args.csv_path)
    except (FileNotFoundError, ValueError, OSError) as error:
        print(f'Error: {error}', file=sys.stderr)
        return 1

    if args.json:
        print(to_json(profile))
    else:
        print_summary(profile)

    return 0


if __name__ == '__main__':
    raise SystemExit(main())
