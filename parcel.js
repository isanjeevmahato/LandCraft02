// =========================================================
// LANDCRAFT — PARCEL PAGE
// =========================================================


// ---------------------------------------------------------
// Mobile Menu
// ---------------------------------------------------------

function setupMobileMenu() {

    const menuButton =
        document.getElementById("mobileMenuBtn");

    const navLinks =
        document.getElementById("navLinks");

    if (!menuButton || !navLinks) {
        return;
    }

    menuButton.addEventListener(
        "click",
        function () {

            navLinks.classList.toggle("active");

        }
    );

}


// ---------------------------------------------------------
// Load Recorded Parcels
// ---------------------------------------------------------

function loadParcels() {

    const parcelList =
        document.getElementById("parcelList");

    if (!parcelList) {
        return;
    }


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

            const features =
                data.features || [];

            updateParcelSummary(features);

            displayParcels(features);

        })

        .catch(function (error) {

            console.error(
                "Parcel Data Error:",
                error
            );

            parcelList.innerHTML = `
                <div class="parcel-empty">
                    Unable to load recorded parcel data.
                </div>
            `;

        });

}


// ---------------------------------------------------------
// Update Summary Cards
// ---------------------------------------------------------

function updateParcelSummary(features) {

    let verified = 0;
    let pending = 0;
    let discrepancy = 0;


    features.forEach(function (feature) {

        const status =
            feature.properties?.surveyStatus;


        if (status === "Verified") {

            verified++;

        }

        else if (status === "Pending") {

            pending++;

        }

        else if (status === "Discrepancy") {

            discrepancy++;

        }

    });


    const totalElement =
        document.getElementById(
            "totalParcelCount"
        );

    const verifiedElement =
        document.getElementById(
            "verifiedParcelCount"
        );

    const pendingElement =
        document.getElementById(
            "pendingParcelCount"
        );

    const discrepancyElement =
        document.getElementById(
            "discrepancyParcelCount"
        );


    if (totalElement) {

        totalElement.textContent =
            features.length;

    }

    if (verifiedElement) {

        verifiedElement.textContent =
            verified;

    }

    if (pendingElement) {

        pendingElement.textContent =
            pending;

    }

    if (discrepancyElement) {

        discrepancyElement.textContent =
            discrepancy;

    }

}


// ---------------------------------------------------------
// Display Parcel Cards
// ---------------------------------------------------------

function displayParcels(features) {

    const parcelList =
        document.getElementById("parcelList");

    if (!parcelList) {
        return;
    }


    if (features.length === 0) {

        parcelList.innerHTML = `
            <div class="parcel-empty">
                No recorded parcels available.
            </div>
        `;

        return;
    }


    parcelList.innerHTML = "";


    features.forEach(function (feature) {

        const properties =
            feature.properties || {};


        const plotId =
            properties.plotId || "Unknown";

        const owner =
            properties.owner || "Not available";

        const recordedArea =
            properties.recordedArea || "Not available";

        const status =
            properties.surveyStatus || "Unknown";

        const claim =
            properties.claim || "Not available";


        // Status CSS class

        let statusClass =
            status.toLowerCase();

        if (
            statusClass !== "verified" &&
            statusClass !== "pending" &&
            statusClass !== "discrepancy"
        ) {

            statusClass = "";

        }


        // Create card

        const card =
            document.createElement("div");

        card.className =
            "parcel-card";


        card.innerHTML = `

            <div class="parcel-card-top">

                <div>

                    <div class="parcel-id">
                        ${plotId}
                    </div>

                    <div class="parcel-owner">
                        ${owner}
                    </div>

                </div>


                <span
                    class="parcel-status ${statusClass}"
                >
                    ${status}
                </span>

            </div>


            <div class="parcel-details">

                <div class="parcel-detail">

                    <span>
                        Recorded Area
                    </span>

                    <strong>
                        ${recordedArea}
                    </strong>

                </div>


                <div class="parcel-detail">

                    <span>
                        Claim
                    </span>

                    <strong>
                        ${claim}
                    </strong>

                </div>

            </div>


            <div class="parcel-actions">

                <button
                    class="parcel-action-btn view-map-btn"
                    type="button"
                    data-plot-id="${plotId}"
                >
                    View on Map
                </button>


                <button
                    class="parcel-action-btn start-survey-btn"
                    type="button"
                    data-plot-id="${plotId}"
                >
                    Start Survey
                </button>

            </div>

        `;


        parcelList.appendChild(card);

    });


    setupParcelActions();

}


