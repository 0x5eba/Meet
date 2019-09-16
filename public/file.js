import { Deck } from '@deck.gl/core';
import { GeoJsonLayer, ArcLayer } from '@deck.gl/layers';
import mapboxgl from 'mapbox-gl';

// source: Natural Earth http://www.naturalearthdata.com/ via geojson.xyz
// const AIR_PORTS = 'https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_10m_airports.geojson';

// Set your mapbox token here
mapboxgl.accessToken = process.env.MapboxAccessToken; // eslint-disable-line

function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showPosition, showError);
    } else {
        alert("Geolocation is not supported by this browser")
    }
}
getLocation()

function showPosition(position) {
    const state_view = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        zoom: 9,
        bearing: 0,
        pitch: 30
    }



    setMap(state_view)
}

function showError(error) {
    switch (error.code) {
        case error.PERMISSION_DENIED:
            alert("User denied the request for Geolocation.")
            break;
        case error.POSITION_UNAVAILABLE:
            alert("Location information is unavailable.")
            break;
        case error.TIMEOUT:
            alert("The request to get user location timed out.")
            break;
        case error.UNKNOWN_ERROR:
            alert("An unknown error occurred.")
            break;
    }
}

function setMap(state_view) {
    const map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/streets-v11',
        // Note: deck.gl will be in charge of interaction and event handling
        interactive: false,
        center: [state_view.longitude, state_view.latitude],
        zoom: state_view.zoom,
        bearing: state_view.bearing,
        pitch: state_view.pitch
    });

    const deck = new Deck({
        canvas: 'deck-canvas',
        width: '100%',
        height: '100%',
        initialViewState: state_view,
        controller: true,
        onViewStateChange: ({ viewState }) => {
            map.jumpTo({
                center: [viewState.longitude, viewState.latitude],
                zoom: viewState.zoom,
                bearing: viewState.bearing,
                pitch: viewState.pitch
            });
        },
        layers: [
            new GeoJsonLayer({
                id: 'airports',
                data: AIR_PORTS,
                // Styles
                filled: true,
                pointRadiusMinPixels: 2,
                opacity: 1,
                pointRadiusScale: 2000,
                getRadius: f => 11 - f.properties.scalerank,
                getFillColor: [200, 0, 80, 180],
                // Interactive props
                pickable: true,
                autoHighlight: true,
                onClick: info =>
                    // eslint-disable-next-line
                    info.object && alert(`${info.object.properties.name} (${info.object.properties.abbrev})`)
            }),
            // new ArcLayer({
            //   id: 'arcs',
            //   data: AIR_PORTS,
            //   dataTransform: d => d.features.filter(f => f.properties.scalerank < 4),
            //   // Styles
            //   getSourcePosition: f => [-0.4531566, 51.4709959], // London
            //   getTargetPosition: f => f.geometry.coordinates,
            //   getSourceColor: [0, 128, 200],
            //   getTargetColor: [200, 0, 80],
            //   getWidth: 1
            // })
        ]
    })

    var popup = new mapboxgl.Popup({ closeOnClick: false })
        .setLngLat([state_view.longitude, state_view.latitude])
        .setHTML('<h1>I am Here</h1>')
        .addTo(map);
}