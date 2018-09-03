# CloudmersiveBarcodeapiClient.BarcodeLookupApi

All URIs are relative to *https://api.cloudmersive.com*

Method | HTTP request | Description
------------- | ------------- | -------------
[**barcodeLookupEanLookup**](BarcodeLookupApi.md#barcodeLookupEanLookup) | **POST** /barcode/lookup/ean | Lookup a barcode value and return product data


<a name="barcodeLookupEanLookup"></a>
# **barcodeLookupEanLookup**
> BarcodeLookupResponse barcodeLookupEanLookup(value)

Lookup a barcode value and return product data

### Example
```javascript
var CloudmersiveBarcodeapiClient = require('cloudmersive-barcodeapi-client');
var defaultClient = CloudmersiveBarcodeapiClient.ApiClient.instance;

// Configure API key authorization: Apikey
var Apikey = defaultClient.authentications['Apikey'];
Apikey.apiKey = 'YOUR API KEY';
// Uncomment the following line to set a prefix for the API key, e.g. "Token" (defaults to null)
//Apikey.apiKeyPrefix = 'Token';

var apiInstance = new CloudmersiveBarcodeapiClient.BarcodeLookupApi();

var value = "value_example"; // String | Barcode value


var callback = function(error, data, response) {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
};
apiInstance.barcodeLookupEanLookup(value, callback);
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **value** | **String**| Barcode value | 

### Return type

[**BarcodeLookupResponse**](BarcodeLookupResponse.md)

### Authorization

[Apikey](../README.md#Apikey)

### HTTP request headers

 - **Content-Type**: application/json, text/json, application/xml, text/xml, application/x-www-form-urlencoded
 - **Accept**: application/json, text/json, application/xml, text/xml

