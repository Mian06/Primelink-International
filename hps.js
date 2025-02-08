addEventListener('fetch', event => { 
  event.respondWith(handleRequest(event.request))
});

let modalGroupImages = []; // Array holding current group's image URLs.
let modalCurrentIndex = 0; // Index of current image in the group.

async function handleRequest(request) {
  const url = new URL(request.url);
  let page = url.pathname;
  // Normalize path (remove trailing slash)
  page = page.replace(/\/$/, '') || '/';

  let pageTitle = '';
  let content = '';

  // Only handle the Himalayan Salt page; fallback for others.
  if (page === "/himalayan-salt") {
    pageTitle = "Himalayan Salt - Primelink International";
    content = generateHimalayanSaltPage();
  } else {
    pageTitle = "404 - Page Not Found";
    content = `
      <section style="padding: 4rem 5%; text-align: center;">
        <h2>404 - Page Not Found</h2>
        <p>The page you are looking for does not exist.</p>
        <a href="/himalayan-salt" style="color: var(--primary-blue); text-decoration: underline;">Return to Himalayan Salt</a>
      </section>
    `;
  }

  return new Response(buildPage(pageTitle, content), {
    headers: { 
      'Content-Type': 'text/html; charset=UTF-8',
      'Cache-Control': 'public, max-age=3600'
    }
  });
}

//
// Build a basic HTML page wrapper including the modal popup HTML/JS
//
function buildPage(pageTitle, content) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <!-- Ensure proper scaling on mobile devices -->
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${pageTitle}</title>
  <style>
    :root {
      --primary-blue: #002D72;
    }
    body {
      margin: 0;
      font-family: Arial, sans-serif;
      background: #f5f5f5;
      color: black;
    }
    .container {
      max-width: 1400px;
      margin: 100px auto 0;
      padding: 0 5%;
    }
    .section {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      background: #ffffff;
      padding: 2rem;
      margin-bottom: 2rem;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .text-content {
      flex: 1;
      padding-right: 2rem;
    }
    .text-content h2 {
      color: var(--primary-blue);
      margin-top: 0;
    }
    /* UL with bullet points and extra bottom margin */
    .text-content ul {
      list-style-type: disc;
      padding-left: 20px;
      margin-bottom: 1.5rem;
    }
    .text-content ul li {
      margin-bottom: 0.5rem;
    }
    /* Extra top margin for paragraphs */
    .text-content p {
      margin-top: 1.5rem;
    }
    /* Collage container for multi-image sections */
    .image-content {
      width: 400px;
      height: 400px;
      border-radius: 8px;
      overflow: hidden;
      position: relative;
    }
    .collage-container {
      position: relative;
      width: 100%;
      height: 100%;
      border-radius: 8px;
      overflow: hidden;
    }
    /* Pointer cursor for clickable containers */
    .collage-container, .single-image-container {
      cursor: pointer;
    }
    /* Wrapper for each image (for both grid and modal) */
    .img-wrapper {
      position: absolute;
      cursor: pointer;
      border-radius: inherit;
      overflow: hidden;
    }
    /* Base image inside wrapper */
    .img-wrapper .base-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      border-radius: inherit;
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }
    /* Logo overlay at upper-right for grid images */
    .img-wrapper .logo-overlay {
      position: absolute;
      top: 8px;
      right: 8px;
      width: 40px;
      height: auto;
      pointer-events: none;
    }
    /* Hover effect */
    .img-wrapper:hover .base-image {
      transform: scale(1.03);
      box-shadow: 0 0 10px rgba(0,45,114,0.7);
      z-index: 9999;
    }
    /* Positioning for collage images */
    .img1 { top: 0; left: 0; width: 260px; height: 260px; z-index: 1; }
    .img2 { top: 0; right: 0; width: 140px; height: 280px; z-index: 3; }
    .img3 { bottom: 0; left: 0; width: 400px; height: 200px; z-index: 2; transform: translateY(-30px); }
    /* Modal styles */
    .modal {
      display: none; /* Hidden by default */
      position: fixed; 
      z-index: 10000;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      overflow: auto;
      background-color: rgba(0,0,0,0.8);
    }
    .modal-content {
      position: relative;
      margin: 5% auto;
      width: 80%;
      max-width: 800px;
      height: 90vh;
      background: #494848;
      border-radius: 8px;
      overflow: hidden;
    }
    /* Container holding the dynamic image */
    #modalImageContainer {
      width: 100%;
      height: 100%;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    /* The image in the modal */
    .modal-img-wrapper .base-image {
      max-width: 100%;
      max-height: 100%;
      width: auto;
      height: auto;
      display: block;
    }
    /* Centered logo overlay on the modal image */
    .modal-img-wrapper .logo-overlay {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 40px;
      height: auto;
      pointer-events: none;
    }
    /* Bottom overlay with gradient and text */
    .modal-overlay {
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 30%;
      background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);
      color: white;
      padding: 10px;
      box-sizing: border-box;
    }
    /* Arrow buttons */
    .prev-btn, .next-btn {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      font-size: 48px;
      color: #fff;
      cursor: pointer;
      user-select: none;
      background: linear-gradient(to bottom, rgba(0,0,0,0.4), rgba(0,0,0,0.7));
      border: none;
      padding: 5px 10px;
      border-radius: 4px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.4);
      transition: background 0.3s, transform 0.3s;
      z-index: 10001;
    }
    .prev-btn:hover, .next-btn:hover {
      background: linear-gradient(to bottom, rgba(0,0,0,0.6), rgba(0,0,0,0.9));
      transform: translateY(-50%) scale(1.05);
    }
    .prev-btn { left: 20px; }
    .next-btn { right: 20px; }
  </style>
