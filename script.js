"use strict";

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector(".form");
const containerActivities = document.querySelector(".activities");
const inputType = document.querySelector(".form__input--type");
const inputCost = document.querySelector(".form__input--cost");
const inputDuration = document.querySelector(".form__input--duration");
const inputMeals = document.querySelector(".form__input--meals");
const inputItems = document.querySelector(".form__input--items");
const deleteAllBtn = document.querySelector(".delete-btn");

class Activity {
  date = new Date();
  id = (Date.now() + "").slice(-10);
  constructor(coords, duration, cost) {
    this.coords = coords;
    this.duration = duration;
    this.cost = cost;
  }

  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
}

class Eating extends Activity {
  type = "eating";
  constructor(coords, duration, cost, meals) {
    super(coords, duration, cost);
    this.meals = meals;
    this._setDescription();
  }
}

class Shopping extends Activity {
  type = "shopping";
  constructor(coords, duration, cost, items) {
    super(coords, duration, cost);
    this.items = items;
    this._setDescription();
  }
}

///////////////////////////////
/////////////////////////////////////////////////////////

class App {
  #map;
  #mapEvent;
  #activities = [];
  #mapZoomLevel = 13;
  constructor() {
    // Get Position
    this._getPosition();

    // Get data from Local Storage
    this._getLocalStorage();

    inputType.addEventListener("change", this._toggleElevationField);
    form.addEventListener("submit", this._newWorkout.bind(this));
    containerActivities.addEventListener("click", this._moveToPopup.bind(this));
    containerActivities.addEventListener(
      "click",
      this._deleteActivity.bind(this)
    );
    containerActivities.addEventListener(
      "click",
      this._deleteAllActivity.bind(this)
    );
  }

  _getPosition() {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert("ERROR COULD NOT LOAD MAP");
        }
      );
  }

  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    const coords = [latitude, longitude];

    this.#map = L.map("map").setView(coords, this.#mapZoomLevel);

    L.tileLayer("https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    this.#map.on("click", this._showForm.bind(this));

    this.#activities.forEach((act) => {
      this._renderActivityMarker(act);
    });
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove("hidden");
    inputCost.focus();
  }

  _hideForm() {
    inputCost.value =
      inputDuration.value =
      inputItems.value =
      inputMeals.value =
        "";
    form.style.display = "none";
    form.classList.add("hidden");
    setTimeout(() => (form.style.display = "grid"), 1000);
  }

  _toggleElevationField() {
    inputMeals.closest(".form__row").classList.toggle("form__row--hidden");
    inputItems.closest(".form__row").classList.toggle("form__row--hidden");
  }

  _newWorkout(e) {
    const validInputs = (...inputs) =>
      inputs.every((inp) => Number.isFinite(inp));

    const allPositive = (...inputs) => inputs.every((inp) => inp > 0);

    e.preventDefault();

    // Get data from form
    const type = inputType.value;
    const cost = +inputCost.value;
    const duration = +inputDuration.value;
    const { lat } = this.#mapEvent.latlng;
    const { lng } = this.#mapEvent.latlng;
    let activity;

    // If activity is eating, create eating object
    if (type === "eating") {
      const meals = +inputMeals.value;

      if (
        !validInputs(duration, cost, meals) ||
        !allPositive(duration, cost, meals)
      )
        return alert("Inputs have to be positive numbers");

      activity = new Eating([lat, lng], duration, cost, meals);
    }

    // If activity is shopping, create shopping object
    if (type === "shopping") {
      const items = +inputItems.value;

      if (
        !validInputs(duration, cost, items) ||
        !allPositive(duration, cost, items)
      )
        return alert("Inputs have to be positive numbers");

      activity = new Shopping([lat, lng], duration, cost, items);
    }

    // Add new object to activities array
    this.#activities.push(activity);

    // Render activity on map as marker
    this._renderActivityMarker(activity);

    // Render activity on list
    this._renderActivity(activity);

    // Hide form + clear inputs
    this._hideForm();

    // Set Local Storage
    this._setLocalStorage();
  }

  _renderActivityMarker(activity) {
    L.marker(activity.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${activity.type}-popup`,
        })
      )
      .setPopupContent(
        `${activity.type === "eating" ? "🍽️" : "🛒"} ${activity.description}`
      )
      .openPopup();
  }

  _renderActivity(activity) {
    let html = `
      <li class="activity activity--${activity.type}" data-id="${activity.id}">
      <i class="fas fa-times-circle close-icon"data-id="${activity.id}" >X</i>
          <h2 class="activity__title">${activity.description}</h2>
          <div class="activity__details">
            <span class="activity__icon">${
              activity.type === "eating" ? "🍽️" : "🛒"
            }</span>
            <span class="activity__value">${
              activity.type === "eating" ? activity.meals : activity.items
            }</span>
            <span class="activity__unit">${
              activity.type === "eating" ? "Meals" : "Items"
            }</span>
          </div>
          <div class="activity__details">
            <span class="activity__icon">💸</span>
            <span class="activity__value">${activity.cost}</span>
            <span class="activity__unit">$</span>
          </div>
      `;

    html += `
        <div class="activity__details">
        <span class="activity__icon">⏱</span>
        <span class="activity__value">${activity.duration}</span>
        <span class="activity__unit">min</span>
       </div>
      </li>
      `;

    form.insertAdjacentHTML("afterend", html);
    deleteAllBtn.classList.remove("hidden");
  }

  _deleteActivity(e) {
    const closeEl = e.target.closest(".close-icon");
    if (!closeEl) return;
    const activity = this.#activities.find(
      (work) => work.id === closeEl.dataset.id
    );
    const activityEl = e.target.closest(".activity");

    activityEl.style.display = "none";
    this.#activities.pop(activity);
    this._setLocalStorage();
    location.reload();
  }

  _deleteAllActivity(e) {
    const deleteBtnEl = e.target.closest(".delete-btn");
    if (!deleteBtnEl) return;
    containerActivities.style.display = "none";
    while (this.#activities.length) {
      this.#activities.pop();
    }
    this._setLocalStorage();
    location.reload();
  }

  _moveToPopup(e) {
    if (!this.#map) return;

    const activityEl = e.target.closest(".activity");
    if (!activityEl) return;
    console.log(activityEl);

    const activity = this.#activities.find(
      (act) => act.id === activityEl.dataset.id
    );

    this.#map.setView(activity.coords, this.#mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }

  _setLocalStorage() {
    localStorage.setItem("activities", JSON.stringify(this.#activities));
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem("activities"));

    if (!data) return;

    this.#activities = data;

    this.#activities.forEach((act) => {
      this._renderActivity(act);
    });
  }
}

const app = new App();
