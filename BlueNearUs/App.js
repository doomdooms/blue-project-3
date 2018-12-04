import React, { Component } from 'react';
import {TouchableHighlight, Image, Dimensions, Platform, StyleSheet, Text, View, ScrollView, FlatList, Animated } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps'
import RNGooglePlaces from 'react-native-google-places';
import { Body, Card, Content, CardItem, Right, Left, Thumbnail, Button, H3, Fab } from 'native-base'
import LinearGradient from 'react-native-linear-gradient'
import Emoji from 'react-native-emoji';
import ResultCard from './resultCard.js'
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import Icon from 'react-native-vector-icons/Ionicons'
import firebase from 'firebase';
import Modal from "react-native-modal";
var _ = require('lodash');
const apikey = "AIzaSyBJj7Qjf-xOnVFfIh-vRg3fLd2EP9F2dVk";
var config = {
  databaseURL: "https://nearus-222717.firebaseio.com",
  projectId: "nearus-222717",
};
firebase.initializeApp(config);

type Props = {};
const screen = Dimensions.get('window');
const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject
  },
  btn: {
    width: 60,
    height: 60,
    justifyContent: 'center'
  },
  map: {
    backgroundColor: 'transparent',
    ...StyleSheet.absoluteFillObject,
  },
});


export default class App extends Component<Props> {

  state = {
    modalOpen: false,
    active: false,
    getPlaces: true,
    contents: [],
    latitude: null,
    longitude: null,
    user_lat: 42.057989,
    user_long: -87.675641,
    error: null,
    result: [],
    scroll: new Animated.Value(0),
    region: {
      latitude: 42.055214,
      longitude: -87.674894,
      latitudeDelta: 0.0222,
      longitudeDelta: 0.0421,
    },
    markers: [
      {
        key: '1',
        coordinate: {
          latitude: 42.053472,
          longitude: -87.672652,
        },
        title: "Person A",
        description: "Norris",
      },
      {
        key: '2',
        coordinate: {
          latitude: 42.05228,
          longitude: -87.688912,
        },
        title: "Person B",
        description: "Emerson St",
      },
      {
        key: '3',
        coordinate: {
          latitude: 42.067079,
          longitude: -87.692223,
        },
        title: "Person C",
        description: "Welsh-Ryan",
      },
    ],
    centroid: [{
      key: '0',
      coordinate: {
        latitude: 42.057705,
        longitude: -87.682356,
      },
      title: "Your Optimized Hangout Spot!",
      pinColor: "#8B008B",
      description: "Sherman Ave :)",
    }],
    your_location: [{
      key: '99',
      coordinate: {
        latitude: 42.057806,
        longitude: -87.675877,
      },
      title: "Your Location",
      pinColor: "#00ff00",
      description: "This is where you are!",
    }],


  };
  headerY = Animated.multiply(Animated.diffClamp(this.state.scroll, 0, 56), -1);
  rad2degr(rad) { return rad * 180 / Math.PI; }
  degr2rad(degr) { return degr * Math.PI / 180; }
  getLatLngCenter(latLngInDegr) {
    var LATIDX = 0;
    var LNGIDX = 1;
    var sumX = 0;
    var sumY = 0;
    var sumZ = 0;

    for (var i = 0; i < latLngInDegr.length; i++) {
      var lat = this.degr2rad(latLngInDegr[i][LATIDX]);
      var lng = this.degr2rad(latLngInDegr[i][LNGIDX]);
      // sum of cartesian coordinates
      sumX += Math.cos(lat) * Math.cos(lng);
      sumY += Math.cos(lat) * Math.sin(lng);
      sumZ += Math.sin(lat);
    }

    var avgX = sumX / latLngInDegr.length;
    var avgY = sumY / latLngInDegr.length;
    var avgZ = sumZ / latLngInDegr.length;

    // convert average x, y, z coordinate to latitude and longtitude
    var lng = Math.atan2(avgY, avgX);
    var hyp = Math.sqrt(avgX * avgX + avgY * avgY);
    var lat = Math.atan2(avgZ, hyp);

    return ([this.rad2degr(lat), this.rad2degr(lng)]);
  }

  calculateCentroid() {
    var coordinates = [];
    var answer;
    // this.state.markers.map(m => (
    //     coordinates.push({m.coordinate});
    //   ));
    var i;
    for (i = 0; i < this.state.markers.length; i++) {
      coordinates.push([this.state.markers[i].coordinate.latitude, this.state.markers[i].coordinate.longitude]);
    }
    if (this.state.latitude != null && this.state.latitude != null) {
      coordinates.push([this.state.user_lat, this.state.user_long]);
    }
    //console.log("Centroid...");
    //console.log(coordinates);
    answer = this.getLatLngCenter(coordinates);
    //console.log(answer[0], answer[1]);
    return answer;
  }


