/* =========================================================
   LANDCRAFT - FIELD SURVEY
   ========================================================= */

let gpsWatchId = null;
let currentPosition = null;
let surveyPoints = [];


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

    // Close the polygon by returning to P1
    const boundaryPoints = [...surveyPoints, surveyPoints[0]];

    console.log("Boundary Points:", boundaryPoints);

    // Calculate approximate area
    const area = calculatePolygonArea(boundaryPoints);

    alert(
        "Boundary Created Successfully!\n\n" +
        "Points: " + surveyPoints.length + "\n" +
        "Approx. Area: " + area.toFixed(2) + " m²"
    );

    console.log(
        "Boundary Area:",
        area.toFixed(2),
        "m²"
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


    updatePointCount();

    updateGPSStatus(
        "error",
        "GPS Not Started"
    );
}


/* =========================================================
   PAGE LOAD
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initializeFieldSurvey
);