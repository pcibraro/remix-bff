import { authenticator } from "~/services/oidc.server";

import type { ActionFunctionArgs } from "@remix-run/node";

export async function action({ request }: ActionFunctionArgs) {
  await authenticator.authenticate("oidc", request);
}