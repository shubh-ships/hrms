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
import { Plus, Trash2, Save, Power, Sun, DollarSign } from "lucide-react";
import { toast } from "sonner";
import type { OvertimeRule, OvertimePayRule, CreatePolicyData } from "@/features/policySlice/policeSlice";

const EarlyOvertimePolicyComponent = () => {
  const dispatch = useAppDispatch();
  const policy = useAppSelector(selectPolicyByName("early_overtime"));
  const loading = useAppSelector(selectPolicyLoading);

  const [formData, setFormData] = useState<{
    description: string;
    overtimeRules: OvertimeRule[];
    includeEarlyOTFromStartTime: boolean;
  }>({
    description: "",
    overtimeRules: [],
    includeEarlyOTFromStartTime: false
  });

  useEffect(() => {
    if (policy) {
      setFormData({
        description: policy.description || "",
        overtimeRules: policy.overtimeRules || [],
        includeEarlyOTFromStartTime: policy.includeEarlyOTFromStartTime || false
      });
    }
  }, [policy]);

  const addRule = () => {
    const newRule: OvertimeRule = {
      _id: `new_${Math.random().toString(36).substr(2, 9)}`,
      ruleName: "",
      ruleType: "salary_pay",
      hoursThreshold: 0,
      minutesThreshold: 30,
      overtimePay: [],
      isActive: true
    };
    setFormData(prev => ({
      ...prev,
      overtimeRules: [...prev.overtimeRules, newRule]
    }));
  };

  const updateRule = (index: number, updates: Partial<OvertimeRule>) => {
    setFormData(prev => ({
      ...prev,
      overtimeRules: prev.overtimeRules.map((rule, i) => 
        i === index ? { ...rule, ...updates } : rule
      )
    }));
  };

  const removeRule = (index: number) => {
    setFormData(prev => ({
      ...prev,
      overtimeRules: prev.overtimeRules.filter((_, i) => i !== index)
    }));
  };

  const addOvertimePay = (ruleIndex: number) => {
    const newOvertimePay: OvertimePayRule = {
      _id: `new_pay_${Math.random().toString(36).substr(2, 9)}`,
      hours: 0,
      minutes: 30,
      overtimeType: "fixed",
      amount: 0
    };
    
    setFormData(prev => ({
      ...prev,
      overtimeRules: prev.overtimeRules.map((rule, i) => 
        i === ruleIndex 
          ? { ...rule, overtimePay: [...(rule.overtimePay || []), newOvertimePay] }
          : rule
      )
    }));
  };

  const updateOvertimePay = (ruleIndex: number, payIndex: number, updates: Partial<OvertimePayRule>) => {
    setFormData(prev => ({
      ...prev,
      overtimeRules: prev.overtimeRules.map((rule, i) => 
        i === ruleIndex 
          ? { 
              ...rule, 
              overtimePay: rule.overtimePay?.map((pay, j) => 
                j === payIndex ? { ...pay, ...updates } : pay
              ) || []
            }
          : rule
      )
    }));
  };

  const removeOvertimePay = (ruleIndex: number, payIndex: number) => {
    setFormData(prev => ({
      ...prev,
      overtimeRules: prev.overtimeRules.map((rule, i) => 
        i === ruleIndex 
          ? { ...rule, overtimePay: rule.overtimePay?.filter((_, j) => j !== payIndex) || [] }
          : rule
      )
    }));
  };

  const handleSave = async () => {
  try {
    const policyData: CreatePolicyData = {
      name: "early_overtime",
      description: formData.description,
      includeEarlyOTFromStartTime: formData.includeEarlyOTFromStartTime,
      overtimeRules: formData.overtimeRules.map(rule => {
        const baseRule = {
          ruleName: rule.ruleName,
          ruleType: rule.ruleType,
          isActive: rule.isActive
        };

        // Include threshold fields for all rule types in early overtime
        if (rule.ruleType === "salary_pay") {
          return {
            ...baseRule,
            hoursThreshold: rule.hoursThreshold,
            minutesThreshold: rule.minutesThreshold,
            overtimePay: rule.overtimePay?.map(pay => ({
              hours: pay.hours,
              minutes: pay.minutes,
              overtimeType: pay.overtimeType,
              amount: pay.amount
            })) || []
          };
        }

        // For half_day_pay and full_day_pay, include threshold fields
        return {
          ...baseRule,
          hoursThreshold: rule.hoursThreshold,
          minutesThreshold: rule.minutesThreshold
        };
      })
    };

    await dispatch(createOrUpdatePolicy(policyData)).unwrap();
    toast.success("Early overtime policy saved successfully!");
  } catch (error: any) {
    toast.error("Failed to save policy: " + (error.message || error));
  }
};


  const handleToggleStatus = async () => {
    if (!policy) return;
    
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
                <Sun className="h-5 w-5" />
                Early Overtime Policy
              </CardTitle>
              <CardDescription>
                Configure payment rules for early arrival overtime
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
            
            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.includeEarlyOTFromStartTime}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, includeEarlyOTFromStartTime: checked }))}
              />
              <Label>Include early overtime from shift start time</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rules Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Early Overtime Payment Rules</CardTitle>
            <Button onClick={addRule} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Rule
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {formData.overtimeRules.map((rule, ruleIndex) => (
              <Card key={rule._id} className="border-l-4 border-l-yellow-500">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <Input
                        placeholder="Rule name (e.g., Early Overtime Compensation)"
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
                  {/* Rule Type */}
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
                        <SelectItem value="salary_pay">Salary Pay (Custom Rates)</SelectItem>
                        <SelectItem value="half_day_pay">Half Day Pay</SelectItem>
                        <SelectItem value="full_day_pay">Full Day Pay</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Threshold fields for all rule types */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Hours Threshold</Label>
                      <Input
                        type="number"
                        min="0"
                        value={rule.hoursThreshold || 0}
                        onChange={(e) => updateRule(ruleIndex, { hoursThreshold: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Minutes Threshold</Label>
                      <Input
                        type="number"
                        min="0"
                        value={rule.minutesThreshold || 0}
                        onChange={(e) => updateRule(ruleIndex, { minutesThreshold: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>

                  {/* Overtime Pay (only for salary_pay type) */}
                  {rule.ruleType === "salary_pay" && (
                    <div className="space-y-4">
                      <Separator />
                      <div className="flex items-center justify-between">
                        <Label className="text-base font-medium">Early Overtime Pay Rules</Label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addOvertimePay(ruleIndex)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Pay Rule
                        </Button>
                      </div>
                      
                      {rule.overtimePay?.map((pay, payIndex) => (
                        <Card key={pay._id} className="bg-muted/50">
                          <CardContent className="pt-4">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                              <div className="space-y-2">
                                <Label>Hours</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  value={pay.hours}
                                  onChange={(e) => updateOvertimePay(ruleIndex, payIndex, { 
                                    hours: parseInt(e.target.value) || 0 
                                  })}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Minutes</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  value={pay.minutes}
                                  onChange={(e) => updateOvertimePay(ruleIndex, payIndex, { 
                                    minutes: parseInt(e.target.value) || 0 
                                  })}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Payment Type</Label>
                                <Select
                                  value={pay.overtimeType}
                                  onValueChange={(value: any) => updateOvertimePay(ruleIndex, payIndex, { overtimeType: value })}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                                    <SelectItem value="multiplier">Salary Multiplier</SelectItem>
                                    <SelectItem value="fixed_per_hour">Fixed Per Hour</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label>
                                  {pay.overtimeType === "fixed" 
                                    ? "Amount (₹)" 
                                    : pay.overtimeType === "multiplier" 
                                    ? "Multiplier" 
                                    : "Amount per Hour (₹)"
                                  }
                                </Label>
                                <div className="flex gap-2">
                                  <Input
                                    type="number"
                                    min="0"
                                    step={pay.overtimeType === "multiplier" ? "0.01" : "1"}
                                    value={pay.amount}
                                    onChange={(e) => updateOvertimePay(ruleIndex, payIndex, { 
                                      amount: parseFloat(e.target.value) || 0 
                                    })}
                                  />
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => removeOvertimePay(ruleIndex, payIndex)}
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
            
            {formData.overtimeRules.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Sun className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No early overtime rules configured</p>
                <p className="text-sm">Click "Add Rule" to create your first rule</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={loading}>
          <Save className="h-4 w-4 mr-2" />
          {loading ? "Saving..." : "Save Policy"}
        </Button>
      </div>
    </div>
  );
};

export default EarlyOvertimePolicyComponent;
