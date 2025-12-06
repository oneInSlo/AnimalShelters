import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";
import path from "path";
import { fileURLToPath } from "url";

// ---- Resolve path to proto ----
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROTO_PATH = path.resolve(
  __dirname,
  "..",
  "..",
  "..",
  "NALOGA05",
  "grpc-shelters",
  "shelter.proto"
);

// ---- Load proto ----
const packageDef = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const proto = grpc.loadPackageDefinition(packageDef).shelters;

// ---- Create client instance ----
export const grpcClient = new proto.ShelterService(
  "localhost:50051",
  grpc.credentials.createInsecure()
);
