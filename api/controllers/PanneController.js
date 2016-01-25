/**
 * PanneController
 *
 * @description :: Server-side logic for managing Pannes
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var panneModel = require('../models/Panne.js');


module.exports = {

//todo régler le probleme quand on fait notre propre create d'éléments invalides

    create: function(req,res){
        //panneModel.comment = req.param('comment');
        Panne.create(req.body).exec(function(err,panne){
            if(panne){
                sails.log.debug("=> Creation PANNE: Succès");
                console.log(panne);
                Panne.subscribe(req,panne.id);
                Truck.findOne(panne.truck).exec(function (err, truck) {
                    if (err) return res.serverError

                    if (truck){
                        truck.pannes.push(panne.id)
                        truck.state = "En Panne"
                        truck.save(function(err){
                            if(err) return res.serverError
                            truck.subscribe(req,truck.id)
                            return res.ok
                        })
                    }
                })
                return res.status(201).json({created:panne})
            }
            sails.log.debug("=> Creation PANNE: Erreur");
            return res.status(400).json({err:"create Panne: Erreur. "+err})
        })
    },


    update:function(req,res){
        var comment = req.param("comment");
        var priority = req.param("priority");
        var state = req.param("state");
        var typePanne = req.param("type_panne");
        Panne.findOne({id:req.param("id_panne")}).exec(function(err,panne) {
            if (panne) {
                if(comment && !ToolsService.isEmpty){
                    panne.comment = comment;
                }
                if(priority && !ToolsService.isEmpty){
                    panne.priority = priority
                }
                if(state && !ToolsService.isEmpty){
                    panne.state = state
                }
                if(typePanne && !ToolsService.isEmpty){
                    panne.typePanne = typePanne
                }

                panne.save(function (err) {
                    if (err) {
                        sails.log.debug("=> Edit PANNE: Erreur");
                        return res.status(400).json({err: "edit Panne: Erreur"})
                    }
                    sails.log.debug("=> Edit PANNE: Succès");
                    console.log(panne);
                    Panne.publishUpdate(panne.id, panne);
                    return res.status(200).json({updated:panne});
                })
            }else return res.notFound({error:"panne not found"})
        })
    },

    destroy:function(req,res){
        Panne.findOne({id:req.param("id")}).exec(function (err, truck) {
            if (err) return res.serverError

            if(truck){
                truck.pannes
            }
        })
    }

};

