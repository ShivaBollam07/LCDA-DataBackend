const express = require('express');
const multer = require('multer');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config(); 
const app = express();
const PORT = process.env.PORT || 5002;

mongoose.connect(process.env.MONGODB_URI, {

});

const uploadSchema = new mongoose.Schema({
  filename: String,
  category: String,
  contentType: String,
  content: Buffer,
  uploadDate: { type: Date, default: Date.now },
});

const Upload = mongoose.model('Upload', uploadSchema);

app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['POST', 'GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const categories = [
  'good tomato leaf',
  'diseased tomato leaf',
  'good chilli leaf',
  'diseased chilli leaf',
  'good groundnut leaf',
  'diseased groundnut leaf',
];

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG and PNG are allowed.'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

app.post('/upload', upload.single('image'), async (req, res) => {
  if (!req.body.category || !categories.includes(req.body.category)) {
    return res.status(400).json({
      message: 'Upload failed',
      error: 'Invalid or missing category',
    });
  }

  try {
    const newUpload = new Upload({
      filename: req.file.originalname,
      category: req.body.category,
      contentType: req.file.mimetype,
      content: req.file.buffer, 
    });

    await newUpload.save(); 
    console.log('File uploaded:', newUpload.filename || 'Untitled');
    res.status(200).json({
      message: 'File uploaded successfully',
      filename: req.file.originalname,
    });
  } catch (err) {
    res.status(500).json({
      message: 'Upload failed',
      error: err.message,
    });
  }
});

app.get('/uploads', async (req, res) => {
  try {
    const uploads = await Upload.find({}, { __v: 0 }); 
    res.status(200).json(uploads);
  } catch (err) {
    res.status(500).json({
      message: 'Failed to retrieve uploads',
      error: err.message,
    });
  }
});

app.post('/uploads/category', async (req, res) => {
  const { category } = req.body;

  if (!category || !categories.includes(category)) {
    return res.status(400).json({
      message: 'Invalid category',
    });
  }

  try {
    const encodedCategory = decodeURIComponent(category);
    const uploads = await Upload.find({ category: encodedCategory }, { __v: 0 }); results
    res.status(200).json(uploads);
  } catch (err) {
    res.status(500).json({
      message: 'Failed to retrieve uploads by category',
      error: err.message,
    });
  }
});

app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  res.status(500).json({
    message: 'Internal server error',
    error: err.message || 'Something went wrong!',
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
