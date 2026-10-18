
import express, { type Request, type Response } from "express";
import { z } from "zod";

const taskFields = {
  title: z.string().min(1),
  description: z.string(),
  priority: z.enum(["low", "medium", "high"]),
  completed: z.boolean(),
};

const createTaskSchema = z.object({
  title: taskFields.title,
  description: taskFields.description.optional().default(""),
  priority: taskFields.priority.optional().default("medium"),
  completed: taskFields.completed.optional().default(false),
});

const updateTaskSchema = z.object({
  title: taskFields.title.optional(),
  description: taskFields.description.optional(),
  priority: taskFields.priority.optional(),
  completed: taskFields.completed.optional(),
});

function withoutTaskId(body: unknown): unknown {
  if (body == null) {
    return {};
  }

  if (typeof body !== "object" || Array.isArray(body)) {
    return body;
  }

  const { id: _ignoredId, ...updates } = body as Record<string, unknown>;
  return updates;
}

function invalidTaskData(error: z.ZodError) {
  return {
    error: "Invalid task data",
    issues: error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    })),
  };
}

import {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  type Task,
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
    return res.status(400).json(invalidTaskData(result.error));
  }

  const task = createTask(result.data);

  return res.status(201).json(task);
});

app.patch("/tasks/:id", (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const result = updateTaskSchema.safeParse(withoutTaskId(req.body));

  if (!result.success) {
    return res.status(400).json(invalidTaskData(result.error));
  }

  const updates: Partial<Omit<Task, "id">> = {};

  if (result.data.title !== undefined) {
    updates.title = result.data.title;
  }

  if (result.data.description !== undefined) {
    updates.description = result.data.description;
  }

  if (result.data.priority !== undefined) {
    updates.priority = result.data.priority;
  }

  if (result.data.completed !== undefined) {
    updates.completed = result.data.completed;
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
