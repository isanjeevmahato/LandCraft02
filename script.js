/* =========================================================
   LANDCRAFT
   Main Dashboard JavaScript
   ========================================================= */


/* =========================================================
   1. DEMO DASHBOARD DATA
   ========================================================= */

const dashboardData = {
    totalParcels: 12,
    completedSurveys: 7,
    pendingSurveys: 5,
    discrepancies: 2
};


/* =========================================================
   2. LOAD OVERVIEW NUMBERS
   ========================================================= */

function loadDashboardStats() {

    const totalParcels =
        document.getElementById("totalParcels");

    const completedSurveys =
        document.getElementById("completedSurveys");

    const pendingSurveys =
        document.getElementById("pendingSurveys");

    const discrepancies =
        document.getElementById("discrepancies");


    if (totalParcels) {
        totalParcels.textContent =
            dashboardData.totalParcels;
    }

    if (completedSurveys) {
        completedSurveys.textContent =
            dashboardData.completedSurveys;
    }

    if (pendingSurveys) {
        pendingSurveys.textContent =
            dashboardData.pendingSurveys;
    }

    if (discrepancies) {
        discrepancies.textContent =
            dashboardData.discrepancies;
    }
}


/* =========================================================
   3. MOBILE MENU
   ========================================================= */

function setupMobileMenu() {

    const menuButton =
        document.getElementById("mobileMenuBtn");

    const navigation =
        document.querySelector(".main-nav");


    if (!menuButton || !navigation) {
        return;
    }


    menuButton.addEventListener("click", function () {

        if (navigation.style.display === "flex") {

            navigation.style.display = "none";

        } else {

            navigation.style.display = "flex";

            navigation.style.flexDirection = "column";

            navigation.style.position = "absolute";

            navigation.style.top = "68px";

            navigation.style.left = "0";

            navigation.style.right = "0";

            navigation.style.padding = "12px 5%";

            navigation.style.background = "#ffffff";

            navigation.style.borderBottom =
                "1px solid #e5e9ef";

            navigation.style.boxShadow =
                "0 10px 20px rgba(0,0,0,0.06)";
        }

    });
}


/* =========================================================
   4. MAP BUTTON
   ========================================================= */

/* =========================================================
   4. INTERACTIVE PARCEL MAP
   ========================================================= */

let landcraftMap = null;
let parcelLayer = null;

