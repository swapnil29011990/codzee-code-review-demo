
import express, { type Request, type Response } from "express";
import { z } from "zod";

const createTaskSchema = z.object({
  title: z.string().trim().min(1).max(100),
  description: z.string().max(500).optional().default(""),
  priority: z.enum(["low", "medium", "high"]).optional().default("medium"),
  completed: z.boolean().optional().default(false),
});

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
  const result = createTaskSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      error: "Invalid task data",
      issues: result.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    });
  }

  const task = createTask(result.data);

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
