const pokemonList = document.getElementById("pokemon-list");
let map, userMarker;

let sightings = JSON.parse(localStorage.getItem("sightings")) || [];

async function fetchPokemon() {
    try {
        const response = await fetch("https://tyradex.app/api/v1/pokemon");
        const data = await response.json();
        pokemonData = data; 
    } catch (error) {
        console.warn("Impossible de charger les données de l'API, utilisation des données locales.");
    } finally {
        displayPokemon(); 
    }
}
document.querySelector('#map-tab').addEventListener('shown.bs.tab', () => {
    setTimeout(() => {
        map.invalidateSize(); 
    }, 200); 
});
 
function displayPokemon() {
    pokemonList.innerHTML = ""; 

    pokemonData.forEach(pkm => {
        const listItem = document.createElement("li");
        listItem.className = "list-group-item d-flex justify-content-between align-items-center";


        listItem.innerHTML = `
            <span>${pkm.name.fr}</span>
            <button class="btn btn-primary btn-sm" onclick="showOnMap('${pkm.name.fr}')">Voir sur la carte</button>
        `;

        pokemonList.appendChild(listItem);
    });
}

function initMap() {
    map = L.map("map").setView([51.505, -0.09], 13);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors"
    }).addTo(map  );


    navigator.geolocation.getCurrentPosition(position => {
        const { latitude, longitude } = position.coords;
        userMarker = L.marker([latitude, longitude]).addTo(map).bindPopup("Vous êtes ici.");
        map.setView([latitude, longitude], 13);
    });
}


function displaySightings() {

    map.eachLayer(layer => {
        if (layer instanceof L.Marker && layer !== userMarker) {
            map.removeLayer(layer);
        }
    });


    sightings.forEach(sighting => {
        const { name, coords } = sighting; 
        if (name && coords) {
            L.marker(coords).addTo(map).bindPopup(`${name} vu ici.`);
        } else {
            console.error("Apparition invalide détectée :", sighting);
        }
    });
}

function addSighting(pokemonName, coords) {
    if (!pokemonName || !coords) {
        alert("Nom ou coordonnées manquants !");
        return;
    }

    const newSighting = { name: pokemonName, coords };
    sightings.push(newSighting); 
    localStorage.setItem("sightings", JSON.stringify(sightings)); 
    displaySightings();
}


function showOnMap(pokemonName) {
    if (userMarker) {
        userMarker.bindPopup(`Dernière apparition de ${pokemonName}`).openPopup();
    }
    document.querySelector("#map-tab").click();
}

function addMapClickListener() {
    map.on("click", e => {
        const { lat, lng } = e.latlng;

        document.getElementById("pokemonCoordinates").value = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;


        const addPokemonModal = new bootstrap.Modal(document.getElementById("addPokemonModal"));
        addPokemonModal.show();
    });
}

document.getElementById("savePokemonBtn").addEventListener("click", () => {
    const pokemonName = document.getElementById("pokemonName").value.trim();
    const coordinates = document.getElementById("pokemonCoordinates").value;

    if (!pokemonName) {
        alert("Veuillez entrer un nom de Pokémon !");
        return;
    }

    const [lat, lng] = coordinates.split(", ").map(Number);


    addSighting(pokemonName, [lat, lng]);


    document.getElementById("addPokemonForm").reset();
    bootstrap.Modal.getInstance(document.getElementById("addPokemonModal")).hide();
});

console.log("Données sauvegardées dans localStorage :", sightings);

initMap();
fetchPokemon();
addMapClickListener();
displaySightings();
