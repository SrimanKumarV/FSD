import unittest
from validation import normalize_email, validate_registration
from security import hash_password, verify_password


class RegistrationValidationTests(unittest.TestCase):
    def test_email_is_normalized(self):
        self.assertEqual(normalize_email("  Student@Example.COM "), "student@example.com")

    def test_valid_registration_has_no_errors(self):
        self.assertEqual(validate_registration("Student A", "student@example.com", "StrongPass123"), [])

    def test_missing_name_is_rejected(self):
        self.assertIn("full_name is required", validate_registration("", "student@example.com", "StrongPass123"))

    def test_invalid_email_is_rejected(self):
        self.assertIn("valid email is required", validate_registration("Student A", "not-an-email", "StrongPass123"))

    def test_short_password_is_rejected(self):
        self.assertIn("password must be at least 8 characters", validate_registration("Student A", "student@example.com", "short"))

    def test_long_password_is_rejected(self):
        self.assertIn("password must be at most 256 characters", validate_registration("Student A", "student@example.com", "x" * 257))

    def test_password_hash_verifies_without_storing_plaintext(self):
        encoded = hash_password("StrongPass123", salt=b"0123456789abcdef", iterations=10_000)
        self.assertNotEqual(encoded, "StrongPass123")
        self.assertTrue(verify_password("StrongPass123", encoded))
        self.assertFalse(verify_password("WrongPassword", encoded))

    def test_malformed_hash_is_rejected(self):
        self.assertFalse(verify_password("anything", "not-a-hash"))


if __name__ == "__main__":
    unittest.main(verbosity=2)
