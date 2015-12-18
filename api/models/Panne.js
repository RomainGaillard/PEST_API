/**
* Panne.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {

  attributes: {
    state: {
      type: 'string',
      enum: ['Déclarée','En cours', 'Terminée', 'Indéterminée'],
      defaultsTo: 'Déclarée'
    },
    priority:{
      type: 'string',
      enum:['Faible','Moyenne','Forte'],
      defaultsTo:'Moyenne'
    },
    comment:{
      type:'string'
    }
  }
};
