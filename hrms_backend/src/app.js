import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

import routes from './routes/index.js'; 
import errorHandler from './middlewares/errorHandler.js';
import cookieParser from 'cookie-parser';

const app = express();

app.use(cors());
app.use(express.json());
// app.use(express.urlencoded({ extended: true })); 
app.use(cookieParser())

app.use(morgan('dev'));

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
  });
});

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>API Form</title>
      <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="flex items-center justify-center min-h-screen bg-gray-100">
      <form action="/api/v1/users/register" method="POST" class="bg-white p-8 rounded-lg shadow-md w-full max-w-sm">
        <h2 class="text-2xl font-bold mb-6 text-center">Contact Us</h2>

        <div class="mb-4">
          <label for="name" class="block text-gray-700">Name</label>
          <input
            type="text"
            id="name"
            name="name"
            class="mt-1 w-full px-4 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300"
            required
          >
        </div>

        <div class="mb-4">
          <label for="email" class="block text-gray-700">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            class="mt-1 w-full px-4 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300"
            required
          >
        </div>

        <div class="mb-6">
          <label for="password" class="block text-gray-700">password</label>
          <textarea
            id="password"
            name="password"
            rows="4"
            class="mt-1 w-full px-4 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300"
            required
          ></textarea>
        </div>

        <button
          type="submit"
          class="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
        >
          Submit
        </button>
      </form>
    </body>
    </html>
  `);
});

app.use('/api/v1', routes);

app.use((req, res, next) => {
  if (!req.route) {
    return res.status(404).json({
      success: false,
      message: `Route ${req.originalUrl} not found on this Server `,
    });
  }
  next()
});

app.use(errorHandler);

export default app;
