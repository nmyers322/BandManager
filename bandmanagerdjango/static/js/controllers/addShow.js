//----------Add Show--------------------------------------
angular.module('BandManagerApp').controller('AddShowController', ['$scope', '$localStorage', '$http', function (sc, locStor, ht) {

    sc.scheduleItems = [];
    sc.newShow = [];
    sc.newShow.dateOfShow = null;
    sc.showSuccess = false;
    var defaultDesc = ["Load in", "Sound check", "Doors open", ""];
    var numScheduleItemsAdded = 0;
    var showWebSite = false;

    //Add a show 
    sc.addShow = function () {
        //get date
        var msec = Date.parse(sc.newShow.dateOfShow);
        var newDate = new Date(msec);
        //save to server
        var addShowRequest = ht({
            method: "post",
            url: "/json/add_show/" + sc.$storage.id,
            data: {
                dateOfShow: newDate,
                venue: sc.newShow.venue,
                address: sc.newShow.address,
                cityState: sc.newShow.cityState,
                venue: sc.newShow.venue,
                cost: sc.newShow.cost,
                promoter: sc.newShow.promoter,
                promoterEmail: sc.newShow.promoterEmail,
                promoterPhone: sc.newShow.promoterPhone,
                drinks: sc.newShow.drinks,
                meals: sc.newShow.meals,
                guarantee: sc.newShow.guarantee,
                parking: sc.newShow.parking,
                lodging: sc.newShow.lodging,
                lodgingAddress: sc.newShow.lodgingAddress,
                guestList: sc.newShow.guestList,
                notes: sc.newShow.notes,
                scheduleItems: sc.scheduleItems
            }
        });
        addShowRequest.success( function (data){
            //show success message at top
            sc.success = { dateOfShow: (sc.newShow.dateOfShow), venue: sc.newShow.venue };
            sc.showSuccess = true;
            //reset all form fields
            sc.newShow.dateOfShow = null;
            sc.newShow.venue = null;
            sc.newShow.address = null;
            sc.newShow.cityState = null;
            sc.newShow.venue = null;
            sc.newShow.cost = null;
            sc.newShow.promoter = null;
            sc.newShow.promoterEmail = null;
            sc.newShow.promoterPhone = null;
            sc.scheduleItems = [];
            sc.newShow.drinks = null;
            sc.newShow.meals = null;
            sc.newShow.guarantee = null;
            sc.newShow.parking = null;
            sc.newShow.lodging = null;
            sc.newShow.lodgingAddress = null;
            sc.newShow.guestList = null;
            sc.newShow.notes = null;
            numScheduleItemsAdded = 0;
            console.log(data)
        }).error( function (data){
            console.log(data);
        });
    };

    //This section handles the Schedule items (add one if button clicked)

    sc.addScheduleItem = function () {
        if (numScheduleItemsAdded < 3) {
            showWebSite = false;
        } else {
            showWebSite = true;
        }
        sc.scheduleItems.push({
            time: null,
            description: defaultDesc[numScheduleItemsAdded],
            itemPlaceHolderDesc: "E.g. Band name",
            itemPlaceHolderWebsite: "E.g. bandcamp.com/band-name",
            showWebSite: showWebSite
        });
        if (numScheduleItemsAdded < 3) {
            numScheduleItemsAdded = numScheduleItemsAdded + 1;
        }
    };
    //This will add a website option on the schedule items if desc is typed into
    sc.changeShowWebSite = function (idx) {
        sc.scheduleItems[idx].showWebSite = true;
    };
}]);

