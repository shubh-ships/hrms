

export interface FraudRecord {
  _id: string
  user_id: {
    _id: string
    name: string
    avatar?: string
  }
  fraudType: string
  assignmentId: {
    _id: string
    title: string
  }
  departmentId: string
  organization_id: string
  status: "Flagged" | "Suspicious" | "Clean"
  createdAt: string
  updatedAt: string
}

export type FraudStatus = "Flagged" | "Suspicious" | "Clean"

 