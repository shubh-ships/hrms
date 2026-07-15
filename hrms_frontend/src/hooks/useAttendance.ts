import { useDispatch, useSelector } from 'react-redux';
import { useCallback } from 'react';
import { 
  createAttendance, 
  updateAttendance, 
  markLogout, 
  getAllAttendance, 
  getMonthlyAttendance, 
  getMonthlyUserAttendance,
  getAttendanceAverage,
  clearError,
  clearSuccess,
  resetAttendance
} from '../features/attendance/attendanceSlice';
import { AppDispatch, RootState } from '../store';

export const useAttendance = () => {
  const dispatch = useDispatch<AppDispatch>();
  
  const attendance = useSelector((state: RootState) => state.attendance.attendance);
  const allAttendance = useSelector((state: RootState) => state.attendance.allAttendance);
  const monthlyAttendance = useSelector((state: RootState) => state.attendance.monthlyAttendance);
  const stats = useSelector((state: RootState) => state.attendance.stats);
  const loading = useSelector((state: RootState) => state.attendance.loading);
  const error = useSelector((state: RootState) => state.attendance.error);
  const success = useSelector((state: RootState) => state.attendance.success);
  
  const markAttendance = useCallback((data: any) => {
    return dispatch(createAttendance(data));
  }, [dispatch]);
  
  const updateAttendanceRecord = useCallback((attendanceId: string, data: any) => {
    return dispatch(updateAttendance({ attendanceId, data }));
  }, [dispatch]);
  
  const markLogoutAction = useCallback(() => {
    return dispatch(markLogout());
  }, [dispatch]);
  
  const fetchAllAttendance = useCallback(() => {
    return dispatch(getAllAttendance());
  }, [dispatch]);

  const fetchMonthlyUserAttendance = useCallback(() => {
    return dispatch(getMonthlyUserAttendance());
  }, [dispatch]);
  
  const fetchMonthlyAttendance = useCallback((userId: string) => {
    return dispatch(getMonthlyAttendance(userId));
  }, [dispatch]);
  
  const fetchAttendanceAverage = useCallback(async (userId: string, monthId: string) => {
    const response = await dispatch(getAttendanceAverage({ userId, monthId }));
    if (getAttendanceAverage.fulfilled.match(response)) {
      return response.payload;
    }
    throw new Error('Failed to fetch attendance average');
  }, [dispatch]);
  
  const clearAttendanceError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);
  
  const clearAttendanceSuccess = useCallback(() => {
    dispatch(clearSuccess());
  }, [dispatch]);
  
  const resetAttendanceState = useCallback(() => {
    dispatch(resetAttendance());
  }, [dispatch]);
  
  return {
    attendance,
    allAttendance,
    monthlyAttendance: monthlyAttendance,
    stats,
    loading,
    error,
    success,
    
    markAttendance,
    updateAttendanceRecord,
    markLogoutAction,
    fetchAllAttendance,
    fetchMonthlyUserAttendance,
    fetchMonthlyAttendance,
    fetchAttendanceAverage,
    clearAttendanceError,
    clearAttendanceSuccess,
    resetAttendanceState,
  };
};