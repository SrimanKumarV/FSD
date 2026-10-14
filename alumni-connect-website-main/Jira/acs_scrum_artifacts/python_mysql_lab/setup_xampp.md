# Run the ACS Student Account Lab with XAMPP MySQL (Windows)

1. Start **MySQL** from the XAMPP Control Panel.
2. Open phpMyAdmin and execute `schema.sql` in the SQL tab. It creates the dedicated `acs_student_lab` database and `users` table.
3. In the phpMyAdmin SQL tab, create a least-privilege local lab account. Replace the example password before executing:

   ```sql
   CREATE USER IF NOT EXISTS 'acs_lab_user'@'127.0.0.1' IDENTIFIED BY 'replace-with-a-strong-local-password';
   GRANT SELECT, INSERT ON acs_student_lab.users TO 'acs_lab_user'@'127.0.0.1';
   FLUSH PRIVILEGES;
   ```
4. Install the Python dependency in PowerShell from this folder:

   ```powershell
   python -m pip install -r requirements.txt
   ```

5. Set the connection values for the current PowerShell window. Replace the example values with your local MySQL configuration; use a dedicated lab account if one is configured.

   ```powershell
   $env:DB_HOST = '127.0.0.1'
   $env:DB_PORT = '3306'
   $env:DB_NAME = 'acs_student_lab'
   $env:DB_USER = 'acs_lab_user'
   $env:DB_PASSWORD = '<your-local-lab-password>'
   ```

6. Start the UI:

   ```powershell
   python app.py
   ```

   Open `http://127.0.0.1:5000` and try registration, duplicate registration, login and invalid credentials.

7. In another PowerShell window using the same environment variables, run the actual live-MySQL integration test:

   ```powershell
   $env:RUN_MYSQL_INTEGRATION = '1'
   $env:PYTHONPATH = '.'
   python -m unittest tests.test_mysql_integration -v
   ```

8. Save the **real console output** and add it to Jira issue `ACS-35`. Mark `ACS-35` and parent `ACS-21` complete only if the live test passes.

Do not use a production database. This is an educational lab. The current login code verifies credentials but does not issue production-grade sessions/tokens, and the app must not be exposed publicly without additional security controls.
