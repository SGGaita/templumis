import { redirect } from "next/navigation";

export default function AdvisorRequestDetailRedirect({ params }) {
  redirect(`/sponsor/requests/${params.id}`);
}
