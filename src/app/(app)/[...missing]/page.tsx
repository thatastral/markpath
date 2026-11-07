import { notFound } from "next/navigation";

export const metadata = { title: "Page not found · Markpath" };

/** Any unknown address for a signed-in person: show the 404 inside the app, with the sidebar. */
export default function MissingPage() { notFound(); }
