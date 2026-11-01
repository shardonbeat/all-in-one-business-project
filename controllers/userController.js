const db = require('./db');

const submitUser = (req, res) => {
  const { name, userID } = req.body;
  if (!name || !userID) {
    return res.status(400).json({ error: 'Name and userID are required' });
  }

  const insertQuery = 'INSERT INTO users (name, userID) VALUES (?, ?)';
    db.run(insertQuery, [name, userID], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Database error: ' + err.message });
        }
        res.json({ message: `Data received for ${name} with userID ${userID}`, id: this.lastID });
    });
};

const loginUser = (req, res) => {
    const { userID, name} = req.body;

    db.get('SELECT * FROM users WHERE userID = ? AND name = ?', [userID, name], (err, row) => {
        if (err) return res.status(500).json({ error: + err.message });
        if (!row) return res.status(404).json({ error: 'User not found' });

        res.json({ message: 'Login successful', user: row });
    });
};


module.exports = { submitUser, loginUser };