</head>
<body>
  <div class="container">
    ${content}
  </div>
  
  <!-- Modal Popup -->
  <div id="popupModal" class="modal">
    <div class="modal-content">
      <!-- Dynamic image container -->
      <div id="modalImageContainer"></div>
      <!-- Navigation arrow buttons -->
      <span id="prevBtn" class="prev-btn" onclick="prevImage()"><</span>
      <span id="nextBtn" class="next-btn" onclick="nextImage()">></span>
      <!-- Bottom overlay with gradient and text -->
      <div class="modal-overlay">
         <h3 id="overlayHeading">Default Heading</h3>
         <p id="overlayText">Default paragraph text goes here.</p>
      </div>
    </div>
  </div>
  
  <script>
    // Open the modal for a group of images.
    // clickedWrapper is the .img-wrapper element that was clicked.
    function openModalGroup(clickedWrapper) {
      // Determine the group container.
      // For collage containers, clickedWrapper.parentNode is the container.
      const groupContainer = clickedWrapper.parentNode;
      
      // Update modal overlay text based on the container's data attributes.
      const overlayHeading = groupContainer.getAttribute('data-overlay-heading');
      const overlayText = groupContainer.getAttribute('data-overlay-text');
      if (overlayHeading) {
        document.getElementById('overlayHeading').innerText = overlayHeading;
      }
      if (overlayText) {
        document.getElementById('overlayText').innerText = overlayText;
      }
      
      // Get all .img-wrapper elements in the group.
      const wrappers = groupContainer.querySelectorAll('.img-wrapper');
      modalGroupImages = [];
      wrappers.forEach((wrapper) => {
        const img = wrapper.querySelector('.base-image');
        modalGroupImages.push(img.src);
      });
      const clickedImg = clickedWrapper.querySelector('.base-image');
      modalCurrentIndex = modalGroupImages.indexOf(clickedImg.src);
      
      showModalImage(modalGroupImages[modalCurrentIndex]);
    }
    
    // Display the image in the modal.
    function showModalImage(src) {
      const modalImageContainer = document.getElementById('modalImageContainer');
      modalImageContainer.innerHTML = '';
      
      const modalWrapper = document.createElement('div');
      modalWrapper.classList.add('modal-img-wrapper');
      
      const fullImg = document.createElement('img');
      fullImg.src = src;
      fullImg.classList.add('base-image');
      
      const logoOverlay = document.createElement('img');
      logoOverlay.src = "https://raw.githubusercontent.com/Mian06/Primelink-International/refs/heads/main/Transparentlogo.png";
      logoOverlay.classList.add('logo-overlay');
      
      modalWrapper.appendChild(fullImg);
      modalWrapper.appendChild(logoOverlay);
      modalImageContainer.appendChild(modalWrapper);
      
      document.getElementById('popupModal').style.display = 'block';
      updateArrowVisibility();
    }
    
    function nextImage() {
      if (modalGroupImages.length === 0) return;
      modalCurrentIndex++;
      if (modalCurrentIndex >= modalGroupImages.length) {
        modalCurrentIndex = modalGroupImages.length - 1;
      }
      showModalImage(modalGroupImages[modalCurrentIndex]);
    }
    
    function prevImage() {
      if (modalGroupImages.length === 0) return;
      modalCurrentIndex--;
      if (modalCurrentIndex < 0) {
        modalCurrentIndex = 0;
      }
      showModalImage(modalGroupImages[modalCurrentIndex]);
    }
    
    // Update arrow visibility based on current index.
    function updateArrowVisibility() {
      const prevBtn = document.getElementById('prevBtn');
      const nextBtn = document.getElementById('nextBtn');
      if (modalGroupImages.length <= 1) {
        prevBtn.style.display = "none";
        nextBtn.style.display = "none";
      } else {
        if (modalCurrentIndex === 0) {
          prevBtn.style.display = "none";
          nextBtn.style.display = "block";
        } else if (modalCurrentIndex === modalGroupImages.length - 1) {
          nextBtn.style.display = "none";
          prevBtn.style.display = "block";
        } else {
          prevBtn.style.display = "block";
          nextBtn.style.display = "block";
        }
      }
    }
    
    // Close modal if clicking outside the modal content.
    window.onclick = function(event) {
      const modal = document.getElementById('popupModal');
      if (event.target == modal) {
        modal.style.display = 'none';
      }
    }
  </script>
