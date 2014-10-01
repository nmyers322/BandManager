//---------Finances-----------------------------------------------
angular.module('BandManagerApp').controller('FinancesController', 
    ['$scope', '$localStorage', 'ExpensesFactory', 'MoneyOwedFactory', 'BandFactory', '$rootScope', '$http', 
    function (sc, loc, ef, mof, bf, rs, ht) {
        //format date and time on the list of expenses
        sc.formatDateTime = function(dateTime){
            if (dateTime != null){
                dateTime = new Date(dateTime);
                var hours = dateTime.getHours();
                var minutes = dateTime.getMinutes();
                var ampm = " AM";
                if(hours == 0){
                    hours = 12;
                } else 
                if(hours == 12){
                    ampm = " PM";
                } else 
                if(hours > 12){
                    hours = hours - 12;
                    ampm = " PM";
                }
                if(hours < 10){
                    hours = "0" + hours;
                }
                if(minutes < 10){
                    minutes = "0" + minutes;
                }
                dateTime = (dateTime.getMonth()+1) + "/" + dateTime.getDate() + "/" + dateTime.getFullYear() + " - " + hours + ":" + minutes + ampm;
                return dateTime;
            } else {
                return null;
            }
        };


        //JSON retrieval functions--------------------------------------------------------------------
        sc.changeBalance = function () {
            //get the current balance
            var band = bf.query({'id': sc.$storage.id},function(data){
                sc.$storage.currentBalance = band[0].fields.currentBalance;
            });
        };
        sc.changeBalance();

        sc.updateExpenses = function() {
            //get the list of expenses
            var expenses = ef.query({'id': sc.$storage.id},function(data){
                sc.$storage.expenses = [];
                for(i=0;i<expenses.length;i++){
                    var dateTime = expenses[i].fields.dateTime;
                    dateTime = sc.formatDateTime(dateTime);
                    sc.$storage.expenses.push({
                        desc: expenses[i].fields.description,
                        amount: expenses[i].fields.amount,
                        formattedDateTime: dateTime,
                        dateTime: expenses[i].fields.dateTime,
                        location: expenses[i].fields.location,
                        addedBy: expenses[i].fields.addedBy
                    });
                }
                
            });
        };
        sc.updateExpenses();
        
        sc.updateMoneyOwed = function () {
            //get the list of money owed
            var moneyOwed = mof.query({'id': sc.$storage.id},function(data){
                sc.$storage.owed = [];
                for(i=0;i<moneyOwed.length;i++){
                    var dateTime = moneyOwed[i].fields.dateTime;
                    dateTime = sc.formatDateTime(dateTime);
                    sc.$storage.owed.push({
                        desc: moneyOwed[i].fields.description,
                        amount: moneyOwed[i].fields.amount,
                        dateTime: moneyOwed[i].fields.dateTime,
                        formattedDateTime: dateTime,
                        who: moneyOwed[i].fields.who,
                        pk: moneyOwed[i].pk
                    });
                }
                
            });
        };
        sc.updateMoneyOwed();

        //Button clicker functions-----------------------------------------------------------
        sc.addPayment = function () {
            amount = sc.newPayment.amount;
            desc = sc.newPayment.description;
            sc.addExpenseOrPayment("payment", amount, desc);
        };

        sc.addExpense = function () {
            amount = sc.newExpense.amount;
            desc = sc.newExpense.description;
            sc.addExpenseOrPayment("expense", amount, desc);
        };

        sc.addExpenseOrPayment = function(PaymentOrExpense, amount, desc) {
            var payment = parseFloat(amount);
            if (PaymentOrExpense == 'expense'){
                payment = -payment;
                sc.successMessage = "The expense was subtracted from your balance.";
            } else if (PaymentOrExpense == 'owed'){
                payment = -payment;
                sc.successMessage = "You paid back money that you owed!";
            } else {
                sc.successMessage = "Payment was added to your balance!";
            }
            var timeStamp = new Date();
            if (!isNaN(payment)) {
                var addPaymentRequest = ht({
                    method: "post",
                    url: "/json/add_expense_payment/" + sc.$storage.id,
                    data: {
                        desc: desc, 
                        amount: payment, 
                        dateTime: timeStamp, 
                        location: sc.$storage.currentLocation
                    }
                }).success( function (data){
                    console.log(data);
                    //update the balance on the server
                    var updateBalanceRequest = ht({
                        method: "post",
                        url: "/json/band/" + sc.$storage.id,
                        data: {
                            currentBalance: parseFloat(sc.$storage.currentBalance) + payment
                        }
                    }).success( function (data) {
                        console.log(data);
                        sc.changeBalance();
                    });
                    //refresh the local data
                    sc.updateExpenses();
                    //show success message at top
                    sc.showFailure = false;
                    sc.showSuccess = true;
                });

            } else {
                sc.failureMessage = "Something went wrong with your input. Try again.";
                sc.showFailure = true;
                sc.showSuccess = false;
            }
            if (PaymentOrExpense == 'expense'){
                sc.newExpense.amount = null;
                sc.newExpense.description = null;
            } else if (PaymentOrExpense == 'payment'){
                sc.newPayment.amount = null;
                sc.newPayment.description = null;            
            }

        };

        sc.addOwed = function () {
            var payment = parseFloat(sc.newOwed.amount);
            var timeStamp = new Date();
            if (!isNaN(payment)) {
                var addPaymentRequest = ht({
                    method: "post",
                    url: "/json/add_money_owed/" + sc.$storage.id,
                    data: {
                        desc: sc.newOwed.description, 
                        amount: sc.newOwed.amount, 
                        dateTime: timeStamp, 
                        who: sc.newOwed.who
                    }
                }).success( function (data){
                    //console.log(data)
                    //broadcast to factory
                    sc.updateMoneyOwed();
                    //show success message at top
                    sc.successMessage = "You now owe someone money.";
                    sc.showFailure = false;
                    sc.showSuccess = true;
                });

            } else {
                sc.failureMessage = "Something went wrong with your input. Try again.";
                sc.showFailure = true;
                sc.showSuccess = false;
            }
            sc.newOwed.amount = null;
            sc.newOwed.description = null;
            sc.newOwed.who = null;

        };

        sc.payOwed = function (owe) {
            var timeStamp = new Date();
            var description = owe.desc + " - " + owe.who;
            var amount = owe.amount;
            var pk = owe.pk;
            sc.addExpenseOrPayment("owed", amount, description);

            //remove from owed list
            var removeOwedRequest = ht({
                method: "post",
                url: "/json/remove_owed/" + sc.$storage.id,
                data: {
                    pk: pk
                }
            }).success( function(data){
                sc.updateMoneyOwed();
            });
            
        }
    }]
);

