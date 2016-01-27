/**
 * PanneController
 *
 * @description :: Server-side logic for managing Pannes
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var panneModel = require('../models/Panne.js');


module.exports = {


    create: function(req,res){
        //panneModel.comment = req.param('comment');
        Panne.create(req.body).exec(function(err,panne){
            sails.log.debug("PANNE CREATE CALL" + err);
            if(err) return res.serverError
            if(panne){
                sails.log.debug("=> Creation PANNE: Succès");
                console.log(panne);
                Panne.subscribe(req,panne.id);
                Truck.findOne(panne.truck).populate('pannes').exec(function (err, truck) {
                    if (err) return res.serverError

                    if (truck){
                        truck.pannes.push(panne.id)
                        truck.state = "En Panne"
                        truck.save(function(err){
                            if(err) return res.serverError
                            Truck.publishUpdate(truck.id,{truck:truck,panne:panne})
                            sails.log.debug("PANNE CREATE OK");
                            return res.status(201).json({created:truck})
                        })
                    }else res.notFound
                })
                //return res.status(201).json({created:truck})
            }else res.serverError
            //sails.log.debug("=> Creation PANNE: Erreur");
            //return res.status(400).json({err:"create Panne: Erreur. "+err})
        })
    },


    //todo quand on passe le state à terminé est ce que l'on enleve de camion la panne ou pas ?
    update:function(req,res){
        var comment = req.param("comment");
        var priority = req.param("priority");
        var state = req.param("state");
        var typePanne = req.param("type_panne");
        var repairman = req.param("idRepairman");
        sails.log.debug(repairman);
        Panne.findOne({id:req.param("id_panne")}).exec(function(err,panne) {
            if (panne) {
                if(repairman && !ToolsService.isEmpty(repairman)){
                    if(!panne.idRepairman){
                        User.findOne({id:repairman}).exec(function (err, user) {
                            if(err) return res.notFound
                            if(user){
                                panne.idRepairman = user.id
                                panne.save(function (err) {
                                })
                                console.log(panne.idRepairman)
                            }
                        })
                    }/*else {
                            User.findOne({id:repairman}).exec(function (err, user) {
                            if(err) return res.notFound
                            if(user){
                                user.pannes.push(panne.id)
                            }
                        })
                    }*/
                }
                if(comment && !ToolsService.isEmpty(comment)){
                    panne.comment = comment;
                }
                if(priority && !ToolsService.isEmpty(priority)){
                    panne.priority = priority
                }
                if(state && !ToolsService.isEmpty(state)){
                    if(panne.state != state){
                        if(state == "Terminée"){
                            Truck.findOne({id:panne.truck}).populate("pannes").exec(function (err, truck) {
                                if(err) return res.serverError
                                if (truck){
                                    //var index = truck.pannes.indexOf(req.param("id"))
                                    //if(index > -1)
                                    //    truck.panne.splice(index,1)
                                    if(truck.pannes.length == 1){
                                        truck.state = "Ok"
                                    }else {
                                        for (i = 0; i < truck.pannes.length; i++){
                                            if(truck.pannes[i].state == "Terminée" ){
                                                truck.state = "Ok"
                                            }else {
                                                truck.state = "En Panne"
                                                break;
                                            }
                                        }
                                    }
                                    truck.save(function (err) {
                                        if(err){
                                            return res.serverError
                                        }
                                        Truck.publishUpdate(truck.id,{truck:truck})
                                        return res.ok(truck)
                                    })
                                }else {
                                    return res.notFound.json({err:"truck correspondant à l'id de la panne introuvable"})
                                }
                            })
                        }else if(state == "Déclarée"){
                            panne.idRepairman = null
                        }
                        panne.state = state
                    }
                }
                if(typePanne && !ToolsService.isEmpty(typePanne)){
                    panne.typePanne = typePanne
                }
                panne.save(function (err) {
                    if (err) {
                        console.log(err);
                        sails.log.debug("=> Edit PANNE: Erreur");
                        return res.status(400).json({err: "edit Panne: Erreur"})
                    }
                    sails.log.debug("=> Edit PANNE: Succès");
                    Panne.publishUpdate(panne.id,{panne:panne});
                    return res.status(200).json({updated:panne});
                })
            }else return res.notFound({error:"panne not found"})
        })
    },

    destroy:function(req,res){
        Panne.findOne({id:req.param("id")}).exec(function (err, panne) {
            if (err) return res.serverError
            if(panne){
                User.findOne({id:panne.idRepairman}).populate("pannes").exec(function (err, user) {
                    if(err) return res.serverError

                    if(user){
                        for(i=0; i < user.pannes.length; i++){
                            if(user.pannes[i].id == panne.id)
                                user.pannes.splice(i,1)
                        }
                    }
                })
                Truck.findOne({id:panne.truck}).populate("pannes").exec(function (err, truck) {
                    if(err) return res.serverError
                    if (truck){
                        console.log(truck.pannes)
                        for(i = 0; i <truck.pannes.length; i++){
                            if(truck.pannes[i].id == req.param("id")){
                                truck.pannes.splice(i,1)
                            }
                        }
                        console.log(truck.pannes.length)
                        if(truck.pannes.length == 0){
                            truck.state = "Ok"
                        }
                        truck.save(function (err) {
                            if(err){
                                return res.serverError
                            }
                            Panne.destroy({id:req.param("id")}).exec(function (err) {
                                if(err) return res.serverError
                                Panne.publishDestroy(req.param("id"));
                                Truck.publishUpdate(truck.id,{truck:truck})
                                return res.ok(truck)
                            })
                        })
                    }else {
                        Panne.destroy({id:req.param("id")}).exec(function (err) {
                            if(err) return res.serverError
                            return res.ok()
                        })
                        //return res.notFound.json({err:"truck correspondant à l'id de la panne introuvable"})
                    }
                })
            }else return res.status(404).json({err:"panne à cette id inexistante"})
        })
    }

};

