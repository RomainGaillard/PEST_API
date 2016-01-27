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
        if (req.body.password !== req.body.confirmPassword) {
            return res.json(401, {err: 'Password doesn\'t match, What a shame!'});
        }
        User.create(req.body).exec(function (err, user) {
            if (err) {
                return res.json(err.status, {err: err});
            }
            // If user created successfuly we return user and token as response
            if (user) {
                // NOTE: payload is { id: user.id}
                //Truck.update(user.truck, {currentUser:user.id}).exec(function (err,truck) {});

                if(req.parameter("id_truck")){
                    Truck.findOne({id:user.truck}).exec(function(err,truck){
                        if(err) return res.serverError({error: "impossible de retrouver le truck pour faire l'association"});

                        if(truck){
                            console.log("test")
                            truck.currentUser = user.id

                            truck.save(function(err){
                                if(err) return res.serverError({error: "impossible de faire l'association avec le truck"});

                                res.json(201, {user: user, token: jwToken.issue({id: user.id})});
                            })
                        }else return res.notFound({error:"le truck à cet id n'existe pas"})
                    })
                }
                res.json(200, {user: user, token: jwToken.issue({id: user.id})});
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
        if (req.user.right === "Administrateur" || req.user.right === "Gestionnaire") {
            var new_id_truck = req.param("id_truck");
            var old_id_truck = req.user.truck;

            if (new_id_truck && new_id_truck != old_id_truck) {
                Truck.findOne({id: new_id_truck}).exec(function (err, truck) {
                    if (err) return res.serverError
                    if (!truck) return res.notFound({err: "no truck find with this new id truck"})

                    if (truck.currentUser)
                        return res.badRequest({err: "ce truck a déjà un user"})
                    else {
                        User.update({id: req.param("id")}, req.body).exec(function (err, user) {
                            if (err) return res.serverError({error: "impossible d'update"});

                            if (!user) return res.notFound({err: "no user found"})
                            Truck.findOne({id:old_id_truck}).exec(function (err, truck) {
                                if(err) return res.serverError
                                truck.currentUser = null

                                truck.save(function(err){
                                    if(err) return res.serverError
                                    Truck.publishUpdate(truck.id,({truck:truck}))
                                })
                            });
                            Truck.findOne({id:new_id_truck}).exec(function (err, truck) {
                                if(err) return res.serverError
                                truck.currentUser = user[0].id

                                truck.save(function(err){
                                    if(err) return res.serverError
                                    Truck.publishUpdate(truck.id,({truck:truck}))
                                })
                            })

                            return res.ok({user: user})
                        })
                    }
                })
            } else {
                User.update({id: req.param("id")}, req.body).exec(function (err, user) {
                    if (err) return res.serverError({error: "impossible d'update"});

                    if (!user) return res.notFound({err: "no user found"})
                    return res.ok({user: user})
                })
            }
        }
    }
};