function setupMapButton() {

    const mapElement =
        document.getElementById("parcelMap");

    if (!mapElement) {
        return;
    }

    // Create Leaflet map
    landcraftMap = L.map("parcelMap").setView(
        [23.7035, 86.1860],
        16
    );


    /* =====================================================
       NORMAL MAP
       ===================================================== */

    const normalLayer = L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
            maxZoom: 19,
            attribution:
                '&copy; OpenStreetMap contributors'
        }
    );


    /* =====================================================
       SATELLITE MAP
       ===================================================== */

    const satelliteLayer = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/" +
        "World_Imagery/MapServer/tile/{z}/{y}/{x}",
        {
            maxZoom: 19,
            attribution:
                "Tiles &copy; Esri"
        }
    );


    // Start with normal map
    normalLayer.addTo(landcraftMap);


    /* =====================================================
       LOAD GEOJSON PARCELS
       ===================================================== */

    fetch("data/plots.geojson")
        .then(function (response) {

            if (!response.ok) {
                throw new Error(
                    "Unable to load plots.geojson"
                );
            }

            return response.json();
        })

        .then(function (data) {

            parcelLayer = L.geoJSON(
                data,
                {
                    style: function (feature) {

                        const status =
                            feature.properties?.surveyStatus;

                        let fillColor = "#4d8b76";

                        if (status === "Verified") {
                            fillColor = "#3a9d70";
                        }

                        else if (status === "Pending") {
                            fillColor = "#e6a23c";
                        }

                        else if (status === "Discrepancy") {
                            fillColor = "#d9534f";
                        }

                        return {
                            color: "#173f35",
                            weight: 2,
                            fillColor: fillColor,
                            fillOpacity: 0.40
                        };
                    },

                    onEachFeature:
                        function (feature, layer) {

                            const properties =
                                feature.properties || {};

                            const popupContent = `
                                <div class="parcel-popup">

                                    <h3>
                                        ${properties.plotId || "Plot"}
                                    </h3>

                                    <p>
                                        <strong>Owner:</strong>
                                        ${properties.owner || "N/A"}
                                    </p>

                                    <p>
                                        <strong>Recorded Area:</strong>
                                        ${properties.recordedArea || "N/A"}
                                    </p>

                                    <p>
                                        <strong>Status:</strong>
                                        ${properties.surveyStatus || "N/A"}
                                    </p>

                                    <p>
                                        <strong>Claim:</strong>
                                        ${properties.claim || "N/A"}
                                    </p>

                                </div>
                            `;

                            layer.bindPopup(
                                popupContent
                            );


                            /* Hover effect */

                            layer.on(
                                "mouseover",
                                function () {

                                    this.setStyle({
                                        weight: 3,
                                        fillOpacity: 0.55
                                    });

                                }
                            );


                            layer.on(
                                "mouseout",
                                function () {

                                    parcelLayer.resetStyle(
                                        this
                                    );

                                }
                            );

                        }
                }
            ).addTo(landcraftMap);


            /* Zoom map to parcels */

            const bounds =
                parcelLayer.getBounds();

            if (bounds.isValid()) {

                landcraftMap.fitBounds(
                    bounds,
                    {
                        padding: [30, 30]
                    }
                );

            }

        })

        .catch(function (error) {

            console.error(
                "LandCraft Map Error:",
                error
            );

        });


    /* =====================================================
       NORMAL / SATELLITE BUTTONS
       ===================================================== */

    const normalButton =
        document.getElementById(
            "normalMapBtn"
        );

    const satelliteButton =
        document.getElementById(
            "satelliteMapBtn"
        );


    if (normalButton && satelliteButton) {

        normalButton.addEventListener(
            "click",
            function () {

                landcraftMap.removeLayer(
                    satelliteLayer
                );

                normalLayer.addTo(
                    landcraftMap
                );

                normalButton.classList.add(
                    "active"
                );

                satelliteButton.classList.remove(
                    "active"
                );

            }
        );


        satelliteButton.addEventListener(
            "click",
            function () {

                landcraftMap.removeLayer(
                    normalLayer
                );

                satelliteLayer.addTo(
                    landcraftMap
                );

                satelliteButton.classList.add(
                    "active"
                );

                normalButton.classList.remove(
                    "active"
                );

            }
        );

    }

}


/* =========================================================
   6. LOCAL STORAGE
   ========================================================= */

function getSurveyHistory() {

    const savedSurveys =
        localStorage.getItem("landcraft_surveys");


    if (!savedSurveys) {
        return [];
    }


    try {

        return JSON.parse(savedSurveys);

    } catch (error) {

        console.error(
            "Unable to read LandCraft survey history.",
            error
        );

        return [];
    }
}


/* =========================================================
   7. RECENT SURVEY ACTIVITY
   ========================================================= */

function loadRecentActivity() {

    const surveys =
        getSurveyHistory();

    const activityList =
        document.getElementById("activityList");

    const emptyState =
        document.getElementById("activityEmpty");


    if (!activityList || !emptyState) {
        return;
    }


    if (surveys.length === 0) {

        emptyState.style.display = "flex";

        activityList.style.display = "none";

        return;
    }


    emptyState.style.display = "none";

    activityList.style.display = "block";


    activityList.innerHTML = "";


    const recentSurveys =
        surveys.slice(-5).reverse();


    recentSurveys.forEach(function (survey) {

        const item =
            document.createElement("div");

        item.className = "activity-item";


        item.innerHTML = `

            <div>
                <strong>
                    ${survey.plotId || "Survey"}
                </strong>

                <div>
                    ${survey.date ||
            "Recent survey"
            }
                </div>
            </div>

            <span>
                Completed
            </span>

        `;


        activityList.appendChild(item);

    });
}


/* =========================================================
   8. INITIALIZE DASHBOARD
   ========================================================= */

function initializeLandCraft() {

    loadDashboardStats();

    setupMobileMenu();

    setupMapButton();

    loadRecentActivity();

}


/* =========================================================
   9. START APPLICATION
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initializeLandCraft
);