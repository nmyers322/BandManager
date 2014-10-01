//--------------Members--------------------------------
angular.module('BandManagerApp').controller('MembersController',['$scope', '$localStorage', '$window', 'MembersFactory', '$location', '$http', function (sc, locStor, win, mf, loc, ht) {

    sc.getMembers = function() {
        //get the list of members
        sc.editMemberPanel = [];
        sc.notTheOwner = [];
        var members = mf.query({'id': sc.$storage.id},function(data){
            sc.$storage.members = [];
            for(i=0;i<members.length;i++){
                sc.$storage.members.push({
                    name: members[i].fields.name,
                    role: members[i].fields.role,
                    phone: members[i].fields.phone,
                    email: members[i].fields.email,
                    status: members[i].fields.status,
                    pk: members[i].pk
                });
                sc.editMemberPanel[i] = false;
                sc.notTheOwner[i] = false;
            }
            
        });
    }
    sc.getMembers();
    

    //call the member
    sc.call = function (number) {
        win.open('tel:' + number, '_top');
    };
    //email the member
    sc.email = function (email) {
        win.open('mailto:' + email, '_top');
    };
    //go to url
    sc.go = function (path) {
        loc.path(path);
    };

    //save the editted members details
    sc.editMemberSave = function (index) {
        sc.tempIndex = index;
        var pk = sc.$storage.members[index].pk;
        var editMemRequest = ht({
            method: 'post',
            url: '/json/edit_member',
            data: {
                band: sc.$storage.id,
                pk: pk,
                name: sc.editMember.name,
                role: sc.editMember.role,
                email: sc.editMember.email,
                phone: sc.editMember.phone,
                status: sc.editMember.status
            }
        }).success( function(data){
            //close the panel
            sc.showEditMember(sc.tempIndex);
            //get new data
            sc.getMembers();
            //show success message
            sc.showSuccess = true;
        }).error(function(data){
            window.open().document.write(data);
        });
    };

    //show the edit member panel
    sc.showEditMember = function (index){
        //if the panel is already open, close it
        if(sc.editMemberPanel[index]){
            sc.editMemberPanel[index] = false;
            //reset member details
            sc.editMember.name = '';
            sc.editMember.role = '';
            sc.editMember.phone = '';
            sc.editMember.email = '';
            sc.editMember.status = 'member';
        } else {
            //open edit panel
            sc.editMemberPanel[index] = true;
            //populate member details
            sc.editMember.name = sc.$storage.members[index].name;
            sc.editMember.role = sc.$storage.members[index].role;
            sc.editMember.phone = sc.$storage.members[index].phone;
            sc.editMember.email = sc.$storage.members[index].email;
            statusStr = sc.$storage.members[index].status;
            sc.editMember.status = statusStr.toLowerCase();
            //if you own the band, you shouldnt be able to change your own status or email.
            if(sc.$storage.yourEmail != sc.$storage.members[index].email){
                sc.notTheOwner[index] = true;
            } else {
                sc.notTheOwner[index] = false;
            }

        }
    };

    //defaults
    sc.editMember = {};
    sc.editMember.name = '';
    sc.editMember.role = '';
    sc.editMember.phone = '';
    sc.editMember.email = '';
    sc.editMember.status = 'member';
    sc.showSuccess = false;
    sc.tempIndex = -1;
}]);

    
