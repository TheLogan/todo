const { createClient } = supabase;


const supaUrl = Deno.env.get("supaUrl");  
const supaAnonKey = Deno.env.get("supaAnonKey");  


const supaClient = createClient(supaUrl, supaAnonKey);

// html elements
const loginButton = document.getElementById("signInBtn");
const loginButon = document.getElementById("signInBtn");
const logoutButton = document.getElementById("signOutBtn");
const whenSignedIn = document.getElementById("whenSignedIn");
const whenSignedOut = document.getElementById("whenSignedOut");
const userDetails = document.getElementById("userDetails");
const myThingsSection = document.getElementById("myThings");
const myThingsList = document.getElementById("myThingsList");
const allThingsSection = document.getElementById("allThings");
const allThingsList = document.getElementById("allThingsList");
const createThing = document.getElementById("createThing");

// Event listeners

loginButton.addEventListener("click", () => {
  supaClient.auth.signInWithOAuth({
    provider: "google"
  });
})

createThing.addEventListener("click", async () => {
  const { data: { user } } = await supaClient.auth.getUser();
  const thing = createRandomThing(user);
  console.log('thing', thing);
  await supaClient.from("things").insert([thing]);
})

logoutButton.addEventListener("click", () => {
  supaClient.auth.signOut();
})

// init
checkUserOnStartUp();
let myThingsSubscription;
const myThings = {};
const allThings = {};
getAllInitialThings().then(() => listenToAllThings());

supaClient.auth.onAuthStateChange((_event, session) => {
  if (session?.user) {
    adjustForUser(session.user);
  } else {
    adjustForNoUser()
  }
})

// function declarations
async function checkUserOnStartUp() {
  const { data: { user }, } = await supaClient.auth.getUser();
  console.log('user', user)
  if (user) {
    adjustForUser(user)
  } else {
    adjustForNoUser();
  }
}

async function adjustForUser(user) {
  whenSignedIn.hidden = false;
  whenSignedOut.hidden = true;
  myThingsSection.hidden = false;
  userDetails.innerHTML = `
    <h3>Hi ${user.user_metadata.full_name}</h3>
    <img src="${user.user_metadata.avatar_url}" referrerPolicy="no-referrer" />
    <p>UID: ${user.id} </p>`;
    await getMyInitialThings(user);
    listentoMyThingsChanges(user);
}
function adjustForNoUser() {
  whenSignedIn.hidden = true;
  whenSignedOut.hidden = false;
  myThingsSection.hidden = true;
  if(myThingsSubscription) {
    myThingsSubscription.unsubscribe();
    myThingsSubscription = null;
  }
}

async function getAllInitialThings() {
  const { data } = await supaClient.from("things").select();
  for (const thing of data) {
    allThings[thing.id] = thing;
  }
  renderAllThings();
}

function renderAllThings() {
  const tableHeader = `
  <thead>
  <tr>
    <th>Name</th>
    <th>Weight</th>
  </tr>
  </thead>
  `;

  const tableBody = Object.values(allThings)
    .sort((a, b) => (a.weight > b.weight ? -1 : 1))
    .map((thing) => {
      return `
    <tr>
      <td>${thing.name}</td>
      <td>${thing.weight}</td>
    </tr>
    `;
    })
    .join("");

  const table = `
    <table class="table table-striped">
    ${tableHeader}
    <tbody>${tableBody}</tbody>
    </table>
  `;
  allThingsList.innerHTML = table;
}

function createRandomThing(user) {
  if (!user) {
    console.error("Must be signed in to create a thing");
    return;
  }
  return {
    name: faker.commerce.productName(3),
    weight: Math.round(Math.random() * 100),
    owner: user.id,
  }
}

function handleAllThingsUpdate(update) {
  if (update.eventType === "DELETE") {
    delete allThings[update.old.id];
  } else {
    allThings[update.new.id] = update.new;
  }
  renderAllThings();
}

function listenToAllThings() {
  supaClient
    .channel(`public:things`)
    .on("postgres_changes",
      { event: "*", schema: "public", table: "things" },
      handleAllThingsUpdate)
    .subscribe()
}
async function getMyInitialThings(user) {
  const { data } = await supaClient
    .from("things")
    .select("*")
    .eq("owner", user.id);

  for (const thing of data) {
    myThings[thing.id] = thing;
  }

  renderMyThings();
}

function handleMyThingsUpdate(update) {
  if (update.eventType === "DELETE") {
    delete myThings[update.old.id];
  } else {
    myThings[update.new.id] = update.new;
  }

  renderMyThings();
}

function listentoMyThingsChanges(user) {
  if (myThingsSubscription) return;

  supaClient.channel(`public:things:owner=eq.${user.id}`)
    .on("postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "things",
        filter: `owner=eq.${user.id}`
      },
      handleMyThingsUpdate
    )
    .subscribe();
}

function renderMyThings() {
  const tableHeader = `
  <thead>
  <tr>
    <th>Name</th>
    <th>Weight</th>
    <th></th>
  </tr>
  </thead>
  `;

  const tableContents = Object.values(myThings)
    .sort((a, b) => (a.weight > b.weight ? -1 : 1))
    .map((thing) => {
      return `
    <tr>
      <td>${thing.name}</td>
      <td>${thing.weight}</td>
      <td>${deleteButtonTemplate(thing)}</td>
    </tr>
    `;
    })
    .join("");

  const table = `
    <table class="table table-striped">
    ${tableHeader}
    <tbody>${tableContents}</tbody>
    </table>
  `;
  myThingsList.innerHTML = table;

}

function deleteButtonTemplate(thing) {
  return `
    <button onclick="deleteAtId(${thing.id})"
    class="btn btn-outline-danger"
    >
    ${trashIcon}
    </button>
  `;
  }

async function deleteAtId(id) {
  await supaClient.from("things").delete().eq("id",id);
}

const trashIcon = `❌`;