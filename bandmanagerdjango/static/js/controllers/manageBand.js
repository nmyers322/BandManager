//----------Manage Band--------------------------------------
angular.module('BandManagerApp').controller('ManageBandController', 
    ['$scope', '$localStorage', '$http', 'BandFactory', '$rootScope', function (sc, locStor, ht, bf, rs) {
    sc.showSuccess = false;

    //change the name of the band
    sc.changeBandName = function (name) {
        var request = ht({
            method: "post",
            url: "/json/band/" + sc.$storage.id,
            data: {
                name: name
            }
        });
        request.success (function (data) {
            sc.$emit('nameChange');
        });
    };
    //add a member
    sc.addMember = function (member) {
        sc.newMemberEmail = member.email;
        //send request
        var request = ht({
            method: "post",
            url: "/json/add_member/" + sc.$storage.id,
            data: {
                name: member.name,
                role: member.role,
                phone: member.phone,
                email: member.email,
                status: member.status
            }
        });
        request.success (function (data) {

            //send an invitation email
            var sendEmailRequest = ht({
                method: "post",
                url: "/json/send_invitation",
                data: {
                    band: sc.$storage.bandName,
                    email: sc.newMemberEmail
                }
            });

            //display message at top
            sc.successMessage = "You successfully added " + member.name + " to the band. Tell the member to sign up to BandManager using the email you provided, and they will be able to access the app with your band's data.";
            sc.showSuccess = true;

            //reset form
            member.name = null;
            member.role = null;
            member.phone = null;
            member.email = null;
            member.status = null;

        });
        request.error( function (data) {
            window.open().document.write(data);
        });
    };
}]);

