/* App Module */

var bandManagerApp = angular.module('BandManagerApp', ['ngRoute', 'ngStorage', 'ngResource']);

//Routes

//Django keeps static files in "/static/".
//By convention, you aren't supposed to call the folder explicitly.
//We're doing it here because of the angular implementation.
bandManagerApp.config(function ($routeProvider) {
    $routeProvider
        .when('/', {
            controller: 'HomeController',
            templateUrl: '/static/views/home.html'
        })
        .when('/finances', {
            controller: 'FinancesController',
            templateUrl: '/static/views/finances.html'
        })
        .when('/itinerary', {
            controller: 'ItineraryController',
            templateUrl: '/static/views/itinerary.html'
        })
        .when('/addshow', {
            controller: 'AddShowController',
            templateUrl: '/static/views/addshow.html'
        })
        .when('/members', {
            controller: 'MembersController',
            templateUrl: '/static/views/members.html'
        })
        .when('/merch', {
            controller: 'MerchController',
            templateUrl: '/static/views/merch.html'
        })
        .when('/addmerch', {
            controller: 'AddMerchController',
            templateUrl: '/static/views/addmerch.html'
        })
        .when('/manageband', {
            controller: 'ManageBandController',
            templateUrl: '/static/views/manageband.html'
        })
        .otherwise({ redirectTo: '/' })
});

/*bandManagerApp.config(function($httpProvider) {
    $httpProvider.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
});
*/
bandManagerApp.config(['$httpProvider', function($httpProvider) {
    $httpProvider.defaults.xsrfCookieName = 'csrftoken';
    $httpProvider.defaults.xsrfHeaderName = 'X-CSRFToken';
}]);

//Factories
// Band Id
bandManagerApp.factory("BandIdFactory", function () {
    var fac = {};
    fac.getId = function () {
        var regex = /(app\/)([0-9]*)/i;
        var url = document.URL;
        var id = url.match(regex)[2];
        return id;
    };
    return fac;
    
});
// Band
bandManagerApp.factory("BandFactory", function ($resource) {
    return $resource("/json/band/:id");
});
// Merch
bandManagerApp.factory("MerchFactory", function ($resource) {
    return $resource("/json/merch/:id");
});
// Merch Options
bandManagerApp.factory("MerchOptionsFactory", function ($resource) {
    return $resource("/json/merchOptions/:id");
});
// Shows
bandManagerApp.factory("ShowsFactory", function ($resource) {
    return $resource("/json/shows/:id");
});
// Schedules
bandManagerApp.factory("SchedulesFactory", function ($resource) {
    return $resource("/json/schedules/:id");
});
// Expenses
bandManagerApp.factory("ExpensesFactory", function ($resource) {
    return $resource("/json/expenses/:id");
});
// Money Owed
bandManagerApp.factory("MoneyOwedFactory", function ($resource) {
    return $resource("/json/moneyOwed/:id");
});
// Members
bandManagerApp.factory("MembersFactory", function ($resource) {
    return $resource("/json/members/:id");
});

//Directives
//scrolls to top of page when something is clicked
bandManagerApp.directive('scrollOnClick', function () {
    return {
        restrict: 'A',
        link: function (scope, $elm) {
            $elm.on('click', function () {
                $("body").animate({ scrollTop: 0 }, "slow");
            });
        }
    }
});


//Conrollers
//stored in js/controllers/


// Filters
bandManagerApp.filter('dateFilter', function () {
    //return correct range of shows
    return function (shows, category) {
        var newShows = [];
        if (category == 0) {
            for (var i = 0; i < shows.length; i++) {
                var showDate = new Date(shows[i].dateOfShow); 
                //var showDateSplit = showDate.split("-");
                var today = new Date();
                var todayMsec = Date.parse(today);
                //we want the user to be able to see "today's" show, even if it's up to 3:00 AM the next morning.
                todayMsec = todayMsec - (3 * 60 * 60 * 1000);
                today = new Date(todayMsec);
                var compareMonth = (today.getMonth() <= showDate.getMonth());
                var compareDate = (today.getDate() <= showDate.getDate()+1);
                var compareYear = (today.getFullYear() <= showDate.getFullYear());
                var addShow = compareMonth && compareDate && compareYear;
                if (addShow) {
                    newShows.push(shows[i]);
                }
            }
            return newShows;
        } else {
            return shows;
        }
    }

});

bandManagerApp.filter('formatDate', function () {
    return function (date) {
        date = new Date(date);
        var month = date.getMonth() + 1;
        var day = date.getDate() + 1;
        var year = date.getFullYear();
        return month + "/" + day + "/" + year;
    };
});

bandManagerApp.filter('formatTime', function () {
    //format the schedule time
    return function (time) {
        var result = time.split(":");
        if (result[0] > 12) {
            return (result[0] - 12) + ":" + result[1] + " PM";
        } else {
            return -(-result[0]) + ":" + result[1] + " AM";
        }
        /*var dateTime = new Date(Date.parse(time));
        var minutes = dateTime.getMinutes();
        if(minutes < 10){
            minutes = ":0" + String(minutes);
        } else {
            minutes = ":" + String(minutes);
        }
        var ampm = " AM";
        var hours = dateTime.getHours();
        if(hours == 12){
            ampm = " PM";
        } else if(hours >= 12){
            ampm = " PM";
            hours = hours - 12;
        }
        return hours + minutes + ampm;*/
    };

});

bandManagerApp.filter('inStockProduct', function () {
    //filter out products that arent in stock
    return function (merch) {
        newProdList = [];
        for (i = 0; i < merch.length; i++) {
            var addThisToList = false;
            for (j = 0; j < merch[i].options.length; j++){
                if(merch[i].options[j].quantity > 0)
                    addThisToList = true;
            }
            if(addThisToList){
                newProdList.push(merch[i]);
            }
        }
        return newProdList;
    };

});

bandManagerApp.filter('inStockOption', function () {
    return function (options){
        newOptionsList = [];
        for(i = 0; i< options.length; i++){
            if(options[i].quantity > 0)
                newOptionsList.push(options[i]);
        }
        return newOptionsList;
    };
});

// Additional functions

//function to change the navbar buttons to "active"
$('.nav li a').on('click', function () {
    //Change the active button when clicked
    $(this).parent().parent().find('.active').removeClass('active');
    $(this).parent().addClass('active');
});

//hack to fix the non-collapsing menu on menu item click
$(document).ready(function () {
    
    $(".clickCollapse").click(function (event) {
        //bootstrap collapses the menubar at 768 pixels by default
        if($(window).width() <= 768){
            $(".navbar-collapse").collapse('hide');
        }
    });

});
