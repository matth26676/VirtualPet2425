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
                                    db.get(`SELECT * FROM Users WHERE Username=?;`, req.body.user, (err, user) => {
                                        if (err) {
                                            console.log(err);
                                            res.send('Whoops! Something went wrong :(');
                                        } else {
                                            db.run(`INSERT INTO Pets(OwnerID, PetName, PetHunger, PetHappiness, Gold) VALUES(?, ?, 100, 100, 0)`, [user.UID, 'DefaultPetName'], (err) => {
                                                if (err) {
                                                    console.log(err);
                                                    res.send('Whoops! Something went wrong :(');
                                                }
                                            });
                                            db.get(`SELECT COUNT(*) as count FROM Items`, (err, result) => {
                                                if (err) {
                                                    console.log(err);
                                                    res.send('Whoops! Something went wrong :(');
                                                } else {
                                                    let itemCount = result.count;
                                                    for (let i = 1; i <= itemCount; i++) {
                                                        db.run(`INSERT INTO Inventory(OwnerID, itemID, itemAmount) VALUES(?, ?, 0)`, user.UID, i, (err) => {
                                                            if (err) {
                                                                console.log(err);
                                                                res.send('Whoops! Something went wrong :(');
                                                            } else {
                                                                res.redirect('/');
                                                            }
                                                        });
                                                    }
                                                }
                                            });
                                        }
                                    });
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

function getGame(req, res) {
    res.render('directionGame');
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

function getpet(req, res, db) {
    if (isAuthenticated) {
        db.get(`SELECT * FROM Users WHERE Username=?;`, req.session.user, (err, user) => {
            db.get(`SELECT * FROM Pets WHERE OwnerID=?;`, user.UID, (err, petStatData) => {
                if (err) {
                    console.log(err);
                    res.send('Whoops! Something went wrong :(');
                } else {
                    var petStatData = JSON.stringify(petStatData);
                }
                db.all(`SELECT * FROM INVENTORY WHERE OwnerID=?;`, user.UID, (err, inventoryItemData) => {
                    if (err) {
                        console.log(err);
                        res.send('Whoops! Something went wrong :(');
                    } else {
                        var inventoryItemData = JSON.stringify(inventoryItemData);
                        console.log(inventoryItemData);

                    }
                    db.all(`SELECT * FROM Items;`, (err, row) => {
                        if (err) {
                            console.log(err);
                            res.send('Whoops! Something went wrong :(');
                        } else {
                            var itemData = JSON.stringify(row);
                        }
                        res.render('pet', { petData: petStatData, inventoryData: inventoryItemData, itemData: itemData });
                    });
                });
            });
        });
    } else {
        res.redirect('/login');
    }
}

function postpet(req, res, db) {
    db.get(`SELECT * FROM Users WHERE Username=?;`, req.session.user, (err, user) => {
        if (err) {
            console.log(err);
            res.send('Whoops! Something went wrong :(');
        } else {
            db.run(`UPDATE Pets SET PetHunger=?, PetHappiness=?, Gold=? WHERE OwnerID=?`, [req.body.saturation, req.body.happiness, req.body.gold ,user.UID], (err) => {
                if (err) {
                    console.log(err);
                    res.send('Whoops! Something went wrong :(');
                }
            });
            for (let i in req.body.items) {
                db.get(`SELECT * FROM Inventory WHERE OwnerID=? AND itemID=?;`, [user.UID, req.body.items[i].itemID], (err, row) => {
                    if (err) {
                        console.log(err);
                        res.send('Whoops! Something went wrong :(');
                    } else {
                        if (!row) {
                            db.run(`INSERT INTO Inventory(OwnerID, itemID, itemAmount) VALUES(?, ?, ?)`, [user.UID, req.body.items[i].itemID, req.body.items[i].quantity], (err) => {
                                if (err) {
                                    console.log(err);
                                    res.send('Whoops! Something went wrong :(');
                                }
                            });
                        } else {
                            db.run(`UPDATE Inventory SET itemAmount=? WHERE OwnerID=? AND ItemID=?`, [req.body.items[i].quantity, user.UID, req.body.items[i].itemID], (err) => {
                                if (err) {
                                    console.log(err);
                                    res.send('Whoops! Something went wrong :(');
                                }
                            });
                        }
                    }
                });
            }
        }
    });
}



module.exports = {
    getindex,
    getlogin,
    postlogin,
    getlogout,
    getchat,
    getpet,
    postpet,
    getGame
}