# CloudmersiveNlpApiClient.ExtractEntitiesStringApi

All URIs are relative to *https://api.cloudmersive.com*

Method | HTTP request | Description
------------- | ------------- | -------------
[**extractEntitiesStringPost**](ExtractEntitiesStringApi.md#extractEntitiesStringPost) | **POST** /nlp/ExtractEntitiesString | Extract entities from string


<a name="extractEntitiesStringPost"></a>
# **extractEntitiesStringPost**
> &#39;String&#39; extractEntitiesStringPost(value)

Extract entities from string

Extract the named entitites from an input string.

### Example
```javascript
var CloudmersiveNlpApiClient = require('cloudmersive-nlp-api-client');
var defaultClient = CloudmersiveNlpApiClient.ApiClient.instance;

// Configure API key authorization: Apikey
var Apikey = defaultClient.authentications['Apikey'];
Apikey.apiKey = 'YOUR API KEY';
// Uncomment the following line to set a prefix for the API key, e.g. "Token" (defaults to null)
//Apikey.apiKeyPrefix = 'Token';

var apiInstance = new CloudmersiveNlpApiClient.ExtractEntitiesStringApi();

var value = "value_example"; // String | Input string


var callback = function(error, data, response) {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
};
apiInstance.extractEntitiesStringPost(value, callback);
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **value** | **String**| Input string | 

### Return type

**&#39;String&#39;**

### Authorization

[Apikey](../README.md#Apikey)

### HTTP request headers

 - **Content-Type**: application/json, text/json, application/xml, text/xml, application/x-www-form-urlencoded
 - **Accept**: application/json, text/json, application/xml, text/xml

