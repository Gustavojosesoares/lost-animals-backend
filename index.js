const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' })); // permite imagens grandes em base64
app.use('/uploads', express.static('uploads'));

require('dotenv').config();
mongoose.connect(process.env.MONGODB_URI);

// Modelo MongoDB
const LostAnimal = mongoose.model('LostAnimal', {
  breed: String,
  description: String,
  photo: String, // caminho do arquivo salvo
  latitude: Number,
  longitude: Number,
});

// Rota GET
app.get('/lostanimals', async (req, res) => {
  const lostAnimals = await LostAnimal.find();
  res.json(lostAnimals);
});

// Rota POST (com imagem base64)
app.post('/lostanimals', async (req, res) => {
  try {
    const { breed, description, latitude, longitude, photo } = req.body;

    let photoFilename = null;

    // Se houver imagem, salvar como arquivo
    if (photo && typeof photo === 'string' && photo.startsWith('data:')) {
      const matches = photo.match(/^data:(.+);base64,(.+)$/);
      if (!matches) return res.status(400).send('Formato de imagem inválido');

      const ext = matches[1].split('/')[1];
      const buffer = Buffer.from(matches[2], 'base64');

      photoFilename = `${Date.now()}.${ext}`;
      const savePath = path.join(__dirname, 'uploads', photoFilename);

      fs.writeFileSync(savePath, buffer);
    }

    const lostAnimal = new LostAnimal({
      breed,
      description,
      latitude,
      longitude,
      photo: photoFilename ? `/uploads/${photoFilename}` : null,
    });

    await lostAnimal.save();
    res.json(lostAnimal);
  } catch (err) {
    console.error('Erro ao salvar animal:', err);
    res.status(500).send('Erro interno ao salvar animal');
  }
});

// Inicia o servidor
app.listen(3000, () => console.log('Backend for lost animals listening on port 3000'));
