/*
 * Name: Bryce Mackey
 * Date: February 11, 2022
 * Section: CSE 154 AH
 *
 * This is the JS to implement the UI for the sister postal code finder. By using the Zippopotamus
 * API, it searches every possible country that could have the user's postal code and generates
 * lists of all matches and of all matches of the code spelled backwards.
 */

'use strict';
(function() {
  const API_URL = 'https://api.zippopotam.us/';
  const MAP_URL = 'https://www.google.com/maps/search/?api=1&query=';
  const FOUR_DIGIT_COUNTRIES = ['AR', 'AT', 'AU', 'BD', 'BE', 'BG', 'CH', 'DK', 'GL', 'HU', 'LI',
        'LU/L-', 'MD/MD-', 'MK', 'NL', 'NO', 'NZ', 'PH', 'SI', 'SJ', 'ZA'];
  const FIVE_DIGIT_COUNTRIES = ['AS', 'DE', 'DO', 'ES', 'FI', 'FR', 'GF', 'GP', 'GT', 'GU', 'GY',
        'HR', 'IT', 'LK', 'LT', 'MC', 'MH', 'MP', 'MQ', 'MX', 'MY', 'PK', 'PM', 'PR', 'RE', 'SE',
        'SM', 'TH', 'TR', 'US', 'VA', 'VI', 'YT'];

  window.addEventListener('load', init);

  /** Prepares the search button upon intialization. */
  function init() {
    id('search-btn').addEventListener('click', search);
  }

  /**
   * creates a "Sister Postal Codes" and "Bizarro-World Postal Codes" section and fills them with
   * zip code information from fetch requests to the API for every country whose zip code format
   * matches the amount of digits in the input.
   */
  async function search() {
    id('content').innerHTML = '';
    createSection('sister');
    let input = id('input-code').value.trim();
    let possibleUrls = getUrls(input);
    for (let i = 0; i < possibleUrls.length; i++) {
      await fetchZipInfo(possibleUrls[i], 'sister', input.length, i);
    }
    checkNumSisters();
    let bizarroInput = reverseString(input);
    if (bizarroInput !== input) {
      createSection('bizarro-world');
      let possibleReverseUrls = getUrls(bizarroInput);
      for (let i = 0; i < possibleReverseUrls.length; i++) {
        await fetchZipInfo(possibleReverseUrls[i], 'bizarro-world', input.length, i);
      }
      checkNumBizarros();
    }
  }

  /**
   * Generates either a new "sister" or "bizarro-world" section when the search button is clicked.
   * @param {string} name - the name/ID of the section being created.
   */
  function createSection(name) {
    let section = gen('section');
    section.setAttribute('id', name);
    let heading = gen('h2');
    heading.textContent = name + ' Postal Codes:';
    section.appendChild(heading);
    let message = gen('p');
    message.setAttribute('id', name + '-message');
    section.appendChild(message);
    id('content').appendChild(section);
  }

  /**
   * Returns an array of all potential API URLs for the given zip code in different countries.
   * @param {string} input - the user's inputted zip code.
   * @returns {array} possibleUrls - a list of all possible API URLs for the user's zip code.
   */
  function getUrls(input) {
    let possibleUrls = [];
    if (input.length === 4) {
      for (let i = 0; i < FOUR_DIGIT_COUNTRIES.length; i++) {
        let zipCodeUrl = API_URL + FOUR_DIGIT_COUNTRIES[i];
        if (!FOUR_DIGIT_COUNTRIES[i].includes('/')) {
          zipCodeUrl += '/';
        }
        zipCodeUrl += input;
        possibleUrls.push(zipCodeUrl);
      }
    } else if (input.length === 5) {
      for (let i = 0; i < FIVE_DIGIT_COUNTRIES.length; i++) {
        let zipCodeUrl = API_URL + FIVE_DIGIT_COUNTRIES[i] + '/' + input;
        possibleUrls.push(zipCodeUrl);
      }
    }
    return possibleUrls;
  }

  /**
   * Checks the amount of zip codes displayed in the sister section and displays an appropriate
   * message if there is only one match or if the user's input wasn't found at all.
   */
  function checkNumSisters() {
    let sisters = qsa('#sister div');
    let message = id('sister-message');
    if (sisters.length === 0) {
      message.textContent = 'Sorry, I couldn\'t find your postal code.';
    } else if (sisters.length === 1) {
      message.textContent = 'This postal code has no exact matches. Yours is one of a kind!';
    } else {
      id('sister').removeChild(message);
    }
  }

  /**
   * Checks the amount of zip codes displayed in the bizarro-world section and displays an
   * appropriate message if no matches were found.
   */
  function checkNumBizarros() {
    let bizarros = qsa('#bizarro-world div');
    let message = id('bizarro-world-message');
    if (bizarros.length === 0) {
      message.textContent = 'No matches found for your postal code spelled backwards.';
    } else {
      id('bizarro-world').removeChild(message);
    }
  }

  /**
   * Conducts a single fetch request from the Zippopotamus API using the given URL and handles the
   * data (or lack thereof) accordingly.
   * @param {string} url - the current API URL being used to potentially find a matching zip code.
   * @param {string} section - the name/id of the section to which current zip code corresponds.
   * @param {number} numDigits - the number of digits in the user's inputted postal code.
   * @param {number} i - the current index of the array of country abbreviations that corresponds to
   * the input postal code.
   */
  async function fetchZipInfo(url, section, numDigits, i) {
    try {
      let response = await fetch(url);
      await statusCheck(response);
      let json = await response.json();
      await processJson(json, section);
    } catch (err) {
      handleRequestError(section, numDigits, i);
    }
  }

  /**
   * Creates a div that displays information about country, city, and state with google maps links
   * for a valid zip code that has been found.
   * @param {object} response - the response object from the API containing zip code information.
   * @param {string} sectionName - the name/id of the section that the current zip code will be
   * displayed.
   */
  function processJson(response, sectionName) {
    let infoBox = gen('div');
    let countryInfo = gen('h3');
    countryInfo.textContent = response.country + ' Postal Code ' + response['post code'] + ":";
    infoBox.appendChild(countryInfo);
    for (let i = 0; i < response.places.length; i++) {
      let cityInfo = gen('a');
      cityInfo.href = MAP_URL + response.places[i].latitude + ',' + response.places[i].longitude;
      cityInfo.textContent = response.places[i]['place name'] + ', ';
      if (response.places[i].state !== '') {
        cityInfo.textContent += response.places[i].state;
      } else {
        cityInfo.textContent += response.country;
      }
      infoBox.appendChild(cityInfo);
    }
    id(sectionName).insertBefore(infoBox, id(sectionName + '-message'));
  }

  /**
   * Checks the status of a fetch request and throws an error if it's out of the ok range.
   * @param {object} response - the json object being checked
   */
  function statusCheck(response) {
    if (!response.ok) {
      throw new Error(response.text());
    }
  }

  /**
   * Displays a brief message whenever an invalid postal code is tried during a search, or an error
   * message if another error occurs.
   * @param {string} sectionName - the name/id of the current section.
   * @param {number} numDigits - the number of digits in the user's inputted postal code.
   * @param {number} i - the current index of the array of country abbreviations that corresponds to
   * the input postal code.
   */
  function handleRequestError(sectionName, numDigits, i) {
    let countryCode;
    let message = id(sectionName + '-message');
    if (numDigits === 4) {
      countryCode = FOUR_DIGIT_COUNTRIES[i].substring(0, 2);
      message.innerText = ('No such zip code found in country code ' + countryCode +
            ', still searching...');
    } else if (numDigits === 5) {
      countryCode = FIVE_DIGIT_COUNTRIES[i];
      message.innerText = ('No such zip code found in country code ' + countryCode +
            ', still searching...');
    } else {
      let content = id();
      content.innerHTML = '';
      let errorMessage = gen('p');
      errorMessage.innerText = 'Sorry, an error occurred while processing your request.';
      content.appendChild(errorMessage);
    }
  }

  /**
   * Reverses a given string (for creating bizarro-world versions of  zip codes).
   * @param {string} input - the original input string.
   * @returns {string} output - the input string spelled backwards.
   */
  function reverseString(input) {
    let output = '';
    for (let i = input.length - 1; i >= 0; i--) {
      output += input[i];
    }
    return output;
  }

  /**
   * Helper function to get an element by its id.
   * @param {string} idName - the name of the desired id.
   * @returns {element} the element with that id.
   */
  function id(idName) {
    return document.getElementById(idName);
  }

  /**
   * Helper function to select all instances of a certain category of element.
   * @param {string} selector - the name of the desired selector.
   * @returns {array} all elements that fit the selector.
   */
  function qsa(selector) {
    return document.querySelectorAll(selector);
  }

  /**
   * Helper function to create an element
   * @param {string} tagName - the name of the desired tag.
   * @returns {element} the generated element.
   */
  function gen(tagName) {
    return document.createElement(tagName);
  }
})();