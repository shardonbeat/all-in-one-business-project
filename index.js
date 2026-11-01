const express = require('express');
const path = require('path');

const { submitUser, loginUser } = require('./controllers/userController');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.get('/', (req, res) => { 
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/api/data', (req, res) => {
  const data = {
    message: 'Hello from the backend!',
    timestamp: new Date()
  };
  res.json(data);
});

app.post('/api/submit', submitUser);
app.post('/api/login', loginUser);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});