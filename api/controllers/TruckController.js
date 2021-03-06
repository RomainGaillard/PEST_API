/**
 * TruckController
 *
 * @description :: Server-side logic for managing trucks
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
    create:function(req,res){
        var body = req.body
        if(body.currentUser === "null")
            body.currentUser = null
        if(body.company === "null")
            body.company = null
        Truck.create(body).exec(function(err,truck){
            if(err) return res.serverError({error:"impossible de créer le camion"});

            if(truck){
                if(truck.currentUser){
                    //User.update(truck.currentUser, {truck:truck.id}).exec(function(err,user){console.log("test")});
                    User.findOne(truck.currentUser).exec(function(err,user){
                        if(err) return res.serverError({error: "impossible de retrouver le user pour faire l'association"});

                        if(user){
                            user.truck = truck.id;

                            user.save(function(err){
                                if(err) return res.serverError({error: "impossible de faire l'association avec le user"});

                                return res.json(201, {truck: truck});
                            })
                        }else return res.notFound({error: "user non existant pour l'association"})
                    })
                }else return res.json(201, {truck: truck})
            }else return res.json(500, {error: "impossible de créer le camion"})
        })
    },

    getPannesByTruck:function(req,res){
        var truck = req.param("id_truck");
        if(!truck) return res.badRequest({error:'wrong path'});
        Panne.find({truck:req.param("id_truck")}).exec(function(err,pannes){
            if(pannes){
                sails.log.debug("=> GetPannesByTruck: Succès");
                return res.status(200).json({pannes:pannes})
            }
            sails.log.debug("=> GetPannesByTruck: Erreur");
            return res.status(400).json({err:"get Pannes: Erreur"})
        })
    },

    getTruckById:function(req,res){
        var id_truck = req.param("id");
        if(!id_truck) return res.badRequest
        Truck.findOne({id:id_truck}).populate("pannes").exec(function (err, truck) {
            if(err) return res.serverError

            if (!truck) return res.notFound

            Truck.subscribe(req, truck.id)
            for( i = 0; i < truck.pannes.length; i++)
                Panne.subscribe(req, truck.pannes[i].id)

            return res.ok(truck)

        })
    },

    trucks:function(req,res){
        if (req.user.right === "Administrateur") {
            Truck.find({}).populate("pannes").exec(function (err, trucks) {
                if (err) return res.serverError({error: 'impossible de récupérer les camions'})

                if (!trucks) return res.ok("il n'y a pas de camion")
                if (req.isSocket) {
                    for (var i = 0; i < trucks.length; i++) {
                        Truck.subscribe(req, trucks[i].id)
                        for( j = 0; j < trucks[i].pannes.length; j++)
                            Panne.subscribe(req, trucks[i].pannes[j].id)
                    }

                    return res.status(200).json(trucks)
                } else return res.ok(trucks)
            })
        }else if(req.user.right === "Gestionnaire") {
            Truck.find({company: req.user.company}).populate("pannes").exec(function (err, trucks) {
                if (err) return res.serverError({error: 'impossible de récupérer les camions'})

                if (!trucks) return res.ok("Cette entreprise n'a pas de camion")
                if (req.isSocket) {
                    for (var i = 0; i < trucks.length; i++) {
                        Truck.subscribe(req, trucks[i].id)
                        for( j = 0; j < trucks[i].pannes.length; j++)
                            Panne.subscribe(req, trucks[i].pannes[j].id)
                    }

                    return res.status(200).json(trucks)
                } else return res.ok(trucks)

            })
        }else if(req.user.right === "Réparateur"){
            Truck.find({state:"En Panne"}).populate("pannes").exec(function (err, trucks) {
                if(err) return res.serverError
                if(!trucks) return res.ok("Aucun camion n'est en panne tout va bien")

                if(req.isSocket) {
                    for ( i = 0; i < trucks.length; i++ ){
                        Truck.subscribe(req,trucks[i].id)
                        for( j = 0; j < trucks[i].pannes.length; j++)
                            Panne.subscribe(req, trucks[i].pannes[j].id)
                    }

                    return res.ok(trucks)
                }else return res.ok(trucks)

            })
        }else return res.status(403).json({error: "You can't get the trucks dude"})
    },

    // todo relation one to one si on change l'id du currentUser il faut que l'ancien user et le nouveau le sache

    update:function(req,res){
        var name = req.param("name");
        var location = req.param("location");
        var running = req.param("running");
        var state = req.param("state");
        var company = req.param("id_company");
        var newUser = req.param("current_user");

        if(newUser === "null")
            newUser = null
        if(company === "null")
            company = null
        Truck.findOne({id:req.param("id")}).exec(function(err,truck){
            if(err) return res.serverError({error:"erreur serveur"});

            if(truck){
                if(location && !ToolsService.isEmpty(location)){
                    truck.location = req.param("location")
                }
                if(name && !ToolsService.isEmpty(name)){
                    truck.name = name
                }
                if(ToolsService.isBoolean(running)){
                    truck.running = ToolsService.getBoolean(running)
                }
                if(state && !ToolsService.isEmpty(state)){
                    truck.state = state
                }
                if(company && !ToolsService.isEmpty(company)){
                    truck.company = company
                }
                if(newUser && !ToolsService.isEmpty(newUser)){
                    if(truck.currentUser === newUser){
                        console.log("modification du user lié à ce truck");
                        User.update(truck.currentUser, {truck:null}).exec(function (req, user) {});
                        User.update(newUser, {truck:truck.id}).exec(function (req, user) {});
                        truck.currentUser = newUser
                    }
                }
                truck.save(function(err){
                    if(err) return res.serverError({error:"impossible de sauvegarder en base"});
                    Truck.publishUpdate(truck.id,{truck:truck});

                    return res.ok({message:"truck bien update"})
                })
            }else return res.badRequest({error:"truck not found"})
        })
    }
};

