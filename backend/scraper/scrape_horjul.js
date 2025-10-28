import puppeteer from "puppeteer";
import fs from "fs";

async function scrapeHorjul() {
  const base = "https://www.zavetisce-horjul.net";
  const listUrl = `${base}/iscejo-dom/`;
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // Pretend to be a real browser (Elementor sometimes hides data from headless)
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
  );
  await page.setViewport({ width: 1366, height: 900 });
  page.setDefaultTimeout(90000);

  console.log(`🌐 Opening: ${listUrl}`);
  await page.goto(listUrl, { waitUntil: "networkidle2" });

  // 1️⃣ Collect animal links (title, href, and image)
  const animals = await page.$$eval(".gbx__block", (els) =>
    els.map((el) => {
      const link = el.closest("[data-link]")?.getAttribute("data-link") || "";
      const name =
        el.querySelector(".gbx__title .gbx-repeater-item-inner")?.innerText.trim() || "";
      const image = el.querySelector("img")?.src || "";
      return { name, link, image };
    })
  );

  console.log(`✅ Found ${animals.length} animals.`);
  const dataOut = [];

  // 2️⃣ Scrape each animal page
  for (const [i, animal] of animals.entries()) {
    console.log(`\n🔍 [${i + 1}/${animals.length}] Scraping ${animal.name || "(no name)"} → ${animal.link}`);

    try {
      await page.goto(animal.link, { waitUntil: "networkidle2", timeout: 60000 });

      // Wait for main content to appear
      await page.waitForSelector("h2.elementor-heading-title", { timeout: 20000 });
      await page.waitForSelector(".elementor-widget-text-editor p", { timeout: 20000 });

      const details = await page.evaluate(() => {
        const clean = (s) =>
          (s || "")
            .replace(/\u00A0/g, " ")
            .replace(/\s+/g, " ")
            .trim();

        const byDataIdText = (id) =>
          document.querySelector(`[data-id="${id}"] .elementor-widget-container`)?.innerText || "";

        const byDataIdPText = (id) =>
          Array.from(document.querySelectorAll(`[data-id="${id}"] .elementor-widget-container p`))
            .map((p) => p.innerText)
            .join("\n");

        // --- NAME ---
        const name =
          clean(
            document.querySelector(
              'div[data-id="335ff00e"] h2.elementor-heading-title, h2.elementor-heading-title'
            )?.innerText
          ) || "";

        // --- DAYS IN SHELTER ---
        const daysBlock =
          byDataIdPText("6065b99b") ||
          Array.from(document.querySelectorAll(".elementor-widget-text-editor p"))
            .map((p) => p.innerText)
            .find((t) => t.includes("Pri nas je")) ||
          "";
        const daysInShelter =
          clean(daysBlock.match(/Pri nas je\s*(.*?)\./)?.[1]) || "";

        // --- DATE / LOCATION / STATUS ---
        const infoRaw =
          byDataIdPText("6eb2caa2") ||
          Array.from(document.querySelectorAll(".elementor-widget-text-editor p"))
            .map((p) => p.innerText)
            .find((t) => t.includes("Datum sprejema")) ||
          "";
        const normalizedInfo = clean(infoRaw);

        const dateOfAcceptance =
          clean(normalizedInfo.match(/Datum sprejema:\s*([0-9.\s]+)/)?.[1]) || "";
        const foundLocation =
          clean(normalizedInfo.match(/Mesto najdbe:\s*([A-Za-zÀ-ž\s\-]+)/)?.[1]) || "";
        const status =
          clean(normalizedInfo.match(/Status:\s*([A-Za-zÀ-ž\s\-]+)/)?.[1]) || "";

        // --- HELPER for labeled fields ---
        const getNextH5 = (label) => {
          const candidates = Array.from(
            document.querySelectorAll("h2.elementor-heading-title, h2.elementor-heading-title span.opis")
          );
          const hit = candidates.find(
            (el) => clean(el.innerText).toUpperCase() === clean(label).toUpperCase()
          );
          if (!hit) return "";
          const widgetEl =
            hit.closest(".elementor-element") ||
            hit.parentElement?.closest(".elementor-element") ||
            null;
          const h5 =
            widgetEl?.nextElementSibling?.querySelector("h5") ||
            widgetEl?.parentElement?.nextElementSibling?.querySelector("h5") ||
            null;
          return clean(h5?.innerText || "");
        };

        // --- Labeled fields ---
        const temperament = getNextH5("TEMPERAMENT");
        const sex = getNextH5("SPOL");
        const size = getNextH5("VELIKOST");
        const ageAtIntake = getNextH5("STAROST OB SPREJEMU");
        const weightAtIntake = getNextH5("TEŽA OB SPREJEMU");
        const vetCare = getNextH5("VETERINARSKA OSKRBA");

        // --- FeLV/FIV ---
        const felvHeading = Array.from(
          document.querySelectorAll('h2.elementor-heading-title span.opis, h2.elementor-heading-title')
        ).find((el) => /FeLV|FIV/i.test(el.innerText || ""));
        const felvFiv = clean(felvHeading?.innerText || "");
        const felvFivResult = clean(
          felvHeading
            ?.closest(".elementor-element")
            ?.nextElementSibling?.querySelector("h5")
            ?.innerText || ""
        );

        // --- DESCRIPTION ---
        const description =
          clean(
            Array.from(document.querySelectorAll(".elementor-widget-text-editor p"))
              .map((p) => p.innerText)
              .sort((a, b) => b.length - a.length)[0] || ""
          ) || "";

        // --- GALLERY ---
        let galleryImgs = Array.from(
          document.querySelectorAll(".elementor-image-carousel img")
        )
          .map((img) => img?.src || "")
          .filter(Boolean);

        if (galleryImgs.length === 0) {
          galleryImgs = Array.from(
            document.querySelectorAll(
              '[data-elementor-open-lightbox] figure img, .elementor-gallery-item a'
            )
          )
            .map((el) => (el.tagName === "IMG" ? el.src : el.getAttribute("href")))
            .filter(Boolean);
        }

        return {
          name,
          daysInShelter,
          dateOfAcceptance,
          foundLocation,
          status,
          temperament,
          sex,
          size,
          ageAtIntake,
          weightAtIntake,
          felvFiv,
          felvFivResult,
          vetCare,
          description,
          galleryImgs,
        };
      });

      dataOut.push({ ...animal, ...details });
      console.log("✅ Scraped:", details.name || "(no name)", "—", details.foundLocation || "N/A");
    } catch (err) {
      console.log(`❌ Error scraping ${animal.name || "(no name)"}:`, err.message);
    }
  }

  // 3️⃣ Save data
  fs.writeFileSync("horjul_animals.json", JSON.stringify(dataOut, null, 2));
  console.log(`\n💾 Saved ${dataOut.length} animals to horjul.json`);

  await browser.close();
}

scrapeHorjul();
