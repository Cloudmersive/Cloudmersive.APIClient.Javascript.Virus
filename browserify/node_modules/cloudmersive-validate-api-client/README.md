# cloudmersive-validate-api-client

CloudmersiveValidateApiClient - JavaScript client for cloudmersive-validate-api-client
The validation APIs help you validate data. Check if an E-mail address is real. Check if a domain is real. Check up on an IP address, and even where it is located. All this and much more is available in the validation API.
[Cloudmersive Validation API](https://www.cloudmersive.com/validate-api) provides data validation capabilities for validating email addresses, phone numbers, IP addresses, and many other types of business data.

- API version: v1
- Package version: 1.1.2


## Installation

### For [Node.js](https://nodejs.org/)

#### npm

To publish the library as a [npm](https://www.npmjs.com/),
please follow the procedure in ["Publishing npm packages"](https://docs.npmjs.com/getting-started/publishing-npm-packages).

Then install it via:

```shell
npm install cloudmersive-validate-api-client --save
```

##### Local development

To use the library locally without publishing to a remote npm registry, first install the dependencies by changing 
into the directory containing `package.json` (and this README). Let's call this `JAVASCRIPT_CLIENT_DIR`. Then run:

```shell
npm install
```

Next, [link](https://docs.npmjs.com/cli/link) it globally in npm with the following, also from `JAVASCRIPT_CLIENT_DIR`:

```shell
npm link
```

Finally, switch to the directory you want to use your cloudmersive-validate-api-client from, and run:

```shell
npm link /path/to/<JAVASCRIPT_CLIENT_DIR>
```

You should now be able to `require('cloudmersive-validate-api-client')` in javascript files from the directory you ran the last 
command above from.

#### git
#
If the library is hosted at a git repository, e.g.
https://github.com/GIT_USER_ID/GIT_REPO_ID
then install it via:

```shell
    npm install GIT_USER_ID/GIT_REPO_ID --save
```

### For browser

The library also works in the browser environment via npm and [browserify](http://browserify.org/). After following
the above steps with Node.js and installing browserify with `npm install -g browserify`,
perform the following (assuming *main.js* is your entry file, that's to say your javascript file where you actually 
use this library):

```shell
browserify main.js > bundle.js
```

Then include *bundle.js* in the HTML pages.

### Webpack Configuration

Using Webpack you may encounter the following error: "Module not found: Error:
Cannot resolve module", most certainly you should disable AMD loader. Add/merge
the following section to your webpack config:

```javascript
module: {
  rules: [
    {
      parser: {
        amd: false
      }
    }
  ]
}
```

## Getting Started

Please follow the [installation](#installation) instruction and execute the following JS code:

```javascript
var CloudmersiveValidateApiClient = require('cloudmersive-validate-api-client');

var defaultClient = CloudmersiveValidateApiClient.ApiClient.instance;

// Configure API key authorization: Apikey
var Apikey = defaultClient.authentications['Apikey'];
Apikey.apiKey = "YOUR API KEY"
// Uncomment the following line to set a prefix for the API key, e.g. "Token" (defaults to null)
//Apikey.apiKeyPrefix['Apikey'] = "Token"

var api = new CloudmersiveValidateApiClient.DomainApi()

var domain = "domain_example"; // {String} Domain name to check, for example \"cloudmersive.com\".  The input is a string so be sure to enclose it in double-quotes.


var callback = function(error, data, response) {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
};
api.domainCheck(domain, callback);

```

## Documentation for API Endpoints

All URIs are relative to *https://api.cloudmersive.com*

Class | Method | HTTP request | Description
------------ | ------------- | ------------- | -------------
*CloudmersiveValidateApiClient.DomainApi* | [**domainCheck**](docs/DomainApi.md#domainCheck) | **POST** /validate/domain/check | Validate a domain name
*CloudmersiveValidateApiClient.DomainApi* | [**domainPost**](docs/DomainApi.md#domainPost) | **POST** /validate/domain/whois | Get WHOIS information for a domain
*CloudmersiveValidateApiClient.EmailApi* | [**emailAddressGetServers**](docs/EmailApi.md#emailAddressGetServers) | **POST** /validate/email/address/servers | Partially check whether an email address is valid
*CloudmersiveValidateApiClient.EmailApi* | [**emailFullValidation**](docs/EmailApi.md#emailFullValidation) | **POST** /validate/email/address/full | Fully validate an email address
*CloudmersiveValidateApiClient.EmailApi* | [**emailPost**](docs/EmailApi.md#emailPost) | **POST** /validate/email/address/syntaxOnly | Validate email adddress for syntactic correctness only
*CloudmersiveValidateApiClient.IPAddressApi* | [**iPAddressPost**](docs/IPAddressApi.md#iPAddressPost) | **POST** /validate/ip/geolocate | Geolocate an IP address
*CloudmersiveValidateApiClient.PhoneNumberApi* | [**phoneNumberSyntaxOnly**](docs/PhoneNumberApi.md#phoneNumberSyntaxOnly) | **POST** /validate/phonenumber/basic | Validate phone number (basic)
*CloudmersiveValidateApiClient.VatApi* | [**vatVatLookup**](docs/VatApi.md#vatVatLookup) | **POST** /validate/vat/lookup | Lookup a VAT code


## Documentation for Models

 - [CloudmersiveValidateApiClient.AddressGetServersResponse](docs/AddressGetServersResponse.md)
 - [CloudmersiveValidateApiClient.AddressVerifySyntaxOnlyResponse](docs/AddressVerifySyntaxOnlyResponse.md)
 - [CloudmersiveValidateApiClient.CheckResponse](docs/CheckResponse.md)
 - [CloudmersiveValidateApiClient.FullEmailValidationResponse](docs/FullEmailValidationResponse.md)
 - [CloudmersiveValidateApiClient.GeolocateResponse](docs/GeolocateResponse.md)
 - [CloudmersiveValidateApiClient.PhoneNumberValidateRequest](docs/PhoneNumberValidateRequest.md)
 - [CloudmersiveValidateApiClient.PhoneNumberValidationResponse](docs/PhoneNumberValidationResponse.md)
 - [CloudmersiveValidateApiClient.VatLookupRequest](docs/VatLookupRequest.md)
 - [CloudmersiveValidateApiClient.VatLookupResponse](docs/VatLookupResponse.md)
 - [CloudmersiveValidateApiClient.WhoisResponse](docs/WhoisResponse.md)


## Documentation for Authorization


### Apikey

- **Type**: API key
- **API key parameter name**: Apikey
- **Location**: HTTP header

