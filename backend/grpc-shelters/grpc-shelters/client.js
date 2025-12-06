const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

const PROTO_PATH = './shelter.proto';

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const proto = grpc.loadPackageDefinition(packageDefinition).shelters;

const client = new proto.ShelterService(
  'localhost:50051',
  grpc.credentials.createInsecure()
);

// 1) Test: ListShelters
function testListShelters() {
  client.ListShelters({}, (err, response) => {
    if (err) {
      console.error('Napaka pri ListShelters:', err);
      return;
    }
    console.log('Seznam zavetišč:');
    console.log(response.shelters);
  });
}

// 2) Test: GetShelterAnimals
function testGetShelterAnimals() {
  client.GetShelterAnimals({ shelterId: '1' }, (err, response) => {
    if (err) {
      console.error('Napaka pri GetShelterAnimals:', err);
      return;
    }
    console.log('Živali v zavetišču 1:');
    console.log(response.animals);
  });
}

// 3) Test: AddAnimal + ponoven prikaz
function testAddAnimal() {
  client.AddAnimal(
    {
      shelterId: '1',
      name: 'Bela',
      species: 'dog',
      breed: 'Mongrel',
      age: 3,
    },
    (err, response) => {
      if (err) {
        console.error('Napaka pri AddAnimal:', err);
        return;
      }
      console.log('Odgovor AddAnimal:', response.message);

      // ponovno preberemo živali
      testGetShelterAnimals();
    }
  );
}

// 4) Test: StreamNewAnimals
function testStreamNewAnimals() {
  const stream = client.StreamNewAnimals({});

  console.log('Začenjam StreamNewAnimals (CTRL+C za izhod)...');
  stream.on('data', (animal) => {
    console.log('Stream posodobitev:', animal);
  });

  stream.on('error', (err) => {
    console.error('Stream error:', err);
  });

  stream.on('end', () => {
    console.log('StreamNewAnimals končan.');
  });
}

// Po zagonu lahko ročno pokličeš funkcije:
testListShelters();
testGetShelterAnimals();
testAddAnimal();
testStreamNewAnimals();
