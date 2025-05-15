import { redirect, type LoaderFunctionArgs } from "react-router";
import { serverFetch } from "~/server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await serverFetch(request)("/api/user");
  if (user.status === 200) {
    return redirect("/app");
  }
  return redirect("/login");
};
