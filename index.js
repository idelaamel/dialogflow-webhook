// const express = require('express');
// const bodyParser = require('body-parser');
// const axios = require('axios');

// const app = express();
// app.use(bodyParser.json());

// app.post('/webhook', async (req, res) => {
//   try {
//     // --- 1. Extract parameters from Dialogflow request ---
//     const parameters = req.body.queryResult?.parameters;
//     const city = parameters?.['geo-city'];
//     // Extract the new attraction type parameter.
//     // Make sure your Dialogflow entity/parameter is named 'AttractionType'.
//     const attractionType = parameters?.['typeAttraction'];

//     // Check if a city was provided
//     if (!city) {
//       return res.json({
//         fulfillmentText: "Désolé, je n'ai pas pu trouver la ville dans votre demande.",
//         fulfillmentMessages: [{ text: { text: ["Désolé, je n'ai pas pu trouver la ville dans votre demande."] } }],
//       });
//     }

//     // --- 2. Dynamically select the API endpoint ---
//     const baseUrl = 'https://touristeproject.onrender.com';
//     let apiUrl;

//     // Map the attraction types from Dialogflow to your API endpoints
//     const attractionEndpoints = {
//       'Natural': `${baseUrl}/api/public/NaturalAttractions`,
//       'Historical': `${baseUrl}/api/public/HistoricalAttractions`,
//       'Cultural': `${baseUrl}/api/public/CulturalAttractions`,
//       'Artificial': `${baseUrl}/api/public/ArtificialAttractions`,
//     };

//     // If a valid attractionType is provided, use the specific endpoint.
//     // Otherwise, fall back to the general endpoint.
//     if (attractionType && attractionEndpoints[attractionType]) {
//       apiUrl = attractionEndpoints[attractionType];
//       console.log(`Fetching specific attraction type: ${attractionType}`);
//     } else {
//       apiUrl = `${baseUrl}/api/public/getAll/Attraction`;
//       console.log('Fetching all attraction types.');
//     }

//     // --- 3. Fetch attractions from the selected backend endpoint ---
//     console.log(`Making API call to: ${apiUrl}`);
//     const response = await axios.get(apiUrl);

//     // --- 4. Filter attractions by city (same as before) ---
//     const attractions = response.data.filter(
//       (attraction) =>
//         attraction.cityName &&
//         attraction.cityName.toLowerCase() === city.toLowerCase()
//     );

//     if (!attractions || attractions.length === 0) {
//       const message = attractionType
//         ? `Désolé, je n'ai trouvé aucune attraction de type ${attractionType} à ${city}.`
//         : `Désolé, je n'ai trouvé aucune attraction à ${city}.`;
//       return res.json({
//         fulfillmentText: message,
//         fulfillmentMessages: [{ text: { text: [message] } }],
//       });
//     }

//     // --- 5. Format response with structured data (same as before) ---
//     const attractionList = attractions.map((attraction) => ({
//         id_Location: attraction.id,
//         name: attraction.name,
//         description: attraction.description || 'Aucune description disponible',
//         imageUrls: attraction.imageUrls || [],
//         entryFee: attraction.entryFre || 0,
//         guideToursAvailable: attraction.guideToursAvailable || false,
//         latitude: attraction.latitude || 0,
//         longitude: attraction.longitude || 0,
//         cityName: attraction.cityName || 'Inconnu',
//         countryName: attraction.countryName || 'Inconnu',
//     }));

//     const textResponse = `J'ai trouvé ${attractions.length} attraction(s) ${attractionType ? `de type ${attractionType}` : ''} à ${city}.`;

//     // --- 6. Respond to Dialogflow (same as before) ---
//     res.json({
//       intent: "findAttractions",
//       city: city,
//       fulfillmentText: textResponse,
//       fulfillmentMessages: [
//         { text: { text: [textResponse] } },
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
//     console.error('Error in webhook:', error.message);
//     res.json({
//       fulfillmentText: "Désolé, une erreur s'est produite lors de la récupération des données d'attraction.",
//       fulfillmentMessages: [{ text: { text: ["Désolé, une erreur s'est produite lors de la récupération des données d'attraction."] } }],
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

// A helper function to handle errors and send a response
const sendErrorResponse = (res, message = "Désolé, une erreur s'est produite.") => {
  res.json({
    fulfillmentText: message,
    fulfillmentMessages: [{ text: { text: [message] } }],
  });
};

app.post('/webhook', async (req, res) => {
  try {
    const intentName = req.body.queryResult?.intent?.displayName;
    const parameters = req.body.queryResult?.parameters;
    const city = parameters?.['geo-city'];

    if (!city) {
      return sendErrorResponse(res, "Désolé, je n'ai pas pu trouver la ville dans votre demande.");
    }

    // --- Intent Router ---
    if (intentName === 'findAttractions') {
      await handleFindAttractions(res, city, parameters);
    } else if (intentName === 'findHotels') {
      await handleFindHotels(res, city, parameters);
    } else {
      sendErrorResponse(res, "Désolé, je ne comprends pas cette demande.");
    }

  } catch (error) {
    console.error('Error in webhook:', error.message);
    sendErrorResponse(res, "Désolé, une erreur technique est survenue.");
  }
});

