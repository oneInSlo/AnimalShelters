import { readXml } from "./utils/xml.js";

// Loads and joins XML documents from ../data

function normalize(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function toBool(v) {
  if (typeof v === "boolean") return v;
  if (v === 1) return true;
  if (v === 0) return false;
  if (v == null) return false;
  return String(v).toLowerCase().trim() === "true";
}

export function loadData() {
  const sheltersDoc = readXml("shelters.xml");
  const animalsDoc = readXml("animals.xml");
  const eventsDoc = readXml("events.xml");

  const shelters = normalize(sheltersDoc.shelters.shelter).map((s) => ({
    id: s.id,
    name: s.name,
    city: s.city,
    postalCode: Number(s.postalCode),
    address: s.address,
    latitude: Number(s.latitude),
    longitude: Number(s.longitude),
    region: s.region,
    capacity: Number(s.capacity),
    phone: s.phone,
    email: s.email,
    established: s.established,
  }));

  const sheltersById = new Map(shelters.map((s) => [s.id, s]));

  const animals = normalize(animalsDoc.animals.animal).map((a) => ({
    id: a.id,
    species: a.species,
    name: a.name,
    breed: a.breed,
    sex: a.sex,
    ageMonths: Number(a.ageMonths),
    colors: normalize(a.colors?.color),
    weightKg: Number(a.weightKg),
    neutered: toBool(a.neutered),
    adoptionFee: Number(a.adoptionFee),
    intakeDate: a.intakeDate,
    vaccinations: normalize(a.vaccinations?.vaccine),
    microchip: a.microchip?.number || null,
    temperament: normalize(a.temperament?.behavior),
    shelterId: a.shelterId,
    shelter: sheltersById.get(a.shelterId) || null,
  }));

  const events = normalize(eventsDoc.events.event).map((e) => ({
    id: e.id,
    type: e.type,
    title: e.title,
    date: e.date,
    city: e.city,
    shelterId: e.shelterId,
    location: e.location,
    description: e.description,
    status: e.status,
    audience: e.audience,
    entryFee: e.entry?.fee || null,
    shelter: sheltersById.get(e.shelterId) || null,
  }));

  return { shelters, animals, events };
}
