/**
 * CompanyController
 *
 * @description :: Server-side logic for managing companies
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {

    getTrucksByCompany:function(req,res){
        if(req.user.right == "Gestionnaire" && req.user.company){
            console.log("getTrucksByCompany")
            Truck.find({company:req.user.company})
                .populate('pannes').exec(function(err,trucks){
                    if(trucks){
                        sails.log.debug("=> getTrucksByCompany: Succès");
                        console.log(trucks);
                        for(var i=0;i<trucks.length;i++){
                            Truck.subscribe(req, trucks[i].id)
                            Panne.subscribe(req, trucks[i].pannes.id)
                        }
                        return res.status(200).json({trucks:trucks})
                    }
                    sails.log.debug("=> getTrucksByCompany: Erreur");
                    return res.status(400).json({err:"get Company: Erreur"})
                })
        }else return res.forbidden({err:"you are not gestionnaire of your company"})
    }
};

