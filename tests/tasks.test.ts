
import { afterEach, describe, expect, it } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import { resetTasks } from "../src/tasks.js";

afterEach(() => {
  resetTasks();
});

describe("Task API", () => {
  it("returns the health status", async () => {
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("ok");
  });

  it("lists all tasks", async () => {
    const response = await request(app).get("/tasks");

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(2);
  });

  it("returns a task by ID", async () => {
    const response = await request(app).get("/tasks/1");

    expect(response.status).toBe(200);
    expect(response.body.title).toBe("Learn TypeScript");
  });

  it("returns 404 for a missing task", async () => {
    const response = await request(app).get("/tasks/999");

    expect(response.status).toBe(404);
    expect(response.body.error).toBe("Task not found");
  });

  it("creates a task", async () => {
    const response = await request(app)
      .post("/tasks")
      .send({
        title: "Prepare for Codzee",
        description: "Evaluate automated code reviews",
        priority: "high",
      });

    expect(response.status).toBe(201);
    expect(response.body.id).toBe(3);
    expect(response.body.title).toBe("Prepare for Codzee");
  });

  it("updates a task", async () => {
    const response = await request(app)
      .patch("/tasks/1")
      .send({ completed: true });

    expect(response.status).toBe(200);
    expect(response.body.completed).toBe(true);
  });

  it("deletes a task", async () => {
    const response = await request(app).delete("/tasks/1");

    expect(response.status).toBe(204);

    const nextResponse = await request(app).get("/tasks/1");
    expect(nextResponse.status).toBe(404);
  });

  it("should not allow changing a task ID through PATCH", async () => {
    const createResponse = await request(app)
      .post("/tasks")
      .send({
        title: "Original task",
        priority: "medium",
      });
  
    expect(createResponse.status).toBe(201);
  
    const originalId = createResponse.body.id;
  
    const patchResponse = await request(app)
      .patch(`/tasks/${originalId}`)
      .send({
        id: "modified-id",
        title: "Updated task",
      });
  
    expect(patchResponse.status).toBe(200);
    expect(patchResponse.body.id).toBe(originalId);
    expect(patchResponse.body.title).toBe("Updated task");
  });
  
  it("should handle PATCH requests with no body", async () => {
    const createResponse = await request(app)
      .post("/tasks")
      .send({ title: "Original task" });
  
    expect(createResponse.status).toBe(201);
  
    const task = createResponse.body;
  
    const patchResponse = await request(app)
      .patch(`/tasks/${task.id}`);
  
    expect(patchResponse.status).toBe(200);
    expect(patchResponse.body).toEqual(task);
  });

  it("should apply valid PATCH fields and ignore unknown or invalid ones", async () => {
    const before = await request(app).get("/tasks/1");

    const response = await request(app)
      .patch("/tasks/1")
      .send({ completed: true, extra: 1, priority: "urgent" });

    expect(response.status).toBe(200);
    expect(response.body.completed).toBe(true);
    expect(response.body.priority).toBe(before.body.priority);
    expect(response.body.id).toBe(before.body.id);
    expect(response.body).not.toHaveProperty("extra");

    const arrayResponse = await request(app)
      .patch("/tasks/1")
      .send(["completed"]);

    expect(arrayResponse.status).toBe(200);
    expect(arrayResponse.body).toEqual(response.body);
  });
});