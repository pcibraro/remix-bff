
import { redirect, type ActionFunctionArgs } from "@remix-run/node";
import { sessionStorage } from "~/services/session";

const { OIDC_SERVER_URL } = process.env;

if (!OIDC_SERVER_URL) throw new Error("Missing OIDC server URL");

export async function action({ request }: ActionFunctionArgs) {
    const session = await sessionStorage.getSession(
        request.headers.get("cookie")
    );
  
    // Redirect to the home page after successful login
    return redirect(`${OIDC_SERVER_URL}/oidc/logout`, {
      headers: {
        "Set-Cookie": await sessionStorage.destroySession(session),
      },
    });
}