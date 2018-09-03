# CloudmersiveValidateApiClient.VatApi

All URIs are relative to *https://api.cloudmersive.com*

Method | HTTP request | Description
------------- | ------------- | -------------
[**vatVatLookup**](VatApi.md#vatVatLookup) | **POST** /validate/vat/lookup | Lookup a VAT code


<a name="vatVatLookup"></a>
# **vatVatLookup**
> VatLookupResponse vatVatLookup(input)

Lookup a VAT code

Checks if a VAT code is valid, and if it is, returns more information about it

### Example
```javascript
var CloudmersiveValidateApiClient = require('cloudmersive-validate-api-client');
var defaultClient = CloudmersiveValidateApiClient.ApiClient.instance;

// Configure API key authorization: Apikey
var Apikey = defaultClient.authentications['Apikey'];
Apikey.apiKey = 'YOUR API KEY';
// Uncomment the following line to set a prefix for the API key, e.g. "Token" (defaults to null)
//Apikey.apiKeyPrefix = 'Token';

var apiInstance = new CloudmersiveValidateApiClient.VatApi();

var input = new CloudmersiveValidateApiClient.VatLookupRequest(); // VatLookupRequest | Input VAT code


var callback = function(error, data, response) {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
};
apiInstance.vatVatLookup(input, callback);
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **input** | [**VatLookupRequest**](VatLookupRequest.md)| Input VAT code | 

### Return type

[**VatLookupResponse**](VatLookupResponse.md)

### Authorization

[Apikey](../README.md#Apikey)

### HTTP request headers

 - **Content-Type**: application/json, text/json, application/xml, text/xml, application/x-www-form-urlencoded
 - **Accept**: application/json, text/json, application/xml, text/xml

