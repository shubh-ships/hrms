
import Approve from '../models/approve.Model.js';
import * as attendanceServices from '../services/attendance.service.js';
import * as workingDaysRepository from './workingDays.repository.js';
import mongoose from 'mongoose';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek.js';
import advancedFormat from 'dayjs/plugin/advancedFormat.js';
dayjs.extend(isoWeek);
dayjs.extend(advancedFormat);

 

export const getPulseEfficiencyMonthly = async (userId,currentMonthYear) => {
  const ObjectId = mongoose.Types.ObjectId;
  const previousMonth = dayjs(`${currentMonthYear}`);
  const startDate = previousMonth.startOf('month').toDate(); 
  const endDate = previousMonth.endOf('month').toDate();


  const pipeline = [
    {
      $match: { assignTo: new ObjectId(userId),
         createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $addFields: {
        monthYear: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }
      }
    },
    {
      $group: {
        _id: '$monthYear',
        greenCount: {
          $sum: { $cond: [{ $eq: ['$signalColor', 'Green'] }, 1, 0] }
        },
        yellowCount: {
          $sum: { $cond: [{ $eq: ['$signalColor', 'Yellow'] }, 1, 0] }
        },
        redCount: {
          $sum: { $cond: [{ $eq: ['$signalColor', 'Red'] }, 1, 0] }
        },
        totalTasks: { $sum: 1 },
        approvedCount: {
          $sum: { $cond: [{ $eq: ['$status', 'Approved'] }, 1, 0] }
        }
      }
    },
    {
      $addFields: {
        sealSubmissionRate: {
          $cond: [
            { $eq: ['$totalTasks', 0] },
            0,
            { $multiply: [{ $divide: ['$approvedCount', '$totalTasks'] }, 100] }
          ]
        }
      }
    },
    {
      $sort: { _id: -1 }
    }
  ];

const pulseData = await Approve.aggregate(pipeline);

  const enriched = await Promise.all(
    pulseData.map(async (item) => {
      const [yearStr, monthNumStr] = item._id.split('-');
      const year = Number(yearStr);
      const monthNum = Number(monthNumStr); 

      const month = dayjs(`${year}-${monthNum}-01`).format('MMMM');

      const monthDoc = await workingDaysRepository.getMonthByName(month);
      const monthId = monthDoc?._id;

      const response = await attendanceServices.calculateAttendanceAverage(userId, monthId);
      const attendanceAverage = Number(response?.attendanceAverage || 0);

      const totalTasks = item.totalTasks || 0;

      const greenRatio = totalTasks ? item.greenCount / totalTasks : 0;
      const yellowRatio = totalTasks ? item.yellowCount / totalTasks : 0;
      const redRatio = totalTasks ? item.redCount / totalTasks : 0;

      const efficiency =
         greenRatio * 10 +        
         yellowRatio * 5 -        
         redRatio * 10 +
        item.sealSubmissionRate +
        attendanceAverage;

      return {
        ...item,
        attendanceAverage,
        efficiency: Number(efficiency.toFixed(2)),
        month,
        year
      };
    })
  );

  return enriched;
};

