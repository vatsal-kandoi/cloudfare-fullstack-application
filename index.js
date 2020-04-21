addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})
/**
 * Respond with hello worker text
 * @param {Request} request
 */
async function handleRequest(request) {
  let cookie = request.headers.get('cookie');
  if (cookie && cookie.includes(`Biscuit=1`)) {
    let results = await getVariants();

    if (results.variants == undefined) {
      return new Response(`Error fetching data from the URL`, {
        headers: { 'content-type': 'text/plain', status: 500 },
      })
    }

    let responseFromUrl = await getResponseFromUrl(results.variants, 1);
    
    return new Response(responseFromUrl.result, {
      headers: { 'content-type': responseFromUrl.contentType, status: 200 },
    })
  } else if (cookie && cookie.includes(`Biscuit=0`)) {
    let results = await getVariants();

    if (results.variants == undefined) {
      return new Response(`Error fetching data from the URL`, {
        headers: { 'content-type': 'text/plain', status: 500 },
      })
    }

    let responseFromUrl = await getResponseFromUrl(results.variants, 0);
    
    return new Response(responseFromUrl.result, {
      headers: { 'content-type': responseFromUrl.contentType, status: 200 },
    })
  } else {
    let results = await getVariants();

    if (results.variants == undefined) {
      return new Response(`Error fetching data from the URL`, {
        headers: { 'content-type': 'text/plain', status: 500 },
      })
    }

    let responseFromUrl = await getResponseFromUrl(results.variants, undefined);
    
    
    let response = new Response(responseFromUrl.result, {
      headers: { 'content-type': responseFromUrl.contentType, status: 200 },
    })
    response.headers.append('Set-Cookie', `Biscuit=${responseFromUrl.choice}; path=/`)
    return response;
  }
}

/**
 * Getting variants 
 */
async function getVariants() {
  let response = await fetch(`https://cfw-takehome.developers.workers.dev/api/variants`);
  let results = await decodeResponse(response);
  return results.result;
}
/**
 * Returns parsed data fetched from list obtained from /api/variants
 * @param {URL List from API} urlList
 * @param {URL number} num
 */
async function getResponseFromUrl(urlList, num) {
  let choice;
  if (num == undefined) {
    choice = Math.round(Math.random());
  } else {
    choice = num;
  }
  let response;
 
  if (choice == 0) {
    response = await getModifiedData(urlList[0]);
  } else {
    response = await getModifiedData(urlList[1]);
  }

  response = await decodeResponse(response);
  return {
    choice,
    ...response,
  };
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

/** Rewriting url href and content */
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