// =============================================
//  Logic for Finding Attractions (Unchanged)
// =============================================
const handleFindAttractions = async (res, city, parameters) => {
    // This function remains the same as before
    const attractionType = parameters?.['typeAttraction'];
    const baseUrl = 'https://touristeproject.onrender.com';
    let apiUrl;

    const attractionEndpoints = {
        'Natural': `${baseUrl}/api/public/NaturalAttractions`,
        'Historical': `${baseUrl}/api/public/HistoricalAttractions`,
        'Cultural': `${baseUrl}/api/public/CulturalAttractions`,
        'Artificial': `${baseUrl}/api/public/ArtificialAttractions`,
    };

    if (attractionType && attractionEndpoints[attractionType]) {
        apiUrl = attractionEndpoints[attractionType];
    } else {
        apiUrl = `${baseUrl}/api/public/getAll/Attraction`;
    }

    const response = await axios.get(apiUrl);
    const attractions = response.data.filter(
        (attraction) => attraction.cityName && attraction.cityName.toLowerCase() === city.toLowerCase()
    );

    if (!attractions || attractions.length === 0) {
        const message = attractionType
            ? `Désolé, je n'ai trouvé aucune attraction de type ${attractionType} à ${city}.`
            : `Désolé, je n'ai trouvé aucune attraction à ${city}.`;
        return sendErrorResponse(res, message);
    }

    const attractionList = attractions.map((attraction) => ({
        id_Location: attraction.id, name: attraction.name, description: attraction.description || 'Aucune description disponible', imageUrls: attraction.imageUrls || [], entryFee: attraction.entryFre || 0, guideToursAvailable: attraction.guideToursAvailable || false, latitude: attraction.latitude || 0, longitude: attraction.longitude || 0, cityName: attraction.cityName || 'Inconnu', countryName: attraction.countryName || 'Inconnu',
    }));

    const textResponse = `J'ai trouvé ${attractions.length} attraction(s) ${attractionType ? `de type ${attractionType}` : ''} à ${city}.`;

    res.json({
        intent: "findAttractions", city: city, fulfillmentText: textResponse,
        fulfillmentMessages: [
            { text: { text: [textResponse] } },
            { payload: { attractions: attractionList, city: city, count: attractions.length } },
        ],
    });
};


// =============================================
//  Logic for Finding Hotels (UPDATED)
// =============================================
const handleFindHotels = async (res, city, parameters) => {
  const baseUrl = 'https://touristeproject.onrender.com/api/public';
  
  // Define all accommodation endpoints
  const endpoints = {
    hotels: `${baseUrl}/Hotels`,
    lodges: `${baseUrl}/Lodges`,
    guestHouses: `${baseUrl}/GuestHouses`,
  };

  // Helper to fetch data safely, returning an empty array on error
  const safeFetch = (url) => axios.get(url).catch(error => {
    console.error(`Failed to fetch from ${url}:`, error.message);
    return { data: [] }; // Return an empty array on failure
  });
  
  // Fetch all accommodation types in parallel
  console.log('Fetching all accommodation types...');
  const [hotelRes, lodgeRes, guestHouseRes] = await Promise.all([
    safeFetch(endpoints.hotels),
    safeFetch(endpoints.lodges),
    safeFetch(endpoints.guestHouses)
  ]);

  // Combine all results into a single array
  const allAccommodations = [
    ...(hotelRes.data || []),
    ...(lodgeRes.data || []),
    ...(guestHouseRes.data || [])
  ];

  // Filter the combined list by the specified city
  const cityAccommodations = allAccommodations.filter(
    (item) => item.cityName && item.cityName.toLowerCase() === city.toLowerCase()
  );

  if (!cityAccommodations || cityAccommodations.length === 0) {
    return sendErrorResponse(res, `Désolé, je n'ai trouvé aucun hébergement (hôtel, lodge, ou maison d'hôtes) à ${city}.`);
  }

  // Standardize the data format for the app
  const accommodationList = cityAccommodations.map((item) => {
    const baseData = {
      id: item.id_Location,
      name: item.name,
      description: item.description || 'Aucune description disponible',
      imageUrls: item.imageUrls || [],
      price: item.price || 0,
      available: item.available,
      latitude: item.latitude,
      longitude: item.longitude,
      cityName: item.cityName,
    };

    // Add specific details based on accommodation type
    if ('numberStars' in item) { // It's a Hotel
      return {
        ...baseData,
        type: 'Hotel',
        details: {
          stars: item.numberStars,
          rooms: item.numberOfRooms,
          pool: item.hasSwimmingPool,
        },
      };
    }
    if ('viewPanoramic' in item) { // It's a Lodge
      return {
        ...baseData,
        type: 'Lodge',
        details: {
          panoramicView: item.viewPanoramic,
          closeToNature: item.closeNature,
        },
      };
    }
    if ('breakfastIncluded' in item) { // It's a GuestHouse
      return {
        ...baseData,
        type: 'GuestHouse',
        details: {
          rooms: item.numberRooms,
          breakfast: item.breakfastIncluded,
        },
      };
    }
    return null; // Should not happen if data is consistent
  }).filter(Boolean); // Remove any null entries

  const textResponse = `J'ai trouvé ${accommodationList.length} hébergement(s) à ${city}.`;
  
  res.json({
    intent: "findHotels",
    city: city,
    fulfillmentText: textResponse,
    fulfillmentMessages: [
      { text: { text: [textResponse] } },
      { payload: { accommodations: accommodationList, city: city, count: accommodationList.length } },
    ],
  });
};


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Dialogflow webhook server listening on port ${PORT}`);
});