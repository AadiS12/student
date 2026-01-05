---
layout: post
title: About
permalink: /about/
comments: true
---

## As a conversation Starter

Here are some of my favorite fruits.

<comment>
Images are made using Wikipedia images
</comment>

<style>
    /* Style looks pretty compact, 
       - grid-container and grid-item are referenced the code 
    */
    .grid-container {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); /* Dynamic columns */
        gap: 10px;
    }
    .grid-item {
        text-align: center;
    }
    .grid-item img {
        width: 100%;
        height: 100px; /* Fixed height for uniformity */
        object-fit: contain; /* Ensure the image fits within the fixed height */
    }
    .grid-item p {
        margin: 5px 0; /* Add some margin for spacing */
    }

    .image-gallery {
        display: flex;
        flex-wrap: nowrap;
        overflow-x: auto;
        gap: 10px;
        }

    .image-gallery img {
        max-height: 150px;
        object-fit: cover;
        border-radius: 5px;
    }
</style>

<!-- This grid_container class is used by CSS styling and the id is used by JavaScript connection -->
<div class="grid-container" id="grid_container">
    <!-- content will be added here by JavaScript -->
</div>

<script>
    // Build a fruit gallery using local SVG image assets
    var fruits = [
        {"name": "Strawberries", "img": "/assets/images/fruits/strawberries.svg", "description": "Sweet and juicy."},
        {"name": "Oranges", "img": "/assets/images/fruits/oranges.svg", "description": "Great for juice."},
        {"name": "Grapes", "img": "/assets/images/fruits/grapes.svg", "description": "Perfect for snacking."},
        {"name": "Bananas", "img": "/assets/images/fruits/bananas.svg", "description": "Great source of energy before physical activity."}
    ];

    var container = document.getElementById("grid_container");

    for (const fruit of fruits) {
        var gridItem = document.createElement("div");
        gridItem.className = "grid-item";

        var img = document.createElement("img");
        img.src = fruit.img;
        img.alt = fruit.name;
        img.loading = "lazy";
        img.style.maxHeight = "100px";

        var name = document.createElement("p");
        name.textContent = fruit.name;
        name.style.fontWeight = "600";

        var description = document.createElement("p");
        description.textContent = fruit.description;

        gridItem.appendChild(img);
        gridItem.appendChild(name);
        gridItem.appendChild(description);

        container.appendChild(gridItem);
    }
</script>

### Journey through Life So Far 

Here is what I did at those places

- 🏫 Went to Design 39 from TK to 5th Grade
- 🏫 Moved to Oak Valley for middle school and stayed all three years 
- 🏫 Started high school at Del Norte this year (2025)
- ⚽ I love playing soccer and have played since I was little
- 💻🛡️ I joined cyberaegis in 7th grade and still continue doing it (3rd season now)

### Culture, Family, and Fun

My life revolves around family, sports and friends. 

- My family that I live with consists of a little sister in 5th grade, and then my mom and dad. 
- Me and my sister were born here but my parents orginate from India. 



