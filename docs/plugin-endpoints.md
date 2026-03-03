# Plugin Endpoints

The following endpoints allow third-party access to SynBioHub plugins. Plugins extend SynBioHub's functionality with custom rendering, download, and submission capabilities.

Each plugin must implement three endpoints: `status`, `evaluate`, and `run`. SynBioHub dispatches requests to registered plugins through its internal plugin controller.

## Plugin Status

`GET <SynBioHub URL>/status?name=<name>`

Checks if a plugin is operational. SynBioHub polls this endpoint to verify the plugin is up.

```plaintext
curl -X GET -H "Accept: text/plain" "<SynBioHub URL>/status?name=<name>"
```

```python
import requests

response = requests.get(
    '<SynBioHub URL>/status',
    params={
        'name': '<name>'
    },
    headers={
        'Accept': 'text/plain'
    },
)

print(response.status_code)
print(response.content)
```

```javascript
const fetch = require("node-fetch");
const url = '<SynBioHub URL>/status?name=<name>';
const headers = {
    "Accept": "text/plain"
};

fetch(url, { method: 'GET', headers: headers })
    .then(res => res.text())
    .then(body => console.log(body))
    .catch(error => console.log(error));
```

Parameter | Description
--------- | -----------
name | The name or URL of the target plugin.

### Response

Status | Description
------ | -----------
200 | Plugin is running. Returns the message "The Plugin is Up and Running".
400 | Bad Request. Unable to connect to the plugin server.
404 | Plugin not found.

## Evaluate Plugin

`POST <SynBioHub URL>/evaluate?name=<name>&data=<data>`

Determines if a plugin can handle the incoming request. SynBioHub sends the JSON payload as-is from its internal data object. The shape of the payload varies by plugin category (rendering, download, submit).

```plaintext
curl -X POST -H "Accept: text/plain" -H "Content-Type: application/json" "<SynBioHub URL>/evaluate?name=<name>&data=<url-encoded-json>"
```

```python
import requests
import json

data = json.dumps({
    'type': '<rdf_type>',
    'url': '<object_url>'
})

response = requests.post(
    '<SynBioHub URL>/evaluate',
    params={
        'name': '<name>',
        'data': data
    },
    headers={
        'Accept': 'text/plain'
    },
)

print(response.status_code)
print(response.content)
```

```javascript
const fetch = require("node-fetch");
const data = JSON.stringify({
    type: '<rdf_type>',
    url: '<object_url>'
});
const url = `<SynBioHub URL>/evaluate?name=<name>&data=${encodeURIComponent(data)}`;
const headers = {
    "Accept": "text/plain"
};

fetch(url, { method: 'POST', headers: headers })
    .then(res => res.text())
    .then(body => console.log(body))
    .catch(error => console.log(error));
```

Parameter | Description
--------- | -----------
name | The name or URL of the target plugin.
data | URL-encoded JSON payload to send to the plugin for evaluation.

### Evaluate Request Body (JSON)

The data parameter should be a URL-encoded JSON object. Its shape varies by plugin category:

Field | Description
----- | -----------
type | RDF type of the object.
url | Object URL in SynBioHub.
filename | File name for submission workflows.

Additional properties may be included depending on the plugin category.

### Response

Status | Description
------ | -----------
200 | Plugin can handle the request. Returns text/plain for rendering/download plugins or application/json for submit plugins.
400 | Bad Request. Error communicating with the plugin.
404 | Plugin not found.

## Run Plugin

`POST <SynBioHub URL>/run?name=<name>&data=<data>`

Executes the plugin logic. SynBioHub sends the JSON payload to the plugin's run endpoint. The dispatcher enriches URI-based inputs with generated links for SBOL, GenBank, and other formats.

```plaintext
curl -X POST -H "Accept: text/plain" "<SynBioHub URL>/run?name=<name>&data=<url-encoded-json>"
```

```python
import requests
import json

data = json.dumps({
    'url': '<object_url>',
    'complete_sbol': '<complete_sbol_url>',
    'shallow_sbol': '<shallow_sbol_url>',
    'genbank': '<genbank_url>',
    'top_level': '<top_level_id>',
    'params': {}
})

response = requests.post(
    '<SynBioHub URL>/run',
    params={
        'name': '<name>',
        'data': data
    },
    headers={
        'Accept': 'text/plain'
    },
)

print(response.status_code)
print(response.content)
```

```javascript
const fetch = require("node-fetch");
const data = JSON.stringify({
    url: '<object_url>',
    complete_sbol: '<complete_sbol_url>',
    shallow_sbol: '<shallow_sbol_url>',
    genbank: '<genbank_url>',
    top_level: '<top_level_id>',
    params: {}
});
const url = `<SynBioHub URL>/run?name=<name>&data=${encodeURIComponent(data)}`;
const headers = {
    "Accept": "text/plain"
};

fetch(url, { method: 'POST', headers: headers })
    .then(res => res.text())
    .then(body => console.log(body))
    .catch(error => console.log(error));
```

Parameter | Description
--------- | -----------
name | The name or URL of the target plugin.
data | URL-encoded JSON payload to send to the plugin for execution.

### Run Request Body (JSON)

The data parameter should be a URL-encoded JSON object with the following fields:

Field | Description
----- | -----------
url | Object URL in SynBioHub.
complete_sbol | URL to fetch complete SBOL.
shallow_sbol | URL to fetch non-recursive SBOL.
genbank | URL to fetch GenBank representation.
top_level | Top-level object identifier.
params | Additional plugin parameters (object).

### Response

The response content type depends on the plugin category:

Category | Content-Type | Description
-------- | ------------ | -----------
visual | text/html | HTML content for rendering in the browser.
submit | application/zip | ZIP archive of processed submission data.
download | application/octet-stream | Binary file download.

Status | Description
------ | -----------
200 | Plugin execution successful.
400 | Bad Request. Error communicating with the plugin or decoding data.
404 | Plugin not found.

## Call Plugin (Generic)

`POST <SynBioHub URL>/call?name=<name>&endpoint=<endpoint>&data=<data>&token=<token>`

A generic routing endpoint that dispatches to the appropriate plugin endpoint (status, evaluate, or run) based on the endpoint parameter.

```plaintext
curl -X POST "<SynBioHub URL>/call?name=<name>&endpoint=<endpoint>&data=<url-encoded-json>"
```

```python
import requests

response = requests.post(
    '<SynBioHub URL>/call',
    params={
        'name': '<name>',
        'endpoint': '<endpoint>',
        'data': '<data>'
    },
    headers={
        'Accept': 'text/plain'
    },
)

print(response.status_code)
print(response.content)
```

```javascript
const fetch = require("node-fetch");
const url = '<SynBioHub URL>/call?name=<name>&endpoint=<endpoint>&data=<data>';
const headers = {
    "Accept": "text/plain"
};

fetch(url, { method: 'POST', headers: headers })
    .then(res => res.text())
    .then(body => console.log(body))
    .catch(error => console.log(error));
```

Parameter | Description
--------- | -----------
name | The name or URL of the target plugin.
endpoint | The plugin endpoint to call: `status`, `evaluate`, or `run`.
data | URL-encoded JSON payload (optional, used by evaluate and run).
token | Authentication token (optional).

### Response

Status | Description
------ | -----------
200 | Successful response from the dispatched endpoint.
400 | Bad Request. Invalid endpoint or plugin error.
