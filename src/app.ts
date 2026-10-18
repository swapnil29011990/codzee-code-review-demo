
import express, { type Request, type Response } from "express";
import {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  type Task,
} from "./tasks.js";

function taskUpdatesFromBody(
  body: unknown,
): Partial<Omit<Task, "id">> | undefined {
  if (body == null) {
    return {};
  }

  if (typeof body !== "object" || Array.isArray(body)) {
    return undefined;
  }

  const record = body as Record<string, unknown>;
  const updates: Partial<Omit<Task, "id">> = {};

  for (const key of Object.keys(record)) {
    if (key === "id") {
      continue;
    }

    if (
      key !== "title" &&
      key !== "description" &&
      key !== "completed" &&
      key !== "priority"
    ) {
      return undefined;
    }
  }

  if ("title" in record) {
    if (typeof record.title !== "string") {
      return undefined;
    }

    updates.title = record.title;
  }

  if ("description" in record) {
    if (typeof record.description !== "string") {
      return undefined;
    }

    updates.description = record.description;
  }

  if ("completed" in record) {
    if (typeof record.completed !== "boolean") {
      return undefined;
    }

    updates.completed = record.completed;
  }

  if ("priority" in record) {
    if (
      record.priority !== "low" &&
      record.priority !== "medium" &&
      record.priority !== "high"
    ) {
      return undefined;
    }

    updates.priority = record.priority;
  }

  return updates;
}

const app = express();

app.use(express.json());

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

app.get("/tasks", (_req: Request, res: Response) => {
  res.json(getAllTasks());
});

app.get("/tasks/:id", (req: Request, res: Response) => {
  const task = getTaskById(Number(req.params.id));

  if (!task) {
    return res.status(404).json({ error: "Task not found" });
  }

  return res.json(task);
});

app.post("/tasks", (req: Request, res: Response) => {
  const { title, description = "", priority = "medium" } = req.body;

  const task = createTask({
    title,
    description,
    completed: false,
    priority,
  });

  return res.status(201).json(task);
});

app.patch("/tasks/:id", (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const updates = taskUpdatesFromBody(req.body);

  if (!updates) {
    return res.status(400).json({ error: "Invalid task data" });
  }

  const task = updateTask(id, updates);

  if (!task) {
    return res.status(404).json({ error: "Task not found" });
  }

  return res.json(task);
});

app.delete("/tasks/:id", (req: Request, res: Response) => {
  const deleted = deleteTask(Number(req.params.id));

  if (!deleted) {
    return res.status(404).json({ error: "Task not found" });
  }

  return res.status(204).send();
});

export default app;
