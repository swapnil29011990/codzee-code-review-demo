
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

  it("should reject a missing title", async () => {
    const response = await request(app)
      .post("/tasks")
      .send({ priority: "medium" });
  
    expect(response.status).toBe(400);
    expect(response.body.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: "title" }),
      ]),
    );
  });
  
  it("should accept a title longer than 100 characters", async () => {
    const title = "a".repeat(101);

    const response = await request(app)
      .post("/tasks")
      .send({ title });

    expect(response.status).toBe(201);
    expect(response.body.title).toBe(title);
  });

  it("should accept a description longer than 500 characters", async () => {
    const description = "a".repeat(501);

    const response = await request(app)
      .post("/tasks")
      .send({
        title: "Test task",
        description,
      });

    expect(response.status).toBe(201);
    expect(response.body.description).toBe(description);
  });
  
  it("should reject a non-boolean completed value", async () => {
    const response = await request(app)
      .post("/tasks")
      .send({
        title: "Test task",
        completed: "true",
      });
  
    expect(response.status).toBe(400);
  });
  
  it("should reject a non-object request body", async () => {
    const response = await request(app)
      .post("/tasks")
      .set("Content-Type", "application/json")
      .send('"invalid body"');
  
    expect(response.status).toBe(400);
  });

  it("should keep surrounding spaces in the title and apply default values", async () => {
    const response = await request(app)
      .post("/tasks")
      .send({ title: "  Buy milk " });

    expect(response.status).toBe(201);
    expect(response.body.title).toBe("  Buy milk ");
    expect(response.body.description).toBe("");
    expect(response.body.priority).toBe("medium");
  });

  it("should reject an invalid task priority", async () => {
    const response = await request(app)
      .post("/tasks")
      .send({
        title: "Test task",
        description: "Test description",
        priority: "urgent",
      });
  
    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Invalid task data");
    expect(response.body.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: "priority",
          message: expect.any(String),
        }),
      ]),
    );
  });
});
