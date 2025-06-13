// index.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

mongoose.connect(process.env.MONGODB_URI);


const LostAnimal = mongoose.model('LostAnimal', {
  breed: String,
  description: String,
  photo: String,
  latitude: Number,
  longitude: Number,
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

app.get('/lostanimals', async (req, res) => {
  const lostAnimals = await LostAnimal.find();
  res.json(lostAnimals);
});

app.post('/lostanimals', upload.single('photo'), async (req, res) => {
  console.log("Arquivo:", req.file);
  console.log("Corpo:", req.body);
  const { breed, description, latitude, longitude } = req.body;
  const photo = req.file ? req.file.path : null;
  const lostAnimal = new LostAnimal({ breed, description, photo, latitude, longitude });
  await lostAnimal.save();
  res.json(lostAnimal);
});

app.listen(3000, () => console.log('Backend for lost animals listening on port 3000'));
