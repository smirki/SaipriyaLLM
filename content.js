// content.js

console.log('Content script loaded');

// Inject Tooltip CSS into the page (reusing existing 'quiz-submission' class)
(function injectTooltipCSS() {
  console.log('Injecting tooltip CSS');
  const style = document.createElement('style');
  style.innerHTML = `
    /* Tooltip Container - Reusing existing 'quiz-submission' class */
    .custom-tooltip.quiz-submission {
      position: relative;
      background-color: #C0C0C0; /* Light Grey */
      color: #000000; /* Black text */
      padding: 10px;
      border: 2px solid #808080; /* Darker Grey Border */
      border-radius: 4px;
      z-index: 10000;
      max-width: 600px;
      word-wrap: break-word;
      box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.5);
      font-family: 'Tahoma', sans-serif; /* Windows XP Default Font */
      font-size: 14px;
      margin-bottom: 10px; /* Space between original and tooltip */
    }
    /* Styling for code blocks within the tooltip */
    .custom-tooltip.quiz-submission code {
      background-color: #FFFFFF;
      color: #0000FF; /* Blue text for code */
      padding: 2px 4px;
      border-radius: 2px;
      font-family: 'Courier New', monospace;
    }
    .custom-tooltip.quiz-submission pre {
      background-color: #FFFFFF;
      color: #0000FF;
      padding: 8px;
      border-radius: 4px;
      overflow-x: auto;
      font-family: 'Courier New', monospace;
    }
    .custom-tooltip.quiz-submission strong {
      color: #000000; /* Ensuring bold text is black */
    }
    .custom-tooltip.quiz-submission ul {
      padding-left: 20px;
    }
    .custom-tooltip.quiz-submission li {
      margin-bottom: 5px;
    }
  `;
  document.head.appendChild(style);
})();

// Initialize a cache object to store API responses
const apiResponseCache = {};

// Function to handle mouseenter event
function handleMouseEnter(event) {
  console.log('Mouse entered:', event.target);
  const questionNameElement = event.target;
  const questionElement = questionNameElement.closest('.display_question');

  if (!questionElement) {
    console.log('No question element found');
    return;
  }

  const questionTextElement = questionElement.querySelector('.question_text');
  const questionText = questionTextElement ? questionTextElement.innerText.trim() : '';
  console.log('Question text:', questionText);

  const bodyElement = questionElement.querySelector('.answers');
  const bodyText = bodyElement ? bodyElement.innerText.trim() : '';
  console.log('Body text:', bodyText);

  // Use the question text and body text as the cache key
  const cacheKey = `${questionText}|${bodyText}`;

  // Check if the response is already cached
  if (apiResponseCache[cacheKey]) {
    console.log('Using cached API response');
    insertResponseBox(questionElement, apiResponseCache[cacheKey]);
    return;
  }

  const payload = {
    question: questionText,
    body: bodyText
  };

  // Send a message to the background script to get the API response
  chrome.runtime.sendMessage({ action: 'getApiResponse', payload: payload }, function (response) {
    console.log('Received response from background script:', response);

    if (response && response.apiResponse) {
      const tooltipMarkdown = response.apiResponse;
      console.log('Parsed tooltip markdown:', tooltipMarkdown);

      // Cache the API response
      apiResponseCache[cacheKey] = tooltipMarkdown;
      console.log('API response cached for key:', cacheKey);

      // Create and display the response box
      insertResponseBox(questionElement, tooltipMarkdown);
    } else {
      console.log('No API response received or response is invalid');
    }
  });
}

// Function to create and insert the response box
function insertResponseBox(questionElement, tooltipMarkdown) {
  // Check if a response box already exists to prevent duplicates
  if (questionElement.previousSibling && questionElement.previousSibling.classList && questionElement.previousSibling.classList.contains('custom-tooltip')) {
    console.log('Response box already exists');
    return;
  }

  // Convert Markdown to HTML
  const tooltipHTML = markdownToHTML(tooltipMarkdown);

  // Clone the original question element to maintain the structure
  const responseBox = questionElement.cloneNode(true);
  responseBox.classList.add('custom-tooltip'); // Add custom class for additional styling if needed

  // Replace the question text with the API response
  const responseQuestionTextElement = responseBox.querySelector('.question_text');
  if (responseQuestionTextElement) {
    responseQuestionTextElement.innerHTML = tooltipHTML;
  }

  // Remove unnecessary elements (like headers, links, etc.) from the cloned box
  const headerElement = responseBox.querySelector('.header');
  if (headerElement) {
    headerElement.remove();
  }
  const linksElement = responseBox.querySelector('.links');
  if (linksElement) {
    linksElement.remove();
  }
  const hiddenElements = responseBox.querySelectorAll('div[style*="display: none"]');
  hiddenElements.forEach(elem => elem.remove());

  // Insert the response box above the current question
  questionElement.parentNode.insertBefore(responseBox, questionElement);

  console.log('Response box inserted:', responseBox);

  // Optional: Add a slight delay or animation for better UX
}

// Simple Markdown to HTML converter for basic elements
function markdownToHTML(markdown) {
  let html = markdown;

  // Convert **bold** to <strong>
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // Convert *italic* to <em>
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

  // Convert `code` to <code>
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Convert ```code blocks``` to <pre><code>
  html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');

  // Convert - or * lists to <ul><li>
  html = html.replace(/^\s*[-*]\s+(.*)$/gm, '<li>$1</li>');
  html = html.replace(/<\/li>\n<li>/g, '</li><li>');
  html = html.replace(/(<li>.*<\/li>)/g, '<ul>$1</ul>');

  return html;
}

// Add event listeners to elements with class 'question_name'
function addHoverListeners() {
  console.log('Adding hover listeners to question names');
  const questionElements = document.querySelectorAll('.question_name');
  questionElements.forEach(function (elem) {
    elem.addEventListener('mouseenter', handleMouseEnter);
    console.log('Listener added to:', elem);
  });
}

// Remove the inserted response box on mouseleave
function addLeaveListeners() {
  const questionElements = document.querySelectorAll('.question_name');
  questionElements.forEach(function (elem) {
    elem.addEventListener('mouseleave', function (event) {
      console.log('Mouse left:', event.target);
      const questionNameElement = event.target;
      const questionElement = questionNameElement.closest('.display_question');
      
      if (!questionElement) {
        console.log('No question element found');
        return;
      }

      // Find the previous sibling which is the response box
      const responseBox = questionElement.previousSibling;
      if (responseBox && responseBox.classList && responseBox.classList.contains('custom-tooltip')) {
        responseBox.remove();
        console.log('Response box removed');
      }
    });
  });
}

// Run the function to add event listeners after the DOM content is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () {
    console.log('DOM content loaded');
    addHoverListeners();
    addLeaveListeners();
  });
} else {
  console.log('Document already loaded');
  addHoverListeners();
  addLeaveListeners();
}
