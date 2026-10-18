
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

  it("returns every task when limit is omitted", async () => {
    for (let index = 0; index < 11; index += 1) {
      await request(app).post("/tasks").send({ title: `Extra ${index}` });
    }

    const response = await request(app).get("/tasks");

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(13);
    expect(response.body[12].title).toBe("Extra 10");
  });

  it("returns every task after the offset when limit is omitted", async () => {
    for (let index = 0; index < 11; index += 1) {
      await request(app).post("/tasks").send({ title: `Extra ${index}` });
    }

    const response = await request(app).get("/tasks?offset=1");

    expect(response.status).toBe(200);
    expect(response.body.map((task: { title: string }) => task.title)).toEqual([
      "Write API tests",
      ...Array.from({ length: 11 }, (_, index) => `Extra ${index}`),
    ]);
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

  it("should return tasks using limit and offset", async () => {
    await request(app).post("/tasks").send({ title: "Task A" });
    await request(app).post("/tasks").send({ title: "Task B" });
    await request(app).post("/tasks").send({ title: "Task C" });
  
    const response = await request(app)
      .get("/tasks?limit=2&offset=1");
  
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(2);
    expect(response.body.map((task: { title: string }) => task.title))
      .toEqual(["Write API tests", "Task A"]);
  });

  it.each([
    "/tasks?limit=0",
    "/tasks?limit=-1",
    "/tasks?limit=101",
    "/tasks?limit=abc",
    "/tasks?offset=-1",
    "/tasks?offset=abc",
  ])("should reject invalid pagination: %s", async (url) => {
    const response = await request(app).get(url);
  
    expect(response.status).toBe(400);
    expect(response.body.error)
      .toBe("Invalid pagination parameters");
  });

  it("should return an empty array when offset exceeds available tasks", async () => {
    await request(app).post("/tasks").send({ title: "Task A" });
  
    const response = await request(app)
      .get("/tasks?limit=10&offset=100");
  
    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });
});
