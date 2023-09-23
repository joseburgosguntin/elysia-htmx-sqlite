import { Elysia, t } from "elysia";
import { Database } from "bun:sqlite";
import { staticPlugin } from "@elysiajs/static";

type Todo = { id: number; name: string };

// state
const db = new Database("mydb.sqlite");

const app = new Elysia()
  // static files
  .use(staticPlugin({ prefix: "/" }))
  .get("/", ({ set }) => Bun.file("public/index.html"))
  // actions
  .get("todos", ({ set }) => {
    let todos = db
      .query<Todo, []>("SELECT * FROM todos")
      .all()
      // if I want to only use htmx
      // but it don't work idk
      // id="refresh"
      .map(
        ({ id, name }) => `
        <li>
          ${name} 
          <button 
            _="on htmx:afterRequest send refresh to #todos"
            hx-delete="/todos/${id}"
            hx-swap="none"
          >
            X
          </button>
        </li>
        `,
      )
      .join("");
    set.headers["Content-Type"] = "text/html; charset=utf-8";
    console.log(todos);
    return new Response(todos);
  })

  // surgical but messy also data is more likely to become stale cuz no refresh
  // let res = db
  //   .query<Todo, { $name: string }>(
  //     "INSERT INTO todos (name) VALUES($name) RETURNING id, name",
  //   )
  //   .get({
  //     $name: body.name,
  //   });
  // console.log(res);
  // if (res) {
  //   let { id, name } = res;
  //   return `<ol id="todos" hx-swap-oob="beforeend"><li>${name}</li></ol>`;
  // }
  .post(
    "todos",
    ({ body, set }) => {
      db.query("INSERT INTO todos (name) VALUES($name)").run({
        $name: body.name,
      });
      set.status = 201;
    },
    {
      body: t.Object({
        name: t.String(),
      }),
    },
  )
  .delete("todos/:id", ({ params: { id }, set }) => {
    db.query("DELETE FROM todos WHERE id = $id").run({ $id: id });
    set.status = 204;
  })
  // endpoints (for external use)
  .get("api/todos", () => db.query("SELECT * FROM todos").all())
  .get("api/todos/:id", ({ params: { id } }) =>
    db.query(`SELECT * FROM todos WHERE id = $id`).get({ $id: id }),
  )
  .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
);
