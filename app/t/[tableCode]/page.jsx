import { redirect } from "next/navigation";

export default async function TableLandingPage({ params }) {
  const { tableCode } = await params;
  redirect(`/t/${tableCode}/menu`);
}
