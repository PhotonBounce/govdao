(function () {
  "use strict";

  /* ── Intersection Observer: fade-in / slide-up ─────────────────── */

  var animatedEls = document.querySelectorAll(".fade-in, .slide-up");

  var revealObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  animatedEls.forEach(function (el) {
    revealObserver.observe(el);
  });

  /* ── Hero Seal Parallax ─────────────────────────────────────────── */

  var heroSeal = document.getElementById("hero-seal");

  /* ── Phone Frame Parallax ───────────────────────────────────────── */

  var phoneWrapper = document.getElementById("phone-wrapper");

  function onScroll() {
    var scrollY = window.scrollY || window.pageYOffset;

    if (heroSeal) {
      heroSeal.style.transform =
        "translate(-50%, calc(-50% + " + scrollY * -0.4 + "px))";
    }

    if (phoneWrapper) {
      phoneWrapper.style.transform =
        "translateY(" + scrollY * -0.12 + "px)";
    }
  }

  window.addEventListener("scroll", onScroll, { passive: true });

  /* ── Animated Counters ──────────────────────────────────────────── */

  var counters = document.querySelectorAll("[data-count-to]");

  function animateCounter(el) {
    var target = parseFloat(el.getAttribute("data-count-to"));
    var suffix = el.getAttribute("data-suffix") || "";
    var decimals = el.getAttribute("data-decimals")
      ? parseInt(el.getAttribute("data-decimals"), 10)
      : 0;
    var duration = 1600;
    var startTime = null;

    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      var progress = Math.min((timestamp - startTime) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      var current = eased * target;
      el.textContent = current.toFixed(decimals) + suffix;
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    }

    requestAnimationFrame(step);
  }

  var counterObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          counterObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );

  counters.forEach(function (el) {
    counterObserver.observe(el);
  });

  /* ── Timeline Line Animation ────────────────────────────────────── */

  var timelineLine = document.querySelector(".timeline-connector-line");

  if (timelineLine) {
    var timelineObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            timelineLine.classList.add("animated");
            timelineObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.3 }
    );

    var timelineSection = document.getElementById("how-it-works");
    if (timelineSection) {
      timelineObserver.observe(timelineSection);
    }
  }

  /* ── User Guide Tabs ────────────────────────────────────────────── */

  var tabs = document.querySelectorAll(".guide-tab");
  var panels = document.querySelectorAll(".guide-panel");

  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      tabs.forEach(function (t) {
        t.classList.remove("active");
        t.setAttribute("aria-selected", "false");
      });
      panels.forEach(function (p) {
        p.classList.remove("active");
        p.style.display = "none";
      });

      tab.classList.add("active");
      tab.setAttribute("aria-selected", "true");

      var panelId = tab.getAttribute("aria-controls");
      var activePanel = document.getElementById(panelId);
      if (activePanel) {
        activePanel.classList.add("active");
        activePanel.style.display = "grid"; // Grid layout for content
      }
    });
  });

  /* ── Background color cycling is handled by CSS @keyframes ─────── */

})();
