// "use client";

// import React, { useEffect } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { RootState, AppDispatch } from "@/store";
// import { getExpenseStats } from "@/features/expenseBalance/expenseSlice";
// import { ExpenseStatus } from "@/lib/types/api/expenses";

// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import {
//   TrendingUp,
//   TrendingDown,
//   Clock,
//   CheckCircle,
//   XCircle,
//   DollarSign,
// } from "lucide-react";

// const ExpenseStats: React.FC = () => {
//   const dispatch = useDispatch<AppDispatch>();
//   const { stats, loading } = useSelector((state: RootState) => state.expense);

//   useEffect(() => {
//     dispatch(getExpenseStats());
//   }, [dispatch]);

//   const formatAmount = (amount: number) => {
//     return new Intl.NumberFormat("en-IN", {
//       style: "currency",
//       currency: "INR",
//     }).format(amount);
//   };

//   const getStatusIcon = (status: string) => {
//     switch (status) {
//       case ExpenseStatus.APPROVED:
//         return <CheckCircle className="h-4 w-4 text-green-600" />;
//       case ExpenseStatus.REJECTED:
//         return <XCircle className="h-4 w-4 text-red-600" />;
//       case ExpenseStatus.PENDING:
//         return <Clock className="h-4 w-4 text-yellow-600" />;
//       default:
//         return <DollarSign className="h-4 w-4" />;
//     }
//   };

//   const getStatusColor = (status: string) => {
//     switch (status) {
//       case ExpenseStatus.APPROVED:
//         return "border-green-200 bg-green-50";
//       case ExpenseStatus.REJECTED:
//         return "border-red-200 bg-red-50";
//       case ExpenseStatus.PENDING:
//         return "border-yellow-200 bg-yellow-50";
//       default:
//         return "border-gray-200 bg-gray-50";
//     }
//   };

//   if (loading || !stats) {
//     return (
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
//         {[1, 2, 3, 4].map((i) => (
//           <Card key={i} className="animate-pulse">
//             <CardHeader className="pb-2">
//               <div className="h-4 bg-gray-200 rounded w-3/4"></div>
//             </CardHeader>
//             <CardContent>
//               <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
//               <div className="h-3 bg-gray-200 rounded w-full"></div>
//             </CardContent>
//           </Card>
//         ))}
//       </div>
//     );
//   }

//   const { statusStats, overallStats } = stats;

//   return (
//     <div className="space-y-6">
//       <div>
//         <h2 className="text-2xl font-bold tracking-tight">
//           Expense Statistics
//         </h2>
//         <p className="text-muted-foreground">
//           Overview of all expense requests and their current status
//         </p>
//       </div>

//       {/* Overall Stats */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
//         <Card>
//           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//             <CardTitle className="text-sm font-medium">
//               Total Requests
//             </CardTitle>
//             <TrendingUp className="h-4 w-4 text-muted-foreground" />
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold">
//               {overallStats.totalRequests}
//             </div>
//             <p className="text-xs text-muted-foreground">
//               All expense requests submitted
//             </p>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//             <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
//             <DollarSign className="h-4 w-4 text-muted-foreground" />
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold">
//               {formatAmount(overallStats.totalAmount)}
//             </div>
//             <p className="text-xs text-muted-foreground">
//               Sum of all expense requests
//             </p>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//             <CardTitle className="text-sm font-medium">
//               Approved Amount
//             </CardTitle>
//             <CheckCircle className="h-4 w-4 text-green-600" />
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold text-green-600">
//               {formatAmount(overallStats.approvedAmount)}
//             </div>
//             <p className="text-xs text-muted-foreground">
//               Total approved expenses
//             </p>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//             <CardTitle className="text-sm font-medium">
//               Pending Amount
//             </CardTitle>
//             <Clock className="h-4 w-4 text-yellow-600" />
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold text-yellow-600">
//               {formatAmount(overallStats.pendingAmount)}
//             </div>
//             <p className="text-xs text-muted-foreground">Awaiting approval</p>
//           </CardContent>
//         </Card>
//       </div>

//       {/* Status-wise Breakdown */}
//       <div>
//         <h3 className="text-lg font-semibold mb-4">Status Breakdown</h3>
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//           {statusStats.map((stat) => (
//             <Card key={stat._id} className={getStatusColor(stat._id)}>
//               <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//                 <CardTitle className="text-sm font-medium flex items-center gap-2">
//                   {getStatusIcon(stat._id)}
//                   {stat._id} Requests
//                 </CardTitle>
//                 <Badge variant="outline">{stat.count}</Badge>
//               </CardHeader>
//               <CardContent>
//                 <div className="space-y-2">
//                   <div className="flex justify-between items-center">
//                     <span className="text-sm text-muted-foreground">
//                       Total Amount:
//                     </span>
//                     <span className="font-medium">
//                       {formatAmount(stat.totalAmount)}
//                     </span>
//                   </div>
//                   <div className="flex justify-between items-center">
//                     <span className="text-sm text-muted-foreground">
//                       Average:
//                     </span>
//                     <span className="font-medium">
//                       {formatAmount(stat.totalAmount / stat.count)}
//                     </span>
//                   </div>
//                   <div className="flex justify-between items-center">
//                     <span className="text-sm text-muted-foreground">
//                       Percentage:
//                     </span>
//                     <span className="font-medium">
//                       {(
//                         (stat.count / overallStats.totalRequests) *
//                         100
//                       ).toFixed(1)}
//                       %
//                     </span>
//                   </div>
//                 </div>
//               </CardContent>
//             </Card>
//           ))}
//         </div>
//       </div>

