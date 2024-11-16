// background.js

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    console.log('Background script received message:', request);
  
    if (request.action === 'getApiResponse') {
      const apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=AIzaSyAW_NJ-Dhy0VRwO7hZDFMV8DuuI02Qi1M0';
  
      const data = {
        contents: [
          {
            parts: [
              {
                text: `${request.payload.question}\n${request.payload.body}`
              }
            ]
          }
        ]
      };
  
      console.log('Sending API request to:', apiUrl);
      console.log('Request payload:', data);
  
      fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })
        .then((response) => {
          console.log('API response status:', response.status);
          if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
          }
          return response.json();
        })
        .then((data) => {
          console.log('API response data:', data);
          
          // Parse the API response text based on the provided structure
          const apiResponse = data.candidates && data.candidates.length > 0
            ? data.candidates[0].content.parts[0].text
            : 'No response from API.';
            
          console.log('Parsed API response:', apiResponse);
          sendResponse({ apiResponse: apiResponse });
        })
        .catch((error) => {
          console.error('Error fetching API response:', error);
          sendResponse({ apiResponse: 'Error fetching API response.' });
        });
  
      // Return true to indicate that the response will be sent asynchronously
      return true;
    } else {
      console.log('Unknown action:', request.action);
    }
  });
  