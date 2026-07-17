import json
import sys
import tempfile
import unittest
from pathlib import Path

TOOLS_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(TOOLS_DIR))

from profile_dataset import profile_dataset, read_csv, to_json


class ProfileDatasetTests(unittest.TestCase):
    def write_csv(self, content: str) -> Path:
        handle = tempfile.NamedTemporaryFile('w', suffix='.csv', delete=False, encoding='utf-8')
        handle.write(content)
        handle.close()
        self.addCleanup(lambda: Path(handle.name).unlink(missing_ok=True))
        return Path(handle.name)

    def test_normal_numeric_and_categorical_data(self) -> None:
        path = self.write_csv(
            'region,revenue,status\nNorth,100,yes\nSouth,200,no\nEast,150,yes\n',
        )
        profile = profile_dataset(path)

        self.assertEqual(profile.row_count, 3)
        self.assertEqual(profile.column_count, 3)
        self.assertEqual(profile.columns[0].inferred_type, 'categorical')
        self.assertEqual(profile.columns[1].inferred_type, 'numeric')
        self.assertEqual(profile.columns[1].min_value, 100)
        self.assertEqual(profile.columns[1].max_value, 200)

    def test_missing_values(self) -> None:
        path = self.write_csv('group,value\nA,\nB,4\nC,\n')
        profile = profile_dataset(path)

        self.assertEqual(profile.columns[1].missing, 2)
        self.assertEqual(profile.columns[1].unique, 1)

    def test_duplicate_rows(self) -> None:
        path = self.write_csv('id,value\n1,10\n1,10\n2,20\n')
        profile = profile_dataset(path)

        self.assertEqual(profile.duplicate_rows, 1)

    def test_empty_file(self) -> None:
        path = self.write_csv('')
        with self.assertRaises(ValueError):
            profile_dataset(path)

    def test_invalid_path(self) -> None:
        with self.assertRaises(FileNotFoundError):
            profile_dataset(Path('missing-file.csv'))

    def test_mostly_numeric_with_invalid_values(self) -> None:
        lines = ['Revenue', *[str(index) for index in range(1, 20)], 'invalid', 'invalid']
        path = self.write_csv('\n'.join(lines) + '\n')
        profile = profile_dataset(path)

        self.assertEqual(profile.columns[0].inferred_type, 'numeric')
        self.assertEqual(profile.columns[0].unique, 20)
        self.assertEqual(profile.columns[0].min_value, 1)
        self.assertEqual(profile.columns[0].max_value, 19)

    def test_json_output_serialization(self) -> None:
        path = self.write_csv('name,value\nAlpha,1\nBeta,2\n')
        profile = profile_dataset(path)
        payload = json.loads(to_json(profile))

        self.assertEqual(payload['file_name'], path.name)
        self.assertEqual(payload['row_count'], 2)
        self.assertEqual(payload['columns'][0]['name'], 'name')
        self.assertIn('examples', payload['columns'][0])

    def test_read_csv_requires_headers_and_rows(self) -> None:
        path = self.write_csv('only-header\n')
        with self.assertRaises(ValueError):
            read_csv(path)


if __name__ == '__main__':
    unittest.main()