export const getPulseEfficiencyWeekly = async (userId) => {
  const ObjectId = mongoose.Types.ObjectId;

  const pipeline = [
    {
      $match: { assignTo: new ObjectId(userId) }
    },
    {
      $addFields: {
        isoWeek: { $isoWeek: '$createdAt' },
        isoWeekYear: { $isoWeekYear: '$createdAt' }
      }
    },
    {
      $group: {
        _id: {
          isoWeek: '$isoWeek',
          isoWeekYear: '$isoWeekYear'
        },
        greenCount: {
          $sum: { $cond: [{ $eq: ['$signalColor', 'Green'] }, 1, 0] }
        },
        yellowCount: {
          $sum: { $cond: [{ $eq: ['$signalColor', 'Yellow'] }, 1, 0] }
        },
        redCount: {
          $sum: { $cond: [{ $eq: ['$signalColor', 'Red'] }, 1, 0] }
        },
        totalTasks: { $sum: 1 },
        approvedCount: {
          $sum: { $cond: [{ $eq: ['$status', 'Approved'] }, 1, 0] }
        }
      }
    },
    {
      $addFields: {
        sealSubmissionRate: {
          $cond: [
            { $eq: ['$totalTasks', 0] },
            0,
            { $multiply: [{ $divide: ['$approvedCount', '$totalTasks'] }, 100] }
          ]
        }
      }
    },
    {
      $sort: { '_id.isoWeekYear': -1, '_id.isoWeek': -1 }
    }
  ];

  const pulseData = await Approve.aggregate(pipeline);

  const enriched = await Promise.all(
    pulseData.map(async (item) => {
      const { isoWeek, isoWeekYear } = item._id;
      
      const date = dayjs().set('isoWeek', isoWeek).set('isoWeekYear', isoWeekYear);

      const month = date.format('MMMM');  // e.g., "July"
      const year = Number(date.format('YYYY'));

      const monthDoc = await workingDaysRepository.getMonthByName(month)

      const monthId = monthDoc?._id;
      
      const response = await attendanceServices.calculateAttendanceAverage(userId,monthId);
      const attendanceAverage = Number(response?.attendanceAverage || 0);
      const totalTasks = item.totalTasks || 0;
      
      const greenRatio = totalTasks ? item.greenCount / totalTasks : 0;
      const yellowRatio = totalTasks ? item.yellowCount / totalTasks : 0;
      const redRatio = totalTasks ? item.redCount / totalTasks : 0;

      const efficiency =
         greenRatio * 10 +        
         yellowRatio * 5 -        
         redRatio * 10 +
        item.sealSubmissionRate +
        attendanceAverage;

      // // Efficiency calculation
      // const efficiency =
      //   item.greenCount * 10 +
      //   item.yellowCount * 5 -
      //   item.redCount * 10 +
      //   item.sealSubmissionRate +
      //   attendanceAverage;

      return {
        ...item,
        attendanceAverage,
        efficiency: Number(efficiency.toFixed(2)),
        month,
        year
      };
    })
  );

  return enriched;
}; 

