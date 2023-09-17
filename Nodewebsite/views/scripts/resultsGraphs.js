/*
    *  This file contains the functions that are used to create the functional network
    *  visualisation on the result page
    *
    *  - Populate the network graph
    *  - Deal with filters
    *
*/
// grab the sample name from the url param sampleSelection=sampleName
const regex = /sampleSelection=([^&^#]+)/;
const thisSample = regex.exec(window.location.href)[1]
if (thisSample === null) {
    console.error("Cytoscape: No sample name found in url")
}

let cy;
let data;
const filters = {
    'sequence_type':true,
    'time_of_sampling':true,
    'isolation_location':true,
    'species':true,
    'isolation_host':true,
    'isolation_source':true,
}
// wighting of ani in the mash vs ani distance calculation
// 0 -> all mash
// 1 -> all ani
let weight = 0.5

/**
    * @description Converts a similarity to a distance
    * @param {number} similarity - similarity between 0 and 100
    * @returns {number} distance between 0 and 1
    */
function similarityToDistance(similarity){
    // convert similarity to distance
    // 0 -> 1
    // 1 -> 0
    return 1 - (similarity/100);
}

/**
    * @description Converts a value between 0 and 1 to its corresponding
    *               value between 0 and 1, exponentially. Makes it 
    *               easier to select values closer to 0
    * @param {number} x - value between 0 and 1
    * @returns {number} value between 0 and 1
    *               0 -> 0
    *               1 -> 1
    *               0.5 -> 0.25
    *               0.25 -> 0.0625
    *               0.75 -> 0.5625
    */
function exponential(x){
    return Math.pow(x, 3);
}

function createNetwork() {
    const cy = cytoscape({
        container: document.getElementById('cy'),
        elements: [
            // nodes
            { data: { id: thisSample }, style: { 'background-color': 'grey' } }
        ],
        style: [{
            selector: 'node', style: { 'background-color': '#468e94', label: 'data(id)' },
        }, {
            selector: 'edge', style: { 'curve-style': 'bezier', 'control-point-step-size': 10 }
        }
        ],
    });
    return cy;
}


// get the data from the server
// we want:
//  1. sample names
//  2. sample metadata
//  3. distance from this sample to that sample
async function fetchCloseSamples() {
    const res = await fetch('/getCloseSamples/?sampleId=' + thisSample);
    const data = await res.json();
    return data;
}

function populateNetwork() {
    const collection = cy.collection();
    // iterate through all the data, adding a connection between the sample and the other
    const colors = {
        'sequence_type': 'green',
        'time_of_sampling': 'purple',
        'isolation_location': 'red',
        'species': 'teal',
        'isolation_host': 'blue',
        'isolation_source': 'orange',
    }
    const thisData = data.filter((other) => other.sample_id === thisSample)[0];
    if (thisData === undefined) {
        console.error("Cytoscape: No data found for sample " + thisSample);
        return;
    }

    data.forEach((other) => {
        if (other.sample_id == thisSample) return;
        // work out what is common (but not empty or null) between the two samples
        const common = Object.keys(thisData).filter((key) => {
            return key !== 'mash_distance' && thisData[key] === other?.[key] && thisData[key] !== null && thisData[key] !== '-' && thisData[key] !== 'null'
        });
        if (common.length === 0) {
            return;
        }
        // add the node
        collection.merge(cy.add({
            data: { id: other.sample_id, ...other, common },
        }));
        // get the node element
        const el = cy.getElementById(other.sample_id);
        el.on('click', () => {
            // add the popup
            popupS.confirm({
                content: 
                   `<div class="popup">
                        <h3 style="margin:0 auto">${other.sample_id}</h3>
                        <p>Mash Distance: ${other.mash_distance}</p>
                        <p>ANI: ${other?.ani?.ani}</p>
                        <p>Isolation Host: ${other.isolation_host || 'Unknown'}</p>
                        <p>Isolation source: ${other.isolation_source || 'Unknown'}</p>
                        <p>Isolation location: ${other.isolation_location || 'Unknown'}</p>
                        <p>Sequence type: ${other.sequence_type || 'Unknown'}</p>
                        <p>Species: ${other.species || 'Unknown'}</p>
                        <p>Time of sampling: ${other.time_of_sampling || 'Unknown'}</p>
                    </div>`,
                labelOk: 'View Sample',
                labelCancel: 'Close',
                additionalButtonCancelClass: 'popUpButtonCSS',
                additionalButtonOkClass: 'popUpButtonCSS',
                onSubmit: function() {
                    window.location.href = '/result/?sampleSelection=' + other.sample_id;
                }
            });
        });
        // add the edges
        common.forEach((key) => {
            collection.merge(cy.add({
                data: {
                    id: thisSample + '-' + other.sample_id + '-' + key,
                    source: thisSample,
                    target: other.sample_id,
                },
                classes: key,
                style: {
                    'line-color': colors[key]
                }

            }));
        });
    });

    cy.layout({
        name: 'cola'
    }).run()
}

/**
    * Updates the graph based on filters
    * Minimum connections
    * Maximum distance
*/
function updateCytoscape() {
    const minConnections = document.getElementById('cyMinConnections').value;
    const maxDistanceValue = document.getElementById('cyMaxDistance').value;
    const maxDistance = exponential(maxDistanceValue);
    const includeNoDistance = document.getElementById('cyIncludeNoDistance').checked;
    const ani_unavailable = [];
    cy.elements().forEach((el) => {
        if(el.isEdge()){
            // if relevant filter is disabled, hide the edge
            if(!filters[el.classes()]) {
                el.style('display', 'none');
                return;
            }else{
                el.style('display', 'element');
            }

        }
        if (el.isNode()) {
            const ani_available = el.data('ani')?.ani !== undefined;

            if(el.data('id') === thisSample) return;
            // filters -> 
            mask = el.data('common').filter((key) => filters[key]);
            if (mask.length === 0) {
                el.style('display', 'none');
                return;
            }
            const connections = el.connectedEdges().length;
            if (connections < minConnections) {
                el.style('display', 'none');
                return;
            }
            const mash_distance = el.data('mash_distance');
            const ani_similarity = el.data('ani')?.ani;
            let distance;
            if(!ani_similarity){
                // use mash
                distance = mash_distance;
                // notify that ani is not available
            }else{
                distance = (weight * similarityToDistance(ani_similarity)) + ((1-weight) * mash_distance);
            }
            if (distance > maxDistance || distance === undefined && !includeNoDistance) {
                el.style('display', 'none');
                return;
            }
            el.style('display', 'element');
            if(!ani_available){
                ani_unavailable.push(el.data('id'));
            }
        }
    }
    );
    const error = document.getElementById('distanceError');
    const errorContainer = document.getElementById('distanceErrorContainer');
    if(ani_unavailable.length > 0){
        errorContainer.style.display = 'flex';
        error.innerText = `ANI unavailable for ${ani_unavailable.length} samples`; 
        $("#distanceErrorInfo").tooltip({
            title: ani_unavailable.join(', '),
        });
    }else{
        errorContainer.style.display = 'none';
    }
}

function changeConnection(filter, el){
    el.classList.toggle('legend-disabled');
    filters[filter] = !filters[filter];
    updateCytoscape();
}

/* Cytoscape Buttons */

function centerCy(){
    // reset zoom
    cy.zoom(1);
    // center
    cy.center();
}

function saveCy(){
    // save as png
    const im = cy.png();
    // create the link
    const a = document.createElement('a');
    // set the href to the image
    a.href = im
    // set the download attribute to the filename
    a.download = 'network.png';
    // click the link
    a.click();
}

function zoomInCy(){
    cy.zoom(cy.zoom() + 0.1);
}

function zoomOutCy(){
    cy.zoom(cy.zoom() - 0.1);
}

function fullScreenCy(){
    const container = document.getElementById('resultsPageGraphComponents');
    container.requestFullscreen();
    // make background white
    container.style.backgroundColor = 'white';
}

function minimizeCy(){
    document.exitFullscreen();
    const container = document.getElementById('resultsPageGraphComponents');
    container.style.backgroundColor = 'none';
}



/* FRIENDS SECTION */

function makeSlider(element, type) {

    let startX = 0, x = 0;
    const width = document.getElementById("slider").offsetWidth;
    let elementLeft = element.offsetLeft;
    let otherLeft = 0;

    element.onmousedown = dragMouseDown;

    // update text and values on first load
    // dispatch the event

    function dragMouseDown(e) {
        e = e || window.event;
        e.preventDefault();
        startX = e.clientX;
        elementLeft = element.offsetLeft;
        otherLeft = type === "min" ? document.getElementById("maxGeneticDistThumb").style.left : document.getElementById("minGeneticDistThumb").style.left;
        otherLeft = otherLeft === "" ? 0 : parseInt(otherLeft);
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
        e = e || window.event;
        e.preventDefault();
        dx = e.clientX - startX;
        let newLeft = elementLeft + dx;
        if (newLeft < 0) {
            newLeft = 0;
        }
        if (newLeft > width) {
            newLeft = width;
        }
        // prevent going over 'other' slider
        if (type === "min" && newLeft > otherLeft) {
            newLeft = otherLeft - 1;
        }
        if (type === "max" && newLeft < otherLeft) {
            newLeft = otherLeft + 1;
        }
        element.style.left = newLeft + "px";
        // calculate as percentage
        newValue = newLeft / width;



        // update label with new value (6dp)
        const selectedSlider = document.getElementById("selectedSlider");

        if (type === "min") {
            selectedSlider.style.left = newLeft + "px";
            document.getElementById("minGeneticDist").innerText = exponential(newValue).toFixed(6);
        } else {
            selectedSlider.style.right = width - newLeft + "px";
            document.getElementById("maxGeneticDist").innerText = exponential(newValue).toFixed(6);
        }
    }

    function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
        populateFriendsSection();
    }
}


function populateFriendsSection() {
    let parentSection = document.getElementById("findMyFriendsCards"); // Now create cards
    parentSection.innerHTML = "";
    let count = 0;
    let min_dist = parseFloat(document.getElementById("minGeneticDist").innerText);
    let max_dist = parseFloat(document.getElementById("maxGeneticDist").innerText);
    if(isNaN(max_dist)) max_dist = 1;
    if(isNaN(min_dist)) min_dist = 0;

    // filter data 
    let data_copy = data.filter((sample) => {
        const has_ani = sample?.ani?.ani !== undefined;
        let weighted_dist;
        if(!has_ani){
            weighted_dist = sample.mash_distance;
        }else{
         weighted_dist = (weight * similarityToDistance(sample?.ani?.ani)) + ((1-weight) * sample.mash_distance);
        }
        sample.distance = parseFloat(weighted_dist).toFixed(6);
        sample.has_ani = has_ani;
        return weighted_dist >= min_dist && weighted_dist <= max_dist
    });

    if(data_copy.length === 0){
        // show a message saying no samples found
        const noSamples = document.createElement("div");
        noSamples.innerHTML = 
            `<b>No samples found within the selected range</b>`
        ;
        noSamples.setAttribute("style", "text-align: center; margin: 20px auto; font-size: 1.2em;");
        parentSection.appendChild(noSamples);
        return;
    }

    // sort data by distance (ascending)
    data_copy.sort((a, b) => {
        return parseFloat(a.distance) - parseFloat(b.distance);
    });

    data_copy.forEach(function(sample) {
        // skip if this sample
        if (sample.sample_id === thisSample) return;
        // make sure distance is a number
        genomeCard = createGenomeCard(sample);
        parentSection.appendChild(genomeCard);

        tag = parentSection.getElementsByClassName("geneticDistanceTag")[count]; // Position the tag
        card = parentSection.getElementsByClassName("genomeCard")[count];
        tag.setAttribute("style", `z-index: 1; top: ${- 1 * 0.5 * tag.clientHeight}px; left: ${0.5 * card.clientWidth}px; width: ${0.6 * card.clientWidth}px;`);
        count++;
    });
}

function createGenomeCard(sample) {
    let newCard = document.createElement("button");
    newCard.setAttribute("class", "genomeCard");
    newCard.setAttribute("name", "sampleSelection");
    newCard.setAttribute("value", `${sample.sample_id}`);
    newCard.setAttribute("onclick", "window.location.href='/result'");
    newCard.setAttribute("type", "submit");

    let info = document.createElement("p");

    let display = `<div class="genomeCardSampleId"><h4>${sample.sample_id}</h4></div>
        <div class="genomeCardSampleMetadata" style="text-align:left"> 
            <table>
        ${sample.has_ani ?
                `<tr>
                    <td><b>Weighted Distance</b></td>
                    <td>${sample.distance}</td>
                </tr>`
                : 
                `
                <tr><td><b>ANI Unavailable</b></td></tr>
                <tr>
                    <td><b>Mash Distance</b></td>
                    <td>${sample.mash_distance}</td>
                </tr>`
            }
                <tr>
                    <td><b>Isolation Host</b></td>
                    <td>${sample.isolation_host || 'Unknown'}</td>
                </tr>
                <tr>
                    <td><b>Isolation source</b></td>
                    <td>${sample.isolation_source || 'Unknown'}</td>
                </tr>
                <tr>
                    <td><b>Isolation location</b></td>
                    <td>${sample.isolation_location || 'Unknown'}</td>
                </tr>
                <tr>
                    <td><b>Sequence type</b></td>
                    <td>${sample.sequence_type || 'Unknown'}</td>
                </tr>
                <tr>
                    <td><b>Species</b></td>
                    <td>${sample.species || 'Unknown'}</td>
                </tr>
                <tr>
                    <td><b>Time of sampling</b></td>
                    <td>${sample.time_of_sampling || 'Unknown'}</td>
                </tr>
        </table>
        </div>
       <div class="geneticDistanceTag">${sample.distance}</div>`;

    info.innerHTML = display;
    newCard.innerHTML = info.outerHTML;

    return newCard;
}

function showLoadingElements() {
    const graphId = "lazy";
    const styleEl = document.head.appendChild(document.createElement("style"));
    styleEl.setAttribute("id", "loadingStyles");
    // pulse loading light grey to dark grey
    styleEl.innerHTML =
        `
        @keyframes pulse {
            0%, 100% {
                background-color: #e0e0e0;
            }
            50% {
                background-color: #a0a0a0;
            }
        } 
        #${graphId} { 
            visibility: hidden;
            position: relative;
        }
        #${graphId}::before {
            content: "";
            position: absolute;
            border-radius: 10px;
            display:block;
            top:0; 
            left: 0;
            right:0;
            bottom:0;
            animation: pulse 1.5s infinite;
            visibility: visible;
        }`;

}

function hideLoadingElements() {
    const styleEl = document.getElementById("loadingStyles");
    styleEl.parentNode.removeChild(styleEl);
}

/**
    * @description Initialises the weighting slider so that it changes the weighting of 
    *               mash vs ani
    */
function initWeightingSlider(){
    // get the slider
    const slider = document.getElementById("weightingInput");
    // listen for changes
    slider.addEventListener("input", (e) => {
        // get the value
        const value = e.target.value;
        // set the weight
        weight = value;
        // update the text
        document.getElementById("aniWeight").innerText = parseFloat(value).toFixed(2);
        document.getElementById("mashWeight").innerText = (1-parseFloat(value)).toFixed(2);
        // update the graph
        populateFriendsSection();
        updateCytoscape();
    });
    // run the eventListener once to set the initial values
    slider.dispatchEvent(new Event("input"));
}


function initFilterSlider(){
    // get the slider 
    const slider = document.getElementById("cyMaxDistance");
    // add the listener
    slider.addEventListener("input", (e) => {
        const value = e.target.value;
        const exponentialValue = exponential(value);
        document.getElementById('maxDist').innerHTML=exponentialValue.toFixed(6);
        updateCytoscape();
    });
    // run the eventListener once to set the initial values
    slider.dispatchEvent(new Event("input"));
}


window.onload = async function() {
    // display placeholder loading elements
    showLoadingElements();
    const minSlider = document.getElementById("minGeneticDistThumb");
    const maxSlider = document.getElementById("maxGeneticDistThumb");
    makeSlider(minSlider, "min");
    makeSlider(maxSlider, "max");

    cy = createNetwork();
    data = await fetchCloseSamples();

    initWeightingSlider();
    initFilterSlider();

    populateNetwork();
    updateCytoscape();
    populateFriendsSection();
    // hide loading elements
    hideLoadingElements();

    // init tooltips
    $('[data-toggle="tooltip"]').tooltip();
}



