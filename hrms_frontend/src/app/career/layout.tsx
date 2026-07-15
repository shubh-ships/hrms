import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Careers | Find Your Dream Job",
  description:
    "Explore career opportunities with top companies. Find your perfect job and apply today.",
  robots: {
    index: true,
    follow: true,
  },
};

export default function CareerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="career-layout min-h-screen bg-gray-50">
      <main>{children}</main>
    </div>
  );
}
