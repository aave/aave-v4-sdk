import {
  bypass,
  getResponse,
  HttpResponse,
  http,
  type RequestHandler,
} from 'msw';

// see: https://mswjs.io/docs/graphql/mocking-responses/query-batching
export function batched(url: string, handlers: Array<RequestHandler>) {
  return http.post(url, async ({ request }) => {
    const requestClone = request.clone();
    const payload = await request.clone().json();

    // Ignore non-batched GraphQL queries.
    if (!Array.isArray(payload)) {
      return;
    }

    const responses = await Promise.all(
      payload.map(async (query) => {
        // Construct an individual query request
        // to the same URL but with an unwrapped query body.
        const queryRequest = new Request(requestClone, {
          body: JSON.stringify(query),
        });

        // Resolve the individual query request
        // against the list of request handlers you provide.
        const response = await getResponse(handlers, queryRequest);

        // Return the mocked response, if found.
        // Otherwise, perform the individual query as-is,
        // so it can be resolved against an original server.
        return response || fetch(bypass(queryRequest));
      }),
    );

    // Read the mocked response JSON bodies to use
    // in the response to the entire batched query.
    const queryData = await Promise.all(
      responses.map((response) => response?.json()),
    );

    return HttpResponse.json(queryData);
  });
}
