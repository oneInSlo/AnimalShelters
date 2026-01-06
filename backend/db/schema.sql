PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS shelters (
  id TEXT PRIMARY KEY,
  region TEXT,
  name TEXT NOT NULL,
  city TEXT,
  postalCode TEXT,
  address TEXT,
  latitude REAL,
  longitude REAL,
  capacity INTEGER,
  phone TEXT,
  email TEXT,
  established TEXT
);

CREATE TABLE IF NOT EXISTS animals (
  id TEXT PRIMARY KEY,
  species TEXT,
  name TEXT NOT NULL,
  breed TEXT,
  sex TEXT,
  ageMonths INTEGER,
  weightKg REAL,
  neutered INTEGER,
  adoptionFee REAL,
  intakeDate TEXT,
  shelterId TEXT,
  microchip TEXT,
  FOREIGN KEY (shelterId) REFERENCES shelters(id)
);

CREATE TABLE IF NOT EXISTS animal_colors (
  animalId TEXT,
  color TEXT,
  PRIMARY KEY (animalId, color),
  FOREIGN KEY (animalId) REFERENCES animals(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS animal_vaccinations (
  animalId TEXT,
  vaccine TEXT,
  PRIMARY KEY (animalId, vaccine),
  FOREIGN KEY (animalId) REFERENCES animals(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS animal_temperament (
  animalId TEXT,
  trait TEXT,
  PRIMARY KEY (animalId, trait),
  FOREIGN KEY (animalId) REFERENCES animals(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  type TEXT,
  title TEXT NOT NULL,
  date TEXT,
  city TEXT,
  shelterId TEXT,
  startTime TEXT,
  endTime TEXT,
  location TEXT,
  description TEXT,
  status TEXT,
  audience TEXT,
  entry TEXT,
  FOREIGN KEY (shelterId) REFERENCES shelters(id)
);

-- scraped data (Horjul, etc.)
CREATE TABLE IF NOT EXISTS scraped_animals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source TEXT NOT NULL,          
  link TEXT NOT NULL UNIQUE,     
  name TEXT,
  image TEXT,
  daysInShelter TEXT,
  dateOfAcceptance TEXT,
  foundLocation TEXT,
  status TEXT,
  temperament TEXT,
  sex TEXT,
  size TEXT,
  ageAtIntake TEXT,
  weightAtIntake TEXT,
  vetCare TEXT,
  felvFiv TEXT,
  felvFivResult TEXT,
  description TEXT,
  shelterId TEXT,
  FOREIGN KEY (shelterId) REFERENCES shelters(id)
);

CREATE TABLE IF NOT EXISTS scraped_animal_gallery (
  scrapedAnimalId INTEGER,
  imgUrl TEXT,
  PRIMARY KEY (scrapedAnimalId, imgUrl),
  FOREIGN KEY (scrapedAnimalId) REFERENCES scraped_animals(id) ON DELETE CASCADE
);
