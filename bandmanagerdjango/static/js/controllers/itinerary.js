//---------Itinerary--------------------------------
angular.module('BandManagerApp').controller('ItineraryController', ['$scope', '$localStorage', '$window', 'ShowsFactory', 'SchedulesFactory', '$location', function (sc, locStor, win, shf, scf, loc) {
    //get the shows
    var shows = shf.query({'id': sc.$storage.id},function(data){
        sc.$storage.shows = [];
        for(i=0;i<shows.length;i++){
            sc.$storage.shows.push({
                dateOfShow: shows[i].fields.dateOfShow,
                venue: shows[i].fields.venue,
                address: shows[i].fields.address,
                cityState: shows[i].fields.cityState,
                venue: shows[i].fields.venue,
                cost: shows[i].fields.cost,
                promoter: shows[i].fields.promoter,
                promoterEmail: shows[i].fields.promoterEmail,
                promoterPhone: shows[i].fields.promoterPhone,
                scheduleItems: [],
                drinks: shows[i].fields.drinks,
                meals: shows[i].fields.meals,
                guarantee: shows[i].fields.guarantee,
                parking: shows[i].fields.parking,
                lodging: shows[i].fields.lodging,
                lodgingAddress: shows[i].fields.lodgingAddress,
                guestList: shows[i].fields.guestList,
                notes: shows[i].fields.notes,
                pk: shows[i].pk
            });
        }
    });
    //get the schedules
    var schedules = scf.query({'id': sc.$storage.id},function(data){
        for(i=0;i<schedules.length;i++){
            var pk = schedules[i].fields.show;
            for(j=0;j<sc.$storage.shows.length;j++){
                if(sc.$storage.shows[j].pk == pk){
                    var id = j;
                }
            }
            sc.$storage.shows[id].scheduleItems.push({
                time: schedules[i].fields.time,
                description: schedules[i].fields.description,
                website: schedules[i].fields.website
            });
        }
    });


    //return a link to google maps
    sc.mapsUrl = function (address, cityState) {
        var url = "https://www.google.com/maps/dir//";
        url = url + address.replace(" ", "+") + "+" + cityState.replace(" ", "+");
        win.location.href = url;
    };
    //delete a show with the button
    sc.deleteShow = function (show) {
        //var index = sc.$storage.shows.indexOf(show);
        //sc.$storage.shows.splice(index, 1);
    };

    //show today only or show all shows
    sc.showAllButton = true;
    sc.category = 0;//today
    sc.showAll = function (bool) {
        //make sure the button is visible or hidden
        sc.showAllButton = !bool;
        if (!bool) {
            //show today only
            sc.category = 0; //today only
        } else {
            sc.category = 1; //show all
        }

    };

    //call the promoter
    sc.call = function (number) {
        win.open('tel:' + number, '_top');
    };
    //email the promoter
    sc.email = function (email) {
        win.open('mailto:' + email, '_top');
    };

    //go to url
    sc.go = function (path) {
        loc.path(path);
    };
}]);

