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
                Truck.update(user.truck, {currentUser:user.id}).exec(function (err,truck) {});

/*                Truck.findOne({id:user.truck}).exec(function(err,truck){
                    if(err) return res.serverError({error: "impossible de retrouver le truck pour faire l'association"});

                    if(truck){

                        /!*truck.currentUser = user.id

                        truck.save(function(err){
                            if(err) return res.serverError({error: "impossible de faire l'association avec le truck"});

                            return res.json(201, {user:user})
                        })*!/
                    }else return res.notFound({error:"le truck à cet id n'existe pas"})
                })*/
                res.json(200, {user: user, token: jwToken.issue({id: user.id})});
            }else return res.json(500, {error: "impossible de créer le camion"})
        });
    },

    // todo relation one to one si on change l'id du truck il faut que l'ancien truck et le nouveau le sache

    update: function (req, res) {
        var new_id_truck = req.param("id_truck");
        var old_id_truck = req.user.truck;

        User.update(req.body).exec(function (err, user) {
            if(err) return res.serverError({error:"impossible d'update"});

            if(user){
                if(new_id_truck === old_id_truck){
                    Truck.update(old_id_truck, {currentUser:null}).exec(function (err, truck) {});
                    Truck.update(new_id_truck, {currentUser:user.id}).exec(function (err, truck) {})
                }
            }else return res.notFound()

            return res.ok({user:user})
        })
    }
};

