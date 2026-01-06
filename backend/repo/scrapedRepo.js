import { db } from "../db/db.js";

export function getHorjulAnimals() {
  const animals = db.prepare(`
    SELECT * FROM scraped_animals
    WHERE source = 'horjul'
    ORDER BY id DESC
  `).all();

  const getGallery = db.prepare(`
    SELECT imgUrl FROM scraped_animal_gallery
    WHERE scrapedAnimalId = ?
  `);

  return animals.map(a => ({
    ...a,
    galleryImgs: getGallery.all(a.id).map(x => x.imgUrl),
  }));
}
