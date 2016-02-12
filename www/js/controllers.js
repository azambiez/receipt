angular.module('starter.controllers', ['ngCordova'])

.controller('AppCtrl', function($scope, $ionicPopup, $http, $ionicModal, $timeout) {

    $scope.loginData = {};

    $http.get("lang.json").success(function(response){
        $scope.lang = response;
        $scope.currentLang = $scope.lang.kh;
    });


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
                    title: $scope.currentLang.title,
                    template: $scope.currentLang.login_err
                });
            }else{
                $scope.loginData.token = response.data._token;
                $timeout(function() {
                    $scope.closeLogin();
                }, 1000);
            }
        }, function errorCallback(response) {
            var alertPopup = $ionicPopup.alert({
                title: $scope.currentLang.title,
                template: $scope.currentLang.connection_error
            });
        });
    };
})

.controller('SearchCtrl', function($scope, $state, $ionicPopup, $cordovaBarcodeScanner, $ionicModal) {
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
                title: $scope.currentLang.title,
                template: $scope.currentLang.text_required,
            });
        }else{
            $scope.send(text);
        }
    }

    $scope.send = function(text){
        text = text.toUpperCase();
        var doc = text.trim().substr(0,2);
        var cod = text.trim().substr(2,text.length);
        if(doc == "VD"){
            $state.go('app.vehicle',{vid:text}, {reload: true});
        }else if(doc == "TD"){
            $state.go('app.transport',{vid:text}, {reload: true});
        }else{
            var alertPopup = $ionicPopup.alert({
                title: $scope.currentLang.title,
                template: $scope.currentLang.invalid_code,
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
            if(response.data){
                $scope.data = response.data;
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
                    title: $scope.currentLang.title,
                    template: $scope.currentLang.not_found
                });
                $state.go('app.search',{},{reload:true});
            }
        }, function errorCallback(response) {
            console.log('response');
            document.getElementById('spinner').style.display = "none";
            document.getElementById('info').style.display = "block";
            var alertPopup = $ionicPopup.alert({
                title: $scope.currentLang.title,
                template: $scope.currentLang.connection_error
            });
            $state.go('app.search',{},{reload:true});
        });
    }
})

.controller('TransportCtrl', function($scope, $state, $ionicPopup, $stateParams, $http) {
    $scope.data = [];
    if(typeof $scope.loginData.token === 'undefined'){
        $state.go('app.search',{},{reload:true});
    }else{
        var BAR_COD = $stateParams.vid.substring(2,$stateParams.vid.length);
        $http({
            method: 'POST',
            data:{
                BAR_COD: BAR_COD
            },
            url: 'https://tools.customs.gov.kh/api/transport/scan/'+$scope.loginData.token
        }).then(function successCallback(response) {
            if(response.data.TRD_GENERAL_SEGMENT){
                $scope.data = response.data.TRD_GENERAL_SEGMENT;
                document.getElementById('spinner').style.display = "none";
                document.getElementById('info').style.display = "block";
            }else{
                var alertPopup = $ionicPopup.alert({
                    title: $scope.currentLang.title,
                    template: $scope.currentLang.not_found
                });
                $state.go('app.search',{},{reload:true});
            }
        }, function errorCallback(response) {
            console.log('response');
            document.getElementById('spinner').style.display = "none";
            document.getElementById('info').style.display = "block";
            var alertPopup = $ionicPopup.alert({
                title: $scope.currentLang.title,
                template: $scope.currentLang.connection_error,
            });
            $state.go('app.search',{},{reload:true});
        });
    }
});