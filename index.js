const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());

app.post('/webhook', async (req, res) => {
  try {
    // Extract city from Dialogflow request
    const city =
      req.body.queryResult?.parameters?.['geo-city']

    if (!city) {
      return res.json({
        fulfillmentText: "Sorry, I couldn't find the city in your request.",
        fulfillmentMessages: [
          {
            text: {
              text: ["Sorry, I couldn't find the city in your request."],
            },
          },
        ],
      });
    }

    // Fetch attractions from backend
    const apiUrl = `https://touristeproject.onrender.com/api/public/getAll/Attraction`;
    const response = await axios.get(apiUrl);

    // Filter attractions by city
    const attractions = response.data.filter(
      (attraction) =>
        attraction.cityName &&
        attraction.cityName.toLowerCase() === city.toLowerCase()
    );

    if (!attractions || attractions.length === 0) {
      return res.json({
        fulfillmentText: `Sorry, I couldn't find any attractions in ${city}.`,
        fulfillmentMessages: [
          {
            text: {
              text: [`Sorry, I couldn't find any attractions in ${city}.`],
            },
          },
        ],
      });
    }

    // Format response with structured data
    const attractionList = attractions.map((attraction) => ({
      name: attraction.name,
      city: attraction.cityName,
      description: attraction.description || 'No description available',
      // Add any other relevant fields from your attraction data
      id: attraction.id,
      location: attraction.location || null,
    }));

    const textResponse = `Found ${attractions.length} attraction(s) in ${city}`;

    // Respond to Dialogflow with both text and structured data
    res.json({
      intent: "getHotels",
      city: city,
      fulfillmentText: textResponse,
      fulfillmentMessages: [
        {
          text: {
            text: [textResponse],
          },
        },
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
    console.error(error);
    res.json({
      fulfillmentText: "Sorry, something went wrong while fetching attraction data.",
      fulfillmentMessages: [
        {
          text: {
            text: ["Sorry, something went wrong while fetching attraction data."],
          },
        },
      ],
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Dialogflow webhook server listening on port ${PORT}`);
});