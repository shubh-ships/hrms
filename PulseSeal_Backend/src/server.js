import http from 'http';
import dotenv from 'dotenv';
import cors from 'cors';
import { Server as IOServer } from 'socket.io';
import connectDB from './config/DB.js';
import app from './app.js';
import "./jobs/reportCorn.js";
import "./jobs/monthlyCorn.js";
import "./jobs/newAttendanceCorn.js";
import scheduleYearlyLeaveRollover from './jobs/yearlyJobRollover.job.js';
import scheduleMonthlyLeaveRollover from './jobs/montlyJobRollover.job.js';

dotenv.config({ path: './.env' });

connectDB();
scheduleYearlyLeaveRollover();
scheduleMonthlyLeaveRollover();

const PORT = process.env.Port || 8080;

const httpServer = http.createServer(app);

const io = new IOServer(httpServer, {
  cors: {
    origin: process.env.SOCKET_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  },
});

app.set('io', io);

io.on('connection', (socket) => {

  socket.on('joinTaskRoom', (payload) => {
    const taskId = typeof payload === 'string' ? payload : payload?.taskId;
    if (taskId) {
      socket.join(`task_${taskId}`);
    }
  });

  socket.on('joinUserRoom', (payload) => {
    const userId = typeof payload === 'string' ? payload : payload?.userId;
    if (userId) {
      socket.join(`user_${userId}`);
    }
  });

  socket.on('disconnect', (reason) => {
  });
});


httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