</body>
</html>`;
}

//
// Generate the Himalayan Salt page content with updated image links.
// Each section now uses a collage container with three images.
function generateHimalayanSaltPage() {
  // Himalayan Pink Salt (Fine)
  const fine1 = "https://raw.githubusercontent.com/Mian06/Primelink-International/refs/heads/main/himalayan-pink-salt-fine-1.jpg";
  const fine2 = "https://raw.githubusercontent.com/Mian06/Primelink-International/refs/heads/main/himalayan-pink-salt-fine-2.jpg";
  const fine3 = "https://raw.githubusercontent.com/Mian06/Primelink-International/refs/heads/main/himalayan-pink-salt-fine-3.jpg";
  
  // Himalayan Pink Salt (Coarse Grain)
  const coarse1 = "https://raw.githubusercontent.com/Mian06/Primelink-International/refs/heads/main/himalayan-pink-salt-coarse-grain-1.jpg";
  const coarse2 = "https://raw.githubusercontent.com/Mian06/Primelink-International/refs/heads/main/himalayan-pink-salt-coarse-grain-2.jpg";
  const coarse3 = "https://raw.githubusercontent.com/Mian06/Primelink-International/refs/heads/main/himalayan-pink-salt-coarse-grain-3.jpg";
  
  // Himalayan Pink Salt (Lamp)
  const lamp1 = "https://raw.githubusercontent.com/Mian06/Primelink-International/refs/heads/main/himalayan-pink-salt-lamp-1.jpg";
  const lamp2 = "https://raw.githubusercontent.com/Mian06/Primelink-International/refs/heads/main/himalayan-pink-salt-lamp-2.png";
  const lamp3 = "https://raw.githubusercontent.com/Mian06/Primelink-International/refs/heads/main/himalayan-pink-salt-lamp-3.jpg";
  
  // Himalayan Pink Salt (Animal Licking)
  const animalLicking1 = "https://raw.githubusercontent.com/Mian06/Primelink-International/refs/heads/main/himalayan-pink-salt-animal-licking-1.jpg";
  const animalLicking2 = "https://raw.githubusercontent.com/Mian06/Primelink-International/refs/heads/main/himalayan-pink-salt-animal-licking-2.jpg";
  const animalLicking3 = "https://raw.githubusercontent.com/Mian06/Primelink-International/refs/heads/main/himalayan-pink-salt-animal-licking-3.jpg";
  
  // Himalayan Pink Salt (Lumps)
  const lumps1 = "https://raw.githubusercontent.com/Mian06/Primelink-International/refs/heads/main/himalayan-pink-salt-Lumps-1.jpg";
  const lumps2 = "https://raw.githubusercontent.com/Mian06/Primelink-International/refs/heads/main/himalayan-pink-salt-Lumps-2.jpg";
  const lumps3 = "https://raw.githubusercontent.com/Mian06/Primelink-International/refs/heads/main/himalayan-pink-salt-Lumps-3.jpg";
  
  // Himalayan Pink Salt (Tiles)
  const tiles1 = "https://raw.githubusercontent.com/Mian06/Primelink-International/refs/heads/main/himalayan-pink-salt-tiles-1.jpg";
  const tiles2 = "https://raw.githubusercontent.com/Mian06/Primelink-International/refs/heads/main/himalayan-pink-salt-tiles-2.jpg";
  const tiles3 = "https://raw.githubusercontent.com/Mian06/Primelink-International/refs/heads/main/himalayan-pink-salt-tiles-3.jpg";
  
  // Himalayan Pink Salt (Soap)
  const soap1 = "https://raw.githubusercontent.com/Mian06/Primelink-International/refs/heads/main/himapayan-pink-salt-soap-1.jpg";
  const soap2 = "https://raw.githubusercontent.com/Mian06/Primelink-International/refs/heads/main/himapayan-pink-salt-soap-2.jpg";
  const soap3 = "https://raw.githubusercontent.com/Mian06/Primelink-International/refs/heads/main/himapayan-pink-salt-soap-3.jpg";
  
  // Transparent logo URL (unchanged)
  const logoUrl = "https://raw.githubusercontent.com/Mian06/Primelink-International/refs/heads/main/Transparentlogo.png";
  
  return `
  <!-- Himalayan Pink Salt (Fine) Section -->
  <div class="section">
    <div class="text-content">
      <h2>Himalayan Pink Salt (Fine)</h2>
      <ul>
        <li><strong>Dealing:</strong> Bulk Supply</li>
        <li><strong>Color:</strong> Natural Pink</li>
        <li><strong>Customization:</strong> Fully adaptable to meet your specific requirements.</li>
        <li><strong>Custom Packaging & Branding:</strong> Tailored packaging to reflect your brand.</li>
        <li><strong>Transportation:</strong> Delivered directly from production to your door.</li>
      </ul>
      <p><strong>Pure, mineral-rich crystals perfect for elevating everyday meals with a touch of gourmet elegance and natural wellness.</strong></p>
    </div>
    <div class="image-content">
      <div class="collage-container" 
           data-overlay-heading="Himalayan Pink Salt (Fine)" 
           data-overlay-text="Fine salt is known for its delicate texture and pure flavor.">
        <div class="img-wrapper img1" onclick="openModalGroup(this)">
          <img class="base-image" src="${fine1}" alt="Fine Salt Image 1">
          <img class="logo-overlay" src="${logoUrl}" alt="Logo">
        </div>
        <div class="img-wrapper img2" onclick="openModalGroup(this)">
          <img class="base-image" src="${fine2}" alt="Fine Salt Image 2">
          <img class="logo-overlay" src="${logoUrl}" alt="Logo">
        </div>
        <div class="img-wrapper img3" onclick="openModalGroup(this)">
          <img class="base-image" src="${fine3}" alt="Fine Salt Image 3">
          <img class="logo-overlay" src="${logoUrl}" alt="Logo">
        </div>
      </div>
    </div>
  </div>
  
  <!-- Himalayan Pink Salt (Coarse Grain) Section -->
  <div class="section">
    <div class="text-content">
      <h2>Himalayan Pink Salt (Coarse Grain)</h2>
      <ul>
        <li><strong>Dealing:</strong> Bulk Supply</li>
        <li><strong>Standard Size:</strong> 3mm</li>
        <li><strong>Color:</strong> Natural Pink</li>
        <li><strong>Customization:</strong> Fully adaptable to meet your specific requirements.</li>
        <li><strong>Custom Packaging & Branding:</strong> Packaging options available to align with your brand.</li>
        <li><strong>Transportation:</strong> Delivered directly from production to your door.</li>
      </ul>
      <p><strong>Ideal for grinding over dishes or crafting artisanal brines, delivering bold flavor and a satisfying crunch.</strong></p>
    </div>
    <div class="image-content">
      <div class="collage-container"
           data-overlay-heading="Himalayan Pink Salt (Coarse Grain)" 
           data-overlay-text="Coarse grain salt adds a satisfying crunch and robust flavor.">
        <div class="img-wrapper img1" onclick="openModalGroup(this)">
          <img class="base-image" src="${coarse1}" alt="Coarse Salt Image 1">
          <img class="logo-overlay" src="${logoUrl}" alt="Logo">
        </div>
        <div class="img-wrapper img2" onclick="openModalGroup(this)">
          <img class="base-image" src="${coarse2}" alt="Coarse Salt Image 2">
          <img class="logo-overlay" src="${logoUrl}" alt="Logo">
        </div>
        <div class="img-wrapper img3" onclick="openModalGroup(this)">
          <img class="base-image" src="${coarse3}" alt="Coarse Salt Image 3">
          <img class="logo-overlay" src="${logoUrl}" alt="Logo">
        </div>
      </div>
    </div>
  </div>
  
  <!-- Himalayan Pink Salt (Lamp) Section -->
  <div class="section">
    <div class="text-content">
      <h2>Himalayan Pink Salt (Lamp)</h2>
      <ul>
        <li><strong>Dealing:</strong> Bulk Supply</li>
        <li><strong>Lamp Specific:</strong> Crafted for decorative and therapeutic lamp use.</li>
        <li><strong>Varieties Available:</strong> Multiple lamp options to suit diverse needs.</li>
        <li><strong>Custom Packaging & Branding:</strong> Packaging options available to align with your brand.</li>
        <li><strong>Transportation:</strong> Delivered directly from production to your door.</li>
      </ul>
      <p><strong>Glowing natural décor that purifies air, enhances ambiance, and radiates calming energy for your space.</strong></p>
    </div>
    <div class="image-content">
      <div class="collage-container"
           data-overlay-heading="Himalayan Pink Salt (Lamp)" 
           data-overlay-text="Our lamp salt not only illuminates but also purifies the air.">
        <div class="img-wrapper img1" onclick="openModalGroup(this)">
          <img class="base-image" src="${lamp1}" alt="Lamp Image 1">
          <img class="logo-overlay" src="${logoUrl}" alt="Logo">
        </div>
        <div class="img-wrapper img2" onclick="openModalGroup(this)">
          <img class="base-image" src="${lamp2}" alt="Lamp Image 2">
          <img class="logo-overlay" src="${logoUrl}" alt="Logo">
        </div>
        <div class="img-wrapper img3" onclick="openModalGroup(this)">
          <img class="base-image" src="${lamp3}" alt="Lamp Image 3">
          <img class="logo-overlay" src="${logoUrl}" alt="Logo">
        </div>
      </div>
    </div>
  </div>
  
  <!-- Himalayan Pink Salt (Animal Licking) Section -->
  <div class="section">
    <div class="text-content">
      <h2>Himalayan Pink Salt (Animal Licking)</h2>
      <ul>
        <li><strong>Dealing:</strong> Bulk Supply</li>
        <li><strong>Specialized Application:</strong> Animal licking purposes.</li>
        <li><strong>Product Types:</strong> Available in both Hydraulic Press and Stone forms.</li>
        <li><strong>Custom Packaging & Branding:</strong> Packaging options available to align with your brand.</li>
        <li><strong>Customization:</strong> Fully customizable to meet your unique business needs.</li>
        <li><strong>Transportation:</strong> Delivered directly from production to your door.</li>
      </ul>
      <p><strong>Essential mineral boost for livestock and pets, promoting health and vitality through nature’s purest salt.</strong></p>
    </div>
    <div class="image-content">
      <div class="collage-container"
           data-overlay-heading="Himalayan Pink Salt (Animal Licking)" 
           data-overlay-text="Experience the unique textures in nature.">
        <div class="img-wrapper img1" onclick="openModalGroup(this)">
          <img class="base-image" src="${animalLicking1}" alt="Animal Licking Image 1">
          <img class="logo-overlay" src="${logoUrl}" alt="Logo">
        </div>
        <div class="img-wrapper img2" onclick="openModalGroup(this)">
          <img class="base-image" src="${animalLicking2}" alt="Animal Licking Image 2">
          <img class="logo-overlay" src="${logoUrl}" alt="Logo">
        </div>
        <div class="img-wrapper img3" onclick="openModalGroup(this)">
          <img class="base-image" src="${animalLicking3}" alt="Animal Licking Image 3">
          <img class="logo-overlay" src="${logoUrl}" alt="Logo">
        </div>
      </div>
    </div>
  </div>
  
  <!-- Himalayan Pink Salt (Lumps) Section -->
  <div class="section">
    <div class="text-content">
      <h2>Himalayan Pink Salt (Lumps)</h2>
      <ul>
        <li><strong>Dealing:</strong> Bulk Supply</li>
        <li><strong>Natural Quality:</strong> Unrefined lumps that maintain the authentic essence of Himalayan salt.</li>
        <li><strong>Custom Packaging & Branding:</strong> Packaging options available to align with your brand.</li>
        <li><strong>Transportation:</strong> Delivered directly from production to your door.</li>
      </ul>
      <p><strong>Chunky, raw pieces for DIY spa scrubs, brining, or rustic décor—versatile, natural, and sustainably sourced.</strong></p>
    </div>
    <div class="image-content">
      <div class="collage-container"
           data-overlay-heading="Himalayan Pink Salt (Lumps)" 
           data-overlay-text="These natural pink lumps add a distinctive look to your décor.">
        <div class="img-wrapper img1" onclick="openModalGroup(this)">
          <img class="base-image" src="${lumps1}" alt="Lumps Image 1">
          <img class="logo-overlay" src="${logoUrl}" alt="Logo">
        </div>
        <div class="img-wrapper img2" onclick="openModalGroup(this)">
          <img class="base-image" src="${lumps2}" alt="Lumps Image 2">
          <img class="logo-overlay" src="${logoUrl}" alt="Logo">
        </div>
        <div class="img-wrapper img3" onclick="openModalGroup(this)">
          <img class="base-image" src="${lumps3}" alt="Lumps Image 3">
          <img class="logo-overlay" src="${logoUrl}" alt="Logo">
        </div>
      </div>
    </div>
  </div>
  
  <!-- Himalayan Pink Salt (Tiles) Section -->
  <div class="section">
    <div class="text-content">
      <h2>Himalayan Pink Salt (Tiles)</h2>
      <ul>
        <li><strong>Dealing:</strong> Bulk Supply</li>
        <li><strong>Versatile Applications:</strong> Ideal for use as cooking tiles, blocks, or bricks.</li>
        <li><strong>Custom Sizes:</strong> Sizes available as per your customization needs.</li>
        <li><strong>Custom Packaging & Branding:</strong> Packaging solutions available to reflect your brand identity.</li>
        <li><strong>Transportation:</strong> Delivered directly from production to your door.</li>
      </ul>
      <p><strong>Sizzle, serve, or decorate—durable, heat-retaining slabs for gourmet cooking and stunning tabletop displays.</strong></p>
    </div>
    <div class="image-content">
      <div class="collage-container"
           data-overlay-heading="Himalayan Pink Salt (Tiles)" 
           data-overlay-text="Perfect for modern kitchens with a touch of elegance.">
        <div class="img-wrapper img1" onclick="openModalGroup(this)">
          <img class="base-image" src="${tiles1}" alt="Tiles Image 1">
          <img class="logo-overlay" src="${logoUrl}" alt="Logo">
        </div>
        <div class="img-wrapper img2" onclick="openModalGroup(this)">
          <img class="base-image" src="${tiles2}" alt="Tiles Image 2">
          <img class="logo-overlay" src="${logoUrl}" alt="Logo">
        </div>
        <div class="img-wrapper img3" onclick="openModalGroup(this)">
          <img class="base-image" src="${tiles3}" alt="Tiles Image 3">
          <img class="logo-overlay" src="${logoUrl}" alt="Logo">
        </div>
      </div>
    </div>
  </div>
  
  <!-- Himalayan Pink Salt (Soap) Section -->
  <div class="section">
    <div class="text-content">
      <h2>Himalayan Pink Salt (Soap)</h2>
      <ul>
        <li><strong>Dealing:</strong> Bulk Supply</li>
        <li><strong>Custom Packaging & Branding:</strong> Tailored packaging options to align with your brand.</li>
        <li><strong>Customization:</strong> Fully customizable formulation and packaging options available.</li>
        <li><strong>Transportation:</strong> Delivered directly from production to your door.</li>
      </ul>
      <p><strong>Detoxify and rejuvenate skin with this mineral-rich bar, blending exfoliation and hydration for a radiant glow.</strong></p>
    </div>
    <div class="image-content">
      <div class="collage-container"
           data-overlay-heading="Himalayan Pink Salt (Soap)" 
           data-overlay-text="A luxurious soap that pampers your skin with natural ingredients.">
        <div class="img-wrapper img1" onclick="openModalGroup(this)">
          <img class="base-image" src="${soap1}" alt="Soap Image 1">
          <img class="logo-overlay" src="${logoUrl}" alt="Logo">
        </div>
        <div class="img-wrapper img2" onclick="openModalGroup(this)">
          <img class="base-image" src="${soap2}" alt="Soap Image 2">
          <img class="logo-overlay" src="${logoUrl}" alt="Logo">
        </div>
        <div class="img-wrapper img3" onclick="openModalGroup(this)">
          <img class="base-image" src="${soap3}" alt="Soap Image 3">
          <img class="logo-overlay" src="${logoUrl}" alt="Logo">
        </div>
      </div>
    </div>
  </div>
  `;
}
