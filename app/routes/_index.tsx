import { redirect, type LoaderFunction } from "react-router";

export const loader: LoaderFunction = async () => {
  return redirect("/login");
};
