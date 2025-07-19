

export type Todo = {
  id: string;
  title: string;
  content: string;
  completed?: boolean | null;
};

export default function Todos({ todos }: { todos: Todo[] }) {
  return (
    <div>
      <h1>Todos</h1>
      <ul>
        {todos && todos.map((todo) => (
          <li key={todo.id} style={{ marginBottom: "1em" }}>
            <strong>{todo.title}</strong>
            <div>{todo.content}</div>
            <div>
              Completed:{" "}
              {todo.completed === null
                ? "Unknown"
                : todo.completed
                ? "Yes"
                : "No"}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}