/*
    Authors: Jackson Frazier, Nic Murgas
    Purpose: Primary JavaScript for application giving general functionality 
*/
document.addEventListener("DOMContentLoaded", function() {
    document.querySelector(".tablinks").click(); // Trigger the first tab
});

function openTab(evt, tabName) {
    var i, tabcontent, tablinks;
  
    // Get all elements with class="tabcontent" and hide them
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
      tabcontent[i].classList.remove("active"); // Remove active class from tab content
    }
  
    // Get all elements with class="tablinks" and remove the class "active"
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
      tablinks[i].classList.remove("active"); // Remove active class from all buttons
    }
  
    // Show the current tab by adding the "active" class
    var activeTab = document.getElementById(tabName);
    activeTab.classList.add("active"); // Add active class to the tab content
  
    // Add "active" class to the button that was clicked
    evt.currentTarget.classList.add("active"); // Add active class to the clicked tab button
  }