
// Script for dynamically fetching existing metadata about a sample
//
    // Listens for a change to the selected sample field
    // Fetches the metadata for the selected sample from server ( GET /json?sample=sampleName)
    // and populates the metadata fields with the returned data placeholders
//

async function changeSelectedSample(selection){

    // hide the form on the page
    document.getElementById("metadataFields").style.display = "none";
    // show a loading message
    document.getElementById("loadingMessage").style.display = "block";

    var sampleName = selection[0].value;

    // Fetch the metadata for the selected sample
    var response = await fetch('/addMetadata/json?sampleName='+sampleName);
    var data = await response.json();

    // Populate the metadata fields with the returned data
    // isolation host
    document.getElementById("isolationHost").value = data.isolation_host;
    // isolation source
    document.getElementById("isolationSource").value = data.isolation_source;
    // isolation location
    document.getElementById("isolationLocation").value = data.isolation_location;
    // time of sampling
    document.getElementById("timeOfSampling").value = data.time_of_sampling;
    // notes
    document.getElementById("notes").value = data.notes;


    // hide the loading message
    document.getElementById("loadingMessage").style.display = "none";

    // show the form on the page
    document.getElementById("metadataFields").style.display = "block";

}



