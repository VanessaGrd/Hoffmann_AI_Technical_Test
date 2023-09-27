import path from "path";

import { promises as fs } from "fs";

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

export default async function handlerData(req, res) {
  let filteredData;

  try {
    // Chemin absolu du fichier JSON

    const jsonDirectory = path.join(process.cwd(), "public");

    // Contenu du fichier JSON (jetscanner.json)

    const fileContents = await fs.readFile(path.join(jsonDirectory, "jetscanner.json"), "utf8");

    // Transformation contenu JSON en objet JavaScript

    const jsonData = JSON.parse(fileContents);

    // Filtration des valeurs null de chaque objet en utilisant une boucle for

    filteredData = jsonData.data.map((obj) => {
      const filteredObj = {};

      for (const key in obj) {
        if (obj[key] !== null) {
          filteredObj[key] = obj[key];
        }
      }

      return filteredObj;
    });

    // Limitation du nombre d'objets retournés

    const limitedData = filteredData.slice(0, 3);

    // Sélection des données pertinentes

    const metadataData = limitedData.map((obj) => ({
      id: obj.id,

      aircraft_id: obj.aircraft_id,

      departure_city: obj.departure.name,

      arrival_city: obj.arrival.name,
    }));

    // Formatage des données en string (obligatoire pour l'import dans Stripe)

    const metadataString = JSON.stringify(metadataData);

    // Création d'un client Stripe

    const customer = await stripe.customers.create({
      // Passage des metadataString dans la propriété metadata du client Stripe

      metadata: {
        metadataString,
      },
    });

    res.status(200).json(customer);
  } catch (error) {
    res.status(500).json({ error: "Erreur lors du traitement des données" });
  }
}