export const getPulseEfficiencyYearly = async (userId, year) => {
  const ObjectId = mongoose.Types.ObjectId;

  const startDate = dayjs(`${year}-01-01`).startOf('year').toDate();
  const endDate = dayjs(`${year}-12-31`).endOf('year').toDate();

  const pipeline = [
    {
      $match: {
        assignTo: new ObjectId(userId),
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $addFields: {
        monthYear: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }
      }
    },
    {
      $group: {
        _id: '$monthYear',
        greenCount: {
          $sum: { $cond: [{ $eq: ['$signalColor', 'Green'] }, 1, 0] }
        },
        yellowCount: {
          $sum: { $cond: [{ $eq: ['$signalColor', 'Yellow'] }, 1, 0] }
        },
        redCount: {
          $sum: { $cond: [{ $eq: ['$signalColor', 'Red'] }, 1, 0] }
        },
        totalTasks: { $sum: 1 },
        approvedCount: {
          $sum: { $cond: [{ $eq: ['$status', 'Approved'] }, 1, 0] }
        }
      }
    },
    {
      $addFields: {
        sealSubmissionRate: {
          $cond: [
            { $eq: ['$totalTasks', 0] },
            0,
            { $multiply: [{ $divide: ['$approvedCount', '$totalTasks'] }, 100] }
          ]
        }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ];

  const pulseData = await Approve.aggregate(pipeline);

  // Map result to object for fast lookup
  const pulseMap = {};
  pulseData.forEach(item => {
    pulseMap[item._id] = item;
  });

  // Build complete year (Jan to Dec)
  const enriched = await Promise.all(
    Array.from({ length: 12 }, async (_, i) => {
      const monthIndex = i + 1;
      const paddedMonth = String(monthIndex).padStart(2, '0');
      const monthKey = `${year}-${paddedMonth}`;

      const item = pulseMap[monthKey] || {
        _id: monthKey,
        greenCount: 0,
        yellowCount: 0,
        redCount: 0,
        totalTasks: 0,
        approvedCount: 0,
        sealSubmissionRate: 0
      };

      const month = dayjs(`${year}-${paddedMonth}-01`).format('MMMM');

      const monthDoc = await workingDaysRepository.getMonthByName(month);
      let attendanceAverage = 0;
      if (monthDoc?._id) {
        const monthId = monthDoc._id;
        const response = await attendanceServices.calculateAttendanceAverage(userId, monthId);
        attendanceAverage = Number(response?.attendanceAverage || 0);
      }
      // const response = await attendanceServices.calculateAttendanceAverage(userId, monthId);
      // const attendanceAverage = Number(response?.attendanceAverage || 0);

      // const efficiency =
      //   item.greenCount * 10 +
      //   item.yellowCount * 5 -
      //   item.redCount * 10 +
      //   item.sealSubmissionRate +
      //   attendanceAverage;
      const totalTasks = item.totalTasks || 0;

      const greenRatio = totalTasks ? item.greenCount / totalTasks : 0;
      const yellowRatio = totalTasks ? item.yellowCount / totalTasks : 0;
      const redRatio = totalTasks ? item.redCount / totalTasks : 0;

      const efficiency =
         greenRatio * 10 +        
         yellowRatio * 5 -        
         redRatio * 10 +
        item.sealSubmissionRate +
        attendanceAverage;

      return {
        ...item,
        attendanceAverage,
        efficiency: Number(efficiency.toFixed(2)),
        month,
        year
      };
    })
  );

  return enriched;
};


export const aggregatePulseEfficiencyByUser = async (departmentId, monthYear) => {
  
  const start = new Date(`${monthYear}-01T00:00:00Z`);
  const end = dayjs(start).endOf('month').toDate();

 
const pipeline = [
  {
    $match: {
      createdAt: {
        $gte: start,
        $lt: end
      }
    }
  },
  {
    $lookup: {
      from: 'taskassignments', 
      localField: 'taskAssignId',
      foreignField: '_id',
      as: 'task'
    }
  },
  { $unwind: '$task' },
  {
    $match: {
      'task.department_id': new mongoose.Types.ObjectId(departmentId)
    }
  },
  {
    $lookup: {
      from: 'users',
      localField: 'assignTo',
      foreignField: '_id',
      as: 'user'
    }
  },
  { $unwind: '$user' },
  {
    $addFields: {
      monthYear: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }
    }
  },
  {
    $group: {
      _id: {
        departmentId: '$task.department_id',
        userId: '$assignTo',
        monthYear: '$monthYear'
      },
      greenCount: {
        $sum: { $cond: [{ $eq: ['$signalColor', 'Green'] }, 1, 0] }
      },
      yellowCount: {
        $sum: { $cond: [{ $eq: ['$signalColor', 'Yellow'] }, 1, 0] }
      },
      redCount: {
        $sum: { $cond: [{ $eq: ['$signalColor', 'Red'] }, 1, 0] }
      },
      totalTasks: { $sum: 1 },
      approvedCount: {
        $sum: { $cond: [{ $eq: ['$status', 'Approved'] }, 1, 0] }
      },
      userName: { $first: '$user.name' }
    }
  },
  {
    $addFields: {
      sealSubmissionRate: {
        $cond: [
          { $eq: ['$totalTasks', 0] },
          0,
          { $multiply: [{ $divide: ['$approvedCount', '$totalTasks'] }, 100] }
        ]
      }
    }
  }
];

  // const pipeline = [
  //   {
  //     $match: {
  //       createdAt: {
  //         $gte: start,
  //         $lt: end
  //       },
  //       department_id: new mongoose.Types.ObjectId(departmentId)
  //     }
  //   },
  //   {
  //     $lookup: {
  //       from: 'users',
  //       localField: 'assignTo',
  //       foreignField: '_id',
  //       as: 'user'
  //     }
  //   },
  //   {
  //     $unwind: '$user'
  //   },
  //   // {
  //   //   $match: {
  //   //     'user.organizationId': new mongoose.Types.ObjectId(orgId)
  //   //   }
  //   // },
  //   {
  //     $addFields: {
  //       monthYear: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }
  //     }
  //   },
  //   {
  //     $group: {
  //       _id: {
  //         departmentId: '$department_id',
  //         userId: '$assignTo',
  //         monthYear: '$monthYear'
  //       },
  //       greenCount: {
  //         $sum: { $cond: [{ $eq: ['$signalColor', 'Green'] }, 1, 0] }
  //       },
  //       yellowCount: {
  //         $sum: { $cond: [{ $eq: ['$signalColor', 'Yellow'] }, 1, 0] }
  //       },
  //       redCount: {
  //         $sum: { $cond: [{ $eq: ['$signalColor', 'Red'] }, 1, 0] }
  //       },
  //       totalTasks: { $sum: 1 },
  //       approvedCount: {
  //         $sum: { $cond: [{ $eq: ['$status', 'Approved'] }, 1, 0] }
  //       },
  //       userName: { $first: '$user.name' }
  //     }
  //   },
  //   {
  //     $addFields: {
  //       sealSubmissionRate: {
  //         $cond: [
  //           { $eq: ['$totalTasks', 0] },
  //           0,
  //           { $multiply: [{ $divide: ['$approvedCount', '$totalTasks'] }, 100] }
  //         ]
  //       }
  //     }
  //   }
  // ];

  return Approve.aggregate(pipeline);
};