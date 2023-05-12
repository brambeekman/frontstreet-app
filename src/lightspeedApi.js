import axios from 'axios';
import algoliasearch from 'algoliasearch';
import PQueue from 'p-queue';
import AsyncStorage from '@react-native-async-storage/async-storage';

const lightspeedApiUrl =
  'https://{lightspeedApiKey}:{lightspeedApiSecret}@{cluster_url}/{shop_language}/{resource}.json';

const algoliaClient = algoliasearch(
  'P415X2SN1Y',
  '2e9441dc196581a301be03dbc18a1b3f',
);
const index = algoliaClient.initIndex('dev_frontstreet');

export const getLightspeedData = async () => {
  const cacheKey = 'lightspeedData';
  let cachedData = null;

  try {
    // Try to get the cached data from AsyncStorage
    cachedData = await AsyncStorage.getItem(cacheKey);
  } catch (error) {
    console.error(error);
  }

  // If cached data is available, return it
  if (cachedData !== null) {
    console.log('Using cached data');
    return JSON.parse(cachedData);
  }

  // Otherwise, make a request to the API and cache the result
  const url = lightspeedApiUrl
    .replace('{lightspeedApiKey}', '80240b9a047b1b471e87b6d08b9c4395')
    .replace('{lightspeedApiSecret}', 'b401bf714f97466682cbacc2ed070a08')
    .replace('{cluster_url}', 'api.webshopapp.com')
    .replace('{shop_language}', 'nl')
    .replace('{resource}', 'products');

  const params = {
    limit: 250,
  };

  let offset = 0;
  let allProducts = [];

  // Create a new queue with concurrency 20
  const queue = new PQueue({concurrency: 20});

  try {
    while (true) {
      // Add the offset parameter to the params object
      params.offset = offset;

      // Add the request to the queue
      const request = queue.add(async () => {
        const response = await axios.get(url, {
          headers: {
            'Content-Type': 'application/json',
          },
          params: params,
        });

        const products = response.data.products;

        // If there are no more products, break out of the loop
        if (products.length === 0) {
          return;
        }

        // Map over the products array and format the data for Algolia
        const algoliaData = products.map(product => ({
          objectID: product.id.toString(),
          title: product.title,
        }));

        // Send the data to Algolia
        await index.saveObjects(algoliaData);

        allProducts = allProducts.concat(algoliaData);
      });

      // Wait for the request to finish
      await request;

      // Increment the offset by the limit for the next API request
      offset += params.limit;
    }
    // Cache the result
    try {
      await AsyncStorage.setItem(cacheKey, JSON.stringify(allProducts));
    } catch (error) {
      console.error(error);
    }

    return allProducts;
  } catch (error) {
    console.error(error);
  }
};
