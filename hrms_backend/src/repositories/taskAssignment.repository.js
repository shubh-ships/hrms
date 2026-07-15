import Approve from "../models/approve.Model.js";
import TaskAssignment from "../models/taskAssignment.Model.js";
import mongoose from "mongoose";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
dayjs.extend(utc);
dayjs.extend(timezone);

export const createTaskAssignment = async (taskAssignmentData) => {
  const taskAssignment = new TaskAssignment(taskAssignmentData);
  return await taskAssignment.save();
};

export const getTaskAssignmentsByUserId = async (userId) => {
  return await TaskAssignment.find({ assigned_to_employee_id: userId })
    .populate("assigned_by_user_id")
    .populate("assigned_to_employee_id")
    .populate("department_id");
};

export const getTodayTaskAssignmentsByUserId = async (
  userId,
  startOfDay,
  endOfDay,
) => {
  return await TaskAssignment.find({
    assigned_to_employee_id: userId,
    deadline: {
      $gte: startOfDay,
      $lte: endOfDay,
    },
  })
    .populate("assigned_by_user_id")
    .populate("assigned_to_employee_id")
    .populate("department_id");
};

export const getTodayTaskAssignmentsByGivenUserId = async (userId) => {
  return await TaskAssignment.find({
    assigned_to_employee_id: userId,
  })
    .populate("assigned_by_user_id")
    .populate("assigned_to_employee_id")
    .populate("department_id");
};

export const getTaskAssignmentByAssignedById = async (userId) => {
  return await TaskAssignment.find({ assigned_by_user_id: userId })
    .populate("assigned_by_user_id")
    .populate("assigned_to_employee_id")
    .populate("department_id");
};

export const getDepartmentTaskAssignments = async (department_id) => {
  return await TaskAssignment.find({ department_id })
    .populate("assigned_by_user_id")
    .populate("assigned_to_employee_id")
    .populate("department_id");
};

export const getAllTaskAssignments = async () => {
  return await TaskAssignment.find()
    .populate("assigned_by_user_id")
    .populate("assigned_to_employee_id")
    .populate("department_id");
};

export const getTaskAssignmentById = async (id) => {
  return await TaskAssignment.findById(id)
    .populate("assigned_by_user_id")
    .populate("assigned_to_employee_id")
    .populate("department_id");
};

export const updateTaskAssignment = async (id, updateData) => {
  let updatedData = updateData;
  if (updateData.timer_status === "InProgress") {
    updatedData = {
      ...updateData,
      stuck_request: false,
    };
  }
  return await TaskAssignment.findByIdAndUpdate(id, updatedData, {
    new: true,
    runValidators: true,
  })
    .populate("assigned_by_user_id")
    .populate("assigned_to_employee_id")
    .populate("department_id");
};

export const changeDeadline = async (id, updateData) => {
  return await TaskAssignment.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  })
    .populate("assigned_by_user_id")
    .populate("assigned_to_employee_id")
    .populate("department_id");
};

export const deleteTaskAssignment = async (id) => {
  return await TaskAssignment.findByIdAndDelete(id);
};

export const listStuckRequests = async (id) => {
  return await TaskAssignment.find({
    assigned_by_user_id: id,
    stuck_request: true,
  })
    .populate("assigned_to_employee_id assigned_by_user_id", "name email")
    .populate("department_id", "name alias");
};

// export const getUserDailyTasks = async (userId) => {
//   const ObjectId = mongoose.Types.ObjectId;

//   const pipeline = [
//     {
//       $match: {
//         assignTo: new ObjectId(userId)
//       }
//     },
//     {
//       $lookup: {
//         from: 'TaskAssignment',
//         localField: 'taskAssignId',
//         foreignField: '_id',
//         as: 'taskAssignDetails'
//       }
//     },
//     {
//       $unwind: {
//         path: '$taskAssignDetails',
//         preserveNullAndEmptyArrays: true
//       }
//     },
//     {
//       $addFields: {
//         dateOnly: {
//           $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
//         }
//       }
//     },
//     {
//       $group: {
//         _id: '$dateOnly',
//         tasks: {
//           $push: {
//             _id: '$_id',
//             taskAssignId: '$taskAssignId',
//             comment: '$comment',
//             reason: '$reason',
//             signalColor: '$signalColor',
//             status: '$status',
//             submissionId: '$submissionId',
//             assignBy: '$assignBy',
//             assignTo: '$assignTo',
//             createdAt: '$createdAt',
//             updatedAt: '$updatedAt',
//              taskAssignment: {
//               _id: '$taskAssignDetails._id',
//               title: '$taskAssignDetails.title',
//               TAT: '$taskAssignDetails.TAT',
//               deadline: '$taskAssignDetails.deadline',
//               status: '$taskAssignDetails.status',
//               timerStatus: '$taskAssignDetails.timerStatus',
//               department_id: '$taskAssignDetails.department_id',
//               assigned_by_user_id: '$taskAssignDetails.assigned_by_user_id',
//               assigned_to_employee_id: '$taskAssignDetails.assigned_to_employee_id'
//             }
//           }
//         }
//       }
//     },
//     {
//       $sort: {
//         _id: -1
//       }
//     }
//   ];

//   return await Approve.aggregate(pipeline);
// };

// const ObjectId = mongoose.Types.ObjectId;
export const getUserDailyTasks = async (userId) => {
  const ObjectId = mongoose.Types.ObjectId;

  const pipeline = [
    {
      $match: {
        assignTo: new ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "taskassignments",
        localField: "taskAssignId",
        foreignField: "_id",
        as: "taskAssignDetails",
      },
    },
    {
      $unwind: {
        path: "$taskAssignDetails",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $addFields: {
        dateOnly: {
          $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
        },
      },
    },
    {
      $group: {
        _id: "$dateOnly",
        tasks: {
          $push: {
            _id: "$_id",
            taskAssignId: "$taskAssignId",
            comment: "$comment",
            reason: "$reason",
            signalColor: "$signalColor",
            status: "$status",
            submissionId: "$submissionId",
            assignBy: "$assignBy",
            assignTo: "$assignTo",
            createdAt: "$createdAt",
            updatedAt: "$updatedAt",
            taskAssignment: {
              _id: "$taskAssignDetails._id",
              title: "$taskAssignDetails.title",
              TAT: "$taskAssignDetails.TAT",
              deadline: "$taskAssignDetails.deadline",
              status: "$taskAssignDetails.status",
              timerStatus: "$taskAssignDetails.timerStatus",
              department_id: "$taskAssignDetails.department_id",
              assigned_by_user_id: "$taskAssignDetails.assigned_by_user_id",
              assigned_to_employee_id:
                "$taskAssignDetails.assigned_to_employee_id",
            },
          },
        },
      },
    },
    {
      $sort: {
        _id: -1,
      },
    },
  ];

  return await Approve.aggregate(pipeline);
};

export const getLengthTodayTask = async (userId) => {
  const now = dayjs().tz("Asia/Kolkata");
  const startOfDay = now.startOf("day").utc().toDate();
  const endOfDay = now.endOf("day").utc().toDate();
  const totalLength = await TaskAssignment.countDocuments({
    assigned_to_employee_id: userId,
    createdAt: {
      $gte: startOfDay,
      $lte: endOfDay,
    },
  });
  return totalLength;
};
