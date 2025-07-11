import { authenticator } from "~/services/oidc.server";

import { redirect, type LoaderFunctionArgs } from "@remix-run/node";

import { sessionStorage } from "~/services/session";


export async function loader({ request }: LoaderFunctionArgs) {
  const user = await authenticator.authenticate("oidc", request);
  
  const session = await sessionStorage.getSession(
      request.headers.get("cookie")
  );

  session.set("user", user);

  // Redirect to the home page after successful login
  return redirect("/", {
    headers: {
      "Set-Cookie": await sessionStorage.commitSession(session),
    },
  });
}