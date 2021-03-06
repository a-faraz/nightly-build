angular.module('maps.controller', [])

.controller('MapCtrl', function($scope, $rootScope, $ionicLoading, $timeout, $http, Main, UserService, PickupService, MyShiftsService) {
  $scope.$on('$ionicView.enter', function() {
    if (!UserService.isAuthenticated()) {
      window.location = '#/lobby'
    }
    $scope.notification();
    ionic.trigger('resize');
  })

  var myId;
  $scope.map;
  $scope.infowindow = new google.maps.InfoWindow();
  $scope.location = Main.getLocation();
  $scope.user;
  $scope.homeStore;
  $scope.pickupButtons = false;


  if($scope.location){
      $ionicLoading.hide();
      $scope.pickupButtons = true;
  }else{
    Main.getMyPos().then(function(pos){
      $timeout(function(){
        $scope.pickupButtons = true;
        $ionicLoading.hide();
      },700)
    })
  }
  // sets the store the user works at :: TODO
  window.setMyStore = function(storeId, address) {
    var myStoreObj = {
      storeId: storeId,
      address: address
    }
    var confirmation = confirm("Set your home store as " + address + "?");
    if (confirmation) {
      Main.setMyStore(myStoreObj).then(function(response) {
        alert("Your home store has been set to: ", address)
      }).catch(function(res) {
        alert(res)
      })
    }
  }
  var loc = localStorage.getItem("location");
  // loc = JSON.parse(loc)
  console.log("this is loc ", loc)

  // Notifications
  $scope.notification = function() {

    // Get user Id from server
    Main.whoAmI()
      .then(function(user) {
        $scope.user = user;
        console.log("whoami endpoint returning: ", user)
        localStorage.setItem("theUser", user);
      })
      .catch(function(err) {
        console.log("Could not get user id")
      })

    Main.getMyStore()
      .then(function(storeId) {
        $scope.homeStore = storeId;
        console.log("my store id is: ", storeId);
      })
      .catch(function(err) {
        console.log("Could not get home store")
      })
    MyShiftsService.GetMyShifts();
    MyShiftsService.GetShiftsIPickedUp();

  };

  // Pickup a shift page
  $scope.pickup = function() {

    var stores = Main.getStores();
    if(stores){
      // $ionicLoading.show();
      // centerOnMe();
      centerOnMe();
      $scope.pickupButtons = false;
      window.leShift = Main.getShifts();
      markerBuilder(stores);
    }else{
      // $ionicLoading.show();
      centerOnMe();
      $scope.pickupButtons = false;
      // could be better needs to pickup data from controler 
      // if exists otherwise do another request
      Main.fetchStores().then(function(stores) {
        window.leShift = Main.getShifts();
        markerBuilder(stores);
      })
    }

  };

  window.pShift = function(shiftid) {
    console.log("this is le shiftID", shiftid)
    var shift = window.leShift.filter(function(shift) {
      return shift._id === shiftid;
    })
    shift = shift[0];
    console.log('this is the shifto', shift)
    var theData = {
      shift_id: shift._id,
      shift_owner: shift.submitted_by,
      shift_owner_name: shift.submitted_by_name,
      shift_where: shift.home_store.address,
      shift_when: shift.shift_text_time,
      shift_prize: shift.prize,
      shift_start: shift.shift_start,
      shift_end: shift.shift_end,
      voted: false
    };
    // test if shift owner is claiming their own shift
    if ($scope.user !== shift.submitted_by) {
      PickupService.pickUpShift(theData).then(function(response) {
        alert("successfully requested a shift")
      }).catch(function(err) {
        alert("Could not request to pickup this shift")
      })
    } else {
      alert("Sorry, you cannot claim this shift.")
    }
  };

  $scope.findMe = function(){
    $ionicLoading.show();
    console.log("clicky")
    Main.getMyPos().then(function(pos) {
      var locObj = JSON.stringify(pos);
      localStorage.setItem('location', locObj);
      Main.setLocation(pos);
      Main.fetchStores().then(function(){
        $scope.map.setCenter(new google.maps.LatLng(pos.lat, pos.lng));
        $ionicLoading.hide();
        $scope.pickupButtons = true;
      })
    })
  }

  $scope.zipSearch = function(zipOrCity) {
    $scope.pickupButtons = false;
    Main.searchByZip(zipOrCity).then(function(response) {
      var locObj = JSON.stringify({lat:response.location.lat, lng:response.location.lng});
      localStorage.setItem('location', locObj);
      centerOnSearch(response.location.lat, response.location.lng);
      markerBuilder(response);
      $ionicLoading.hide();
    }).catch(function(err) {
      alert("Could not get stores from the server, please try again later");
      $ionicLoading.hide();
    })
  }

  $scope.mapCreated = function(map) {
    $scope.map = map;
    Main.setMap(map);
  };

  function centerOnSearch(lat, lng) {
    $scope.map.setCenter(new google.maps.LatLng(lat, lng));
  }

  function centerOnMe() {
    $scope.loading = $ionicLoading.show({
      content: 'Getting current location...',
      showBackdrop: false
    });
    $scope.map = Main.getMap();
    var location = Main.getLocation();
    console.log("this is loc from maps fac", location)
    var stores = Main.getStores();
    if(location && $scope.map){
      $scope.map.setCenter(new google.maps.LatLng(location.lat, location.lng));
      if(stores){
        $ionicLoading.hide();
      }
    }else{
      Main.getMyPos().then(function(pos) {
        $scope.map.setCenter(new google.maps.LatLng(pos.lat, pos.lng));
        $scope.location = Main.getLocation();
        Main.fetchStores().then(function(res) {
          $ionicLoading.hide();
        });
      })
    }
  };

  centerOnMe();

  function markerBuilder(results, status) {
    for (var i = 0; i < results.results.length; i++) {
      createMarker(results.results[i]);
    }
  }

  function createMarker(place) {
    var loc = place.geometry.location;
    var icons = '';
    if (!place.shifts) {
      icons = 'img/marker-gray.png'
    }
    var marker = new google.maps.Marker({
      position: {
        lat: place.geometry.location.lat,
        lng: place.geometry.location.lng
      },
      animation: google.maps.Animation.DROP,
      icon: icons
    });
    // marker.setIcon('http://maps.google.com/mapfiles/ms/icons/blue-dot.png')
    marker.setMap($scope.map);
    if (place.place_id === $scope.homeStore) {
      marker.setIcon('http://maps.google.com/mapfiles/ms/icons/blue-dot.png')
    }
    google.maps.event.addListener(marker, 'click', function() {
      var info = "";
      myId = UserService.getUser()._id;
      if(place.shifts){
        place.shifts = place.shifts.filter(function(shift){
          if (shift.submitted_by === myId) return false;
          if (shift.restricted.includes(myId)) return false;
          if (shift.requested.includes(myId)) return false;
          return true;
        })
      }
      if (place.shifts && place.shifts.length) {
        place.shifts.forEach(function(shift) {
          var shiftObj = {};
          shiftObj.store = place.vicinity;
          shiftObj.start = shift.shift_start;
          shiftObj.end = shift.shift_end;
          shiftObj.postedby = shift.submitted_by;
          shiftObj.postedby_name = shift.submitted_by_name;
          shiftObj.prize = shift.prize;
          shiftObj.id = shift._id;
          info += "<li><h6 class='marker2'>" + place.vicinity +
            "</h6><h6 class='marker4'>" + shift.shift_text_time +
            "</h6><h6 class='marker5'>Prize: " + shift.prize +
            "</h6><br /><h6 class='marker3'>" + "Posted by: " + shift.submitted_by_name +
            "</h6><button type='button' class='button button-small button-block button-positive take-shift' onclick='pShift(\"" + shift._id + "\")'>Take shift</button><br />";
        });
      } else {
        info = "<li>" + place.vicinity + "</li><br /><h4>No shifts available.</h4>"
      }
      // marker popup window
      if (place.place_id !== $scope.homeStore) {
        $scope.infowindow.setContent(
          "<ul class='infowindow'><li><button type='button' class='button button-small button-block button-positive' onclick=\"setMyStore('" + place.place_id + "', '" + place.vicinity + "')\">Make this my home store</button></li>" + info + "</ul>"
        );
      } else {
        $scope.infowindow.setContent(
          "<ul class='infowindow'><h3 class=\"homestore\">This is your store!</h3>" + info + "</ul>"
        );
      }
      $scope.infowindow.open($scope.map, this);
    });
  }
})