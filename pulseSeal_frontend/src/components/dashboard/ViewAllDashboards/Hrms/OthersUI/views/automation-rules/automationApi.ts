// ─── Shared Types ─────────────────────────────────────────────────────────────
export type OccurrencesConfig = {
  enabled: boolean;
  type: string;
  count: string;
  hours: string;
  minutes: string;
};

export const defaultOccConfig = (): OccurrencesConfig => ({
  enabled: false, type: "Count", count: "0", hours: "00", minutes: "00",
});

// ─── Route slug → backend type ─────────────────────────────────────────────
export const RULE_TYPE_MAP: Record<string, string> = {
  "late-entry-rules": "late_fine",
  "early-exit-rules": "early_out",
  "breaks-rules": "break",
  "overtime-rules": "overtime",
  "early-overtime-rules": "early_overtime",
};

// ─── Overtime calc type maps ────────────────────────────────────────────────
const CALC_TO_API: Record<string, string> = {
  "Post Payable Hours": "POST_PAYABLE_HOURS",
  "Post Payable Hours and Shift End": "POST_PAYABLE_HOURS_AND_SHIFT_END",
  "Post Payable Hours or Shift End": "POST_PAYABLE_HOURS_OR_SHIFT_END",
  "Shift End": "SHIFT_END",
};
const CALC_FROM_API: Record<string, string> = Object.fromEntries(
  Object.entries(CALC_TO_API).map(([k, v]) => [v, k])
);
export const calcTypeToApi = (l: string) => CALC_TO_API[l] || "SHIFT_END";
export const calcTypeFromApi = (v: string) => CALC_FROM_API[v] || "Shift End";

// ─── Primitives ─────────────────────────────────────────────────────────────
export const minutesToHM = (mins: number) => ({
  hours: String(Math.floor(mins / 60)).padStart(2, "0"),
  minutes: String(mins % 60).padStart(2, "0"),
});
export const hmToMinutes = (h: string, m: string) =>
  parseInt(h || "0") * 60 + parseInt(m || "0");

export const deductionLabelToApi = (label: string, fixedAmount: string) => {
  if (label === "Fixed Amount")
    return { calculationType: "FIXED_AMOUNT", calculationValue: parseFloat(fixedAmount) || 0 };
  const match = label.match(/^([\d.]+)x Salary$/);
  if (match)
    return { calculationType: "SALARY_MULTIPLIER", calculationValue: parseFloat(match[1]) };
  return { calculationType: "FIXED_AMOUNT", calculationValue: 0 };
};

export const deductionApiToLabel = (r: any) => {
  if (r.calculationType === "FIXED_AMOUNT")
    return { deductionType: "Fixed Amount", fixedAmount: String(r.calculationValue ?? 0) };
  if (r.calculationType === "SALARY_MULTIPLIER")
    return { deductionType: `${r.calculationValue}x Salary`, fixedAmount: "0" };
  return { deductionType: "Fixed Amount", fixedAmount: "0" };
};

export const occurrenceToApi = (cfg: OccurrencesConfig) => {
  if (!cfg.enabled) return { minOccuranceType: "COUNT", minOccuranceValue: 0 };
  if (cfg.type === "Count")
    return { minOccuranceType: "COUNT", minOccuranceValue: parseInt(cfg.count) || 0 };
  return { minOccuranceType: "CYCLE_MINUTE", minOccuranceValue: hmToMinutes(cfg.hours, cfg.minutes) };
};

export const occurrenceFromApi = (rule: any): OccurrencesConfig => {
  const val = rule?.minOccuranceValue ?? 0;
  if (val === 0) return defaultOccConfig();
  if (rule.minOccuranceType === "COUNT")
    return { enabled: true, type: "Count", count: String(val), hours: "00", minutes: "00" };
  return { enabled: true, type: "Hours", count: "0", ...minutesToHM(val) };
};

// ─── Deduct-type (late_fine, early_out, break) ──────────────────────────────
export const toApiRulesDeduct = (state: any) => {
  const rules: any = { includeGraceMinutes: state.includeLateFine };
  if (state.deductSalary && state.salaryRanges?.length) {
    rules.deductSalaryRule = {
      rules: state.salaryRanges.map((r: any) => ({
        minMinutes: hmToMinutes(r.hours, r.minutes),
        ...deductionLabelToApi(r.deductionType, r.fixedAmount),
      })),
      ...occurrenceToApi(state.salaryOccConfig ?? defaultOccConfig()),
    };
  }
  if (state.deductHalfDay) {
    rules.markHalfDayRule = {
      minMinutes: hmToMinutes(state.halfDayTime.hours, state.halfDayTime.minutes),
      ...occurrenceToApi(state.halfDayOccConfig ?? defaultOccConfig()),
    };
  }
  if (state.deductFullDay) {
    rules.markAbsentRule = {
      minMinutes: hmToMinutes(state.fullDayTime.hours, state.fullDayTime.minutes),
      ...occurrenceToApi(state.fullDayOccConfig ?? defaultOccConfig()),
    };
  }
  return rules;
};

