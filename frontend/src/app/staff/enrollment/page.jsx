import { redirect } from "next/navigation";

export default function EnrollmentRedirect({ searchParams }) {
  const cohort = searchParams?.cohort;
  redirect(cohort ? `/staff/students?cohort=${encodeURIComponent(cohort)}` : "/staff/students");
}
