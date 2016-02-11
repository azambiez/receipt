angular.module('starter.controllers', ['ngCordova'])

.controller('AppCtrl', function($scope, $ionicPopup, $http, $ionicModal, $timeout) {

    $scope.loginData = {};

    $scope.lang = {
        "kh": {
            "menu" : "មីនុយ",
            "search" : "ស្វែងរក",
            "help" : "ជំនួយ",
            "about" : "អំពីកម្មវិធី",
            "login" : "ចូលប្រើប្រាស់",
            "logout" : "ចាកចេញ",
            "title" : "ប្រព័ន្ធពិនិត្យឯកសារគយ",
            "scan_qr" : "ស្វែងរកតាម QR Code",
            "or" : "ឬ",
            "lang" : "English",
            "username" : "ឈ្មោះអ្នកប្រើប្រាស់",
            "password" : "ពាក្យសម្ងាត់",
            "gdce" : "អគ្គនាយកដ្ឋានគយនិងរដ្ឋាករកម្ពុជា",
            "version" : "ជំនាន់ទី",
            "copyright" : "រក្សាសុទ្ធគ្រប់យ៉ាង",
            "author" : "ក្រុមការងារគម្រោងជាតិអាស៊ីគូដា",
            // "gdce" : "",
            // "gdce" : "",
        },
        "en": {
            "menu" : "Menu",
            "search" : "Search",
            "help" : "Help",
            "about" : "About",
            "login" : "Login",
            "logout" : "Logout",
            "title" : "Customs Document Check",
            "scan_qr" : "Scan QR Code",
            "or" : "Or",
            "lang" : "ភាសាខ្មែរ",
            "username" : "Username",
            "password" : "Password",
            "gdce" : "General Department of Customs and Excise",
            "version" : "Version",
            "copyright" : "Copyright",
            "author" : "The Asycuda Team",
        }
    };

    $scope.currentLang = $scope.lang.kh;

    $scope.changeLanguage = function(){
        if($scope.currentLang == $scope.lang.kh){
            $scope.currentLang = $scope.lang.en;
        }else{
            $scope.currentLang = $scope.lang.kh;
        }
    }

    $ionicModal.fromTemplateUrl('templates/login.html', {
        scope: $scope,
        backdropClickToClose: false,
        hardwareBackButtonClose: false
    }).then(function(modal) {
        $scope.modal = modal;
        $scope.modal.show();
    });

    $scope.closeLogin = function() {
        $scope.modal.hide();
    };

    $scope.login = function() {
        $scope.modal.show();
    };

    $scope.doLogin = function() {
        $http({
            method: 'POST',
            url: 'https://tools.customs.gov.kh/acl/auth/login/mobile?username='+$scope.loginData.username+'&password='+$scope.loginData.password
        }).then(function successCallback(response) {
            if(response.data.status != "success"){
                var alertPopup = $ionicPopup.alert({
                    title: 'Customs Receipt',
                    template: 'Invalid username and password'
                });
            }else{
                $scope.loginData.token = response.data._token;
                $timeout(function() {
                    $scope.closeLogin();
                }, 1000);
            }
        }, function errorCallback(response) {
            var alertPopup = $ionicPopup.alert({
                title: 'Customs Receipt',
                template: 'Please check Internet connection'
            });
        });
    };
})

.controller('SearchCtrl', function($scope, $state, $ionicPopup, $cordovaBarcodeScanner, $ionicModal) {

    // if(typeof $scope.loginData.token === 'undefined'){
    //     $scope.login();
    // }
    $scope.data = [];
    $scope.scanQRCode = function () {
        $cordovaBarcodeScanner.scan().then(function(imageData) {
            if(imageData.text.trim()!=""){
                $scope.send(imageData.text.trim());
            }
        }, function(error) {
            console.log("An error happened -> " + error);
        });
    }
    $scope.search = function(){
        var text = document.getElementById('txtSearch').value;
        if(text.trim() == ""){
            var alertPopup = $ionicPopup.alert({
                title: 'Customs Receipt',
                template: 'Please input text to search'
            });
        }else{
            $scope.send(text);
        }
    }

    $scope.send = function(text){
        var doc = text.trim().substr(0,2);
        var cod = text.trim().substr(2,text.length);
        if(doc == "VD"){
            $state.go('app.vehicle',{vid:text}, {reload: true});
        }else{
            var alertPopup = $ionicPopup.alert({
                title: 'Customs Receipt',
                template: 'Invalid QR Code'
            });
        }
    }

    $scope.logout = function(){
        $scope.loginData = {};
        $scope.login();
    }
})

.controller('VehicleCtrl', function($scope, $state, $ionicPopup, $stateParams, $http) {
    $scope.data = [];
    if(typeof $scope.loginData.token === 'undefined'){
        $state.go('app.search',{},{reload:true});
    }else{
        var vd = $stateParams.vid.split("-")[0];
        var itm = $stateParams.vid.split("-")[1];
        var cpy = $stateParams.vid.split("-")[2];

        var IDE_COD = vd.substring(2,7);
        var IDE_YEA = vd.substring(7,11);
        var IDE_SER = vd.substring(11,12);
        var IDE_NBR = vd.substring(12,vd.length);
        $http({
            method: 'POST',
            data:{
                IDE_COD: IDE_COD,
                IDE_YEA: IDE_YEA,
                IDE_SER: IDE_SER,
                IDE_NBR: IDE_NBR,
                KEY_ITM_RNK: itm
            },
            url: 'https://tools.customs.gov.kh/api/vehicle/scan/'+$scope.loginData.token
        }).then(function successCallback(response) {
            console.log(response.data);
            if(response.data[0]){
                $scope.data = response.data[0];

                if(typeof(cpy) == 'undefined'){
                    $scope.data.prn_nbr = "Unknown";
                }else if(cpy == 0){
                    $scope.data.prn_nbr = "Original Copy";
                }else{
                    $scope.data.prn_nbr = "Duplicate Copy " + cpy;
                }
                document.getElementById('spinner').style.display = "none";
                document.getElementById('info').style.display = "block";
            }else{
                var alertPopup = $ionicPopup.alert({
                    title: 'Customs Receipt',
                    template: 'Search not found'
                });
                $state.go('app.search',{},{reload:true});
            }
        }, function errorCallback(response) {
            console.log('response');
            document.getElementById('spinner').style.display = "none";
            document.getElementById('info').style.display = "block";
            var alertPopup = $ionicPopup.alert({
                title: 'Customs Receipt',
                template: 'Please check Internet connection'
            });
            $state.go('app.search',{},{reload:true});
        });
    }
});