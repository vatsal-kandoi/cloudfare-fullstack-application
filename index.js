addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})
/**
 * Respond with hello worker text
 * @param {Request} request
 */
async function handleRequest(request) {
  let response = await fetch(`https://cfw-takehome.developers.workers.dev/api/variants`);
  let results = await decodeResponse(response);
  results = results.result;

  if (results.variants == undefined) {
    return new Response(`Error fetching data from the URL`, {
      headers: { 'content-type': 'text/plain', status: 500 },
    })
  }

  let responseFromUrl = await getResponseFromUrl(results.variants)
  
  return new Response(responseFromUrl.result, {
    headers: { 'content-type': responseFromUrl.contentType, status: 200 },
  })
}

/**
 * Returns parsed data fetched from list obtained from /api/variants
 * @param {URL List from API} urlList
 */
async function getResponseFromUrl(urlList) {
  /** Randomising between 2 variables */
  let choice = Math.round(Math.random());
  let response;
 
  if (choice == 0) {
    response = await getModifiedData(urlList[0]);
  } else {
    response = await getModifiedData(urlList[1]);
  }

  response = await decodeResponse(response);
  return response;
}

/** Get modified data from URL obtained in the list (Task 2) 
 *  @param {URL obtained from variants} url
 */
async function getModifiedData(url) {
  let response = await fetch(url)
  
  let { headers } = response;  
  let contentType = headers.get('content-type');
  
  if (contentType.includes('text/html')) {
    return rewriter.transform(response);
  }

  return response;
}

/**
 * Returns parsed data along with data type fetched from /api/variants
 * @param {Fetch Response} response
 */
async function decodeResponse(response) {
  let { headers } = response;
  let contentType = headers.get('content-type');

  let result;
  if (contentType.includes('application/json')) {
    result = await response.json();
    return {
      contentType: 'application/json',
      result,
    };
  }
  else if (contentType.includes('text/html')) {
    result = await response.text();
    return {
      contentType: 'text/html',
      result,
    };
  }
  else {
    result = await response.text();
    return {
      contentType: 'text/plain',
      result,
    };
  }
}

let rewriter = new HTMLRewriter()
  .on('a#url', {
    element(element) {
      let attribute = element.getAttribute('href')
      if (attribute) {
        element.setAttribute(
          'href',
          attribute.replace('https://cloudflare.com', 'https://www.vatsalkandoi.tech'),
        )
      }
      element.setInnerContent(`<p>Check out my portfolio</p>`,{ html: true });
    },
  })