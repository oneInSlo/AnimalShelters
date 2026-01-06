import { db } from "../db/db.js";

export function getAnimals(filters = {}) {
  const where = [];
  const params = {};

  if (filters.species) { where.push("a.species = @species"); params.species = filters.species; }
  if (filters.sex) { where.push("a.sex = @sex"); params.sex = filters.sex; }
  if (filters.shelterId) { where.push("a.shelterId = @shelterId"); params.shelterId = filters.shelterId; }
  if (filters.neutered !== undefined) { where.push("a.neutered = @neutered"); params.neutered = Number(filters.neutered); }

  const sql = `
    SELECT
      a.*,
      s.id AS s_id, s.region AS s_region, s.name AS s_name, s.city AS s_city, s.postalCode AS s_postalCode,
      s.address AS s_address, s.latitude AS s_latitude, s.longitude AS s_longitude, s.capacity AS s_capacity,
      s.phone AS s_phone, s.email AS s_email, s.established AS s_established
    FROM animals a
    LEFT JOIN shelters s ON s.id = a.shelterId
    ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
    ORDER BY a.intakeDate DESC, a.name ASC
  `;

  const rows = db.prepare(sql).all(params);

  const getColors = db.prepare("SELECT color FROM animal_colors WHERE animalId = ?");
  const getVacc = db.prepare("SELECT vaccine FROM animal_vaccinations WHERE animalId = ?");
  const getTemp = db.prepare("SELECT trait FROM animal_temperament WHERE animalId = ?");

  return rows.map((r) => ({
    id: r.id,
    species: r.species,
    name: r.name,
    breed: r.breed,
    sex: r.sex,
    ageMonths: r.ageMonths,
    weightKg: r.weightKg,
    neutered: !!r.neutered,
    adoptionFee: r.adoptionFee,
    intakeDate: r.intakeDate,
    shelterId: r.shelterId,
    microchip: r.microchip,
    colors: getColors.all(r.id).map(x => x.color),
    vaccinations: getVacc.all(r.id).map(x => x.vaccine),
    temperament: getTemp.all(r.id).map(x => x.trait),
    shelter: r.s_id ? {
      id: r.s_id,
      region: r.s_region,
      name: r.s_name,
      city: r.s_city,
      postalCode: r.s_postalCode,
      address: r.s_address,
      latitude: r.s_latitude,
      longitude: r.s_longitude,
      capacity: r.s_capacity,
      phone: r.s_phone,
      email: r.s_email,
      established: r.s_established,
    } : null,
  }));
}
