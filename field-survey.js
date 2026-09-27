/* =========================================================
   LANDCRAFT - FIELD SURVEY
   ========================================================= */

let gpsWatchId = null;
let currentPosition = null;
let surveyPoints = [];

let surveyMap = null;
let pointMarkers = [];
let boundaryLine = null;
let boundaryPolygon = null;

let recordedBoundaryLayer = null;


/* =========================================================
   MOBILE MENU
   ========================================================= */

function setupMobileMenu() {
    const menuButton = document.getElementById("mobileMenuBtn");
    const navLinks = document.getElementById("navLinks");

    if (!menuButton || !navLinks) return;

    menuButton.addEventListener("click", function () {
        navLinks.classList.toggle("active");
    });
}


/* =========================================================
   GPS STATUS
   ========================================================= */

function updateGPSStatus(status, message) {
    const statusDot = document.getElementById("gpsStatusDot");
    const statusText = document.getElementById("gpsStatusText");

    if (statusText) {
        statusText.textContent = message;
    }

    if (statusDot) {
        statusDot.className = "gps-status-dot";

        if (status === "active") {
            statusDot.classList.add("active");
        } else if (status === "error") {
            statusDot.classList.add("error");
        }
    }
}


/* =========================================================
   START GPS
   ========================================================= */

function startGPS() {

    if (!navigator.geolocation) {
        updateGPSStatus(
            "error",
            "GPS is not supported by this browser"
        );

        alert("Geolocation is not supported by this browser.");
        return;
    }

    updateGPSStatus(
        "active",
        "Waiting for GPS..."
    );

    gpsWatchId = navigator.geolocation.watchPosition(
        function (position) {

            currentPosition = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
                timestamp: new Date()
            };

            updateGPSDisplay(currentPosition);

            updateGPSStatus(
                "active",
                "GPS Connected"
            );
        },

        function (error) {

            console.error("GPS Error:", error);

            updateGPSStatus(
                "error",
                "GPS unavailable"
            );

            let message = "Unable to get GPS location.";

            if (error.code === error.PERMISSION_DENIED) {
                message = "GPS permission was denied.";
            } else if (error.code === error.POSITION_UNAVAILABLE) {
                message = "GPS position unavailable.";
            } else if (error.code === error.TIMEOUT) {
                message = "GPS request timed out.";
            }

            alert(message);
        },

        {
            enableHighAccuracy: true,
            maximumAge: 0,
            timeout: 10000
        }
    );

    const startButton = document.getElementById("startGpsBtn");
    const stopButton = document.getElementById("stopGpsBtn");

    if (startButton) {
        startButton.disabled = true;
    }

    if (stopButton) {
        stopButton.disabled = false;
    }
}


/* =========================================================
   STOP GPS
   ========================================================= */

function stopGPS() {

    if (gpsWatchId !== null) {

        navigator.geolocation.clearWatch(gpsWatchId);

        gpsWatchId = null;
    }

    updateGPSStatus(
        "error",
        "GPS Stopped"
    );

    const startButton = document.getElementById("startGpsBtn");
    const stopButton = document.getElementById("stopGpsBtn");

    if (startButton) {
        startButton.disabled = false;
    }

    if (stopButton) {
        stopButton.disabled = true;
    }
}


/* =========================================================
   DISPLAY GPS DATA
   ========================================================= */

function updateGPSDisplay(position) {

    const latitude = document.getElementById("latitude");
    const longitude = document.getElementById("longitude");
    const accuracy = document.getElementById("accuracy");
    const gpsTime = document.getElementById("gpsTime");

    if (latitude) {
        latitude.textContent =
            position.latitude.toFixed(6);
    }

    if (longitude) {
        longitude.textContent =
            position.longitude.toFixed(6);
    }

    if (accuracy) {
        accuracy.textContent =
            position.accuracy.toFixed(2) + " m";
    }

    if (gpsTime) {
        gpsTime.textContent =
            position.timestamp.toLocaleTimeString();
    }
}

/* =========================================================
   SURVEY MAP
   ========================================================= */

function initializeSurveyMap() {

    const mapElement = document.getElementById("surveyMap");

    if (!mapElement) return;

    surveyMap = L.map("surveyMap").setView(
        [23.7035, 86.1860],
        17
    );

    L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
            maxZoom: 19,
            attribution: "&copy; OpenStreetMap contributors"
        }
    ).addTo(surveyMap);
}

/* =========================================================
   LOAD RECORDED BOUNDARY
   ========================================================= */

