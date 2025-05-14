import { redirect, type LoaderFunctionArgs } from "react-router";
import { rpc } from "~/lib/rpc";
import { serverFetch } from "~/server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await rpc.api.user.$get(undefined, {
    fetch: serverFetch(request),
  });
  if (user.status === 200) {
    return redirect("/app");
  }
  return redirect("/login");
};
