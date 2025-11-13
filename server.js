import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import multer from 'multer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/';
    // Ensure uploads directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, JPG, PNG, GIF) are allowed!'));
    }
  }
});

// Helper function to read accounts.json
const readAccounts = () => {
  try {
    if (!fs.existsSync('accounts.json')) {
      // Create default structure if file doesn't exist
      const defaultData = {
        users: [],
        projects: [],
        config: {
          apiBaseUrl: "http://localhost:3001/api",
          uploadPath: "/uploads",
          maxFileSize: 5242880,
          allowedFileTypes: ["image/jpeg", "image/png", "image/gif"]
        }
      };
      fs.writeFileSync('accounts.json', JSON.stringify(defaultData, null, 2));
      return defaultData;
    }
    const data = fs.readFileSync('accounts.json', 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading accounts.json:', error);
    throw new Error('Failed to read accounts data');
  }
};

// Helper function to write accounts.json
const writeAccounts = (data) => {
  try {
    // Validate data structure before writing
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid data structure');
    }
    fs.writeFileSync('accounts.json', JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing accounts.json:', error);
    throw new Error('Failed to save accounts data');
  }
};

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Get all users
app.get('/api/users', (req, res) => {
  try {
    const accounts = readAccounts();
    res.json(accounts.users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Login
app.post('/api/login', (req, res) => {
  try {
    console.log('Login request received:', req.body);
    const { email, password } = req.body;
    console.log('Extracted email:', email);
    console.log('Extracted password length:', password ? password.length : 'undefined');

    const accounts = readAccounts();
    console.log('Available users:', accounts.users.map(u => ({ email: u.email, passwordLength: u.password.length })));

    const user = accounts.users.find(u => u.email === email && u.password === password);
    console.log('User found:', user ? { email: user.email, role: user.role } : 'No user found');

    if (user) {
      const response = {
        success: true,
        token: 'mock-jwt-token',
        user: { id: user.id, email: user.email, role: user.role, name: user.name }
      };
      console.log('Login successful, sending response:', response);
      res.json(response);
    } else {
      console.log('Login failed: Invalid credentials');
      res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Register
app.post('/api/submit', (req, res) => {
  try {
    const userData = req.body;
    const accounts = readAccounts();

    // Check if user already exists
    const existingUser = accounts.users.find(u => u.email === userData.email);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const newUser = {
      id: Date.now().toString(),
      ...userData,
      createdAt: new Date().toISOString()
    };

    accounts.users.push(newUser);

    if (writeAccounts(accounts)) {
      res.json({ message: 'User registered successfully', user: newUser });
    } else {
      res.status(500).json({ error: 'Failed to save user' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

// File upload
app.post('/api/upload', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Additional validation
    const accounts = readAccounts();
    const maxSize = accounts.config.maxFileSize || 5 * 1024 * 1024;
    if (req.file.size > maxSize) {
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: `File size exceeds maximum allowed size of ${maxSize / (1024 * 1024)}MB` });
    }

    res.json({
      message: 'File uploaded successfully',
      filename: req.file.filename,
      path: `/uploads/${req.file.filename}`,
      size: req.file.size,
      mimetype: req.file.mimetype
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ error: 'File upload failed', details: error.message });
  }
});

// Get projects
app.get('/api/projects', (req, res) => {
  try {
    const accounts = readAccounts();
    res.json(accounts.projects);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Get config
app.get('/api/config', (req, res) => {
  try {
    const accounts = readAccounts();
    res.json(accounts.config);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch config' });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Request error:', error);

  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File size exceeds the maximum allowed limit' });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ error: 'Unexpected file field' });
    }
  }

  if (error.message && error.message.includes('Only image files')) {
    return res.status(400).json({ error: error.message });
  }

  if (error.message && error.message.includes('Failed to read accounts data')) {
    return res.status(500).json({ error: 'Database read error' });
  }

  if (error.message && error.message.includes('Failed to save accounts data')) {
    return res.status(500).json({ error: 'Database write error' });
  }

  // Handle JSON parsing errors
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({ error: 'Invalid JSON in request body' });
  }

  res.status(500).json({ error: 'Internal server error', details: process.env.NODE_ENV === 'development' ? error.message : undefined });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});