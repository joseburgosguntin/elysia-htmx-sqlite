import { Database } from "bun:sqlite";

const db = new Database("mydb.sqlite", { create: true });

db.query(
  "CREATE TABLE IF NOT EXISTS todos (id INTEGER PRIMARY KEY AUTOINCREMENT, name CHAR(50))",
).run();

db.query("INSERT INTO todos (name) VALUES('Code')").run();

console.log(db.query("SELECT * FROM todos").all());