  //Given channel id, user can add a Name/Lat/Long to that channel
  writeUserData(name, lat, long, id) {
    firebase.database().ref('Users/' + id + '/' + name).set({
      lat,
      long,
      name,
    }).then((data) => {
      //success callback
      console.log('data ', data)
    }).catch((error) => {
      //error callback
      console.log('error ', error)
    })
  }


  //Function that creates empty channel (e.g., BlueTeam)
  createNewChannel(id) {
    firebase.database().ref('Users/' + id).set({
    }).then((data) => {
      //success callback
      console.log('data ', data)
    }).catch((error) => {
      //error callback
      console.log('error ', error)
    })
  }

  //This function asks for an id, or rather a channel name, and reads every single name and correspond lat/long, placing them into the people field in states
  readUserData(id) {
    var friends = [];
    firebase.database().ref('Users/' + id).once('value', function (snapshot) {
      console.log(snapshot.val())

      snapshot.forEach((child) => {
        console.log(child.val().name, child.val().lat, child.val().long);
        friends.push(child.val());
      });
    });
    // this.setState({
    //       people: friends
    //     });
    this.state.people = friends;
    // console.log(friends);
    console.log(this.state);
  }


  //This function updates the lat long of a given person in a channel
  updateSingleData(name, lat, long, id) {
    firebase.database().ref('Users/' + id + '/' + name).update({
      lat,
      long,
    });
  }

  //Sample Functions You Can Call with Firebase
  // this.createNewChannel("BlueTeam");
  //   this.writeUserData("Tim", "42.053472", "-87.672652", "BlueTeam");
  //   this.writeUserData("Jordan", "42.058053", "-87.675137", "BlueTeam");
  //   this.writeUserData("Andrew", "42.067079", "-87.692223","BlueTeam");
  //   this.writeUserData("Robbie","42.057989", "-87.675641","BlueTeam");
  //   this.readUserData("BlueTeam");
  //   this.readUserData("AquaTeam");
  //   this.updateSingleData("Andrew", "42.067079", "-87.692224","AquaTeam")