//       {/* Summary Card */}
//       <Card>
//         <CardHeader>
//           <CardTitle>Summary</CardTitle>
//           <CardDescription>
//             Quick overview of expense management metrics
//           </CardDescription>
//         </CardHeader>
//         <CardContent>
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//             <div className="space-y-4">
//               <div>
//                 <h4 className="font-medium mb-2">Approval Rate</h4>
//                 <div className="w-full bg-gray-200 rounded-full h-2">
//                   <div
//                     className="bg-green-600 h-2 rounded-full"
//                     style={{
//                       width: `${
//                         overallStats.totalRequests > 0
//                           ? ((statusStats.find(
//                               (s) => s._id === ExpenseStatus.APPROVED
//                             )?.count || 0) /
//                               overallStats.totalRequests) *
//                             100
//                           : 0
//                       }%`,
//                     }}
//                   ></div>
//                 </div>
//                 <p className="text-sm text-muted-foreground mt-1">
//                   {overallStats.totalRequests > 0
//                     ? (
//                         ((statusStats.find(
//                           (s) => s._id === ExpenseStatus.APPROVED
//                         )?.count || 0) /
//                           overallStats.totalRequests) *
//                         100
//                       ).toFixed(1)
//                     : 0}
//                   % of requests approved
//                 </p>
//               </div>
//             </div>

//             <div className="space-y-4">
//               <div>
//                 <h4 className="font-medium mb-2">Financial Impact</h4>
//                 <div className="space-y-2 text-sm">
//                   <div className="flex justify-between">
//                     <span>Approved:</span>
//                     <span className="font-medium text-green-600">
//                       {formatAmount(overallStats.approvedAmount)}
//                     </span>
//                   </div>
//                   <div className="flex justify-between">
//                     <span>Pending:</span>
//                     <span className="font-medium text-yellow-600">
//                       {formatAmount(overallStats.pendingAmount)}
//                     </span>
//                   </div>
//                   <div className="flex justify-between border-t pt-2">
//                     <span>Total:</span>
//                     <span className="font-bold">
//                       {formatAmount(overallStats.totalAmount)}
//                     </span>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </CardContent>
//       </Card>
//     </div>
//   );
// };

// export default ExpenseStats;

"use client";

import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/store";
import { getExpenseStats } from "@/features/expenseBalance/expenseSlice";
import { ExpenseStatus } from "@/lib/types/api/expenses";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  DollarSign,
} from "lucide-react";

const ExpenseStats: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { stats, loading } = useSelector((state: RootState) => state.expense);

  useEffect(() => {
    dispatch(getExpenseStats());
  }, [dispatch]);

  const formatAmount = (amount?: number): string => {
    const validAmount = amount ?? 0;
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(validAmount);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case ExpenseStatus.APPROVED:
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case ExpenseStatus.REJECTED:
        return <XCircle className="h-4 w-4 text-red-600" />;
      case ExpenseStatus.PENDING:
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case ExpenseStatus.APPROVED:
        return "border-green-200 bg-green-50";
      case ExpenseStatus.REJECTED:
        return "border-red-200 bg-red-50";
      case ExpenseStatus.PENDING:
        return "border-yellow-200 bg-yellow-50";
      default:
        return "border-gray-200 bg-gray-50";
    }
  };

  if (loading || !stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statusStats = stats?.statusStats ?? [];
  const overallStats = stats?.overallStats ?? {};

  // Safely extract values with defaults
  const totalRequests = (overallStats as any)?.totalRequests ?? 0;
  const totalAmount = (overallStats as any)?.totalAmount ?? 0;
  const approvedAmount = (overallStats as any)?.approvedAmount ?? 0;
  const pendingAmount = (overallStats as any)?.pendingAmount ?? 0;

  const approvedCount = statusStats.find(
    (s: any) => s._id === ExpenseStatus.APPROVED
  )?.count ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          Expense Statistics
        </h2>
        <p className="text-muted-foreground">
          Overview of all expense requests and their current status
        </p>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Requests
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRequests}</div>
            <p className="text-xs text-muted-foreground">
              All expense requests submitted
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatAmount(totalAmount)}
            </div>
            <p className="text-xs text-muted-foreground">
              Sum of all expense requests
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Approved Amount
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatAmount(approvedAmount)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total approved expenses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Amount
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {formatAmount(pendingAmount)}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>
      </div>

      {/* Status-wise Breakdown */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Status Breakdown</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {statusStats.length > 0 ? (
            statusStats.map((stat: any) => (
              <Card key={stat._id} className={getStatusColor(stat._id)}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    {getStatusIcon(stat._id)}
                    {stat._id} Requests
                  </CardTitle>
                  <Badge variant="outline">{stat.count ?? 0}</Badge>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Total Amount:
                      </span>
                      <span className="font-medium">
                        {formatAmount(stat.totalAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Average:
                      </span>
                      <span className="font-medium">
                        {formatAmount(
                          stat.count > 0 ? stat.totalAmount / stat.count : 0
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Percentage:
                      </span>
                      <span className="font-medium">
                        {totalRequests > 0
                          ? ((stat.count / totalRequests) * 100).toFixed(1)
                          : "0.0"}
                        %
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="col-span-3">
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  No expense data available
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
          <CardDescription>
            Quick overview of expense management metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Approval Rate</h4>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{
                      width: `${
                        totalRequests > 0
                          ? ((approvedCount / totalRequests) * 100)
                          : 0
                      }%`,
                    }}
                  ></div>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {totalRequests > 0
                    ? ((approvedCount / totalRequests) * 100).toFixed(1)
                    : "0.0"}
                  % of requests approved
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Financial Impact</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Approved:</span>
                    <span className="font-medium text-green-600">
                      {formatAmount(approvedAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pending:</span>
                    <span className="font-medium text-yellow-600">
                      {formatAmount(pendingAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span>Total:</span>
                    <span className="font-bold">
                      {formatAmount(totalAmount)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExpenseStats;