// ---------------------------------------------------------
// Parcel Actions
// ---------------------------------------------------------

function setupParcelActions() {

    const mapButtons =
        document.querySelectorAll(
            ".view-map-btn"
        );

    const surveyButtons =
        document.querySelectorAll(
            ".start-survey-btn"
        );


    // View on Map

    mapButtons.forEach(function (button) {

    button.addEventListener(
        "click",
        function () {

            const plotId =
                this.dataset.plotId;

            openParcelMap(plotId);

        }
    );

});


    // Start Survey

    surveyButtons.forEach(function (button) {

        button.addEventListener(
            "click",
            function () {

                const plotId =
                    this.dataset.plotId;

                window.location.href =
                    "field-survey.html?plot=" +
                    encodeURIComponent(plotId);

            }
        );

    });

}

// ---------------------------------------------------------
// Open Parcel Map
// ---------------------------------------------------------

let parcelMap = null;
let parcelMapLayer = null;

function openParcelMap(plotId) {

    const modal =
        document.getElementById("parcelMapModal");

    const mapTitle =
        document.getElementById("mapParcelTitle");

    if (!modal) {
        return;
    }


    modal.classList.add("active");


    if (mapTitle) {

        mapTitle.textContent =
            plotId + " — Recorded Boundary";

    }


    // Create map only once

    if (!parcelMap) {

        parcelMap =
            L.map("parcelMap");

        L.tileLayer(
            "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
            {
                maxZoom: 19,
                attribution:
                    "&copy; OpenStreetMap contributors"
            }
        ).addTo(parcelMap);

    }


    // Load parcel data

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

            const selectedFeature =
                data.features.find(
                    function (feature) {

                        return (
                            feature.properties &&
                            feature.properties.plotId === plotId
                        );

                    }
                );


            if (!selectedFeature) {

                console.warn(
                    "Parcel not found:",
                    plotId
                );

                return;

            }


            // Remove previous parcel

            if (parcelMapLayer) {

                parcelMap.removeLayer(
                    parcelMapLayer
                );

            }


            // Draw selected parcel

            parcelMapLayer =
                L.geoJSON(
                    selectedFeature,
                    {
                        style: {
                            color: "#1d4ed8",
                            weight: 3,
                            fillColor: "#3b82f6",
                            fillOpacity: 0.25
                        },

                        onEachFeature:
                            function (
                                feature,
                                layer
                            ) {

                                const properties =
                                    feature.properties || {};

                                layer.bindPopup(`
                                    <strong>
                                        ${properties.plotId || "Plot"}
                                    </strong>
                                    <br>
                                    Owner:
                                    ${properties.owner || "N/A"}
                                    <br>
                                    Recorded Area:
                                    ${properties.recordedArea || "N/A"}
                                    <br>
                                    Status:
                                    ${properties.surveyStatus || "N/A"}
                                `);

                            }

                    }
                ).addTo(parcelMap);


            // Zoom to parcel

            const bounds =
                parcelMapLayer.getBounds();

            if (bounds.isValid()) {

                parcelMap.fitBounds(
                    bounds,
                    {
                        padding: [40, 40]
                    }
                );

            }


            // Fix Leaflet size after modal opens

            setTimeout(function () {

                parcelMap.invalidateSize();

            }, 150);

        })

        .catch(function (error) {

            console.error(
                "Parcel Map Error:",
                error
            );

        });

}

// ---------------------------------------------------------
// Close Parcel Map
// ---------------------------------------------------------

function setupParcelMapClose() {

    const modal =
        document.getElementById(
            "parcelMapModal"
        );

    const closeButton =
        document.getElementById(
            "closeParcelMap"
        );


    if (!modal || !closeButton) {
        return;
    }


    closeButton.addEventListener(
        "click",
        function () {

            modal.classList.remove(
                "active"
            );

        }
    );


    // Close when clicking outside map box

    modal.addEventListener(
        "click",
        function (event) {

            if (
                event.target === modal
            ) {

                modal.classList.remove(
                    "active"
                );

            }

        }
    );

}


// ---------------------------------------------------------
// Initialize Parcel Page
// ---------------------------------------------------------

function initializeParcelPage() {

    setupMobileMenu();

    setupParcelMapClose();

    loadParcels();

}


document.addEventListener(
    "DOMContentLoaded",
    initializeParcelPage
);