//--------Application-----------------------
angular.module('BandManagerApp').controller('ApplicationController', 
    ['$scope', '$localStorage', 'BandIdFactory', 'BandFactory', '$rootScope', '$http', function (sc, locStor, bif, bf, rs, ht) {
    sc.$storage = locStor.$default({
        //data model
        id: -1,
        bandName: "Your Band Name",
        currentLocation: "Unknown",
        currentBalance: 0.00,
        members: [],
        expenses: [],
        owed: [],
        shows: [],
        merch: [],
        isManager: false,
        yourEmail: ""
    });

    //get the band's id and save it
    id = bif.getId();
    sc.$storage.id = id;

    //watch for band name changes
    sc.$on('nameChange', function (event, args) {
        //get the band name
        var band = bf.query({'id': id}, function () {
            sc.$storage.bandName = band[0].fields.name;
        });
    });

    //set the band name initially
    rs.$broadcast('nameChange');

    //check if you're a manager or not
    var checkMgr = ht({
        method: "post",
        url: "/json/checkIfManager/" + id,
        data: {}
    }).success( function (data) {
        sc.$storage.isManager = data;
    }).error( function (data) {
        console.log(data)
    });

    //get your info -- specifically your email for now
    var getMyInfo = ht({
        method: "post",
        url: "/json/get_my_info",
        data: {
            band: id
        }
    }).success( function (data) {
        data = angular.fromJson(data);
        sc.$storage.yourEmail = data[0].fields.email;
    }).error( function (data) {
        window.open().document.write(data);
    });

    
    //get the current location
    //from 
    //    http://stackoverflow.com/questions/6797569/get-city-name-using-geolocation
    var geocoder;

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(successFunction, errorFunction);
    } 
    //Get the latitude and the longitude;
    function successFunction(position) {
        var lat = position.coords.latitude;
        var lng = position.coords.longitude;
        codeLatLng(lat, lng)
    }
    function errorFunction(){
        //alert("Geocoder failed");
        sc.$storage.currentLocation = "Unknown";
    }
      function initialize() {
        geocoder = new google.maps.Geocoder();
      }
      function codeLatLng(lat, lng) {
        var latlng = new google.maps.LatLng(lat, lng);
        geocoder.geocode({'location': latlng}, function(results, status) {
          if (status == google.maps.GeocoderStatus.OK) {
          //console.log(results)
            if (results[1]) {
             //formatted address
             //alert(results[0].formatted_address)
            //find country name
                for (var i=0; i<results[0].address_components.length; i++) {
                    for (var b=0;b<results[0].address_components[i].types.length;b++) {
                    //there are different types that might hold a city admin_area_lvl_1 usually does in come cases looking for sublocality type will be more appropriate
                        if (results[0].address_components[i].types[b] == "administrative_area_level_1") {
                            //this is the object you are looking for
                            city= results[0].address_components[i];
                            break;
                        }
                    }
                }
                //city data
                sc.$storage.currentLocation = city.long_name;
            } else {
              sc.$storage.currentLocation = "Unknown";
            }
          } else {
            //alert("Geocoder failed due to: " + status);
            sc.$storage.currentLocation = "Unknown";
          }
        });
      }
      initialize();
}]);