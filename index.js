// const express = require('express');
// const bodyParser = require('body-parser');
// const axios = require('axios');

// const app = express();
// app.use(bodyParser.json());

// app.post('/webhook', async (req, res) => {
//   try {
//     // Extract city from Dialogflow request
//     const city =
//       req.body.queryResult?.parameters?.['geo-city']

//     if (!city) {
//       return res.json({
//         fulfillmentText: "Sorry, I couldn't find the city in your request.",
//         fulfillmentMessages: [
//           {
//             text: {
//               text: ["Sorry, I couldn't find the city in your request."],
//             },
//           },
//         ],
//       });
//     }

//     // Fetch attractions from backend
//     const apiUrl = `https://touristeproject.onrender.com/api/public/getAll/Attraction`;
//     const response = await axios.get(apiUrl);

//     // Filter attractions by city
//     const attractions = response.data.filter(
//       (attraction) =>
//         attraction.cityName &&
//         attraction.cityName.toLowerCase() === city.toLowerCase()
//     );

//     if (!attractions || attractions.length === 0) {
//       return res.json({
//         fulfillmentText: `Sorry, I couldn't find any attractions in ${city}.`,
//         fulfillmentMessages: [
//           {
//             text: {
//               text: [`Sorry, I couldn't find any attractions in ${city}.`],
//             },
//           },
//         ],
//       });
//     }

//     // Format response with structured data
//     const attractionList = attractions.map((attraction) => ({
//         id_Location: attraction.id,
//         name: attraction.name,
//         description: attraction.description || 'No description available',
//         imageUrls: attraction.imageUrls || [],
//         entryFee: attraction.entryFre || 0,
//         guideToursAvailable: attraction.guideToursAvailable || false,
//         latitude: attraction.latitude || 0,
//         longitude: attraction.longitude || 0,
//         cityName: attraction.cityName || 'Unknown',
//         countryName: attraction.countryName || 'Unknown',
//     }));

//     const textResponse = `Found ${attractions.length} attraction(s) in ${city}`;

//     // Respond to Dialogflow with both text and structured data
//     res.json({
//       intent: "getHotels",
//       city: city,
//       fulfillmentText: textResponse,
//       fulfillmentMessages: [
//         {
//           text: {
//             text: [textResponse],
//           },
//         },
//         {
//           payload: {
//             attractions: attractionList,
//             city: city,
//             count: attractions.length,
//           },
//         },
//       ],
//     });
//   } catch (error) {
//     console.error(error);
//     res.json({
//       fulfillmentText: "Sorry, something went wrong while fetching attraction data.",
//       fulfillmentMessages: [
//         {
//           text: {
//             text: ["Sorry, something went wrong while fetching attraction data."],
//           },
//         },
//       ],
//     });
//   }
// });

// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => {
//   console.log(`Dialogflow webhook server listening on port ${PORT}`);
// });




const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());

app.post('/webhook', async (req, res) => {
  try {
    // --- 1. Extract parameters from Dialogflow request ---
    const parameters = req.body.queryResult?.parameters;
    const city = parameters?.['geo-city'];
    // Extract the new attraction type parameter.
    // Make sure your Dialogflow entity/parameter is named 'AttractionType'.
    const attractionType = parameters?.['AttractionType'];

    // Check if a city was provided
    if (!city) {
      return res.json({
        fulfillmentText: "Désolé, je n'ai pas pu trouver la ville dans votre demande.",
        fulfillmentMessages: [{ text: { text: ["Désolé, je n'ai pas pu trouver la ville dans votre demande."] } }],
      });
    }

    // --- 2. Dynamically select the API endpoint ---
    const baseUrl = 'https://touristeproject.onrender.com';
    let apiUrl;

    // Map the attraction types from Dialogflow to your API endpoints
    const attractionEndpoints = {
      'Natural': `${baseUrl}/public/NaturalAttractions`,
      'Historical': `${baseUrl}/public/HistoricalAttractions`,
      'Cultural': `${baseUrl}/public/CulturalAttractions`,
      'Artificial': `${baseUrl}/public/ArtificialAttractions`,
    };

    // If a valid attractionType is provided, use the specific endpoint.
    // Otherwise, fall back to the general endpoint.
    if (attractionType && attractionEndpoints[attractionType]) {
      apiUrl = attractionEndpoints[attractionType];
      console.log(`Fetching specific attraction type: ${attractionType}`);
    } else {
      apiUrl = `${baseUrl}/api/public/getAll/Attraction`;
      console.log('Fetching all attraction types.');
    }

    // --- 3. Fetch attractions from the selected backend endpoint ---
    console.log(`Making API call to: ${apiUrl}`);
    const response = await axios.get(apiUrl);

    // --- 4. Filter attractions by city (same as before) ---
    const attractions = response.data.filter(
      (attraction) =>
        attraction.cityName &&
        attraction.cityName.toLowerCase() === city.toLowerCase()
    );

    if (!attractions || attractions.length === 0) {
      const message = attractionType
        ? `Désolé, je n'ai trouvé aucune attraction de type ${attractionType} à ${city}.`
        : `Désolé, je n'ai trouvé aucune attraction à ${city}.`;
      return res.json({
        fulfillmentText: message,
        fulfillmentMessages: [{ text: { text: [message] } }],
      });
    }

    // --- 5. Format response with structured data (same as before) ---
    const attractionList = attractions.map((attraction) => ({
        id_Location: attraction.id,
        name: attraction.name,
        description: attraction.description || 'Aucune description disponible',
        imageUrls: attraction.imageUrls || [],
        entryFee: attraction.entryFre || 0,
        guideToursAvailable: attraction.guideToursAvailable || false,
        latitude: attraction.latitude || 0,
        longitude: attraction.longitude || 0,
        cityName: attraction.cityName || 'Inconnu',
        countryName: attraction.countryName || 'Inconnu',
    }));

    const textResponse = `J'ai trouvé ${attractions.length} attraction(s) à ${city}`;

    // --- 6. Respond to Dialogflow (same as before) ---
    res.json({
      intent: "findAttractions",
      city: city,
      fulfillmentText: textResponse,
      fulfillmentMessages: [
        { text: { text: [textResponse] } },
        {
          payload: {
            attractions: attractionList,
            city: city,
            count: attractions.length,
          },
        },
      ],
    });
  } catch (error) {
    console.error('Error in webhook:', error.message);
    res.json({
      fulfillmentText: "Désolé, une erreur s'est produite lors de la récupération des données d'attraction.",
      fulfillmentMessages: [{ text: { text: ["Désolé, une erreur s'est produite lors de la récupération des données d'attraction."] } }],
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Dialogflow webhook server listening on port ${PORT}`);
});