function loadRecordedBoundary(plotId) {

    if (!surveyMap || !plotId) return;

    fetch("data/plots.geojson")
        .then(function (response) {

            if (!response.ok) {
                throw new Error("Unable to load plots.geojson");
            }

            return response.json();
        })

        .then(function (data) {

            // Remove previous recorded boundary
            if (recordedBoundaryLayer) {
                surveyMap.removeLayer(
                    recordedBoundaryLayer
                );

                recordedBoundaryLayer = null;
            }


            // Find selected plot
            const selectedFeature =
                data.features.find(function (feature) {

                    return (
                        feature.properties &&
                        feature.properties.plotId === plotId
                    );

                });


            if (!selectedFeature) {

                console.warn(
                    "Recorded boundary not found for:",
                    plotId
                );

                return;
            }


            // Add selected recorded boundary
            recordedBoundaryLayer =
                L.geoJSON(
                    selectedFeature,
                    {
                        style: {
                            color: "#1d4ed8",
                            weight: 3,
                            fillColor: "#3b82f6",
                            fillOpacity: 0.15
                        }
                    }
                ).addTo(surveyMap);


            // Zoom to recorded boundary
            const bounds =
                recordedBoundaryLayer.getBounds();

            if (bounds.isValid()) {

                surveyMap.fitBounds(
                    bounds,
                    {
                        padding: [30, 30]
                    }
                );
            }


            console.log(
                "Recorded Boundary Loaded:",
                plotId
            );
        })

        .catch(function (error) {

            console.error(
                "Recorded Boundary Error:",
                error
            );

        });
}

/* =========================================================
   UPDATE SURVEY BOUNDARY
   ========================================================= */

function updateSurveyMap() {

    if (!surveyMap) return;

    // Remove old markers
    pointMarkers.forEach(function (marker) {
        surveyMap.removeLayer(marker);
    });

    pointMarkers = [];

    // Remove old line
    if (boundaryLine) {
        surveyMap.removeLayer(boundaryLine);
        boundaryLine = null;
    }

    // Remove old polygon
    if (boundaryPolygon) {
        surveyMap.removeLayer(boundaryPolygon);
        boundaryPolygon = null;
    }

    if (surveyPoints.length === 0) {
        return;
    }

    const coordinates = [];

    surveyPoints.forEach(function (point) {

        const position = [
            point.latitude,
            point.longitude
        ];

        coordinates.push(position);

        const marker = L.marker(position)
            .addTo(surveyMap)
            .bindTooltip(point.id, {
                permanent: true,
                direction: "top"
            });

        pointMarkers.push(marker);
    });


    // Connect points with a line
    if (surveyPoints.length >= 2) {

        boundaryLine = L.polyline(
            coordinates,
            {
                color: "#0f7b5f",
                weight: 3
            }
        ).addTo(surveyMap);
    }


    // Create closed boundary
    if (surveyPoints.length >= 3) {

        boundaryPolygon = L.polygon(
            coordinates,
            {
                color: "#0f7b5f",
                weight: 2,
                fillColor: "#4d8b76",
                fillOpacity: 0.25
            }
        ).addTo(surveyMap);
    }


    // Zoom map to collected points
    const bounds = L.latLngBounds();

    if (coordinates.length > 0) {
        bounds.extend(coordinates);
    }

    if (recordedBoundaryLayer) {
        bounds.extend(
            recordedBoundaryLayer.getBounds()
        );
    }

    if (bounds.isValid()) {

        surveyMap.fitBounds(
            bounds,
            {
                padding: [40, 40]
            }
        );
    }
}


/* =========================================================
   SAVE POINT
   ========================================================= */

function savePoint() {

    if (!currentPosition) {

        alert(
            "GPS location is not available yet.\n\n" +
            "Please start GPS and wait for a location."
        );

        return;
    }

    const pointNumber = surveyPoints.length + 1;

    const point = {
        id: "P" + pointNumber,
        latitude: currentPosition.latitude,
        longitude: currentPosition.longitude,
        accuracy: currentPosition.accuracy,
        timestamp: currentPosition.timestamp
    };

    surveyPoints.push(point);

    displayPoints();

    updatePointCount();

    updateSurveyMap();

    console.log("Saved Point:", point);
}


/* =========================================================
   DISPLAY SAVED POINTS
   ========================================================= */

