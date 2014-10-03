//----------Home------------------------------------------------
angular.module('BandManagerApp').controller('HomeController', ['$scope', '$location', function (sc, loc) {
    sc.homeScreenButtonClass = "homeScreenButton col-xs-12";
    sc.go = function (path) {
        loc.path(path);
    };



}]);

