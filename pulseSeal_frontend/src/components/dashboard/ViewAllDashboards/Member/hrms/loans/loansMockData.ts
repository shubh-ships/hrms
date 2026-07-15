export let mockLoans = [
  { 
    id: 1, 
    applicantName: "CHIRAG",
    title: "year", 
    status: "Open", 
    approvedBy: "Delizia", 
    disbursementDate: "23 Mar, 2026", 
    loanName: "year", 
    principal: "₹1.00",
    interestType: "Simple Interest",
    annualInterestRate: "1.0%",
    totalRepayment: "₹0.33",
    tenure: "3 Months",
    completion: "1/3 months",
    remainingPrincipal: "₹0.67",
    remainingInstalment: "₹0.67",
    closeDate: "31 May, 2026",
    description: "Nothing",
    nextInstalment: {
      date: "30 Apr, 2026",
      amount: "₹0.33",
      principalRepaid: "₹0.33",
      closingPrincipal: "₹0.34",
      closingInstalment: "₹0.34"
    },
    paidInstalments: [
      {
        id: "p1",
        date: "31 Mar, 2026",
        amount: "₹0.33",
        principalRepaid: "₹0.33",
        closingPrincipal: "₹0.67",
        closingInstalment: "₹0.67"
      }
    ]
  },
  { 
    id: 2, 
    applicantName: "JAYANT",
    title: "Phone loan", 
    status: "Open", 
    approvedBy: "Delizia", 
    disbursementDate: "16 Mar, 2026", 
    loanName: "Phone loan", 
    principal: "₹30000.00",
    interestType: "Compound Interest",
    annualInterestRate: "5.0%",
    totalRepayment: "₹30500.00",
    tenure: "12 Months",
    completion: "2/12 months",
    remainingPrincipal: "₹25000.00",
    remainingInstalment: "₹25500.00",
    closeDate: "16 Mar, 2027",
    description: "For new phone purchase",
    nextInstalment: {
      date: "16 May, 2026",
      amount: "₹2500.00",
      principalRepaid: "₹2500.00",
      closingPrincipal: "₹22500.00",
      closingInstalment: "₹22500.00"
    },
    paidInstalments: [
      {
        id: "p2",
        date: "16 Apr, 2026",
        amount: "₹2500.00",
        principalRepaid: "₹2500.00",
        closingPrincipal: "₹25000.00",
        closingInstalment: "₹25000.00"
      }
    ]
  },
  { 
    id: 3, 
    applicantName: "SAM",
    title: "bike", 
    status: "Closed", 
    approvedBy: "Delizia", 
    disbursementDate: "10 Jan, 2026", 
    loanName: "bike", 
    principal: "₹50000.00",
    interestType: "Simple Interest",
    annualInterestRate: "2.0%",
    totalRepayment: "₹51000.00",
    tenure: "6 Months",
    completion: "6/6 months",
    remainingPrincipal: "₹0.00",
    remainingInstalment: "₹0.00",
    closeDate: "10 Jul, 2026",
    description: "Bike EMI",
    nextInstalment: null,
    paidInstalments: [
      {
        id: "p3",
        date: "10 Jul, 2026",
        amount: "₹8500.00",
        principalRepaid: "₹8500.00",
        closingPrincipal: "₹0.00",
        closingInstalment: "₹0.00"
      }
    ]
  }
];

export const addMockLoan = (loan: any) => {
  mockLoans = [loan, ...mockLoans];
};

export const addMockApplication = (app: any) => {
  mockApplications = [app, ...mockApplications];
};

export let mockApplications = [
  { 
    id: 1, 
    applicantName: "CHIRAG",
    title: "Testing", 
    status: "Approved", 
    appliedOn: "26 Feb, 2026", 
    loanName: "Testing", 
    principal: "₹10.00", 
    tenure: "10 Months",
    interestRate: "2.0%",
    interestType: "Simple Interest",
    disbursementDate: "27 Feb, 2026",
    repaymentStartMonth: "Mar 2026",
    description: "testing",
    remark: null
  },
  { 
    id: 2, 
    applicantName: "ROHAN",
    title: "abc", 
    status: "Rejected", 
    appliedOn: "25 Feb, 2026", 
    loanName: "abc", 
    principal: "₹10000.00", 
    tenure: "12 Months",
    interestRate: "5.0%",
    interestType: "Compound Interest",
    disbursementDate: "1 Mar, 2026",
    repaymentStartMonth: "Apr 2026",
    description: "need for education",
    remark: "Not eligible based on policy"
  },
  { 
    id: 3, 
    applicantName: "DEV",
    title: "Laptop", 
    status: "Expired", 
    appliedOn: "20 Jan, 2026", 
    loanName: "Laptop", 
    principal: "₹60000.00", 
    tenure: "24 Months",
    interestRate: "0.0%",
    interestType: "Simple Interest",
    disbursementDate: "25 Jan, 2026",
    repaymentStartMonth: "Feb 2026",
    description: "Work laptop advance",
    remark: "No action taken within 30 days"
  }
];