function displayPoints() {

    const pointsList = document.getElementById("pointsList");

    if (!pointsList) return;

    pointsList.innerHTML = "";

    surveyPoints.forEach(function (point) {

        const pointElement = document.createElement("div");

        pointElement.className = "survey-point-item";

        pointElement.innerHTML = `
            <div>
                <strong>${point.id}</strong>
                <span>
                    ${point.latitude.toFixed(6)},
                    ${point.longitude.toFixed(6)}
                </span>
            </div>

            <small>
                ±${point.accuracy.toFixed(1)} m
            </small>
        `;

        pointsList.appendChild(pointElement);
    });
}


/* =========================================================
   POINT COUNT
   ========================================================= */

function updatePointCount() {

    const pointCount = document.getElementById("pointCount");

    if (pointCount) {
        pointCount.textContent = surveyPoints.length;
    }
}


/* =========================================================
   CLEAR POINTS
   ========================================================= */

function clearPoints() {

    if (surveyPoints.length === 0) {
        return;
    }

    const confirmed = confirm(
        "Are you sure you want to clear all saved points?"
    );

    if (!confirmed) return;

    surveyPoints = [];

    displayPoints();

    updatePointCount();
}

/* =========================================================
   CREATE BOUNDARY
   ========================================================= */

function createBoundary() {

    if (surveyPoints.length < 3) {
        alert(
            "At least 3 points are required to create a boundary."
        );
        return;
    }

    console.log("Creating Boundary...");

    // Close polygon: P1 → P2 → ... → P1
    const boundaryPoints = [
        ...surveyPoints,
        surveyPoints[0]
    ];

    // Calculate area in square meters
    const areaM2 = calculatePolygonArea(boundaryPoints);

    // Convert square meters to acres
    const areaAcres = areaM2 / 4046.8564224;

    // Draw boundary on Survey Map
    drawBoundaryOnMap(surveyPoints);

    // Update calculated area
    const surveyArea =
        document.getElementById("surveyArea");

    const areaStatus =
        document.getElementById("areaStatus");

    if (surveyArea) {
        surveyArea.textContent =
            areaAcres.toFixed(4);
    }

    if (areaStatus) {
        areaStatus.textContent =
            "Boundary created successfully • " +
            surveyPoints.length +
            " points collected";
    }

    // Success message
    alert(
        "Boundary Created Successfully!\n\n" +
        "Points: " + surveyPoints.length + "\n" +
        "Area: " + areaAcres.toFixed(4) + " acres"
    );

    console.log("Boundary Points:", boundaryPoints);
    console.log("Area:", areaM2.toFixed(2), "m²");
    console.log("Area:", areaAcres.toFixed(4), "acres");
}


/* =========================================================
   DRAW BOUNDARY ON SURVEY MAP
   ========================================================= */

function drawBoundaryOnMap(points) {

    if (!surveyMap) {
        console.error("Survey map is not initialized.");
        return;
    }

    if (points.length < 3) {
        return;
    }

    // Use the Leaflet survey map
    // instead of replacing its HTML.
    updateSurveyMap();

    console.log(
        "Boundary drawn on Leaflet map with",
        points.length,
        "points."
    );
}

/* =========================================================
   CALCULATE POLYGON AREA
   ========================================================= */

function calculatePolygonArea(points) {

    if (points.length < 3) {
        return 0;
    }

    const earthRadius = 6378137;

    const lat0 =
        points[0].latitude *
        Math.PI / 180;

    let x = [];
    let y = [];

    points.forEach(function (point) {

        const lat =
            point.latitude *
            Math.PI / 180;

        const lon =
            point.longitude *
            Math.PI / 180;

        x.push(
            earthRadius *
            lon *
            Math.cos(lat0)
        );

        y.push(
            earthRadius *
            lat
        );
    });

    let area = 0;

    for (let i = 0; i < points.length - 1; i++) {

        area +=
            x[i] * y[i + 1] -
            x[i + 1] * y[i];
    }

    return Math.abs(area) / 2;
}


/* =========================================================
   INITIALIZE FIELD SURVEY
   ========================================================= */

