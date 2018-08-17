var T = {};

T.app = Handlebars.template({"1":function(depth0,helpers,partials,data) {
    var stack1, alias1=this.lambda, alias2=this.escapeExpression;

  return "        <div class=\"tickerSubContainer\">\r\n            <div class=\"tickerFirstSet\">\r\n                <div class=\"top\">\r\n                    <div class=\"text\">"
    + alias2(alias1((depth0 != null ? depth0['text'] : depth0), depth0))
    + "</div>\r\n                    <div class=\"value\">"
    + alias2(alias1((depth0 != null ? depth0['value'] : depth0), depth0))
    + "</div>\r\n                    <div class=\"currency\">"
    + alias2(alias1((depth0 != null ? depth0['currency'] : depth0), depth0))
    + "</div>\r\n                </div>\r\n                <div class=\"bottomContainer\">\r\n                    <div class=\"tTime\">"
    + alias2(alias1((depth0 != null ? depth0['tTime'] : depth0), depth0))
    + "</div>\r\n"
    + ((stack1 = helpers['if'].call(depth0,(depth0 != null ? depth0['redOrGreen'] : depth0),{"name":"if","hash":{},"fn":this.program(2, data, 0),"inverse":this.program(4, data, 0),"data":data})) != null ? stack1 : "")
    + "                </div>\r\n            </div>\r\n        </div>\r\n";
},"2":function(depth0,helpers,partials,data) {
    var alias1=this.lambda, alias2=this.escapeExpression;

  return "                    <div class=\"calculation\">\r\n                        <font color=\"green\">"
    + alias2(alias1((depth0 != null ? depth0['calculation'] : depth0), depth0))
    + "</font>\r\n                    </div>\r\n                    <div class=\"percentage\">\r\n                        <font color=\"green\">"
    + alias2(alias1((depth0 != null ? depth0['percentage'] : depth0), depth0))
    + "</font>\r\n                    </div>\r\n";
},"4":function(depth0,helpers,partials,data) {
    var alias1=this.lambda, alias2=this.escapeExpression;

  return "                    <div class=\"calculation\">\r\n                        <font color=\"red\">"
    + alias2(alias1((depth0 != null ? depth0['calculation'] : depth0), depth0))
    + "</font>\r\n                    </div>\r\n                    <div class=\"percentage\">\r\n                        <font color=\"red\">"
    + alias2(alias1((depth0 != null ? depth0['percentage'] : depth0), depth0))
    + "</font>\r\n                    </div>\r\n";
},"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
    var stack1;

  return "<div class=\"tickerContainer\">\r\n"
    + ((stack1 = helpers['each'].call(depth0,depth0,{"name":"each","hash":{},"fn":this.program(1, data, 0),"inverse":this.noop,"data":data})) != null ? stack1 : "")
    + "    </div>";
},"useData":true});