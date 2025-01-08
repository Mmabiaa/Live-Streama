// streama-backend/users.js
const bcrypt = require('bcrypt');
const { users } = require('./database');

const registerUser = async (email, password) => {
    const hashedPassword = await bcrypt.hash(password, 10);
    users.push({ email, password: hashedPassword });
};

const findUser = (email) => {
    return users.find(user => user.email === email);
};

const validateUser = async (email, password) => {
    const user = findUser(email);
    if (user) {
        return await bcrypt.compare(password, user.password);
    }
    return false;
};

module.exports = { registerUser, validateUser };