function initializeFieldSurvey() {

    setupMobileMenu();

    initializeSurveyMap();

    const startGpsButton =
        document.getElementById("startGpsBtn");

    const stopGpsButton =
        document.getElementById("stopGpsBtn");

    const savePointButton =
        document.getElementById("savePointBtn");

    const clearPointsButton =
        document.getElementById("clearPointsBtn");

    const createBoundaryButton =
        document.getElementById("createBoundaryBtn");

    const saveSurveyButton =
        document.getElementById("saveSurveyBtn");

    const surveyPlotSelect =
        document.getElementById("surveyPlotId");

    const urlParams =
        new URLSearchParams(window.location.search);

    const plotFromUrl =
        urlParams.get("plot");

    const surveyTypeSelect =
        document.getElementById("surveyType");

    const plotIdGroup =
        document.getElementById("plotIdGroup");


    /* START GPS */

    if (startGpsButton) {

        startGpsButton.addEventListener(
            "click",
            startGPS
        );

    }


    /* STOP GPS */

    if (stopGpsButton) {

        stopGpsButton.addEventListener(
            "click",
            stopGPS
        );

        stopGpsButton.disabled = true;

    }


    /* SAVE POINT */

    if (savePointButton) {

        savePointButton.addEventListener(
            "click",
            savePoint
        );

    }


    /* CLEAR POINTS */

    if (clearPointsButton) {

        clearPointsButton.addEventListener(
            "click",
            clearPoints
        );

    }


    /* CREATE BOUNDARY */

    if (createBoundaryButton) {

        createBoundaryButton.addEventListener(
            "click",
            createBoundary
        );

    }

    /* SAVE SURVEY */

    if (saveSurveyButton) {

        saveSurveyButton.addEventListener(
            "click",
            saveSurvey
        );

    }

    /* PLOT SELECTION */

    if (surveyPlotSelect) {

        surveyPlotSelect.addEventListener(
            "change",
            function () {

                loadRecordedBoundary(
                    this.value
                );

            }
        );

    }

    if (plotFromUrl && surveyPlotSelect) {

        surveyPlotSelect.value = plotFromUrl;

        loadRecordedBoundary(plotFromUrl);

    }

    if (surveyTypeSelect) {

        surveyTypeSelect.addEventListener(
            "change",
            function () {

                if (this.value === "recorded") {

                    // Show Plot ID
                    if (plotIdGroup) {
                        plotIdGroup.style.display = "block";
                    }

                }

                else if (this.value === "new") {

                    // Hide Plot ID
                    if (plotIdGroup) {
                        plotIdGroup.style.display = "none";
                    }

                    // Clear selected plot
                    if (surveyPlotSelect) {
                        surveyPlotSelect.value = "";
                    }

                    // Remove recorded boundary
                    if (recordedBoundaryLayer) {

                        surveyMap.removeLayer(
                            recordedBoundaryLayer
                        );

                        recordedBoundaryLayer = null;
                    }

                }

            }
        );

    }


    updatePointCount();

    updateGPSStatus(
        "error",
        "GPS Not Started"
    );
}

/* =========================================================
   SAVE SURVEY
   ========================================================= */

function saveSurvey() {

    if (surveyPoints.length < 3) {
        alert(
            "At least 3 survey points are required before saving."
        );
        return;
    }

    const plotId =
        document.getElementById("surveyPlotId")?.value || "";

    const surveyorName =
        document.getElementById("surveyorName")?.value.trim() || "";

    const surveyAreaElement =
        document.getElementById("surveyArea");

    const surveyArea =
        surveyAreaElement
            ? surveyAreaElement.textContent
            : "0.0000";


    // Generate Survey ID
    const existingSurveys =
        JSON.parse(
            localStorage.getItem("landcraftSurveys")
        ) || [];

    const surveyNumber =
        existingSurveys.length + 1;

    const surveyId =
        "SUR-" +
        String(surveyNumber).padStart(3, "0");


    // Create survey object
    const survey = {

        surveyId: surveyId,

        plotId: plotId,

        surveyor: surveyorName,

        date: new Date().toISOString(),

        points: surveyPoints.map(function (point) {

            return {
                id: point.id,
                latitude: point.latitude,
                longitude: point.longitude,
                accuracy: point.accuracy,
                timestamp: point.timestamp
            };

        }),

        areaAcres: surveyArea,

        status: "Completed"
    };


    // Save survey
    existingSurveys.push(survey);

    localStorage.setItem(
        "landcraftSurveys",
        JSON.stringify(existingSurveys)
    );


    console.log(
        "Survey Saved:",
        survey
    );


    alert(
        "Survey Saved Successfully!\n\n" +
        "Survey ID: " + surveyId + "\n" +
        "Plot: " + (plotId || "Not selected") + "\n" +
        "Points: " + surveyPoints.length
    );
}


/* =========================================================
   PAGE LOAD
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initializeFieldSurvey
);