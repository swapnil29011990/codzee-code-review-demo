
export interface Task {
    id: number;
    title: string;
    description: string;
    completed: boolean;
    priority: "low" | "medium" | "high";
  }
  
  let tasks: Task[] = [
    {
      id: 1,
      title: "Learn TypeScript",
      description: "Practice TypeScript fundamentals",
      completed: false,
      priority: "high",
    },
    {
      id: 2,
      title: "Write API tests",
      description: "Test task management endpoints",
      completed: true,
      priority: "medium",
    },
  ];
  
  let nextId = 3;
  
  export function getAllTasks(): Task[] {
    return tasks;
  }
  
  export function getTaskById(id: number): Task | undefined {
    return tasks.find((task) => task.id === id);
  }
  
  export function createTask(
    data: Omit<Task, "id">,
  ): Task {
    const task: Task = {
      id: nextId++,
      ...data,
    };
  
    tasks.push(task);
    return task;
  }
  
  export function updateTask(
    id: number,
    data: Partial<Omit<Task, "id">>,
  ): Task | undefined {
    const task = tasks.find((task) => task.id === id);
  
    if (!task) {
      return undefined;
    }
  
    const source = data ?? {};
    const updates: Partial<Omit<Task, "id">> = {};

    if (source.title !== undefined) {
      updates.title = source.title;
    }

    if (source.description !== undefined) {
      updates.description = source.description;
    }

    if (source.completed !== undefined) {
      updates.completed = source.completed;
    }

    if (source.priority !== undefined) {
      updates.priority = source.priority;
    }

    Object.assign(task, updates);
  
    return task;
  }
  
  export function deleteTask(id: number): boolean {
    const index = tasks.findIndex((task) => task.id === id);
  
    if (index === -1) {
      return false;
    }
  
    tasks.splice(index, 1);
    return true;
  }
  
  export function resetTasks(): void {
    tasks = [
      {
        id: 1,
        title: "Learn TypeScript",
        description: "Practice TypeScript fundamentals",
        completed: false,
        priority: "high",
      },
      {
        id: 2,
        title: "Write API tests",
        description: "Test task management endpoints",
        completed: true,
        priority: "medium",
      },
    ];
  
    nextId = 3;
  }
  