const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();

// Garante que a pasta 'uploads' exista
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static('uploads'));

mongoose.connect(process.env.MONGODB_URI);

// Modelo do animal
const LostAnimal = mongoose.model('LostAnimal', {
  breed: String,
  description: String,
  photo: String,
  latitude: Number,
  longitude: Number,
});

// Armazenamento de imagens
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage: storage });

// Rotas
app.get('/lostanimals', async (req, res) => {
  const lostAnimals = await LostAnimal.find();
  res.json(lostAnimals);
});

app.post('/lostanimals', async (req, res) => {
  try {
    const { breed, description, latitude, longitude, photo } = req.body;

    // Salva imagem base64 se houver
    let photoPath = null;
    if (photo && photo.startsWith('data:image')) {
      const matches = photo.match(/^data:(.+);base64,(.+)$/);
      const ext = matches[1].split('/')[1];
      const base64Data = matches[2];
      const filename = `uploads/${Date.now()}.${ext}`;
      fs.writeFileSync(filename, Buffer.from(base64Data, 'base64'));
      photoPath = `/${filename}`;
    }

    const lostAnimal = new LostAnimal({ breed, description, latitude, longitude, photo: photoPath });
    await lostAnimal.save();
    res.json(lostAnimal);
  } catch (err) {
    console.error('Erro ao salvar animal:', err);
    res.status(500).send('Erro ao salvar animal.');
  }
});

app.delete('/lostanimals/:id', async (req, res) => {
  try {
    const animal = await LostAnimal.findByIdAndDelete(req.params.id);

    if (animal?.photo) {
      const filepath = path.join(__dirname, animal.photo);
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath); // Remove a imagem do servidor
      }
    }

    if (animal) {
      res.json({ message: 'Animal excluído com sucesso.' });
    } else {
      res.status(404).json({ error: 'Animal não encontrado.' });
    }
  } catch (err) {
    console.error('Erro ao excluir animal:', err);
    res.status(500).json({ error: 'Erro ao excluir animal.' });
  }
});

app.listen(3000, () => console.log('Backend for lost animals listening on port 3000'));
