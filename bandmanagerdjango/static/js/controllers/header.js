//-----------Header--------------------------------------------
angular.module('BandManagerApp').controller('HeaderController', ['$scope', '$location', function (sc, loc) {
    sc.isActive = function (viewLocation) {
        return viewLocation === loc.path();
    };
}]);