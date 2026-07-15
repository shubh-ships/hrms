// components/policy/BreaksPolicy.tsx
"use client";

import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { 
  createOrUpdatePolicy, 
  togglePolicyStatus,
  selectPolicyByName,
  selectPolicyLoading 
} from "@/features/policySlice/policeSlice";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, Save, Power, Coffee } from "lucide-react";
import { toast } from "sonner";
import type { PenliteRule, DeductionRule, CreatePolicyData } from "@/features/policySlice/policeSlice";

const BreaksPolicyComponent = () => {
  const dispatch = useAppDispatch();
  const policy = useAppSelector(selectPolicyByName("breaks"));
  const loading = useAppSelector(selectPolicyLoading);

  const [formData, setFormData] = useState<{
    description: string;
    penliteRules: PenliteRule[];
  }>({
    description: "",
    penliteRules: []
  });

  useEffect(() => {
    if (policy) {
      setFormData({
        description: policy.description || "",
        penliteRules: policy.penliteRules || []
      });
    }
  }, [policy]);

  const addRule = () => {
    const newRule: PenliteRule = {
      ruleName: "",
      ruleType: "salary_deduction",
      deductions: [],
      occurrence: {
        isActive: false,
        count: undefined,
        hours: undefined
      },
      isActive: true
    };
    setFormData(prev => ({
      ...prev,
      penliteRules: [...prev.penliteRules, newRule]
    }));
  };

  const updateRule = (index: number, updates: Partial<PenliteRule>) => {
    setFormData(prev => ({
      ...prev,
      penliteRules: prev.penliteRules.map((rule, i) => 
        i === index ? { ...rule, ...updates } : rule
      )
    }));
  };

  const removeRule = (index: number) => {
    setFormData(prev => ({
      ...prev,
      penliteRules: prev.penliteRules.filter((_, i) => i !== index)
    }));
  };

  const addDeduction = (ruleIndex: number) => {
    const newDeduction: DeductionRule = {
      lateHours: 0,
      lateMinutes: 15,
      deductionType: "fixed",
      amount: 0
    };
    
    setFormData(prev => ({
      ...prev,
      penliteRules: prev.penliteRules.map((rule, i) => 
        i === ruleIndex 
          ? { ...rule, deductions: [...(rule.deductions || []), newDeduction] }
          : rule
      )
    }));
  };

  const updateDeduction = (ruleIndex: number, deductionIndex: number, updates: Partial<DeductionRule>) => {
    setFormData(prev => ({
      ...prev,
      penliteRules: prev.penliteRules.map((rule, i) => 
        i === ruleIndex 
          ? { 
              ...rule, 
              deductions: rule.deductions?.map((deduction, j) => 
                j === deductionIndex ? { ...deduction, ...updates } : deduction
              ) || []
            }
          : rule
      )
    }));
  };

  const removeDeduction = (ruleIndex: number, deductionIndex: number) => {
    setFormData(prev => ({
      ...prev,
      penliteRules: prev.penliteRules.map((rule, i) => 
        i === ruleIndex 
          ? { ...rule, deductions: rule.deductions?.filter((_, j) => j !== deductionIndex) || [] }
          : rule
      )
    }));
  };

  const handleSave = async () => {
    try {
      // Clean up the data before sending - remove any temporary IDs and extra fields
      const cleanPenliteRules = formData.penliteRules.map(rule => {
        const cleanRule: any = {
          ruleName: rule.ruleName,
          ruleType: rule.ruleType,
          isActive: rule.isActive,
          occurrence: rule.occurrence
        };

        // Only include deductions for salary_deduction type
        if (rule.ruleType === "salary_deduction") {
          cleanRule.deductions = rule.deductions?.map(deduction => ({
            lateHours: deduction.lateHours,
            lateMinutes: deduction.lateMinutes,
            deductionType: deduction.deductionType,
            amount: deduction.amount
          })) || [];
        } else {
          // For half_day_deduct and full_day_deduct, include threshold fields
          cleanRule.lateHoursThreshold = rule.lateHoursThreshold || 0;
          cleanRule.lateMinutesThreshold = rule.lateMinutesThreshold || 0;
        }

        return cleanRule;
      });

      const policyData: CreatePolicyData = {
        name: "breaks",
        description: formData.description,
        penliteRules: cleanPenliteRules
      };

      await dispatch(createOrUpdatePolicy(policyData)).unwrap();
      toast.success("Breaks policy saved successfully!");
    } catch (error: any) {
      toast.error("Failed to save policy: " + (error.message || error));
    }
  };

  const handleToggleStatus = async () => {
    if (!policy) {
      toast.error("Please save the policy first before activating it");
      return;
    }
    
    try {
      await dispatch(togglePolicyStatus({ 
        policyId: policy._id, 
        isActive: !policy.isActive 
      })).unwrap();
      toast.success(`Policy ${policy.isActive ? 'deactivated' : 'activated'} successfully!`);
    } catch (error: any) {
      toast.error("Failed to toggle policy status");
    }
  };

  return (
    <div className="space-y-6">
      {/* Policy Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Coffee className="h-5 w-5" />
                Breaks Policy
              </CardTitle>
              <CardDescription>
                Configure deduction rules for break time violations
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {policy && (
                <Badge variant={policy.isActive ? "default" : "secondary"}>
                  {policy.isActive ? "Active" : "Inactive"}
                </Badge>
              )}
              {policy && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleToggleStatus}
                  disabled={loading}
                >
                  <Power className="h-4 w-4 mr-2" />
                  {policy.isActive ? "Deactivate" : "Activate"}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter policy description..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rules Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Break Time Rules</CardTitle>
            <Button onClick={addRule} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Rule
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {formData.penliteRules.map((rule, ruleIndex) => (
              <Card key={ruleIndex} className="border-l-4 border-l-amber-500">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Input
                        placeholder="Rule name (e.g., Extended Break)"
                        value={rule.ruleName}
                        onChange={(e) => updateRule(ruleIndex, { ruleName: e.target.value })}
                        className="font-medium"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={rule.isActive}
                        onCheckedChange={(checked) => updateRule(ruleIndex, { isActive: checked })}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeRule(ruleIndex)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Rule Type and Threshold */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Rule Type</Label>
                      <Select
                        value={rule.ruleType}
                        onValueChange={(value: any) => updateRule(ruleIndex, { ruleType: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="salary_deduction">Salary Deduction</SelectItem>
                          <SelectItem value="half_day_deduct">Half Day Deduction</SelectItem>
                          <SelectItem value="full_day_deduct">Full Day Deduction</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Threshold fields only for non-salary deduction types */}
                    {rule.ruleType !== "salary_deduction" && (
                      <>
                        <div className="space-y-2">
                          <Label>Extra Hours Threshold</Label>
                          <Input
                            type="number"
                            min="0"
                            value={rule.lateHoursThreshold || 0}
                            onChange={(e) => updateRule(ruleIndex, { lateHoursThreshold: parseInt(e.target.value) || 0 })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Extra Minutes Threshold</Label>
                          <Input
                            type="number"
                            min="0"
                            value={rule.lateMinutesThreshold || 0}
                            onChange={(e) => updateRule(ruleIndex, { lateMinutesThreshold: parseInt(e.target.value) || 0 })}
                          />
                        </div>
                      </>
                    )}
                  </div>

                  {/* Occurrence Settings */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={rule.occurrence.isActive}
                        onCheckedChange={(checked) => updateRule(ruleIndex, { 
                          occurrence: { ...rule.occurrence, isActive: checked }
                        })}
                      />
                      <Label>Apply based on occurrence</Label>
                    </div>
                    
                    {rule.occurrence.isActive && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Occurrence Count</Label>
                          <Input
                            type="number"
                            min="0"
                            placeholder="Number of violations"
                            value={rule.occurrence.count || ""}
                            onChange={(e) => updateRule(ruleIndex, { 
                              occurrence: { 
                                ...rule.occurrence, 
                                count: e.target.value ? parseInt(e.target.value) : undefined,
                                hours: undefined 
                              }
                            })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Or Total Extra Hours</Label>
                          <Input
                            type="number"
                            min="0"
                            placeholder="Total extra break hours"
                            value={rule.occurrence.hours || ""}
                            onChange={(e) => updateRule(ruleIndex, { 
                              occurrence: { 
                                ...rule.occurrence, 
                                hours: e.target.value ? parseInt(e.target.value) : undefined,
                                count: undefined 
                              }
                            })}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Deductions (only for salary_deduction type) */}
                  {rule.ruleType === "salary_deduction" && (
                    <div className="space-y-4">
                      <Separator />
                      <div className="flex items-center justify-between">
                        <Label className="text-base font-medium">Deduction Rules</Label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addDeduction(ruleIndex)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Deduction
                        </Button>
                      </div>
                      
                      {rule.deductions?.map((deduction, deductionIndex) => (
                        <Card key={deductionIndex} className="bg-muted/50">
                          <CardContent className="pt-4">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                              <div className="space-y-2">
                                <Label>Extra Hours</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  value={deduction.lateHours}
                                  onChange={(e) => updateDeduction(ruleIndex, deductionIndex, { 
                                    lateHours: parseInt(e.target.value) || 0 
                                  })}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Extra Minutes</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  value={deduction.lateMinutes}
                                  onChange={(e) => updateDeduction(ruleIndex, deductionIndex, { 
                                    lateMinutes: parseInt(e.target.value) || 0 
                                  })}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Deduction Type</Label>
                                <Select
                                  value={deduction.deductionType}
                                  onValueChange={(value: any) => updateDeduction(ruleIndex, deductionIndex, { deductionType: value })}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                                    <SelectItem value="multiplier">Salary Multiplier</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label>
                                  {deduction.deductionType === "fixed" ? "Amount (₹)" : "Multiplier"}
                                </Label>
                                <div className="flex gap-2">
                                  <Input
                                    type="number"
                                    min="0"
                                    step={deduction.deductionType === "multiplier" ? "0.01" : "1"}
                                    value={deduction.amount}
                                    onChange={(e) => updateDeduction(ruleIndex, deductionIndex, { 
                                      amount: parseFloat(e.target.value) || 0 
                                    })}
                                  />
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => removeDeduction(ruleIndex, deductionIndex)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            
            {formData.penliteRules.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Coffee className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No break time rules configured</p>
                <p className="text-sm">Click "Add Rule" to create your first rule</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Save and Toggle Buttons */}
      <div className="flex justify-between items-center">
        <div>
          {policy && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Status: {policy.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          {policy && (
            <Button
              variant="outline"
              onClick={handleToggleStatus}
              disabled={loading}
            >
              <Power className="h-4 w-4 mr-2" />
              {policy.isActive ? "Deactivate Policy" : "Activate Policy"}
            </Button>
          )}
          <Button onClick={handleSave} disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? "Saving..." : "Save Policy"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BreaksPolicyComponent;