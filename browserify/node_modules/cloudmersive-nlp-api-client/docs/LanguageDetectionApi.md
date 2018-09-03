# CloudmersiveNlpApiClient.LanguageDetectionApi

All URIs are relative to *https://api.cloudmersive.com*

Method | HTTP request | Description
------------- | ------------- | -------------
[**languageDetectionPost**](LanguageDetectionApi.md#languageDetectionPost) | **POST** /nlp/language/detect | Detect language of text


<a name="languageDetectionPost"></a>
# **languageDetectionPost**
> LanguageDetectionResponse languageDetectionPost(textToDetect)

Detect language of text

Automatically determine which language a text string is written in.  Supports Danish (DAN), German (DEU), English (ENG), French (FRA), Italian (ITA), Japanese (JPN), Korean (KOR), Dutch (NLD), Norwegian (NOR), Portuguese (POR), Russian (RUS), Spanish (SPA), Swedish (SWE), Chinese (ZHO).

### Example
```javascript
var CloudmersiveNlpApiClient = require('cloudmersive-nlp-api-client');
var defaultClient = CloudmersiveNlpApiClient.ApiClient.instance;

// Configure API key authorization: Apikey
var Apikey = defaultClient.authentications['Apikey'];
Apikey.apiKey = 'YOUR API KEY';
// Uncomment the following line to set a prefix for the API key, e.g. "Token" (defaults to null)
//Apikey.apiKeyPrefix = 'Token';

var apiInstance = new CloudmersiveNlpApiClient.LanguageDetectionApi();

var textToDetect = "textToDetect_example"; // String | Text to detect language of


var callback = function(error, data, response) {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
};
apiInstance.languageDetectionPost(textToDetect, callback);
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **textToDetect** | **String**| Text to detect language of | 

### Return type

[**LanguageDetectionResponse**](LanguageDetectionResponse.md)

### Authorization

[Apikey](../README.md#Apikey)

### HTTP request headers

 - **Content-Type**: application/json, text/json, application/xml, text/xml, application/x-www-form-urlencoded
 - **Accept**: application/json, text/json, application/xml, text/xml