export const fromApiRulesDeduct = (rules: any) => ({
  deductSalary: !!rules?.deductSalaryRule,
  salaryRanges: rules?.deductSalaryRule?.rules?.length
    ? rules.deductSalaryRule.rules.map((r: any, i: number) => ({
        id: String(i + 1), ...minutesToHM(r.minMinutes), ...deductionApiToLabel(r),
      }))
    : [{ id: "1", hours: "00", minutes: "00", deductionType: "Fixed Amount", fixedAmount: "0" }],
  salaryOccConfig: rules?.deductSalaryRule
    ? occurrenceFromApi(rules.deductSalaryRule) : defaultOccConfig(),
  deductHalfDay: !!rules?.markHalfDayRule,
  halfDayTime: rules?.markHalfDayRule
    ? minutesToHM(rules.markHalfDayRule.minMinutes) : { hours: "00", minutes: "00" },
  halfDayOccConfig: rules?.markHalfDayRule
    ? occurrenceFromApi(rules.markHalfDayRule) : defaultOccConfig(),
  deductFullDay: !!rules?.markAbsentRule,
  fullDayTime: rules?.markAbsentRule
    ? minutesToHM(rules.markAbsentRule.minMinutes) : { hours: "00", minutes: "00" },
  fullDayOccConfig: rules?.markAbsentRule
    ? occurrenceFromApi(rules.markAbsentRule) : defaultOccConfig(),
  includeLateFine: rules?.includeGraceMinutes ?? false,
});

// ─── Overtime-type (overtime, early_overtime) ───────────────────────────────
export const toApiRulesOvertime = (state: any, includeCalcType: boolean) => {
  const rules: any = { includeGraceMinutes: state.includeLateFine };
  if (includeCalcType && state.calculationType)
    rules.overtimeCalculationType = calcTypeToApi(state.calculationType);
  if (state.deductSalary && state.salaryRanges?.length) {
    rules.addSalaryRule = {
      rules: state.salaryRanges.map((r: any) => ({
        minMinutes: hmToMinutes(r.hours, r.minutes),
        ...deductionLabelToApi(r.deductionType, r.fixedAmount),
      })),
    };
  }
  if (state.deductHalfDay) {
    rules.addHalfDaySalaryRule = {
      minMinutes: hmToMinutes(state.halfDayTime.hours, state.halfDayTime.minutes),
      calculationType: "SALARY_MULTIPLIER", calculationValue: 1,
    };
  }
  if (state.deductFullDay) {
    rules.addFullDaySalaryRule = {
      minMinutes: hmToMinutes(state.fullDayTime.hours, state.fullDayTime.minutes),
      calculationType: "SALARY_MULTIPLIER", calculationValue: 1,
    };
  }
  return rules;
};

export const fromApiRulesOvertime = (rules: any) => ({
  deductSalary: !!rules?.addSalaryRule,
  salaryRanges: rules?.addSalaryRule?.rules?.length
    ? rules.addSalaryRule.rules.map((r: any, i: number) => ({
        id: String(i + 1), ...minutesToHM(r.minMinutes), ...deductionApiToLabel(r),
      }))
    : [{ id: "1", hours: "00", minutes: "00", deductionType: "Fixed Amount", fixedAmount: "0" }],
  deductHalfDay: !!rules?.addHalfDaySalaryRule,
  halfDayTime: rules?.addHalfDaySalaryRule
    ? minutesToHM(rules.addHalfDaySalaryRule.minMinutes) : { hours: "00", minutes: "00" },
  deductFullDay: !!rules?.addFullDaySalaryRule,
  fullDayTime: rules?.addFullDaySalaryRule
    ? minutesToHM(rules.addFullDaySalaryRule.minMinutes) : { hours: "00", minutes: "00" },
  includeLateFine: rules?.includeGraceMinutes ?? false,
  calculationType: rules?.overtimeCalculationType
    ? calcTypeFromApi(rules.overtimeCalculationType) : "Shift End",
});