  fetchbycategory = (lat, lon, type) => {
    this.state.result = [];
    this.state.contents = [];
    let distanceorradius = type == "parking" ? "radius=1000" : "rankby=distance"
    // type can be: cafe restaurant parking
    const urlFirst = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lon}&${distanceorradius}&type=${type}&key=${apikey}
    `
    if (this.state.getPlaces == true) {
      fetch(urlFirst)
        .then(res => {
          return res.json();
        })
        .then(res => {
          console.log(res);
          const arrayData = _.uniqBy([...this.state.result, ...res.results], 'id')
          console.log(arrayData);
          this.state.result = arrayData;

          this.getPlaceMarkersFunc();
        })
        .catch(error => {
          console.log(error);
        });
      this.state.getPlaces = false;
    }
  }
  fetchpizz = (lat, lon) => {
    this.state.result = [];
    this.state.contents = [];
    const urlFirst = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=pizza&location=${lat},${lon}&radius=1000&key=${apikey}
    `
    if (this.state.getPlaces == true) {
      fetch(urlFirst)
        .then(res => {
          return res.json();
        })
        .then(res => {
          const arrayData = _.uniqBy([...this.state.result, ...res.results], 'id')
          console.log(arrayData);
          this.state.result = arrayData;

          this.getPlaceMarkersFunc();
        })
        .catch(error => {
          console.log(error);
        });
      this.state.getPlaces = false;
    }
  }

  openSearchModal(lat, lon) {
    if (this.state.getPlaces == true)
      RNGooglePlaces.getAutocompletePredictions('pizz', {
        type: 'establishments',
        latitude: lat,
        longitude: lon,
        radius: 1
      }).then((place) => {
        this.state.result = place;
        // console.log(place)
        this.getPlaceMarkersFunc();
        //console.log(this.state.contents)
      }).catch(error => console.log(error.message));

    this.state.getPlaces = false

  }

  getPlaceMarkersFunc() {

    this.state.result.map((item) => {
      const urlphoto = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${item.photos[0].photo_reference}&key=${apikey}`

      var marker = {
        key: item.id,
        coordinate: {
          latitude: item.geometry.location.lat,
          longitude: item.geometry.location.lng,
        },
        photo: urlphoto,
        rating: item.rating,
        icon: item.icon,
        title: item.name,
        description: item.vicinity,
        pinColor: "#336CFF",
      };

      this.state.contents.push(marker);

    });

  }

  onPressbtn() {

  }


  render() {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.setState({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          error: null,
        });
      },
      (error) => this.setState({ error: error.message }),
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 },
    );
    //console.log("This is your location...");

    //console.log(this.state.latitude, this.state.longitude);
    centroid_coords = this.calculateCentroid();
    const latlng = {
      latitude: centroid_coords[0],
      longitude: centroid_coords[1],
    }

    //this.openSearchModal(latlng.latitude, latlng.longitude)

    //this.fetchpizz(latlng.latitude, latlng.longitude)

    return (

      <View style={styles.container}>


        <Animated.ScrollView
          style={{ zIndex: 0 }}
          scrollEventThrottle={5}
          scrollEnabled={true}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: this.state.scroll } } }], { useNativeDriver: true })}
        >
          <Animated.View style={{
            height: screen.height * 0.8,
            width: '100%',
            transform: [{ translateY: Animated.multiply(this.state.scroll, 0.5) }]
          }}>
            <MapView
              provider={PROVIDER_GOOGLE}
              style={styles.map}
              initialRegion={this.state.region}
              showsUserLocation={true}
              showsCompass={true}
            >

              {this.state.markers.map(marker => (
                <Marker
                  key={marker.key}
                  coordinate={marker.coordinate}
                  title={marker.title}
                  description={marker.description}
                />
              ))}

              {this.state.centroid.map(c => (
                <Marker
                  key={c.key}
                  coordinate={latlng}
                  title={c.title}
                  description={c.description}
                  pinColor={c.pinColor}

                />
              ))}

              {this.state.your_location.map(y => (
                <Marker
                  key={y.key}
                  coordinate={y.coordinate}
                  title={y.title}
                  description={y.description}
                  pinColor={y.pinColor}
                />
              ))}
              {this.state.contents.map((item) => (
                <Marker
                  key={item.key}
                  coordinate={item.coordinate}
                  title={item.title}
                  description={item.description}
                  pinColor={item.pinColor}
                />
              ))}
            </MapView>
            <Fab
              active={this.state.active}
              direction="down"
              containerStyle={{}}
              style={{ backgroundColor: '#5067FF', top: '30%' }}
              position="topRight"
              onPress={() => this.setState({ active: !this.state.active })}>
              <FontAwesome5 name={"user"} />
              <Button
                style={{ backgroundColor: '#34A34F', marginTop: "10%" }}
                onPress={() => this.setState({ modalOpen: true})} >
                <Icon name="md-person-add" size={20} color="#EFFFFF" />
              </Button>
            </Fab>
        </Animated.View>

      <Modal
          style={{height: "50%"}}
          animationType="none"
          transparent={false}
          visible={this.state.modalOpen}
          presentationStyle="formSheet"
          onRequestClose={() => {
            Alert.alert('Modal has been closed.');
          }}>
          <View style={{marginTop: 50}}>
            <View>
              <Text>Hello World!</Text>
              <TouchableHighlight
                onPress={() => {
                  this.setState({modalOpen: !this.state.modalOpen});
                }}>
                <Text>Hide Modal</Text>
              </TouchableHighlight>
          </View>
    </View>
  </Modal>

          <View style={{
            transform: [{ translateY: -100 }],
            width: screen.width,
            paddingHorizontal: 30,
            // paddingVertical: 20,
            paddingTop: 20,
            backgroundColor: 'rgb(255,255,255)',
            borderRadius: 10,
            shadowColor: 'rgb(0,0,0)',
            shadowRadius: 10,
            shadowOffset: { width: 0, height: -9 },
            shadowOpacity: 0.15
          }}>
            <View style={{ ...StyleSheet.absoluteFillObject, top: 100, backgroundColor: 'rgb(255,255,255)' }} />
            <Content style={{ alignSelf: 'center', paddingBottom: 20 }}><H3 style={{ color: 'rgb(74,74,74)' }}>Hangout Places</H3></Content>
            <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between', height: 80, }}>

              <Button rounded light style={styles.btn}
                onPress={() => {
                  this.state.getPlaces = true;
                  this.fetchbycategory(latlng.latitude, latlng.longitude, "cafe");

                }} >
                <Emoji name="coffee" style={{ fontSize: 40 }} /></Button>
              <Button rounded light style={styles.btn}
                onPress={() => {
                  this.state.getPlaces = true;
                  this.fetchpizz(latlng.latitude, latlng.longitude);
                }}
              ><Emoji name="pizza" style={{ fontSize: 40 }} /></Button>
              <Button rounded light style={styles.btn}
                onPress={() => {
                  this.state.getPlaces = true;
                  this.fetchbycategory(latlng.latitude, latlng.longitude, "restaurant");

                }}
              ><Emoji name="fork_and_knife" style={{ fontSize: 40 }} /></Button>
              <Button rounded light style={styles.btn}
                onPress={() => {
                  this.state.getPlaces = true;
                  this.fetchbycategory(latlng.latitude, latlng.longitude, "parking");

                }}
              ><Emoji name="parking" style={{ fontSize: 40 }} /></Button>

            </View>
            <Content>
              {this.state.contents.map((item) => (
                <ResultCard
                  key={item.id}
                  name={item.title}
                  note={item.description}
                  icon={item.icon}
                  pic={item.photo}
                  rating={item.rating}
                />
              ))}
            </Content>
          </View>
        </Animated.ScrollView>
      </View>


    );
  }
}
