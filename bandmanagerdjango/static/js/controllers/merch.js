//----------Merch------------------------------------------------
angular.module('BandManagerApp').controller('MerchController', ['$scope', '$localStorage', '$http', '$rootScope', '$location', function (sc, locStor, ht, rs, loc) {
 
    sc.getMerch = function() {
        //get the merch
        var merchRequest = ht({
            method: 'post',
            url: '/json/merch/' + sc.$storage.id,
            data: {}
        }).success( function(merch) {
            //success.. populate local data
            sc.$storage.merch = [];
            for(i=0;i<merch.length;i++){
                sc.$storage.merch.push({
                    name: merch[i].fields.name,
                    options: [],
                    notes: merch[i].fields.notes,
                    pk: merch[i].pk
                });
            }
            //now get the merch options
            merchOptRequest = ht({
                method: 'post',
                url: '/json/merch_options/' + sc.$storage.id,
                data: {}
            }).success( function(merchOptions) {
                for(i=0;i<merchOptions.length;i++){
                    var pk = merchOptions[i].fields.merch;
                    for(j=0;j<sc.$storage.merch.length;j++){
                        if(sc.$storage.merch[j].pk == pk){
                            var id = j;
                        }
                    }
                    sc.$storage.merch[id].options.push({
                        description: merchOptions[i].fields.description,
                        price: merchOptions[i].fields.price,
                        quantity: merchOptions[i].fields.quantity,
                        numSold: merchOptions[i].fields.numSold,
                        numTraded: merchOptions[i].fields.numTraded,
                        pk: merchOptions[i].pk
                    });
                }

                //set defaults
                sc.showStats = false;
                sc.accordion = [];
                sc.innerAccordion = [];
                sc.inStock = [];
                for (i = 0; i < sc.$storage.merch.length; i++) {
                    //set all product accordions to closed
                    sc.accordion[i] = "panel-collapse collapse";
                    //set all product options to closed
                    //and set all products as in stock or not
                    sc.innerAccordion.push([]);
                    sc.inStock.push([]);
                    for (j = 0; j < sc.$storage.merch[i].options.length; j++) {
                        sc.innerAccordion[i].push("panel-collapse collapse");
                        if(sc.$storage.merch[i].options[j].quantity > 0){
                            sc.inStock[i].push(true);
                        } else {
                            sc.inStock[i].push(false);
                        }
                    }
                }
            }).error(function(data){
                window.open().document.write(data);
            });
        }).error( function(data){
            window.open().document.write(data);
        });
    };
    sc.getMerch();
        


    //open one of the merch items
    sc.openAccordion = function (index) {
        sc.showStats = false;
        sc.showOptions = false;
        sc.showDeleteConfirm = false;
        sc.showAddToStockConfirm = false;
        sc.showChangePriceConfirm = false;
        //accordion is open already, so close it
        if (sc.accordion[index] == "panel-collapse collapse in") {
            sc.accordion[index] = "panel-collapse collapse";
            //accordion is closed. open it, and close all others
        } else {
            for (i = 0; i < sc.$storage.merch.length; i++) {
                sc.accordion[i] = "panel-collapse collapse";
            }
            sc.accordion[index] = "panel-collapse collapse in";
        }

    };
    //open the item's option
    sc.openInnerAccordion = function (index, innerIndex) {
        sc.showStats = false;
        sc.showOptions = false;
        sc.showDeleteConfirm = false;
        sc.showAddToStockConfirm = false;
        sc.showChangePriceConfirm = false;
        //accordion is open already, so close it
        if (sc.innerAccordion[index][innerIndex] == "panel-collapse collapse in") {
            sc.innerAccordion[index][innerIndex] = "panel-collapse collapse";
            //accordion is closed. open it, and close all others
        } else {
            for (i = 0; i < sc.$storage.merch[index].options.length; i++) {
                sc.innerAccordion[index][i] = "panel-collapse collapse";
            }
            sc.innerAccordion[index][innerIndex] = "panel-collapse collapse in";
        }

    };
    //close all items
    sc.closeAllAccordions = function () {
        sc.showStats = false;
        for (i = 0; i < sc.$storage.merch.length; i++) {
            for (j = 0; j < sc.$storage.merch[i].options.length; j++){
                sc.innerAccordion[i][j] = "panel-collapse collapse";
            }
            sc.accordion[i] = "panel-collapse collapse";
        }
    };
    //does the product have options?
    sc.ifProductOptions = function (product) {
        if (product.options.length > 1) {
            return true;
        } else {
            return false;
        }
    };

    //sell the item for cash
    sc.sellCash = function (product, option) {
        //get index of item in the list
        var index = sc.$storage.merch.indexOf(product);
        //get pk of the item
        var pk = sc.$storage.merch[index].pk
        //the item's description
        var description = "";
        //determine if the product has options
        if (option != null) {
            //it does. get the index of the option item
            var innerIndex = sc.$storage.merch[index].options.indexOf(option);
            //get the pk of the item
            var optionPk = sc.$storage.merch[index].options[innerIndex].pk;
            description = " (" + sc.$storage.merch[index].options[innerIndex].description + ") ";
        } else {
            //the item has no options. use the first option as default
            var innerIndex = 0;
            //get the pk of the option
            var optionPk = sc.$storage.merch[index].options[0].pk;
        }
        //collapse the stats menu
        sc.showStats = false;
        //collapse the options menu
        sc.showOptions = false;
        //prepare description for success msg
        var timeStamp = new Date();
        var descString = "Sold one " + sc.$storage.merch[index].name + description;
        //the backend will:
        //   deduct stock, add cash to balance, create expense record, add to numSold, add to numTraded
        var sellMerchRequest = ht({
            method: "post",
            url: "/json/sell_trade_merch/" + sc.$storage.id,
            data: {
                merchPk: pk,
                merchOptionPk: optionPk,
                sellOrTrade: "sell",
                timeStamp: timeStamp,
                desc: descString,
                location: sc.$storage.currentLocation
            }
        }).success( function (data) {
            //update the merch data locally
            sc.getMerch();
            //show success msg
            sc.successMessage = "You sold one " + sc.$storage.merch[index].name + description + " for cash.";
            sc.showSuccess = true;
            sc.closeAllAccordions();

        }).error( function (data) {
            console.log(data)
        });
    };

    //give away/ trade an item
    sc.trade = function (product, option) {
       //get index of item in the list
        var index = sc.$storage.merch.indexOf(product);
        //get pk of the item
        var pk = sc.$storage.merch[index].pk
        //the item's description
        var description = "";
        //determine if the product has options
        if (option != null) {
            //it does. get the index of the option item
            var innerIndex = sc.$storage.merch[index].options.indexOf(option);
            //get the pk of the item
            var optionPk = sc.$storage.merch[index].options[innerIndex].pk;
            description = " (" + sc.$storage.merch[index].options[innerIndex].description + ") ";
        } else {
            //the item has no options. use the first option as default
            var innerIndex = 0;
            //get the pk of the option
            var optionPk = sc.$storage.merch[index].options[0].pk;
        }
        //collapse the stats menu
        sc.showStats = false;
        //collapse the options menu
        sc.showOptions = false;
        //the backend will:
        //   deduct stock, add cash to balance, create expense record, add to numSold, add to numTraded
        var sellMerchRequest = ht({
            method: "post",
            url: "/json/sell_trade_merch/" + sc.$storage.id,
            data: {
                merchPk: pk,
                merchOptionPk: optionPk,
                sellOrTrade: "trade"
            }
        }).success( function (data) {
            console.log(data)
            //update the merch data locally
            sc.getMerch();
            //show success msg
            sc.successMessage = "You traded one " + sc.$storage.merch[index].name + description;
            sc.showSuccess = true;
            sc.closeAllAccordions();
        }).error( function (data) {
            console.log(data)
        });

    };

    //delete an item
    sc.deleteItem = function(index, innerIndex){
        //get pk of the item
        var pk = sc.$storage.merch[index].pk
        var optionPk = sc.$storage.merch[index].options[innerIndex].pk;
        //send the delete request
        var deleteRequest = ht({
            method: 'post',
            url: "/json/delete_item/" + sc.$storage.id,
            data: {
                merchPk: pk,
                merchOptionPk: optionPk,

            }
        }).success( function (data) {
            //the item was deleted.
            //close the confirm panel
            sc.showDeleteConfirm = false;
            //close the options panel
            sc.showOptions = false;
            //show a success message
            sc.successMessage = "You deleted the item.";
            sc.showSuccess = true;
            sc.closeAllAccordions();
            //update the merch locally
            sc.getMerch();
        }).error( function (data) {
            window.open().document.write(data);
        });
    };
    //add to stock
    sc.addToStock = function(index, innerIndex){
        var num = sc.add.toStock;
        //get pk of the item
        var pk = sc.$storage.merch[index].pk
        var optionPk = sc.$storage.merch[index].options[innerIndex].pk;
        //send the delete request
        var deleteRequest = ht({
            method: 'post',
            url: "/json/add_to_stock/" + sc.$storage.id,
            data: {
                numToAddToStock: num,
                merchPk: pk,
                merchOptionPk: optionPk,
            }
        }).success( function (data) {
            //the item was deleted.
            //close the confirm panel
            sc.showAddToStockConfirm = false;
            //close the options panel
            sc.showOptions = false;
            //show a success message
            sc.successMessage = "You successfully added the item(s).";
            sc.showSuccess = true;
            sc.closeAllAccordions();
            //update the merch locally
            sc.getMerch();
        }).error( function (data) {
            window.open().document.write(data);
        });
    };
    //change price
    sc.changePrice = function(index, innerIndex){
        var price = sc.add.price;
        //get pk of the item
        var pk = sc.$storage.merch[index].pk
        var optionPk = sc.$storage.merch[index].options[innerIndex].pk;
        //send the delete request
        var deleteRequest = ht({
            method: 'post',
            url: "/json/change_price/" + sc.$storage.id,
            data: {
                merchPk: pk,
                merchOptionPk: optionPk,
                newPrice: price,
            }
        }).success( function (data) {
            //the item was deleted.
            //close the confirm panel
            sc.showChangePriceConfirm = false;
            //close the options panel
            sc.showOptions = false;
            //show a success message
            sc.successMessage = "You successfully changed the price.";
            sc.showSuccess = true;
            sc.closeAllAccordions();
            //update the merch locally
            sc.getMerch();
        }).error( function (data) {
            window.open().document.write(data);
        });
    };

    //show item stats
    sc.stats = function () {
        if (sc.showStats)
            sc.showStats = false;
        else {
            sc.showStats = true;
            sc.showOptions = false;
            sc.showDeleteConfirm = false;
            sc.showAddToStockConfirm = false;
            sc.showChangePriceConfirm = false;
        }
            
    };

    sc.options = function () {
        if(sc.showOptions){
            sc.showOptions = false;
            sc.showDeleteConfirm = false;
            sc.showAddToStockConfirm = false;
            sc.showChangePriceConfirm = false;
        } else {
            sc.showOptions = true;
            sc.showStats = false;
        }
            
    }

    //go to url
    sc.go = function (path) {
        loc.path(path);
    };

    //show the confirm panels:
    //default values
    sc.showDeleteConfirm = false;
    sc.showAddToStockConfirm = false;
    sc.showChangePriceConfirm = false;
    //show the delete item panel
    sc.deleteConfirm = function () {
        sc.showDeleteConfirm = true;
        sc.showAddToStockConfirm = false;
        sc.showChangePriceConfirm = false;
    };
    //show the add to stock panel
    sc.addToStockConfirm = function () {
        sc.showDeleteConfirm = false;
        sc.showAddToStockConfirm = true;
        sc.showChangePriceConfirm = false;
    };
    //show the change price confirm panel
    sc.changePriceConfirm = function () {
        sc.showDeleteConfirm = false;
        sc.showAddToStockConfirm = false;
        sc.showChangePriceConfirm = true;
    };

    //set defaults
    sc.add = {
        toStock: '',
        price: ''
    };

    //enable or disable buttons
    sc.checkPrice = function () {
        var regex = /^\d{0,8}(\.\d{1,4})?$/i;
        var price = sc.add.price;
        if(price.length > 0 && price.match(regex) != null){
            $('#newPriceButton').removeClass('disabled');
        } else {
            $('#newPriceButton').addClass('disabled');
        }
    };

    sc.checkAddStock = function () {
        var regex = /^\d{0,8}$/i;
        var toStock = sc.add.toStock;
        if(toStock.length > 0 && toStock.match(regex) != null){
            $('#addStockButton').removeClass('disabled');
        } else {
            $('#addStockButton').addClass('disabled');
        }
    };
}]);

