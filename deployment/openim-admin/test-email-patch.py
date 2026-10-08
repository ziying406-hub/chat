import importlib.util
import unittest
import sys

from pathlib import Path

spec = importlib.util.spec_from_file_location('email_patch', Path(__file__).with_name('add-email.py'))
patch = importlib.util.module_from_spec(spec)
spec.loader.exec_module(patch)
source_path = Path(sys.argv.pop(1))


class EmailPatchTest(unittest.TestCase):
    def test_original_bundle(self):
        source = source_path.read_text()
        updated = patch.add_email(source)
        self.assertIn('email:t.email', updated)
        self.assertIn('name:"email",rules:[{type:"email"', updated)
        self.assertIn('name:"phoneNumber",rules:[{required:!0', updated)
        self.assertIn('"/user/import/json"', updated)
        with self.assertRaises(ValueError):
            patch.add_email(updated)
        batch = patch.add_batch(updated)
        self.assertIn('window.AdminBatchUsers', batch)
        self.assertIn('"/account/register"', batch)
        self.assertIn('headers:{isAccount:!0}', batch)
        with self.assertRaises(ValueError):
            patch.add_batch(batch)


if __name__ == '__main__':
    unittest.main()
