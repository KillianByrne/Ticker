/*global _,$,Backbone,Model,T,getComponentDefinition */
/// <reference path="../classes/componentDefinition.js"/>
/// <reference path="../templates/combined.js" />

var App = Backbone.View.extend({
    initialize: function () {
        var self = this;
        $.getJSON('/apps/1_Basic/data.json', function (data) {
            console.log(data);
            self.$el.html(T.app(data.rows));
        }).fail(function (data) {
            console.log("error loading JSON", data);
        });

        
    },
    
}, {
    getComponentDefinition: getComponentDefinition
});