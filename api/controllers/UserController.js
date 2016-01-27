/**
 * UserController
 *
 * @description :: Server-side logic for managing users
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
    /**
     * `UserController.create()`
     */
    create: function (req, res) {
        var body = req.body
        if(body.truck === "null")
            body.truck = null
        if(body.company === "null")
            body.company = null
        if (req.body.password !== req.body.confirmPassword) {
            return res.json(401, {err: 'Password doesn\'t match, What a shame!'});
        }
        User.create(body).exec(function (err, user) {
            if (err) {
                return res.json(err.status, {err: err});
            }
            // If user created successfuly we return user and token as response
            if (user) {
                // NOTE: payload is { id: user.id}
                //Truck.update(user.truck, {currentUser:user.id}).exec(function (err,truck) {});

                var is_in = false;
                if(body.truck){
                    is_in = true;
                    Truck.findOne({id:user.truck}).exec(function(err,truck){
                        if(err) return res.serverError({error: "impossible de retrouver le truck pour faire l'association"});

                        if(truck){
                            console.log("test")
                            truck.currentUser = user.id

                            truck.save(function(err){
                                if(err) return res.serverError({error: "impossible de faire l'association avec le truck"});

                                res.json(201, {user: user});
                            })
                        }else {
                            user.truck = null

                            user.save(function (err) {
                                if(err) return res.serverError({error:err})
                            })
                            return res.notFound({error:"le truck à cet id n'existe pas"})
                        }
                    })
                }if(body.company){
                    is_in = true
                    Company.findOne({id:user.company}).exec(function (err, company) {
                        if(err) return res.serverError({error:err})
                        if(!company) {
                            user.company = null

                            user.save(function(err){
                                if(err) return res.serverError({error:err})

                            })
                            return res.notFound({error:"cette entreprise n'existe pas"})
                        }else{
                            company.users.push(user.id)

                            company.save(function (err) {
                                if(err) return res.serverError({error:err})

                                res.status(201).json({user: user})
                            })
                        }

                    })
                }
                if(!is_in) res.json(200, {user: user});
            }else return res.json(500, {error: "impossible de créer le camion"})
        });
    },

    getAllUsers:function(req, res) {
        if(req.user.right === "Administrateur"){
            User.find({}).populate("company").populate("truck").exec(function (err, users) {
                if(err) return res.serverError
                if(!users) return res.ok("pas d'utilisateur trouvé")

                if(req.isSocket){
                    for(i = 0; i< users.length; i++){
                        User.subscribe(req, users[i].id)
                    }

                    return res.ok(users)
                }
                return res.ok(users)
            })
        }else if(req.user.right === "Gestionnaire"){
            User.find({company: req.user.company}).populate("company").populate("truck").exec(function (err, users) {
                if(err) return res.serverError
                if(!users) return res.ok("pas d'utilisateur trouvé pour la company de ce gestionnaire")

                if(req.isSocket){
                    for(i = 0; i< users.length; i++){
                        User.subscribe(req, users[i].id)
                    }

                    return res.ok(users)
                }
                return res.ok(users)
            })
        }else return res.forbidden("You have no right to get the users")
    },


    // todo relation one to one si on change l'id du truck il faut que l'ancien truck et le nouveau le sache
    //todo débug pas de retour

    update: function (req, res) {
        console.log("test0")
        if (req.user.right === "Administrateur" || req.user.right === "Gestionnaire") {
            var body = req.body
            if(body.truck === "null")
                body.truck = null
            if(body.company === "null")
                body.company = null

            //var new_id_company = body.company
            //var old_id_company = req.user.company

            var new_id_truck = body.truck;
            var old_id_truck = req.user.truck;

            //var updateCompany = false
            //if(new_id_company && new_id_company != old_id_company){
            //    Company.findOne({id:new_id_company}).exec(function (err, company) {
            //        if(err) return res.serverError({error:err})
            //
            //        if(!company) return res.notFound({error:"cette company n'existe pas"})
            //        console.log("test1")
            //        updateCompany = true
            //    })
            //}
            if (new_id_truck && new_id_truck != old_id_truck) {
                Truck.findOne({id: new_id_truck}).exec(function (err, truck) {
                    if (err) return res.serverError
                    if (!truck) return res.notFound({err: "no truck find with this new id truck"})
                    if (truck.currentUser)
                        return res.badRequest({err: "ce truck a déjà un user"})
                    else {
                        User.update({id: req.param("id")}, body).exec(function (err, users) {
                            if (err) return res.serverError({error: "impossible d'update"});

                            if (!users) return res.notFound({err: "no user found"})
/*                            if(updateCompany){
                                Company.findOne({id:old_id_company}).exec(function (err, company) {
                                    if(err) return res.serverError({err:"erreur pour trouver l'ancienne company"})
                                    if(company){
                                        var index_old = company.users.indexOf(users[0].id)
                                        company.users.splice(index_old,1)
                                        company.save(function (err) {
                                            if(err) return res.serverError

                                        })
                                    }
                                })

                                Company.findOne({id:new_id_company}).exec(function (err, company) {
                                    if(err) return res.serverError({err:"erreur pour trouver la nouvelle company"})
                                    company.users.push(users[0].id)

                                    console.log("test5")
                                    company.save(function (err) {
                                        if(err) return res.serverError

                                    })
                                })

                            }*/
                            Truck.findOne({id:old_id_truck}).exec(function (err, truck) {
                                if(err) return res.serverError
                                if(truck){
                                    truck.currentUser = null

                                    truck.save(function(err){
                                        if(err) return res.serverError
                                        Truck.publishUpdate(truck.id,({truck:truck}))
                                    })
                                }
                            });
                            Truck.findOne({id:new_id_truck}).exec(function (err, truck) {
                                if(err) return res.serverError
                                truck.currentUser = users[0].id
                                truck.save(function(err){
                                    console.log(err)
                                    if(err) return res.serverError
                                    Truck.publishUpdate(truck.id,({truck:truck}))
                                })
                            })

                            return res.ok({user: users})
                        })
                    }
                })
            } else {
                User.update({id: req.param("id")}, body).exec(function (err, user) {
                    if (err) return res.serverError({error: "impossible d'update"});

                    if (!user) return res.notFound({err: "no user found"})
                    return res.ok({user: user})
                })
            }
        }else {
            console.log("test10")
            return res.forbidden
        }
    }
};

