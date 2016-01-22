/**
 * Created by Bastien on 08/01/2016.
 */

/**
 * isAuthorized
 *
 * @description :: Policy to check if user is authorized with JSON web token
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Policies
 */

module.exports = function (req, res, next) {
    var token;

    if (req.headers && req.headers.authorization) {
        var parts = req.headers.authorization.split(' ');
        if (parts.length == 2) {
            var scheme = parts[0],
                credentials = parts[1];

            if (/^Bearer$/i.test(scheme)) {
                token = credentials;
            }
        } else {
            return res.json(401, {err: 'Format is Authorization: Bearer [token]'});
        }
    } else if (req.param('token')) {
        token = req.param('token');
        // We delete the token from param to not mess with blueprints
        delete req.query.token;
    } else {
        return res.json(401, {err: 'No Authorization header was found'});
    }

    jwToken.verify(token, function (err, token) {
        if (err) return res.json(401, {err: 'Invalid Token!'});
        req.token = token; // This is the decrypted token or the payload you provided
        User.findOne({id:req.token.id}).exec(function(err,user){
            if(err) return res.serverError
            req.user = user
            console.log("is_authorized")
            console.log(req.user)
            next();
        })
    });
};