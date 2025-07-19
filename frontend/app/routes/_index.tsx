import type { MetaFunction, LoaderFunctionArgs } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import { sessionStorage } from "~/services/session";
import Todos, {Todo} from "./todos";

const { OIDC_CLIENT_ID, OIDC_CLIENT_SECRET, OIDC_SERVER_URL, API_ROOT } = process.env;

// Ensure they are defined and throw error if not
if (!OIDC_CLIENT_ID) throw new Error("Missing client id");
if (!OIDC_CLIENT_SECRET) throw new Error("Missing client secret");
if (!OIDC_SERVER_URL) throw new Error("Missing OIDC server URL");

export const meta: MetaFunction = () => {
  return [
    { title: "New Remix App" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {

  const session = await sessionStorage.getSession(request.headers.get("cookie"));
  const user = session.get("user");

  if(!user) {
    return null; // User is not authenticated
  }

  const todos = await fetchTodos();

  return { user, todos };
}

const fetchTodos = async function () : Promise<Todo[]> {

  const tokenRes = await fetch(`${OIDC_SERVER_URL}/oidc/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: OIDC_CLIENT_ID,
      client_secret: OIDC_CLIENT_SECRET
    }),
  });

  if (!tokenRes.ok) {
    throw new Response("Failed to get access token", { status: 401 });
  }

  const tokenData = await tokenRes.json();
  const accessToken = tokenData.access_token;

  // 2. Fetch todos from API
  const todosRes = await fetch(`${API_ROOT}/todos`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!todosRes.ok) {
    throw new Response("Failed to fetch todos", { status: 500 });
  }

  const todos: Todo[] = await todosRes.json();

  return todos;
};

export default function Index() {

  const data = useLoaderData<typeof loader>();
 
  const user = data?.user;
  const todos = data?.todos;

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-16">
        <header className="flex flex-col items-center gap-9">
          <h1 className="leading text-2xl font-bold text-gray-800 dark:text-gray-100">
            OpenID Authentication
          </h1>
        </header>
        {user ? (
            <div className="flex flex-col items-center gap-4">
                <p className="text-gray-800 dark:text-gray-100">Welcome, {user.name}!</p>
                <p className="text-gray-600 dark:text-gray-300">Email: {user.email}</p>

                {todos && <Todos todos={todos} />}

                <Form action="logout" method="post">
                  <button type="submit" className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">Logout</button>
                </Form>

            </div>
        ) : (
          <Form action="login" method="post">
              <button type="submit" className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">Login</button>
          </Form>
        )}
        
      </div>
    </div>
  );
}


