// 1. Floor Data Array
const floorData = [
  {
    id: "B1",
    label: "B1",
    summary: "지하 주차장",
    facilities: ["지하 주차장"]
  },
  {
    id: "1",
    label: "1F",
    summary: "스마트제조 탈의실 / 스마트제조 사무실 /\n이마트 24 / 지상 주차장",
    facilities: ["스마트제조 탈의실", "스마트제조 사무실", "이마트 24", "지상 주차장"]
  },
  {
    id: "2",
    label: "2F",
    summary: "조립/테스트룸 / 고객지원팀 / A/S 지원실 /\n혁신사업부 / PC 조립실 / 통합부속실",
    facilities: ["조립/테스트룸", "고객지원팀", "A/S 지원실", "혁신사업부", "PC 조립실", "통합부속실"]
  },
  {
    id: "3",
    label: "3F",
    summary: "연구개발부 / 연구소장 / 디자인 / 전시실",
    facilities: ["연구개발부", "연구소장", "디자인실장", "전시실"]
  },
  {
    id: "4",
    label: "4F",
    summary: "대표이사 / 영업관리 / 경영지원 / 본부장 /\nS/W개발 / 재경팀",
    facilities: ["대표이사", "영업관리", "경영지원", "본부장", "S/W개발", "재경팀"]
  },
  {
    id: "5",
    label: "5F",
    summary: "옥상정원 / 흡연실",
    facilities: ["옥상정원", "흡연실"]
  }
];

// 2. DOM Elements & Variables
let floorLabelSlider, activeFloorSummary, mapSlider, mapPin, navIndicator, navColumns, introPdfBtn;
let mainView, pptView, pptSlider, pptPrev, pptNext, pptCurrentPage, pptHomeBtn, introCover, kioskFooter;
let deviceLocation = null; // Loaded from data.json
let currentFloorIndex = 3; // Fallback default floor index (3F)
let currentPptIndex = 0; // PPT Slide current index
const totalPptSlides = 11; // Total PPT pages

let rotationSeconds = 10;
let homeSeconds = 30;
let introRotationSeconds = 5;
let rotationTimer = null;
let idleTimer = null;
let introSlideTimer = null;
let introSlideIndex = 0;
let introSlides = [];
let rotationActive = true;

// 3. Functions

// Move to specified floor
function goToFloor(index, instant = false) {
  if (index < 0 || index >= floorData.length) return;

  currentFloorIndex = index;
  const currentData = floorData[index];

  if (instant) {
    if (mapSlider) mapSlider.style.transition = "none";
    if (floorLabelSlider) floorLabelSlider.style.transition = "none";
    if (navIndicator) navIndicator.style.transition = "none";
  }

  // A. Move Map Slider (Vertical transform, each map-slide-item height is 1050px)
  const slideHeight = 1050;
  if (mapSlider) mapSlider.style.transform = `translateY(-${index * slideHeight}px)`;

  // B. Move Top Floor Label Slider (Vertical transform, each item height is 143px)
  const labelHeight = 143;
  if (floorLabelSlider) floorLabelSlider.style.transform = `translateY(-${(5 - index) * labelHeight}px)`;

  // C. Update Header Summary Text
  if (activeFloorSummary) activeFloorSummary.textContent = currentData.summary;

  // D. Toggle Active Class on Navigation Columns
  navColumns.forEach((col, idx) => {
    if (idx === index) {
      col.classList.add("active");
    } else {
      col.classList.remove("active");
    }
  });

  // E. Move Navigation Indicator Bar
  updateIndicatorPosition(index);

  if (instant) {
    // Force layout reflow
    if (mapSlider) mapSlider.offsetHeight;
    if (navIndicator) navIndicator.offsetHeight;
    
    // Restore CSS transitions after layout snaps
    setTimeout(() => {
      if (mapSlider) mapSlider.style.transition = "";
      if (floorLabelSlider) floorLabelSlider.style.transition = "";
      if (navIndicator) navIndicator.style.transition = "";
    }, 150);
  }
}

// Dynamically align active line indicator
function updateIndicatorPosition(index) {
  const activeCol = navColumns[index];
  if (!activeCol) return;

  // Use half the column width, centered
  const colOffsetLeft = activeCol.offsetLeft;
  const colWidth = activeCol.offsetWidth;
  const indicatorWidth = colWidth / 2;

  navIndicator.style.left = `${colOffsetLeft + (colWidth - indicatorWidth) / 2}px`;
  navIndicator.style.width = `${indicatorWidth}px`;
}

