
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

  it("should reject an empty title", async () => {
    const response = await request(app)
      .post("/tasks")
      .send({ title: "" });

    expect(response.status).toBe(400);
    expect(response.body.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: "title" }),
      ]),
    );
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
    expect(response.body.completed).toBe(false);
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

  it("should reject an empty title on PATCH", async () => {
    const response = await request(app)
      .patch("/tasks/1")
      .send({ title: "" });

    expect(response.status).toBe(400);
    expect(response.body.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: "title" }),
      ]),
    );

    const task = await request(app).get("/tasks/1");
    expect(task.body.title).toBe("Learn TypeScript");
  });

  it("should reject an invalid priority on PATCH", async () => {
    const response = await request(app)
      .patch("/tasks/1")
      .send({ priority: "urgent" });

    expect(response.status).toBe(400);
    expect(response.body.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: "priority" }),
      ]),
    );

    const task = await request(app).get("/tasks/1");
    expect(task.body.priority).toBe("high");
  });

  it("should not overwrite a task id on PATCH", async () => {
    const response = await request(app)
      .patch("/tasks/1")
      .send({ id: 2, title: "Renamed" });

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(1);
    expect(response.body.title).toBe("Renamed");

    const other = await request(app).get("/tasks/2");
    expect(other.body.id).toBe(2);
    expect(other.body.title).toBe("Write API tests");
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

  it("should apply valid PATCH fields, ignore unknown ones, and reject invalid ones", async () => {
    const before = await request(app).get("/tasks/1");

    const invalid = await request(app)
      .patch("/tasks/1")
      .send({ completed: true, extra: 1, priority: "urgent" });

    expect(invalid.status).toBe(400);
    expect(invalid.body.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: "priority" }),
      ]),
    );

    const unchanged = await request(app).get("/tasks/1");
    expect(unchanged.body).toEqual(before.body);

    const response = await request(app)
      .patch("/tasks/1")
      .send({ completed: true, extra: 1 });

    expect(response.status).toBe(200);
    expect(response.body.completed).toBe(true);
    expect(response.body.priority).toBe(before.body.priority);
    expect(response.body.id).toBe(before.body.id);
    expect(response.body).not.toHaveProperty("extra");

    const arrayResponse = await request(app)
      .patch("/tasks/1")
      .send(["completed"]);

    expect(arrayResponse.status).toBe(400);

    const after = await request(app).get("/tasks/1");
    expect(after.body).toEqual(response.body);
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
