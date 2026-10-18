
import express, { type Request, type Response } from "express";
import {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
} from "./tasks.js";

const app = express();

app.use(express.json());

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

app.get("/tasks", (req: Request, res: Response) => {
  const rawLimit = req.query.limit;
  const rawOffset = req.query.offset;

  if (
    (rawLimit !== undefined &&
      (typeof rawLimit !== "string" ||
        !/^\d+$/.test(rawLimit))) ||
    (rawOffset !== undefined &&
      (typeof rawOffset !== "string" ||
        !/^\d+$/.test(rawOffset)))
  ) {
    return res.status(400).json({
      error: "Invalid pagination parameters",
    });
  }

  const limit = rawLimit === undefined ? undefined : Number(rawLimit);
  const offset = rawOffset === undefined ? 0 : Number(rawOffset);

  if (
    (limit !== undefined &&
      (!Number.isSafeInteger(limit) || limit < 1 || limit > 100)) ||
    !Number.isSafeInteger(offset)
  ) {
    return res.status(400).json({
      error: "Invalid pagination parameters",
    });
  }

  const tasks = getAllTasks().slice(
    offset,
    limit === undefined ? undefined : offset + limit,
  );

  return res.json(tasks);
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
  const task = updateTask(id, req.body);

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
