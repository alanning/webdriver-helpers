(function () {

"use strict";


// polyfill
if ( !Array.prototype.forEach ) {
  Array.prototype.forEach = function(fn, scope) {
    for(var i = 0, len = this.length; i < len; ++i) {
      fn.call(scope, this[i], i, this);
    }
  }
}

/**
 * Add properties from source object to target object
 */
function _extend (target, source) {
  for (var prop in source) {
    target[prop] = source[prop];
  }
}


/**
 * Provides several functions that make using WebDriver more 
 * convenient.
 * 
 * @example
 *     var webdriver = require('selenium-webdriver'),
 *         WebDriverHelpers = require('webdriver-helpers'),
 *         driver,
 *         helpers;
 *     
 *     driver = require('./drivers/selenium-server.js')(webdriver, {
 *       browserName: 'chrome',
 *       seleniumProtocol: 'WebDriver',
 *       'chrome.switches': ['--window-size=1366,768'] // this is being ignored
 *     });
 *
 *     driver.manage().timeouts().setScriptTimeout(5000);
 *     driver.manage().timeouts().implicitlyWait(5000);
 *
 *     helpers = new WebDriverHelpers(webdriver, driver);
 *
 *     function login (email, password) {
 *       helpers.populateElements({
 *         '#login-email': email,
 *         '#login-password': password
 *       });
 *
 *       helpers.id('login-submit-btn').click();
 *     }
 *
 * @class WebDriverHelpers
 * @param {Object} webdriver selenium-webdriver instance
 * @param {Object} driver browser driver instance
 * @return {Object} object with several convenience functions
 * @constructor
 */
var WebDriverHelpers = function (webdriver, driver) {
  this.flow = webdriver.promise.controlFlow();
  this.webdriver = webdriver;
  this.driver = driver;
};

_extend(WebDriverHelpers.prototype, {

  /**
   * Sugar for: this.driver.findElement(this.webdriver.By.name(args))
   *
   * @method name
   * @param {String} args
   * @return {Object} webdriver element
   */
  name: function (args) {
    return this.driver.findElement(this.webdriver.By.name(args));
  },

  /**
   * Sugar for: this.driver.findElement(this.webdriver.By.id(args))
   *
   * @example
   *     helpers.id('btnSubmit').click()
   * @method id
   * @param {String} args
   * @return {Object} webdriver element
   */
  id: function (args) {
    return this.driver.findElement(this.webdriver.By.id(args));
  },

  /**
   * Sugar for: this.driver.findElement(this.webdriver.By.tagName(args)
   *
   * @example
   *     var verifyOnCheckinPage = function () {
   *       helpers.tagName('h1').then(function (h1) {
   *           h1.getText().then(function (text) {
   *             expect(text).toBe("Check-In");
   *           });
   *       });
   *     };
   * @method tagName
   * @param {String} args
   * @return {Object} webdriver element
   */
  tagName: function (args) {
    return this.driver.findElement(this.webdriver.By.tagName(args));
  },

  /**
   * Sugar for: this.driver.findElement(this.webdriver.By.className(args))
   *
   * @method className
   * @param {String} args
   * @return {Object} webdriver element
   */
  className: function (args) {
    return this.driver.findElement(this.webdriver.By.className(args));
  },

  /**
   * Selects a drop-down option by value
   *
   * @method selectByValue
   * @param {webdriver.Locator|Object.<string>} locator The locator
   *     strategy to use when searching for the select element.
   * @param {string} value The value of the option to select
   */
  selectByValue: function (locator, value) {
    var selElement = this.driver.findElement(locator);
    selElement.findElement(this.webdriver.By.css("option[value='" + value + "']"))
      .click();
  },

  /**
   * Selects a radio button element by value
   *
   * @method radioByValue
   * @param {string} name The name of the radio button group
   * @param {string} value The value of the option to select
   */
  radioByValue: function (name, value) {
    var locator = "input[name='" + name + "'][value='" + value + "']";
    this.driver.findElement(this.webdriver.By.css(locator))
      .click();
  },

  /**
   * Pauses for a short amount of time, giving webdriver time
   * to re-render the page, if needed.
   *
   * @example
   *     var authenticate = function () {
   *       var name = 'Teacher User',
   *           email = 'teacher@example.com',
   *           password = 'password',
   *           deferred = webdriver.promise.defer(),
   *           i = 0;
   *
   *       helpers.populateElements({
   *         '#login-email': email,
   *         '#login-password': password
   *       });
   *       helpers.id('login-buttons-password').click();
   *       helpers.avoidStaleElement();
   *       helpers.id('display-name-link').getText()
   *         .then(function (text) {
   *           var expected = name;
   *           if (text.indexOf(expected) !== 0) {
   *             deferred.reject(new Error(text + ' did not contain ' + expected));
   *           } else {
   *             deferred.resolve();
   *           }
   *         });
   *
   *       return deferred.promise;
   *     };
   *
   * @method avoidStaleElement 
   */
  avoidStaleElement: function () {
    var i = 0;
    this.driver.wait(function () {
      i++;
      //console.log(i);
      return (i > 3);
    }, 3000);
  },

  /**
   * Easily set values of form elements by passing a map of 
   * css selector / element value pairs.
   *
   * @example
   *     // populate a radio button group, a select box, a text
   *     // input and a textarea
   *     var helpers = new WebDriverHelpers(webdriver, driver);
   *     helpers.populateElements({
   *       'input[name="gender"][value="M"]': 'M',
   *       '#country': "United States",
   *       '#age': '34',
   *       '#comment': "example msg"
   *     });
   *
   * @method populateElements
   * @param {Object} locatorValuePairs key/value pairs consisting of a css 
   *                    string locator for a form element and a string or 
   *                    array of strings to populate the element with.
   */
  populateElements: function (locatorValuePairs) {
    var key,
        value,
        locator,
        singleWord;

    for (key in locatorValuePairs) {
      value = locatorValuePairs[key];
      locator = { css: key };

      // optimize 'id' case
      singleWord = -1 === key.indexOf(' ');
      if (singleWord && 
          '#' === key.charAt(0)) {
        locator = { id: key.substring(1) };
      }

      //console.log("locator ", locator, ", value ", value);
      
      this.populateElement(locator, value);
    }
  },  // end populateElements 

  /**
   * Find first element in a group who's text matches parameter.
   *
   * @example
   *     var findPersonByName = function (nameOfPerson) {
   *       var collectionLocator = {
   *             'css':'div.people > .person'
   *           },
   *           criteriaLocator = {
   *             'className':'name'
   *           };
   *           
   *       return findElementInCollectionByText(
   *           collectionLocator,
   *           criteriaLocator,
   *           nameOfPerson
   *         );
   *     };
   *
   *     //...can be called like:
   *   
   *     it("can click person",
   *       function (done) {
   *         authenticate().
   *           then(findPersonByName("Jeff Winger")).
   *           then(clickPerson).
   *           then(finish(done), error);
   *       });
   *
   *     //...and will match:
   *
   *     <div class="people">
   *       <div class="person">
   *         <p class="name">Jeff Winger</p>
   *         <p class="pic">...</p>
   *       </div>
   *     </div>
   *
   * @method findElementInCollectionByText
   * @param {webdriver.Locator|Object.<string>} collectionLocator The locator 
   *     for the group of elements to search
   * @param {webdriver.Locator|Object.<string>} criteriaLocator The locator 
   *     for the element who's text should be compared, relative to collection
   * @param {string} text The text to search for.
   * @return {function} A function that, when executed, returns a promise that 
   *     will be resolved with the matching element.
   */
  findElementInCollectionByText: function (collectionLocator, criteriaLocator, text) {
    var self = this;

    return function () {
      var mainDefer = self.webdriver.promise.defer();

      self.driver.findElements(collectionLocator).
        then (function (collection) {

          var matchDefer = self.webdriver.promise.defer(),
              matchPromise = matchDefer.promise,
              resolved;
             
          //console.log('found elements');
          collection.map(function (item) {
            item.findElement(criteriaLocator).
              then (function (elem) {
                self.flow.execute(function () {
                  elem.getText().
                    then (function (value) {
                      //console.log('comparing ' + value);
                      if (value === text) {
                        resolved = true;
                        matchDefer.resolve(item);
                      }
                    });
                });
              });
          });

          self.flow.execute(function () {
            matchPromise.then(function (item) {
              //console.log('mainDefer.resolve');
              mainDefer.resolve(item);
            });
            //console.log('resolved? ' + resolved);
            if (!resolved) {
              throw new Error('failed to find target element ' + 
                JSON.stringify(collectionLocator) +
                JSON.stringify(criteriaLocator) +
                text);
            }
          });
          
        });  // end findElements.then
        return mainDefer.promise;
    };
  },  //  end findElementInCollectionByText

  /**
   * Populate textbox(es) with string value(s).  If 'strings' is an 
   * array, locator is assumed to match a group of textboxes which 
   * all have the same name.  
   *
   * This function performs a new find for each subsequent textbox 
   * in order to support dynamically added inputs.  For example, when
   * a second input field is added once a value is entered into the 
   * first input.
   *
   * @example
   *     var populateFriends = function (names) {
   *       var locator = {className: "friends-mlText"};
   *       return helpers.populateTextBox (locator, names);
   *     };
   *
   * @method populateTextBox  
   * @param {webdriver.Locator|Object.<string>} locator The locator
   *     strategy to use when locating the target input box(es)
   * @param {string | array<string>} strings The values to populate
   *     into the text box(es)
   * @return {function} A function which, when executed, populates
   *     the target text boxes
   */
  populateTextBox: function (locator, strings) {
    var self = this;
    
    if ('string' === typeof strings) {
      return function () {
        self.driver.findElement(locator).sendKeys(strings);
      }
    }
    if ('number' !== typeof strings.length) {
      throw new Error("invalid type for parameter 'strings'");
    }

    // else, assume strings is an Array
    return function () {
      var stringCount = strings.length,
          i,
          populateTextBoxByIndex;

      // populate first string 
      self.driver.findElement(locator).sendKeys(strings[0]);

      populateTextBoxByIndex = function (i) {
        // use closure to save appropriate index
        self.driver.findElements(locator).
          then (function (collection) {
            
            // sanity check
            if (i >= collection.length) {
              throw new Error("failed to locate text box for target string '" +
                strings[i] + "'.");
            }

            collection[i].sendKeys(strings[i]);
          });
      };

      // populate the rest of the names
      for (i = 1; i < stringCount; i++) {
        populateTextBoxByIndex(i);
      }
    }
  },  // end populateTextBox

  /**
   * Sets the value of a form element.  
   *
   * Supports the following form elements:
   *   input - text, radio, email, password
   *   textarea
   *   select
   *
   * @method populateElement
   * @param {webdriver.Locator|Object.<string>} locator The locator
   *     strategy to use when searching for the form element.
   * @param {string | array<string>} strings The target value(s) of
   *     into the form element(s)
   */
  populateElement: function (locator, value) {
    var self = this;

    if ('string' !== typeof value) {
      // assume a group of dynamically-added text boxes
      // aka. Multi-List
      this.populateTextBox(locator, value)();
      return;
    } 

    // assume regular, non-dynamic, form element
    this.driver.findElements(locator).then(function (collection) {
      collection.forEach(function (elemPromise) {
        elemPromise.then(function (element) {
          element.getTagName().
            then(function (tagName) {
              switch (tagName) {
                case "select":
                  element.findElement(self.webdriver.By.css("option[value='" + value + "']"))
                    .click();
                  break;
                case "textarea":
                  element.sendKeys(value);
                  break;
                case "input":
                  element.getAttribute("type").
                    then(function (type) { 
                      switch (type) {
                        case "radio":
                          // click if value matches
                          element.getAttribute("value").
                            then(function (val) {
                              if (val === value) {
                                element.click();
                              }
                            });
                          break;
                        case "text":
                        case "email":
                        case "password":
                          element.sendKeys(value);
                          break;
                        default:
                          throw new Error ("Unsupported input type '" + type + "'");
                      }
                    });
                    break;
                default:
                  throw new Error ("Unsupported form element '" + tagName + "'");
              }
          })
        })
      })
    });

  }  // end populateElement

});  // end _extend WebDriverHelpers.prototype

module.exports = WebDriverHelpers;

})();