// Update PPT Slide Position
function updatePptSlider() {
  if (pptSlider && pptCurrentPage) {
    pptSlider.style.transition = "transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)";
    pptSlider.style.transform = `translateX(-${currentPptIndex * (100 / totalPptSlides)}%)`;
    pptCurrentPage.textContent = currentPptIndex + 1;
  }
}

// Build intro slides from either a single path or an array of paths.
function configureIntroSlides(introFiles) {
  if (!introCover) return;

  const files = (Array.isArray(introFiles) ? introFiles : [introFiles])
    .filter(file => typeof file === "string" && file.trim() !== "");

  if (files.length === 0) return;

  introCover.replaceChildren();
  introSlides = files.map((file, index) => {
    const img = document.createElement("img");
    img.src = file;
    img.alt = `Intro Cover ${index + 1}`;
    img.className = `intro-img${index === 0 ? " active" : ""}`;
    introCover.appendChild(img);
    return img;
  });
  introSlideIndex = 0;
}

function stopIntroSlideshow() {
  if (introSlideTimer) {
    clearInterval(introSlideTimer);
    introSlideTimer = null;
  }
}

function startIntroSlideshow() {
  stopIntroSlideshow();
  if (introSlides.length < 2) return;

  introSlideTimer = setInterval(() => {
    introSlides[introSlideIndex].classList.remove("active");
    introSlideIndex = (introSlideIndex + 1) % introSlides.length;
    introSlides[introSlideIndex].classList.add("active");
  }, introRotationSeconds * 1000);
}

// Show targeted view
function showView(viewName) {
  if (viewName === 'introCover') {
    if (introCover) introCover.style.display = "block";
    if (pptView) pptView.style.display = "none";
    if (mainView) mainView.style.display = "flex";
    if (kioskFooter) kioskFooter.style.display = "flex";
    startIntroSlideshow();
  } else if (viewName === 'pptView') {
    stopIntroSlideshow();
    if (introCover) introCover.style.display = "none";
    if (pptView) pptView.style.display = "flex";
    if (mainView) mainView.style.display = "none";
    if (kioskFooter) kioskFooter.style.display = "none";
  } else {
    stopIntroSlideshow();
    if (introCover) introCover.style.display = "none";
    if (pptView) pptView.style.display = "none";
    if (mainView) mainView.style.display = "flex";
    if (kioskFooter) kioskFooter.style.display = "flex";
  }
}

// Clear all active timers
function clearTimers() {
  if (rotationTimer) {
    clearTimeout(rotationTimer);
    rotationTimer = null;
  }
  if (idleTimer) {
    clearTimeout(idleTimer);
    idleTimer = null;
  }
  stopIntroSlideshow();
}

// Start rotation loop (floorGuide <-> introCover)
function startRotationLoop() {
  clearTimers();
  rotationActive = true;

  if (introCover && introCover.style.display === "block") {
    startIntroSlideshow();
  }
  
  const tick = () => {
    if (!rotationActive) return;
    if (introCover) {
      if (introCover.style.display === "block") {
        showView('floorGuide');
        // Restore to device current floor
        if (deviceLocation) {
          const initialIndex = floorData.findIndex(f => f.id === deviceLocation.currentFloor);
          if (initialIndex !== -1) {
            goToFloor(initialIndex, true);
          }
        }
      } else {
        showView('introCover');
      }
    }
    rotationTimer = setTimeout(tick, rotationSeconds * 1000);
  };
  
  rotationTimer = setTimeout(tick, rotationSeconds * 1000);
}

// Reset active idle timer
function resetIdleTimer() {
  clearTimers();
  rotationActive = false;
  
  idleTimer = setTimeout(() => {
    if (pptView && pptView.style.display === "flex") {
      // Return to floor guide first
      showView('floorGuide');
      if (deviceLocation) {
        const initialIndex = floorData.findIndex(f => f.id === deviceLocation.currentFloor);
        if (initialIndex !== -1) {
          goToFloor(initialIndex, true);
        }
      }
      // Wait rotationSeconds instead of homeSeconds after automatic return
      clearTimers();
      idleTimer = setTimeout(() => {
        showView('introCover');
        startRotationLoop();
      }, rotationSeconds * 1000);
    } else {
      // Go to intro cover and start rotation
      showView('introCover');
      startRotationLoop();
    }
  }, homeSeconds * 1000);
}

