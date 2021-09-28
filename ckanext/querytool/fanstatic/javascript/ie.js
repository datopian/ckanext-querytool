if (window.document.documentMode) {
    // Do IE stuff
    document.getElementById("iepopup").style.display = "block";
    document.getElementById("ieshadow").style.display = "block"
}

function close_popup() {
    document.getElementById("iepopup").style.display = "none";
    document.getElementById("ieshadow").style.display = "none"
}