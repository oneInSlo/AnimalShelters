import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";

export default function createLlmRoutes(DATA) {
  const router = express.Router();

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

  // JSON schema (NEW SDK format — no Type.*)
  const responseSchema = {
    type: "object",
    required: [
      "fitScore",
      "fitLabelSl",
      "summarySl",
      "behaviorMatchSl",
      "risksSl",
      "recommendationsSl"
    ],
    properties: {
      fitScore: { type: "number" },
      fitLabelSl: { type: "string" },
      summarySl: { type: "string" },
      behaviorMatchSl: { type: "string" },
      risksSl: {
        type: "array",
        items: { type: "string" }
      },
      recommendationsSl: {
        type: "array",
        items: { type: "string" }
      }
    }
  };

  // System instruction in Slovenian
  const SYSTEM_INSTR = `
Ti si inteligentni pomočnik v spletni aplikaciji slovenskih zavetišč za živali.

Tvoja naloga je, da na podlagi podanih podatkov o živali in življenjskem slogu uporabnika oceniš,
kako primerna je izbrana žival za posvojitev.

Pravila:
1. Uporabi izključno podatke, ki so ti bili predani. Ne dodajaj novih lastnosti ali informacij.
2. Vsa polja, katerih ime se konča z "Sl", morajo biti napisana v SLOVENŠČINI.
3. fitLabelSl mora biti eden izmed naslednjih izrazov:
   - "Zelo primeren"
   - "Dobra izbira"
   - "Pogojno primeren"
   - "Ni primeren"
4. Slog naj bo prijazen, strokoven in jedrnat.
5. Odgovor mora biti strogo veljaven JSON, ki ustreza predpisani shemi.
6. Ne dodajaj nobenega uvodnega ali zaključnega besedila – samo JSON objekt.

Tvoj izhod naj bo uporaben, jasen in prilagojen bodočim posvojiteljem v Sloveniji.
`;

  // MAIN ENDPOINT
  router.post("/animal-fit", async (req, res) => {
    try {
      const {
        animalId,
        livingSituation,
        activityLevel,
        experienceLevel,
        hasChildren,
        hasOtherPets,
        timeAvailablePerDay
      } = req.body;

      const animal = DATA.animals.find((a) => a.id === animalId);
      if (!animal) {
        return res.status(404).json({ error: "Žival ni najdena." });
      }

      const userPrompt = `
Podatki o živali iz zavetišča:

- ID: ${animal.id}
- Vrsta: ${animal.species}
- Ime: ${animal.name}
- Pasma: ${animal.breed}
- Spol: ${animal.sex}
- Starost (meseci): ${animal.ageMonths}
- Barve: ${animal.colors.join(", ")}
- Teža (kg): ${animal.weightKg}
- Nevtraliziran: ${animal.neutered}
- Vedenje / temperament: ${animal.temperament.join(", ")}
- Datum sprejema: ${animal.intakeDate}

Podatki o življenjskem slogu uporabnika:

- Bivalna situacija: ${livingSituation}
- Aktivnost uporabnika: ${activityLevel}
- Izkušnje z živalmi: ${experienceLevel}
- Prisotnost otrok: ${hasChildren}
- Prisotnost drugih živali: ${hasOtherPets}
- Čas na voljo za žival (ure/dan): ${timeAvailablePerDay}

Naloga:
Oceni primernost živali na podlagi navedenih podatkov.
Vrni izključno JSON, ki ustreza shemi.
`;

      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        systemInstruction: SYSTEM_INSTR,
      });

      const result = await model.generateContent({
        contents: [
          {
            role: "user",
            parts: [{ text: userPrompt }]
          }
        ],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema,
          thinkingConfig: { thinkingBudget: 0 }
        }
      });

      const json = JSON.parse(result.response.text());
      return res.json(json);

    } catch (err) {
      console.error("LLM error:", err);
      return res.status(500).json({ error: "Napaka pri LLM analizi." });
    }
  });

  return router;
}
