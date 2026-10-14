"""Small in-memory DB double used to test the WSGI-to-repository boundary."""
class FakeDatabase:
    def __init__(self):
        self.users = {}
        self.next_id = 1
        self.commits = 0
        self.rollbacks = 0

    def connect(self):
        return FakeConnection(self)


class FakeConnection:
    def __init__(self, db):
        self.db = db
        self.closed = False

    def cursor(self, dictionary=False):
        return FakeCursor(self.db, dictionary)

    def commit(self):
        self.db.commits += 1

    def rollback(self):
        self.db.rollbacks += 1

    def close(self):
        self.closed = True


class FakeCursor:
    def __init__(self, db, dictionary):
        self.db = db
        self.dictionary = dictionary
        self.row = None
        self.closed = False

    def execute(self, sql, params=()):
        normalized = " ".join(sql.lower().split())
        if normalized.startswith("select id from users where email = %s"):
            record = self.db.users.get(params[0])
            self.row = ({"id": record["id"]} if record else None)
        elif normalized.startswith("select id, password_hash from users where email = %s"):
            record = self.db.users.get(params[0])
            self.row = ({"id": record["id"], "password_hash": record["password_hash"]} if record else None)
        elif normalized.startswith("insert into users"):
            name, email, password_hash = params
            self.db.users[email] = {"id": self.db.next_id, "full_name": name, "password_hash": password_hash}
            self.db.next_id += 1
            self.row = None
        else:
            raise AssertionError("Unexpected SQL in fake DB: " + sql)

    def fetchone(self):
        return self.row

    def close(self):
        self.closed = True
