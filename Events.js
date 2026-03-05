const eventsContainer = document.querySelector(".events");
const modal = document.getElementById("eventModal");
const user = JSON.parse(localStorage.getItem("user"));
const teacherId = user.id;

function openModal(){
    modal.style.display = "flex";
}
function closeModal() {
  modal.style.display = "none";
}
// =========================
  // Sidebar Name
  // =========================
  const nameEl = document.getElementById("sidebarUserName");
  if (user && nameEl) {
  nameEl.textContent = user.fullname || user.name || "Teacher";
}


// LOAD EVENTS FROM DATABASE
async function loadEvents(){

const res = await fetch(`http://localhost:3000/events?teacherId=${teacherId}`);
const events = await res.json();

eventsContainer.innerHTML = "";

events.forEach(e => {

// FORMAT DATE AND TIME FIRST
const formattedDate = new Date(e.event_date).toLocaleDateString();
const formattedTime = e.event_time ? e.event_time.slice(0,5) : "";

eventsContainer.innerHTML += `
<div class="event-card">

<div class="icon green">
<i class="fa fa-calendar"></i>
</div>

<div>
<h3>${e.title}</h3>
<p>${e.description}</p>
<span>${formattedDate} • ${formattedTime}</span>
</div>

<div class="delete">
<i class="fa fa-trash" onclick="deleteEvent(${e.id})"></i>
</div>

</div>
`;

});

}


// ADD EVENT
async function addEvent() {
  const title = document.getElementById("title").value.trim();
  const date = document.getElementById("date").value.trim();
  const time = document.getElementById("time").value.trim();
  const type = document.getElementById("type").value.trim();
  const description = document.getElementById("description").value.trim();

  // Check if any required field is empty
  if (!title || !date || !time || !type || !description) {
    alert("Please fill in all required fields.");
    return; // stop execution
  }

  try {
    await fetch("http://localhost:3000/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        date,
        time,
        type,
        description,
        teacherId
      })
    });

    // Close modal and clear inputs
    modal.style.display = "none";
    document.getElementById("title").value = "";
    document.getElementById("date").value = "";
    document.getElementById("time").value = "";
    document.getElementById("description").value = "";

    // Reload events
    loadEvents();
  } catch (err) {
    console.error(err);
    alert("Something went wrong while adding the event.");
  }
}

// DELETE EVENT
async function deleteEvent(id){

const confirmDelete = confirm("Delete this event?");

if(!confirmDelete) return;

await fetch(`http://localhost:3000/events/${id}`,{
method:"DELETE"
});

loadEvents();

}


// LOAD EVENTS WHEN PAGE OPENS
loadEvents();