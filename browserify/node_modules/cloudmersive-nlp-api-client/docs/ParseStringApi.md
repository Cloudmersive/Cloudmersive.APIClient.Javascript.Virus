# CloudmersiveNlpApiClient.ParseStringApi

All URIs are relative to *https://api.cloudmersive.com*

Method | HTTP request | Description
------------- | ------------- | -------------
[**parseStringPost**](ParseStringApi.md#parseStringPost) | **POST** /nlp/ParseString | Parse string to syntax tree


<a name="parseStringPost"></a>
# **parseStringPost**
> &#39;String&#39; parseStringPost(input)

Parse string to syntax tree

Parses the input string into a Penn Treebank syntax tree

### Example
```javascript
var CloudmersiveNlpApiClient = require('cloudmersive-nlp-api-client');
var defaultClient = CloudmersiveNlpApiClient.ApiClient.instance;

// Configure API key authorization: Apikey
var Apikey = defaultClient.authentications['Apikey'];
Apikey.apiKey = 'YOUR API KEY';
// Uncomment the following line to set a prefix for the API key, e.g. "Token" (defaults to null)
//Apikey.apiKeyPrefix = 'Token';

var apiInstance = new CloudmersiveNlpApiClient.ParseStringApi();

var input = "input_example"; // String | Input string


var callback = function(error, data, response) {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
};
apiInstance.parseStringPost(input, callback);
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **input** | **String**| Input string | 

### Return type

**&#39;String&#39;**

### Authorization

[Apikey](../README.md#Apikey)

### HTTP request headers

 - **Content-Type**: application/json, text/json, application/xml, text/xml, application/x-www-form-urlencoded
 - **Accept**: application/json, text/json, application/xml, text/xml

