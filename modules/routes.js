function getindex(req, res) {
    res.render('index', { session: JSON.stringify(req.session) });
}

function getlogin(req, res, jwt) {
    if (!req.query.token) {
        res.render('login', { headershost: JSON.stringify(req.headers.host), requrl: JSON.stringify(req.url) });
    } else {
        let tokenData = jwt.decode(req.query.token);
        req.session.token = tokenData;
        req.session.user = tokenData.username;
        req.session.userid = tokenData.id;
        res.redirect('/');
    }
}

function postlogin(req, res, db, crypto) {
    if (req.body) {
        if (req.body.user && req.body.pass) {
            db.get(`SELECT * FROM Users WHERE Username=?;`, req.body.user, (err, row) => {
                if (err) {
                    console.log(err);
                    res.send('Whoops! Something went wrong :(');
                } else if (!row) {
                    // Create a new salt(key) for the user
                    const salt = crypto.randomBytes(16).toString('hex')
    
                    // Uses salt to hash password
                    crypto.pbkdf2(req.body.pass, salt, 1000, 64, 'sha512', (err, derivedKey) => {
                        if (err) {
                            console.log(err)
                            res.send('Whoops! Something went wrong :(')
                        } else {
                            const hashedPassword = derivedKey.toString('hex')
                            db.run(`INSERT INTO Users(Username, Password, Salt) VALUES(?, ?, ?)`, [req.body.user, hashedPassword, salt], (err) => {
                                if (err) {
                                    console.log(err);
                                    res.send('Whoops! Something went wrong :(')
                                } else {
                                    req.session.user = req.body.user;
                                    res.render('/');
                                }
                            })
                        }
                    })
                } else if (row) {
                    // compares stored password with provided password
                    crypto.pbkdf2(req.body.pass, row.Salt, 1000, 64, 'sha512', (err, derivedKey) => {
                        if (err) {
                            res.send('Whoops! Something went wrong :(')
                        } else {
                            const hashedPassword = derivedKey.toString('hex')
                            if (row.Password === hashedPassword) {
                                req.session.user = req.body.user;
                                res.redirect('/');
                            } else {
                                res.render("Incorrect Password Please check for errors in password...")
                            }
                        }
                    })
    
    
                }
            })
        } else {
            res.send("You need a valid username and password")
        }
    } else {
        console.log('An Error has occured');
    }
    
}

function getlogout(req, res) {
    res.render('index');
}

function getchat(req, res) {
    if (isAuthenticated) {
        res.render('chat');
    } else {
        res.redirect('/login');
    }
}

function isAuthenticated(req, res, next) {
    if (req.session.user) {
        return true;
    } else {
        return false;
    }
}



module.exports = {
    getindex,
    getlogin,
    postlogin,
    getlogout,
    getchat
}