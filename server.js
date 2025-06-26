require('dotenv').config();
const express = require('express');
const cors = require('cors');
const envRoutes = require('./routes/envRoutes');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/env', envRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🌍 .env sync server running on port ${PORT}`);
});
