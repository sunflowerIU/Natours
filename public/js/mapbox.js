// console.log('hello mapbox')


const locations = JSON.parse(document.getElementById('map').dataset.locations) 
// console.log(locations)


mapboxgl.accessToken = 'pk.eyJ1IjoiamFtbXgiLCJhIjoiY2t5OGR3MnNuMWVnczJucHY2eHk3M2xxaSJ9.DxqYL4YigmbqpFOUFdYDtA';
var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/jammx/cky8fc2qj95m515pckdv7674b',
    scrollZoom: false, //prevents zooming map
    // center:[127.0188095,37.543812],
    // zoom:15,
    // interactive:false    //it will make map un moveable
});


//to create a bound for locations in map
const bounds = new mapboxgl.LngLatBounds()

locations.forEach(location => {
    //create marker, by creating a div andset its class name to marker which is already built
    const marker = document.createElement('div');
    marker.className = 'marker';

    //add marker
    new mapboxgl.Marker({
            element: marker,
            anchor: 'bottom' //marker points to bottom of our location
        }).setLngLat(location.coordinates) //this LngLat value will come from our locations data
        .addTo(map) //to add marker into map

    //add popup, that shows up in marker
    new mapboxgl.Popup({
            offset: 30 //to separate marker and popup
        })
        .setLngLat(location.coordinates) //set coordiantes
        .setHTML(`<p>Day ${location.day}: ${location.description}</p>`) //set text for popup
        .addTo(map) //to add popup into map

    //extend our bound to following cordinates. like making boundary
    bounds.extend(location.coordinates);

    //to fit all our markers in map
    map.fitBounds(bounds, {
        padding: { //we will use padding to fit all marker inside bound, because we have cuuting edge map, which makes maker unfitable
            top: 200,
            bottom: 150,
            left: 100,
            right: 100
        }
    })
})