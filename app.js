const { format, isValid } = require("date-fns");
const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const filePath = path.join(__dirname, "todoApplication.db");
const app = express();
app.use(express.json());
module.exports = app;
let db;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: filePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server running at http://localhost:3000/")
    );
  } catch (e) {
    console.log(`Db error ${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const convertTodo = (obj) => {
  return {
    id: obj.id,
    todo: obj.todo,
    priority: obj.priority,
    status: obj.status,
    category: obj.category,
    dueDate: obj.due_date,
  };
};

app.get("/todos/", async (request, response) => {
  const { status, priority, search_q, category } = request.query;
  let query;
  if (
    status !== undefined &&
    priority === undefined &&
    search_q === undefined &&
    category === undefined
  ) {
    query = `select * from todo where status = "${status}";`;
    let dbReply = await db.get(query);
    if (dbReply === undefined) {
      response.status(400);
      response.send("Invalid Todo Status");
    } else {
      const dbReply = await db.all(query);
      response.send(dbReply.map((obj) => convertTodo(obj)));
    }
  } else if (
    status === undefined &&
    priority !== undefined &&
    search_q === undefined &&
    category === undefined
  ) {
    query = `select * from todo where priority = "${priority}";`;
    let dbReply = await db.get(query);
    if (dbReply === undefined) {
      response.status(400);
      response.send("Invalid Todo Priority");
    } else {
      const dbReply = await db.all(query);
      response.send(dbReply.map((obj) => convertTodo(obj)));
    }
  } else if (
    status !== undefined &&
    priority !== undefined &&
    search_q === undefined &&
    category === undefined
  ) {
    query = `select * from todo where status = "${status}" and priority = "${priority}";`;
    const dbReply = await db.all(query);
    response.send(dbReply.map((obj) => convertTodo(obj)));
  } else if (
    status === undefined &&
    priority === undefined &&
    search_q !== undefined &&
    category === undefined
  ) {
    query = `select * from todo where todo like "%${search_q}%";`;
    const dbReply = await db.all(query);
    response.send(dbReply.map((obj) => convertTodo(obj)));
  } else if (
    status !== undefined &&
    priority === undefined &&
    search_q === undefined &&
    category !== undefined
  ) {
    query = `select * from todo where status = "${status}" and category = "${category}";`;
    const dbReply = await db.all(query);
    response.send(dbReply.map((obj) => convertTodo(obj)));
  } else if (
    status === undefined &&
    priority === undefined &&
    search_q === undefined &&
    category !== undefined
  ) {
    query = `select * from todo where category = "${category}";`;
    let dbReply = await db.get(query);
    if (dbReply === undefined) {
      response.status(400);
      response.send("Invalid Todo Category");
    } else {
      const dbReply = await db.all(query);
      response.send(dbReply.map((obj) => convertTodo(obj)));
    }
  } else if (
    status === undefined &&
    priority !== undefined &&
    search_q === undefined &&
    category !== undefined
  ) {
    query = `select * from todo where priority = "${priority}" and category = "${category}";`;
    const dbReply = await db.all(query);
    response.send(dbReply.map((obj) => convertTodo(obj)));
  }
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const query = `select * from todo where id = ${todoId};`;
  const dbReply = await db.get(query);
  response.send(convertTodo(dbReply));
});

app.get("/agenda/", async (request, response) => {
  let { date } = request.query;
  const isDateValid = isValid(new Date(date));
  if (isDateValid === false) {
    response.status(400);
    response.send("Invalid Due Date");
  } else {
    date = format(new Date(date), "yyyy-MM-dd");
    const query = `select * from todo where due_date = "${date}";`;
    const dbReply = await db.all(query);
    response.send(dbReply.map((eachObj) => convertTodo(eachObj)));
  }
});

app.post("/todos/", async (request, response) => {
  let { id, todo, priority, status, category, dueDate } = request.body;
  if (status !== "TO DO" && status !== "IN PROGRESS" && status !== "DONE") {
    response.status(400);
    response.send("Invalid Todo Status");
  } else if (
    priority !== "HIGH" &&
    priority !== "LOW" &&
    priority !== "MEDIUM"
  ) {
    response.status(400);
    response.send("Invalid Todo Priority");
  } else if (
    category !== "WORK" &&
    category !== "HOME" &&
    category !== "LEARNING"
  ) {
    response.status(400);
    response.send("Invalid Todo Category");
  } else if (isValid(new Date(dueDate)) === false) {
    response.status(400);
    response.send("Invalid Due Date");
  } else {
    const query = `insert into todo values(${id},"${todo}","${priority}","${status}","${category}","${dueDate}");`;
    await db.run(query);
    response.send("Todo Successfully Added");
  }
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let { todo, priority, status, category, dueDate } = request.body;
  if (
    status !== undefined &&
    priority === undefined &&
    todo === undefined &&
    category === undefined &&
    dueDate === undefined
  ) {
    if (status !== "TO DO" && status !== "IN PROGRESS" && status !== "DONE") {
      response.status(400);
      response.send("Invalid Todo Status");
    } else {
      const query = `update todo set status = "${status}" where id = ${todoId};`;
      await db.run(query);
      response.send("Status Updated");
    }
  } else if (
    status === undefined &&
    priority !== undefined &&
    todo === undefined &&
    category === undefined &&
    dueDate === undefined
  ) {
    if (priority !== "HIGH" && priority !== "LOW" && priority !== "MEDIUM") {
      response.status(400);
      response.send("Invalid Todo Priority");
    } else {
      const query = `update todo set priority = "${priority}" where id = ${todoId};`;
      await db.run(query);
      response.send("Priority Updated");
    }
  } else if (
    status === undefined &&
    priority === undefined &&
    todo !== undefined &&
    category === undefined &&
    dueDate === undefined
  ) {
    const query = `update todo set todo = "${todo}" where id = ${todoId};`;
    await db.run(query);
    response.send("Todo Updated");
  } else if (
    status === undefined &&
    priority === undefined &&
    todo === undefined &&
    category !== undefined &&
    dueDate === undefined
  ) {
    if (category !== "WORK" && category !== "HOME" && category !== "LEARNING") {
      response.status(400);
      response.send("Invalid Todo Category");
    } else {
      const query = `update todo set category = "${category}" where id = ${todoId};`;
      await db.run(query);
      response.send("Category Updated");
    }
  } else if (
    status === undefined &&
    priority === undefined &&
    todo === undefined &&
    category === undefined &&
    dueDate !== undefined
  ) {
    if (isValid(new Date(dueDate)) === false) {
      response.status(400);
      response.send("Invalid Due Date");
    } else {
      dueDate = format(new Date(dueDate), "yyyy-MM-dd");
      const query = `update todo set due_date = "${dueDate}" where id = ${todoId};`;
      await db.run(query);
      response.send("Due Date Updated");
    }
  }
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const query = `delete from todo where id = ${todoId};`;
  await db.run(query);
  response.send("Todo Deleted");
});
