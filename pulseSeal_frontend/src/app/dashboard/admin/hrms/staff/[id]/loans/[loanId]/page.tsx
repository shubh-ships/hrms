import LoanSummary from "@/components/dashboard/ViewAllDashboards/Hrms/Staff/LoanSummary";

export default async function Page({ params }: { params: Promise<{ id: string; loanId: string }> }) {
    const { id, loanId } = await params;
    return <LoanSummary id={id} loanId={loanId} />;
}
