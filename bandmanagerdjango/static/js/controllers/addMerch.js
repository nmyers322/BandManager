//----------Add Merch------------------------------------------------
angular.module('BandManagerApp').controller('AddMerchController', ['$scope', '$http', function (sc, ht) {

    var defaultOptions = [
        { description: null, price: null, quantity: null }
    ];
    sc.options = angular.copy(defaultOptions);
    sc.showDesc = false;
    sc.showSuccess = false;

    //Add a product 
    sc.addMerch = function () {
        //add numSold to options array
        var newOptions = [];
        for (i = 0; i < sc.options.length; i++) {
            newOptions.push({
                description: sc.options[i].description,
                price: sc.options[i].price,
                quantity: sc.options[i].quantity,
                numSold: 0,
                numTraded: 0
            });
        }
        //save to server
        var addMerchRequest = ht({
            method: "post",
            url: "/json/add_merch/" + sc.$storage.id,
            data:{
                name: sc.product.name,
                options: newOptions,
                notes: sc.product.notes
            }
        }).success( function (data){
            //show success message at top
            sc.success = { name: (sc.product.name) };
            sc.showSuccess = true;

            //reset all form fields
            sc.product.name = null;
            sc.options = angular.copy(defaultOptions);
            sc.product.notes = null;
            sc.product.image = null;
        }).error (function (data){
            console.log(data)
        });
    };

    //This section handles the product options (add one if button clicked)
    sc.addOption = function () {
        sc.options.push({
            description: "",
            price: "",
            quantity: ""
        });
        sc.showDesc = true;
    };
}]);

