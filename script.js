
import Fraction from "./node_modules/fraction.js/fraction.js";
// get the json stuff
function populateDropdown() {
    const dropdown = document.getElementById("recipeDropdown");

    // Clear existing options
    dropdown.innerHTML = '';

    // Add a default option
    const defaultOption = document.createElement("option");
    defaultOption.text = "Select a recipe";
    defaultOption.value = "";
    dropdown.add(defaultOption);

    // Fetch data from "recipes-list.json"
    fetch("./data/recipes-list.json")
        .then(response => response.json())
        .then(data => {
            data.recipes.forEach(recipe => {
                const option = document.createElement("option");
                option.text = recipe.title;
                option.value = recipe.id;

                // Generate the JSON source attribute with spaces and apostrophes removed
                // would be easier with ID within recipie itself but eh
                const jsonSrc = `./data/${recipe.title.replace(/ /g, '-').replace(/'/g, '').toLowerCase()}.json`;
                option.setAttribute("data-json-src", jsonSrc);
                // now every option is linked with its json file
                dropdown.add(option);
            });
        })
        .catch(error => console.error("Error fetching data: " + error));
}

// Function to load and display selected recipe content
function loadRecipeContent() {

    // get the recipe dropdown
    const dropdown = document.getElementById("recipeDropdown");
    const selectedOption = dropdown.options[dropdown.selectedIndex];
    const recipeContent = document.getElementById("recipeContent");

    if (!selectedOption.value) {
        // If no option is selected, hide the recipe content
        recipeContent.innerHTML = '<p class="Filler">Select a recipe and it will be displayed here</p>';
        return; // Exit the function
    }

    if (selectedOption.value) {
        const jsonSrc = selectedOption.getAttribute("data-json-src");
            // get the url from the dropdown object
        // Fetch the JSON file based on the selected option
        fetch(jsonSrc)
            .then(response => response.json())
            .then(recipeData => {



                

                // Store the original serving size for maths
                const originalServingSize = recipeData.servings;

                // Display the structured recipe data
                // adding stuff time
                //not all recipies have a prep time or a cook time, therefore the condiotional ?
                // dont want to display NULL values now do i
                const recipeContent = document.getElementById("recipeContent");




                recipeContent.innerHTML = `
                    <h1>${recipeData.title}</h1>
                   
                   
                    <div class="image-container">
                    <img src="${recipeData.image_url}" alt="Image for ${recipeData.title}" class="recipe-image">
                </div>
                

                    <p><strong>Description:</strong> ${recipeData.description}</p>


                    
                  
                    ${recipeData.prep_time_min ? `<p><strong>Preparation Time:</strong> ${recipeData.prep_time_min} minutes</p>` : ''}
                    ${recipeData.cook_time_min ? `<p><strong>Cook Time:</strong> ${recipeData.cook_time_min} minutes</p>` : ''}


                    <p><strong>Ingredients:</strong></p>
                    <ul>
                    ${recipeData.ingredients.map(ingredient => `
                        <li>${ingredient.qty && originalServingSize ?
                            (isNumeric(ingredient.qty) ? formatIngredient(calculateAdjustedQty(ingredient.qty, originalServingSize, recipeData.servings)) : ingredient.qty)
                            : ''}
                            ${ingredient.unit} ${ingredient.item}</li>
                    `).join('')}
                        </ul>
                

                    <p class="serving-controls">
                        <strong>Servings:</strong> 
                        <button id="decrementServing">-</button>
                        <span id="servingSize">${recipeData.servings}</span>
                        <button id="incrementServing">+</button>
                    </p>

                    <div class="directions-section">
                    <p class="section-header"><strong>Directions:</strong></p>
                    <ol>
                    ${recipeData.directions.map(direction => `
                        <li class="li-class">${direction}</li>
                    `).join('')}
                    </ol>
                </div>
                    
                   
                <p><strong>Tags:</strong> ${recipeData.tags.map(tag => `<span class="tag-pill">${tag}</span>`).join('')}</p>


                    <p><strong>Author:</strong> <a href="${recipeData.author.url}" target="_blank">${recipeData.author.name}</a></p>

                   
                    `;


              
                // Add event listeners for serving size controls
                const decrementButton = document.getElementById("decrementServing");
                const incrementButton = document.getElementById("incrementServing");
                const servingSize = document.getElementById("servingSize");

                decrementButton.addEventListener("click", () => updateServingSize(-1));
                incrementButton.addEventListener("click", () => updateServingSize(1));

                function updateServingSize(change) {
                    // parse the text as int soo the computer understands it 
                    // the 10 represents a normal decimal value 
                    const currentServing = parseInt(servingSize.textContent, 10);
                    const newServing = currentServing + change;
                    // add the new number to serving
                    // make sure its not 0 cuz u cant serve 0
                    if (newServing >= 1) {
                        servingSize.textContent = newServing;
                        // Update the displayed ingredient quantities
                        const ingredientList = recipeContent.querySelector("ul");
                        recipeData.ingredients.forEach((ingredient, index) => {
                        //update qty time
                            const listItem = ingredientList.children[index];
                        

                            // catch salt and pepper issue when adding a serving
                            // simple fix but effective :)
                            if(ingredient.qty){
                                const adjustedQty = calculateAdjustedQty(ingredient.qty, originalServingSize, newServing);
                                listItem.textContent = `${formatIngredient(adjustedQty)} ${ingredient.unit} ${ingredient.item}`;
                              }
                        });
                    }
                }

            })
            .catch(error => console.error("Error fetching recipe data: " + error));
    }
}




function calculateAdjustedQty(qty, originalServing, newServing) {
    const conversionFactor = newServing / originalServing;
    return formatIngredient(convertQty(qty).mul(conversionFactor).toString());
}
  // convert the qty to a fraction using the fraction library

function convertQty(qty) {
    return new Fraction(qty);
}


 // Update the formatIngredient function
 // this is how we turn the / in the json file to an actual fraction
 // we use the Fraction library for it to be cleaner and more accurate
 // either that or a lot of mapping
 // ive never really appreciated decimal values until today 

    function formatIngredient(qty) {
    const parts = qty.split(' ');
    return parts.map(part => {
        
            try {
                const fraction = new Fraction(part);
                return fraction.toFraction(true); // Force fraction format
            } catch (error) {
                return part;
            }
        
      
    }).join(' ');
        }

// make sure theres a number, catches salt and pepper to taste value initially
    function isNumeric(value) {
    return !isNaN(value) && isFinite(value);
        }


// some css stuff because i finished the tasks a bit early think it looks cool
    const fadeRecipeContent = () => {
        const recipeContent = document.getElementById("recipeContent");
    
        recipeContent.classList.add("fade-in");
        
        };

    // Event listener to trigger fade-in and remove class after transition
    document.getElementById("recipeContent").addEventListener("transitionend", (event) => {
        if (event.propertyName === "opacity") {
            const recipeContent = event.target;
            
            recipeContent.classList.remove("fade-in");
        }
    });



    // Call the function to populate the dropdown initially
    populateDropdown();

    // Attach an event listener to the dropdown to load recipe content on change
    document.getElementById("recipeDropdown").addEventListener("change", () => {
        fadeRecipeContent(); 
            
        
        setTimeout(() => {
            loadRecipeContent(); // Load new content after the fade-out animation
        }, 500);

        // dirtier fix for CSS stuff, but works just as well 

        // Add fade-in when a new recipe is loaded
    });