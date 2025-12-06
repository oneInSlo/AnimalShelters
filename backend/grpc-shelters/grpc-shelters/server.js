import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import fs from 'fs';
import path from 'path';
import { XMLParser } from "fast-xml-parser";

const PROTO_PATH = "./shelter.proto";

// ---------------------------
// LOAD PROTO
// ---------------------------

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
});

const proto = grpc.loadPackageDefinition(packageDefinition).shelters;


// ---------------------------
// PATHS TO YOUR MAIN PROJECT DATA
// ---------------------------
//
// grpc-shelters
//   .. (→ NALOGA05)
//     .. (→ VAJE)
//         PROJEKT
//             AnimalShelters
//                 data/*.xml
//

const dataPath = path.resolve(
    "..", "..",         // from grpc-shelters → NALOGA05 → VAJE
    "PROJEKT",
    "AnimalShelters",
    "data"
);

// ---------------------------
// XML PARSER
// ---------------------------
const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "",
    parseTagValue: true,
    trimValues: true,
});

function readXml(filename) {
    const filePath = path.join(dataPath, filename);
    const xml = fs.readFileSync(filePath, "utf8");
    return parser.parse(xml);
}

function normalize(value) {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
}


// ---------------------------
// LOAD DATA FROM XML
// ---------------------------
function loadData() {
    const sheltersDoc = readXml("shelters.xml");
    const animalsDoc = readXml("animals.xml");
    const eventsDoc = readXml("events.xml");

    const shelters = normalize(sheltersDoc.shelters.shelter).map((s) => ({
        id: s.id,
        region: s.region,
        name: s.name,
        city: s.city,
        postalCode: s.postalCode,
        address: s.address,
        latitude: Number(s.latitude),
        longitude: Number(s.longitude),
        capacity: Number(s.capacity),
        phone: s.phone,
        email: s.email,
        established: s.established
    }));

    const sheltersById = new Map(shelters.map(s => [s.id, s]));

    const animals = normalize(animalsDoc.animals.animal).map((a) => ({
        id: a.id,
        name: a.name,
        species: a.species,
        breed: a.breed,
        sex: a.sex,
        ageMonths: Number(a.ageMonths),
        weightKg: Number(a.weightKg),
        neutered: String(a.neutered).toLowerCase() === "true",
        adoptionFee: Number(a.adoptionFee),
        intakeDate: a.intakeDate,
        shelterId: a.shelterId,

        colors: normalize(a.colors?.color),
        vaccinations: normalize(a.vaccinations?.vaccine),
        microchip: {
            number: a.microchip?.number || "",
            dateImplanted: a.microchip?.dateImplanted || ""
        },
        temperament: normalize(a.temperament?.behavior)
    }));

    return { shelters, animals };
}

let DATA = loadData();


// ---------------------------
// RPC IMPLEMENTATIONS
// ---------------------------

// 1) List shelters
function ListShelters(call, callback) {
    callback(null, { shelters: DATA.shelters });
}

// 2) List ALL animals
function ListAllAnimals(call, callback) {
    callback(null, { animals: DATA.animals });
}

// 3) Animals by shelter
function GetAnimalsByShelter(call, callback) {
    const { shelterId } = call.request;
    const filtered = DATA.animals.filter(a => a.shelterId === shelterId);
    callback(null, { animals: filtered });
}

// 4) STREAMING – send a random animal every 4 seconds
function StreamAnimalUpdates(call) {
    let index = 0;

    const interval = setInterval(() => {
        if (DATA.animals.length === 0) return;
        const animal = DATA.animals[index % DATA.animals.length];
        call.write(animal);
        index++;
    }, 4000);

    call.on("cancelled", () => {
        clearInterval(interval);
        call.end();
    });

    call.on("end", () => {
        clearInterval(interval);
        call.end();
    });
}

// 5) Add new animal (saved only in memory for demo)
function AddAnimal(call, callback) {
    const a = call.request;

    const newAnimal = {
        id: "NEW" + (DATA.animals.length + 1),
        ...a
    };

    DATA.animals.push(newAnimal);

    callback(null, { message: "Žival uspešno dodana preko gRPC!" });
}


// ---------------------------
// START SERVER
// ---------------------------

function main() {
    const server = new grpc.Server();

    server.addService(proto.ShelterService.service, {
        ListShelters,
        ListAllAnimals,
        GetAnimalsByShelter,
        StreamAnimalUpdates,
        AddAnimal,
    });

    server.bindAsync(
        "0.0.0.0:50051",
        grpc.ServerCredentials.createInsecure(),
        () => {
            console.log("gRPC strežnik teče na portu 50051");
            server.start();
        }
    );
}

main();
