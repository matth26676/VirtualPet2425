const express = require('express');
const app = express(); app.set('view engine', 'ejs');
const port = 3000;
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const server = app.listen(port, () => console.log(`Server started on port ${port}`));
const socketIo = require('socket.io');
const io = socketIo(server);
const sqlite3 = require('sqlite3');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const sessionMiddleware = session({
    store: new SQLiteStore,
    secret: 'Updated Boilerplate',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
})
app.use(sessionMiddleware);
app.use(express.urlencoded({ extended: true }));
io.use((socket, next) => sessionMiddleware(socket.request, {}, next));

const routes = require('./modules/routes');
const sockets = require('./modules/socket');
const path = require('path');
const db = new sqlite3.Database('data/Database.db', (err) => {
    if (err) {
        console.log(err);
    } else {
        console.log('Connected to the data/Database.db!')
    }
});

app.get('/', routes.getindex);

app.get('/login', (req, res) => routes.getlogin(req, res, jwt));

app.post('/login', (req, res) => routes.postlogin(req, res, db, crypto));

app.get('/logout', routes.getlogout);

app.get('/chat', routes.getchat);

io.on('connection', (socket) => sockets.connection(socket, io));

app.use(express.static(path.join(__dirname, 'public')));