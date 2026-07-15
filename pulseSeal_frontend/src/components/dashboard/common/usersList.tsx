"use client";
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Search, TrendingUp, TrendingDown, Filter } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  fetchLeaderboard,
  setUsersListFromLeaderboard,
} from '@/features/efficiencyReport/pulseEfficiencySlice';
import { fetchUsers } from '@/features/user/userSlice';
import { fetchDepartments } from '@/features/departments/departmentSlice';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface User {
  _id: string;
  user_id: {
    _id: string;
    name: string;
    email: string;
    phoneNumber: number;
    isActive: boolean;
    id: string;
  };
  roleDefinitionId: {
    _id: string;
    roleName: string;
    hierarchyLevel: number;
  };
  departments: Array<{
    _id: string;
    name: string;
    alias: string;
  }>;
  status: string;
  efficiency?: number;
  attendanceAverage?: number;
  greenCount?: number;
  yellowCount?: number;
  redCount?: number;
  totalTasks?: number;
}

interface UsersListProps {
  onUserSelect: (userId: string, userName: string) => void;
  role: 'ADMIN' | 'MANAGER' | 'MEMBER';
}

export default function UsersList({ onUserSelect, role }: UsersListProps) {
  const dispatch = useAppDispatch();
  const { leaderboard, usersList, loading: pulseLoading } = useAppSelector(
    state => state.pulseEfficiency
  );
  const { users, loading: usersLoading } = useAppSelector(state => state.users);
  const { departments, loading: departmentsLoading } = useAppSelector(state => state.departments);

  const [searchTerm, setSearchTerm] = useState('');
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');

  useEffect(() => {
    dispatch(fetchUsers());
    dispatch(fetchDepartments({}));
  }, [dispatch]);

  useEffect(() => {
    if (users.length > 0) {
      const efficiencyMap = new Map();
      if (Array.isArray(leaderboard)) {
        leaderboard.forEach((user: any) => {
          efficiencyMap.set(user.userId, user);
        });
      }

      let combinedUsers = users.map((user: User) => {
        const userId = user.user_id._id;
        const efficiencyData = efficiencyMap.get(userId);
        
        return {
          ...user,
          efficiency: efficiencyData?.efficiency || 0,
          attendanceAverage: efficiencyData?.attendanceAverage || 0,
          greenCount: efficiencyData?.greenCount || 0,
          yellowCount: efficiencyData?.yellowCount || 0,
          redCount: efficiencyData?.redCount || 0,
          totalTasks: efficiencyData?.totalTasks || 0,
        };
      });

      if (selectedDepartment && selectedDepartment !== 'all') {
        combinedUsers = combinedUsers.filter(user =>
          user.departments.some(dept => dept._id === selectedDepartment)
        );
      }

      if (searchTerm) {
        combinedUsers = combinedUsers.filter(user =>
          user.user_id.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.user_id.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.roleDefinitionId.roleName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.departments.some(dept => 
            dept.name.toLowerCase().includes(searchTerm.toLowerCase())
          )
        );
      }

      setFilteredUsers(combinedUsers);
    }
  }, [users, leaderboard, searchTerm, selectedDepartment]);

  useEffect(() => {
    if (users.length > 0) {
    }
  }, [users, dispatch]);

  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 100) return 'text-green-600 bg-green-50';
    if (efficiency >= 50) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getEfficiencyIcon = (efficiency: number) => {
    return efficiency >= 50 ? (
      <TrendingUp className="h-4 w-4" />
    ) : (
      <TrendingDown className="h-4 w-4" />
    );
  };

  const getDepartmentsText = (departments: Array<{name: string}>) => {
    return departments.map(dept => dept.name).join(', ');
  };

  const getSelectedDepartmentName = () => {
    if (selectedDepartment === 'all') return 'All Departments';
    const dept = departments.find((d: any) => d._id === selectedDepartment);
    return dept?.name || 'Unknown Department';
  };

  if (role === 'MEMBER') {
    return null; 
  }

  const loading = usersLoading || pulseLoading || departmentsLoading;

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="w-full md:w-[250px]">
          <Label htmlFor="department-filter" className="text-sm font-medium">
            Filter by Department
          </Label>
          <Select
            value={selectedDepartment}
            onValueChange={setSelectedDepartment}
            disabled={departmentsLoading || departments.length === 0}
          >
            <SelectTrigger id="department-filter" className="mt-1">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Select Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map((dept: any) => (
                <SelectItem key={dept._id} value={dept._id}>
                  {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>
              {role === 'ADMIN' ? 'All Users' : 'Users'} 
              {selectedDepartment !== 'all' && (
                <span className="text-sm font-normal text-blue-600 ml-2">
                  in {getSelectedDepartmentName()}
                </span>
              )}
              {filteredUsers.length > 0 && (
                <span className="text-sm font-normal text-gray-500 ml-2">
                  ({filteredUsers.length} users)
                </span>
              )}
            </span>
          </CardTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search by name, email, or role..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredUsers.map(user => (
                <div
                  key={user._id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                  onClick={() => onUserSelect(user.user_id._id, user.user_id.name)}
                >
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {user.user_id.name
                          ?.split(' ')
                          .map(n => n[0])
                          .join('')
                          .toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {user.user_id.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {user.user_id.email} • {user.roleDefinitionId.roleName}
                      </p>
                      <p className="text-xs text-gray-400">
                        {getDepartmentsText(user.departments)} • {user.totalTasks || 0} tasks • {(user.attendanceAverage || 0).toFixed(1)}% attendance
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Status</p>
                      <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                        {user.status}
                      </Badge>
                    </div>
                    {(user.efficiency || 0) > 0 && (
                      <Badge
                        className={`${getEfficiencyColor(
                          user.efficiency || 0
                        )} border-0`}
                      >
                        <span className="flex items-center space-x-1">
                          {getEfficiencyIcon(user.efficiency || 0)}
                          <span>{(user.efficiency || 0).toFixed(1)}</span>
                        </span>
                      </Badge>
                    )}
                    <Button variant="outline" size="sm">
                      View Report
                    </Button>
                  </div>
                </div>
              ))}
              {filteredUsers.length === 0 && !loading && (
                <div className="text-center py-8 text-gray-500">
                  <div className="h-12 w-12 mx-auto mb-2 opacity-50 flex items-center justify-center">
                    <span className="text-2xl">👤</span>
                  </div>
                  <p>
                    {searchTerm || selectedDepartment !== 'all'
                      ? 'No users found matching your filters' 
                      : 'No users found'
                    }
                  </p>
                  {selectedDepartment !== 'all' && (
                    <Button 
                      variant="link" 
                      onClick={() => setSelectedDepartment('all')}
                      className="mt-2"
                    >
                      Show all departments
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
