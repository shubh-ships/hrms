
"use client"
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store';
import {
  createLoanPreset,
  getLoanPresets,
  updateLoanPreset,
  deleteLoanPreset,
  clearError,
  clearSuccess,
  setCurrentPreset
} from '@/features/loanInterestPreset/loanPresetSlice';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Settings, 
  Percent,
  Calculator,
  Search,
  Filter,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';

interface CreatePresetFormData {
  name: string;
  interestRate: string;
  interestType: 'simple' | 'compound';
}

const AdminLoanPresetDashboard: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { presets, loading, error, success } = useSelector((state: RootState) => state.loanPreset);
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [formData, setFormData] = useState<CreatePresetFormData>({
    name: '',
    interestRate: '',
    interestType: 'simple',
  });

  useEffect(() => {
    dispatch(getLoanPresets());
  }, [dispatch]);

  useEffect(() => {
    if (success) {
      toast.success('Operation completed successfully!');
      setIsCreateModalOpen(false);
      setIsEditModalOpen(false);
      setIsDeleteModalOpen(false);
      resetForm();
      dispatch(clearSuccess());
    }
  }, [success, dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const resetForm = () => {
    setFormData({
      name: '',
      interestRate: '',
      interestType: 'simple',
    });
    setSelectedPreset(null);
  };

  const handleInputChange = (field: keyof CreatePresetFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCreatePreset = async () => {
    if (!formData.name.trim() || !formData.interestRate) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const presetData = {
        name: formData.name.trim(),
        interestRate: parseFloat(formData.interestRate),
        interestType: formData.interestType,
      };
      
      await dispatch(createLoanPreset(presetData)).unwrap();
    } catch (error) {
      console.error('Failed to create preset:', error);
    }
  };

  const handleEditPreset = async () => {
    if (!selectedPreset || !formData.name.trim() || !formData.interestRate) {
      toast.error('Please fill in all required fields');
      return;
    }

    // nothing
    try {
      const updateData = {
        name: formData.name.trim(),
        interestRate: parseFloat(formData.interestRate),
        interestType: formData.interestType,
      };
      
      await dispatch(updateLoanPreset({ id: selectedPreset._id, updateData })).unwrap();
    } catch (error) {
      console.error('Failed to update preset:', error);
    }
  };

  const handleDeletePreset = async () => {
    if (!selectedPreset) return;
    
    try {
      await dispatch(deleteLoanPreset(selectedPreset._id)).unwrap();
    } catch (error) {
      console.error('Failed to delete preset:', error);
    }
  };

  const openEditModal = (preset: any) => {
    setSelectedPreset(preset);
    setFormData({
      name: preset.name,
      interestRate: preset.interestRate.toString(),
      interestType: preset.interestType,
    });
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (preset: any) => {
    setSelectedPreset(preset);
    setIsDeleteModalOpen(true);
  };

  const getInterestTypeBadge = (type: string) => {
    return (
      <Badge variant={type === 'compound' ? 'default' : 'secondary'}>
        {type === 'compound' ? 'Compound' : 'Simple'}
      </Badge>
    );
  };

  const getStatusBadge = (isActive: boolean) => {
    return (
      <Badge variant={isActive ? 'default' : 'outline'}>
        {isActive ? 'Active' : 'Inactive'}
      </Badge>
    );
  };

  // Filter presets based on search and type
  const filteredPresets = presets.filter(preset => {
    const matchesSearch = preset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         preset.createdBy.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || preset.interestType === typeFilter;
    return matchesSearch && matchesType;
  });

  // Get stats
  const stats = {
    total: presets.length,
    active: presets.filter(p => p.isActive).length,
    simple: presets.filter(p => p.interestType === 'simple').length,
    compound: presets.filter(p => p.interestType === 'compound').length,
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Loan Preset Management</h1>
          <p className="text-muted-foreground">Create and manage interest rate presets for loans</p>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="w-4 h-4 mr-2" />
              Create New Preset
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Loan Preset</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="presetName">Preset Name *</Label>
                <Input
                  id="presetName"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="e.g., Personal Loan Standard"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="interestRate">Interest Rate (%) *</Label>
                <Input
                  id="interestRate"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.interestRate}
                  onChange={(e) => handleInputChange('interestRate', e.target.value)}
                  placeholder="Enter interest rate"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="interestType">Interest Type *</Label>
                <Select value={formData.interestType} onValueChange={(value) => handleInputChange('interestType', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="simple">Simple Interest</SelectItem>
                    <SelectItem value="compound">Compound Interest</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-4">
              <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreatePreset} disabled={loading}>
                {loading ? 'Creating...' : 'Create Preset'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Settings className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Presets</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calculator className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Active Presets</p>
                <p className="text-2xl font-bold">{stats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Percent className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Simple Interest</p>
                <p className="text-2xl font-bold">{stats.simple}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calculator className="w-8 h-8 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">Compound Interest</p>
                <p className="text-2xl font-bold">{stats.compound}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search presets, creators..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="simple">Simple Interest</SelectItem>
            <SelectItem value="compound">Compound Interest</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Presets Grid */}
      {loading && !presets.length ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading presets...</p>
          </div>
        </div>
      ) : filteredPresets.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-24 h-24 mx-auto mb-4 text-muted-foreground">
            <Settings className="w-full h-full" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No presets found</h3>
          <p className="text-muted-foreground mb-4">
            {presets.length === 0 
              ? "Create your first loan preset to get started." 
              : "No presets match your current filters."
            }
          </p>
          {presets.length === 0 && (
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create First Preset
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPresets.map((preset) => (
            <Card key={preset._id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{preset.name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Created by {preset.createdBy.name}
                    </p>
                  </div>
                  <div className="flex flex-col items-end space-y-1">
                    {getStatusBadge(preset.isActive)}
                    {getInterestTypeBadge(preset.interestType)}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-center space-x-2">
                    {/* <Percent className="w-6 h-6 text-primary" /> */}
                    <span className="text-3xl font-bold text-primary">
                      {preset.interestRate}%
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {preset.interestType === 'compound' ? 'Compound' : 'Simple'} Interest Rate
                  </p>
                </div>

                <div className="text-sm text-muted-foreground">
                  <p>Created: {new Date(preset.createdAt).toLocaleDateString()}</p>
                  {preset.updatedAt !== preset.createdAt && (
                    <p>Updated: {new Date(preset.updatedAt).toLocaleDateString()}</p>
                  )}
                </div>

                <div className="flex space-x-2">
                  {/* <Button
                    variant="outline"
                    size="sm"
                    onClick={() => dispatch(setCurrentPreset(preset))}
                    className="flex-1"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Button> */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditModal(preset)}
                    className="flex-1"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => openDeleteModal(preset)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Loan Preset</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editPresetName">Preset Name *</Label>
              <Input
                id="editPresetName"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="e.g., Personal Loan Standard"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editInterestRate">Interest Rate (%) *</Label>
              <Input
                id="editInterestRate"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.interestRate}
                onChange={(e) => handleInputChange('interestRate', e.target.value)}
                placeholder="Enter interest rate"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editInterestType">Interest Type *</Label>
              <Select value={formData.interestType} onValueChange={(value) => handleInputChange('interestType', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="simple">Simple Interest</SelectItem>
                  <SelectItem value="compound">Compound Interest</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditPreset} disabled={loading}>
              {loading ? 'Updating...' : 'Update Preset'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              <span>Delete Loan Preset</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Are you sure you want to delete the preset "{selectedPreset?.name}"?
            </p>
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive font-medium">Warning:</p>
              <p className="text-sm text-destructive">
                This action cannot be undone. Any loans using this preset will need to be updated manually.
              </p>
            </div>
          </div>
          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeletePreset} 
              disabled={loading}
            >
              {loading ? 'Deleting...' : 'Delete Preset'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminLoanPresetDashboard;
