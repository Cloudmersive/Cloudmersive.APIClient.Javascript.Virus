# CloudmersiveValidateApiClient.PhoneNumberApi

All URIs are relative to *https://api.cloudmersive.com*

Method | HTTP request | Description
------------- | ------------- | -------------
[**phoneNumberSyntaxOnly**](PhoneNumberApi.md#phoneNumberSyntaxOnly) | **POST** /validate/phonenumber/basic | Validate phone number (basic)


<a name="phoneNumberSyntaxOnly"></a>
# **phoneNumberSyntaxOnly**
> PhoneNumberValidationResponse phoneNumberSyntaxOnly(value)

Validate phone number (basic)

Validate a phone number by analyzing the syntax

### Example
```javascript
var CloudmersiveValidateApiClient = require('cloudmersive-validate-api-client');
var defaultClient = CloudmersiveValidateApiClient.ApiClient.instance;

// Configure API key authorization: Apikey
var Apikey = defaultClient.authentications['Apikey'];
Apikey.apiKey = 'YOUR API KEY';
// Uncomment the following line to set a prefix for the API key, e.g. "Token" (defaults to null)
//Apikey.apiKeyPrefix = 'Token';

var apiInstance = new CloudmersiveValidateApiClient.PhoneNumberApi();

var value = new CloudmersiveValidateApiClient.PhoneNumberValidateRequest(); // PhoneNumberValidateRequest | Phone number to validate in a PhoneNumberValidateRequest object.  Try a phone number such as \"1.800.463.3339\", and either leave DefaultCountryCode blank or use \"US\".


var callback = function(error, data, response) {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
};
apiInstance.phoneNumberSyntaxOnly(value, callback);
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **value** | [**PhoneNumberValidateRequest**](PhoneNumberValidateRequest.md)| Phone number to validate in a PhoneNumberValidateRequest object.  Try a phone number such as \&quot;1.800.463.3339\&quot;, and either leave DefaultCountryCode blank or use \&quot;US\&quot;. | 

### Return type

[**PhoneNumberValidationResponse**](PhoneNumberValidationResponse.md)

### Authorization

[Apikey](../README.md#Apikey)

### HTTP request headers

 - **Content-Type**: application/json, text/json, application/xml, text/xml, application/x-www-form-urlencoded
 - **Accept**: application/json, text/json, application/xml, text/xml

