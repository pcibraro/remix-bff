import type { MetaFunction, LoaderFunctionArgs } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import { sessionStorage } from "~/services/session";

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

  return user;
}

export default function Index() {

  const user = useLoaderData<typeof loader>();

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


