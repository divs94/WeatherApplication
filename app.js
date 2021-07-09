const config = {
    cUrl: "https://api.countrystatecity.in/v1/countries",
    cKey: "UWdLUE1pVWhnS3poTkRQNnBBWEFHamRGN0dEQ1BDM0IxVFIyWGRnaA==",
    wUrl: "https://api.openweathermap.org/data/2.5/",
    wKey: "a9e30f59660c6a75761abf2e80c03a5d",
};
// get countries
const getCountries = async (fieldName, ...args) => {
    let apiEndPoint;
    // https://api.countrystatecity.in/v1/countries/[ciso]/states/[siso]/cities

    switch (fieldName) {
        case "countries":
            apiEndPoint = config.cUrl;
            break;
        case "states":
            apiEndPoint = `${config.cUrl}/${args[0]}/states`;
            break;
        case "cities":
            apiEndPoint = `${config.cUrl}/${args[0]}/states/${args[1]}/cities`;
       default:

    }

    const response = await fetch(apiEndPoint, {
        headers: { "X-CSCAPI-KEY": config.cKey },
    });
    if (response.status != 200) {
        throw new Error(`Something went wrong, status code: ${response.status}`);
    }
    const countries = await response.json();
    return countries;
};
  // get weatherinfo
const getWeather = async (cityName, ccode, units = "metric") => {

    const apiEndPoint = `${config.wUrl}weather?q=${cityName},${ccode.toLowerCase()}&APPID=${config.wKey}&units=${units}`;

    try {
        const response = await fetch(apiEndPoint);
        if (response.status != 200) {
            if (response.status == 404) {
                weatherDiv.innerHTML = `<div class ="alert-danger">
            <h3>OOpss!!! NO data available.</h3>
            </div>`
            }
            else {
                throw new Error(`something went wrong, status code: ${response.status}`);
            }

        }
        const weather = await response.json();
        return weather;
    }
    catch (error) {
        console.log(error);
    }
};

const getDateTime = (unixTimeStamp) => {
    const miliSeconds = unixTimeStamp * 1000;
    const dateObject = new Date(miliSeconds);
    const options = {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    };
    const humanDateFormate = dateObject.toLocaleDateString('en-US', options);
    return humanDateFormate;
};

const tempCard = (val, unit = "cel") => {
    const flag = unit == "far" ? "°F" : "°C";
    return ` <div id="temp-card">
                            <h6 class="card-subtitle mb-2 ${unit}">${val.temp}</h6>
                                <p class="card-text">Feels Like: ${val.temp}${flag}</p>
                                <p class="card-text">Max:${val.temp_max}${flag}, Min:${val.temp_min}${flag} </p>

                        </div>`;
}





const displayWeather = (data) =>
{
    const weatherWidget = `  <div class="card">
                    <div class="card-body">
                        <h5 class="card-title">${data.name}, ${data.sys.country}
                         <span class="float-end units">
                         <a href="#"  class = "unitlink active" data-unit="cel">°C</a> | <a href="#" class = "unitlink" data-unit="far">°F</a></span>
                        </h5>
                        <p>${getDateTime(data.dt)}</p>
                        <div id="temp-card">${tempCard(data.main)}</div>
                        ${data.weather.map(w => `  <div id="img-container">${w.main} <img src="https://openweathermap.org/img/wn/${w.icon}.png"></div>
                        <p>${w.description}</p>`)

                         .join("\n")}

                    </div>
                </div>`;

    weatherDiv.innerHTML = weatherWidget;
};

const getLoader = () => {
    return `<div class="spinner-border text-info" role="status">
  <span class="visually-hidden">Loading...</span>
</div>`;
};

const countriesListDropDown = document.querySelector("#countrylist");
const statesListDropDown = document.querySelector("#statelist");
const citiesListDropDown = document.querySelector("#citylist");
const weatherDiv = document.querySelector("#weatherwidget");


// on content Load
document.addEventListener("DOMContentLoaded", async() => {
    const countries = await getCountries("countries");
   //  console.log(countries);
    let countriesOptions = "";
    if (countries)
    {
        countriesOptions += '<option value="">Country</option>';
        countries.forEach((country) => {
            countriesOptions += `<option value="${country.iso2}">${country.name}</option>`;

        });
        countriesListDropDown.innerHTML = countriesOptions;
        }


    // list states
    countriesListDropDown.addEventListener("change", async function () {
        const selectedCountryCode = this.value;

        const states = await  getCountries("states", selectedCountryCode);
        // console.log(states);
        let statesOptions = "";
        if (states) {
            statesOptions += '<option value="">State</option>';
            states.forEach((state) => {
                statesOptions += `<option value="${state.iso2}">${state.name}</option>`;

            });
            statesListDropDown.innerHTML = statesOptions;
            statesListDropDown.disabled = false;
        }
    });

    // list cities
    statesListDropDown.addEventListener("change", async function () {
        const selectedCountryCode = countriesListDropDown.value;
        const selectedStateCode = this.value;
        const cities = await getCountries("cities", selectedCountryCode,selectedStateCode);
        // console.log(cities);
        let citiesOptions = "";
        if (cities) {
            citiesOptions += '<option value="">Cities</option>';
            cities.forEach((city) => {
                citiesOptions += `<option value="${city.name}">${city.name}</option>`;

            });
            citiesListDropDown.innerHTML = citiesOptions;
            citiesListDropDown.disabled = false;
        }
    });

 // select city
    citiesListDropDown.addEventListener("change", async function () {
        const selectedCountryCode = countriesListDropDown.value;
        const selectedCity = this.value;
        weatherDiv.innerHTML = getLoader();
        const weatherInfo = await getWeather(selectedCity, selectedCountryCode);
        displayWeather(weatherInfo);

        // console.log(weatherInfo);

    });

 // change units
    document.addEventListener("click", async (e) => {
        if (e.target.classList.contains("unitlink")){
            const unitValue = e.target.getAttribute("data-unit");
            const selectedCountryCode = countriesListDropDown.value;
            const selectedCity = citiesListDropDown.value;


            const unitFlag = unitValue == "far" ? "imperial" : "metric";
            const weatherInfo = await getWeather(selectedCity, selectedCountryCode, unitFlag);

            const weatherTemp = tempCard(weatherInfo.main, unitValue);
            document.querySelector("#temp-card").innerHTML = weatherTemp;

            //active unit

            document.querySelectorAll(".unitlink").forEach(link => {
                link.classList.remove("active");
            });

            e.target.classList.add("active");
        };
    });


});