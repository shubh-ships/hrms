import CareerPage from "@/components/dashboard/ViewAllDashboards/Hrms/JobPortal/JobPortal";
import { Metadata } from "next";
import { notFound } from "next/navigation";

interface CareerPageProps {
  params: Promise<{
    org_alias: string;
  }>;
}

export async function generateMetadata({
  params,
}: CareerPageProps): Promise<Metadata> {
  const { org_alias } = await params;

  const orgName = org_alias
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());

  return {
    title: `Careers at ${orgName} | Join Our Team`,
    description: `Explore exciting career opportunities at ${orgName}. Join our team and grow your career with us.`,
    openGraph: {
      title: `Careers at ${orgName}`,
      description: `Explore exciting career opportunities at ${orgName}.`,
      type: "website",
    },
  };
}

export default async function CareerPageRoute({ params }: CareerPageProps) {
  const { org_alias } = await params;

  if (!org_alias) {
    notFound();
  }

  return <CareerPage />;
}
