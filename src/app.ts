
import express, { type Request, type Response } from "express";
import {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  type Task,
} from "./tasks.js";

function taskUpdatesFromBody(body: unknown): Partial<Omit<Task, "id">> {
  if (body == null || typeof body !== "object" || Array.isArray(body)) {
    return {};
  }

  const record = body as Record<string, unknown>;
  const updates: Partial<Omit<Task, "id">> = {};

  if (typeof record.title === "string") {
    updates.title = record.title;
  }

  if (typeof record.description === "string") {
    updates.description = record.description;
  }

  if (typeof record.completed === "boolean") {
    updates.completed = record.completed;
  }

  if (
    record.priority === "low" ||
    record.priority === "medium" ||
    record.priority === "high"
  ) {
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
  const task = updateTask(id, taskUpdatesFromBody(req.body));

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
