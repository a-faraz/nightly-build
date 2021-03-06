angular.module('starter.controllers', [])

.controller('AppCtrl', function($scope, $rootScope, $ionicModal, $interval, $timeout, UserService, $window, Main) {

    $scope.$on('$ionicView.beforeEnter', function() {
      // Code you want executed every time view is opened
      if (!UserService.isAuthenticated()) {
        window.location = '#/lobby'
      }
    });

    // Form data for the login modal
    $scope.loginData = {};
    // Create the login modal that we will use later

    // variable to determine if user is logged in or not
    $scope.loggedIn = UserService.isAuthenticated();

    $ionicModal.fromTemplateUrl('templates/login.html', {
      scope: $scope
    }).then(function(modal) {
      $scope.modal = modal;
    });
    $interval(function() {
      $scope.badgeCount = $rootScope.badgeCount;
    }, 2000);
    // Triggered in the login modal to close it
    $scope.closeLogin = function() {
      $scope.modal.hide();
    };

    // Open the login modal
    $scope.login = function() {
      $scope.modal.show();
    };

    $scope.authenticate = function(provider) {
      UserService.authenticate(provider);
    };

    $scope.logout = function() {
      UserService.logOut();
      $window.location = '#/lobby'
    };

    $rootScope.$on('userLoggedIn', function(data) {
      // here we will recieve the logged in user
      $scope.closeLogin();
      $window.location = "#/tab/map"
    });

    // will fire in case authentication failed
    $rootScope.$on('userFailedLogin', function() {

    });

  })

.controller('PickupCtrl', function($scope, UserService, $ionicLoading, PickupService) {

  $scope.sortorder = 'shift.prize';

  $scope.availableShifts;

  $scope.$on('$ionicView.enter', function() {
    if (!UserService.isAuthenticated()) {
      window.location = '#/lobby'
    }
    $ionicLoading.show();
    PickupService.getShiftsNearMe()

  });

  $scope.$on('update', function() {
    $scope.availableShifts = PickupService.availableShifts();
  });

  $scope.pickupShift = function(shift) {
    PickupService.pickupShift(shift);
  };

})

.controller('PartnerCtrl', function($scope, UserService, PartnerService, MyShiftsService) {

  $scope.$on("update", function() {
    $scope.data = {
      canVote    : PartnerService.canVote(),
      canApprove : PartnerService.canApprove(),
      partnerInfo: PartnerService.getPartnerInfo()

    }
  })

  $scope.$on('$ionicView.enter', function() {
    if (!UserService.isAuthenticated()) {
      window.location = '#/lobby'
    }
    // only go in here if the user has reached this page through our connect function
    var ex = MyShiftsService.getCode();
    if (ex === 'abc') {


      PartnerService.filterMyPickups();
      // one function to set userID, shiftID, and pickupShiftID instead of three
      PartnerService.setPartnerInfo();      
      // PartnerService.setUserID();
      // PartnerService.setShiftID();
      // PartnerService.setPickupShiftID();
      PartnerService.getPartnerProfile();
      

      $scope.upVote = function(){
        PartnerService.upVote();
      }

      $scope.downVote = function(){
        PartnerService.downVote();
      }

      $scope.reject = function(){
        PartnerService.reject();
      }

      $scope.newApprove = function(){
        PartnerService.newApprove();
      }

    } else {
      console.log("Thy should not be here at this point of time and space");
    }

  });

})

.controller('ShiftController', function($scope, $rootScope, MyShiftsService, $http, $state, UserService) {
  
  $scope.$on("update", function() {
    $scope.data = MyShiftsService.getShiftData();
  });

  $scope.$on('$ionicView.enter', function() {
    if (!UserService.isAuthenticated()) {
      window.location = '#/lobby'
    }
    MyShiftsService.GetMyShifts();
    MyShiftsService.GetShiftsIPickedUp();
  });
  
  $scope.delete = function(shift) {
    MyShiftsService.deleteShift(shift);
  };

  $scope.connect = function(claimant) {
    MyShiftsService.connect(claimant);
  };

  $scope.connectAfter = function(shift) {
    MyShiftsService.connectAfter(shift);
  };

})