// Handle global screen interactions
function handleInteraction(e) {
  if (rotationActive) {
    rotationActive = false;
    clearTimers();
    
    if (introCover && introCover.style.display === "block") {
      showView('floorGuide');
      if (deviceLocation) {
        const initialIndex = floorData.findIndex(f => f.id === deviceLocation.currentFloor);
        if (initialIndex !== -1) {
          goToFloor(initialIndex, true);
        }
      }
    }
    resetIdleTimer();
    return;
  }
  
  resetIdleTimer();
}

// 4. Event Listeners & Initialization
window.addEventListener("DOMContentLoaded", () => {
  // Bind DOM Elements
  floorLabelSlider = document.getElementById("floorLabelSlider");
  activeFloorSummary = document.getElementById("activeFloorSummary");
  mapSlider = document.getElementById("mapSlider");
  mapPin = document.getElementById("mapPin");
  navIndicator = document.getElementById("navIndicator");
  navColumns = document.querySelectorAll(".nav-column");
  introPdfBtn = document.getElementById("introPdfBtn");

  mainView = document.getElementById("mainView");
  pptView = document.getElementById("pptView");
  pptSlider = document.getElementById("pptSlider");
  pptPrev = document.getElementById("pptPrev");
  pptNext = document.getElementById("pptNext");
  pptCurrentPage = document.getElementById("pptCurrentPage");
  pptHomeBtn = document.getElementById("pptHomeBtn");
  introCover = document.getElementById("introCover");
  kioskFooter = document.getElementById("kioskFooter");

  // Global interaction handlers for idle/rotation timing
  const kioskContainer = document.querySelector(".kiosk-container");
  if (kioskContainer) {
    kioskContainer.addEventListener("mousedown", handleInteraction, { capture: true });
    kioskContainer.addEventListener("touchstart", handleInteraction, { capture: true, passive: true });
  }

  // Helper to bind mousedown and touchstart without double trigger
  function bindTriggerEvent(element, callback) {
    if (!element) return;
    const trigger = (e) => {
      e.preventDefault();
      callback(e);
    };
    element.addEventListener("mousedown", trigger, { passive: false });
    element.addEventListener("touchstart", trigger, { passive: false });
  }

  // Bind Event Listeners
  navColumns.forEach(col => {
    const index = parseInt(col.getAttribute("data-floor-index"), 10);
    bindTriggerEvent(col, () => {
      goToFloor(index);
    });
  });

  window.addEventListener("resize", () => {
    updateIndicatorPosition(currentFloorIndex);
  });

  bindTriggerEvent(introPdfBtn, () => {
    showView('pptView');
    currentPptIndex = 0;
    updatePptSlider();
  });

  bindTriggerEvent(pptHomeBtn, () => {
    showView('floorGuide');
    // Go to home floor (device floor)
    if (deviceLocation) {
      const initialIndex = floorData.findIndex(f => f.id === deviceLocation.currentFloor);
      if (initialIndex !== -1) {
        goToFloor(initialIndex, true);
      }
    }

    // If no touch occurs after returning, go back to introCover after rotationSeconds
    clearTimers();
    rotationActive = false;
    idleTimer = setTimeout(() => {
      showView('introCover');
      startRotationLoop();
    }, rotationSeconds * 1000);
  });

  bindTriggerEvent(pptPrev, () => {
    if (currentPptIndex > 0) {
      currentPptIndex--;
      updatePptSlider();
    }
  });

  bindTriggerEvent(pptNext, () => {
    if (currentPptIndex < totalPptSlides - 1) {
      currentPptIndex++;
      updatePptSlider();
    }
  });

  // Drag / Swipe Slider for PPT View
  const pptSliderContainer = document.querySelector(".ppt-slider-container");
  if (pptSliderContainer && pptSlider) {
    let startX = 0;
    let currentX = 0;
    let isDragging = false;
    let startOffset = 0;

    const getClientX = (e) => {
      if (e.touches && e.touches.length > 0) {
        return e.touches[0].clientX;
      }
      if (e.changedTouches && e.changedTouches.length > 0) {
        return e.changedTouches[0].clientX;
      }
      return e.clientX;
    };

    const dragStart = (e) => {
      isDragging = true;
      startX = getClientX(e);
      pptSlider.style.transition = "none";
      const containerWidth = pptSliderContainer.offsetWidth;
      startOffset = -currentPptIndex * containerWidth;
    };

    const dragMove = (e) => {
      if (!isDragging) return;
      currentX = getClientX(e);
      const diffX = currentX - startX;
      let targetOffset = startOffset + diffX;
      
      const containerWidth = pptSliderContainer.offsetWidth;
      const minOffset = -(totalPptSlides - 1) * containerWidth;
      const maxOffset = 0;
      
      // Rubber band effect at boundaries
      if (targetOffset > maxOffset) {
        targetOffset = maxOffset + (targetOffset - maxOffset) * 0.3;
      } else if (targetOffset < minOffset) {
        targetOffset = minOffset + (targetOffset - minOffset) * 0.3;
      }

      pptSlider.style.transform = `translateX(${targetOffset}px)`;
    };

    const dragEnd = (e) => {
      if (!isDragging) return;
      isDragging = false;
      
      currentX = getClientX(e);
      const diffX = currentX - startX;
      const threshold = 120; // px threshold

      pptSlider.style.transition = "transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)";

      if (diffX < -threshold) {
        if (currentPptIndex < totalPptSlides - 1) {
          currentPptIndex++;
        }
      } else if (diffX > threshold) {
        if (currentPptIndex > 0) {
          currentPptIndex--;
        }
      }
      updatePptSlider();
    };

    // Touch events
    pptSliderContainer.addEventListener("touchstart", dragStart, { passive: true });
    pptSliderContainer.addEventListener("touchmove", dragMove, { passive: true });
    pptSliderContainer.addEventListener("touchend", dragEnd, { passive: true });

    // Mouse events
    pptSliderContainer.addEventListener("mousedown", dragStart);
    window.addEventListener("mousemove", dragMove);
    window.addEventListener("mouseup", dragEnd);
  }


  // Fetch location configuration from data/data.json
  fetch("data/data.json")
    .then(response => {
      if (!response.ok) {
        throw new Error("HTTP error " + response.status);
      }
      return response.json();
    })
    .then(data => {
      deviceLocation = data;

      // Load configurations from JSON
      if (data.rotationSeconds !== undefined) rotationSeconds = parseFloat(data.rotationSeconds);
      if (data.homeSeconds !== undefined) homeSeconds = parseFloat(data.homeSeconds);
      if (data.introRotationSeconds !== undefined) {
        const configuredSeconds = parseFloat(data.introRotationSeconds);
        if (Number.isFinite(configuredSeconds) && configuredSeconds > 0) {
          introRotationSeconds = configuredSeconds;
        }
      }
      if (introCover && data.intro_file) {
        configureIntroSlides(data.intro_file);
      }

      // Find the index of the configured currentFloor (supporting labels "B1", "1F", "2F", etc.)
      let rawFloor = String(deviceLocation.currentFloor).trim();
      if (rawFloor === "0") rawFloor = "B1";

      const initialIndex = floorData.findIndex(f => f.label === rawFloor || f.id === rawFloor);
      if (initialIndex !== -1) {
        currentFloorIndex = initialIndex;
        // Normalize deviceLocation.currentFloor to standard internal floor ID (e.g. "B1", "1", "2")
        deviceLocation.currentFloor = floorData[initialIndex].id;
      }

      // Anchoring the Map Pin to the target floor slide-item element
      const targetSlide = document.querySelector(`.map-slide-item[data-floor="${deviceLocation.currentFloor}"]`);
      if (targetSlide && mapPin) {
        // Move the pin element inside the specific floor container so it slides along with it
        targetSlide.appendChild(mapPin);

        // Position it statically relative to that floor container
        mapPin.style.left = `${deviceLocation.pinPos.x}%`;
        mapPin.style.top = `${deviceLocation.pinPos.y}%`;

        // Make sure it is visible
        mapPin.style.opacity = "1";
      }

      // Initialize layout with a small delay for correct offset measurements
      setTimeout(() => {
        goToFloor(currentFloorIndex, true);
        // Start the rotation loop initially (initial view is floorGuide)
        startRotationLoop();
      }, 100);
    })
    .catch(error => {
      console.error("Failed to load device location configurations:", error);
      // Fallback initialization
      setTimeout(() => {
        goToFloor(currentFloorIndex, true);
        startRotationLoop();
      }, 100);
    });
});
